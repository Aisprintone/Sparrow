"""
Streaming API Endpoints for AI Pipeline Optimization
Implements Server-Sent Events (SSE) endpoints for real-time AI generation
using Context7 best practices for FastAPI streaming.
"""

import asyncio
import json
import logging
from typing import Dict, List, Any, Optional, AsyncGenerator
from datetime import datetime
import time

# FastAPI imports
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from sse_starlette.sse import EventSourceResponse, ServerSentEvent

# Local imports
from api.streaming_ai import (
    StreamingAIPipeline, 
    StreamEvent, 
    StreamEventType, 
    get_streaming_pipeline
)

logger = logging.getLogger(__name__)

# Create router for streaming endpoints
router = APIRouter(prefix="/streaming", tags=["streaming"])


@router.post("/ai/generate")
async def stream_ai_generation_endpoint(request: Dict[str, Any]):
    """
    Stream AI generation results using Server-Sent Events (SSE).
    
    This endpoint provides real-time progress updates during AI generation,
    following Context7 best practices for FastAPI streaming.
    """
    try:
        # Extract request data
        simulation_data = request.get('simulation_data', {})
        user_profile = request.get('user_profile', {})
        profile_id = request.get('profile_id', 1)
        
        if not simulation_data:
            raise HTTPException(status_code=400, detail="simulation_data is required")
        
        if not user_profile:
            raise HTTPException(status_code=400, detail="user_profile is required")
        
        # Get streaming pipeline
        pipeline = get_streaming_pipeline()
        
        # Create async generator for SSE
        async def generate_sse_events() -> AsyncGenerator[ServerSentEvent, None]:
            """Generate Server-Sent Events for AI generation progress."""
            try:
                async for event in pipeline.stream_ai_generation(
                    simulation_data=simulation_data,
                    user_profile=user_profile,
                    profile_id=profile_id
                ):
                    # Convert StreamEvent to ServerSentEvent
                    sse_event = ServerSentEvent(
                        data=json.dumps({
                            "event_type": event.event_type.value,
                            "data": event.data,
                            "timestamp": event.timestamp,
                            "progress": event.progress,
                            "message": event.message
                        }),
                        event=event.event_type.value,
                        id=str(int(event.timestamp * 1000)),
                        retry=5000  # 5 second retry interval
                    )
                    yield sse_event
                    
                    # Add small delay to prevent overwhelming the client
                    await asyncio.sleep(0.1)
                    
            except Exception as e:
                logger.error(f"SSE generation failed: {e}")
                # Send error event
                error_event = ServerSentEvent(
                    data=json.dumps({
                        "error": str(e),
                        "message": "AI generation pipeline failed"
                    }),
                    event="error",
                    id=str(int(time.time() * 1000))
                )
                yield error_event
        
        # Return EventSourceResponse for SSE
        return EventSourceResponse(
            generate_sse_events(),
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Cache-Control"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Streaming endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ai/generate-simple")
async def stream_ai_generation_simple(request: Dict[str, Any]):
    """
    Simple streaming endpoint using StreamingResponse for basic text streaming.
    
    This endpoint demonstrates basic streaming without SSE complexity,
    useful for simple progress updates.
    """
    try:
        # Extract request data
        simulation_data = request.get('simulation_data', {})
        user_profile = request.get('user_profile', {})
        profile_id = request.get('profile_id', 1)
        
        if not simulation_data:
            raise HTTPException(status_code=400, detail="simulation_data is required")
        
        if not user_profile:
            raise HTTPException(status_code=400, detail="user_profile is required")
        
        # Get streaming pipeline
        pipeline = get_streaming_pipeline()
        
        # Create async generator for simple streaming
        async def generate_simple_stream() -> AsyncGenerator[str, None]:
            """Generate simple text stream for AI generation progress."""
            try:
                async for event in pipeline.stream_ai_generation(
                    simulation_data=simulation_data,
                    user_profile=user_profile,
                    profile_id=profile_id
                ):
                    # Format as simple text stream
                    progress_text = f"Progress: {event.progress:.1f}% - {event.data.get('message', 'Processing...')}\n"
                    yield progress_text
                    
                    # Add delay
                    await asyncio.sleep(0.1)
                    
            except Exception as e:
                logger.error(f"Simple streaming failed: {e}")
                yield f"Error: {str(e)}\n"
        
        # Return StreamingResponse for simple text streaming
        return StreamingResponse(
            generate_simple_stream(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Simple streaming endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rag/query/{profile_id}")
async def stream_rag_query_endpoint(
    profile_id: int,
    request: Dict[str, Any],
    http_request: Request
):
    """
    Stream RAG query results using optimized indexing.
    
    This endpoint demonstrates streaming RAG queries with real-time
    progress updates and optimized indexing strategies.
    """
    try:
        # Extract request data
        query = request.get('query', '')
        context = request.get('context', '')
        
        if not query:
            raise HTTPException(status_code=400, detail="query is required")
        
        # Get streaming pipeline and indexer
        pipeline = get_streaming_pipeline()
        indexer = pipeline.get_optimized_indexer(profile_id)
        
        # Create async generator for RAG query streaming
        async def generate_rag_stream() -> AsyncGenerator[ServerSentEvent, None]:
            """Generate SSE events for RAG query progress."""
            try:
                # Check for client disconnection
                if await http_request.is_disconnected():
                    logger.info("Client disconnected before RAG query")
                    return
                
                # Start event
                start_event = ServerSentEvent(
                    data=json.dumps({
                        "message": "Starting optimized RAG query",
                        "query": query,
                        "profile_id": profile_id
                    }),
                    event="rag_start",
                    id=str(int(time.time() * 1000))
                )
                yield start_event
                
                # Execute optimized query
                result = indexer.optimized_query(query, context)
                
                # Check for client disconnection
                if await http_request.is_disconnected():
                    logger.info("Client disconnected during RAG query")
                    return
                
                # Complete event
                complete_event = ServerSentEvent(
                    data=json.dumps({
                        "message": "RAG query completed",
                        "result": result,
                        "query_type": result.get('query_type', 'unknown'),
                        "indexes_used": result.get('indexes_used', [])
                    }),
                    event="rag_complete",
                    id=str(int(time.time() * 1000))
                )
                yield complete_event
                
            except Exception as e:
                logger.error(f"RAG query streaming failed: {e}")
                error_event = ServerSentEvent(
                    data=json.dumps({
                        "error": str(e),
                        "message": "RAG query failed"
                    }),
                    event="error",
                    id=str(int(time.time() * 1000))
                )
                yield error_event
        
        # Return EventSourceResponse for SSE
        return EventSourceResponse(
            generate_rag_stream(),
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Cache-Control"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"RAG streaming endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def streaming_health_check():
    """
    Health check endpoint for streaming services.
    
    Returns the status of streaming components and pipeline.
    """
    try:
        pipeline = get_streaming_pipeline()
        
        # Check pipeline components
        health_status = {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "components": {
                "ai_system": "available" if pipeline.ai_system else "unavailable",
                "rag_manager": "available" if pipeline.rag_manager else "unavailable",
                "indexers": len(pipeline.indexers)
            },
            "message": "Streaming services are operational"
        }
        
        return health_status
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "timestamp": datetime.now().isoformat(),
            "error": str(e),
            "message": "Streaming services are experiencing issues"
        }


@router.post("/simulation/stream/{scenario_type}")
async def stream_simulation_with_ai(
    scenario_type: str,
    request: Dict[str, Any]
):
    """
    Stream complete simulation with AI generation in real-time.
    
    This endpoint combines simulation execution with AI generation
    streaming, providing end-to-end real-time updates.
    """
    try:
        # Extract request data
        profile_data = request.get('profile_data', {})
        config = request.get('config', {})
        
        if not profile_data:
            raise HTTPException(status_code=400, detail="profile_data is required")
        
        # Import simulation scenarios dynamically
        scenario_map = {
            "emergency_fund": "EmergencyFundScenario",
            "student_loan": "StudentLoanScenario", 
            "medical_crisis": "MedicalCrisisScenario",
            "gig_economy": "GigEconomyScenario",
            "market_crash": "MarketCrashScenario",
            "home_purchase": "HomePurchaseScenario",
            "rent_hike": "RentHikeScenario",
            "auto_repair": "AutoRepairScenario"
        }
        
        if scenario_type not in scenario_map:
            raise HTTPException(status_code=400, detail=f"Unsupported scenario type: {scenario_type}")
        
        # Import scenario class
        scenario_module = __import__(f"scenarios.{scenario_type}", fromlist=[scenario_map[scenario_type]])
        scenario_class = getattr(scenario_module, scenario_map[scenario_type])
        scenario = scenario_class()
        
        # Create async generator for complete simulation streaming
        async def generate_simulation_stream() -> AsyncGenerator[ServerSentEvent, None]:
            """Generate SSE events for complete simulation with AI generation."""
            try:
                # Step 1: Simulation execution
                sim_start_event = ServerSentEvent(
                    data=json.dumps({
                        "message": f"Starting {scenario_type} simulation",
                        "step": "simulation_start",
                        "progress": 0
                    }),
                    event="simulation_start",
                    id=str(int(time.time() * 1000))
                )
                yield sim_start_event
                
                # Execute simulation
                simulation_results = scenario.run_simulation(profile_data, config)
                
                sim_complete_event = ServerSentEvent(
                    data=json.dumps({
                        "message": f"{scenario_type} simulation completed",
                        "step": "simulation_complete",
                        "progress": 50,
                        "results": simulation_results
                    }),
                    event="simulation_complete",
                    id=str(int(time.time() * 1000))
                )
                yield sim_complete_event
                
                # Step 2: AI generation streaming
                pipeline = get_streaming_pipeline()
                async for event in pipeline.stream_ai_generation(
                    simulation_data=simulation_results,
                    user_profile=profile_data,
                    profile_id=profile_data.get('user_id', 1)
                ):
                    # Convert StreamEvent to ServerSentEvent with adjusted progress
                    adjusted_progress = 50 + (event.progress * 0.5)  # AI generation is 50% of total
                    sse_event = ServerSentEvent(
                        data=json.dumps({
                            "event_type": event.event_type.value,
                            "data": event.data,
                            "timestamp": event.timestamp,
                            "progress": adjusted_progress,
                            "message": event.message
                        }),
                        event=f"ai_{event.event_type.value}",
                        id=str(int(event.timestamp * 1000))
                    )
                    yield sse_event
                    
                    await asyncio.sleep(0.1)
                
                # Final completion event
                final_event = ServerSentEvent(
                    data=json.dumps({
                        "message": "Complete simulation with AI generation finished",
                        "step": "complete",
                        "progress": 100,
                        "scenario_type": scenario_type
                    }),
                    event="complete",
                    id=str(int(time.time() * 1000))
                )
                yield final_event
                
            except Exception as e:
                logger.error(f"Simulation streaming failed: {e}")
                error_event = ServerSentEvent(
                    data=json.dumps({
                        "error": str(e),
                        "message": "Simulation with AI generation failed"
                    }),
                    event="error",
                    id=str(int(time.time() * 1000))
                )
                yield error_event
        
        # Return EventSourceResponse for SSE
        return EventSourceResponse(
            generate_simulation_stream(),
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Cache-Control"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Simulation streaming endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def get_streaming_status():
    """
    Get current status of streaming services and active connections.
    
    Returns information about the streaming pipeline and any active
    streaming sessions.
    """
    try:
        pipeline = get_streaming_pipeline()
        
        status = {
            "timestamp": datetime.now().isoformat(),
            "pipeline_status": "active",
            "indexers_count": len(pipeline.indexers),
            "rag_manager_status": "available" if pipeline.rag_manager else "unavailable",
            "ai_system_status": "available" if pipeline.ai_system else "unavailable",
            "message": "Streaming services are operational"
        }
        
        return status
        
    except Exception as e:
        logger.error(f"Status check failed: {e}")
        return {
            "timestamp": datetime.now().isoformat(),
            "pipeline_status": "error",
            "error": str(e),
            "message": "Unable to retrieve streaming status"
        } 