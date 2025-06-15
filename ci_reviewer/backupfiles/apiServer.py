#!/usr/bin/env python
"""
SAP Integration Backend API Server - FastAPI Version

This FastAPI application serves as an API server that connects the React frontend
to the SAP Integration tools (sap_integration_reviewer.py and sap_tools.py).

It provides endpoints for:
1. Extracting SAP Integration packages and IFlows
2. Reviewing integration designs against guidelines
3. Retrieving and downloading review reports

Usage:
    uvicorn apiServer:app [--port PORT] [--host HOST]
"""
import os
import sys
import json
import uuid
import time
import re
import argparse
import threading
import traceback
import logging
from logging.handlers import RotatingFileHandler
from datetime import datetime
from typing import Dict, List, Any, Optional, Union
import requests
from fastapi import FastAPI, HTTPException, BackgroundTasks, Query, Depends, Response, UploadFile, File
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from app.services.sap_integration_reviewer import generate_enhanced_report
# Import our SAP tools modules if available
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# Create logs directory if needed
logs_dir = os.path.join(os.path.dirname(__file__), "logs")
if not os.path.exists(logs_dir):
    os.makedirs(logs_dir)

# Set up file logger
log_file = os.path.join(logs_dir, "sap_integration.log")
file_handler = RotatingFileHandler(log_file, maxBytes=10*1024*1024, backupCount=5)
file_handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))

# Configure console logging too
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))

# Root logger config
logging.basicConfig(
    level=logging.DEBUG,  # Set DEBUG level for maximum detail
    handlers=[file_handler, console_handler]
)

logging.info("SAP Integration Reviewer starting up...")
HAS_SAP_MODULES = False
try:
    from services.sap_tools import SAPConnection
    try:
        from services.sap_integration_reviewer import main as reviewer_main
        print("Successfully imported reviewer_main from sap_integration_reviewer")
        HAS_SAP_MODULES = True
    except ImportError:
        print("COULD NOT import reviewer_main from sap_integration_reviewer")
        # Try alternative import paths
        import os, sys
        module_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
        if module_path not in sys.path:
            sys.path.append(module_path)
        try:
            from services.sap_integration_reviewer import main as reviewer_main
            print("Successfully imported reviewer_main after path adjustment")
        except ImportError as e:
            print(f"WARNING: Could not import reviewer_main: {e}")
            # Define a fallback function
            def reviewer_main(*args, **kwargs):
                print("WARNING: Using fallback reviewer_main function")
                return "fallback_result.json"
    
        HAS_SAP_MODULES = True
except ImportError:
    print("WARNING: SAP modules not found. Running in limited mock mode.")

# Create FastAPI app
app = FastAPI(
    title="SAP Integration Review API",
    description="API for SAP Integration Package Review and Extraction",
    version="1.0",
    docs_url="/",  # This will make the Swagger UI available at the root URL
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Your React app's origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Storage for background jobs
JOBS = {}
REPORTS_DIR = os.path.join("housekeeping", "reports")

# Ensure reports directory exists
os.makedirs(REPORTS_DIR, exist_ok=True)

# Pydantic models for request/response validation
class TenantModel(BaseModel):
    id: str = Field(..., description="Tenant ID")
    name: str = Field(..., description="Tenant Name")
    authUrl: str = Field(..., description="Authentication URL")
    apiUrl: str = Field(..., description="API URL")
    clientId: str = Field(..., description="Client ID")
    clientSecret: str = Field(..., description="Client Secret")

class PackageSearchModel(BaseModel):
    tenant: str = Field(..., description="Tenant Name")
    tenant_data: TenantModel = Field(..., description="Tenant Connection Details")
    query: str = Field('*', description="Search query")

class IFlowExtractionModel(BaseModel):
    tenant: str = Field(..., description="Tenant Name")
    tenant_data: TenantModel = Field(..., description="Tenant Connection Details")
    package: str = Field(..., description="Package ID to extract IFlows from")

class IFlowSelections(dict):
    """Special dict type for IFlow selections that can have string or list values"""
    pass

class ReviewSubmissionModel(BaseModel):
    tenant: str = Field(..., description="Tenant Name")
    tenant_data: TenantModel = Field(..., description="Tenant Connection Details")
    packages: List[str] = Field(..., description="Package IDs to review")
    iflowSelections: Optional[Dict[str, Union[str, List[str]]]] = Field(None, description="Selected IFlows per package")
    guideline: str = Field(..., description="Design guideline to apply")
    model: str = Field(..., description="LLM model to use")

class ReviewStatusModel(BaseModel):
    jobId: str = Field(..., description="Job ID")
    status: str = Field(..., description="Job status", examples=["pending", "running", "completed", "failed"])
    progress: int = Field(..., description="Job progress percentage")
    createdAt: Optional[str] = Field(None, description="Job creation timestamp")
    completedAt: Optional[str] = Field(None, description="Job completion timestamp")
    completedIFlows: Optional[int] = Field(None, description="Number of completed IFlow reviews")
    totalIFlows: Optional[int] = Field(None, description="Total number of IFlows to review")

# Health Check Endpoint
@app.get('/health')
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "sap_modules_loaded": HAS_SAP_MODULES
    }

