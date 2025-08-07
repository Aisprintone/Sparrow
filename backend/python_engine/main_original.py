"""
Main entry point for Railway deployment.
Imports and runs the FastAPI application from api/main.py
"""

import uvicorn
import os
import sys
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    # Import the app from api.main
    from api.main import app
    logger.info("Successfully imported FastAPI app from api.main")
except ImportError as e:
    logger.error(f"Failed to import FastAPI app: {e}")
    import traceback
    logger.error(f"Full traceback: {traceback.format_exc()}")
    
    # Create a minimal app for health checks
    try:
        from fastapi import FastAPI
        from fastapi.responses import JSONResponse
        app = FastAPI(title="Financial Simulation API (Fallback)", version="1.0.0")
        
        @app.get("/")
        async def root():
            return {"message": "Financial Simulation API (Fallback Mode)", "version": "1.0.0", "error": "Main API failed to load"}
        
        @app.get("/health")
        async def health_check():
            return {"status": "degraded", "error": "Main app failed to load"}
        
        logger.info("Created fallback FastAPI app")
    except Exception as fallback_error:
        logger.error(f"Even fallback app creation failed: {fallback_error}")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    
    logger.info(f"Starting server on {host}:{port}")
    uvicorn.run(app, host=host, port=port, log_level="info")
# Force redeploy Thu Aug  7 10:07:39 EDT 2025
