"""
Unit Tests for Batched RAG System
Validates SOLID principles compliance and functionality
"""

import unittest
import asyncio
from unittest.mock import Mock, AsyncMock, patch
from typing import List, Dict, Any

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from rag.abstractions import (
    RAGQuery,
    RAGResult,
    QueryType,
    BatchedRAGRequest,
    BatchedRAGResponse,
    IRAGQueryExecutor,
    IRAGCache,
    IRAGMetrics,
    IRAGErrorHandler
)
from rag.batched_service import BatchedRAGService
from rag.query_builder import ScenarioRAGQueryBuilder
from rag.implementations import (
    InMemoryRAGCache,
    SimpleRAGMetrics,
    SmartBatchingStrategy,
    ExponentialBackoffErrorHandler
)


class TestBatchedRAGService(unittest.TestCase):
    """Test suite for BatchedRAGService"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.mock_executor = Mock(spec=IRAGQueryExecutor)
        self.cache = InMemoryRAGCache()
        self.metrics = SimpleRAGMetrics()
        self.error_handler = ExponentialBackoffErrorHandler()
        
        self.service = BatchedRAGService(
            query_executor=self.mock_executor,
            cache=self.cache,
            metrics=self.metrics,
            error_handler=self.error_handler,
            max_parallel_queries=6
        )
    
    def test_single_responsibility_principle(self):
        """Test that BatchedRAGService has single responsibility"""
        # Service should only coordinate batch execution
        methods = [m for m in dir(self.service) if not m.startswith('_')]
        
        # Should only have execute_batch as public method
        self.assertEqual(len([m for m in methods if not m.startswith('__')]), 1)
        self.assertIn('execute_batch', methods)
    
    def test_dependency_inversion_principle(self):
        """Test that service depends on abstractions, not concretions"""
        # All dependencies should be interfaces
        self.assertIsInstance(self.service._query_executor, IRAGQueryExecutor)
        self.assertIsInstance(self.service._cache, IRAGCache)
        self.assertIsInstance(self.service._metrics, IRAGMetrics)
        self.assertIsInstance(self.service._error_handler, IRAGErrorHandler)
    
    async def test_batch_execution(self):
        """Test batch execution with parallel processing"""
        # Setup mock responses
        async def mock_execute(profile_id, query):
            return RAGResult(
                query=query,
                result=f"Result for {query.query_type.value}",
                success=True,
                execution_time_ms=10.0
            )
        
        self.mock_executor.execute_query = AsyncMock(side_effect=mock_execute)
        
        # Create batch request
        queries = [
            RAGQuery("Test accounts", QueryType.ACCOUNTS),
            RAGQuery("Test transactions", QueryType.TRANSACTIONS),
            RAGQuery("Test goals", QueryType.GOALS)
        ]
        
        request = BatchedRAGRequest(
            profile_id=1,
            queries=queries,
            scenario_context="test"
        )
        
        # Execute batch
        response = await self.service.execute_batch(request)
        
        # Validate response
        self.assertIsInstance(response, BatchedRAGResponse)
        self.assertEqual(len(response.results), 3)
        self.assertEqual(response.success_rate, 1.0)
        
        # Verify parallel execution
        self.assertEqual(self.mock_executor.execute_query.call_count, 3)
    
    async def test_error_handling(self):
        """Test error handling in batch execution"""
        # Setup mock with one failure
        async def mock_execute(profile_id, query):
            if query.query_type == QueryType.TRANSACTIONS:
                raise Exception("Test error")
            return RAGResult(
                query=query,
                result=f"Result for {query.query_type.value}",
                success=True
            )
        
        self.mock_executor.execute_query = AsyncMock(side_effect=mock_execute)
        
        queries = [
            RAGQuery("Test accounts", QueryType.ACCOUNTS),
            RAGQuery("Test transactions", QueryType.TRANSACTIONS),
            RAGQuery("Test goals", QueryType.GOALS)
        ]
        
        request = BatchedRAGRequest(profile_id=1, queries=queries)
        response = await self.service.execute_batch(request)
        
        # Should handle error gracefully
        self.assertEqual(len(response.results), 3)
        self.assertLess(response.success_rate, 1.0)
        self.assertFalse(response.results[QueryType.TRANSACTIONS.value].success)


class TestQueryBuilder(unittest.TestCase):
    """Test suite for ScenarioRAGQueryBuilder"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.builder = ScenarioRAGQueryBuilder()
    
    def test_open_closed_principle(self):
        """Test that builder is open for extension, closed for modification"""
        # Should handle new scenarios without modifying existing code
        scenarios = [
            "emergency_fund",
            "student_loan",
            "medical_crisis",
            "market_crash",
            "home_purchase",
            "gig_economy",
            "unknown_scenario"
        ]
        
        for scenario in scenarios:
            queries = self.builder.build_scenario_queries(scenario, {})
            self.assertIsInstance(queries, list)
            self.assertTrue(all(isinstance(q, RAGQuery) for q in queries))
            self.assertEqual(len(queries), 6)  # Should always return 6 queries
    
    def test_scenario_specific_queries(self):
        """Test that queries are specific to scenarios"""
        emergency_queries = self.builder.build_scenario_queries("emergency_fund", {})
        student_queries = self.builder.build_scenario_queries("student_loan", {})
        
        # Queries should be different for different scenarios
        emergency_texts = [q.query_text for q in emergency_queries]
        student_texts = [q.query_text for q in student_queries]
        
        # At least some queries should be different
        self.assertNotEqual(emergency_texts, student_texts)
        
        # Should mention scenario-specific terms
        emergency_combined = " ".join(emergency_texts).lower()
        self.assertIn("emergency", emergency_combined)
        
        student_combined = " ".join(student_texts).lower()
        self.assertIn("loan", student_combined)


