#!/usr/bin/env python3
"""
VALUE AUDITOR: Comprehensive assessment of financial simulation realism and value.
This script evaluates the Monte Carlo simulations against real-world financial standards.
"""

import sys
import os
import numpy as np
from typing import Dict, List, Tuple

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from python_engine.core.config import SimulationConfig
from python_engine.core.engine import MonteCarloEngine
from python_engine.data.csv_loader import CSVDataLoader
from python_engine.scenarios.emergency_fund import EmergencyFundScenario
from python_engine.scenarios.student_loan import StudentLoanPayoffScenario


class ValueAuditor:
    """
    Comprehensive auditor for financial simulation scenarios.
    Evaluates realism, accuracy, and business value.
    """
    
    def __init__(self):
        self.config = SimulationConfig()
        self.config.RANDOM_SEED = 42
        self.engine = MonteCarloEngine(self.config)
        self.loader = CSVDataLoader()
        
        # Scoring components
        self.scores = {
            'financial_accuracy': 0,
            'real_world_applicability': 0,
            'user_actionability': 0,
            'business_value': 0
        }
        
        self.findings = []
        self.value_gaps = []
        
    def audit_emergency_fund_scenario(self) -> Dict:
        """Audit emergency fund scenario for realism and value."""
        print("\n" + "="*70)
        print("EMERGENCY FUND SCENARIO AUDIT")
        print("="*70)
        
        scenario = EmergencyFundScenario()
        results = {}
        
        # Test with all three personas
        for profile_id in [1, 2, 3]:
            try:
                profile = self.loader.load_profile(profile_id)
                print(f"\n--- Profile {profile_id}: {profile.demographic} ---")
                
                # Run simulation
                result = self.engine.run_scenario(scenario, profile, iterations=10000)
                
                # Analyze results
                actual_coverage = profile.emergency_fund_balance / profile.monthly_expenses
                simulated_median = result.percentile_50
                
                print(f"Actual coverage: {actual_coverage:.2f} months")
                print(f"Simulated median: {simulated_median:.2f} months")
                print(f"Difference: {abs(actual_coverage - simulated_median):.2f} months")
                
                # Issue 1: Mathematical discrepancy
                if abs(actual_coverage - simulated_median) > 0.1:
                    self.findings.append(
                        f"CRITICAL: Emergency fund calculation error for Profile {profile_id}. "
                        f"Basic math shows {actual_coverage:.2f} months coverage, "
                        f"but simulation reports {simulated_median:.2f} months."
                    )
                
                # Issue 2: Unrealistic volatility assumptions
                if result.percentile_90 - result.percentile_10 < 0.2:
                    self.findings.append(
                        f"WARNING: Insufficient volatility modeling for Profile {profile_id}. "
                        f"Range too narrow ({result.percentile_10:.1f} - {result.percentile_90:.1f})"
                    )
                
                # Issue 3: Check demographic targets
                target = self.config.EMERGENCY_FUND_TARGETS.get(profile.demographic, 6)
                if actual_coverage < 1 and result.probability_success > 0:
                    self.findings.append(
                        f"ERROR: Profile {profile_id} has <1 month coverage but shows "
                        f"{result.probability_success:.1%} success probability. Logically impossible."
                    )
                
                results[profile_id] = {
                    'actual': actual_coverage,
                    'simulated': simulated_median,
                    'target': target,
                    'probability_success': result.probability_success
                }
                
            except Exception as e:
                self.findings.append(f"FAILURE: Profile {profile_id} crashed: {str(e)}")
                
        return results
    
    def audit_student_loan_scenario(self) -> Dict:
        """Audit student loan scenario for mathematical accuracy."""
        print("\n" + "="*70)
        print("STUDENT LOAN SCENARIO AUDIT")
        print("="*70)
        
        scenario = StudentLoanPayoffScenario()
        results = {}
        
        for profile_id in [1, 2, 3]:
            try:
                profile = self.loader.load_profile(profile_id)
                print(f"\n--- Profile {profile_id}: {profile.demographic} ---")
                
                if profile.student_loan_balance == 0:
                    print("No student loans - skipping")
                    continue
                
                # Calculate using standard loan formula
                principal = profile.student_loan_balance
                rate = self.config.STUDENT_LOAN_RATE / 12
                
                # Standard calculation for different payment amounts
                available_payment = max(50, profile.monthly_income - profile.monthly_expenses)
                
                print(f"Loan balance: ${principal:,.2f}")
                print(f"Available for payment: ${available_payment:,.2f}")
                
                # Mathematical calculation
                if available_payment > principal * rate:
                    months_math = -np.log(1 - (rate * principal / available_payment)) / np.log(1 + rate)
                else:
                    months_math = 999  # Cannot pay off
                
                # Run simulation
                result = self.engine.run_scenario(scenario, profile, iterations=10000)
                
                print(f"Mathematical calculation: {months_math:.1f} months")
                print(f"Simulation median: {result.percentile_50:.1f} months")
                print(f"Difference: {abs(months_math - result.percentile_50):.1f} months")
                
                # Check for mathematical accuracy
                if abs(months_math - result.percentile_50) > 12:
                    self.findings.append(
                        f"CRITICAL: Student loan math error for Profile {profile_id}. "
                        f"Standard formula: {months_math:.1f} months, "
                        f"Simulation: {result.percentile_50:.1f} months"
                    )
                
                # Check if payment capacity makes sense
                if available_payment < 0:
                    self.value_gaps.append(
                        f"Profile {profile_id} has negative payment capacity "
                        f"(expenses > income). Simulation should flag this as unsustainable."
                    )
                
                results[profile_id] = {
                    'balance': principal,
                    'available_payment': available_payment,
                    'mathematical_months': months_math,
                    'simulated_months': result.percentile_50
                }
                
            except Exception as e:
                self.findings.append(f"FAILURE: Profile {profile_id} loan calc failed: {str(e)}")
                
        return results
    
    def validate_financial_assumptions(self):
        """Validate that financial assumptions match reality."""
        print("\n" + "="*70)
        print("FINANCIAL ASSUMPTIONS VALIDATION")
        print("="*70)
        
        issues = []
        
        # Check market assumptions
        if self.config.MARKET_RETURN_MEAN == 0.07:
            print("✓ Market return assumption (7%) is reasonable for S&P 500 historical average")
        else:
            issues.append(f"Market return {self.config.MARKET_RETURN_MEAN:.1%} may be unrealistic")
        
        # Check volatility
        if 0.12 <= self.config.MARKET_RETURN_STD <= 0.20:
            print("✓ Market volatility (15%) is within historical norms")
        else:
            issues.append(f"Market volatility {self.config.MARKET_RETURN_STD:.1%} is questionable")
        
        # Check inflation
        if 0.02 <= self.config.INFLATION_MEAN <= 0.04:
            print("✓ Inflation assumption (3%) is reasonable")
        else:
            issues.append(f"Inflation {self.config.INFLATION_MEAN:.1%} doesn't match current environment")
        
        # Check interest rates against current market (as of 2024)
        rate_checks = [
            ('Savings', self.config.SAVINGS_RATE, 0.04, 0.055, "Current high-yield savings"),
            ('Student Loan', self.config.STUDENT_LOAN_RATE, 0.05, 0.08, "Federal loan rates"),
            ('Mortgage', self.config.MORTGAGE_RATE, 0.06, 0.08, "Current 30-year fixed"),
            ('Credit Card', self.config.CREDIT_CARD_RATE, 0.18, 0.25, "Industry average")
        ]
        
        for name, rate, min_rate, max_rate, benchmark in rate_checks:
            if min_rate <= rate <= max_rate:
                print(f"✓ {name} rate ({rate:.1%}) matches {benchmark}")
            else:
                issues.append(f"{name} rate {rate:.1%} outside {benchmark} range ({min_rate:.1%}-{max_rate:.1%})")
        
        # Emergency fund targets validation
        print("\n--- Emergency Fund Targets ---")
        for demo, months in self.config.EMERGENCY_FUND_TARGETS.items():
            if demo == 'genz' and months >= 3:
                print(f"✓ {demo}: {months} months is appropriate for young workers")
            elif demo == 'millennial' and 3 <= months <= 6:
                print(f"✓ {demo}: {months} months is standard recommendation")
            elif demo == 'midcareer' and 6 <= months <= 12:
                print(f"✓ {demo}: {months} months reflects higher obligations")
            else:
                issues.append(f"{demo} target of {months} months may not align with financial planning best practices")
        
        return issues
    
    def assess_user_value(self):
        """Assess whether outputs provide actionable value to users."""
        print("\n" + "="*70)
        print("USER VALUE ASSESSMENT")
        print("="*70)
        
        value_metrics = []
        
        # Test actionability of recommendations
        for profile_id in [1, 2, 3]:
            try:
                profile = self.loader.load_profile(profile_id)
                
                # Emergency fund analysis
                ef_scenario = EmergencyFundScenario()
                random_factors = self.engine._generate_random_factors(profile, 1000)
                ef_metrics = ef_scenario.calculate_advanced_metrics(profile, random_factors)
                
                print(f"\n--- Profile {profile_id} Emergency Fund Recommendations ---")
                print(f"Current coverage: {ef_metrics['current_months_coverage']:.1f} months")
                print(f"Target: {ef_metrics['target_months']} months")
                print(f"Additional savings needed: ${ef_metrics['recommended_additional_savings']:,.2f}")
                
                # Check if recommendations are actionable
                if ef_metrics['recommended_additional_savings'] > profile.monthly_income * 24:
                    value_metrics.append(
                        f"Profile {profile_id}: Unrealistic savings recommendation "
                        f"(>{2} years of income). Not actionable."
                    )
                
                # Student loan analysis (if applicable)
                if profile.student_loan_balance > 0:
                    sl_scenario = StudentLoanPayoffScenario()
                    sl_metrics = sl_scenario.calculate_advanced_metrics(profile, random_factors)
                    
                    print(f"\n--- Profile {profile_id} Student Loan Recommendations ---")
                    print(f"Recommended payment: ${sl_metrics['recommended_payment']:,.2f}")
                    print(f"Current capacity: ${max(0, profile.monthly_income - profile.monthly_expenses):,.2f}")
                    
                    if sl_metrics['recommended_payment'] > profile.monthly_income * 0.5:
                        value_metrics.append(
                            f"Profile {profile_id}: Loan payment recommendation exceeds 50% of income. "
                            f"Violates debt-to-income guidelines."
                        )
                        
            except Exception as e:
                value_metrics.append(f"Profile {profile_id} value assessment failed: {str(e)}")
        
        return value_metrics
    
    def calculate_final_scores(self):
        """Calculate final scoring based on audit findings."""
        print("\n" + "="*70)
        print("FINAL VALUE ASSESSMENT SCORES")
        print("="*70)
        
        # Financial Accuracy Score
        critical_errors = len([f for f in self.findings if 'CRITICAL' in f])
        warnings = len([f for f in self.findings if 'WARNING' in f])
        
        if critical_errors == 0:
            self.scores['financial_accuracy'] = 8 - warnings
        else:
            self.scores['financial_accuracy'] = max(1, 5 - critical_errors)
        
        # Real-world Applicability
        assumption_issues = len(self.validate_financial_assumptions())
        self.scores['real_world_applicability'] = max(1, 10 - assumption_issues)
        
        # User Actionability
        value_issues = len(self.assess_user_value())
        self.scores['user_actionability'] = max(1, 10 - value_issues * 2)
        
        # Business Value
        # Based on whether the simulations provide meaningful insights
        if len(self.value_gaps) == 0:
            self.scores['business_value'] = 7
        else:
            self.scores['business_value'] = max(3, 7 - len(self.value_gaps))
        
        # Display scores
        print("\n" + "-"*40)
        print("SCORING (1-10 scale)")
        print("-"*40)
        
        for metric, score in self.scores.items():
            bar = "█" * score + "░" * (10 - score)
            print(f"{metric.replace('_', ' ').title():25} {bar} {score}/10")
        
        overall = sum(self.scores.values()) / len(self.scores)
        print(f"\n{'OVERALL SCORE':25} {overall:.1f}/10")
        
        # Verdict
        print("\n" + "-"*40)
        print("VERDICT")
        print("-"*40)
        
        if overall >= 8:
            print("✓ PRODUCTION READY: Simulations provide genuine value")
        elif overall >= 6:
            print("⚠ NEEDS IMPROVEMENT: Core functionality works but gaps exist")
        else:
            print("✗ NOT READY: Significant issues prevent real-world deployment")
    
    def generate_report(self):
        """Generate comprehensive audit report."""
        print("\n" + "="*70)
        print("COMPREHENSIVE AUDIT FINDINGS")
        print("="*70)
        
        if self.findings:
            print("\n--- Critical Issues ---")
            for finding in self.findings:
                print(f"• {finding}")
        
        if self.value_gaps:
            print("\n--- Value Gaps ---")
            for gap in self.value_gaps:
                print(f"• {gap}")
        
        print("\n--- Recommendations ---")
        recommendations = [
            "Fix mathematical discrepancies in emergency fund calculations",
            "Add expense validation to prevent negative payment capacity scenarios",
            "Implement more sophisticated Monte Carlo modeling with proper distributions",
            "Add scenario for users with expenses exceeding income",
            "Include tax considerations in all calculations",
            "Add confidence bands that reflect actual uncertainty, not just percentiles",
            "Validate all recommendations against industry debt-to-income ratios",
            "Add explanations for why simulations differ from simple calculations"
        ]
        
        for rec in recommendations:
            print(f"• {rec}")


def main():
    """Run comprehensive value audit."""
    print("\n" + "="*70)
    print("FINANCEAI MONTE CARLO ENGINE - VALUE AUDIT")
    print("Evaluating Business Value and Financial Realism")
    print("="*70)
    
    auditor = ValueAuditor()
    
    # Run all audits
    emergency_results = auditor.audit_emergency_fund_scenario()
    loan_results = auditor.audit_student_loan_scenario()
    
    # Calculate and display final scores
    auditor.calculate_final_scores()
    
    # Generate detailed report
    auditor.generate_report()
    
    print("\n" + "="*70)
    print("AUDIT COMPLETE")
    print("="*70)


if __name__ == "__main__":
    main()