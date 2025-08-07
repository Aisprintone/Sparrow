"""
Realistic Load Testing Suite - PERFORMANCE AUDITOR
Simulates actual user traffic patterns and measures system behavior
"""

import asyncio
import time
import json
import random
import logging
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
import statistics
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.api_cache import api_cache, APIProvider
from core.cache_manager import cache_manager
from rag.batched_service import BatchedRAGService
from rag.abstractions import BatchedRAGRequest, RAGQuery, QueryType
from rag.query_executor import ProfileRAGQueryExecutor
from rag.implementations import InMemoryRAGCache

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class UserBehavior:
    """Realistic user behavior patterns"""
    user_id: int
    profile_type: str  # "active", "moderate", "occasional"
    avg_queries_per_session: int
    avg_session_duration_seconds: float
    peak_hours: List[int]  # Hours when user is most active
    query_patterns: List[str]  # Types of queries user makes


@dataclass
class LoadTestResults:
    """Load test measurement results"""
    duration_seconds: float
    total_users: int
    total_requests: int
    successful_requests: int
    failed_requests: int
    avg_response_time_ms: float
    p50_response_time_ms: float
    p95_response_time_ms: float
    p99_response_time_ms: float
    requests_per_second: float
    concurrent_users_peak: int
    api_calls_made: int
    cache_hits: int
    cache_hit_rate: float
    error_types: Dict[str, int]
    hourly_distribution: Dict[int, int]


