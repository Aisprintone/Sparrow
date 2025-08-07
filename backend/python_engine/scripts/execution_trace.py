#!/usr/bin/env python3
"""
Execution Mechanics Trace - Deep dive into how the Monte Carlo engine actually runs
"""

import sys
import os
import time
import json
import numpy as np

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from python_engine.core.config import SimulationConfig
from python_engine.core.engine import MonteCarloEngine
from python_engine.data.csv_loader import CSVDataLoader
from python_engine.scenarios.emergency_fund import EmergencyFundScenario


def trace_execution_flow():
    """Trace the complete execution flow from request to response."""
    
    print("=" * 80)
    print("MONTE CARLO SIMULATION ENGINE - EXECUTION MECHANICS ANALYSIS")
    print("=" * 80)
    
    # PHASE 1: INITIALIZATION
    print("\n[PHASE 1] INITIALIZATION")
    print("-" * 40)
    
    print("1.1 Creating SimulationConfig...")
    config = SimulationConfig()
    config.RANDOM_SEED = 42  # For reproducibility
    print(f"    - Default iterations: {config.DEFAULT_ITERATIONS}")
    print(f"    - Random seed: {config.RANDOM_SEED}")
    print(f"    - Market return mean: {config.MARKET_RETURN_MEAN}")
    print(f"    - Market return std: {config.MARKET_RETURN_STD}")
    
    print("\n1.2 Initializing MonteCarloEngine...")
    engine = MonteCarloEngine(config)
    print(f"    - Engine initialized with NumpyRandomGenerator")
    print(f"    - Random seed propagated: {config.RANDOM_SEED}")
    
    print("\n1.3 Setting up CSVDataLoader...")
    loader = CSVDataLoader()
    print(f"    - Data directory: {loader.data_dir}")
    print(f"    - Required files validated: customer.csv, account.csv, transaction.csv")
    
    print("\n1.4 Creating EmergencyFundScenario...")
    scenario = EmergencyFundScenario()
    required_fields = scenario.get_required_data_fields()
    print(f"    - Required fields: {required_fields}")
    
    # PHASE 2: DATA LOADING
    print("\n[PHASE 2] DATA LOADING & TRANSFORMATION")
    print("-" * 40)
    
    print("2.1 Loading customer profile (ID=1)...")
    load_start = time.time()
    profile = loader.load_profile(1)
    load_time = (time.time() - load_start) * 1000
    
    print(f"    - Load time: {load_time:.2f}ms")
    print(f"    - Customer ID: {profile.customer_id}")
    print(f"    - Demographic: {profile.demographic}")
    print(f"    - Age: {profile.age}")
    print(f"    - Location: {profile.location}")
    
    print("\n2.2 Financial data computed from CSVs:")
    print(f"    - Accounts loaded: {len(profile.accounts)}")
    print(f"    - Transactions loaded: {len(profile.transactions)}")
    print(f"    - Net worth: ${profile.net_worth:,.2f}")
    print(f"    - Monthly income: ${profile.monthly_income:,.2f}")
    print(f"    - Monthly expenses: ${profile.monthly_expenses:,.2f}")
    print(f"    - Emergency fund: ${profile.emergency_fund_balance:,.2f}")
    print(f"    - Student loans: ${profile.student_loan_balance:,.2f}")
    print(f"    - Debt-to-income ratio: {profile.debt_to_income_ratio:.2%}")
    
    # PHASE 3: RANDOM FACTOR GENERATION
    print("\n[PHASE 3] RANDOM FACTOR GENERATION (VECTORIZED)")
    print("-" * 40)
    
    iterations = 1000  # Use 1000 for detailed analysis
    print(f"3.1 Generating random factors for {iterations} iterations...")
    
    gen_start = time.time()
    random_factors = engine._generate_random_factors(profile, iterations)
    gen_time = (time.time() - gen_start) * 1000
    
    print(f"    - Generation time: {gen_time:.2f}ms")
    print(f"    - Time per iteration: {gen_time/iterations:.4f}ms")
    
    print("\n3.2 Random factor arrays generated (all shape={})".format(iterations))
    for key, values in random_factors.items():
        print(f"    - {key:25s}: mean={np.mean(values):8.4f}, std={np.std(values):8.4f}")
    
    # Show memory footprint
    total_memory = sum(arr.nbytes for arr in random_factors.values())
    print(f"\n3.3 Memory footprint of random factors: {total_memory/1024:.2f} KB")
    
    # PHASE 4: SCENARIO CALCULATION
    print("\n[PHASE 4] SCENARIO CALCULATION (VECTORIZED NUMPY)")
    print("-" * 40)
    
    print("4.1 Running emergency fund runway calculation...")
    calc_start = time.time()
    outcomes = scenario.calculate_outcome(profile, random_factors)
    calc_time = (time.time() - calc_start) * 1000
    
    print(f"    - Calculation time: {calc_time:.2f}ms")
    print(f"    - Time per iteration: {calc_time/iterations:.4f}ms")
    
    print("\n4.2 Numpy operations performed:")
    print("    - Market returns applied (30% equity exposure)")
    print("    - Inflation adjustments calculated")
    print("    - Emergency expense shocks generated (15% probability)")
    print("    - Expense multipliers applied")
    print("    - Runway months computed (vectorized division)")
    
    print("\n4.3 Outcome statistics:")
    print(f"    - Shape: {outcomes.shape}")
    print(f"    - Mean: {np.mean(outcomes):.2f} months")
    print(f"    - Median: {np.median(outcomes):.2f} months")
    print(f"    - Std Dev: {np.std(outcomes):.2f} months")
    print(f"    - Min: {np.min(outcomes):.2f} months")
    print(f"    - Max: {np.max(outcomes):.2f} months")
    
    # PHASE 5: STATISTICAL ANALYSIS
    print("\n[PHASE 5] STATISTICAL ANALYSIS")
    print("-" * 40)
    
    print("5.1 Computing percentiles...")
    percentiles = np.percentile(outcomes, [10, 25, 50, 75, 90])
    print(f"    - 10th percentile: {percentiles[0]:.2f} months")
    print(f"    - 25th percentile: {percentiles[1]:.2f} months")
    print(f"    - 50th percentile: {percentiles[2]:.2f} months")
    print(f"    - 75th percentile: {percentiles[3]:.2f} months")
    print(f"    - 90th percentile: {percentiles[4]:.2f} months")
    
    print("\n5.2 Success probability calculation...")
    success_criteria = scenario.get_success_criteria()
    success_array = success_criteria(outcomes)
    probability_success = np.mean(success_array)
    print(f"    - Success criteria: runway >= 3 months")
    print(f"    - Successful iterations: {np.sum(success_array)}/{iterations}")
    print(f"    - Probability of success: {probability_success:.2%}")
    
    print("\n5.3 Convergence check...")
    mid = len(outcomes) // 2
    first_half_mean = np.mean(outcomes[:mid])
    second_half_mean = np.mean(outcomes[mid:])
    relative_diff = abs(first_half_mean - second_half_mean) / max(abs(first_half_mean), 1e-10)
    converged = relative_diff < 0.01
    print(f"    - First half mean: {first_half_mean:.2f}")
    print(f"    - Second half mean: {second_half_mean:.2f}")
    print(f"    - Relative difference: {relative_diff:.4%}")
    print(f"    - Convergence achieved: {converged}")
    
    # PHASE 6: FULL SIMULATION RUN
    print("\n[PHASE 6] COMPLETE SIMULATION RUN (10,000 iterations)")
    print("-" * 40)
    
    print("6.1 Running full Monte Carlo simulation...")
    full_start = time.time()
    result = engine.run_scenario(scenario, profile, iterations=10000)
    full_time = (time.time() - full_start) * 1000
    
    print(f"    - Total execution time: {full_time:.2f}ms")
    print(f"    - Processing time (internal): {result.processing_time_ms:.2f}ms")
    print(f"    - Overhead: {full_time - result.processing_time_ms:.2f}ms")
    
    print("\n6.2 Final results:")
    frontend_format = result.to_frontend_format()
    print(f"    - Scenario: {frontend_format['scenario']}")
    print(f"    - Median outcome: {frontend_format['results']['percentiles']['p50']:.2f}")
    print(f"    - Mean outcome: {frontend_format['results']['statistics']['mean']:.2f}")
    print(f"    - Success probability: {frontend_format['results']['probability_success']:.2%}")
    
    # PHASE 7: CONCURRENCY ANALYSIS
    print("\n[PHASE 7] CONCURRENCY & DEPLOYMENT ANALYSIS")
    print("-" * 40)
    
    print("7.1 Process model:")
    print("    - FastAPI server (uvicorn) with async handlers")
    print("    - Single Python process with multiple workers possible")
    print("    - No process spawning per request (persistent server)")
    print("    - HTTP communication between Next.js and Python")
    
    print("\n7.2 Concurrency capabilities:")
    print("    - Multiple simulations CAN run simultaneously")
    print("    - Each request is handled in separate async context")
    print("    - NumPy operations release GIL for true parallelism")
    print("    - Memory is primary constraint (each sim ~1-10MB)")
    
    print("\n7.3 Deployment architecture:")
    print("    - Development: localhost:8000 (Python) + localhost:3000 (Next.js)")
    print("    - Production: Separate containers/services recommended")
    print("    - Scalability: Horizontal scaling with load balancer")
    print("    - State: Stateless - each request is independent")
    
    # PHASE 8: PERFORMANCE SUMMARY
    print("\n[PHASE 8] PERFORMANCE CHARACTERISTICS")
    print("-" * 40)
    
    print("8.1 Time breakdown (1000 iterations):")
    total_time = gen_time + calc_time
    print(f"    - Random generation: {gen_time:.2f}ms ({gen_time/total_time*100:.1f}%)")
    print(f"    - Scenario calculation: {calc_time:.2f}ms ({calc_time/total_time*100:.1f}%)")
    print(f"    - Total: {total_time:.2f}ms")
    
    print("\n8.2 Scalability analysis:")
    for iter_count in [100, 1000, 10000, 100000]:
        estimated_time = (total_time / 1000) * iter_count
        print(f"    - {iter_count:6} iterations: ~{estimated_time:8.2f}ms")
    
    print("\n8.3 Memory usage estimate:")
    for iter_count in [100, 1000, 10000, 100000]:
        # 7 random factor arrays * 8 bytes per float64 * iterations
        memory_mb = (7 * 8 * iter_count) / (1024 * 1024)
        print(f"    - {iter_count:6} iterations: ~{memory_mb:6.2f} MB")
    
    print("\n" + "=" * 80)
    print("EXECUTION TRACE COMPLETE")
    print("=" * 80)


if __name__ == "__main__":
    trace_execution_flow()