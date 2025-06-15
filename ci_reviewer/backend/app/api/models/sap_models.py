"""
Pydantic models for SAP Integration API
"""

from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional, Union
from datetime import datetime


class TenantModel(BaseModel):
    """Model for SAP tenant configuration"""
    id: str = Field(..., description="Tenant ID")
    name: str = Field(..., description="Tenant Name")
    authUrl: str = Field(..., description="Authentication URL")
    apiUrl: str = Field(..., description="API URL")
    clientId: str = Field(..., description="Client ID")
    clientSecret: str = Field(..., description="Client Secret")


class PackageSearchModel(BaseModel):
    """Model for package search requests"""
    tenant: str = Field(..., description="Tenant Name")
    tenant_data: TenantModel = Field(..., description="Tenant Connection Details")
    query: str = Field('*', description="Search query")


class IFlowExtractionModel(BaseModel):
    """Model for IFlow extraction requests"""
    tenant: str = Field(..., description="Tenant Name")
    tenant_data: TenantModel = Field(..., description="Tenant Connection Details")
    package: str = Field(..., description="Package ID to extract IFlows from")


class ReviewSubmissionModel(BaseModel):
    """Model for review submission requests"""
    tenant: str = Field(..., description="Tenant Name")
    tenant_data: TenantModel = Field(..., description="Tenant Connection Details")
    packages: List[str] = Field(..., description="Package IDs to review")
    iflowSelections: Optional[Dict[str, Union[str, List[str]]]] = Field(
        None, description="Selected IFlows per package"
    )
    guideline: str = Field(..., description="Design guideline to apply")
    model: str = Field(..., description="LLM model to use")


class ReviewStatusModel(BaseModel):
    """Model for review status responses"""
    jobId: str = Field(..., description="Job ID")
    status: str = Field(..., description="Job status")
    progress: int = Field(..., description="Job progress percentage")
    createdAt: Optional[str] = Field(None, description="Job creation timestamp")
    completedAt: Optional[str] = Field(None, description="Job completion timestamp")
    completedIFlows: Optional[int] = Field(None, description="Number of completed IFlow reviews")
    totalIFlows: Optional[int] = Field(None, description="Total number of IFlows to review")


class JobModel(BaseModel):
    """Model for background job tracking"""
    id: str
    params: Dict[str, Any]
    status: str
    progress: int
    created_at: str
    completed_at: Optional[str] = None
    completedIFlows: int = 0
    totalIFlows: int = 0
    logs: List[Dict[str, str]] = []
    result_file: Optional[str] = None
    error: Optional[str] = None


class AnalysisRequestModel(BaseModel):
    """Model for analysis requests"""
    tenant: str = Field(..., description="Tenant Name")
    tenant_data: TenantModel = Field(..., description="Tenant Connection Details")
    packages: List[str] = Field(..., description="Package IDs to analyze")
    analysis_type: str = Field(
        "comprehensive", 
        description="Type of analysis to perform"
    )


class TestConnectionModel(BaseModel):
    """Model for connection testing"""
    tenant_data: TenantModel = Field(..., description="Tenant Connection Details")


class JobModel(BaseModel):
    """Model for background job tracking"""
    id: str
    params: Dict[str, Any]
    status: str
    progress: int
    created_at: str
    completed_at: Optional[str] = None
    completedIFlows: int = 0
    totalIFlows: int = 0
    logs: List[Dict[str, str]] = []
    result_file: Optional[str] = None
    error: Optional[str] = None


class HealthCheckResponse(BaseModel):
    """Model for health check responses"""
    status: str
    timestamp: str
    sap_modules_loaded: bool
    services: Dict[str, str]