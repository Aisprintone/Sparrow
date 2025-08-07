"""
Simple implementations of RAG abstractions for integration
Bridges the gap between abstract interfaces and existing RAG manager
"""

import asyncio
import time
import logging
from typing import Dict, List, Any, Optional
from collections import defaultdict

from .abstractions import (
    IRAGQueryExecutor,
    IRAGCache,
    IRAGMetrics,
    IRAGErrorHandler,
    RAGQuery,
    RAGResult,
    QueryType
)

logger = logging.getLogger(__name__)


class SimpleRAGQueryExecutor(IRAGQueryExecutor):
    """Simple query executor that wraps the existing RAG manager"""
    
    def __init__(self, rag_manager):
        self.rag_manager = rag_manager
    
    async def execute_query(self, profile_id: int, query: RAGQuery) -> RAGResult:
        """Execute a single RAG query using the existing RAG manager"""
        start_time = time.time()
        
        try:
            # Get the profile system from RAG manager
            profile_system = self.rag_manager.get_profile_system(profile_id)
            
            # Execute the query using the appropriate tool
            tool_name = query.query_type.value if query.query_type else None
            result_text = profile_system.query(query.query_text, tool_name)
            
            execution_time_ms = (time.time() - start_time) * 1000
            
            return RAGResult(
                query=query,
                result=result_text,
                success=True,
                error=None,
                execution_time_ms=execution_time_ms
            )
            
        except Exception as e:
            execution_time_ms = (time.time() - start_time) * 1000
            logger.error(f"Query execution failed: {e}")
            
            return RAGResult(
                query=query,
                result="",
                success=False,
                error=str(e),
                execution_time_ms=execution_time_ms
            )


class SimpleRAGCache(IRAGCache):
    """Simple in-memory cache implementation"""
    
    def __init__(self, max_size: int = 1000, default_ttl: int = 300):
        self._cache: Dict[str, Any] = {}
        self._timestamps: Dict[str, float] = {}
        self._ttls: Dict[str, float] = {}
        self.max_size = max_size
        self.default_ttl = default_ttl
        self._hits = 0
        self._misses = 0
    
    def get(self, key: str) -> Optional[Any]:
        """Get cached value"""
        if key in self._cache:
            # Check if cache is still valid (TTL check)
            if key in self._timestamps:
                ttl = self._ttls.get(key, self.default_ttl)
                age = time.time() - self._timestamps[key]
                if age > ttl:
                    self._remove_key(key)
                    self._misses += 1
                    return None
            self._hits += 1
            return self._cache[key]
        self._misses += 1
        return None
    
    def set(self, key: str, value: Any, ttl: Optional[float] = None) -> None:
        """Set cached value with TTL"""
        # Enforce max size
        if len(self._cache) >= self.max_size and key not in self._cache:
            # Remove oldest entry
            oldest_key = min(self._timestamps.keys(), key=lambda k: self._timestamps[k])
            self._remove_key(oldest_key)
        
        self._cache[key] = value
        self._timestamps[key] = time.time()
        self._ttls[key] = ttl or self.default_ttl
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        total_requests = self._hits + self._misses
        hit_rate = self._hits / total_requests if total_requests > 0 else 0
        
        return {
            'hits': self._hits,
            'misses': self._misses,
            'hit_rate': hit_rate,
            'total_entries': len(self._cache),
            'max_size': self.max_size
        }
    
    def _remove_key(self, key: str) -> None:
        """Remove key from all internal dictionaries"""
        if key in self._cache:
            del self._cache[key]
        if key in self._timestamps:
            del self._timestamps[key]
        if key in self._ttls:
            del self._ttls[key]
    
    async def delete(self, key: str) -> None:
        """Delete cached value"""
        self._remove_key(key)
    
    async def clear(self) -> None:
        """Clear all cached values"""
        self._cache.clear()
        self._timestamps.clear()
        self._ttls.clear()
        self._hits = 0
        self._misses = 0
    
    async def invalidate(self, pattern: str = None) -> None:
        """Invalidate cache entries matching pattern"""
        if pattern is None:
            # Clear all cache if no pattern specified
            await self.clear()
        else:
            # Remove entries matching the pattern
            keys_to_remove = [key for key in self._cache.keys() if pattern in key]
            for key in keys_to_remove:
                await self.delete(key)


class SimpleRAGMetrics(IRAGMetrics):
    """Simple metrics collector implementation"""
    
    def __init__(self):
        self._query_metrics = defaultdict(list)
        self._batch_metrics = []
    
    def record_query_execution(
        self,
        query_type: QueryType,
        duration_ms: float,
        success: bool
    ) -> None:
        """Record metrics for a single query execution"""
        self._query_metrics[query_type.value].append({
            "duration_ms": duration_ms,
            "success": success,
            "timestamp": time.time()
        })
    
    def record_batch_execution(
        self,
        batch_size: int,
        duration_ms: float,
        success_rate: float
    ) -> None:
        """Record metrics for a batch execution"""
        self._batch_metrics.append({
            "batch_size": batch_size,
            "duration_ms": duration_ms,
            "success_rate": success_rate,
            "timestamp": time.time()
        })
    
    def get_metrics_summary(self) -> Dict[str, Any]:
        """Get summary of collected metrics"""
        query_summary = {}
        for query_type, metrics in self._query_metrics.items():
            if metrics:
                successful = sum(1 for m in metrics if m["success"])
                avg_duration = sum(m["duration_ms"] for m in metrics) / len(metrics)
                query_summary[query_type] = {
                    "total_queries": len(metrics),
                    "success_rate": successful / len(metrics),
                    "avg_duration_ms": avg_duration
                }
        
        batch_summary = {}
        if self._batch_metrics:
            avg_batch_size = sum(m["batch_size"] for m in self._batch_metrics) / len(self._batch_metrics)
            avg_duration = sum(m["duration_ms"] for m in self._batch_metrics) / len(self._batch_metrics)
            avg_success_rate = sum(m["success_rate"] for m in self._batch_metrics) / len(self._batch_metrics)
            batch_summary = {
                "total_batches": len(self._batch_metrics),
                "avg_batch_size": avg_batch_size,
                "avg_duration_ms": avg_duration,
                "avg_success_rate": avg_success_rate
            }
        
        return {
            "query_metrics": query_summary,
            "batch_metrics": batch_summary
        }


class SimpleRAGErrorHandler(IRAGErrorHandler):
    """Simple error handler with retry logic"""
    
    def __init__(self, max_retries: int = 3):
        self.max_retries = max_retries
    
    async def handle_error(
        self,
        error: Exception,
        context: Dict[str, Any]
    ) -> Optional[Any]:
        """Handle errors with simple retry logic"""
        logger.error(f"Error in RAG operation: {error}")
        logger.debug(f"Error context: {context}")
        
        # Simple fallback response
        return RAGResult(
            query=context.get("query"),
            result="Query processing failed. Please try again.",
            success=False,
            error=str(error)
        )
    
    def should_retry(self, error: Exception, attempt: int) -> bool:
        """Determine if operation should be retried"""
        # Retry on network errors or timeouts
        retryable_errors = (
            ConnectionError,
            TimeoutError,
            asyncio.TimeoutError
        )
        
        return (
            isinstance(error, retryable_errors) and
            attempt < self.max_retries
        )