class RealisticLoadSimulator:
    """Simulates realistic user traffic patterns"""
    
    def __init__(self):
        self.user_behaviors = self._generate_user_behaviors()
        self.query_templates = self._get_query_templates()
        self.active_sessions = {}
        self.metrics = {
            "response_times": [],
            "errors": [],
            "requests_by_hour": {h: 0 for h in range(24)},
            "concurrent_users": [],
            "api_calls": 0,
            "cache_hits": 0
        }
    
    def _generate_user_behaviors(self, num_users: int = 100) -> List[UserBehavior]:
        """Generate diverse user behavior patterns"""
        behaviors = []
        
        # 20% power users (active)
        for i in range(int(num_users * 0.2)):
            behaviors.append(UserBehavior(
                user_id=i,
                profile_type="active",
                avg_queries_per_session=random.randint(15, 25),
                avg_session_duration_seconds=random.uniform(300, 600),
                peak_hours=[9, 10, 11, 14, 15, 16, 19, 20],
                query_patterns=["analysis", "optimization", "tracking", "planning", "emergency"]
            ))
        
        # 50% regular users (moderate)
        for i in range(int(num_users * 0.2), int(num_users * 0.7)):
            behaviors.append(UserBehavior(
                user_id=i,
                profile_type="moderate",
                avg_queries_per_session=random.randint(5, 15),
                avg_session_duration_seconds=random.uniform(120, 300),
                peak_hours=[12, 13, 18, 19, 20, 21],
                query_patterns=["checking", "planning", "budgeting"]
            ))
        
        # 30% occasional users
        for i in range(int(num_users * 0.7), num_users):
            behaviors.append(UserBehavior(
                user_id=i,
                profile_type="occasional",
                avg_queries_per_session=random.randint(2, 5),
                avg_session_duration_seconds=random.uniform(60, 120),
                peak_hours=[19, 20, 21],
                query_patterns=["checking", "basic"]
            ))
        
        return behaviors
    
    def _get_query_templates(self) -> Dict[str, List[str]]:
        """Get realistic query templates by category"""
        return {
            "analysis": [
                "Analyze my spending patterns for the last month",
                "Show me my investment portfolio performance",
                "Calculate my debt-to-income ratio",
                "Review my emergency fund adequacy",
                "Analyze my tax optimization opportunities"
            ],
            "optimization": [
                "Optimize my student loan repayment strategy",
                "Find ways to reduce my monthly expenses",
                "Suggest investment allocation improvements",
                "Optimize my retirement contributions",
                "Improve my credit utilization"
            ],
            "tracking": [
                "Track progress toward my savings goals",
                "Monitor my budget compliance this month",
                "Show my net worth trend",
                "Track my investment returns YTD",
                "Monitor my spending by category"
            ],
            "planning": [
                "Plan for home purchase in 2 years",
                "Create emergency fund building plan",
                "Plan retirement savings strategy",
                "Create debt payoff plan",
                "Plan for upcoming major expenses"
            ],
            "emergency": [
                "Handle unexpected medical expense",
                "Deal with job loss scenario",
                "Manage emergency car repair",
                "Handle rent increase situation",
                "Cope with market downturn"
            ],
            "checking": [
                "Check my account balances",
                "View recent transactions",
                "Check my credit score",
                "View monthly summary",
                "Check goal progress"
            ],
            "basic": [
                "What's my current balance?",
                "How much did I spend this month?",
                "Am I on budget?",
                "When is my next bill due?",
                "How much do I have saved?"
            ],
            "budgeting": [
                "Create monthly budget",
                "Adjust budget categories",
                "Set spending limits",
                "Review budget variance",
                "Plan next month's budget"
            ]
        }
    
    async def simulate_user_session(self, user: UserBehavior, current_hour: int) -> Dict[str, Any]:
        """Simulate a single user session"""
        session_id = f"user_{user.user_id}_{time.time()}"
        session_metrics = {
            "user_id": user.user_id,
            "start_time": time.time(),
            "queries": [],
            "errors": [],
            "total_queries": 0
        }
        
        # Check if user is likely to be active at this hour
        if current_hour not in user.peak_hours:
            if random.random() > 0.3:  # 70% chance to skip if not peak hour
                return session_metrics
        
        # Start session
        self.active_sessions[session_id] = True
        num_queries = random.randint(
            max(1, user.avg_queries_per_session - 5),
            user.avg_queries_per_session + 5
        )
        
        for query_num in range(num_queries):
            if session_id not in self.active_sessions:
                break
            
            # Select query based on user patterns
            pattern = random.choice(user.query_patterns)
            query_text = random.choice(self.query_templates[pattern])
            
            # Add user context to make query unique
            query_text = f"User {user.user_id}: {query_text}"
            
            # Simulate query execution
            query_start = time.time()
            
            try:
                # Use actual API cache for realistic testing
                result = await api_cache.cached_api_call(
                    operation="completion",
                    prompt=query_text,
                    max_tokens=200  # Smaller for load testing
                )
                
                response_time = (time.time() - query_start) * 1000
                self.metrics["response_times"].append(response_time)
                session_metrics["queries"].append({
                    "pattern": pattern,
                    "response_time_ms": response_time,
                    "cached": response_time < 10  # Assume <10ms means cached
                })
                
                if response_time < 10:
                    self.metrics["cache_hits"] += 1
                else:
                    self.metrics["api_calls"] += 1
                
            except Exception as e:
                error_type = type(e).__name__
                self.metrics["errors"].append({
                    "type": error_type,
                    "message": str(e),
                    "user_id": user.user_id
                })
                session_metrics["errors"].append(error_type)
            
            session_metrics["total_queries"] += 1
            self.metrics["requests_by_hour"][current_hour] += 1
            
            # Simulate think time between queries
            think_time = random.uniform(2, 10) if user.profile_type == "active" else random.uniform(5, 20)
            await asyncio.sleep(think_time)
        
        # End session
        if session_id in self.active_sessions:
            del self.active_sessions[session_id]
        
        session_metrics["duration"] = time.time() - session_metrics["start_time"]
        return session_metrics
    
    async def simulate_traffic_pattern(
        self,
        duration_hours: float = 1.0,
        peak_multiplier: float = 3.0
    ) -> LoadTestResults:
        """Simulate realistic traffic patterns over time"""
        logger.info(f"Starting {duration_hours} hour traffic simulation")
        
        start_time = time.time()
        end_time = start_time + (duration_hours * 3600)
        
        # Reset metrics
        self.metrics = {
            "response_times": [],
            "errors": [],
            "requests_by_hour": {h: 0 for h in range(24)},
            "concurrent_users": [],
            "api_calls": 0,
            "cache_hits": 0
        }
        
        # Clear cache stats
        api_cache._stats = {
            "cache_hits": 0,
            "cache_misses": 0,
            "api_calls": 0,
            "errors": 0,
            "total_tokens": 0,
            "total_cost": 0.0
        }
        
        all_sessions = []
        tasks = []
        
        # Simulate time progression
        simulated_hour = 9  # Start at 9 AM
        
        while time.time() < end_time:
            current_hour = simulated_hour % 24
            
            # Determine load based on hour (peak hours get more traffic)
            is_peak = current_hour in [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
            base_users = 10
            
            if is_peak:
                active_users = int(base_users * peak_multiplier)
            else:
                active_users = base_users
            
            # Sample users to be active
            selected_users = random.sample(
                self.user_behaviors,
                min(active_users, len(self.user_behaviors))
            )
            
            # Start user sessions
            session_tasks = []
            for user in selected_users:
                if random.random() < 0.7:  # 70% chance user starts session
                    task = asyncio.create_task(
                        self.simulate_user_session(user, current_hour)
                    )
                    session_tasks.append(task)
            
            # Record concurrent users
            self.metrics["concurrent_users"].append(len(self.active_sessions))
            
            # Wait for some sessions to complete
            if session_tasks:
                done, pending = await asyncio.wait(
                    session_tasks,
                    timeout=30,  # Wait up to 30 seconds
                    return_when=asyncio.FIRST_COMPLETED
                )
                
                for task in done:
                    try:
                        session = await task
                        all_sessions.append(session)
                    except Exception as e:
                        logger.error(f"Session failed: {e}")
                
                # Keep pending tasks running
                tasks.extend(pending)
            
            # Progress time
            await asyncio.sleep(5)  # Simulate 5 seconds of real time
            
            # Move to next hour every ~20 seconds of simulation
            if int((time.time() - start_time) / 20) > (simulated_hour - 9):
                simulated_hour += 1
        
        # Wait for remaining tasks
        if tasks:
            results = await asyncio.gather(*tasks, return_exceptions=True)
            for result in results:
                if not isinstance(result, Exception):
                    all_sessions.append(result)
        
        # Calculate final metrics
        total_duration = time.time() - start_time
        total_requests = len(self.metrics["response_times"]) + len(self.metrics["errors"])
        
        # Get error type distribution
        error_types = {}
        for error in self.metrics["errors"]:
            error_type = error["type"]
            error_types[error_type] = error_types.get(error_type, 0) + 1
        
        # Calculate percentiles
        response_times = self.metrics["response_times"]
        if response_times:
            sorted_times = sorted(response_times)
            p50 = sorted_times[len(sorted_times) // 2]
            p95 = sorted_times[int(len(sorted_times) * 0.95)]
            p99 = sorted_times[int(len(sorted_times) * 0.99)]
            avg_response = statistics.mean(response_times)
        else:
            p50 = p95 = p99 = avg_response = 0
        
        # Get final cache stats
        final_stats = api_cache.get_stats()
        
        return LoadTestResults(
            duration_seconds=total_duration,
            total_users=len(self.user_behaviors),
            total_requests=total_requests,
            successful_requests=len(self.metrics["response_times"]),
            failed_requests=len(self.metrics["errors"]),
            avg_response_time_ms=avg_response,
            p50_response_time_ms=p50,
            p95_response_time_ms=p95,
            p99_response_time_ms=p99,
            requests_per_second=total_requests / total_duration if total_duration > 0 else 0,
            concurrent_users_peak=max(self.metrics["concurrent_users"]) if self.metrics["concurrent_users"] else 0,
            api_calls_made=final_stats["api_calls"],
            cache_hits=final_stats["cache_hits"],
            cache_hit_rate=final_stats["cache_hits"] / max(1, final_stats["cache_hits"] + final_stats["cache_misses"]),
            error_types=error_types,
            hourly_distribution=self.metrics["requests_by_hour"]
        )


async def run_load_tests():
    """Run comprehensive load testing scenarios"""
    print("\n" + "="*80)
    print("REALISTIC LOAD TESTING SUITE")
    print("="*80)
    
    simulator = RealisticLoadSimulator()
    results = {}
    
    # Test 1: Normal Load
    print("\n[Test 1] Normal Load Pattern (1 hour simulation)...")
    normal_results = await simulator.simulate_traffic_pattern(
        duration_hours=0.1,  # 6 minutes for testing
        peak_multiplier=2.0
    )
    results["normal_load"] = asdict(normal_results)
    
    print(f"""
Normal Load Results:
- Total Requests: {normal_results.total_requests}
- Success Rate: {(normal_results.successful_requests/max(1, normal_results.total_requests))*100:.1f}%
- Avg Response: {normal_results.avg_response_time_ms:.2f}ms
- P95 Response: {normal_results.p95_response_time_ms:.2f}ms
- Cache Hit Rate: {normal_results.cache_hit_rate:.1%}
- Peak Concurrent Users: {normal_results.concurrent_users_peak}
- Throughput: {normal_results.requests_per_second:.2f} req/s
""")
    
    # Test 2: Peak Load
    print("\n[Test 2] Peak Load Pattern (rush hour simulation)...")
    simulator = RealisticLoadSimulator()  # Fresh simulator
    peak_results = await simulator.simulate_traffic_pattern(
        duration_hours=0.1,  # 6 minutes for testing
        peak_multiplier=5.0  # Higher multiplier for peak
    )
    results["peak_load"] = asdict(peak_results)
    
    print(f"""
Peak Load Results:
- Total Requests: {peak_results.total_requests}
- Success Rate: {(peak_results.successful_requests/max(1, peak_results.total_requests))*100:.1f}%
- Avg Response: {peak_results.avg_response_time_ms:.2f}ms
- P95 Response: {peak_results.p95_response_time_ms:.2f}ms
- Cache Hit Rate: {peak_results.cache_hit_rate:.1%}
- Peak Concurrent Users: {peak_results.concurrent_users_peak}
- Throughput: {peak_results.requests_per_second:.2f} req/s
""")
    
    # Test 3: Stress Test
    print("\n[Test 3] Stress Test (extreme load)...")
    
    # Generate more users for stress test
    stress_simulator = RealisticLoadSimulator()
    stress_simulator.user_behaviors = stress_simulator._generate_user_behaviors(200)
    
    stress_results = await stress_simulator.simulate_traffic_pattern(
        duration_hours=0.05,  # 3 minutes for stress test
        peak_multiplier=10.0  # Very high multiplier
    )
    results["stress_test"] = asdict(stress_results)
    
    print(f"""
Stress Test Results:
- Total Requests: {stress_results.total_requests}
- Success Rate: {(stress_results.successful_requests/max(1, stress_results.total_requests))*100:.1f}%
- Avg Response: {stress_results.avg_response_time_ms:.2f}ms
- P99 Response: {stress_results.p99_response_time_ms:.2f}ms
- Error Rate: {(stress_results.failed_requests/max(1, stress_results.total_requests))*100:.1f}%
- Peak Concurrent Users: {stress_results.concurrent_users_peak}
- API Calls Made: {stress_results.api_calls_made}
- Cache Efficiency: {stress_results.cache_hit_rate:.1%}
""")
    
    if stress_results.error_types:
        print("\nError Distribution:")
        for error_type, count in stress_results.error_types.items():
            print(f"  - {error_type}: {count}")
    
    # Generate final report
    final_report = {
        "test_timestamp": datetime.now().isoformat(),
        "test_results": results,
        "performance_analysis": {
            "cache_effectiveness": {
                "normal_hit_rate": results["normal_load"]["cache_hit_rate"],
                "peak_hit_rate": results["peak_load"]["cache_hit_rate"],
                "stress_hit_rate": results["stress_test"]["cache_hit_rate"],
                "verdict": "EFFECTIVE" if results["normal_load"]["cache_hit_rate"] > 0.5 else "NEEDS IMPROVEMENT"
            },
            "response_times": {
                "normal_p95": results["normal_load"]["p95_response_time_ms"],
                "peak_p95": results["peak_load"]["p95_response_time_ms"],
                "stress_p99": results["stress_test"]["p99_response_time_ms"],
                "degradation_factor": results["stress_test"]["p99_response_time_ms"] / max(1, results["normal_load"]["p95_response_time_ms"])
            },
            "scalability": {
                "normal_throughput": results["normal_load"]["requests_per_second"],
                "peak_throughput": results["peak_load"]["requests_per_second"],
                "stress_throughput": results["stress_test"]["requests_per_second"],
                "scaling_efficiency": results["peak_load"]["requests_per_second"] / max(1, results["normal_load"]["requests_per_second"])
            },
            "reliability": {
                "normal_success_rate": results["normal_load"]["successful_requests"] / max(1, results["normal_load"]["total_requests"]),
                "peak_success_rate": results["peak_load"]["successful_requests"] / max(1, results["peak_load"]["total_requests"]),
                "stress_success_rate": results["stress_test"]["successful_requests"] / max(1, results["stress_test"]["total_requests"]),
                "verdict": "RELIABLE" if results["peak_load"]["successful_requests"] / max(1, results["peak_load"]["total_requests"]) > 0.95 else "NEEDS IMPROVEMENT"
            }
        }
    }
    
    # Save results
    with open("load_test_results.json", "w") as f:
        json.dump(final_report, f, indent=2)
    
    print("\n" + "="*80)
    print("LOAD TEST SUMMARY")
    print("="*80)
    
    analysis = final_report["performance_analysis"]
    
    print(f"""
Cache Performance:
- Normal: {analysis['cache_effectiveness']['normal_hit_rate']:.1%}
- Peak: {analysis['cache_effectiveness']['peak_hit_rate']:.1%}
- Stress: {analysis['cache_effectiveness']['stress_hit_rate']:.1%}
- Verdict: {analysis['cache_effectiveness']['verdict']}

Response Time Degradation:
- Normal P95: {analysis['response_times']['normal_p95']:.2f}ms
- Peak P95: {analysis['response_times']['peak_p95']:.2f}ms
- Stress P99: {analysis['response_times']['stress_p99']:.2f}ms
- Degradation Factor: {analysis['response_times']['degradation_factor']:.2f}x

Scalability:
- Normal: {analysis['scalability']['normal_throughput']:.2f} req/s
- Peak: {analysis['scalability']['peak_throughput']:.2f} req/s
- Stress: {analysis['scalability']['stress_throughput']:.2f} req/s
- Scaling Efficiency: {analysis['scalability']['scaling_efficiency']:.2f}x

Reliability:
- Normal Success: {analysis['reliability']['normal_success_rate']:.1%}
- Peak Success: {analysis['reliability']['peak_success_rate']:.1%}
- Stress Success: {analysis['reliability']['stress_success_rate']:.1%}
- Verdict: {analysis['reliability']['verdict']}
""")
    
    print("Full results saved to: load_test_results.json")
    print("="*80)


if __name__ == "__main__":
    asyncio.run(run_load_tests())