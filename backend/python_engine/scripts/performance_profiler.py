#!/usr/bin/env python3
"""
Performance Profiler for Monte Carlo Simulation Engine
Conducts comprehensive performance analysis and benchmarking
"""

import time
import psutil
import tracemalloc
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Any
import concurrent.futures
import cProfile
import pstats
import io
from contextlib import contextmanager
import json
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.config import SimulationConfig
from core.engine import MonteCarloEngine, NumpyRandomGenerator
from core.models import ProfileData
from data.csv_loader import CSVDataLoader
from scenarios.emergency_fund import EmergencyFundScenario
from scenarios.student_loan import StudentLoanPayoffScenario


class PerformanceProfiler:
    """Comprehensive performance profiling for Monte Carlo simulations."""
    
    def __init__(self):
        self.config = SimulationConfig()
        self.engine = MonteCarloEngine(self.config)
        self.data_loader = CSVDataLoader()
        self.results = {}
        
    @contextmanager
    def measure_performance(self, name: str):
        """Context manager to measure execution time and memory."""
        # Start measurements
        process = psutil.Process()
        start_memory = process.memory_info().rss / 1024 / 1024  # MB
        tracemalloc.start()
        start_time = time.perf_counter()
        
        yield
        
        # End measurements
        end_time = time.perf_counter()
        current, peak = tracemalloc.get_traced_memory()
        tracemalloc.stop()
        end_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        # Store results
        self.results[name] = {
            'execution_time_ms': (end_time - start_time) * 1000,
            'memory_used_mb': peak / 1024 / 1024,
            'memory_delta_mb': end_memory - start_memory,
            'cpu_percent': process.cpu_percent()
        }
    
    def profile_single_simulation(self, profile_id: int, scenario_name: str, iterations: int) -> Dict:
        """Profile a single simulation run."""
        profile = self.data_loader.load_profile(profile_id)
        
        if scenario_name == "emergency_fund":
            scenario = EmergencyFundScenario()
        else:
            scenario = StudentLoanPayoffScenario()
        
        with self.measure_performance(f"{scenario_name}_{iterations}"):
            result = self.engine.run_scenario(scenario, profile, iterations)
        
        return {
            **self.results[f"{scenario_name}_{iterations}"],
            'processing_time_reported': result.processing_time_ms,
            'convergence': result.metadata['convergence_achieved'],
            'outliers': result.metadata['outliers_detected']
        }
    
    def benchmark_iteration_scaling(self) -> pd.DataFrame:
        """Benchmark performance across different iteration counts."""
        iteration_counts = [100, 500, 1000, 5000, 10000, 50000, 100000]
        profiles = [1, 2, 3]
        
        results = []
        for iterations in iteration_counts:
            for profile_id in profiles:
                print(f"Testing {iterations} iterations with profile {profile_id}...")
                
                # Test emergency fund scenario
                perf = self.profile_single_simulation(profile_id, "emergency_fund", iterations)
                results.append({
                    'iterations': iterations,
                    'profile_id': profile_id,
                    'scenario': 'emergency_fund',
                    **perf
                })
                
                # Test student loan scenario  
                perf = self.profile_single_simulation(profile_id, "student_loan", iterations)
                results.append({
                    'iterations': iterations,
                    'profile_id': profile_id,
                    'scenario': 'student_loan',
                    **perf
                })
        
        return pd.DataFrame(results)
    
    def test_concurrent_simulations(self, num_concurrent: int = 10) -> Dict:
        """Test performance under concurrent load."""
        print(f"\nTesting {num_concurrent} concurrent simulations...")
        
        def run_simulation(sim_id: int):
            profile_id = (sim_id % 3) + 1
            profile = self.data_loader.load_profile(profile_id)
            scenario = EmergencyFundScenario()
            
            start = time.perf_counter()
            result = self.engine.run_scenario(scenario, profile, 10000)
            end = time.perf_counter()
            
            return {
                'sim_id': sim_id,
                'execution_time_ms': (end - start) * 1000,
                'success': True
            }
        
        # Run concurrent simulations
        start_time = time.perf_counter()
        with concurrent.futures.ThreadPoolExecutor(max_workers=num_concurrent) as executor:
            futures = [executor.submit(run_simulation, i) for i in range(num_concurrent)]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]
        total_time = (time.perf_counter() - start_time) * 1000
        
        # Calculate statistics
        exec_times = [r['execution_time_ms'] for r in results]
        
        return {
            'total_simulations': num_concurrent,
            'total_time_ms': total_time,
            'avg_time_per_sim_ms': np.mean(exec_times),
            'median_time_ms': np.median(exec_times),
            'p95_time_ms': np.percentile(exec_times, 95),
            'p99_time_ms': np.percentile(exec_times, 99),
            'throughput_per_second': (num_concurrent / total_time) * 1000
        }
    
    def profile_vectorization_efficiency(self) -> Dict:
        """Compare vectorized vs loop-based implementations."""
        profile = self.data_loader.load_profile(1)
        iterations = 10000
        
        # Generate random factors once
        random_factors = self.engine._generate_random_factors(profile, iterations)
        
        # Test vectorized implementation (current)
        scenario = EmergencyFundScenario()
        start = time.perf_counter()
        vectorized_result = scenario.calculate_outcome(profile, random_factors)
        vectorized_time = (time.perf_counter() - start) * 1000
        
        # Simulate loop-based implementation
        start = time.perf_counter()
        loop_results = []
        for i in range(iterations):
            # Extract single iteration factors
            single_factors = {
                key: np.array([values[i]]) for key, values in random_factors.items()
            }
            single_result = scenario.calculate_outcome(profile, single_factors)
            loop_results.append(single_result[0])
        loop_time = (time.perf_counter() - start) * 1000
        
        return {
            'vectorized_time_ms': vectorized_time,
            'loop_time_ms': loop_time,
            'speedup_factor': loop_time / vectorized_time,
            'iterations': iterations
        }
    
    def analyze_memory_usage(self) -> Dict:
        """Analyze memory consumption patterns."""
        tracemalloc.start()
        
        # Load all profiles
        profiles = [self.data_loader.load_profile(i) for i in [1, 2, 3]]
        snapshot1 = tracemalloc.take_snapshot()
        
        # Run simulations
        results = []
        for profile in profiles:
            scenario = EmergencyFundScenario()
            result = self.engine.run_scenario(scenario, profile, 10000)
            results.append(result)
        
        snapshot2 = tracemalloc.take_snapshot()
        
        # Analyze top memory consumers
        top_stats = snapshot2.compare_to(snapshot1, 'lineno')
        
        memory_analysis = {
            'total_memory_mb': snapshot2.traceback.total_size / 1024 / 1024,
            'top_consumers': []
        }
        
        for stat in top_stats[:10]:
            memory_analysis['top_consumers'].append({
                'file': stat.traceback.format()[0] if stat.traceback else 'unknown',
                'size_mb': stat.size_diff / 1024 / 1024,
                'count': stat.count_diff
            })
        
        tracemalloc.stop()
        return memory_analysis
    
    def profile_random_generation(self) -> Dict:
        """Profile random number generation performance."""
        sizes = [1000, 10000, 100000, 1000000]
        results = {}
        
        for size in sizes:
            generator = NumpyRandomGenerator(seed=42)
            
            # Test different distributions
            start = time.perf_counter()
            generator.normal(0, 1, size)
            normal_time = (time.perf_counter() - start) * 1000
            
            start = time.perf_counter()
            generator.uniform(0, 1, size)
            uniform_time = (time.perf_counter() - start) * 1000
            
            start = time.perf_counter()
            generator.exponential(1, size)
            exp_time = (time.perf_counter() - start) * 1000
            
            results[f'size_{size}'] = {
                'normal_ms': normal_time,
                'uniform_ms': uniform_time,
                'exponential_ms': exp_time,
                'numbers_per_ms': size / normal_time
            }
        
        return results
    
    def profile_statistical_calculations(self) -> Dict:
        """Profile statistical calculation performance."""
        data_sizes = [1000, 10000, 100000]
        results = {}
        
        for size in data_sizes:
            data = np.random.normal(0, 1, size)
            
            # Percentile calculations
            start = time.perf_counter()
            np.percentile(data, [10, 25, 50, 75, 90])
            percentile_time = (time.perf_counter() - start) * 1000
            
            # Mean and std
            start = time.perf_counter()
            np.mean(data)
            np.std(data)
            stats_time = (time.perf_counter() - start) * 1000
            
            # Convergence check (split and compare)
            start = time.perf_counter()
            mid = len(data) // 2
            first_half_mean = np.mean(data[:mid])
            second_half_mean = np.mean(data[mid:])
            convergence_time = (time.perf_counter() - start) * 1000
            
            results[f'size_{size}'] = {
                'percentile_ms': percentile_time,
                'basic_stats_ms': stats_time,
                'convergence_check_ms': convergence_time,
                'total_ms': percentile_time + stats_time + convergence_time
            }
        
        return results
    
    def run_comprehensive_profiling(self) -> Dict:
        """Run all profiling tests and generate comprehensive report."""
        print("Starting comprehensive performance profiling...")
        
        report = {
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
            'system_info': {
                'cpu_count': psutil.cpu_count(),
                'cpu_freq': psutil.cpu_freq().current if psutil.cpu_freq() else 'N/A',
                'memory_total_gb': psutil.virtual_memory().total / 1024 / 1024 / 1024,
                'python_version': sys.version
            }
        }
        
        # 1. Iteration scaling benchmark
        print("\n1. Testing iteration scaling...")
        scaling_df = self.benchmark_iteration_scaling()
        report['iteration_scaling'] = scaling_df.to_dict('records')
        
        # 2. Concurrent simulations
        print("\n2. Testing concurrent simulations...")
        report['concurrent_5'] = self.test_concurrent_simulations(5)
        report['concurrent_10'] = self.test_concurrent_simulations(10)
        report['concurrent_20'] = self.test_concurrent_simulations(20)
        
        # 3. Vectorization efficiency
        print("\n3. Testing vectorization efficiency...")
        report['vectorization'] = self.profile_vectorization_efficiency()
        
        # 4. Memory usage analysis
        print("\n4. Analyzing memory usage...")
        report['memory_analysis'] = self.analyze_memory_usage()
        
        # 5. Random generation profiling
        print("\n5. Profiling random number generation...")
        report['random_generation'] = self.profile_random_generation()
        
        # 6. Statistical calculations
        print("\n6. Profiling statistical calculations...")
        report['statistical_calculations'] = self.profile_statistical_calculations()
        
        # Calculate key metrics
        report['key_metrics'] = self._calculate_key_metrics(report)
        
        return report
    
    def _calculate_key_metrics(self, report: Dict) -> Dict:
        """Calculate key performance metrics from report data."""
        scaling_data = pd.DataFrame(report['iteration_scaling'])
        
        # Average time for 10k iterations
        time_10k = scaling_data[scaling_data['iterations'] == 10000]['execution_time_ms'].mean()
        
        # Scaling factor (time increase per 10x iterations)
        time_1k = scaling_data[scaling_data['iterations'] == 1000]['execution_time_ms'].mean()
        time_100k = scaling_data[scaling_data['iterations'] == 100000]['execution_time_ms'].mean()
        scaling_factor = time_100k / time_1k
        
        return {
            'avg_time_10k_iterations_ms': time_10k,
            'sub_second_10k': time_10k < 1000,
            'scaling_factor_1k_to_100k': scaling_factor,
            'linear_scaling': scaling_factor < 110,  # Within 10% of linear
            'vectorization_speedup': report['vectorization']['speedup_factor'],
            'concurrent_throughput_per_sec': report['concurrent_10']['throughput_per_second'],
            'p99_latency_ms': report['concurrent_10']['p99_time_ms']
        }
    
    def generate_performance_report(self):
        """Generate and save comprehensive performance report."""
        report = self.run_comprehensive_profiling()
        
        # Save JSON report
        with open('performance_report.json', 'w') as f:
            json.dump(report, f, indent=2, default=str)
        
        # Print summary
        print("\n" + "="*60)
        print("PERFORMANCE ANALYSIS SUMMARY")
        print("="*60)
        
        metrics = report['key_metrics']
        print(f"\n📊 Key Performance Metrics:")
        print(f"  • 10k iterations avg time: {metrics['avg_time_10k_iterations_ms']:.2f}ms")
        print(f"  • Sub-second for 10k: {'✅ YES' if metrics['sub_second_10k'] else '❌ NO'}")
        print(f"  • Vectorization speedup: {metrics['vectorization_speedup']:.1f}x")
        print(f"  • Concurrent throughput: {metrics['concurrent_throughput_per_sec']:.1f} sims/sec")
        print(f"  • P99 latency: {metrics['p99_latency_ms']:.2f}ms")
        print(f"  • Linear scaling: {'✅ YES' if metrics['linear_scaling'] else '❌ NO'}")
        
        # Scaling analysis
        scaling_df = pd.DataFrame(report['iteration_scaling'])
        print(f"\n📈 Scaling Analysis (Emergency Fund):")
        for iterations in [1000, 10000, 100000]:
            avg_time = scaling_df[
                (scaling_df['iterations'] == iterations) & 
                (scaling_df['scenario'] == 'emergency_fund')
            ]['execution_time_ms'].mean()
            print(f"  • {iterations:,} iterations: {avg_time:.2f}ms")
        
        # Concurrent performance
        print(f"\n🔄 Concurrent Performance:")
        for n in [5, 10, 20]:
            data = report[f'concurrent_{n}']
            print(f"  • {n} concurrent: {data['avg_time_per_sim_ms']:.2f}ms avg, "
                  f"{data['p99_time_ms']:.2f}ms p99")
        
        # Memory usage
        print(f"\n💾 Memory Usage:")
        print(f"  • Total traced: {report['memory_analysis']['total_memory_mb']:.2f}MB")
        
        print(f"\n✅ Full report saved to: performance_report.json")
        
        return report


