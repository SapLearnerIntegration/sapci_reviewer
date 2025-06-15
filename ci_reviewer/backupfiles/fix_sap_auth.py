#!/usr/bin/env python3
"""
Fix SAP Authentication in all components
This script updates all the route files to properly use SAP client credentials authentication
"""

import os

def fix_sap_extraction_routes():
    """Fix SAP extraction routes to use proper authentication"""
    
    content = '''"""
SAP Extraction Routes - Fixed with Proper Authentication
"""

import os
import json
import logging
import traceback
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from api.models.sap_models import PackageSearchModel, IFlowExtractionModel, TenantModel
from app.services.sap_tools import SAPConnection

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post('/extraction/search_packages')
async def search_packages(search_request: PackageSearchModel):
    """Search for SAP integration packages"""
    
    tenant = search_request.tenant
    tenant_data = search_request.tenant_data.model_dump()
    query = search_request.query
    
    logger.info(f"Received search_packages request for tenant: {tenant}")
    logger.info(f"Query: {query}")
    
    try:
        # Set up environment for SAP tools
        if tenant_data:
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
        
        # Get authentication token first using client credentials
        try:
            token = sap_conn.get_token()
            logger.info(f"Successfully obtained SAP token: {token[:10]}...")
        except Exception as auth_error:
            logger.error(f"Authentication failed: {str(auth_error)}")
            raise HTTPException(
                status_code=401,
                detail=f"SAP authentication failed: {str(auth_error)}"
            )
        
        # Set current package ID
        sap_conn.current_package_id = package_id.strip()
        
        # Get package details to find IFlows
        package_details_json = sap_conn.get_iflow_details(package_id)
        
        try:
            package_details = json.loads(package_details_json)
            
            if "error" in package_details:
                raise HTTPException(
                    status_code=500,
                    detail=package_details["error"]
                )
            
            # Extract IFlows from the results
            if "results" in package_details:
                iflows = package_details["results"]
            else:
                raise HTTPException(
                    status_code=500,
                    detail="Invalid package details response format"
                )
            
            if not iflows:
                raise HTTPException(
                    status_code=404,
                    detail=f"No IFlows found in package {package_id}"
                )
            
            logger.info(f"Found {len(iflows)} IFlows in package {package_id}")
            
            # Format IFlows according to frontend expectations
            formatted_iflows = []
            for iflow in iflows:
                formatted_iflow = {
                    "Id": iflow.get("Id", ""),
                    "Name": iflow.get("Name", ""),
                    "Description": iflow.get("Description", iflow.get("ShortText", "")),
                    "Version": iflow.get("Version", ""),
                    "Type": iflow.get("Type", "Integration Flow"),
                    "path": f"package:{package_id}/iflow:{iflow.get('Id', '')}"
                }
                formatted_iflows.append(formatted_iflow)
            
            # Return in the expected format
            result = {
                "d": {
                    "results": formatted_iflows
                }
            }
            
            return result
            
        except json.JSONDecodeError as json_error:
            logger.error(f"JSON parse error: {str(json_error)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to parse package details: {str(json_error)}"
            )
            
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error extracting IFlows: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to extract IFlows: {str(e)}"
        )


@router.get('/extraction/status')
async def extraction_status():
    """Get extraction service status"""
    
    # Check if SAP tools are available
    sap_tools_available = False
    try:
        from app.services.sap_tools import SAPConnection
        sap_tools_available = True
    except ImportError:
        pass
    
    return {
        "status": "available" if sap_tools_available else "limited",
        "timestamp": datetime.now().isoformat(),
        "sap_tools_available": sap_tools_available,
        "message": "SAP extraction service ready" if sap_tools_available else "SAP tools not available"
    }
'''
    
    os.makedirs("api/routes", exist_ok=True)
    
    with open("api/routes/sap_extraction.py", 'w') as f:
        f.write(content)
    
    print("✓ Fixed api/routes/sap_extraction.py with proper SAP authentication")


