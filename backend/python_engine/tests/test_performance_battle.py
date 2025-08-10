#!/usr/bin/env python3
"""
PERFORMANCE BATTLE TEST SUITE
==============================
Ruthless performance validation ensuring sub-7 second execution across all scenarios.
No mercy for slow code. Every millisecond counts.
"""

import pytest
import time
import asyncio
import statistics
import json
import numpy as np
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
from typing import Dict, List, Tuple, Any
from datetime import datetime
import sys
import os
import psutil
import tracemalloc

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.config import SimulationConfig
from core.engine import MonteCarloEngine
from core.models import UserProfile
from data.csv_loader import CSVDataLoader

# Import all scenarios
from scenarios.emergency_fund import EmergencyFundScenario
from scenarios.student_loan import StudentLoanScenario
from scenarios.medical_crisis import MedicalCrisisScenario
from scenarios.gig_economy import GigEconomyScenario
from scenarios.market_crash import MarketCrashScenario
from scenarios.home_purchase import HomePurchaseScenario
from scenarios.rent_hike import RentHikeScenario
from scenarios.auto_repair import AutoRepairScenario


class PerformanceMetrics:
    """Track and analyze performance metrics"""
    
    def __init__(self):
        self.execution_times = []
        self.memory_usage = []
        self.cpu_usage = []
        self.scenario_metrics = {}
        
    def record_execution(self, scenario_name: str, execution_time: float, 
                        memory_mb: float, cpu_percent: float):
        """Record a single execution's metrics"""
        self.execution_times.append(execution_time)
        self.memory_usage.append(memory_mb)
        self.cpu_usage.append(cpu_percent)
        
        if scenario_name not in self.scenario_metrics:
            self.scenario_metrics[scenario_name] = {
                'times': [],
                'memory': [],
                'cpu': []
            }
            
        self.scenario_metrics[scenario_name]['times'].append(execution_time)
        self.scenario_metrics[scenario_name]['memory'].append(memory_mb)
        self.scenario_metrics[scenario_name]['cpu'].append(cpu_percent)
        
    def get_statistics(self) -> Dict[str, Any]:
        """Calculate performance statistics"""
        if not self.execution_times:
            return {}
            
        return {
            'execution_time': {
                'min': min(self.execution_times),
                'max': max(self.execution_times),
                'mean': statistics.mean(self.execution_times),
                'median': statistics.median(self.execution_times),
                'stdev': statistics.stdev(self.execution_times) if len(self.execution_times) > 1 else 0,
                'p50': np.percentile(self.execution_times, 50),
                'p95': np.percentile(self.execution_times, 95),
                'p99': np.percentile(self.execution_times, 99)
            },
            'memory_mb': {
                'min': min(self.memory_usage),
                'max': max(self.memory_usage),
                'mean': statistics.mean(self.memory_usage),
                'median': statistics.median(self.memory_usage)
            },
            'cpu_percent': {
                'min': min(self.cpu_usage),
                'max': max(self.cpu_usage),
                'mean': statistics.mean(self.cpu_usage)
            },
            'total_executions': len(self.execution_times),
            'failures': sum(1 for t in self.execution_times if t > 7000)
        }
        
    def get_scenario_report(self, scenario_name: str) -> Dict[str, Any]:
        """Get performance report for specific scenario"""
        if scenario_name not in self.scenario_metrics:
            return {}
            
        metrics = self.scenario_metrics[scenario_name]
        times = metrics['times']
        
        return {
            'scenario': scenario_name,
            'executions': len(times),
            'time_ms': {
                'min': min(times),
                'max': max(times),
                'mean': statistics.mean(times),
                'p50': np.percentile(times, 50),
                'p95': np.percentile(times, 95),
                'p99': np.percentile(times, 99)
            },
            'violations': sum(1 for t in times if t > 7000),
            'pass_rate': sum(1 for t in times if t <= 7000) / len(times) * 100
        }