# SAP Extraction Endpoints
@app.post('/sap/extraction/search_packages')
async def search_packages(search_request: PackageSearchModel):
    """Search for SAP integration packages"""
    tenant = search_request.tenant
    tenant_data = search_request.tenant_data.dict()
    query = search_request.query
    
    print(f"Received search_packages request for tenant: {tenant}")
    print(f"Query: {query}")
    
    try:
        # Set up environment for SAP tools
        if tenant_data:
            os.environ["SAP_AUTH_URL"] = tenant_data.get('authUrl', '')
            os.environ["SAP_CLIENT_ID"] = tenant_data.get('clientId', '')
            os.environ["SAP_CLIENT_SECRET"] = tenant_data.get('clientSecret', '')
            os.environ["SAP_INTEGRATION_URL"] = tenant_data.get('apiUrl', '')
        
        sap_conn = SAPConnection(
            base_url=tenant_data.get('apiUrl', ''),
            auth_url=tenant_data.get('authUrl', ''),
            client_id=tenant_data.get('clientId', ''),
            client_secret=tenant_data.get('clientSecret', '')
        )
         
        # Get token for authentication
        token = sap_conn.get_token()
        print(f"Retrieved token successfully")
        
        # Use the API URL from tenant data
        api_url = tenant_data.get('apiUrl', '')
        if not api_url:
            raise Exception("API URL is missing from tenant data")
        
        # Construct search URL
        search_url = f"{api_url}/api/v1/IntegrationPackages"
        print(f"Searching packages at: {search_url}")
        
        # Prepare headers
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json"
        }
        print(f"Headers: {headers}")
        # Make the request
        response = requests.get(search_url, headers=headers)
        print(f"API response status: {response.status_code}")
        
        if response.status_code != 200:
            error_detail = response.text[:200] + "..." if len(response.text) > 200 else response.text
            print(f"Error response: {error_detail}")
            raise Exception(f"SAP API error: {response.status_code} - {error_detail}")
        
        # Parse the response
        response_data = response.json()
        
        # Check if the response has the expected structure
        if "d" not in response_data or "results" not in response_data["d"]:
            print(f"Unexpected response structure: {json.dumps(response_data)[:200]}...")
            raise Exception("Invalid response format from SAP API")
        
        # Get packages from response
        packages = response_data["d"]["results"]
        print(f"Found {len(packages)} packages")
        
        # Format packages according to frontend expectations
        # The SAP API may already return the data in the proper format, 
        # but let's ensure consistency
        formatted_packages = []
        for pkg in packages:
            # Create a properly formatted package object
            formatted_package = {
                "Id": pkg.get("Id", ""),
                "Name": pkg.get("Name", ""),
                "Description": pkg.get("ShortText", ""),
                "Version": pkg.get("Version", ""),
                "Mode": pkg.get("Mode", "EDIT_ALLOWED"),
                "CreatedBy": pkg.get("CreatedBy", ""),
                "CreationDate": pkg.get("CreationDate", "")
            }
            formatted_packages.append(formatted_package)
        
        # Return in the exact format expected by the frontend
        result = {
            "d": {
                "results": formatted_packages
            }
        }
        
        print(f"Returning {len(formatted_packages)} packages")
        return result
    
    except Exception as e:
        print(f"Error searching packages: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# Function to run review job in background
# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

@app.post('/sap/extraction/extract_iflows')
async def extract_iflows(extraction_request: IFlowExtractionModel):
    """Extract IFlows for a package with improved error handling and debugging"""
    tenant = extraction_request.tenant
    tenant_data = extraction_request.tenant_data.model_dump()
    package_id = extraction_request.package
    
    print(f"Received extract_iflows request for tenant: {tenant}, package: {package_id}")
    
    try:
        # Set up environment for SAP tools
        if tenant_data:
            os.environ["SAP_AUTH_URL"] = tenant_data.get('authUrl', '')
            os.environ["SAP_CLIENT_ID"] = tenant_data.get('clientId', '')
            os.environ["SAP_CLIENT_SECRET"] = tenant_data.get('clientSecret', '')
            os.environ["SAP_INTEGRATION_URL"] = tenant_data.get('apiUrl', '')
        
        sap_conn = SAPConnection(
            base_url=tenant_data.get('apiUrl', ''),
            auth_url=tenant_data.get('authUrl', ''),
            client_id=tenant_data.get('clientId', ''),
            client_secret=tenant_data.get('clientSecret', '')
        )
        
        print(f"Created SAPConnection instance with:")
        print(f"- base_url: {tenant_data.get('apiUrl', '')}")
        print(f"- auth_url: {tenant_data.get('authUrl', '')}")
        
        # Get token for authentication with proper error handling
        try:
            token = sap_conn.get_token()
            print(f"Retrieved token successfully: {token[:10]}...")
        except Exception as auth_error:
            print(f"Authentication error: {str(auth_error)}")
            traceback.print_exc()
            raise HTTPException(
                status_code=401,
                detail=f"Authentication failed: {str(auth_error)}"
            )
        
        # Use the API URL from tenant data
        api_url = tenant_data.get('apiUrl', '')
        if not api_url:
            raise Exception("API URL is missing from tenant data")
        
        # Try multiple URL formats for better compatibility
        urls_to_try = [
            f"{api_url}/api/v1/IntegrationPackages('{package_id}')/IntegrationDesigntimeArtifacts",
            f"{api_url}/api/v1/IntegrationPackages('{package_id.strip()}')/IntegrationDesigntimeArtifacts",
            f"{api_url}/api/v1/IntegrationPackages?$filter=Id eq '{package_id}'"
        ]
        
        # Prepare headers
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json"
        }
        
        # Try each URL until one works
        response = None
        for url in urls_to_try:
            print(f"Trying URL: {url}")
            try:
                response = requests.get(url, headers=headers)
                print(f"Response status: {response.status_code}")
                
                if response.status_code == 200:
                    print(f"Successfully retrieved data from URL: {url}")
                    break
            except Exception as url_error:
                print(f"Error with URL {url}: {str(url_error)}")
        
        if not response or response.status_code != 200:
            if response:
                error_detail = response.text[:200] + "..." if len(response.text) > 200 else response.text
                print(f"Error response: {error_detail}")
                raise HTTPException(
                    status_code=response.status_code, 
                    detail=f"Failed to get IFlows: {response.status_code} - {error_detail}"
                )
            else:
                raise HTTPException(
                    status_code=500,
                    detail="Failed to connect to SAP API"
                )
        
        # Parse the response with better error handling
        try:
            response_data = response.json()
            print(f"Response data structure: {list(response_data.keys())}")
            
            # Save full response for debugging
            with open(f"iflows_response_{package_id}.json", "w") as f:
                json.dump(response_data, f, indent=2)
            print(f"Saved full response to iflows_response_{package_id}.json")
            
            # Process the response based on its structure
            if "d" in response_data and "results" in response_data["d"]:
                iflows = response_data["d"]["results"]
                print(f"Found {len(iflows)} IFlows in standard format")
            elif "results" in response_data:
                iflows = response_data["results"]
                print(f"Found {len(iflows)} IFlows in alternate format 1")
            elif "value" in response_data:
                iflows = response_data["value"]
                print(f"Found {len(iflows)} IFlows in alternate format 2")
            else:
                print(f"Unknown response format: {json.dumps(response_data)[:200]}...")
                # Try to find any array that might contain IFlows
                iflows = []
                for key, value in response_data.items():
                    if isinstance(value, list) and len(value) > 0:
                        if isinstance(value[0], dict) and any(k in value[0] for k in ["Id", "Name", "id", "name"]):
                            iflows = value
                            print(f"Found potential IFlows array in key '{key}'")
                            break
                
                if not iflows:
                    raise HTTPException(
                        status_code=500,
                        detail=f"Could not find IFlows in response data"
                    )
            
            # Format IFlows according to frontend expectations
            formatted_iflows = []
            for iflow in iflows:
                # Handle lowercase or uppercase property names
                iflow_id = iflow.get("Id", iflow.get("id", ""))
                iflow_name = iflow.get("Name", iflow.get("name", ""))
                iflow_desc = iflow.get("Description", iflow.get("description", iflow.get("ShortText", "")))
                iflow_version = iflow.get("Version", iflow.get("version", ""))
                iflow_type = iflow.get("Type", iflow.get("type", "Integration Flow"))
                
                # Create a properly formatted IFlow object
                formatted_iflow = {
                    "Id": iflow_id,
                    "Name": iflow_name,
                    "Description": iflow_desc,
                    "Version": iflow_version,
                    "Type": iflow_type,
                    "path": f"package:{package_id}/iflow:{iflow_id}"
                }
                formatted_iflows.append(formatted_iflow)
            
            print(f"Formatted {len(formatted_iflows)} IFlows")
            
            # Return in the exact format expected by the frontend
            result = {
                "d": {
                    "results": formatted_iflows
                }
            }
            
            return result
            
        except json.JSONDecodeError as json_error:
            print(f"JSON parse error: {str(json_error)}")
            traceback.print_exc()
            raise HTTPException(
                status_code=500,
                detail=f"Failed to parse response as JSON: {str(json_error)}"
            )
            
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        print(f"Error extracting IFlows: {str(e)}")
        traceback.print_exc()
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to extract IFlows: {str(e)}"
        )