def fix_sap_review_routes():
    """Fix SAP review routes to use proper authentication"""
    
    content = '''"""
SAP Review Routes - Fixed with Proper Authentication
"""

import os
import json
import logging
import traceback
from datetime import datetime
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse, FileResponse

from api.models.sap_models import ReviewSubmissionModel, ReviewStatusModel
from api.services.job_manager import job_manager
from app.services.sap_tools import SAPConnection

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post('/review')
async def submit_review(
    review_request: ReviewSubmissionModel, 
    background_tasks: BackgroundTasks
):
    """Submit an integration package for review with proper SAP authentication"""
    
    data = review_request.model_dump()
    
    logger.info(f"Review submission received:")
    logger.info(f"- Tenant: {data.get('tenant')}")
    logger.info(f"- Packages: {data.get('packages')}")
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
    
    # Test SAP authentication before submitting job
    try:
        test_sap_conn = SAPConnection(
            base_url=tenant_data.get('apiUrl', ''),
            auth_url=tenant_data.get('authUrl', ''),
            client_id=tenant_data.get('clientId', ''),
            client_secret=tenant_data.get('clientSecret', '')
        )
        
        # Test authentication
        token = test_sap_conn.get_token()
        logger.info(f"SAP authentication test successful: {token[:10]}...")
        
    except Exception as auth_error:
        logger.error(f"SAP authentication test failed: {str(auth_error)}")
        raise HTTPException(
            status_code=401,
            detail=f"SAP authentication failed: {str(auth_error)}"
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
    job_manager.add_log(job_id, "Job submitted with SAP authentication verified", "info")
    
    logger.info(f"Starting background task for job {job_id}")
    background_tasks.add_task(run_review_job, job_id, data)
    
    return {
        "jobId": job_id,
        "status": "pending",
        "message": "Review job submitted successfully"
    }


def run_review_job(job_id: str, review_params: dict):
    """Run a review job in the background with proper SAP authentication"""
    
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
        
        # Create SAP connection and test authentication
        sap_conn = SAPConnection(
            base_url=tenant_data.get('apiUrl', ''),
            auth_url=tenant_data.get('authUrl', ''),
            client_id=tenant_data.get('clientId', ''),
            client_secret=tenant_data.get('clientSecret', '')
        )
        
        # Test authentication at the start of the job
        try:
            token = sap_conn.get_token()
            logger.info(f"Job {job_id}: SAP authentication successful: {token[:10]}...")
            job_manager.add_log(job_id, "SAP authentication successful", "info")
        except Exception as auth_error:
            error_msg = f"SAP authentication failed in job: {str(auth_error)}"
            logger.error(error_msg)
            job_manager.update_job(job_id, status="failed", error=error_msg)
            job_manager.add_log(job_id, error_msg, "error")
            return None
        
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
        
        # Try to run the review using the SAP integration reviewer
        try:
            from app.services.sap_integration_reviewer import direct_review_packages
            
            # Read guideline content
            guideline_content = "# Basic Guidelines\\n\\nAll integrations should follow best practices."
            
            # Run the review
            result_file = direct_review_packages(
                packages=packages,
                specific_iflows=iflow_selections,
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
            
        except ImportError:
            # Fallback if review module is not available
            error_msg = "SAP integration reviewer module not available"
            logger.error(error_msg)
            job_manager.update_job(job_id, status="failed", error=error_msg)
            job_manager.add_log(job_id, error_msg, "error")
            return None
        
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


@router.get('/review/status')
async def review_service_status():
    """Get review service status"""
    
    # Check if required modules are available
    sap_tools_available = False
    reviewer_available = False
    
    try:
        from app.services.sap_tools import SAPConnection
        sap_tools_available = True
    except ImportError:
        pass
    
    try:
        from app.services.sap_integration_reviewer import direct_review_packages
        reviewer_available = True
    except ImportError:
        pass
    
    return {
        "status": "available" if (sap_tools_available and reviewer_available) else "limited",
        "timestamp": datetime.now().isoformat(),
        "capabilities": {
            "sap_tools": sap_tools_available,
            "integration_reviewer": reviewer_available
        },
        "message": "Review service ready" if (sap_tools_available and reviewer_available) else "Some components not available"
    }
'''
    
    with open("api/routes/sap_review.py", 'w') as f:
        f.write(content)
    
    print("✓ Fixed api/routes/sap_review.py with proper SAP authentication")


def add_missing_imports():
    """Add missing datetime import to files that need it"""
    
    files_needing_datetime = [
        "api/routes/sap_extraction.py",
        "api/routes/analysis.py"
    ]
    
    for file_path in files_needing_datetime:
        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                content = f.read()
            
            if "from datetime import datetime" not in content:
                # Add datetime import after other imports
                lines = content.split('\n')
                import_section_end = 0
                
                for i, line in enumerate(lines):
                    if line.startswith('from ') or line.startswith('import '):
                        import_section_end = i
                
                lines.insert(import_section_end + 1, "from datetime import datetime")
                
                with open(file_path, 'w') as f:
                    f.write('\n'.join(lines))
                
                print(f"✓ Added datetime import to {file_path}")


def main():
    """Run all authentication fixes"""
    print("🔧 Fixing SAP authentication in all components...")
    print()
    
    fix_sap_extraction_routes()
    fix_sap_review_routes()
    add_missing_imports()
    
    print()
    print("✅ SAP authentication fixes completed!")
    print()
    print("Key changes made:")
    print("- All routes now use sap_conn.get_token() for authentication")
    print("- Proper error handling for authentication failures")
    print("- Token verification before job submission")
    print("- Added authentication status checks")
    print()
    print("Your SAP integration should now properly:")
    print("1. Use client credentials to get OAuth token")
    print("2. Use the token for all SAP API calls")
    print("3. Handle authentication errors gracefully")


if __name__ == "__main__":
    main():
            token = sap_conn.get_token()
            logger.info(f"Successfully obtained SAP token: {token[:10]}...")
        except Exception as auth_error:
            logger.error(f"SAP authentication failed: {str(auth_error)}")
            raise HTTPException(
                status_code=401,
                detail=f"SAP authentication failed: {str(auth_error)}"
            )
        
        # Set query and search
        sap_conn.set_query(query)
        search_results = sap_conn.search_integration_packages()
        
        # Parse the results
        try:
            response_data = json.loads(search_results)
            
            if "error" in response_data:
                raise HTTPException(
                    status_code=500, 
                    detail=response_data["error"]
                )
            
            logger.info(f"Found {len(response_data.get('d', {}).get('results', []))} packages")
            return response_data
            
        except json.JSONDecodeError:
            logger.error(f"Failed to parse search results: {search_results}")
            raise HTTPException(
                status_code=500, 
                detail="Failed to parse search results"
            )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error searching packages: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/extraction/extract_iflows')
async def extract_iflows(extraction_request: IFlowExtractionModel):
    """Extract IFlows for a package with proper authentication"""
    
    tenant = extraction_request.tenant
    tenant_data = extraction_request.tenant_data.model_dump()
    package_id = extraction_request.package
    
    logger.info(f"Received extract_iflows request for tenant: {tenant}, package: {package_id}")
    
    try:
        # Set up environment for SAP tools
        if tenant_data:
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
        
        logger.info(f"Created SAPConnection instance")
        
        # Get authentication token first using client credentials
        try