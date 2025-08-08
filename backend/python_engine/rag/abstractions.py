"""
RAG System Abstractions - SOLID Principle Compliant
Defines interfaces and contracts for RAG operations following DIP
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional, TypeVar, Generic
from dataclasses import dataclass
from enum import Enum


class QueryType(Enum):
    """Enumeration of available query types"""
    ACCOUNTS = "query_accounts"
    TRANSACTIONS = "query_transactions"
    DEMOGRAPHICS = "query_demographics"
    GOALS = "query_goals"
    INVESTMENTS = "query_investments"
    COMPREHENSIVE = "query_all_data"


@dataclass
class RAGQuery:
    """Single RAG query request - immutable value object"""
    query_text: str
    query_type: QueryType
    metadata: Optional[Dict[str, Any]] = None
    
    def __hash__(self):
        return hash((self.query_text, self.query_type))


@dataclass
class RAGResult:
    """Single RAG query result - immutable value object"""
    query: RAGQuery
    result: str
    success: bool
    error: Optional[str] = None
    execution_time_ms: Optional[float] = None


@dataclass
class BatchedRAGRequest:
    """Batched RAG request container"""
    profile_id: int
    queries: List[RAGQuery]
    scenario_context: Optional[str] = None
    
    def __len__(self) -> int:
        return len(self.queries)


@dataclass
class BatchedRAGResponse:
    """Batched RAG response container"""
    request: BatchedRAGRequest
    results: Dict[str, RAGResult]
    total_execution_time_ms: float
    success_rate: float
    
    def get_result(self, query_type: QueryType) -> Optional[RAGResult]:
        """Get result for specific query type"""
        return self.results.get(query_type.value)


# Abstract interfaces following Interface Segregation Principle

class IRAGQueryExecutor(ABC):
    """Interface for executing individual RAG queries"""
    
    @abstractmethod
    async def execute_query(self, profile_id: int, query: RAGQuery) -> RAGResult:
        """Execute a single RAG query"""
        pass


class IRAGBatchExecutor(ABC):
    """Interface for executing batched RAG queries"""
    
    @abstractmethod
    async def execute_batch(self, request: BatchedRAGRequest) -> BatchedRAGResponse:
        """Execute a batch of RAG queries"""
        pass


class IRAGBatchingStrategy(ABC):
    """Interface for batching strategies - Open/Closed Principle"""
    
    @abstractmethod
    def should_batch(self, queries: List[RAGQuery]) -> bool:
        """Determine if queries should be batched"""
        pass
    
    @abstractmethod
    def create_batches(self, queries: List[RAGQuery]) -> List[List[RAGQuery]]:
        """Create optimized batches from queries"""
        pass


class IRAGCache(ABC):
    """Interface for RAG result caching"""
    
    @abstractmethod
    async def get(self, key: str) -> Optional[RAGResult]:
        """Get cached result"""
        pass
    
    @abstractmethod
    async def set(self, key: str, result: RAGResult, ttl_seconds: int = 300) -> None:
        """Cache result with TTL"""
        pass
    
    @abstractmethod
    async def invalidate(self, pattern: str) -> int:
        """Invalidate cache entries matching pattern"""
        pass


class IRAGMetrics(ABC):
    """Interface for RAG metrics collection"""
    
    @abstractmethod
    def record_query_execution(self, query_type: QueryType, duration_ms: float, success: bool) -> None:
        """Record query execution metrics"""
        pass
    
    @abstractmethod
    def record_batch_execution(self, batch_size: int, duration_ms: float, success_rate: float) -> None:
        """Record batch execution metrics"""
        pass
    
    @abstractmethod
    def get_metrics_summary(self) -> Dict[str, Any]:
        """Get metrics summary"""
        pass


class IRAGQueryBuilder(ABC):
    """Interface for building RAG queries"""
    
    @abstractmethod
    def build_scenario_queries(self, scenario_name: str, profile_context: Dict[str, Any]) -> List[RAGQuery]:
        """Build queries for a specific scenario"""
        pass
    
    @abstractmethod
    def build_comprehensive_queries(self) -> List[RAGQuery]:
        """Build comprehensive analysis queries"""
        pass


# Generic result transformer interface
T = TypeVar('T')

class IRAGResultTransformer(ABC, Generic[T]):
    """Interface for transforming RAG results"""
    
    @abstractmethod
    def transform(self, response: BatchedRAGResponse) -> T:
        """Transform batched response to domain-specific type"""
        pass


class IRAGErrorHandler(ABC):
    """Interface for handling RAG errors"""
    
    @abstractmethod
    async def handle_error(self, error: Exception, context: Dict[str, Any]) -> Optional[RAGResult]:
        """Handle error and potentially provide fallback"""
        pass
    
    @abstractmethod
    def should_retry(self, error: Exception, attempt: int) -> bool:
        """Determine if operation should be retried"""
        pass