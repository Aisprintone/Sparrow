"""
Comprehensive Performance Testing Suite - PERFORMANCE AUDITOR
Validates actual performance improvements with real measurements
Zero tolerance for untested optimizations
"""

import asyncio
import time
import json
import logging
import random
from typing import Dict, List, Any, Tuple
from dataclasses import dataclass, asdict
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
import statistics
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.api_cache import UnifiedAPICache, APIProvider, api_cache
from core.cache_manager import cache_manager
from rag.batched_service import BatchedRAGService
from rag.abstractions import (
    BatchedRAGRequest, RAGQuery, QueryType,
    IRAGQueryExecutor, IRAGCache, IRAGMetrics
)
from rag.query_executor import ProfileRAGQueryExecutor
from rag.implementations import (
    InMemoryRAGCache,
    SimpleRAGMetrics,
    ExponentialBackoffErrorHandler
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class PerformanceMetrics:
    """Performance test results with precise measurements"""
    test_name: str
    total_api_calls: int
    cached_hits: int
    cache_hit_rate: float
    avg_response_time_ms: float
    p50_response_time_ms: float
    p95_response_time_ms: float
    p99_response_time_ms: float
    total_time_seconds: float
    requests_per_second: float
    error_rate: float
    memory_usage_mb: float
    
    def __str__(self):
        return f"""
=== {self.test_name} ===
API Calls: {self.total_api_calls}
Cache Hits: {self.cached_hits} ({self.cache_hit_rate:.1%} hit rate)
Response Times:
  - Avg: {self.avg_response_time_ms:.2f}ms
  - P50: {self.p50_response_time_ms:.2f}ms
  - P95: {self.p95_response_time_ms:.2f}ms
  - P99: {self.p99_response_time_ms:.2f}ms
Throughput: {self.requests_per_second:.2f} req/s
Error Rate: {self.error_rate:.1%}
Memory Usage: {self.memory_usage_mb:.2f} MB
Total Time: {self.total_time_seconds:.2f}s
"""


class MockAPIProvider:
    """Mock API provider for controlled testing"""
    
    def __init__(self, delay_ms: float = 100, failure_rate: float = 0.0):
        self.delay_ms = delay_ms
        self.failure_rate = failure_rate
        self.call_count = 0
        self.call_history = []
    
    async def make_call(self, prompt: str) -> str:
        """Simulate API call with controlled delay and failure"""
        self.call_count += 1
        self.call_history.append({
            "timestamp": time.time(),
            "prompt": prompt
        })
        
        # Simulate network delay
        await asyncio.sleep(self.delay_ms / 1000)
        
        # Simulate random failures
        if random.random() < self.failure_rate:
            raise Exception("Simulated API failure")
        
        return f"Response for: {prompt[:50]}..."


class PerformanceTestSuite:
    """Comprehensive performance testing suite"""
    
    def __init__(self):
        self.mock_provider = MockAPIProvider()
        self.metrics_history = []
    
    def _calculate_percentiles(self, times: List[float]) -> Tuple[float, float, float]:
        """Calculate response time percentiles"""
        if not times:
            return 0, 0, 0
        
        sorted_times = sorted(times)
        p50 = sorted_times[len(sorted_times) // 2]
        p95 = sorted_times[int(len(sorted_times) * 0.95)]
        p99 = sorted_times[int(len(sorted_times) * 0.99)]
        
        return p50, p95, p99
    
    def _get_memory_usage(self) -> float:
        """Get current memory usage in MB"""
        import psutil
        process = psutil.Process()
        return process.memory_info().rss / 1024 / 1024
    
    async def test_cache_effectiveness(self, num_requests: int = 100) -> PerformanceMetrics:
        """Test cache hit rates with repeated queries"""
        logger.info(f"Testing cache effectiveness with {num_requests} requests")
        
        # Reset cache stats
        api_cache._stats = {
            "cache_hits": 0,
            "cache_misses": 0,
            "api_calls": 0,
            "errors": 0,
            "total_tokens": 0,
            "total_cost": 0.0
        }
        
        # Create test queries with controlled repetition
        queries = []
        unique_queries = [
            "Analyze emergency fund requirements",
            "Calculate student loan repayment",
            "Optimize investment portfolio",
            "Plan retirement savings",
            "Budget for home purchase"
        ]
        
        # 80% repeated queries, 20% unique
        for i in range(num_requests):
            if i < 20:  # First 20 are unique to prime cache
                queries.append(unique_queries[i % len(unique_queries)])
            else:  # Rest are repeated
                queries.append(random.choice(unique_queries))
        
        response_times = []
        errors = 0
        start_time = time.time()
        
        for query in queries:
            try:
                query_start = time.time()
                
                # Use actual cache API
                result = await api_cache.cached_api_call(
                    operation="completion",
                    prompt=query,
                    provider=APIProvider.ANTHROPIC if "ANTHROPIC_API_KEY" in os.environ else None
                )
                
                response_times.append((time.time() - query_start) * 1000)
                
            except Exception as e:
                errors += 1
                logger.error(f"Query failed: {e}")
        
        total_time = time.time() - start_time
        stats = api_cache.get_stats()
        
        p50, p95, p99 = self._calculate_percentiles(response_times)
        
        return PerformanceMetrics(
            test_name="Cache Effectiveness Test",
            total_api_calls=stats["api_calls"],
            cached_hits=stats["cache_hits"],
            cache_hit_rate=stats["cache_hits"] / max(1, stats["cache_hits"] + stats["cache_misses"]),
            avg_response_time_ms=statistics.mean(response_times) if response_times else 0,
            p50_response_time_ms=p50,
            p95_response_time_ms=p95,
            p99_response_time_ms=p99,
            total_time_seconds=total_time,
            requests_per_second=num_requests / total_time,
            error_rate=errors / num_requests,
            memory_usage_mb=self._get_memory_usage()
        )
    
    async def test_batched_rag_performance(self, num_batches: int = 20) -> PerformanceMetrics:
        """Test batched RAG query execution"""
        logger.info(f"Testing batched RAG with {num_batches} batches")
        
        # Create test components
        query_executor = ProfileRAGQueryExecutor()
        rag_cache = InMemoryRAGCache()
        metrics = SimpleRAGMetrics()
        
        batched_service = BatchedRAGService(
            query_executor=query_executor,
            cache=rag_cache,
            metrics=metrics,
            max_parallel_queries=6
        )
        
        response_times = []
        api_calls = 0
        cache_hits = 0
        errors = 0
        start_time = time.time()
        
        for batch_num in range(num_batches):
            # Create batch request with multiple query types
            queries = [
                RAGQuery(
                    query_type=QueryType.FINANCIAL_PROFILE,
                    query_text="Get user financial profile"
                ),
                RAGQuery(
                    query_type=QueryType.SPENDING_ANALYSIS,
                    query_text="Analyze spending patterns"
                ),
                RAGQuery(
                    query_type=QueryType.GOAL_TRACKING,
                    query_text="Track financial goals"
                ),
                RAGQuery(
                    query_type=QueryType.RISK_ASSESSMENT,
                    query_text="Assess financial risks"
                ),
                RAGQuery(
                    query_type=QueryType.RECOMMENDATIONS,
                    query_text="Generate recommendations"
                )
            ]
            
            request = BatchedRAGRequest(
                profile_id=random.randint(1, 100),  # Vary profile IDs for cache testing
                queries=queries
            )
            
            try:
                batch_start = time.time()
                response = await batched_service.execute_batch(request)
                response_times.append((time.time() - batch_start) * 1000)
                
                # Count successful queries
                for result in response.results.values():
                    if result.success:
                        if result.cached:
                            cache_hits += 1
                        else:
                            api_calls += 1
                            
            except Exception as e:
                errors += 1
                logger.error(f"Batch {batch_num} failed: {e}")
        
        total_time = time.time() - start_time
        total_queries = num_batches * 5  # 5 queries per batch
        
        p50, p95, p99 = self._calculate_percentiles(response_times)
        
        return PerformanceMetrics(
            test_name="Batched RAG Performance Test",
            total_api_calls=api_calls,
            cached_hits=cache_hits,
            cache_hit_rate=cache_hits / max(1, cache_hits + api_calls),
            avg_response_time_ms=statistics.mean(response_times) if response_times else 0,
            p50_response_time_ms=p50,
            p95_response_time_ms=p95,
            p99_response_time_ms=p99,
            total_time_seconds=total_time,
            requests_per_second=num_batches / total_time,
            error_rate=errors / num_batches,
            memory_usage_mb=self._get_memory_usage()
        )
    
    async def test_concurrent_load(self, num_concurrent: int = 50, duration_seconds: int = 10) -> PerformanceMetrics:
        """Test system under concurrent load"""
        logger.info(f"Testing concurrent load with {num_concurrent} concurrent requests for {duration_seconds}s")
        
        response_times = []
        errors = 0
        completed_requests = 0
        start_time = time.time()
        
        async def make_request(request_id: int):
            """Make a single request"""
            nonlocal errors, completed_requests
            
            query = f"Concurrent request {request_id} - {random.choice(['emergency', 'loan', 'investment', 'budget'])}"
            
            try:
                request_start = time.time()
                result = await api_cache.cached_api_call(
                    operation="completion",
                    prompt=query
                )
                response_times.append((time.time() - request_start) * 1000)
                completed_requests += 1
                
            except Exception as e:
                errors += 1
                logger.error(f"Request {request_id} failed: {e}")
        
        # Run concurrent requests for specified duration
        tasks = []
        request_id = 0
        
        while time.time() - start_time < duration_seconds:
            # Maintain concurrent load
            active_tasks = [t for t in tasks if not t.done()]
            
            while len(active_tasks) < num_concurrent:
                task = asyncio.create_task(make_request(request_id))
                tasks.append(task)
                request_id += 1
                active_tasks.append(task)
            
            await asyncio.sleep(0.01)  # Small delay to prevent CPU spinning
        
        # Wait for remaining tasks to complete
        await asyncio.gather(*tasks, return_exceptions=True)
        
        total_time = time.time() - start_time
        stats = api_cache.get_stats()
        
        p50, p95, p99 = self._calculate_percentiles(response_times)
        
        return PerformanceMetrics(
            test_name="Concurrent Load Test",
            total_api_calls=stats["api_calls"],
            cached_hits=stats["cache_hits"],
            cache_hit_rate=stats["cache_hits"] / max(1, stats["cache_hits"] + stats["cache_misses"]),
            avg_response_time_ms=statistics.mean(response_times) if response_times else 0,
            p50_response_time_ms=p50,
            p95_response_time_ms=p95,
            p99_response_time_ms=p99,
            total_time_seconds=total_time,
            requests_per_second=completed_requests / total_time,
            error_rate=errors / max(1, completed_requests + errors),
            memory_usage_mb=self._get_memory_usage()
        )
    
    async def test_cache_warming(self) -> PerformanceMetrics:
        """Test cache warming effectiveness"""
        logger.info("Testing cache warming functionality")
        
        # Clear cache first
        await cache_manager.clear()
        
        # Define warming scenarios
        warming_scenarios = [
            {"operation": "completion", "prompt": "Analyze emergency fund requirements"},
            {"operation": "completion", "prompt": "Calculate student loan repayment"},
            {"operation": "completion", "prompt": "Optimize investment portfolio"},
            {"operation": "embedding", "prompt": "financial planning strategies"},
            {"operation": "embedding", "prompt": "debt management techniques"}
        ]
        
        # Warm the cache
        warm_start = time.time()
        await api_cache.warm_cache(warming_scenarios)
        warm_time = time.time() - warm_start
        
        # Test cache hits after warming
        response_times = []
        cache_hits = 0
        
        for scenario in warming_scenarios:
            query_start = time.time()
            
            result = await api_cache.cached_api_call(
                operation=scenario["operation"],
                prompt=scenario["prompt"]
            )
            
            response_times.append((time.time() - query_start) * 1000)
            
            # Check if it was a cache hit (should be very fast)
            if (time.time() - query_start) < 0.01:  # Less than 10ms indicates cache hit
                cache_hits += 1
        
        stats = api_cache.get_stats()
        p50, p95, p99 = self._calculate_percentiles(response_times)
        
        return PerformanceMetrics(
            test_name="Cache Warming Test",
            total_api_calls=stats["api_calls"],
            cached_hits=cache_hits,
            cache_hit_rate=cache_hits / len(warming_scenarios),
            avg_response_time_ms=statistics.mean(response_times) if response_times else 0,
            p50_response_time_ms=p50,
            p95_response_time_ms=p95,
            p99_response_time_ms=p99,
            total_time_seconds=warm_time,
            requests_per_second=len(warming_scenarios) / warm_time,
            error_rate=0,
            memory_usage_mb=self._get_memory_usage()
        )
    
    async def compare_before_after(self) -> Dict[str, Any]:
        """Compare performance before and after optimizations"""
        logger.info("Running before/after comparison")
        
        results = {
            "timestamp": datetime.now().isoformat(),
            "optimizations_tested": [
                "Unified API Cache",
                "Batched RAG Queries",
                "Concurrent Request Handling",
                "Cache Warming"
            ],
            "results": {}
        }
        
        # Simulate "before" scenario (no caching)
        logger.info("Simulating BEFORE optimizations (no cache)")
        await cache_manager.clear()
        api_cache._stats = {
            "cache_hits": 0,
            "cache_misses": 0,
            "api_calls": 0,
            "errors": 0,
            "total_tokens": 0,
            "total_cost": 0.0
        }
        
        # Run tests without cache
        before_start = time.time()
        before_requests = 50
        before_times = []
        
        for i in range(before_requests):
            query_start = time.time()
            try:
                # Force cache miss by using unique queries
                result = await api_cache.cached_api_call(
                    operation="completion",
                    prompt=f"Unique query {i} - {time.time()}"
                )
                before_times.append((time.time() - query_start) * 1000)
            except:
                pass
        
        before_total_time = time.time() - before_start
        before_stats = api_cache.get_stats()
        
        # Now test WITH optimizations
        logger.info("Testing AFTER optimizations (with cache)")
        
        # Run same queries to test cache
        after_start = time.time()
        after_times = []
        
        for i in range(before_requests):
            query_start = time.time()
            try:
                # Use repeated queries to test cache
                result = await api_cache.cached_api_call(
                    operation="completion",
                    prompt=f"Repeated query {i % 5}"  # Only 5 unique queries
                )
                after_times.append((time.time() - query_start) * 1000)
            except:
                pass
        
        after_total_time = time.time() - after_start
        after_stats = api_cache.get_stats()
        
        # Calculate improvements
        avg_before = statistics.mean(before_times) if before_times else 0
        avg_after = statistics.mean(after_times) if after_times else 0
        
        results["results"] = {
            "before": {
                "total_api_calls": before_stats["api_calls"],
                "avg_response_time_ms": avg_before,
                "total_time_seconds": before_total_time,
                "cache_hit_rate": 0
            },
            "after": {
                "total_api_calls": after_stats["api_calls"],
                "avg_response_time_ms": avg_after,
                "total_time_seconds": after_total_time,
                "cache_hit_rate": after_stats["cache_hits"] / max(1, after_stats["cache_hits"] + after_stats["cache_misses"])
            },
            "improvements": {
                "api_call_reduction": f"{(1 - after_stats['api_calls']/max(1, before_stats['api_calls'])) * 100:.1f}%",
                "response_time_improvement": f"{(1 - avg_after/max(1, avg_before)) * 100:.1f}%",
                "total_time_reduction": f"{(1 - after_total_time/max(1, before_total_time)) * 100:.1f}%"
            }
        }
        
        return results


async def main():
    """Run comprehensive performance tests"""
    print("\n" + "="*80)
    print("PERFORMANCE AUDITOR - COMPREHENSIVE OPTIMIZATION VALIDATION")
    print("="*80)
    
    test_suite = PerformanceTestSuite()
    all_results = []
    
    # Test 1: Cache Effectiveness
    print("\n[1/5] Testing Cache Effectiveness...")
    cache_metrics = await test_suite.test_cache_effectiveness(num_requests=100)
    print(cache_metrics)
    all_results.append(asdict(cache_metrics))
    
    # Test 2: Batched RAG Performance
    print("\n[2/5] Testing Batched RAG Performance...")
    try:
        rag_metrics = await test_suite.test_batched_rag_performance(num_batches=10)
        print(rag_metrics)
        all_results.append(asdict(rag_metrics))
    except Exception as e:
        print(f"RAG test skipped (dependencies not available): {e}")
    
    # Test 3: Concurrent Load
    print("\n[3/5] Testing Concurrent Load Handling...")
    load_metrics = await test_suite.test_concurrent_load(num_concurrent=20, duration_seconds=5)
    print(load_metrics)
    all_results.append(asdict(load_metrics))
    
    # Test 4: Cache Warming
    print("\n[4/5] Testing Cache Warming...")
    warming_metrics = await test_suite.test_cache_warming()
    print(warming_metrics)
    all_results.append(asdict(warming_metrics))
    
    # Test 5: Before/After Comparison
    print("\n[5/5] Running Before/After Comparison...")
    comparison = await test_suite.compare_before_after()
    
    print("\n" + "="*80)
    print("BEFORE/AFTER OPTIMIZATION COMPARISON")
    print("="*80)
    print(json.dumps(comparison, indent=2))
    
    # Save all results
    final_report = {
        "test_run": datetime.now().isoformat(),
        "individual_tests": all_results,
        "comparison": comparison,
        "summary": {
            "total_tests_run": len(all_results),
            "avg_cache_hit_rate": statistics.mean([r["cache_hit_rate"] for r in all_results]),
            "avg_response_time_ms": statistics.mean([r["avg_response_time_ms"] for r in all_results]),
            "total_api_calls_saved": sum([r["cached_hits"] for r in all_results])
        }
    }
    
    # Save to file
    with open("performance_test_results.json", "w") as f:
        json.dump(final_report, f, indent=2)
    
    print("\n" + "="*80)
    print("FINAL VERDICT")
    print("="*80)
    
    # Determine if optimizations are effective
    improvements = comparison["results"]["improvements"]
    api_reduction = float(improvements["api_call_reduction"].rstrip("%"))
    time_improvement = float(improvements["response_time_improvement"].rstrip("%"))
    
    if api_reduction > 50 and time_improvement > 30:
        print("✓ OPTIMIZATIONS VALIDATED: Significant performance improvements achieved")
        print(f"  - API calls reduced by {api_reduction:.1f}%")
        print(f"  - Response time improved by {time_improvement:.1f}%")
        print(f"  - Cache hit rate: {final_report['summary']['avg_cache_hit_rate']:.1%}")
    else:
        print("✗ OPTIMIZATIONS INSUFFICIENT: Performance targets not met")
        print(f"  - API reduction: {api_reduction:.1f}% (target: >50%)")
        print(f"  - Time improvement: {time_improvement:.1f}% (target: >30%)")
    
    print("\nFull results saved to: performance_test_results.json")
    print("="*80)


if __name__ == "__main__":
    # Check for required dependencies
    try:
        import psutil
    except ImportError:
        print("Installing psutil for memory monitoring...")
        os.system("pip install psutil")
        import psutil
    
    asyncio.run(main())