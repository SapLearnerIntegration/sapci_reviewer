"""
Configuration Service for SAP Integration API
"""

import os
from typing import Dict, Any, Optional


class ConfigService:
    """Service for managing application configuration"""
    
    def __init__(self):
        self.reports_dir = os.path.join("housekeeping", "reports")
        self.logs_dir = os.path.join("logs")
        self.feedback_dir = os.path.join("housekeeping", "feedback")
        self.storage_dir = os.path.join("housekeeping", "extracted_packages")
        self.iflow_dir = os.path.join("housekeeping", "iflows_response")
        
        # SAP connection settings from environment
        self.sap_config = {
            "auth_url": os.getenv("SAP_AUTH_URL"),
            "client_id": os.getenv("SAP_CLIENT_ID"),
            "client_secret": os.getenv("SAP_CLIENT_SECRET"),
            "integration_url": os.getenv("SAP_INTEGRATION_URL"),
        }
    
    def ensure_directories(self) -> None:
        """Ensure all required directories exist"""
        directories = [
            self.reports_dir,
            self.logs_dir,
            self.feedback_dir,
            self.storage_dir,
            self.iflow_dir
        ]
        
        for directory in directories:
            os.makedirs(directory, exist_ok=True)
    
    def get_sap_config(self) -> Dict[str, Optional[str]]:
        """Get SAP configuration"""
        return self.sap_config.copy()
    
    def get_reports_dir(self) -> str:
        """Get reports directory path"""
        return self.reports_dir
    
    def get_logs_dir(self) -> str:
        """Get logs directory path"""
        return self.logs_dir
    
    def get_feedback_dir(self) -> str:
        """Get feedback directory path"""
        return self.feedback_dir
    
    def get_storage_dir(self) -> str:
        """Get storage directory path"""
        return self.storage_dir
    def get_iflow_dir(self) -> str:
        """Get iflow response directory path"""
        return self.iflow_dir