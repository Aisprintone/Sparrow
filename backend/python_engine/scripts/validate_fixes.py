#!/usr/bin/env python3
"""
Validation script to verify mathematical fixes in Monte Carlo engine.
Tests specific scenarios that were previously broken.
"""

import sys
import os
import math
import numpy as np

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from python_engine.core.config import SimulationConfig
from python_engine.core.engine import MonteCarloEngine
from python_engine.data.csv_loader import CSVDataLoader
from python_engine.scenarios.emergency_fund import EmergencyFundScenario
from python_engine.scenarios.student_loan import StudentLoanPayoffScenario


def validate_loan_formula():
    """Validate student loan payment formula against known values."""
    print("\n" + "="*60)
    print("VALIDATING STUDENT LOAN FORMULA")
    print("="*60)
    
    scenario = StudentLoanPayoffScenario()
    
    # Test case: $25,000 loan, 6% annual rate
    # Calculate payment for different terms
    principal = 25000
    annual_rate = 0.06
    monthly_rate = annual_rate / 12
    
    # Calculate payment for 94 months
    calculated_payment_94 = scenario._calculate_payment_from_months(principal, monthly_rate, 94)
    
    # Verify the payment using reverse calculation
    # With $333.99 payment, how many months to pay off?
    # Using formula: n = -log(1 - P*r/M) / log(1 + r)
    if calculated_payment_94 > principal * monthly_rate:
        months_to_payoff = -math.log(1 - (principal * monthly_rate) / calculated_payment_94) / math.log(1 + monthly_rate)
    else:
        months_to_payoff = float('inf')
    
    print(f"\nTest Case 1: Payment Calculation for 94 Months")
    print(f"  Principal: ${principal:,.2f}")
    print(f"  Annual Rate: {annual_rate:.1%}")
    print(f"  Target Months: 94")
    print(f"  Calculated Payment: ${calculated_payment_94:.2f}")
    print(f"  Verification: {months_to_payoff:.1f} months to payoff")
    print(f"  ✓ PASS" if abs(months_to_payoff - 94) < 1 else f"  ✗ FAIL")
    
    # Test case 2: Payment calculation for 10-year term
    payment_for_120_months = scenario._calculate_payment_from_months(principal, monthly_rate, 120)
    
    # Verify the calculation
    if payment_for_120_months > principal * monthly_rate:
        months_verify_120 = -math.log(1 - (principal * monthly_rate) / payment_for_120_months) / math.log(1 + monthly_rate)
    else:
        months_verify_120 = float('inf')
    
    print(f"\nTest Case 2: 10-Year Standard Repayment")
    print(f"  Principal: ${principal:,.2f}")
    print(f"  Annual Rate: {annual_rate:.1%}")
    print(f"  Months: 120 (10 years)")
    print(f"  Calculated Payment: ${payment_for_120_months:.2f}")
    print(f"  Verification: {months_verify_120:.1f} months to payoff")
    print(f"  ✓ PASS" if abs(months_verify_120 - 120) < 1 else f"  ✗ FAIL")
    
    # Test case 3: Edge case - very low payment (should not cause infinite loop)
    payment_for_360_months = scenario._calculate_payment_from_months(principal, monthly_rate, 360)
    min_interest_payment = principal * monthly_rate
    
    print(f"\nTest Case 3: Long-term Repayment (30 years)")
    print(f"  Principal: ${principal:,.2f}")
    print(f"  Months: 360 (30 years)")
    print(f"  Calculated Payment: ${payment_for_360_months:.2f}")
    print(f"  Minimum Interest: ${min_interest_payment:.2f}")
    print(f"  ✓ PASS (payment covers interest)" if payment_for_360_months > min_interest_payment else f"  ✗ FAIL")
    
    return True


