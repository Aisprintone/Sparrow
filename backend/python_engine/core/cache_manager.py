"""
Cache Manager for Railway Deployment
Handles caching with Redis and fallback to in-memory storage
"""

import os
import json
import hashlib
import logging
from typing import Dict, Any, Optional, Union
from datetime import datetime, timedelta
import asyncio
from functools import wraps
import redis.asyncio as redis

logger = logging.getLogger(__name__)

class CacheManager:
    """Unified cache manager for Railway Redis and local development"""
    
    def __init__(self):
        self.use_redis = os.getenv('REDIS_URL') is not None
        self.cache_ttl = int(os.getenv('CACHE_TTL_SECONDS', 3600))  # 1 hour default
        self._memory_cache = {}  # Fallback for local development
        self._redis_client = None
        
        if self.use_redis:
            self._setup_redis()
            logger.info("Using Redis for caching")
        else:
            logger.info("Using in-memory cache for local development")
    
    def _setup_redis(self):
        """Setup Redis connection"""
        try:
            redis_url = os.getenv('REDIS_URL')
            if redis_url:
                self._redis_client = redis.from_url(
                    redis_url,
                    decode_responses=True,
                    socket_connect_timeout=5,
                    socket_timeout=5,
                    retry_on_timeout=True
                )
                logger.info("Redis connection established")
            else:
                logger.warning("REDIS_URL not set, falling back to in-memory cache")
                self.use_redis = False
        except Exception as e:
            logger.error(f"Failed to setup Redis: {e}")
            self.use_redis = False
    
    def _generate_cache_key(self, prefix: str, *args, **kwargs) -> str:
        """Generate a consistent cache key from function arguments"""
        # Create a deterministic string representation
        key_parts = [prefix]
        
        # Add positional arguments
        for arg in args:
            key_parts.append(str(arg))
        
        # Add keyword arguments (sorted for consistency)
        for key, value in sorted(kwargs.items()):
            key_parts.append(f"{key}:{value}")
        
        # Create hash for consistent key length
        key_string = "|".join(key_parts)
        return hashlib.md5(key_string.encode()).hexdigest()
    
    async def get(self, key: str) -> Optional[Dict[str, Any]]:
        """Get cached data"""
        try:
            if self.use_redis and self._redis_client:
                return await self._get_from_redis(key)
            else:
                return self._get_from_memory(key)
        except Exception as e:
            logger.error(f"Cache get error for key {key}: {e}")
            return None
    
    async def set(self, key: str, data: Dict[str, Any], ttl: Optional[int] = None) -> bool:
        """Set cached data"""
        try:
            if self.use_redis and self._redis_client:
                return await self._set_in_redis(key, data, ttl)
            else:
                return self._set_in_memory(key, data, ttl)
        except Exception as e:
            logger.error(f"Cache set error for key {key}: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete cached data"""
        try:
            if self.use_redis and self._redis_client:
                return await self._delete_from_redis(key)
            else:
                return self._delete_from_memory(key)
        except Exception as e:
            logger.error(f"Cache delete error for key {key}: {e}")
            return False
    
    async def clear_pattern(self, pattern: str) -> int:
        """Clear all cache entries matching a pattern"""
        try:
            if self.use_redis and self._redis_client:
                return await self._clear_pattern_redis(pattern)
            else:
                return self._clear_pattern_memory(pattern)
        except Exception as e:
            logger.error(f"Cache clear pattern error for {pattern}: {e}")
            return 0
    
    # Redis Methods
    async def _get_from_redis(self, key: str) -> Optional[Dict[str, Any]]:
        """Get data from Redis"""
        try:
            data = await self._redis_client.get(key)
            if data:
                cache_data = json.loads(data)
                if not self._is_expired(cache_data):
                    return cache_data['data']
                else:
                    # Clean up expired data
                    await self._redis_client.delete(key)
            return None
        except Exception as e:
            logger.error(f"Redis get error: {e}")
            return None
    
    async def _set_in_redis(self, key: str, data: Dict[str, Any], ttl: Optional[int] = None) -> bool:
        """Set data in Redis"""
        try:
            cache_data = {
                'data': data,
                'timestamp': datetime.now().isoformat(),
                'ttl': ttl or self.cache_ttl
            }
            
            await self._redis_client.setex(
                key,
                ttl or self.cache_ttl,
                json.dumps(cache_data)
            )
            return True
        except Exception as e:
            logger.error(f"Redis set error: {e}")
            return False
    
    async def _delete_from_redis(self, key: str) -> bool:
        """Delete data from Redis"""
        try:
            result = await self._redis_client.delete(key)
            return result > 0
        except Exception as e:
            logger.error(f"Redis delete error: {e}")
            return False
    
    async def _clear_pattern_redis(self, pattern: str) -> int:
        """Clear all cache entries matching a pattern"""
        try:
            keys = await self._redis_client.keys(pattern)
            if keys:
                result = await self._redis_client.delete(*keys)
                return result
            return 0
        except Exception as e:
            logger.error(f"Redis clear pattern error: {e}")
            return 0
    
    # Memory Cache Methods (fallback)
    def _get_from_memory(self, key: str) -> Optional[Dict[str, Any]]:
        """Get data from memory cache"""
        if key in self._memory_cache:
            cache_data = self._memory_cache[key]
            if not self._is_expired(cache_data):
                return cache_data['data']
            else:
                # Clean up expired data
                del self._memory_cache[key]
        return None
    
    def _set_in_memory(self, key: str, data: Dict[str, Any], ttl: Optional[int] = None) -> bool:
        """Set data in memory cache"""
        try:
            cache_data = {
                'data': data,
                'timestamp': datetime.now().isoformat(),
                'ttl': ttl or self.cache_ttl
            }
            self._memory_cache[key] = cache_data
            return True
        except Exception as e:
            logger.error(f"Memory cache set error: {e}")
            return False
    
    def _delete_from_memory(self, key: str) -> bool:
        """Delete data from memory cache"""
        try:
            if key in self._memory_cache:
                del self._memory_cache[key]
                return True
            return False
        except Exception as e:
            logger.error(f"Memory cache delete error: {e}")
            return False
    
    def _clear_pattern_memory(self, pattern: str) -> int:
        """Clear all memory cache entries matching a pattern"""
        try:
            deleted_count = 0
            keys_to_delete = []
            
            for key in self._memory_cache.keys():
                if pattern in key:  # Simple pattern matching
                    keys_to_delete.append(key)
            
            for key in keys_to_delete:
                del self._memory_cache[key]
                deleted_count += 1
            
            return deleted_count
        except Exception as e:
            logger.error(f"Memory cache clear pattern error: {e}")
            return 0
    
    def _is_expired(self, cache_data: Dict[str, Any]) -> bool:
        """Check if cache data is expired"""
        try:
            timestamp = datetime.fromisoformat(cache_data['timestamp'])
            ttl = cache_data.get('ttl', self.cache_ttl)
            expiry_time = timestamp + timedelta(seconds=ttl)
            return datetime.now() > expiry_time
        except Exception:
            return True
    
    async def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        try:
            if self.use_redis and self._redis_client:
                info = await self._redis_client.info()
                return {
                    'type': 'redis',
                    'connected_clients': info.get('connected_clients', 0),
                    'used_memory_human': info.get('used_memory_human', '0B'),
                    'keyspace_hits': info.get('keyspace_hits', 0),
                    'keyspace_misses': info.get('keyspace_misses', 0)
                }
            else:
                return {
                    'type': 'memory',
                    'cache_size': len(self._memory_cache),
                    'memory_usage': 'N/A'
                }
        except Exception as e:
            logger.error(f"Cache stats error: {e}")
            return {'type': 'error', 'error': str(e)}

# Global cache manager instance
cache_manager = CacheManager()

def cached(prefix: str, ttl: Optional[int] = None):
    """Decorator for caching function results"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key
            cache_key = cache_manager._generate_cache_key(prefix, *args, **kwargs)
            
            # Try to get from cache
            cached_result = await cache_manager.get(cache_key)
            if cached_result is not None:
                logger.debug(f"Cache hit for {cache_key}")
                return cached_result
            
            # Execute function and cache result
            result = await func(*args, **kwargs)
            await cache_manager.set(cache_key, result, ttl)
            logger.debug(f"Cache miss for {cache_key}, cached result")
            
            return result
        return wrapper
    return decorator

class CacheCategories:
    """Cache category constants"""
    WORKFLOW_STATUS = "workflow_status"
    USER_PROFILE = "user_profile"
    SIMULATION_RESULTS = "simulation_results"
    MARKET_DATA = "market_data"
    AI_EXPLANATIONS = "ai_explanations"
    PLAID_DATA = "plaid_data"
    CHASE_DATA = "chase_data"
    WORKFLOW_EXECUTION = "workflow_execution"
    DATABASE_QUERIES = "database_queries"
    API_RESPONSES = "api_responses"
