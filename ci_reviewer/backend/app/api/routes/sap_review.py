"""
SAP Review Routes
"""

import os
import json
import logging
import traceback
from datetime import datetime
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse, FileResponse

from app.api.models.sap_models import (
    ReviewSubmissionModel, 
    ReviewStatusModel,
    TenantModel
)
from app.api.services.job_manager import job_manager
from app.services.sap_tools import SAPConnection
from app.services.sap_integration_reviewer import direct_review_packages

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post('/review')
async def submit_review(
    review_request: ReviewSubmissionModel, 
    background_tasks: BackgroundTasks
):
    """Submit an integration package for review"""
    
    data = review_request.model_dump()
    
    logger.info(f"Review submission received:")
    logger.info(f"- Tenant: {data.get('tenant')}")
    logger.info(f"- Packages: {data.get('packages')}")
    logger.info(f"- IFlow Selections: {json.dumps(data.get('iflowSelections', {}), indent=2)}")
    logger.info(f"- Guideline: {data.get('guideline')}")
    logger.info(f"- Model: {data.get('model')}")
    
    # Validate the tenant data
    tenant_data = data.get('tenant_data', {})
    missing_fields = []
    for field in ['authUrl', 'apiUrl', 'clientId', 'clientSecret']:
        if not tenant_data.get(field):
            missing_fields.append(field)
    
    if missing_fields:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required tenant data fields: {', '.join(missing_fields)}"
        )
    
    # Validate packages
    packages = data.get('packages', [])
    if not packages:
        raise HTTPException(
            status_code=400,
            detail="No packages specified for review"
        )
    
    # Create job
    job_id = job_manager.create_job(data)
    
    # Add initial log
    job_manager.add_log(job_id, "Job submitted", "info")
    
    logger.info(f"Starting background task for job {job_id}")
    background_tasks.add_task(run_review_job, job_id, data)
    
    return {
        "jobId": job_id,
        "status": "pending",
        "message": "Review job submitted successfully"
    }


def run_review_job(job_id: str, review_params: dict):
    """Run a review job in the background"""
    
    logger.info(f"Starting review job {job_id}")
    
    try:
        # Update job status
        job_manager.update_job(job_id, status="running")
        job_manager.add_log(job_id, "Starting review process", "info")
        
        # Get parameters
        tenant_data = review_params.get('tenant_data', {})
        packages = review_params.get('packages', [])
        iflow_selections = review_params.get('iflowSelections', {})
        guideline = review_params.get('guideline', 'basic')
        model = review_params.get('model', 'default')
        
        if not packages:
            raise ValueError("No packages specified for review")
        
        # Set up environment variables for SAP tools
        os.environ["SAP_AUTH_URL"] = tenant_data.get('authUrl', '')
        os.environ["SAP_CLIENT_ID"] = tenant_data.get('clientId', '')
        os.environ["SAP_CLIENT_SECRET"] = tenant_data.get('clientSecret', '')
        os.environ["SAP_INTEGRATION_URL"] = tenant_data.get('apiUrl', '')
        
        # Create SAP connection
        sap_conn = SAPConnection(
            base_url=tenant_data.get('apiUrl', ''),
            auth_url=tenant_data.get('authUrl', ''),
            client_id=tenant_data.get('clientId', ''),
            client_secret=tenant_data.get('clientSecret', '')
        )
        
        # Prepare specific_iflows parameter
        specific_iflows_dict = {}
        if iflow_selections:
            for pkg_id, selection in iflow_selections.items():
                if selection == "all" or (isinstance(selection, list) and "all" in selection):
                    specific_iflows_dict[pkg_id] = "all"
                else:
                    specific_iflows_dict[pkg_id] = selection
        
        # Read guideline file
        guideline_paths = [
            os.path.join("guidelines", f"{guideline}.md"),
            os.path.join("..", "guidelines", f"{guideline}.md"),
            os.path.join(os.path.dirname(os.path.abspath(__file__)), "guidelines", f"{guideline}.md"),
            os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "guidelines", f"{guideline}.md")
        ]
        
        guideline_content = None
        for path in guideline_paths:
            if os.path.exists(path):
                with open(path, 'r') as f:
                    guideline_content = f.read()
                logger.info(f"Loaded guideline from: {path}")
                break
        
        if not guideline_content:
            # Create basic guideline if not found
            logger.warning(f"Guideline '{guideline}' not found. Creating basic guideline.")
            try:
                os.makedirs("guidelines", exist_ok=True)
                basic_guideline = """# Basic SAP Integration Design Guidelines

## Error Handling
All integrations should implement proper error handling.

## Security
All integrations should follow security best practices.

## Performance
Integrations should be optimized for performance.
"""
                guideline_path = os.path.join("guidelines", f"{guideline}.md")
                with open(guideline_path, "w") as f:
                    f.write(basic_guideline)
                guideline_content = basic_guideline
                logger.info(f"Created basic guideline at: {guideline_path}")
            except Exception as e:
                logger.error(f"Error creating guideline: {str(e)}")
                raise ValueError(f"Guideline file '{guideline}' not found and could not create default")
        
        # Progress update callback function
        def update_progress(progress_data):
            if "progress" in progress_data:
                job_manager.update_job(job_id, progress=progress_data["progress"])
            if "completedIFlows" in progress_data:
                job_manager.update_job(job_id, completedIFlows=progress_data["completedIFlows"])
            if "totalIFlows" in progress_data:
                job_manager.update_job(job_id, totalIFlows=progress_data["totalIFlows"])
            if "message" in progress_data:
                job_manager.add_log(job_id, progress_data["message"], "info")
        
        # Run the review
        result_file = direct_review_packages(
            packages=packages,
            specific_iflows=specific_iflows_dict,
            guidelines=guideline_content,
            llm_provider=model,
            model_name=model,
            temperature=0.3,
            parallel=True,
            max_workers=4,
            progress_callback=update_progress,
            sap_connection=sap_conn
        )
        
        # Update job with completion information
        job_manager.update_job(
            job_id,
            status="completed",
            result_file=result_file,
            completed_at=datetime.now().isoformat(),
            progress=100
        )
        job_manager.add_log(job_id, "Review completed successfully", "info")
        
        logger.info(f"Job {job_id} completed successfully. Result: {result_file}")
        return result_file
        
    except Exception as e:
        logger.error(f"Error in review job {job_id}: {str(e)}")
        logger.error(traceback.format_exc())
        
        job_manager.update_job(
            job_id,
            status="failed",
            error=str(e),
            completed_at=datetime.now().isoformat()
        )
        job_manager.add_log(job_id, f"Error in review job: {str(e)}", "error")
        return None


