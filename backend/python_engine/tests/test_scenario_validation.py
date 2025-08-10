#!/usr/bin/env python3
"""
SCENARIO VALIDATION TEST SUITE
===============================
Direct validation of all implemented scenarios without external dependencies.
"""

import time
import json
import sys
import os
from datetime import datetime
from typing import Dict, List, Any

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.config import SimulationConfig
from core.engine import MonteCarloEngine
from core.models import ProfileData, Account, AccountType
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


class ScenarioValidator:
    """Validates all simulation scenarios"""
    
    def __init__(self):
        self.config = SimulationConfig()
        self.config.RANDOM_SEED = 42
        self.engine = MonteCarloEngine(self.config)
        self.loader = CSVDataLoader()
        self.results = {}
        self.errors = []
        
    def validate_scenario(self, name: str, scenario, profile_id: int, iterations: int = 5000) -> Dict:
        """Validate a single scenario"""
        print(f"\n  Testing {name}...")
        
        try:
            # Load profile
            profile = self.loader.load_profile(profile_id)
            
            # Run simulation
            start_time = time.time()
            result = self.engine.run_scenario(scenario, profile, iterations=iterations)
            execution_time = (time.time() - start_time) * 1000
            
            # Basic validations
            validations = {
                'executed': True,
                'execution_time_ms': execution_time,
                'under_7_seconds': execution_time < 7000,
                'has_percentiles': all([
                    hasattr(result, 'percentile_10'),
                    hasattr(result, 'percentile_50'),
                    hasattr(result, 'percentile_90')
                ]),
                'percentiles_ordered': result.percentile_10 <= result.percentile_50 <= result.percentile_90,
                'probability_valid': 0 <= result.probability_success <= 1,
                'has_metadata': result.metadata is not None,
                'convergence_info': result.metadata.get('convergence_achieved', False) if result.metadata else False
            }
            
            # Advanced metrics if available
            if hasattr(scenario, 'calculate_advanced_metrics'):
                try:
                    random_factors = self.engine._generate_random_factors(profile, iterations)
                    metrics = scenario.calculate_advanced_metrics(profile, random_factors)
                    validations['has_advanced_metrics'] = True
                    validations['metrics_count'] = len(metrics)
                except Exception as e:
                    validations['has_advanced_metrics'] = False
                    validations['metrics_error'] = str(e)
            else:
                validations['has_advanced_metrics'] = False
                
            # Recommendations if available
            if hasattr(scenario, 'generate_recommendations'):
                try:
                    recommendations = scenario.generate_recommendations(profile, result)
                    validations['has_recommendations'] = True
                    validations['recommendation_count'] = len(recommendations) if recommendations else 0
                except Exception as e:
                    validations['has_recommendations'] = False
                    validations['recommendation_error'] = str(e)
            else:
                validations['has_recommendations'] = False
                
            # Performance tier
            if execution_time < 1000:
                validations['performance_tier'] = 'EXCELLENT'
            elif execution_time < 3000:
                validations['performance_tier'] = 'GOOD'
            elif execution_time < 5000:
                validations['performance_tier'] = 'ACCEPTABLE'
            elif execution_time < 7000:
                validations['performance_tier'] = 'MARGINAL'
            else:
                validations['performance_tier'] = 'FAILING'
                
            print(f"    ✅ Success - {execution_time:.0f}ms ({validations['performance_tier']})")
            
            return validations
            
        except Exception as e:
            error_msg = f"{name}: {str(e)}"
            self.errors.append(error_msg)
            print(f"    ❌ Failed: {str(e)}")
            
            return {
                'executed': False,
                'error': str(e),
                'execution_time_ms': None,
                'under_7_seconds': False
            }
            
    def validate_all_scenarios(self) -> Dict:
        """Validate all implemented scenarios"""
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
        
        print("\n" + "="*60)
        print("SCENARIO VALIDATION REPORT")
        print("="*60)
        
        for name, scenario in scenarios:
            # Test with all 3 profiles
            profile_results = {}
            for profile_id in [1, 2, 3]:
                print(f"\n{name.upper()} - Profile {profile_id}:")
                result = self.validate_scenario(name, scenario, profile_id)
                profile_results[f'profile_{profile_id}'] = result
                
            self.results[name] = profile_results
            
        return self.results
        
    def test_edge_cases(self) -> Dict:
        """Test edge cases for robustness"""
        edge_case_results = {}
        
        print("\n" + "="*60)
        print("EDGE CASE TESTING")
        print("="*60)
        
        # Create extreme profiles
        edge_profiles = [
            # Zero income profile
            ProfileData(
                customer_id=900,
                demographic="GenZ",
                monthly_income=0,
                monthly_expenses=3000,
                emergency_fund_balance=1000,
                student_loan_balance=25000,
                credit_card_balance=5000,
                retirement_balance=0,
                investment_balance=0,
                real_estate_value=0,
                mortgage_balance=0,
                other_debt=0,
                insurance_coverage=0,
                credit_score=550,
                spending_categories={},
                financial_goals=[],
                accounts=[],
                transactions=[],
                net_worth=0,
                updated_at=datetime.now()
            ),
            # High debt profile
            ProfileData(
                customer_id=901,
                demographic="Millennial",
                monthly_income=5000,
                monthly_expenses=4800,
                emergency_fund_balance=100,
                student_loan_balance=150000,
                credit_card_balance=50000,
                retirement_balance=0,
                investment_balance=0,
                real_estate_value=0,
                mortgage_balance=500000,
                other_debt=100000,
                insurance_coverage=0,
                credit_score=400,
                spending_categories={},
                financial_goals=[],
                accounts=[],
                transactions=[],
                net_worth=-800000,
                updated_at=datetime.now()
            ),
            # Wealthy profile
            ProfileData(
                customer_id=902,
                demographic="GenX",
                monthly_income=50000,
                monthly_expenses=10000,
                emergency_fund_balance=500000,
                student_loan_balance=0,
                credit_card_balance=0,
                retirement_balance=2000000,
                investment_balance=1000000,
                real_estate_value=3000000,
                mortgage_balance=0,
                other_debt=0,
                insurance_coverage=5000000,
                credit_score=850,
                spending_categories={},
                financial_goals=[],
                accounts=[],
                transactions=[],
                net_worth=6500000,
                updated_at=datetime.now()
            )
        ]
        
        scenarios = [
            ('emergency_fund', EmergencyFundScenario()),
            ('medical_crisis', MedicalCrisisScenario())
        ]
        
        for profile_type, profile in zip(['zero_income', 'high_debt', 'wealthy'], edge_profiles):
            print(f"\n{profile_type.upper()} PROFILE:")
            
            for name, scenario in scenarios:
                try:
                    start = time.time()
                    result = self.engine.run_scenario(scenario, profile, iterations=1000)
                    elapsed = (time.time() - start) * 1000
                    
                    edge_case_results[f'{profile_type}_{name}'] = {
                        'success': True,
                        'execution_time_ms': elapsed,
                        'handled_gracefully': True
                    }
                    print(f"  ✅ {name}: Handled gracefully ({elapsed:.0f}ms)")
                    
                except Exception as e:
                    edge_case_results[f'{profile_type}_{name}'] = {
                        'success': False,
                        'error': str(e),
                        'handled_gracefully': False
                    }
                    print(f"  ❌ {name}: Failed - {str(e)}")
                    
        return edge_case_results
        
    def test_performance_benchmarks(self) -> Dict:
        """Test performance at different iteration counts"""
        print("\n" + "="*60)
        print("PERFORMANCE BENCHMARKS")
        print("="*60)
        
        scenario = EmergencyFundScenario()
        profile = self.loader.load_profile(1)
        
        iteration_tests = [100, 1000, 5000, 10000, 25000, 50000]
        performance_results = {}
        
        print("\nIterations | Time (ms) | Status")
        print("-" * 40)
        
        for iterations in iteration_tests:
            start = time.time()
            result = self.engine.run_scenario(scenario, profile, iterations=iterations)
            elapsed = (time.time() - start) * 1000
            
            # Expected max time (linear with some overhead)
            expected_max = iterations * 0.7  # 0.7ms per iteration max
            status = "✅ PASS" if elapsed < expected_max else "⚠️  SLOW"
            
            performance_results[iterations] = {
                'execution_time_ms': elapsed,
                'under_threshold': elapsed < expected_max,
                'convergence': result.metadata.get('convergence_achieved', False) if result.metadata else False
            }
            
            print(f"{iterations:9,} | {elapsed:9.1f} | {status}")
            
        return performance_results
        
    def generate_report(self) -> Dict:
        """Generate comprehensive validation report"""
        # Count successes and failures
        total_tests = 0
        successful_tests = 0
        performance_failures = 0
        
        for scenario_name, profiles in self.results.items():
            for profile_name, result in profiles.items():
                total_tests += 1
                if result.get('executed', False):
                    successful_tests += 1
                if not result.get('under_7_seconds', True):
                    performance_failures += 1
                    
        report = {
            'timestamp': datetime.now().isoformat(),
            'test_suite': 'SCENARIO_VALIDATION_v1.0',
            'summary': {
                'total_scenarios': 8,
                'total_tests': total_tests,
                'successful_tests': successful_tests,
                'failed_tests': total_tests - successful_tests,
                'performance_failures': performance_failures,
                'success_rate': (successful_tests / total_tests * 100) if total_tests > 0 else 0
            },
            'scenarios': self.results,
            'errors': self.errors,
            'status': 'PASS' if successful_tests == total_tests and performance_failures == 0 else 'FAIL'
        }
        
        return report


