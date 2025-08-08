"""
Cache Management API Endpoints - PATTERN GUARDIAN ENFORCED
Provides endpoints for cache monitoring, warming, and management
"""

import logging
from typing import Dict, List, Any, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from datetime import datetime

# Import cache components
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.cache_manager import cache_manager, CacheCategories
from core.api_cache import api_cache, CACHE_WARMING_SCENARIOS, APIProvider

logger = logging.getLogger(__name__)

# Pydantic models
class CacheWarmingRequest(BaseModel):
    """Request model for cache warming"""
    scenarios: Optional[List[Dict[str, Any]]] = None
    use_defaults: bool = True
    profile_ids: Optional[List[int]] = None

class CacheClearRequest(BaseModel):
    """Request model for cache clearing"""
    pattern: Optional[str] = None
    category: Optional[str] = None
    clear_all: bool = False

# Create router
router = APIRouter(prefix="/cache", tags=["cache"])

@router.get("/stats")
async def get_cache_stats():
    """Get comprehensive cache statistics"""
    try:
        # Get general cache stats
        general_stats = await cache_manager.get_stats()
        
        # Get API cache stats
        api_stats = api_cache.get_stats()
        
        return {
            "success": True,
            "timestamp": datetime.now().isoformat(),
            "general_cache": general_stats,
            "api_cache": api_stats,
            "cache_categories": {
                "workflow_status": CacheCategories.WORKFLOW_STATUS,
                "user_profile": CacheCategories.USER_PROFILE,
                "simulation_results": CacheCategories.SIMULATION_RESULTS,
                "market_data": CacheCategories.MARKET_DATA,
                "ai_explanations": CacheCategories.AI_EXPLANATIONS,
                "api_responses": CacheCategories.API_RESPONSES
            }
        }
    except Exception as e:
        logger.error(f"Failed to get cache stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/warm")
async def warm_cache(request: CacheWarmingRequest, background_tasks: BackgroundTasks):
    """
    Warm the cache with commonly used queries and API calls.
    ENFORCED: Proactive caching to eliminate redundant API calls.
    """
    try:
        # Prepare warming scenarios
        scenarios = []
        
        if request.use_defaults:
            scenarios.extend(CACHE_WARMING_SCENARIOS)
        
        if request.scenarios:
            scenarios.extend(request.scenarios)
        
        # Add profile-specific warming if requested
        if request.profile_ids:
            for profile_id in request.profile_ids:
                scenarios.extend([
                    {
                        "operation": "completion",
                        "prompt": f"Analyze financial profile {profile_id} for emergency fund planning",
                        "provider": APIProvider.ANTHROPIC
                    },
                    {
                        "operation": "completion", 
                        "prompt": f"Generate student loan strategies for profile {profile_id}",
                        "provider": APIProvider.OPENAI
                    }
                ])
        
        # Start cache warming in background
        background_tasks.add_task(api_cache.warm_cache, scenarios)
        
        return {
            "success": True,
            "message": f"Cache warming started with {len(scenarios)} scenarios",
            "scenarios_count": len(scenarios)
        }
        
    except Exception as e:
        logger.error(f"Cache warming failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/clear")
