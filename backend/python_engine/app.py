"""
RAG-enabled FinanceAI API - Fresh deployment
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import sys
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Initialize FastAPI
app = FastAPI(
    title="FinanceAI RAG System", 
    version="4.0.0",
    description="Production RAG-enabled financial simulation API"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for components
rag_manager = None
data_loader = None

@app.on_event("startup")
async def startup_event():
    """Initialize components on startup"""
    global rag_manager, data_loader
    
    try:
        logger.info("🚀 Starting FinanceAI RAG System initialization...")
        
        # Import and initialize CSV loader
        from data.csv_loader import CSVDataLoader
        data_loader = CSVDataLoader()
        logger.info("✅ CSV data loader initialized")
        
        # Import and initialize RAG system
        from rag.profile_rag_system import get_rag_manager
        rag_manager = get_rag_manager()
        logger.info("✅ RAG system initialized")
        
        logger.info("🎉 FinanceAI RAG System ready for production!")
        
    except Exception as e:
        logger.error(f"❌ Startup failed: {e}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "FinanceAI RAG System",
        "version": "4.0.0",
        "status": "operational",
        "rag_initialized": rag_manager is not None,
        "deployment_id": "FORCE_DEPLOY_2025_08_07_1345",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health():
    """Health check"""
    return {
        "status": "healthy",
        "version": "4.0.0",
        "components": {
            "rag_system": "operational" if rag_manager else "not_initialized",
            "data_loader": "operational" if data_loader else "not_initialized"
        },
        "timestamp": datetime.now().isoformat()
    }

@app.get("/rag-test")
async def rag_test():
    """Test RAG system availability"""
    if not rag_manager:
        raise HTTPException(status_code=500, detail="RAG system not initialized")
    
    try:
        summaries = rag_manager.get_all_profile_summaries()
        return {
            "status": "RAG_OPERATIONAL",
            "profile_count": len(summaries),
            "profiles": list(summaries.keys()) if summaries else []
        }
    except Exception as e:
        logger.error(f"RAG test failed: {e}")
        raise HTTPException(status_code=500, detail=f"RAG test failed: {str(e)}")

@app.get("/rag/profiles/summary")
async def get_profile_summaries():
    """Get all profile summaries"""
    if not rag_manager:
        raise HTTPException(status_code=500, detail="RAG manager not initialized")
    
    try:
        summaries = rag_manager.get_all_profile_summaries()
        return {
            "success": True,
            "profile_summaries": summaries,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to get profile summaries: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@app.post("/rag/query/{profile_id}")
async def query_rag(profile_id: int, request: dict):
    """Query RAG system for specific profile"""
    if not rag_manager:
        raise HTTPException(status_code=500, detail="RAG manager not initialized")
    
    try:
        query = request.get("query", "")
        tool_name = request.get("tool_name", "query_all_data")
        
        result = rag_manager.query_profile(profile_id, query, tool_name)
        
        return {
            "success": True,
            "profile_id": profile_id,
            "query": query,
            "tool_name": tool_name,
            "result": result,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"RAG query failed for profile {profile_id}: {e}")
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)