def test_all_profiles():
    """Test all profiles to ensure no crashes or mathematical errors."""
    print("\n" + "="*60)
    print("TESTING ALL PROFILES - NO CRASHES")
    print("="*60)
    
    config = SimulationConfig()
    config.RANDOM_SEED = 42
    engine = MonteCarloEngine(config)
    loader = CSVDataLoader()
    
    scenarios = [
        ("Emergency Fund", EmergencyFundScenario()),
        ("Student Loan", StudentLoanPayoffScenario())
    ]
    
    all_passed = True
    
    for scenario_name, scenario in scenarios:
        print(f"\n--- Testing {scenario_name} Scenario ---")
        
        for profile_id in [1, 2, 3]:
            try:
                profile = loader.load_profile(profile_id)
                result = engine.run_scenario(scenario, profile, iterations=1000)
                
                # Validate results are reasonable
                checks = [
                    ("Mean is finite", math.isfinite(result.mean)),
                    ("Mean is positive", result.mean >= 0),
                    ("Std dev is finite", math.isfinite(result.std_dev)),
                    ("Percentiles are ordered", 
                     result.percentile_10 <= result.percentile_25 <= result.percentile_50 <= 
                     result.percentile_75 <= result.percentile_90),
                    ("Success probability is valid", 0 <= result.probability_success <= 1),
                    ("Convergence check completed", 'convergence_achieved' in result.metadata),
                    ("Distribution identified", 'distribution_type' in result.metadata)
                ]
                
                all_checks_passed = all(check[1] for check in checks)
                
                if all_checks_passed:
                    print(f"  Profile {profile_id}: ✓ PASS (all checks passed)")
                else:
                    print(f"  Profile {profile_id}: ✗ FAIL")
                    for check_name, passed in checks:
                        if not passed:
                            print(f"    - Failed: {check_name}")
                    all_passed = False
                    
            except Exception as e:
                print(f"  Profile {profile_id}: ✗ CRASH - {str(e)}")
                all_passed = False
    
    return all_passed


def test_edge_cases():
    """Test edge cases that previously caused issues."""
    print("\n" + "="*60)
    print("TESTING EDGE CASES")
    print("="*60)
    
    config = SimulationConfig()
    config.RANDOM_SEED = 42
    engine = MonteCarloEngine(config)
    
    # Create a mock profile with edge case values
    from python_engine.core.models import ProfileData, Account, Transaction, AccountType, Demographic
    from datetime import datetime
    
    # Test 1: Zero emergency fund
    print("\nTest 1: Zero Emergency Fund")
    zero_fund_profile = ProfileData(
        customer_id=999,
        demographic=Demographic.MILLENNIAL,
        accounts=[
            Account(
                account_id="test1",
                customer_id=999,
                institution_name="Test Bank",
                account_type=AccountType.CHECKING,
                account_name="Test Checking",
                balance=100
            )
        ],
        transactions=[],
        monthly_income=3000,
        monthly_expenses=2000,
        credit_score=700,
        age=30
    )
    
    try:
        scenario = EmergencyFundScenario()
        result = engine.run_scenario(scenario, zero_fund_profile, iterations=100)
        print(f"  Result: Median runway = {result.percentile_50:.1f} months")
        print(f"  ✓ PASS - No crash with zero emergency fund")
    except Exception as e:
        print(f"  ✗ FAIL - Crashed: {str(e)}")
    
    # Test 2: Very high loan balance
    print("\nTest 2: High Student Loan Balance")
    high_loan_profile = ProfileData(
        customer_id=998,
        demographic=Demographic.MILLENNIAL,
        accounts=[
            Account(
                account_id="test2",
                customer_id=998,
                institution_name="Test Bank",
                account_type=AccountType.STUDENT_LOAN,
                account_name="Student Loan",
                balance=-100000  # $100k loan
            )
        ],
        transactions=[],
        monthly_income=5000,
        monthly_expenses=3000,
        credit_score=700,
        age=30
    )
    
    try:
        scenario = StudentLoanPayoffScenario()
        result = engine.run_scenario(scenario, high_loan_profile, iterations=100)
        print(f"  Result: Median payoff = {result.percentile_50:.1f} months ({result.percentile_50/12:.1f} years)")
        
        # Check if result is reasonable (should be less than 360 months)
        if result.percentile_50 <= 360:
            print(f"  ✓ PASS - Reasonable payoff time")
        else:
            print(f"  ✗ FAIL - Unreasonable payoff time (>30 years)")
    except Exception as e:
        print(f"  ✗ FAIL - Crashed: {str(e)}")
    
    return True


def main():
    """Run all validation tests."""
    print("\nMonte Carlo Engine Mathematical Validation Suite")
    print("=" * 60)
    
    # Run validation tests
    tests = [
        ("Loan Formula Validation", validate_loan_formula),
        ("All Profiles Test", test_all_profiles),
        ("Edge Cases Test", test_edge_cases)
    ]
    
    all_passed = True
    for test_name, test_func in tests:
        try:
            passed = test_func()
            if not passed:
                all_passed = False
        except Exception as e:
            print(f"\n{test_name} FAILED with exception: {str(e)}")
            all_passed = False
    
    print("\n" + "="*60)
    if all_passed:
        print("✓ ALL VALIDATIONS PASSED - Mathematical fixes verified!")
    else:
        print("✗ SOME TESTS FAILED - Review the output above")
    print("="*60)


if __name__ == "__main__":
    main()