async def clear_cache(request: CacheClearRequest):
    """
    Clear cache entries based on pattern or category.
    Use with caution - this will force new API calls.
    """
    try:
        cleared_count = 0
        
        if request.clear_all:
            # Clear all cache entries
            for category in [
                CacheCategories.WORKFLOW_STATUS,
                CacheCategories.USER_PROFILE,
                CacheCategories.SIMULATION_RESULTS,
                CacheCategories.MARKET_DATA,
                CacheCategories.AI_EXPLANATIONS,
                CacheCategories.API_RESPONSES
            ]:
                count = await cache_manager.clear_pattern(f"{category}:*")
                cleared_count += count
        elif request.pattern:
            # Clear by pattern
            cleared_count = await cache_manager.clear_pattern(request.pattern)
        elif request.category:
            # Clear by category
            cleared_count = await cache_manager.clear_pattern(f"{request.category}:*")
        
        return {
            "success": True,
            "cleared_count": cleared_count,
            "message": f"Cleared {cleared_count} cache entries"
        }
        
    except Exception as e:
        logger.error(f"Cache clearing failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def cache_health():
    """Check cache system health"""
    try:
        # Test cache operations
        test_key = "cache_health_test"
        test_data = {"test": True, "timestamp": datetime.now().isoformat()}
        
        # Test set
        set_success = await cache_manager.set(test_key, test_data, ttl=60)
        
        # Test get
        retrieved_data = await cache_manager.get(test_key)
        
        # Test delete
        delete_success = await cache_manager.delete(test_key)
        
        # Check API cache health
        api_cache_healthy = len(api_cache.configs) > 0
        
        return {
            "status": "healthy" if all([set_success, retrieved_data, delete_success, api_cache_healthy]) else "degraded",
            "timestamp": datetime.now().isoformat(),
            "cache_backend": "redis" if cache_manager.use_redis else "memory",
            "tests": {
                "set": set_success,
                "get": retrieved_data is not None,
                "delete": delete_success,
                "api_cache": api_cache_healthy
            },
            "configured_providers": list(api_cache.configs.keys())
        }
        
    except Exception as e:
        logger.error(f"Cache health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@router.post("/preload/{profile_id}")
async def preload_profile_cache(profile_id: int, background_tasks: BackgroundTasks):
    """
    Preload cache for a specific profile.
    ENFORCED: Eliminates duplicate API calls for profile analysis.
    """
    try:
        # Define profile-specific warming scenarios
        profile_scenarios = [
            # Emergency fund scenarios
            {
                "operation": "completion",
                "prompt": f"Analyze emergency fund requirements for profile {profile_id} with conservative strategy"
            },
            {
                "operation": "completion",
                "prompt": f"Analyze emergency fund requirements for profile {profile_id} with balanced strategy"
            },
            {
                "operation": "completion",
                "prompt": f"Analyze emergency fund requirements for profile {profile_id} with aggressive strategy"
            },
            # Student loan scenarios
            {
                "operation": "completion",
                "prompt": f"Generate student loan payoff strategy for profile {profile_id} with standard repayment"
            },
            {
                "operation": "completion",
                "prompt": f"Generate student loan payoff strategy for profile {profile_id} with accelerated repayment"
            },
            # Risk analysis
            {
                "operation": "analysis",
                "prompt": f"Perform comprehensive risk analysis for financial profile {profile_id}"
            },
            # Goal planning
            {
                "operation": "completion",
                "prompt": f"Create financial goal roadmap for profile {profile_id}"
            }
        ]
        
        # Start warming in background
        background_tasks.add_task(api_cache.warm_cache, profile_scenarios)
        
        return {
            "success": True,
            "profile_id": profile_id,
            "message": f"Started cache preloading for profile {profile_id}",
            "scenarios_count": len(profile_scenarios)
        }
        
    except Exception as e:
        logger.error(f"Profile cache preloading failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/usage")
async def get_cache_usage():
    """Get detailed cache usage statistics"""
    try:
        api_stats = api_cache.get_stats()
        
        # Calculate savings
        total_calls = api_stats.get("cache_hits", 0) + api_stats.get("cache_misses", 0)
        cache_savings = api_stats.get("cache_hits", 0)
        
        # Estimate cost savings (rough estimates)
        cost_per_call = {
            "openai": 0.002,  # ~$0.002 per call for GPT-4o-mini
            "anthropic": 0.003  # ~$0.003 per call for Claude Haiku
        }
        
        estimated_savings = cache_savings * 0.0025  # Average cost
        
        return {
            "success": True,
            "timestamp": datetime.now().isoformat(),
            "usage": {
                "total_requests": total_calls,
                "cache_hits": api_stats.get("cache_hits", 0),
                "cache_misses": api_stats.get("cache_misses", 0),
                "hit_rate": api_stats.get("hit_rate", "0%"),
                "api_calls_made": api_stats.get("api_calls", 0),
                "api_calls_saved": cache_savings,
                "errors": api_stats.get("errors", 0)
            },
            "savings": {
                "api_calls_saved": cache_savings,
                "estimated_cost_saved": f"${estimated_savings:.4f}",
                "time_saved_seconds": cache_savings * 0.5  # ~0.5s per API call
            },
            "providers": api_stats.get("configured_providers", [])
        }
        
    except Exception as e:
        logger.error(f"Failed to get cache usage: {e}")
        raise HTTPException(status_code=500, detail=str(e))