class TestCacheImplementation(unittest.TestCase):
    """Test suite for InMemoryRAGCache"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.cache = InMemoryRAGCache()
    
    async def test_cache_operations(self):
        """Test cache get/set operations"""
        query = RAGQuery("Test query", QueryType.ACCOUNTS)
        result = RAGResult(
            query=query,
            result="Test result",
            success=True
        )
        
        # Test set
        await self.cache.set("test_key", result, ttl_seconds=1)
        
        # Test get
        cached = await self.cache.get("test_key")
        self.assertIsNotNone(cached)
        self.assertEqual(cached.result, "Test result")
        
        # Test expiration
        await asyncio.sleep(1.1)
        expired = await self.cache.get("test_key")
        self.assertIsNone(expired)
    
    async def test_cache_invalidation(self):
        """Test cache invalidation by pattern"""
        # Add multiple items
        query = RAGQuery("Test", QueryType.ACCOUNTS)
        result = RAGResult(query=query, result="Test", success=True)
        
        await self.cache.set("profile:1:accounts", result)
        await self.cache.set("profile:1:transactions", result)
        await self.cache.set("profile:2:accounts", result)
        
        # Invalidate profile 1
        count = await self.cache.invalidate("profile:1")
        self.assertEqual(count, 2)
        
        # Profile 2 should still exist
        cached = await self.cache.get("profile:2:accounts")
        self.assertIsNotNone(cached)


class TestMetricsCollection(unittest.TestCase):
    """Test suite for SimpleRAGMetrics"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.metrics = SimpleRAGMetrics()
    
    def test_query_metrics_recording(self):
        """Test recording of query execution metrics"""
        # Record multiple query executions
        self.metrics.record_query_execution(QueryType.ACCOUNTS, 100.0, True)
        self.metrics.record_query_execution(QueryType.ACCOUNTS, 150.0, True)
        self.metrics.record_query_execution(QueryType.ACCOUNTS, 200.0, False)
        
        # Get summary
        summary = self.metrics.get_metrics_summary()
        query_metrics = summary["query_metrics"]
        
        # Validate metrics
        accounts_metrics = query_metrics[QueryType.ACCOUNTS.value]
        self.assertEqual(accounts_metrics["total_queries"], 3)
        self.assertAlmostEqual(accounts_metrics["success_rate"], 2/3)
        self.assertAlmostEqual(accounts_metrics["average_duration_ms"], 150.0)
    
    def test_batch_metrics_recording(self):
        """Test recording of batch execution metrics"""
        # Record batch executions
        self.metrics.record_batch_execution(6, 500.0, 0.8)
        self.metrics.record_batch_execution(6, 450.0, 0.9)
        
        # Get summary
        summary = self.metrics.get_metrics_summary()
        batch_metrics = summary["batch_metrics"]
        
        # Validate metrics
        self.assertEqual(batch_metrics["total_batches"], 2)
        self.assertEqual(batch_metrics["total_queries"], 12)
        self.assertAlmostEqual(batch_metrics["average_success_rate"], 0.85)