class PerformanceBenchmark:
    """Performance benchmarking harness"""
    
    def __init__(self):
        self.config = SimulationConfig()
        self.config.RANDOM_SEED = 42
        self.engine = MonteCarloEngine(self.config)
        self.loader = CSVDataLoader()
        self.metrics = PerformanceMetrics()
        self.process = psutil.Process()
        
    def measure_execution(self, scenario, profile, iterations: int) -> Tuple[float, float, float]:
        """Measure single execution performance"""
        # Start memory tracking
        tracemalloc.start()
        initial_memory = self.process.memory_info().rss / 1024 / 1024  # MB
        
        # Measure CPU before
        self.process.cpu_percent()  # Initialize
        
        # Execute scenario
        start_time = time.perf_counter()
        result = self.engine.run_scenario(scenario, profile, iterations=iterations)
        execution_time = (time.perf_counter() - start_time) * 1000  # Convert to ms
        
        # Measure CPU after
        cpu_percent = self.process.cpu_percent()
        
        # Measure memory
        current, peak = tracemalloc.get_traced_memory()
        tracemalloc.stop()
        memory_mb = peak / 1024 / 1024
        
        return execution_time, memory_mb, cpu_percent
        
    def stress_test_scenario(self, scenario, scenario_name: str, 
                           iterations_list: List[int], num_runs: int = 10) -> Dict:
        """Stress test a scenario with various iteration counts"""
        results = {}
        
        for iterations in iterations_list:
            times = []
            
            for run in range(num_runs):
                profile = self.loader.load_profile((run % 3) + 1)
                exec_time, memory, cpu = self.measure_execution(scenario, profile, iterations)
                
                times.append(exec_time)
                self.metrics.record_execution(scenario_name, exec_time, memory, cpu)
                
            results[iterations] = {
                'mean_time': statistics.mean(times),
                'max_time': max(times),
                'min_time': min(times),
                'violations': sum(1 for t in times if t > 7000)
            }
            
        return results


class TestPerformanceRequirements:
    """Test all scenarios meet performance requirements"""
    
    @pytest.fixture
    def benchmark(self):
        return PerformanceBenchmark()
        
    def test_all_scenarios_under_7_seconds(self, benchmark):
        """Test that all scenarios complete under 7 seconds"""
        scenarios = [
            ('emergency_fund', EmergencyFundScenario()),
            ('student_loan', StudentLoanScenario()),
            ('medical_crisis', MedicalCrisisScenario()),
            ('gig_economy', GigEconomyScenario()),
            ('market_crash', MarketCrashScenario()),
            ('home_purchase', HomePurchaseScenario()),
            ('rent_hike', RentHikeScenario()),
            ('auto_repair', AutoRepairScenario())
        ]
        
        violations = []
        
        for name, scenario in scenarios:
            # Test with standard 10,000 iterations
            profile = benchmark.loader.load_profile(1)
            exec_time, memory, cpu = benchmark.measure_execution(scenario, profile, 10000)
            
            if exec_time > 7000:
                violations.append(f"{name}: {exec_time:.0f}ms")
                
            # Record for reporting
            benchmark.metrics.record_execution(name, exec_time, memory, cpu)
            
        assert len(violations) == 0, f"Performance violations: {violations}"
        
    def test_p95_under_5_seconds(self, benchmark):
        """Test that 95th percentile is under 5 seconds"""
        scenarios = [
            ('emergency_fund', EmergencyFundScenario()),
            ('student_loan', StudentLoanScenario())
        ]
        
        for name, scenario in scenarios:
            times = []
            
            # Run 20 times to get percentiles
            for i in range(20):
                profile = benchmark.loader.load_profile((i % 3) + 1)
                exec_time, _, _ = benchmark.measure_execution(scenario, profile, 5000)
                times.append(exec_time)
                
            p95 = np.percentile(times, 95)
            assert p95 < 5000, f"{name} P95 {p95:.0f}ms exceeds 5000ms"
            
    def test_median_under_3_seconds(self, benchmark):
        """Test that median execution is under 3 seconds"""
        scenarios = [
            ('emergency_fund', EmergencyFundScenario()),
            ('medical_crisis', MedicalCrisisScenario())
        ]
        
        for name, scenario in scenarios:
            times = []
            
            # Run 10 times to get median
            for i in range(10):
                profile = benchmark.loader.load_profile((i % 3) + 1)
                exec_time, _, _ = benchmark.measure_execution(scenario, profile, 5000)
                times.append(exec_time)
                
            median = statistics.median(times)
            assert median < 3000, f"{name} median {median:.0f}ms exceeds 3000ms"
            
    def test_scaling_performance(self, benchmark):
        """Test performance scaling with iteration counts"""
        scenario = EmergencyFundScenario()
        profile = benchmark.loader.load_profile(1)
        
        iteration_tests = [
            (100, 100),      # 100 iterations should take < 100ms
            (1000, 500),     # 1000 iterations < 500ms
            (5000, 2000),    # 5000 iterations < 2000ms
            (10000, 4000),   # 10000 iterations < 4000ms
            (50000, 20000)   # 50000 iterations < 20000ms
        ]
        
        for iterations, max_time in iteration_tests:
            exec_time, _, _ = benchmark.measure_execution(scenario, profile, iterations)
            assert exec_time < max_time, f"{iterations} iterations took {exec_time:.0f}ms (max: {max_time}ms)"
            
    def test_memory_efficiency(self, benchmark):
        """Test memory usage stays within bounds"""
        scenarios = [
            ('emergency_fund', EmergencyFundScenario()),
            ('market_crash', MarketCrashScenario())
        ]
        
        max_memory_mb = 500  # 500MB max per scenario
        
        for name, scenario in scenarios:
            profile = benchmark.loader.load_profile(1)
            _, memory, _ = benchmark.measure_execution(scenario, profile, 50000)
            
            assert memory < max_memory_mb, f"{name} used {memory:.0f}MB (max: {max_memory_mb}MB)"