@app.post('/sap/review')
async def submit_review(review_request: ReviewSubmissionModel, background_tasks: BackgroundTasks):
    """Submit an integration package for review with enhanced error handling and debugging"""
    data = review_request.dict()
    
    # Add more detailed debug logging
    print(f"  - Review submission received:")
    print(f"  - Tenant: {data.get('tenant')}")
    print(f"  - Packages: {data.get('packages')}")
    print(f"  - IFlow Selections: {json.dumps(data.get('iflowSelections', {}), indent=2)}")
    print(f"  - Guideline: {data.get('guideline')}")
    print(f"  - Model: {data.get('model')}")
    print(f"  - LLM: {data.get('llm')}")
    
    # Validate the tenant data
    tenant_data = data.get('tenant_data', {})
    missing_fields = []
    for field in ['authUrl', 'apiUrl', 'clientId', 'clientSecret']:
        if not tenant_data.get(field):
            missing_fields.append(field)
    
    if missing_fields:
        return JSONResponse(
            status_code=400,
            content={
                "error": f"Missing required tenant data fields: {', '.join(missing_fields)}"
            }
        )
    
    # Validate packages
    packages = data.get('packages', [])
    if not packages:
        return JSONResponse(
            status_code=400,
            content={"error": "No packages specified for review"}
        )
    
    # Generate a unique job ID
    job_id = f"job-{uuid.uuid4()}"
    
    # Store job information with enhanced details
    JOBS[job_id] = {
        "id": job_id,
        "params": data,
        "status": "pending",
        "progress": 0,
        "created_at": datetime.now().isoformat(),
        "completedIFlows": 0,
        "totalIFlows": 0,
        "logs": []  # Store execution logs
    }
    
    # Add initial log
    JOBS[job_id]["logs"].append({
        "timestamp": datetime.now().isoformat(),
        "message": "Job submitted",
        "level": "info"
    })
    
    # Debug the environment variables before starting the job
    debug_info = {
        "SAP_AUTH_URL": tenant_data.get('authUrl', ''),
        "SAP_CLIENT_ID": f"{tenant_data.get('clientId', '')[:10]}...",
        "SAP_CLIENT_SECRET": "***redacted***",
        "SAP_INTEGRATION_URL": tenant_data.get('apiUrl', '')
    }
    
    print(f"Environment variables for job {job_id}:")
    for key, value in debug_info.items():
        print(f"  - {key}: {value}")
    
    # Check if guideline file exists
    guideline = data.get('guideline', 'basic')
    guideline_paths = [
        os.path.join("guidelines", f"{guideline}.md"),
        os.path.join("..", "guidelines", f"{guideline}.md"),
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "guidelines", f"{guideline}.md"),
        os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "guidelines", f"{guideline}.md")
    ]
    
    guideline_found = False
    for path in guideline_paths:
        if os.path.exists(path):
            print(f"Found guideline at path: {path}")
            guideline_found = True
            break
    
    if not guideline_found:
        # Try to create a basic guideline if not found
        print(f"Warning: Guideline '{guideline}' not found. Creating a basic guideline.")
        try:
            os.makedirs("guidelines", exist_ok=True)
            with open(os.path.join("guidelines", f"{guideline}.md"), "w") as f:
                f.write("# Basic SAP Integration Design Guidelines\n\n")
                f.write("## Error Handling\n\n")
                f.write("All integrations should implement proper error handling.\n\n")
                f.write("## Security\n\n")
                f.write("All integrations should follow security best practices.\n\n")
                f.write("## Performance\n\n")
                f.write("Integrations should be optimized for performance.\n\n")
            print(f"Created basic guideline at: {os.path.join('guidelines', f'{guideline}.md')}")
        except Exception as e:
            print(f"Error creating guideline: {str(e)}")
            # Continue without guideline
    
    # Start a background task to run the review with extra debug info
    print(f"Starting background task for job {job_id}")
    background_tasks.add_task(run_review_job, job_id, data)
    
    return {
        "jobId": job_id,
        "status": "pending",
        "message": "Review job submitted successfully"
    }

