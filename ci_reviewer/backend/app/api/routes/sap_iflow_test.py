"""
SAP IFlow Testing Routes - Updated for new structure
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Dict, List, Any, Optional
import httpx
import json
import time
import logging
from datetime import datetime

router = APIRouter()
logger = logging.getLogger(__name__)


class TenantData(BaseModel):
    """Tenant data model for testing"""
    id: str
    name: str
    authUrl: str
    apiUrl: str
    clientId: str
    clientSecret: str


class TestConfig(BaseModel):
    """Test configuration model"""
    method: str
    target_url: str
    request_payload: Optional[str] = None
    connection_config: Dict[str, Any]


class IFlowTestRequest(BaseModel):
    """IFlow test request model"""
    tenant: str
    tenant_data: TenantData
    iflow_id: str
    test_config: TestConfig


class IFlowTestResponse(BaseModel):
    """IFlow test response model"""
    success: bool
    status_code: int
    response_data: Any
    execution_time: int
    error: Optional[str] = None
    timestamp: str


async def get_oauth_token(auth_config: Dict[str, Any]) -> str:
    """Get OAuth token for authentication"""
    try:
        token_url = auth_config.get('token_url') or f"{auth_config['authUrl']}/oauth/token"
        
        token_data = {
            'grant_type': 'client_credentials',
            'client_id': auth_config['client_id'],
            'client_secret': auth_config['client_secret']
        }
        
        if 'scope' in auth_config:
            token_data['scope'] = auth_config['scope']
        
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                token_url,
                data=token_data,
                headers={'Content-Type': 'application/x-www-form-urlencoded'},
                timeout=30.0
            )
            
            if token_response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Failed to obtain OAuth token: {token_response.text}"
                )
            
            token_json = token_response.json()
            return token_json['access_token']
            
    except Exception as e:
        logger.error(f"Error getting OAuth token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}"
        )


async def execute_iflow_test(test_request: IFlowTestRequest) -> IFlowTestResponse:
    """Execute the iFlow test with the provided configuration"""
    start_time = time.time()
    
    try:
        # Get OAuth token
        connection_config = test_request.test_config.connection_config
        
        # Prepare authentication
        if connection_config.get('auth_type') == 'oauth':
            token = await get_oauth_token(connection_config)
            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            }
        elif connection_config.get('auth_type') == 'basic':
            auth = (connection_config['username'], connection_config['password'])
            headers = {'Content-Type': 'application/json'}
        else:
            # Use tenant credentials as fallback
            auth = (test_request.tenant_data.clientId, test_request.tenant_data.clientSecret)
            headers = {'Content-Type': 'application/json'}
        
        # Add custom headers if provided
        if 'headers' in connection_config:
            headers.update(connection_config['headers'])
        
        # Prepare request data
        method = test_request.test_config.method.upper()
        url = test_request.test_config.target_url
        
        # Parse request payload if provided
        request_data = None
        if test_request.test_config.request_payload and method != 'GET':
            try:
                request_data = json.loads(test_request.test_config.request_payload)
            except json.JSONDecodeError:
                # If it's not valid JSON, send as string
                request_data = test_request.test_config.request_payload
                headers['Content-Type'] = 'text/plain'
        
        # Execute the HTTP request
        async with httpx.AsyncClient() as client:
            request_kwargs = {
                'method': method,
                'url': url,
                'headers': headers,
                'timeout': 60.0
            }
            
            # Add authentication
            if 'auth' in locals():
                request_kwargs['auth'] = auth
            
            # Add request data for non-GET requests
            if request_data is not None and method != 'GET':
                if headers.get('Content-Type') == 'application/json':
                    request_kwargs['json'] = request_data
                else:
                    request_kwargs['content'] = str(request_data)
            
            # Add query parameters for GET requests
            if method == 'GET' and request_data:
                request_kwargs['params'] = request_data
            
            response = await client.request(**request_kwargs)
            
            execution_time = int((time.time() - start_time) * 1000)
            
            # Parse response
            try:
                response_data = response.json()
            except:
                response_data = response.text
            
            return IFlowTestResponse(
                success=response.status_code < 400,
                status_code=response.status_code,
                response_data=response_data,
                execution_time=execution_time,
                timestamp=datetime.now().isoformat()
            )
            
    except httpx.TimeoutException:
        execution_time = int((time.time() - start_time) * 1000)
        return IFlowTestResponse(
            success=False,
            status_code=408,
            response_data=None,
            execution_time=execution_time,
            error="Request timeout",
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        execution_time = int((time.time() - start_time) * 1000)
        logger.error(f"Error executing iFlow test: {str(e)}")
        return IFlowTestResponse(
            success=False,
            status_code=500,
            response_data=None,
            execution_time=execution_time,
            error=str(e),
            timestamp=datetime.now().isoformat()
        )


@router.post("/iflow/test", response_model=IFlowTestResponse)
async def test_iflow(test_request: IFlowTestRequest):
    """
    Test an iFlow with the provided configuration
    
    This endpoint allows testing of SAP Integration Suite iFlows by executing
    HTTP requests against their endpoints with proper authentication.
    """
    try:
        logger.info(f"Testing iFlow {test_request.iflow_id} for tenant {test_request.tenant}")
        
        # Validate request
        if not test_request.test_config.target_url:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Target URL is required"
            )
        
        if not test_request.test_config.connection_config:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Connection configuration is required"
            )
        
        # Execute the test
        result = await execute_iflow_test(test_request)
        
        logger.info(f"iFlow test completed for {test_request.iflow_id}: "
                   f"Status {result.status_code}, Time {result.execution_time}ms")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in iFlow test: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.post("/iflow/test/validate-config")
async def validate_connection_config(config: Dict[str, Any]):
    """
    Validate connection configuration without executing a test
    """
    try:
        required_fields = ['auth_type']
        
        if config.get('auth_type') == 'oauth':
            required_fields.extend(['client_id', 'client_secret', 'authUrl'])
        elif config.get('auth_type') == 'basic':
            required_fields.extend(['username', 'password'])
        
        missing_fields = [field for field in required_fields if not config.get(field)]
        
        if missing_fields:
            return {
                "valid": False,
                "error": f"Missing required fields: {', '.join(missing_fields)}"
            }
        
        # Test authentication if OAuth
        if config.get('auth_type') == 'oauth':
            try:
                await get_oauth_token(config)
                return {"valid": True, "message": "OAuth authentication successful"}
            except Exception as e:
                return {"valid": False, "error": f"OAuth validation failed: {str(e)}"}
        
        return {"valid": True, "message": "Configuration is valid"}
        
    except Exception as e:
        return {"valid": False, "error": f"Validation error: {str(e)}"}