class TestConcurrentPerformance:
    """Test performance under concurrent load"""
    
    @pytest.fixture
    def benchmark(self):
        return PerformanceBenchmark()
        
    def test_concurrent_scenario_execution(self, benchmark):
        """Test multiple scenarios running concurrently"""
        scenarios = [
            EmergencyFundScenario(),
            StudentLoanScenario(),
            MedicalCrisisScenario(),
            GigEconomyScenario()
        ]
        
        def run_scenario(scenario_index):
            scenario = scenarios[scenario_index % len(scenarios)]
            profile = benchmark.loader.load_profile((scenario_index % 3) + 1)
            
            start = time.perf_counter()
            result = benchmark.engine.run_scenario(scenario, profile, iterations=5000)
            return (time.perf_counter() - start) * 1000
            
        # Run 20 concurrent simulations
        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = [executor.submit(run_scenario, i) for i in range(20)]
            times = [f.result() for f in futures]
            
        # Even under load, no execution should exceed 10 seconds
        max_time = max(times)
        assert max_time < 10000, f"Max concurrent execution {max_time:.0f}ms exceeds 10000ms"
        
        # Average should still be reasonable
        avg_time = statistics.mean(times)
        assert avg_time < 5000, f"Average concurrent execution {avg_time:.0f}ms exceeds 5000ms"
        
    def test_parallel_profile_processing(self, benchmark):
        """Test parallel processing of multiple profiles"""
        scenario = EmergencyFundScenario()
        
        def process_profile(profile_id):
            profile = benchmark.loader.load_profile(profile_id)
            start = time.perf_counter()
            result = benchmark.engine.run_scenario(scenario, profile, iterations=5000)
            return (time.perf_counter() - start) * 1000
            
        # Process all profiles in parallel
        with ThreadPoolExecutor(max_workers=3) as executor:
            futures = [executor.submit(process_profile, i) for i in [1, 2, 3]]
            times = [f.result() for f in futures]
            
        # All should complete quickly
        for profile_time in times:
            assert profile_time < 3000, f"Profile processing took {profile_time:.0f}ms"


