"""
Simplified main file for Railway deployment with RAG endpoints
"""

import os
import sys
import logging
import traceback

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    # Import FastAPI basics first
    from fastapi import FastAPI, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import JSONResponse
    from datetime import datetime
    logger.info("✅ FastAPI imports successful")
    
    # Try to import our RAG system
    from rag.profile_rag_system import get_rag_manager
    logger.info("✅ RAG system imported successfully")
    
    # Try to import CSV loader
    from data.csv_loader import CSVDataLoader
    logger.info("✅ CSV loader imported successfully")
    
    # Initialize app
    app = FastAPI(title="FinanceAI with RAG System", version="3.0.0")
    
    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Initialize components
    data_loader = CSVDataLoader()
    rag_manager = get_rag_manager()
    logger.info("✅ All components initialized")
    
    @app.get("/")
    async def root():
        return {
            "message": "FinanceAI with RAG System",
            "version": "3.0.0",
            "status": "operational",
            "timestamp": datetime.now().isoformat()
        }
    
    @app.get("/health")
    async def health_check():
        return {
            "status": "healthy",
            "components": {
                "rag_system": "operational",
                "data_loader": "operational"
            },
            "timestamp": datetime.now().isoformat()
        }
    
    @app.get("/rag/profiles/summary")
    async def get_all_profile_summaries():
        """Get summaries of all profile RAG systems."""
        try:
            if rag_manager is None:
                raise HTTPException(status_code=500, detail="RAG manager not initialized")
            
            summaries = rag_manager.get_all_profile_summaries()
            
            return {
                "success": True,
                "profile_summaries": summaries
            }
            
        except Exception as e:
            logger.error(f"Failed to get profile summaries: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    @app.post("/rag/query/{profile_id}")
    async def query_profile_rag(profile_id: int, request: dict):
        """Query the RAG system for a specific profile."""
        try:
            if rag_manager is None:
                raise HTTPException(status_code=500, detail="RAG manager not initialized")
            
            query = request.get("query", "")
            tool_name = request.get("tool_name")
            
            result = rag_manager.query_profile(profile_id, query, tool_name)
            
            return {
                "success": True,
                "profile_id": profile_id,
                "query": query,
                "result": result
            }
            
        except Exception as e:
            logger.error(f"RAG query failed for profile {profile_id}: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    @app.get("/test-deployment")
    async def test_deployment():
        """Test endpoint to verify new deployment is active."""
        return {
            "status": "NEW_DEPLOYMENT_ACTIVE",
            "version": "3.0.0",
            "timestamp": datetime.now().isoformat(),
            "rag_status": "initialized" if rag_manager else "not_initialized"
        }
    
    logger.info("🎉 Railway RAG API ready!")

except Exception as e:
    logger.error(f"❌ Failed to initialize Railway RAG API: {e}")
    logger.error(f"Full traceback: {traceback.format_exc()}")
    
    # Create minimal fallback app
    from fastapi import FastAPI
    app = FastAPI(title="FinanceAI (Fallback)", version="1.0.0")
    
    @app.get("/")
    async def root():
        return {
            "message": "FinanceAI (Fallback Mode)",
            "version": "1.0.0",
            "error": f"Main app failed: {str(e)}"
        }
    
    @app.get("/health")
    async def health_check():
        return {
            "status": "degraded",
            "error": f"Initialization failed: {str(e)}"
        }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    
    logger.info(f"🚀 Starting Railway RAG server on {host}:{port}")
    uvicorn.run(app, host=host, port=port, log_level="info")