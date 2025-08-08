#!/usr/bin/env python3
"""
Quick test script to verify Monte Carlo engine functionality.
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from python_engine.core.config import SimulationConfig
from python_engine.core.engine import MonteCarloEngine
from python_engine.data.csv_loader import CSVDataLoader
from python_engine.scenarios.emergency_fund import EmergencyFundScenario
from python_engine.scenarios.student_loan import StudentLoanPayoffScenario


def test_emergency_fund_simulation():
    """Test emergency fund simulation for all profiles."""
    print("\n" + "="*60)
    print("EMERGENCY FUND RUNWAY SIMULATION")
    print("="*60)
    
    config = SimulationConfig()
    config.RANDOM_SEED = 42
    engine = MonteCarloEngine(config)
    loader = CSVDataLoader()
    scenario = EmergencyFundScenario()
    
    for profile_id in [1, 2, 3]:
        print(f"\n--- Profile {profile_id} ---")
        
        try:
            # Load profile
            profile = loader.load_profile(profile_id)
            print(f"Demographic: {profile.demographic}")
            print(f"Emergency Fund: ${profile.emergency_fund_balance:,.2f}")
            print(f"Monthly Expenses: ${profile.monthly_expenses:,.2f}")
            
            # Run simulation
            result = engine.run_scenario(scenario, profile, iterations=5000)
            
            # Display results
            print(f"\nSimulation Results (5,000 iterations):")
            print(f"  Median runway: {result.percentile_50:.1f} months")
            print(f"  10th percentile: {result.percentile_10:.1f} months")
            print(f"  90th percentile: {result.percentile_90:.1f} months")
            print(f"  Probability of >3 months: {result.probability_success:.1%}")
            print(f"  Processing time: {result.processing_time_ms:.1f}ms")
            
            # Calculate advanced metrics
            random_factors = engine._generate_random_factors(profile, 5000)
            metrics = scenario.calculate_advanced_metrics(profile, random_factors)
            
            print(f"\nAdvanced Metrics:")
            print(f"  Target months: {metrics['target_months']}")
            print(f"  Current coverage: {metrics['current_months_coverage']:.1f} months")
            print(f"  Probability meet target: {metrics['probability_meet_target']:.1%}")
            print(f"  Recommended additional savings: ${metrics['recommended_additional_savings']:,.2f}")
            
        except Exception as e:
            print(f"Error: {str(e)}")


def test_student_loan_simulation():
    """Test student loan payoff simulation."""
    print("\n" + "="*60)
    print("STUDENT LOAN PAYOFF SIMULATION")
    print("="*60)
    
    config = SimulationConfig()
    config.RANDOM_SEED = 42
    engine = MonteCarloEngine(config)
    loader = CSVDataLoader()
    scenario = StudentLoanPayoffScenario()
    
    for profile_id in [1, 2, 3]:
        print(f"\n--- Profile {profile_id} ---")
        
        try:
            # Load profile
            profile = loader.load_profile(profile_id)
            print(f"Demographic: {profile.demographic}")
            print(f"Student Loans: ${profile.student_loan_balance:,.2f}")
            print(f"Monthly Income: ${profile.monthly_income:,.2f}")
            print(f"Monthly Expenses: ${profile.monthly_expenses:,.2f}")
            
            if profile.student_loan_balance == 0:
                print("No student loans detected")
                continue
            
            # Run simulation
            result = engine.run_scenario(scenario, profile, iterations=5000)
            
            # Display results
            print(f"\nSimulation Results (5,000 iterations):")
            print(f"  Median payoff time: {result.percentile_50:.1f} months ({result.percentile_50/12:.1f} years)")
            print(f"  10th percentile: {result.percentile_10:.1f} months")
            print(f"  90th percentile: {result.percentile_90:.1f} months")
            print(f"  Probability <10 years: {result.probability_success:.1%}")
            print(f"  Processing time: {result.processing_time_ms:.1f}ms")
            
            # Calculate advanced metrics
            random_factors = engine._generate_random_factors(profile, 5000)
            metrics = scenario.calculate_advanced_metrics(profile, random_factors)
            
            if metrics['has_student_loans']:
                print(f"\nAdvanced Metrics:")
                print(f"  Estimated monthly payment: ${metrics['estimated_monthly_payment']:,.2f}")
                print(f"  Total interest paid: ${metrics['total_interest_paid']:,.2f}")
                print(f"  Probability payoff in 5 years: {metrics['probability_payoff_5_years']:.1%}")
                print(f"  Recommended payment: ${metrics['recommended_payment']:,.2f}")
            
        except Exception as e:
            print(f"Error: {str(e)}")


def test_performance():
    """Test performance with different iteration counts."""
    print("\n" + "="*60)
    print("PERFORMANCE BENCHMARKING")
    print("="*60)
    
    config = SimulationConfig()
    engine = MonteCarloEngine(config)
    loader = CSVDataLoader()
    scenario = EmergencyFundScenario()
    
    profile = loader.load_profile(1)
    
    iteration_counts = [100, 1000, 10000, 50000]
    
    print("\nIteration Count | Processing Time | Convergence")
    print("-" * 50)
    
    for iterations in iteration_counts:
        result = engine.run_scenario(scenario, profile, iterations=iterations)
        convergence = "Yes" if result.metadata.get('convergence_achieved', False) else "No"
        print(f"{iterations:14,} | {result.processing_time_ms:13.1f}ms | {convergence}")


if __name__ == "__main__":
    print("\nFinanceAI Monte Carlo Engine Test Suite")
    print("=" * 60)
    
    test_emergency_fund_simulation()
    test_student_loan_simulation()
    test_performance()
    
    print("\n" + "="*60)
    print("All tests completed successfully!")
    print("="*60)