@router.get('/review/{job_id}/status', response_model=ReviewStatusModel)
async def get_review_status(job_id: str):
    """Get the status of a review job"""
    
    job = job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Prepare response with standard fields
    response = {
        "jobId": job_id,
        "status": job.status,
        "progress": job.progress,
        "createdAt": job.created_at,
        "completedAt": job.completed_at,
        "completedIFlows": job.completedIFlows,
        "totalIFlows": job.totalIFlows
    }
    
    return response


@router.get('/review/{job_id}/report')
async def get_review_report(job_id: str):
    """Get the report for a completed review job"""
    
    job = job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job.status != "completed":
        raise HTTPException(status_code=400, detail="Job not completed")
    
    if not job.result_file or not os.path.exists(job.result_file):
        raise HTTPException(status_code=404, detail="Report file not found")
    
    # Read and return the report content
    try:
        with open(job.result_file, "r") as f:
            content = f.read()
        
        return {
            "jobId": job_id,
            "content": content,
            "reportPath": job.result_file,
            "generatedAt": job.completed_at
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading report: {str(e)}")


@router.get('/review/{job_id}/download')
async def download_report(job_id: str, format: str = "md"):
    """Download the report file for a completed review job"""
    
    job = job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job.status != "completed":
        raise HTTPException(status_code=400, detail="Job not completed")
    
    if not job.result_file or not os.path.exists(job.result_file):
        raise HTTPException(status_code=404, detail="Report file not found")
    
    # Return the file for download
    return FileResponse(
        path=job.result_file,
        filename=f"sap_integration_review_{job_id}.{format.lower()}",
        media_type="text/markdown" if format.lower() == "md" else "application/octet-stream"
    )


@router.get('/review/jobs')
async def list_jobs():
    """List all review jobs"""
    
    jobs = job_manager.list_jobs()
    
    # Convert to list and sort by creation time (newest first)
    job_list = []
    for job_id, job_data in jobs.items():
        job_summary = {
            "jobId": job_id,
            "status": job_data.status,
            "progress": job_data.progress,
            "createdAt": job_data.created_at,
            "completedAt": job_data.completed_at,
            "tenant": job_data.params.get("tenant", "Unknown"),
            "completedIFlows": job_data.completedIFlows,
            "totalIFlows": job_data.totalIFlows
        }
        job_list.append(job_summary)
    
    # Sort by creation time, newest first
    job_list.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    
    return job_list


@router.post('/review/{job_id}/cancel')
async def cancel_job(job_id: str):
    """Cancel a running review job"""
    
    if not job_manager.cancel_job(job_id):
        job = job_manager.get_job(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        else:
            raise HTTPException(
                status_code=400, 
                detail="Job cannot be cancelled - not in pending or running state"
            )
    
    return {
        "jobId": job_id,
        "status": "cancelled",
        "message": "Job cancelled successfully"
    }