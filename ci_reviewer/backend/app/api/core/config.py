"""
Configuration settings for the SAP Integration API
"""
import os
from typing import List
from pydantic import BaseSettings


class Settings(BaseSettings):
    """Application settings"""
    
    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 3001
    DEBUG: bool = False
    ENVIRONMENT: str = "development"
    
    # CORS settings
    ALLOWED_ORIGINS: List[str] = ["*"]
    
    # API settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "SAP Integration Review API"
    
    # SAP settings - these can be overridden by tenant data
    SAP_AUTH_URL: str = ""
    SAP_CLIENT_ID: str = ""
    SAP_CLIENT_SECRET: str = ""
    SAP_INTEGRATION_URL: str = ""
    SAP_MAX_WORKERS: int = 4
    
    # File paths
    REPORTS_DIR: str = os.path.join("housekeeping", "reports")
    LOGS_DIR: str = os.path.join("logs")
    GUIDELINES_DIR: str = os.path.join("guidelines")
    
    # Timeouts and limits
    HTTP_TIMEOUT: int = 60
    MAX_REQUEST_SIZE: int = 10 * 1024 * 1024  # 10MB
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    class Config:
        env_file = ".env"
        case_sensitive = True


def get_settings() -> Settings:
    """Get application settings"""
    return Settings()