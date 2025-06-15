#!/usr/bin/env python3
"""
SAP Integration Backend API Server - Fixed Structure
"""

import os
import sys
import argparse
import logging
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Add current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

def create_app() -> FastAPI:
    """Create and configure the FastAPI application"""
    
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

    # Basic routes (import others later)
    @app.get("/")
    async def root():
        return {
            "message": "SAP Integration Review API",
            "version": "2.0.0",
            "status": "running",
            "timestamp": datetime.now().isoformat()
        }

    @app.get("/api/health")
    async def health_check():
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "python_path": sys.path[:3],
            "working_directory": os.getcwd()
        }

    # Try to import route modules, but don't fail if they don't exist
    try:
        from app.api.routes.health import router as health_router
        app.include_router(health_router, prefix="/api", tags=["Health"])
        logger.info("✅ Loaded health routes")
    except ImportError as e:
        logger.warning(f"⚠️ Could not load health routes: {e}")

    try:
        from app.api.routes.sap_extraction import router as extraction_router
        app.include_router(extraction_router, prefix="/sap", tags=["SAP Extraction"])
        logger.info("✅ Loaded extraction routes")
    except ImportError as e:
        logger.warning(f"⚠️ Could not load extraction routes: {e}")

    try:
        from app.api.routes.sap_review import router as review_router
        app.include_router(review_router, prefix="/sap", tags=["SAP Review"])
        logger.info("✅ Loaded review routes")
    except ImportError as e:
        logger.warning(f"⚠️ Could not load review routes: {e}")

    try:
        from app.api.routes.sap_iflow_test import router as test_router
        app.include_router(test_router, prefix="/sap", tags=["SAP Testing"])
        logger.info("✅ Loaded test routes")
    except ImportError as e:
        logger.warning(f"⚠️ Could not load test routes: {e}")

    try:
        from app.api.routes.analysis import router as analysis_router
        app.include_router(analysis_router, prefix="/sap", tags=["SAP Analysis"])
        logger.info("✅ Loaded analysis routes")
    except ImportError as e:
        logger.warning(f"⚠️ Could not load analysis routes: {e}")

    # Add startup event
    @app.on_event("startup")
    async def startup_event():
        logger.info("SAP Integration Backend API Server starting up...")
        
        # Create required directories
        directories = [
            "housekeeping/reports",
            "housekeeping/feedback", 
            "housekeeping/extracted_packages",
            "logs",
            "guidelines"
        ]
        
        for directory in directories:
            os.makedirs(directory, exist_ok=True)
        
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
