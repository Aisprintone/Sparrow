"""
RAG Query Executor Implementation
Handles individual query execution with proper abstraction
"""

import logging
import time
from typing import Optional
from pathlib import Path
import sys

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from .abstractions import (
    IRAGQueryExecutor,
    RAGQuery,
    RAGResult,
    QueryType
)
from .profile_rag_system import ProfileRAGSystem, ProfileRAGManager

logger = logging.getLogger(__name__)


class ProfileRAGQueryExecutor(IRAGQueryExecutor):
    """
    Concrete implementation of RAG query executor
    Single Responsibility: Execute individual RAG queries against profile systems
    """
    
    def __init__(self, rag_manager: ProfileRAGManager):
        """
        Initialize with RAG manager dependency
        """
        self._rag_manager = rag_manager
    
    async def execute_query(self, profile_id: int, query: RAGQuery) -> RAGResult:
        """
        Execute a single RAG query for a profile
        Clean separation of query execution logic
        """
        start_time = time.time()
        
        try:
            # Get profile system
            profile_system = self._rag_manager.get_profile_system(profile_id)
            
            # Map query type to tool name
            tool_name = query.query_type.value
            
            # Execute query through profile system
            result_text = profile_system.query(
                query.query_text,
                tool_name=tool_name
            )
            
            # Calculate execution time
            execution_time_ms = (time.time() - start_time) * 1000
            
            # Create successful result
            return RAGResult(
                query=query,
                result=result_text,
                success=True,
                error=None,
                execution_time_ms=execution_time_ms
            )
            
        except Exception as e:
            logger.error(f"Query execution failed for profile {profile_id}: {e}")
            
            # Calculate execution time even for failures
            execution_time_ms = (time.time() - start_time) * 1000
            
            # Create error result
            return RAGResult(
                query=query,
                result="",
                success=False,
                error=str(e),
                execution_time_ms=execution_time_ms
            )

    def execute_query_sync(self, profile_id: int, query: RAGQuery) -> RAGResult:
        """
        Synchronous version of execute_query for use in thread pools
        """
        start_time = time.time()
        
        try:
            # Get profile system
            profile_system = self._rag_manager.get_profile_system(profile_id)
            
            # Map query type to tool name
            tool_name = query.query_type.value
            
            # Execute query through profile system
            result_text = profile_system.query(
                query.query_text,
                tool_name=tool_name
            )
            
            # Calculate execution time
            execution_time_ms = (time.time() - start_time) * 1000
            
            # Create successful result
            return RAGResult(
                query=query,
                result=result_text,
                success=True,
                error=None,
                execution_time_ms=execution_time_ms
            )
            
        except Exception as e:
            logger.error(f"Query execution failed for profile {profile_id}: {e}")
            
            # Calculate execution time even for failures
            execution_time_ms = (time.time() - start_time) * 1000
            
            # Create error result
            return RAGResult(
                query=query,
                result="",
                success=False,
                error=str(e),
                execution_time_ms=execution_time_ms
            )


class AsyncProfileRAGQueryExecutor(IRAGQueryExecutor):
    """
    Async wrapper for ProfileRAGQueryExecutor
    Provides true async execution using thread pool
    """
    
    def __init__(self, rag_manager: ProfileRAGManager):
        """
        Initialize with RAG manager dependency
        """
        self._sync_executor = ProfileRAGQueryExecutor(rag_manager)
        
    async def execute_query(self, profile_id: int, query: RAGQuery) -> RAGResult:
        """
        Execute query asynchronously
        Delegates to sync executor in thread pool
        """
        import asyncio
        
        # Run sync method in thread pool
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            self._execute_sync,
            profile_id,
            query
        )
        return result
    
    def _execute_sync(self, profile_id: int, query: RAGQuery) -> RAGResult:
        """
        Synchronous execution wrapper
        """
        # Call the sync executor directly since it should be synchronous
        return self._sync_executor.execute_query_sync(profile_id, query)