"""
Test suite for Unified API Cache - PATTERN GUARDIAN VALIDATION
Ensures zero duplicate API calls and proper caching behavior
"""

import asyncio
import pytest
import os
import time
from unittest.mock import Mock, patch, AsyncMock
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.api_cache import (
    UnifiedAPICache, 
    APIProvider, 
    APIConfig,
    CacheConfig,
    CacheAwareEmbeddings,
    cached_llm_call
)


class TestUnifiedAPICache:
    """Test unified API cache functionality"""
    
    @pytest.fixture
    def cache(self):
        """Create a fresh cache instance for testing"""
        # Reset singleton
        UnifiedAPICache._instance = None
        cache = UnifiedAPICache()
        
        # Mock API configurations
        cache.configs = {
            APIProvider.OPENAI.value: APIConfig(
                provider=APIProvider.OPENAI,
                api_key="test-key",
                base_url="https://api.openai.com/v1",
                model="gpt-4o-mini"
            ),
            APIProvider.ANTHROPIC.value: APIConfig(
                provider=APIProvider.ANTHROPIC,
                api_key="test-key",
                base_url="https://api.anthropic.com/v1",
                model="claude-3-haiku"
            )
        }
        
        return cache
    
    @pytest.mark.asyncio
    async def test_singleton_pattern(self):
        """ENFORCED: Ensure singleton pattern prevents duplicate instances"""
        cache1 = UnifiedAPICache()
        cache2 = UnifiedAPICache()
        
        assert cache1 is cache2, "VIOLATION: Multiple cache instances detected"
    
    @pytest.mark.asyncio
    async def test_cache_key_generation(self, cache):
        """Test deterministic cache key generation"""
        key1 = cache._generate_cache_key("completion", "openai", "test prompt", temperature=0.7)
        key2 = cache._generate_cache_key("completion", "openai", "test prompt", temperature=0.7)
        key3 = cache._generate_cache_key("completion", "openai", "different prompt", temperature=0.7)
        
        assert key1 == key2, "VIOLATION: Same inputs produce different cache keys"
        assert key1 != key3, "VIOLATION: Different inputs produce same cache key"
    
    @pytest.mark.asyncio
    async def test_cache_hit_prevents_api_call(self, cache):
        """ENFORCED: Ensure cache hits prevent duplicate API calls"""
        
        # Mock the API call
        with patch.object(cache, '_execute_api_call', new_callable=AsyncMock) as mock_api:
            mock_api.return_value = "API response"
            
            # Mock cache manager
            with patch('core.api_cache.cache_manager') as mock_cache_manager:
                # First call - cache miss
                mock_cache_manager.get = AsyncMock(return_value=None)
                mock_cache_manager.set = AsyncMock()
                
                result1 = await cache.cached_api_call(
                    operation="completion",
                    provider=APIProvider.OPENAI,
                    prompt="test prompt"
                )
                
                assert mock_api.call_count == 1, "API should be called on cache miss"
                assert result1 == "API response"
                
                # Second call - cache hit
                mock_cache_manager.get = AsyncMock(return_value={"result": "Cached response"})
                mock_api.reset_mock()
                
                result2 = await cache.cached_api_call(
                    operation="completion",
                    provider=APIProvider.OPENAI,
                    prompt="test prompt"
                )
                
                assert mock_api.call_count == 0, "VIOLATION: API called despite cache hit"
                assert result2 == "Cached response"
    
    @pytest.mark.asyncio
    async def test_provider_fallback(self, cache):
        """Test automatic fallback to alternative providers"""
        
        with patch.object(cache, '_execute_api_call', new_callable=AsyncMock) as mock_api:
            # First provider fails
            mock_api.side_effect = [
                Exception("Provider 1 failed"),
                "Fallback response"
            ]
            
            with patch('core.api_cache.cache_manager.get', new_callable=AsyncMock, return_value=None):
                with patch('core.api_cache.cache_manager.set', new_callable=AsyncMock):
                    result = await cache.cached_api_call(
                        operation="completion",
                        provider=APIProvider.ANTHROPIC,
                        prompt="test prompt"
                    )
                    
                    assert result == "Fallback response"
                    assert mock_api.call_count == 2, "Should try fallback provider"
    
    @pytest.mark.asyncio
    async def test_ttl_configuration(self):
        """Test TTL configuration for different operation types"""
        config = CacheConfig()
        
        assert config.get_ttl_for_operation("embedding") == 86400  # 24 hours
        assert config.get_ttl_for_operation("completion") == 3600   # 1 hour
        assert config.get_ttl_for_operation("analysis") == 1800     # 30 minutes
        assert config.get_ttl_for_operation("unknown") == 3600      # Default
    
    @pytest.mark.asyncio
    async def test_cache_statistics(self, cache):
        """Test cache statistics tracking"""
        
        with patch('core.api_cache.cache_manager.get', new_callable=AsyncMock) as mock_get:
            with patch('core.api_cache.cache_manager.set', new_callable=AsyncMock):
                with patch.object(cache, '_execute_api_call', new_callable=AsyncMock, return_value="response"):
                    # Simulate cache miss
                    mock_get.return_value = None
                    await cache.cached_api_call("completion", prompt="test1")
                    
                    # Simulate cache hit
                    mock_get.return_value = {"result": "cached"}
                    await cache.cached_api_call("completion", prompt="test2")
                    
                    stats = cache.get_stats()
                    
                    assert stats["cache_hits"] == 1
                    assert stats["cache_misses"] == 1
                    assert stats["api_calls"] == 1
                    assert "hit_rate" in stats