# Original function at line ~617 in apiServer.py
def run_review_job(job_id: str, review_params: dict):
    """Run a review job in the background with enhanced debugging capabilities"""
    # First set up additional error logging
    error_log_path = f"review_job_{job_id}_error.log"
    debug_log_path = f"review_job_{job_id}_debug.log"
    
    # Create file handlers for specific job logging
    error_handler = logging.FileHandler(error_log_path)
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
    
    debug_handler = logging.FileHandler(debug_log_path)
    debug_handler.setLevel(logging.DEBUG)
    debug_handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
    
    # Add handlers to root logger
    logging.getLogger().addHandler(error_handler)
    logging.getLogger().addHandler(debug_handler)
    
    logging.info(f"Starting review job {job_id} with enhanced debugging")
    
    # First test the SAP connection
    try:
        tenant_data = review_params.get('tenant_data', {})
        sap_conn_test = SAPConnection(
            base_url=tenant_data.get('apiUrl', ''),
            auth_url=tenant_data.get('authUrl', ''),
            client_id=tenant_data.get('clientId', ''),
            client_secret=tenant_data.get('clientSecret', '')
        )
        
        logging.info(f"Testing authentication for job {job_id}")
        test_token = sap_conn_test.get_token()
        logging.info(f"Authentication test successful: {test_token[:10]}...")
    except Exception as auth_test_error:
        logging.error(f"Authentication test failed: {str(auth_test_error)}")
        if job_id in JOBS:
            JOBS[job_id]["status"] = "failed"
            JOBS[job_id]["error"] = f"Authentication test failed: {str(auth_test_error)}"
            JOBS[job_id]["logs"].append({
                "timestamp": datetime.now().isoformat(),
                "message": f"Authentication test failed: {str(auth_test_error)}",
                "level": "error"
            })
    
    # Now run the actual review job implementation
    try:
        # Get parameters for the review
        tenant_data = review_params.get('tenant_data', {})
        packages = review_params.get('packages', [])
        iflow_selections = review_params.get('iflowSelections', {})
        guideline = review_params.get('guideline', 'basic')
        model = review_params.get('model', 'default')
        
        if not packages:
            raise ValueError("No packages specified for review")
        
        # Update job status
        if job_id in JOBS:
            JOBS[job_id]["status"] = "running"
            JOBS[job_id]["logs"].append({
                "timestamp": datetime.now().isoformat(),
                "message": f"Starting review of {len(packages)} packages",
                "level": "info"
            })
        
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
        
        # Prepare specific_iflows parameter for sap_integration_reviewer
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
                logging.info(f"Loaded guideline from: {path}")
                break
        
        if not guideline_content:
            raise ValueError(f"Guideline file '{guideline}' not found")
        
        # Progress update callback function
        def update_progress(progress_data):
            if job_id in JOBS:
                if "progress" in progress_data:
                    JOBS[job_id]["progress"] = progress_data["progress"]
                if "completedIFlows" in progress_data:
                    JOBS[job_id]["completedIFlows"] = progress_data["completedIFlows"]
                if "totalIFlows" in progress_data:
                    JOBS[job_id]["totalIFlows"] = progress_data["totalIFlows"]
                if "message" in progress_data:
                    JOBS[job_id]["logs"].append({
                        "timestamp": datetime.now().isoformat(),
                        "message": progress_data["message"],
                        "level": "info"
                    })
        
        # Import the reviewer function
        from services.sap_integration_reviewer import direct_review_packages
        
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
        if job_id in JOBS:
            JOBS[job_id]["status"] = "completed"
            JOBS[job_id]["result_file"] = result_file
            JOBS[job_id]["completed_at"] = datetime.now().isoformat()
            JOBS[job_id]["progress"] = 100
            JOBS[job_id]["logs"].append({
                "timestamp": datetime.now().isoformat(),
                "message": f"Review completed successfully",
                "level": "info"
            })
        
        logging.info(f"Job {job_id} completed successfully. Result: {result_file}")
        return result_file
        
    except Exception as e:
        logging.error(f"Error in review job {job_id}: {str(e)}")
        logging.error(traceback.format_exc())
        
        if job_id in JOBS:
            JOBS[job_id]["status"] = "failed"
            JOBS[job_id]["error"] = str(e)
            JOBS[job_id]["traceback"] = traceback.format_exc()
            JOBS[job_id]["logs"].append({
                "timestamp": datetime.now().isoformat(),
                "message": f"Error in review job: {str(e)}",
                "level": "error"
            })
        return None
    finally:
        # Remove custom handlers
        logging.getLogger().removeHandler(error_handler)
        logging.getLogger().removeHandler(debug_handler)

@app.get('/sap/review/{job_id}/status', response_model=ReviewStatusModel)
async def get_review_status(job_id: str):
    """Get the status of a review job with enhanced progress information"""
    if job_id not in JOBS:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = JOBS[job_id]
    
    # Prepare response with standard fields
    response = {
        "jobId": job_id,
        "status": job.get("status", "unknown"),
        "progress": job.get("progress", 0),
        "createdAt": job.get("created_at"),
        "completedAt": job.get("completed_at")
    }
    
    # Add IFlow statistics if they exist
    if "completedIFlows" in job:
        response["completedIFlows"] = job["completedIFlows"]
    if "totalIFlows" in job:
        response["totalIFlows"] = job["totalIFlows"]
    
    # Add recent logs (last 5)
    if "logs" in job:
        response["recent_logs"] = job["logs"][-5:]
    
    # Add error details if job failed
    if job.get("status") == "failed":
        response["error"] = job.get("error")
        # Add a limited portion of the traceback for debugging
        if "traceback" in job:
            # Limit to first 20 lines to avoid overwhelming the response
            traceback_lines = job["traceback"].split('\n')[:20]
            response["error_details"] = '\n'.join(traceback_lines)
    
    # Add additional information for retried jobs
    if "is_retry" in job and job["is_retry"]:
        response["is_retry"] = True
        response["original_job_id"] = job.get("original_job_id")
    
    # Add recovery points information if available
    if "recovery_points" in job and job["recovery_points"]:
        response["recovery_points_count"] = len(job["recovery_points"])
        response["latest_recovery_point"] = job["recovery_points"][-1]["checkpoint"]
    
    return response