class TestBatchingStrategy(unittest.TestCase):
    """Test suite for SmartBatchingStrategy"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.strategy = SmartBatchingStrategy(
            min_batch_size=3,
            max_batch_size=5,
            batch_by_type=True
        )
    
    def test_should_batch_decision(self):
        """Test batching decision logic"""
        # Should not batch if below minimum
        queries_small = [
            RAGQuery("Test 1", QueryType.ACCOUNTS),
            RAGQuery("Test 2", QueryType.ACCOUNTS)
        ]
        self.assertFalse(self.strategy.should_batch(queries_small))
        
        # Should batch if at or above minimum
        queries_large = [
            RAGQuery("Test 1", QueryType.ACCOUNTS),
            RAGQuery("Test 2", QueryType.ACCOUNTS),
            RAGQuery("Test 3", QueryType.ACCOUNTS)
        ]
        self.assertTrue(self.strategy.should_batch(queries_large))
    
    def test_batch_creation_by_type(self):
        """Test batch creation with type grouping"""
        queries = [
            RAGQuery("Account 1", QueryType.ACCOUNTS),
            RAGQuery("Account 2", QueryType.ACCOUNTS),
            RAGQuery("Trans 1", QueryType.TRANSACTIONS),
            RAGQuery("Trans 2", QueryType.TRANSACTIONS),
            RAGQuery("Goal 1", QueryType.GOALS),
            RAGQuery("Account 3", QueryType.ACCOUNTS),
        ]
        
        batches = self.strategy.create_batches(queries)
        
        # Should group by type
        for batch in batches:
            types = set(q.query_type for q in batch)
            self.assertEqual(len(types), 1)  # All queries in batch should have same type
            self.assertLessEqual(len(batch), 5)  # Respect max batch size


class TestErrorHandler(unittest.TestCase):
    """Test suite for ExponentialBackoffErrorHandler"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.handler = ExponentialBackoffErrorHandler(
            max_retries=3,
            base_delay_ms=100,
            max_delay_ms=1000
        )
    
    async def test_error_handling(self):
        """Test error handling logic"""
        query = RAGQuery("Test", QueryType.ACCOUNTS)
        
        # Test rate limit error handling
        rate_limit_error = Exception("rate_limit exceeded")
        result = await self.handler.handle_error(
            rate_limit_error,
            {"query": query, "profile_id": 1}
        )
        
        self.assertIsNotNone(result)
        self.assertFalse(result.success)
        self.assertIn("rate limit", result.error.lower())
    
    def test_retry_decision(self):
        """Test retry decision logic"""
        # Should retry on transient errors
        transient_error = Exception("Connection timeout")
        self.assertTrue(self.handler.should_retry(transient_error, 0))
        self.assertTrue(self.handler.should_retry(transient_error, 1))
        self.assertTrue(self.handler.should_retry(transient_error, 2))
        self.assertFalse(self.handler.should_retry(transient_error, 3))  # Max retries
        
        # Should not retry on permanent errors
        permanent_error = Exception("Invalid API key")
        self.assertFalse(self.handler.should_retry(permanent_error, 0))
    
    def test_exponential_backoff(self):
        """Test exponential backoff calculation"""
        delays = [
            self.handler.get_retry_delay_ms(0),
            self.handler.get_retry_delay_ms(1),
            self.handler.get_retry_delay_ms(2),
            self.handler.get_retry_delay_ms(3),
        ]
        
        # Should increase exponentially
        self.assertEqual(delays[0], 100)
        self.assertEqual(delays[1], 200)
        self.assertEqual(delays[2], 400)
        self.assertEqual(delays[3], 800)
        
        # Should respect max delay
        self.assertEqual(self.handler.get_retry_delay_ms(10), 1000)


def run_async_test(coro):
    """Helper to run async tests"""
    loop = asyncio.get_event_loop()
    return loop.run_until_complete(coro)


if __name__ == "__main__":
    # Run all tests
    unittest.main()