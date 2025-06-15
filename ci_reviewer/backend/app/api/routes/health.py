"""
Health Check Routes for SAP Integration API
"""

from fastapi import APIRouter, HTTPException
from datetime import datetime
from typing import Dict, Any

from app.api.models.sap_models import HealthCheckResponse, TestConnectionModel
from app.api.services.config_service import ConfigService

router = APIRouter()


@router.get('/health', response_model=HealthCheckResponse)
async def health_check():
    """Comprehensive health check endpoint"""
    
    config = ConfigService()
    
    # Check if SAP modules can be imported
    sap_modules_loaded = False
    try:
        from app.services.sap_tools import SAPConnection
        from app.services.sap_integration_reviewer import generate_enhanced_report
        sap_modules_loaded = True
    except ImportError:
        pass
    
    # Check service statuses
    services = {
        "config_service": "healthy",
        "logging_service": "healthy",
        "file_system": "healthy"
    }
    
    # Check if required directories exist
    try:
        config.ensure_directories()
    except Exception:
        services["file_system"] = "error"
    
    return HealthCheckResponse(
        status="healthy" if all(s == "healthy" for s in services.values()) else "degraded",
        timestamp=datetime.now().isoformat(),
        sap_modules_loaded=sap_modules_loaded,
        services=services
    )


@router.post('/test-connection')
async def test_sap_connection(request: TestConnectionModel):
    """Test SAP connection without performing operations"""
    
    try:
        from app.services.sap_tools import SAPConnection
        
        # Create connection with provided credentials
        sap_conn = SAPConnection(
            base_url=request.tenant_data.apiUrl,
            auth_url=request.tenant_data.authUrl,
            client_id=request.tenant_data.clientId,
            client_secret=request.tenant_data.clientSecret
        )
        
        # Try to get a token (this tests authentication)
        token = sap_conn.get_token()
        
        return {
            "success": True,
            "message": "SAP connection successful",
            "timestamp": datetime.now().isoformat(),
            "token_prefix": token[:10] + "..." if token else None
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"SAP connection failed: {str(e)}"
        )


@router.get('/routes')
async def list_routes():
    """List all registered routes for debugging"""
    # This would typically be implemented at the app level
    # For now, return a simple response
    return {
        "message": "Route listing available in main application",
        "timestamp": datetime.now().isoformat()
    }