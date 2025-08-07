"""
Cache Manager for Cloudflare Workers Deployment
Handles caching with Cloudflare KV and fallback to in-memory storage
"""

import os
import json
import hashlib
import logging
from typing import Dict, Any, Optional, Union
from datetime import datetime, timedelta
import asyncio
from functools import wraps

logger = logging.getLogger(__name__)

class CacheManager:
    """Unified cache manager for Cloudflare Workers and local development"""
    
    def __init__(self):
        self.use_cloudflare_kv = os.getenv('CLOUDFLARE_KV_NAMESPACE') is not None
        self.cache_ttl = int(os.getenv('CACHE_TTL_SECONDS', 3600))  # 1 hour default
        self._memory_cache = {}  # Fallback for local development
        
        if self.use_cloudflare_kv:
            logger.info("Using Cloudflare KV for caching")
        else:
            logger.info("Using in-memory cache for local development")
    
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
            if self.use_cloudflare_kv:
                return await self._get_from_cloudflare_kv(key)
            else:
                return self._get_from_memory(key)
        except Exception as e:
            logger.error(f"Cache get error for key {key}: {e}")
            return None
    
    async def set(self, key: str, data: Dict[str, Any], ttl: Optional[int] = None) -> bool:
        """Set cached data"""
        try:
            if self.use_cloudflare_kv:
                return await self._set_in_cloudflare_kv(key, data, ttl)
            else:
                return self._set_in_memory(key, data, ttl)
        except Exception as e:
            logger.error(f"Cache set error for key {key}: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete cached data"""
        try:
            if self.use_cloudflare_kv:
                return await self._delete_from_cloudflare_kv(key)
            else:
                return self._delete_from_memory(key)
        except Exception as e:
            logger.error(f"Cache delete error for key {key}: {e}")
            return False
    
    async def clear_pattern(self, pattern: str) -> int:
        """Clear all cache entries matching a pattern"""
        try:
            if self.use_cloudflare_kv:
                return await self._clear_pattern_cloudflare_kv(pattern)
            else:
                return self._clear_pattern_memory(pattern)
        except Exception as e:
            logger.error(f"Cache clear pattern error for {pattern}: {e}")
            return 0
    
    # Cloudflare KV Methods
    async def _get_from_cloudflare_kv(self, key: str) -> Optional[Dict[str, Any]]:
        """Get data from Cloudflare KV"""
        try:
            # This would be implemented in the Cloudflare Worker
            # For now, we'll simulate the behavior
            import subprocess
            result = subprocess.run([
                'wrangler', 'kv:key', 'get', key,
                '--namespace-id', os.getenv('CLOUDFLARE_KV_NAMESPACE', '')
            ], capture_output=True, text=True)
            
            if result.returncode == 0:
                data = json.loads(result.stdout)
                if self._is_expired(data):
                    await self.delete(key)
                    return None
                return data
            return None
        except Exception as e:
            logger.error(f"Cloudflare KV get error: {e}")
            return None
    
    async def _set_in_cloudflare_kv(self, key: str, data: Dict[str, Any], ttl: Optional[int] = None) -> bool:
        """Set data in Cloudflare KV"""
        try:
            cache_data = {
                'data': data,
                'created_at': datetime.utcnow().isoformat(),
                'expires_at': (datetime.utcnow() + timedelta(seconds=ttl or self.cache_ttl)).isoformat()
            }
            
            # This would be implemented in the Cloudflare Worker
            import subprocess
            result = subprocess.run([
                'wrangler', 'kv:key', 'put', key, json.dumps(cache_data),
                '--namespace-id', os.getenv('CLOUDFLARE_KV_NAMESPACE', ''),
                '--expiration-ttl', str(ttl or self.cache_ttl)
            ], capture_output=True, text=True)
            
            return result.returncode == 0
        except Exception as e:
            logger.error(f"Cloudflare KV set error: {e}")
            return False
    
    async def _delete_from_cloudflare_kv(self, key: str) -> bool:
        """Delete data from Cloudflare KV"""
        try:
            import subprocess
            result = subprocess.run([
                'wrangler', 'kv:key', 'delete', key,
                '--namespace-id', os.getenv('CLOUDFLARE_KV_NAMESPACE', '')
            ], capture_output=True, text=True)
            
            return result.returncode == 0
        except Exception as e:
            logger.error(f"Cloudflare KV delete error: {e}")
            return False
    
    async def _clear_pattern_cloudflare_kv(self, pattern: str) -> int:
        """Clear pattern from Cloudflare KV"""
        try:
            import subprocess
            result = subprocess.run([
                'wrangler', 'kv:key', 'list',
                '--namespace-id', os.getenv('CLOUDFLARE_KV_NAMESPACE', '')
            ], capture_output=True, text=True)
            
            if result.returncode == 0:
                keys = json.loads(result.stdout)
                deleted_count = 0
                for key in keys:
                    if pattern in key['name']:
                        await self.delete(key['name'])
                        deleted_count += 1
                return deleted_count
            return 0
        except Exception as e:
            logger.error(f"Cloudflare KV clear pattern error: {e}")
            return 0
    
    # Memory Cache Methods (for local development)
    def _get_from_memory(self, key: str) -> Optional[Dict[str, Any]]:
        """Get data from memory cache"""
        if key in self._memory_cache:
            data = self._memory_cache[key]
            if self._is_expired(data):
                del self._memory_cache[key]
                return None
            return data['data']
        return None
    
    def _set_in_memory(self, key: str, data: Dict[str, Any], ttl: Optional[int] = None) -> bool:
        """Set data in memory cache"""
        try:
            cache_data = {
                'data': data,
                'created_at': datetime.utcnow().isoformat(),
                'expires_at': (datetime.utcnow() + timedelta(seconds=ttl or self.cache_ttl)).isoformat()
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
        """Clear pattern from memory cache"""
        try:
            deleted_count = 0
            keys_to_delete = []
            
            for key in self._memory_cache.keys():
                if pattern in key:
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
            expires_at = datetime.fromisoformat(cache_data['expires_at'])
            return datetime.utcnow() > expires_at
        except Exception:
            return True

# Global cache instance
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
                logger.info(f"Cache hit for {func.__name__}")
                return cached_result
            
            # Execute function and cache result
            result = await func(*args, **kwargs)
            await cache_manager.set(cache_key, result, ttl)
            logger.info(f"Cache miss for {func.__name__}, cached result")
            
            return result
        return wrapper
    return decorator

# Cache categories for easy management
class CacheCategories:
    WORKFLOW_STATUS = "workflow_status"
    USER_PROFILE = "user_profile"
    SIMULATION_RESULTS = "simulation_results"
    MARKET_DATA = "market_data"
    AI_EXPLANATIONS = "ai_explanations"
    PLaid_DATA = "plaid_data"
    CHASE_DATA = "chase_data"
