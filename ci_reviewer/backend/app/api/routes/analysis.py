"""
Analysis Routes for SAP Integration API
"""

import logging
from fastapi import APIRouter, HTTPException
from datetime import datetime

from app.api.models.sap_models import AnalysisRequestModel
from app.services.analysis_engine import IntegrationAnalysisEngine
from app.services.sap_tools import SAPConnection

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post('/analysis/comprehensive')
async def run_comprehensive_analysis(request: AnalysisRequestModel):
    """Run comprehensive analysis on SAP integration artifacts"""
    
    logger.info(f"Starting comprehensive analysis for tenant: {request.tenant}")
    
    try:
        # Create SAP connection
        sap_conn = SAPConnection(
            base_url=request.tenant_data.apiUrl,
            auth_url=request.tenant_data.authUrl,
            client_id=request.tenant_data.clientId,
            client_secret=request.tenant_data.clientSecret
        )
        
        # Collect tenant data for analysis
        tenant_data = {
            "id": request.tenant_data.id,
            "name": request.tenant_data.name,
            "packages": [],
            "iflows": [],
            "valueMappings": []
        }
        
        # Extract package and IFlow data
        for package_id in request.packages:
            logger.info(f"Extracting data from package: {package_id}")
            
            # Get package details
            package_details_json = sap_conn.get_package_details(package_id)
            
            try:
                import json
                package_details = json.loads(package_details_json)
                
                if "error" not in package_details:
                    # Add package info
                    package_info = {
                        "id": package_id,
                        "name": package_details.get("Name", package_id),
                        "description": package_details.get("Description", ""),
                        "version": package_details.get("Version", "")
                    }
                    tenant_data["packages"].append(package_info)
                    
                    # Add IFlow info if available
                    if "IFlows" in package_details:
                        for iflow in package_details["IFlows"]:
                            iflow_info = {
                                "id": iflow.get("Id", ""),
                                "name": iflow.get("Name", ""),
                                "description": iflow.get("Description", ""),
                                "version": iflow.get("Version", ""),
                                "package_id": package_id,
                                "deployed": iflow.get("DeploymentStatus") == "DEPLOYED",
                                "analysis": {}  # Placeholder for analysis results
                            }
                            tenant_data["iflows"].append(iflow_info)
                
            except json.JSONDecodeError:
                logger.error(f"Failed to parse package details for {package_id}")
                continue
        
        # Run analysis
        analysis_engine = IntegrationAnalysisEngine(tenant_data)
        analysis_results = analysis_engine.run_comprehensive_analysis()
        
        logger.info(f"Analysis completed for {len(tenant_data['iflows'])} IFlows")
        
        return {
            "success": True,
            "analysis_results": analysis_results,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in comprehensive analysis: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )


@router.post('/analysis/security')
async def run_security_analysis(request: AnalysisRequestModel):
    """Run security-focused analysis"""
    
    logger.info(f"Starting security analysis for tenant: {request.tenant}")
    
    try:
        # This would be a simplified version focusing only on security
        # For now, delegate to comprehensive analysis and filter results
        comprehensive_request = AnalysisRequestModel(
            tenant=request.tenant,
            tenant_data=request.tenant_data,
            packages=request.packages,
            analysis_type="security"
        )
        
        full_analysis = await run_comprehensive_analysis(comprehensive_request)
        
        # Extract security-specific results
        security_results = {
            "security_analysis": full_analysis["analysis_results"].get("security_analysis", {}),
            "recommendations": {
                "security": full_analysis["analysis_results"].get("recommendations", {}).get("high_priority", [])
            }
        }
        
        return {
            "success": True,
            "security_results": security_results,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in security analysis: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Security analysis failed: {str(e)}"
        )


@router.post('/analysis/compliance')
async def run_compliance_analysis(request: AnalysisRequestModel):
    """Run compliance-focused analysis"""
    
    logger.info(f"Starting compliance analysis for tenant: {request.tenant}")
    
    try:
        # Similar to security analysis, but focused on compliance
        comprehensive_request = AnalysisRequestModel(
            tenant=request.tenant,
            tenant_data=request.tenant_data,
            packages=request.packages,
            analysis_type="compliance"
        )
        
        full_analysis = await run_comprehensive_analysis(comprehensive_request)
        
        # Extract compliance-specific results
        compliance_results = {
            "compliance_analysis": full_analysis["analysis_results"].get("compliance_analysis", {}),
            "recommendations": {
                "compliance": full_analysis["analysis_results"].get("recommendations", {}).get("medium_priority", [])
            }
        }
        
        return {
            "success": True,
            "compliance_results": compliance_results,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in compliance analysis: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Compliance analysis failed: {str(e)}"
        )