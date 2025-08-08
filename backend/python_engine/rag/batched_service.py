"""
Batched RAG Service Implementation - SOLID Compliant
Implements efficient batched query execution with proper separation of concerns
"""

import asyncio
import time
import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from concurrent.futures import ThreadPoolExecutor

from .abstractions import (
    IRAGBatchExecutor,
    IRAGQueryExecutor,
    IRAGCache,
    IRAGMetrics,
    IRAGErrorHandler,
    BatchedRAGRequest,
    BatchedRAGResponse,
    RAGQuery,
    RAGResult,
    QueryType
)

logger = logging.getLogger(__name__)


class BatchedRAGService(IRAGBatchExecutor):
    """
    Main batched RAG service implementing Single Responsibility Principle
    Coordinates batch execution without handling individual query details
    """
    
    def __init__(
        self,
        query_executor: IRAGQueryExecutor,
        cache: Optional[IRAGCache] = None,
        metrics: Optional[IRAGMetrics] = None,
        error_handler: Optional[IRAGErrorHandler] = None,
        max_parallel_queries: int = 6
    ):
        """
        Dependency Injection for loose coupling (DIP)
        """
        self._query_executor = query_executor
        self._cache = cache
        self._metrics = metrics
        self._error_handler = error_handler
        self._max_parallel_queries = max_parallel_queries
        self._executor = ThreadPoolExecutor(max_workers=max_parallel_queries)
    
    async def execute_batch(self, request: BatchedRAGRequest) -> BatchedRAGResponse:
        """
        Execute batch of queries with parallel processing
        Single responsibility: coordinate batch execution
        """
        start_time = time.time()
        results = {}
        
        # Create tasks for parallel execution
        tasks = []
        for query in request.queries:
            task = self._execute_single_query_with_cache(
                request.profile_id,
                query
            )
            tasks.append(task)
        
        # Execute all queries in parallel
        query_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results
        successful_count = 0
        for query, result in zip(request.queries, query_results):
            if isinstance(result, Exception):
                # Handle error through error handler
                if self._error_handler:
                    fallback = await self._error_handler.handle_error(
                        result,
                        {"profile_id": request.profile_id, "query": query}
                    )
                    if fallback:
                        results[query.query_type.value] = fallback
                    else:
                        results[query.query_type.value] = RAGResult(
                            query=query,
                            result="",
                            success=False,
                            error=str(result)
                        )
                else:
                    results[query.query_type.value] = RAGResult(
                        query=query,
                        result="",
                        success=False,
                        error=str(result)
                    )
            else:
                results[query.query_type.value] = result
                if result.success:
                    successful_count += 1
        
        # Calculate metrics
        total_time_ms = (time.time() - start_time) * 1000
        success_rate = successful_count / len(request.queries) if request.queries else 0
        
        # Record metrics
        if self._metrics:
            self._metrics.record_batch_execution(
                batch_size=len(request.queries),
                duration_ms=total_time_ms,
                success_rate=success_rate
            )
        
        return BatchedRAGResponse(
            request=request,
            results=results,
            total_execution_time_ms=total_time_ms,
            success_rate=success_rate
        )
    
    async def _execute_single_query_with_cache(
        self,
        profile_id: int,
        query: RAGQuery
    ) -> RAGResult:
        """
        Execute single query with caching support
        """
        # Check cache first
        if self._cache:
            cache_key = f"{profile_id}:{query.query_type.value}:{hash(query.query_text)}"
            cached_result = await self._cache.get(cache_key)
            if cached_result:
                logger.debug(f"Cache hit for query: {query.query_type.value}")
                return cached_result
        
        # Execute query
        start_time = time.time()
        try:
            result = await self._query_executor.execute_query(profile_id, query)
            
            # Record metrics
            if self._metrics:
                duration_ms = (time.time() - start_time) * 1000
                self._metrics.record_query_execution(
                    query_type=query.query_type,
                    duration_ms=duration_ms,
                    success=result.success
                )
            
            # Cache successful result
            if self._cache and result.success:
                cache_key = f"{profile_id}:{query.query_type.value}:{hash(query.query_text)}"
                await self._cache.set(cache_key, result, ttl_seconds=300)
            
            return result
            
        except Exception as e:
            logger.error(f"Query execution failed: {e}")
            if self._metrics:
                duration_ms = (time.time() - start_time) * 1000
                self._metrics.record_query_execution(
                    query_type=query.query_type,
                    duration_ms=duration_ms,
                    success=False
                )
            raise
    
    def __del__(self):
        """Cleanup executor on deletion"""
        if hasattr(self, '_executor'):
            self._executor.shutdown(wait=False)