def main():
    """Run scenario validation"""
    validator = ScenarioValidator()
    
    # Run all validations
    validator.validate_all_scenarios()
    edge_results = validator.test_edge_cases()
    performance_results = validator.test_performance_benchmarks()
    
    # Generate report
    report = validator.generate_report()
    report['edge_cases'] = edge_results
    report['performance_benchmarks'] = performance_results
    
    # Save report
    report_path = '/tmp/scenario_validation_report.json'
    with open(report_path, 'w') as f:
        json.dump(report, f, indent=2, default=str)
        
    # Print summary
    print("\n" + "="*60)
    print("VALIDATION SUMMARY")
    print("="*60)
    print(f"Total Tests: {report['summary']['total_tests']}")
    print(f"Successful: {report['summary']['successful_tests']}")
    print(f"Failed: {report['summary']['failed_tests']}")
    print(f"Performance Failures: {report['summary']['performance_failures']}")
    print(f"Success Rate: {report['summary']['success_rate']:.1f}%")
    print(f"Overall Status: {report['status']}")
    
    if report['errors']:
        print("\n⚠️  ERRORS ENCOUNTERED:")
        for error in report['errors']:
            print(f"  - {error}")
            
    print(f"\nDetailed report saved to: {report_path}")
    print("="*60 + "\n")
    
    # Return exit code
    return 0 if report['status'] == 'PASS' else 1


if __name__ == "__main__":
    exit(main())