class TestPerformanceOptimizations:
    """Test that performance optimizations are working"""
    
    @pytest.fixture
    def benchmark(self):
        return PerformanceBenchmark()
        
    def test_convergence_early_termination(self, benchmark):
        """Test that convergence triggers early termination"""
        scenario = EmergencyFundScenario()
        profile = benchmark.loader.load_profile(1)
        
        # With high iterations, should converge and terminate early
        start = time.perf_counter()
        result = benchmark.engine.run_scenario(scenario, profile, iterations=100000)
        exec_time = (time.perf_counter() - start) * 1000
        
        # Should terminate much faster than linear scaling would suggest
        # 100k iterations would take ~40 seconds without optimization
        assert exec_time < 10000, f"Failed to optimize via convergence: {exec_time:.0f}ms"
        assert result.metadata.get('convergence_achieved', False), "Convergence not achieved"
        
    def test_numpy_vectorization(self, benchmark):
        """Test that numpy vectorization is being used"""
        scenario = StudentLoanScenario()
        profile = benchmark.loader.load_profile(1)
        profile.student_loan_balance = 50000  # Ensure loans exist
        
        # Vectorized operations should handle large iterations efficiently
        iterations = [1000, 10000, 50000]
        times = []
        
        for iter_count in iterations:
            start = time.perf_counter()
            result = benchmark.engine.run_scenario(scenario, profile, iterations=iter_count)
            times.append((time.perf_counter() - start) * 1000)
            
        # Check that scaling is sub-linear (vectorization benefit)
        scaling_factor = times[2] / times[0]  # 50k vs 1k
        expected_linear_scaling = 50  # 50x more iterations
        
        assert scaling_factor < expected_linear_scaling * 0.5, f"Poor vectorization: {scaling_factor:.1f}x for 50x iterations"
        
    def test_caching_benefits(self, benchmark):
        """Test that caching improves repeated executions"""
        scenario = EmergencyFundScenario()
        profile = benchmark.loader.load_profile(1)
        
        # First run (cold cache)
        start = time.perf_counter()
        result1 = benchmark.engine.run_scenario(scenario, profile, iterations=5000)
        cold_time = (time.perf_counter() - start) * 1000
        
        # Second run (warm cache)
        start = time.perf_counter()
        result2 = benchmark.engine.run_scenario(scenario, profile, iterations=5000)
        warm_time = (time.perf_counter() - start) * 1000
        
        # Warm should be at least 10% faster (conservative estimate)
        improvement = (cold_time - warm_time) / cold_time
        assert improvement > 0.1 or warm_time < 1000, f"No caching benefit: cold={cold_time:.0f}ms, warm={warm_time:.0f}ms"


class TestStressConditions:
    """Test performance under stress conditions"""
    
    @pytest.fixture
    def benchmark(self):
        return PerformanceBenchmark()
        
    def test_extreme_iteration_counts(self, benchmark):
        """Test with extreme iteration counts"""
        scenario = EmergencyFundScenario()
        profile = benchmark.loader.load_profile(1)
        
        # Test very high iterations
        exec_time, memory, _ = benchmark.measure_execution(scenario, profile, 100000)
        
        # Should still complete in reasonable time
        assert exec_time < 30000, f"100k iterations took {exec_time:.0f}ms"
        
        # Memory should not explode
        assert memory < 1000, f"Memory usage {memory:.0f}MB exceeds 1GB"
        
    def test_complex_profile_data(self, benchmark):
        """Test with complex profile data"""
        scenario = MarketCrashScenario()
        
        # Create complex profile with all fields populated
        profile = UserProfile(
            profile_id=999,
            demographic="Millennial",
            monthly_income=8500,
            monthly_expenses=6200,
            emergency_fund_balance=25000,
            student_loan_balance=45000,
            credit_card_balance=8500,
            retirement_balance=125000,
            investment_balance=75000,
            real_estate_value=450000,
            mortgage_balance=325000,
            other_debt=15000,
            insurance_coverage=500000,
            credit_score=760,
            spending_categories={
                'housing': 2500,
                'food': 800,
                'transportation': 600,
                'utilities': 200,
                'insurance': 400,
                'healthcare': 300,
                'personal': 500,
                'entertainment': 400,
                'other': 500
            },
            financial_goals=[
                'retirement',
                'home_purchase',
                'debt_payoff',
                'emergency_fund',
                'investment_growth'
            ],
            updated_at=datetime.now()
        )
        
        exec_time, _, _ = benchmark.measure_execution(scenario, profile, 10000)
        assert exec_time < 7000, f"Complex profile took {exec_time:.0f}ms"
        
    def test_rapid_succession_calls(self, benchmark):
        """Test rapid succession of API calls"""
        scenario = EmergencyFundScenario()
        profile = benchmark.loader.load_profile(1)
        
        times = []
        
        # Simulate rapid API calls
        for _ in range(50):
            start = time.perf_counter()
            result = benchmark.engine.run_scenario(scenario, profile, iterations=1000)
            times.append((time.perf_counter() - start) * 1000)
            
        # No degradation over time
        first_10_avg = statistics.mean(times[:10])
        last_10_avg = statistics.mean(times[-10:])
        
        degradation = (last_10_avg - first_10_avg) / first_10_avg
        assert degradation < 0.2, f"Performance degraded by {degradation:.1%}"


