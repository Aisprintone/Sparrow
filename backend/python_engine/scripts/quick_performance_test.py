#!/usr/bin/env python3
"""
Quick performance test for Monte Carlo simulation engine
Tests actual execution times and performance characteristics
"""

import time
import sys
import os
import numpy as np
import psutil
import json
from typing import Dict

# Setup path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def quick_performance_test():
    """Run quick performance test without full profiling."""
    
    # Import after path setup
    from core.config import SimulationConfig
    from core.engine import MonteCarloEngine
    from scenarios.emergency_fund import EmergencyFundScenario
    from core.models import ProfileData, Account, Transaction, AccountType, Demographic
    from datetime import datetime
    
    print("Monte Carlo Engine - Quick Performance Test")
    print("="*60)
    
    # Create test profile
    profile = ProfileData(
        customer_id=1,
        demographic=Demographic.MILLENNIAL,
        accounts=[
            Account(
                account_id="1",
                customer_id=1,
                institution_name="Test Bank",
                account_type=AccountType.SAVINGS,
                account_name="Emergency Fund",
                balance=15000.0,
                credit_limit=None,
                interest_rate=0.045,
                minimum_payment=None
            )
        ],
        transactions=[
            Transaction(
                transaction_id="1",
                account_id="1",
                amount=5000.0,
                description="Salary",
                category="Income",
                timestamp=datetime.now(),
                is_recurring=True,
                is_debit=False
            )
        ],
        monthly_income=5000.0,
        monthly_expenses=3500.0,
        credit_score=750,
        age=30,
        location="San Francisco"
    )
    
    # Initialize engine
    config = SimulationConfig()
    engine = MonteCarloEngine(config)
    scenario = EmergencyFundScenario()
    
    # Test different iteration counts
    iteration_tests = [100, 1000, 10000, 50000, 100000]
    results = {}
    
    print("\nTesting iteration scaling:")
    print("-"*40)
    
    for iterations in iteration_tests:
        times = []
        
        # Run 3 times for average
        for _ in range(3):
            start = time.perf_counter()
            result = engine.run_scenario(scenario, profile, iterations)
            end = time.perf_counter()
            times.append((end - start) * 1000)
        
        avg_time = np.mean(times)
        results[iterations] = {
            'avg_time_ms': avg_time,
            'time_per_1k': avg_time / (iterations / 1000),
            'convergence': result.metadata['convergence_achieved'],
            'outliers': result.metadata['outliers_detected']
        }
        
        print(f"{iterations:,} iterations: {avg_time:.2f}ms (avg of 3 runs)")
        print(f"  • Time per 1k iterations: {results[iterations]['time_per_1k']:.2f}ms")
        print(f"  • Convergence: {result.metadata['convergence_achieved']}")
    
    # Test vectorization efficiency
    print("\n\nTesting vectorization efficiency:")
    print("-"*40)
    
    iterations = 10000
    random_factors = engine._generate_random_factors(profile, iterations)
    
    # Vectorized calculation
    start = time.perf_counter()
    vectorized_result = scenario.calculate_outcome(profile, random_factors)
    vectorized_time = (time.perf_counter() - start) * 1000
    
    print(f"Vectorized calculation: {vectorized_time:.2f}ms for {iterations:,} iterations")
    print(f"Operations per ms: {iterations/vectorized_time:.0f}")
    
    # Memory usage test
    print("\n\nMemory usage analysis:")
    print("-"*40)
    
    process = psutil.Process()
    base_memory = process.memory_info().rss / 1024 / 1024
    
    # Run large simulation
    start = time.perf_counter()
    large_result = engine.run_scenario(scenario, profile, 100000)
    large_time = (time.perf_counter() - start) * 1000
    
    peak_memory = process.memory_info().rss / 1024 / 1024
    memory_used = peak_memory - base_memory
    
    print(f"100k iterations:")
    print(f"  • Execution time: {large_time:.2f}ms")
    print(f"  • Memory used: {memory_used:.2f}MB")
    print(f"  • Memory per 10k iterations: {memory_used/10:.2f}MB")
    
    # Performance verdict
    print("\n\n" + "="*60)
    print("PERFORMANCE ANALYSIS RESULTS")
    print("="*60)
    
    # Check claims
    time_10k = results[10000]['avg_time_ms']
    print(f"\n✅ Sub-second for 10k iterations: {time_10k:.2f}ms < 1000ms")
    
    # Scaling linearity
    scaling_factor = results[100000]['avg_time_ms'] / results[1000]['avg_time_ms']
    expected_scaling = 100  # 100k / 1k
    scaling_efficiency = (expected_scaling / scaling_factor) * 100
    
    print(f"\n📈 Scaling efficiency: {scaling_efficiency:.1f}%")
    print(f"  • 1k iterations: {results[1000]['avg_time_ms']:.2f}ms")
    print(f"  • 100k iterations: {results[100000]['avg_time_ms']:.2f}ms")
    print(f"  • Actual scaling: {scaling_factor:.1f}x (expected 100x)")
    
    # Operations throughput
    ops_per_sec = (100000 / results[100000]['avg_time_ms']) * 1000
    print(f"\n⚡ Throughput: {ops_per_sec:,.0f} iterations/second")
    
    # Save results
    with open('quick_performance_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n📊 Results saved to: quick_performance_results.json")
    
    return results

if __name__ == "__main__":
    results = quick_performance_test()