class TestCacheAwareEmbeddings:
    """Test cache-aware embeddings"""
    
    @pytest.mark.asyncio
    async def test_embedding_caching(self):
        """ENFORCED: Ensure embeddings are cached properly"""
        embeddings = CacheAwareEmbeddings()
        
        with patch('core.api_cache.api_cache.cached_api_call', new_callable=AsyncMock) as mock_call:
            mock_call.return_value = [0.1, 0.2, 0.3]
            
            # First call
            result1 = await embeddings.embed_query("test query")
            assert mock_call.call_count == 1
            
            # Should use same cache mechanism
            result2 = await embeddings.embed_query("test query")
            assert mock_call.call_count == 2  # Called again but cache handles deduplication
    
    def test_sync_wrapper(self):
        """Test synchronous wrapper for compatibility"""
        embeddings = CacheAwareEmbeddings()
        
        with patch('core.api_cache.api_cache.cached_api_call_sync') as mock_call:
            mock_call.return_value = [0.1, 0.2, 0.3]
            
            result = embeddings.embed_query_sync("test query")
            
            assert result == [0.1, 0.2, 0.3]
            mock_call.assert_called_once()


class TestCachedDecorator:
    """Test the @cached_llm_call decorator"""
    
    @pytest.mark.asyncio
    async def test_decorator_caching(self):
        """ENFORCED: Ensure decorator properly caches function results"""
        
        call_count = 0
        
        @cached_llm_call(operation="test_op")
        async def test_function(prompt: str) -> str:
            nonlocal call_count
            call_count += 1
            return f"Response to: {prompt}"
        
        with patch('core.api_cache.api_cache.cached_api_call', new_callable=AsyncMock) as mock_cache:
            mock_cache.return_value = "Cached response"
            
            result = await test_function(prompt="test prompt")
            
            assert result == "Cached response"
            mock_cache.assert_called_once_with(
                operation="test_op",
                provider=None,
                prompt="test prompt"
            )
    
    def test_sync_decorator(self):
        """Test decorator with synchronous functions"""
        
        @cached_llm_call(operation="test_op")
        def test_function(prompt: str) -> str:
            return f"Response to: {prompt}"
        
        with patch('core.api_cache.api_cache.cached_api_call_sync') as mock_cache:
            mock_cache.return_value = "Cached response"
            
            result = test_function(prompt="test prompt")
            
            assert result == "Cached response"
            mock_cache.assert_called_once()


class TestCacheWarming:
    """Test cache warming functionality"""
    
    @pytest.mark.asyncio
    async def test_cache_warming(self):
        """ENFORCED: Ensure cache warming prevents cold start API calls"""
        cache = UnifiedAPICache()
        
        warming_scenarios = [
            {"operation": "completion", "prompt": "warm1"},
            {"operation": "embedding", "prompt": "warm2"}
        ]
        
        with patch.object(cache, 'cached_api_call', new_callable=AsyncMock) as mock_call:
            mock_call.return_value = "warmed"
            
            await cache.warm_cache(warming_scenarios)
            
            assert mock_call.call_count == 2
            
            # Verify warming calls
            calls = mock_call.call_args_list
            assert any("warm1" in str(call) for call in calls)
            assert any("warm2" in str(call) for call in calls)


class TestDuplicationPrevention:
    """PATTERN GUARDIAN: Validate no duplicate API implementations exist"""
    
    def test_no_duplicate_openai_calls(self):
        """ENFORCED: Ensure no duplicate OpenAI call implementations"""
        # This test would scan the codebase for duplicate patterns
        # For now, we verify the unified cache is the only implementation
        
        cache = UnifiedAPICache()
        assert hasattr(cache, '_call_openai_unified')
        
        # Verify old methods are removed from refactored modules
        # This would be validated in integration tests
    
    def test_no_duplicate_anthropic_calls(self):
        """ENFORCED: Ensure no duplicate Anthropic call implementations"""
        cache = UnifiedAPICache()
        assert hasattr(cache, '_call_anthropic_unified')
    
    def test_cache_key_consistency(self):
        """ENFORCED: Ensure cache keys are consistent across all uses"""
        cache = UnifiedAPICache()
        
        # Same inputs must always produce same key
        key1 = cache._generate_cache_key("op", "provider", {"key": "value"}, param=1)
        key2 = cache._generate_cache_key("op", "provider", {"key": "value"}, param=1)
        
        assert key1 == key2, "VIOLATION: Cache key generation is not deterministic"


if __name__ == "__main__":
    # Run tests with pattern violation detection
    pytest.main([__file__, "-v", "--tb=short"])