class TestPerformanceReport:
    """Generate comprehensive performance report"""
    
    def test_generate_performance_report(self):
        """Generate and save performance battle report"""
        benchmark = PerformanceBenchmark()
        
        # Test all scenarios
        scenarios = [
            ('emergency_fund', EmergencyFundScenario()),
            ('student_loan', StudentLoanScenario()),
            ('medical_crisis', MedicalCrisisScenario()),
            ('gig_economy', GigEconomyScenario()),
            ('market_crash', MarketCrashScenario()),
            ('home_purchase', HomePurchaseScenario()),
            ('rent_hike', RentHikeScenario()),
            ('auto_repair', AutoRepairScenario())
        ]
        
        # Run comprehensive tests
        for name, scenario in scenarios:
            # Test different iteration counts
            results = benchmark.stress_test_scenario(
                scenario, name,
                iterations_list=[1000, 5000, 10000, 25000],
                num_runs=5
            )
            
        # Generate report
        stats = benchmark.metrics.get_statistics()
        
        report = {
            'timestamp': datetime.now().isoformat(),
            'test_suite': 'PERFORMANCE_BATTLE_v1.0',
            'overall_statistics': stats,
            'scenario_reports': {},
            'performance_targets': {
                'max_execution_ms': 7000,
                'p95_target_ms': 5000,
                'p50_target_ms': 3000
            },
            'compliance': {
                'all_under_7s': stats.get('failures', 0) == 0 if stats else False,
                'p95_under_5s': stats.get('execution_time', {}).get('p95', 0) < 5000 if stats else False,
                'p50_under_3s': stats.get('execution_time', {}).get('p50', 0) < 3000 if stats else False
            }
        }
        
        # Add individual scenario reports
        for name, _ in scenarios:
            scenario_report = benchmark.metrics.get_scenario_report(name)
            if scenario_report:
                report['scenario_reports'][name] = scenario_report
                
        # Calculate summary
        if report['scenario_reports']:
            worst_p95 = max(s['time_ms']['p95'] for s in report['scenario_reports'].values())
            best_p95 = min(s['time_ms']['p95'] for s in report['scenario_reports'].values())
            avg_pass_rate = statistics.mean(s['pass_rate'] for s in report['scenario_reports'].values())
            
            report['summary'] = {
                'worst_p95_ms': worst_p95,
                'best_p95_ms': best_p95,
                'average_pass_rate': avg_pass_rate,
                'recommendation': 'PRODUCTION READY' if avg_pass_rate > 99 else 'NEEDS OPTIMIZATION'
            }
        
        # Save report
        report_path = '/tmp/performance_battle_report.json'
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2, default=str)
            
        print("\n" + "="*60)
        print("PERFORMANCE BATTLE REPORT")
        print("="*60)
        
        if stats:
            print(f"Total Executions: {stats.get('total_executions', 0)}")
            print(f"Failures (>7s): {stats.get('failures', 0)}")
            
            exec_stats = stats.get('execution_time', {})
            if exec_stats:
                print(f"\nExecution Times (ms):")
                print(f"  P50: {exec_stats.get('p50', 0):.0f}")
                print(f"  P95: {exec_stats.get('p95', 0):.0f}")
                print(f"  P99: {exec_stats.get('p99', 0):.0f}")
                print(f"  Max: {exec_stats.get('max', 0):.0f}")
        
        print(f"\nCompliance:")
        for key, value in report.get('compliance', {}).items():
            status = "✅ PASS" if value else "❌ FAIL"
            print(f"  {key}: {status}")
            
        if 'summary' in report:
            print(f"\nRecommendation: {report['summary']['recommendation']}")
            
        print(f"\nReport saved to: {report_path}")
        print("="*60 + "\n")
        
        # Assert production readiness
        assert report.get('compliance', {}).get('all_under_7s', False), "Not all scenarios meet 7s requirement"


if __name__ == "__main__":
    # Run performance battle tests
    pytest.main([__file__, '-v', '--tb=short', '-s'])