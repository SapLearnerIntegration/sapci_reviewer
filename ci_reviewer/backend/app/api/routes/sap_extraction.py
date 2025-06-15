"""
SAP Extraction Routes
"""

import os
import json
import logging
import traceback
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from app.api.models.sap_models import PackageSearchModel, IFlowExtractionModel, TenantModel
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
        
        # Get authentication token first
        token = sap_conn.get_token()
        logger.info(f"Successfully obtained token: {token[:10]}...")
        
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
    
    except Exception as e:
        logger.error(f"Error searching packages: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/extraction/extract_iflows')
async def extract_iflows(extraction_request: IFlowExtractionModel):
    """Extract IFlows for a package with improved error handling"""
    
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
        
        # Get authentication token first
        try:
            token = sap_conn.get_token()
            logger.info(f"Successfully obtained token: {token[:10]}...")
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