@app.get('/sap/review/{job_id}/report')
async def get_review_report(job_id: str):
    """Get the report for a completed review job"""
    if job_id not in JOBS:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = JOBS[job_id]
    
    if job.get("status") != "completed":
        raise HTTPException(status_code=400, detail="Job not completed")
    
    result_file = job.get("result_file")
    if not result_file or not os.path.exists(result_file):
        raise HTTPException(status_code=404, detail="Report file not found")
    
    # Parse the report file
    try:
        with open(result_file, "r") as f:
            content = f.read()
        
        # Try to extract structured data from the report content
        try:
            # Try to extract some structured data from the report content
            # This is a simple heuristic approach - you might want to enhance this
            # to better parse the actual report format
            
            summary = {}
            
            # Try to extract overall compliance
            compliance_match = re.search(r'Overall Compliance[^\d]*(\d+)%', content)
            if compliance_match:
                summary["overallCompliance"] = f"{compliance_match.group(1)}%"
            
            # Try to extract IFlow counts
            total_match = re.search(r'Total IFlows[^\d]*(\d+)', content)
            if total_match:
                summary["totalIFlows"] = int(total_match.group(1))
            
            high_match = re.search(r'High Compliance[^\d]*(\d+)', content)
            if high_match:
                summary["highCompliance"] = int(high_match.group(1))
            
            medium_match = re.search(r'Medium Compliance[^\d]*(\d+)', content)
            if medium_match:
                summary["mediumCompliance"] = int(medium_match.group(1))
            
            low_match = re.search(r'Low Compliance[^\d]*(\d+)', content)
            if low_match:
                summary["lowCompliance"] = int(low_match.group(1))
            
            # If we couldn't extract structured data, use a minimal summary
            if not summary:
                summary = {
                    "totalIFlows": job.get("totalIFlows", 0),
                    "overallCompliance": "N/A"
                }
            
            # Return the structured data along with the raw content
            return {
                "jobId": job_id,
                "content": content,
                "summary": summary,
                "reportPath": result_file,
                "generatedAt": job.get("completed_at")
            }
        except Exception as parse_error:
            print(f"Error parsing report structure: {str(parse_error)}")
            
            # Fallback to just returning content
            return {
                "jobId": job_id,
                "content": content,
                "reportPath": result_file,
                "generatedAt": job.get("completed_at")
            }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading report: {str(e)}")

