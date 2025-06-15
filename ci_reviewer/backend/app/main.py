#!/usr/bin/env python
"""
Main SAP Integration Backend API Server - Restructured

This is the main FastAPI application that orchestrates all the different modules.
"""

import os
import argparse
import logging
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import route modules
from app.api.routes.sap_extraction import router as extraction_router
from app.api.routes.sap_review import router as review_router
from app.api.routes.sap_iflow_test import router as test_router
from app.api.routes.sap_version_history import router as version_router
from app.api.routes.health import router as health_router
# from app.api.routes.analysis import router as analysis_router

# Import services
from app.api.services.logging_service import LoggingService
from app.api.services.config_service import ConfigService

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

def create_app() -> FastAPI:
    """Create and configure the FastAPI application"""
    
    # Initialize configuration
    config = ConfigService()
    
    # Create FastAPI app
    app = FastAPI(
        title="SAP Integration Review API",
        description="API for SAP Integration Package Review, Testing, and Analysis",
        version="2.0.0",
        docs_url="/",  # Swagger UI at root
    )

    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include routers with prefixes
    app.include_router(health_router, prefix="/api", tags=["Health"])
    app.include_router(extraction_router, prefix="/sap", tags=["SAP Extraction"])
    app.include_router(review_router, prefix="/sap", tags=["SAP Review"])
    app.include_router(test_router, prefix="/sap", tags=["SAP Testing"])
    # app.include_router(analysis_router, prefix="/sap", tags=["SAP Analysis"])
    app.include_router(version_router, prefix="/sap", tags=["SAP Version"])

    # Add startup event
    @app.on_event("startup")
    async def startup_event():
        logger.info("SAP Integration Backend API Server starting up...")
        
        # Initialize logging service
        logging_service = LoggingService()
        logging_service.setup_logging()
        
        # Create required directories
        config.ensure_directories()
        
        logger.info("Server startup complete")

    return app

# Create the app instance
app = create_app()

if __name__ == "__main__":
    import uvicorn
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='SAP Integration Backend API Server')
    parser.add_argument('--port', type=int, default=3001, help='Port to run the server on')
    parser.add_argument('--host', type=str, default='0.0.0.0', help='Host to run the server on')
    parser.add_argument('--workers', type=int, default=1, help='Number of worker processes')
    parser.add_argument('--reload', action='store_true', help='Enable auto-reload for development')
    args = parser.parse_args()
    
    logger.info(f"Starting SAP Integration Backend API Server on {args.host}:{args.port}")
    logger.info(f"Workers: {args.workers}, Auto-reload: {args.reload}")
    
    # Start the server
    uvicorn.run(
        "main:app", 
        host=args.host, 
        port=args.port, 
        reload=args.reload,
        workers=args.workers if not args.reload else 1
    )