def run_detailed_cprofile():
    """Run detailed cProfile analysis."""
    profiler = cProfile.Profile()
    
    # Setup
    config = SimulationConfig()
    engine = MonteCarloEngine(config)
    loader = CSVDataLoader()
    profile = loader.load_profile(1)
    scenario = EmergencyFundScenario()
    
    # Profile the core simulation
    profiler.enable()
    for _ in range(10):
        engine.run_scenario(scenario, profile, 10000)
    profiler.disable()
    
    # Generate stats
    s = io.StringIO()
    ps = pstats.Stats(profiler, stream=s).sort_stats('cumulative')
    ps.print_stats(30)
    
    print("\n" + "="*60)
    print("DETAILED CPROFILER OUTPUT")
    print("="*60)
    print(s.getvalue())


if __name__ == "__main__":
    print("Monte Carlo Simulation Engine - Performance Analysis")
    print("="*60)
    
    # Run comprehensive profiling
    profiler = PerformanceProfiler()
    report = profiler.generate_performance_report()
    
    # Run detailed cProfile
    print("\n")
    run_detailed_cprofile()
    
    # Final verdict
    print("\n" + "="*60)
    print("PERFORMANCE VERDICT")
    print("="*60)
    
    metrics = report['key_metrics']
    
    if metrics['sub_second_10k'] and metrics['vectorization_speedup'] > 10:
        print("✅ PERFORMANCE CLAIMS VERIFIED")
        print(f"  • Sub-second response for 10k iterations: CONFIRMED")
        print(f"  • Vectorization provides {metrics['vectorization_speedup']:.1f}x speedup")
    else:
        print("⚠️ PERFORMANCE BELOW CLAIMS")
        print(f"  • 10k iterations take {metrics['avg_time_10k_iterations_ms']:.2f}ms")
    
    print("\n📊 Production Readiness:")
    if metrics['p99_latency_ms'] < 100:
        print(f"  ✅ P99 latency under 100ms: {metrics['p99_latency_ms']:.2f}ms")
    else:
        print(f"  ⚠️ P99 latency exceeds target: {metrics['p99_latency_ms']:.2f}ms")
    
    if metrics['concurrent_throughput_per_sec'] > 50:
        print(f"  ✅ Can handle {metrics['concurrent_throughput_per_sec']:.0f} requests/sec")
    else:
        print(f"  ⚠️ Limited throughput: {metrics['concurrent_throughput_per_sec']:.0f} requests/sec")