@app.get('/sap/review/{job_id}/download')
async def download_report(job_id: str, format: str = "md"):
    """Download the report file for a completed review job"""
    if job_id not in JOBS:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = JOBS[job_id]
    
    if job.get("status") != "completed":
        raise HTTPException(status_code=400, detail="Job not completed")
    
    result_file = job.get("result_file")
    if not result_file or not os.path.exists(result_file):
        raise HTTPException(status_code=404, detail="Report file not found")
    
    # Get requested format
    format_param = format.lower()
    
    # If requesting HTML format, try to convert the markdown to HTML
    if format_param == 'html' and result_file.endswith('.md'):
        try:
            # Check if we have markdown library available
            import markdown
            
            with open(result_file, 'r') as f:
                md_content = f.read()
            
            # Convert to HTML
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>SAP Integration Review - {job_id}</title>
                <style>
                    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 900px; margin: 0 auto; color: #333; }}
                    h1, h2, h3 {{ color: #1a56db; }}
                    table {{ border-collapse: collapse; width: 100%; margin: 16px 0; }}
                    th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                    th {{ background-color: #f3f4f6; }}
                    tr:nth-child(even) {{ background-color: #f9fafb; }}
                    .high {{ color: #059669; }}
                    .medium {{ color: #d97706; }}
                    .low {{ color: #dc2626; }}
                    code {{ background-color: #f3f4f6; padding: 2px 5px; border-radius: 3px; font-family: monospace; }}
                    pre {{ background-color: #f3f4f6; padding: 12px; border-radius: 5px; overflow-x: auto; }}
                </style>
            </head>
            <body>
                {markdown.markdown(md_content, extensions=['tables', 'fenced_code'])}
            </body>
            </html>
            """
            
            # Return the HTML content directly
            return Response(
                content=html_content,
                media_type="text/html",
                headers={
                    "Content-Disposition": f"attachment; filename=sap_integration_review_{job_id}.html"
                }
            )
                
        except ImportError:
            # If markdown library is not available, just return the original markdown file
            print("Markdown library not available - returning original file")
            pass
        except Exception as e:
            print(f"Error converting to HTML: {str(e)}")
            # Continue to return the original file
    
    # Return the original file as download
    return FileResponse(
        path=result_file,
        filename=f"sap_integration_review_{job_id}.{format_param}",
        media_type="text/markdown" if format_param == "md" else "application/octet-stream"
    )

@app.get('/sap/review/jobs')
async def list_jobs():
    """List all review jobs"""
    # Convert job dictionary to a list and sort by creation time (newest first)
    job_list = []
    for job_id, job_data in JOBS.items():
        job_summary = {
            "jobId": job_id,
            "status": job_data.get("status", "unknown"),
            "progress": job_data.get("progress", 0),
            "createdAt": job_data.get("created_at"),
            "completedAt": job_data.get("completed_at"),
            "tenant": job_data.get("params", {}).get("tenant", "Unknown"),
        }
        
        # Add IFlow statistics if they exist
        if "completedIFlows" in job_data:
            job_summary["completedIFlows"] = job_data["completedIFlows"]
        if "totalIFlows" in job_data:
            job_summary["totalIFlows"] = job_data["totalIFlows"]
        
        job_list.append(job_summary)
    
    # Sort by creation time, newest first
    job_list.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    
    return job_list

@app.post('/sap/review/{job_id}/cancel')
async def cancel_job(job_id: str):
    """Cancel a running review job"""
    if job_id not in JOBS:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = JOBS[job_id]
    
    # Only pending or running jobs can be cancelled
    if job.get("status") not in ["pending", "running"]:
        raise HTTPException(
            status_code=400, 
            detail="Job cannot be cancelled - not in pending or running state"
        )
    
    # Mark the job as cancelled
    job["status"] = "cancelled"
    job["completed_at"] = datetime.now().isoformat()
    
    return {
        "jobId": job_id,
        "status": "cancelled",
        "message": "Job cancelled successfully"
    }

@app.get('/routes')
async def list_routes():
    """List all registered routes"""
    routes = []
    for route in app.routes:
        methods = [method for method in route.methods if method != "HEAD"]
        routes.append({
            "path": route.path,
            "name": route.name,
            "methods": methods
        })
    return routes

if __name__ == "__main__":
    # Note: For production use, run with:
    # uvicorn apiServer:app --host 0.0.0.0 --port 3001 --workers 4
    
    import uvicorn
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='SAP Integration Backend API Server - FastAPI Version')
    parser.add_argument('--port', type=int, default=3001, help='Port to run the server on')
    parser.add_argument('--host', type=str, default='0.0.0.0', help='Host to run the server on')
    parser.add_argument('--workers', type=int, default=1, help='Number of worker processes')
    parser.add_argument('--reload', action='store_true', help='Enable auto-reload for development')
    args = parser.parse_args()
    
    print(f"Starting SAP Integration Backend API Server on {args.host}:{args.port}")
    print(f"Number of workers: {args.workers}")
    print(f"Auto-reload: {args.reload}")
    print(f"SAP modules loaded: {HAS_SAP_MODULES}")
    
    # Set default parallel workers for all reviews
    os.environ["SAP_MAX_WORKERS"] = str(args.workers)
    
    # Start the server
    uvicorn.run(
        "apiServer:app", 
        host=args.host, 
        port=args.port, 
        reload=args.reload,
        workers=args.workers if not args.reload else 1  # When reload is enabled, only use 1 worker
    )


@app.post('/sap/review/batch')
async def submit_batch_review(review_requests: List[ReviewSubmissionModel], background_tasks: BackgroundTasks):
    """Submit multiple integration packages for review in batch"""
    batch_id = f"batch-{uuid.uuid4()}"
    job_ids = []
    
    # Create batch tracking entry
    JOBS[batch_id] = {
        "id": batch_id,
        "type": "batch",
        "status": "pending",
        "progress": 0,
        "created_at": datetime.now().isoformat(),
        "job_ids": [],
        "total_jobs": len(review_requests),
        "completed_jobs": 0
    }
    
    # Process each review request
    for i, review_request in enumerate(review_requests):
        data = review_request.dict()
        
        # Generate a unique job ID
        job_id = f"job-{batch_id}-{i}"
        
        # Store job information
        JOBS[job_id] = {
            "id": job_id,
            "batch_id": batch_id,
            "params": data,
            "status": "pending",
            "progress": 0,
            "created_at": datetime.now().isoformat(),
            "completedIFlows": 0,
            "totalIFlows": 0,
            "logs": []
        }
        
        # Add initial log
        JOBS[job_id]["logs"].append({
            "timestamp": datetime.now().isoformat(),
            "message": f"Job created as part of batch {batch_id}",
            "level": "info"
        })
        
        # Add to batch tracking
        JOBS[batch_id]["job_ids"].append(job_id)
        job_ids.append(job_id)
        
        # Start a background task to run the review
        background_tasks.add_task(run_review_job, job_id, data)
    
    # Start a background task to monitor the batch
    background_tasks.add_task(monitor_batch_progress, batch_id)
    
    return {
        "batchId": batch_id,
        "jobIds": job_ids,
        "status": "pending",
        "message": f"Batch review with {len(review_requests)} jobs submitted successfully"
    }

def monitor_batch_progress(batch_id):
    """Monitor the progress of a batch job"""
    if batch_id not in JOBS:
        print(f"Error: Batch {batch_id} not found")
        return
    
    batch = JOBS[batch_id]
    job_ids = batch.get("job_ids", [])
    
    # Get initial job count
    total_jobs = len(job_ids)
    if total_jobs == 0:
        print(f"Warning: Batch {batch_id} has no jobs")
        batch["status"] = "completed"
        batch["progress"] = 100
        batch["completed_at"] = datetime.now().isoformat()
        return
    
    # Set batch as running
    batch["status"] = "running"
    batch["progress"] = 0
    
    # Initial wait to give jobs time to start
    time.sleep(5)
    
    # Monitor loop
    while True:
        # Check if all jobs are completed or failed
        completed_count = 0
        failed_count = 0
        total_progress = 0
        
        for job_id in job_ids:
            if job_id in JOBS:
                job = JOBS[job_id]
                job_status = job.get("status", "unknown")
                
                if job_status in ["completed", "failed"]:
                    completed_count += 1
                    
                if job_status == "failed":
                    failed_count += 1
                
                total_progress += job.get("progress", 0)
        
        # Update batch status
        batch["completed_jobs"] = completed_count
        batch["failed_jobs"] = failed_count
        
        # Calculate average progress
        if total_jobs > 0:
            batch["progress"] = int(total_progress / total_jobs)
        
        # Check if all jobs are done
        if completed_count == total_jobs:
            if failed_count == total_jobs:
                batch["status"] = "failed"
            elif failed_count > 0:
                batch["status"] = "partially_completed"
            else:
                batch["status"] = "completed"
                
            batch["completed_at"] = datetime.now().isoformat()
            
            # Generate a combined report
            try:
                report_path = generate_batch_report(batch_id)
                batch["report_file"] = report_path
                print(f"Batch {batch_id} report generated at {report_path}")
            except Exception as e:
                print(f"Error generating batch report: {str(e)}")
                batch["report_error"] = str(e)
            
            break
        
        # If not done, wait before checking again
        time.sleep(10)

def generate_batch_report(batch_id):
    """Generate a consolidated report for a batch of reviews"""
    if batch_id not in JOBS:
        raise ValueError(f"Batch {batch_id} not found")
    
    batch = JOBS[batch_id]
    job_ids = batch.get("job_ids", [])
    
    # Collect all successfully completed jobs
    successful_jobs = []
    for job_id in job_ids:
        if job_id in JOBS and JOBS[job_id].get("status") == "completed":
            successful_jobs.append(JOBS[job_id])
    
    # If no successful jobs, create empty report
    if not successful_jobs:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        reports_dir = os.path.join("housekeeping", "reports")
        if not os.path.exists(reports_dir):
            os.makedirs(reports_dir)
            
        report_filename = os.path.join(reports_dir, f"batch_report_{batch_id}_{timestamp}.md")
        
        with open(report_filename, "w") as f:
            f.write(f"# Batch Review Report: {batch_id}\n\n")
            f.write(f"No successful reviews in this batch.\n\n")
            f.write(f"Total jobs: {len(job_ids)}\n")
            f.write(f"Failed jobs: {len(job_ids)}\n")
        
        return report_filename
    
    # Collect all iFlow reviews and packages
    all_iflow_reviews = []
    all_packages = set()
    
    for job in successful_jobs:
        result_file = job.get("result_file")
        if not result_file or not os.path.exists(result_file):
            continue
            
        # Read the report file
        with open(result_file, "r") as f:
            content = f.read()
            
        # Extract individual iFlow reviews
        sections = content.split("### IFlow:")
        
        # Skip the first section (header)
        if len(sections) > 1:
            for section in sections[1:]:
                if not section.strip():
                    continue
                    
                lines = section.strip().split("\n")
                iflow_name = lines[0].strip()
                review_content = "\n".join(lines[1:])
                
                all_iflow_reviews.append({
                    "iflow_name": iflow_name,
                    "review": review_content,
                    "job_id": job["id"]
                })
        
        # Get packages
        packages = job.get("params", {}).get("packages", [])
        all_packages.update(packages)
    
    # Generate a comprehensive report
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return generate_enhanced_report(
        all_iflow_reviews,
        list(all_packages),
        timestamp
    )

@app.get('/sap/review/batch/{batch_id}/status')
async def get_batch_status(batch_id: str):
    """Get the status of a batch review job"""
    if batch_id not in JOBS:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    batch = JOBS[batch_id]
    
    # Verify this is a batch
    if batch.get("type") != "batch":
        raise HTTPException(status_code=400, detail="Job is not a batch")
    
    # Prepare response
    response = {
        "batchId": batch_id,
        "status": batch.get("status", "unknown"),
        "progress": batch.get("progress", 0),
        "createdAt": batch.get("created_at"),
        "completedAt": batch.get("completed_at"),
        "totalJobs": batch.get("total_jobs", 0),
        "completedJobs": batch.get("completed_jobs", 0),
        "failedJobs": batch.get("failed_jobs", 0)
    }
    
    # Add job details
    job_ids = batch.get("job_ids", [])
    job_details = []
    
    for job_id in job_ids:
        if job_id in JOBS:
            job = JOBS[job_id]
            job_details.append({
                "jobId": job_id,
                "status": job.get("status", "unknown"),
                "progress": job.get("progress", 0)
            })
    
    response["jobs"] = job_details
    
    # Add report file if available
    if "report_file" in batch:
        response["reportFile"] = batch["report_file"]
    
    # Add report error if present
    if "report_error" in batch:
        response["reportError"] = batch["report_error"]
    
    return response

@app.get('/sap/review/batch/{batch_id}/download')
async def download_batch_report(batch_id: str, format: str = "md"):
    """Download the report file for a completed batch review job"""
    if batch_id not in JOBS:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    batch = JOBS[batch_id]
    
    # Verify this is a batch
    if batch.get("type") != "batch":
        raise HTTPException(status_code=400, detail="Job is not a batch")
    
    # Check status
    if batch.get("status") != "completed" and batch.get("status") != "partially_completed":
        raise HTTPException(status_code=400, detail="Batch not completed")
    
    # Check for report file
    result_file = batch.get("report_file")
    if not result_file or not os.path.exists(result_file):
        raise HTTPException(status_code=404, detail="Report file not found")
    
    # Get requested format
    format_param = format.lower()
    
    # If requesting HTML format, try to convert the markdown to HTML
    if format_param == 'html' and result_file.endswith('.md'):
        try:
            # Check if we have markdown library available
            import markdown
            
            with open(result_file, 'r') as f:
                md_content = f.read()
            
            # Convert to HTML
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>SAP Integration Batch Review - {batch_id}</title>
                <style>
                    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 900px; margin: 0 auto; color: #333; }}
                    h1, h2, h3 {{ color: #1a56db; }}
                    table {{ border-collapse: collapse; width: 100%; margin: 16px 0; }}
                    th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                    th {{ background-color: #f3f4f6; }}
                    tr:nth-child(even) {{ background-color: #f9fafb; }}
                    .high {{ color: #059669; }}
                    .medium {{ color: #d97706; }}
                    .low {{ color: #dc2626; }}
                    code {{ background-color: #f3f4f6; padding: 2px 5px; border-radius: 3px; font-family: monospace; }}
                    pre {{ background-color: #f3f4f6; padding: 12px; border-radius: 5px; overflow-x: auto; }}
                </style>
            </head>
            <body>
                {markdown.markdown(md_content, extensions=['tables', 'fenced_code'])}
            </body>
            </html>
            """
            
            # Return the HTML content directly
            return Response(
                content=html_content,
                media_type="text/html",
                headers={
                    "Content-Disposition": f"attachment; filename=sap_batch_review_{batch_id}.html"
                }
            )
                
        except ImportError:
            # If markdown library is not available, just return the original markdown file
            print("Markdown library not available - returning original file")
            pass
        except Exception as e:
            print(f"Error converting to HTML: {str(e)}")
            # Continue to return the original file
    
    # Return the original file as download
    return FileResponse(
        path=result_file,
        filename=f"sap_batch_review_{batch_id}.{format_param}",
        media_type="text/markdown" if format_param == "md" else "application/octet-stream"
    )


def setup_direct_logging():
    """Set up direct file logging that will definitely work"""
    # Create the log directory in the current folder
    current_dir = os.path.dirname(os.path.abspath(__file__))
    log_dir = os.path.join(current_dir, "direct_logs")
    
    if not os.path.exists(log_dir):
        try:
            os.makedirs(log_dir)
            print(f"Created log directory: {log_dir}")
        except Exception as e:
            print(f"Error creating log directory: {e}")
            # Fallback to current directory
            log_dir = current_dir
            print(f"Using current directory for logs: {log_dir}")
    
    # Create a timestamped log file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file = os.path.join(log_dir, f"sap_debug_{timestamp}.log")
    
    try:
        # Configure logger with file and console output
        logging.basicConfig(
            level=logging.DEBUG,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_file),
                logging.StreamHandler(sys.stdout)
            ]
        )
        print(f"Logging to file: {log_file}")
        logging.info(f"Direct logging initialized at {datetime.now().isoformat()}")
        logging.info(f"Log file: {log_file}")
        
        # Log system information for debugging
        logging.info(f"Python version: {sys.version}")
        logging.info(f"Current directory: {os.path.abspath('.')}")
        logging.info(f"Script directory: {current_dir}")
        
        return log_file
    except Exception as e:
        print(f"Error setting up logging: {e}")
        return None

# Create a direct debugging function
def debug_sap_connection(tenant_data):
    """Debug SAP connection issues"""
    log_file = setup_direct_logging()
    
    logging.info("=== SAP Connection Debugging Started ===")
    logging.info(f"Tenant: {tenant_data.get('name')}")
    
    # Import necessary modules
    try:
        import requests
        import json
        import base64
    except ImportError as e:
        logging.error(f"Missing required module: {e}")
        return f"Error: Missing module {e}"
    
    # Test authentication
    auth_url = tenant_data.get('authUrl')
    client_id = tenant_data.get('clientId')
    client_secret = tenant_data.get('clientSecret')
    api_url = tenant_data.get('apiUrl')
    
    logging.info(f"Auth URL: {auth_url}")
    logging.info(f"API URL: {api_url}")
    logging.info(f"Client ID: {client_id}")
    logging.info(f"Client Secret: {'*' * 10}")  # Don't log actual secret
    
    if not all([auth_url, client_id, client_secret, api_url]):
        missing = []
        if not auth_url: missing.append("authUrl")
        if not client_id: missing.append("clientId")
        if not client_secret: missing.append("clientSecret")
        if not api_url: missing.append("apiUrl")
        
        error_msg = f"Missing required parameters: {', '.join(missing)}"
        logging.error(error_msg)
        return error_msg
    
    # Get authentication token
    try:
        logging.info(f"Getting token from {auth_url}")
        
        # Create basic auth header
        auth_str = f"{client_id}:{client_secret}"
        auth_b64 = base64.b64encode(auth_str.encode()).decode()
        
        headers = {
            "Authorization": f"Basic {auth_b64}",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        
        data = {
            "grant_type": "client_credentials"
        }
        
        response = requests.post(auth_url, headers=headers, data=data, timeout=30)
        
        logging.info(f"Token response status: {response.status_code}")
        
        if response.status_code != 200:
            error_msg = f"Authentication failed: {response.status_code} - {response.text}"
            logging.error(error_msg)
            return error_msg
        
        token_data = response.json()
        
        if "access_token" not in token_data:
            error_msg = f"Token response missing access_token: {token_data}"
            logging.error(error_msg)
            return error_msg
        
        token = token_data["access_token"]
        logging.info(f"Successfully obtained token (first 10 chars): {token[:10]}...")
        
        # Now try to get the package
        package_id = "00TESTPACK"
        logging.info(f"Testing access to package: {package_id}")
        
        # Try different URL formats
        urls_to_try = [
            f"{api_url}/api/v1/IntegrationPackages('{package_id}')",
            f"{api_url}/api/v1/IntegrationPackages?$filter=Id eq '{package_id}'"
        ]
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json"
        }
        
        package_found = False
        
        for url in urls_to_try:
            try:
                logging.info(f"Trying URL: {url}")
                
                response = requests.get(url, headers=headers)
                
                logging.info(f"Response status: {response.status_code}")
                
                # Log full response for debugging
                response_file = os.path.join(os.path.dirname(log_file), f"package_response_{urls_to_try.index(url)}.json")
                with open(response_file, "w") as f:
                    f.write(response.text)
                logging.info(f"Full response saved to: {response_file}")
                
                if response.status_code == 200:
                    package_found = True
                    logging.info(f"Successfully accessed package using URL: {url}")
                    
                    # Try to get IFlows
                    iflows_url = f"{api_url}/api/v1/IntegrationPackages('{package_id}')/IntegrationDesigntimeArtifacts"
                    logging.info(f"Getting IFlows from: {iflows_url}")
                    
                    iflows_response = requests.get(iflows_url, headers=headers)
                    
                    logging.info(f"IFlows response status: {iflows_response.status_code}")
                    
                    # Log full IFlows response
                    iflows_file = os.path.join(os.path.dirname(log_file), "iflows_response.json")
                    with open(iflows_file, "w") as f:
                        f.write(iflows_response.text)
                    logging.info(f"Full IFlows response saved to: {iflows_file}")
                    
                    if iflows_response.status_code == 200:
                        try:
                            iflows_data = iflows_response.json()
                            
                            if "d" in iflows_data and "results" in iflows_data["d"]:
                                iflows = iflows_data["d"]["results"]
                                logging.info(f"Found {len(iflows)} IFlows in package")
                                
                                # Look for specific IFlow
                                iflow_id = "SF_EC_ORG_copy"
                                iflow_found = False
                                
                                for iflow in iflows:
                                    if iflow.get("Id") == iflow_id or iflow.get("Name") == iflow_id:
                                        iflow_found = True
                                        logging.info(f"Found IFlow: {iflow_id}")
                                        logging.info(f"IFlow details: {json.dumps(iflow, indent=2)}")
                                        break
                                
                                if not iflow_found:
                                    logging.warning(f"IFlow {iflow_id} not found in package")
                            else:
                                logging.warning(f"Invalid IFlows response format: {iflows_data.keys()}")
                        except Exception as e:
                            logging.error(f"Error parsing IFlows response: {str(e)}")
                    else:
                        logging.error(f"Failed to get IFlows: {iflows_response.status_code} - {iflows_response.text}")
                    
                    break
            except Exception as e:
                logging.error(f"Error accessing URL {url}: {str(e)}")
        
        if not package_found:
            logging.error(f"Package {package_id} not found using any URL")
            return f"Error: Package {package_id} not found"
        
        return "SAP connection debugging completed successfully, check log file for details"
        
    except Exception as e:
        error_msg = f"Error testing SAP connection: {str(e)}"
        logging.error(error_msg)
        traceback.print_exc()
        return error_msg
    
# Add this function to help debug the extraction process
def debug_extract_all_iflows(job_id, review_params):
    """Debug the extraction of all IFlows from a package"""
    log_file = setup_direct_logging()
    
    logging.info("=== Debug Extract All IFlows Started ===")
    logging.info(f"Job ID: {job_id}")
    logging.info(f"Review params: {json.dumps(review_params, default=str)}")
    
    # Create SAPConnection
    try:
        from sap_tools import SAPConnection
        
        tenant_data = review_params.get('tenant_data', {})
        
        sap_conn = SAPConnection(
            base_url=tenant_data.get('apiUrl', ''),
            auth_url=tenant_data.get('authUrl', ''),
            client_id=tenant_data.get('clientId', ''),
            client_secret=tenant_data.get('clientSecret', '')
        )
        
        logging.info("SAPConnection created successfully")
        
        # Set package ID
        packages = review_params.get('packages', [])
        if not packages:
            logging.error("No packages specified")
            return "Error: No packages specified"
        
        package_id = packages[0]
        sap_conn.current_package_id = package_id
        logging.info(f"Set current_package_id to: {package_id}")
        
        # Extract all IFlows
        logging.info(f"Extracting all IFlows from package: {package_id}")
        
        # Replace this with the actual extraction code
        extraction_result = sap_conn.extract_all_iflows_from_package()
        
        # Log the result
        logging.info(f"Extraction result: {extraction_result}")
        
        return extraction_result
    except Exception as e:
        error_msg = f"Error in debug_extract_all_iflows: {str(e)}"
        logging.error(error_msg)
        traceback.print_exc()
        return error_msg