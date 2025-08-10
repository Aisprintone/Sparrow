#!/usr/bin/env python3
"""
API ENDPOINT SIMULATION TEST SUITE
===================================
Direct API testing for all simulation scenarios.
Tests the actual production endpoints without internal dependencies.
"""

import requests
import json
import time
import statistics
from typing import Dict, List, Any
from datetime import datetime
import sys
import os

# Configuration
BASE_URL = "http://localhost:8000"
HEADERS = {
    "Content-Type": "application/json",
    "X-Service-Auth": "test-auth-token"
}

# Test profiles
PROFILE_IDS = [1, 2, 3]

# All scenarios that should be available
SCENARIOS = [
    'emergency_fund',
    'student_loan', 
    'medical_crisis',
    'gig_economy',
    'market_crash',
    'home_purchase',
    'rent_hike',
    'auto_repair'
]

# Missing scenarios to test for 404
MISSING_SCENARIOS = [
    'job_loss',
    'debt_payoff',
    'salary_increase'
]


class SimulationAPITester:
    """Test all simulation API endpoints"""
    
    def __init__(self):
        self.results = {}
        self.performance_metrics = []
        self.errors = []
        
    def test_scenario_endpoint(self, scenario: str, profile_id: int, 
                              params: Dict[str, Any] = None) -> Dict:
        """Test a single scenario endpoint"""
        
        url = f"{BASE_URL}/simulation/{scenario}"
        
        payload = {
            "profile_id": profile_id,
            "use_current_profile": True,
            "iterations": 5000
        }
        
        if params:
            payload.update(params)
            
        try:
            start_time = time.time()
            response = requests.post(url, json=payload, headers=HEADERS, timeout=10)
            execution_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                
                # Validate response structure
                validations = {
                    'status_code': 200,
                    'execution_time_ms': execution_time,
                    'under_7_seconds': execution_time < 7000,
                    'has_results': 'results' in data or 'percentile_50' in data,
                    'has_recommendations': 'recommendations' in data or 'ai_recommendations' in data,
                    'has_metadata': 'metadata' in data or 'processing_time_ms' in data
                }
                
                # Check for critical fields
                if 'results' in data:
                    results = data['results']
                    validations['has_percentiles'] = all([
                        'percentile_10' in results,
                        'percentile_50' in results,
                        'percentile_90' in results
                    ])
                    validations['has_probability'] = 'probability_success' in results
                else:
                    # Fallback for direct fields
                    validations['has_percentiles'] = 'percentile_50' in data
                    validations['has_probability'] = 'probability_success' in data
                    
                return {
                    'success': True,
                    'validations': validations,
                    'data': data
                }
                
            else:
                return {
                    'success': False,
                    'status_code': response.status_code,
                    'error': response.text,
                    'execution_time_ms': execution_time
                }
                
        except requests.RequestException as e:
            return {
                'success': False,
                'error': str(e),
                'execution_time_ms': None
            }
            
    def test_all_scenarios(self):
        """Test all scenario endpoints"""
        print("\n" + "="*60)
        print("API ENDPOINT TESTING")
        print("="*60)
        
        for scenario in SCENARIOS:
            print(f"\nTesting {scenario}...")
            scenario_results = {}
            
            for profile_id in PROFILE_IDS:
                result = self.test_scenario_endpoint(scenario, profile_id)
                
                if result['success']:
                    exec_time = result['validations']['execution_time_ms']
                    status = "✅" if result['validations']['under_7_seconds'] else "⚠️"
                    print(f"  Profile {profile_id}: {status} {exec_time:.0f}ms")
                else:
                    print(f"  Profile {profile_id}: ❌ {result.get('error', 'Failed')}")
                    
                scenario_results[f'profile_{profile_id}'] = result
                
            self.results[scenario] = scenario_results
            
    def test_missing_scenarios(self):
        """Test that missing scenarios return 404"""
        print("\n" + "="*60)
        print("MISSING SCENARIO VALIDATION")
        print("="*60)
        
        for scenario in MISSING_SCENARIOS:
            result = self.test_scenario_endpoint(scenario, 1)
            
            if result.get('status_code') == 404 or result.get('status_code') == 400:
                print(f"  {scenario}: ✅ Correctly returns error")
            else:
                print(f"  {scenario}: ⚠️  Unexpected response")
                
    def test_parameter_validation(self):
        """Test parameter validation for scenarios"""
        print("\n" + "="*60)
        print("PARAMETER VALIDATION TESTING")
        print("="*60)
        
        test_cases = [
            {
                'scenario': 'emergency_fund',
                'params': {'months_coverage': 6},
                'description': 'Emergency fund with target months'
            },
            {
                'scenario': 'student_loan',
                'params': {'extra_payment': 500},
                'description': 'Student loan with extra payment'
            },
            {
                'scenario': 'market_crash',
                'params': {'crash_severity': 0.3},
                'description': 'Market crash with 30% severity'
            },
            {
                'scenario': 'home_purchase',
                'params': {'home_price': 400000, 'down_payment_pct': 0.20},
                'description': 'Home purchase with price and down payment'
            }
        ]
        
        for test in test_cases:
            print(f"\n{test['description']}:")
            result = self.test_scenario_endpoint(
                test['scenario'], 
                1, 
                test['params']
            )
            
            if result['success']:
                print(f"  ✅ Parameters accepted")
            else:
                print(f"  ❌ Failed: {result.get('error')}")
                
    def test_performance_stress(self):
        """Stress test with high iteration counts"""
        print("\n" + "="*60)
        print("PERFORMANCE STRESS TESTING")
        print("="*60)
        
        iteration_counts = [1000, 5000, 10000, 25000]
        scenario = 'emergency_fund'
        
        print(f"\nScenario: {scenario}")
        print("Iterations | Time (ms) | Status")
        print("-" * 40)
        
        for iterations in iteration_counts:
            result = self.test_scenario_endpoint(
                scenario, 
                1,
                {'iterations': iterations}
            )
            
            if result['success']:
                exec_time = result['validations']['execution_time_ms']
                status = "✅" if exec_time < 7000 else "⚠️"
                print(f"{iterations:10,} | {exec_time:9.0f} | {status}")
            else:
                print(f"{iterations:10,} | {'N/A':>9} | ❌ Failed")
                
    def test_concurrent_requests(self):
        """Test concurrent API requests"""
        print("\n" + "="*60)
        print("CONCURRENT REQUEST TESTING")
        print("="*60)
        
        import concurrent.futures
        
        def make_request(index):
            scenario = SCENARIOS[index % len(SCENARIOS)]
            profile_id = (index % 3) + 1
            return self.test_scenario_endpoint(scenario, profile_id)
            
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(make_request, i) for i in range(20)]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]
            
        successful = sum(1 for r in results if r['success'])
        avg_time = statistics.mean([
            r['validations']['execution_time_ms'] 
            for r in results 
            if r['success'] and 'validations' in r
        ])
        
        print(f"  Concurrent requests: 20")
        print(f"  Successful: {successful}")
        print(f"  Average time: {avg_time:.0f}ms")
        print(f"  Status: {'✅ PASS' if successful == 20 else '⚠️  PARTIAL'}")
        
    def generate_report(self) -> Dict:
        """Generate comprehensive test report"""
        
        # Calculate statistics
        total_tests = 0
        successful_tests = 0
        performance_failures = 0
        
        for scenario, profiles in self.results.items():
            for profile, result in profiles.items():
                total_tests += 1
                if result.get('success'):
                    successful_tests += 1
                    if not result['validations'].get('under_7_seconds', True):
                        performance_failures += 1
                        
        report = {
            'timestamp': datetime.now().isoformat(),
            'test_suite': 'API_SIMULATION_ENDPOINTS_v1.0',
            'summary': {
                'total_scenarios_tested': len(SCENARIOS),
                'total_tests': total_tests,
                'successful_tests': successful_tests,
                'failed_tests': total_tests - successful_tests,
                'performance_failures': performance_failures,
                'success_rate': (successful_tests / total_tests * 100) if total_tests > 0 else 0
            },
            'scenarios': self.results,
            'missing_scenarios': MISSING_SCENARIOS,
            'status': 'PASS' if successful_tests == total_tests else 'PARTIAL'
        }
        
        return report


def main():
    """Run API endpoint tests"""
    
    # Check if server is running
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=2)
        if response.status_code != 200:
            print("⚠️  Warning: Server health check failed")
    except requests.RequestException:
        print("❌ Error: Server is not running at", BASE_URL)
        print("Please start the server with: python app.py")
        return 1
        
    tester = SimulationAPITester()
    
    # Run all tests
    tester.test_all_scenarios()
    tester.test_missing_scenarios()
    tester.test_parameter_validation()
    tester.test_performance_stress()
    tester.test_concurrent_requests()
    
    # Generate report
    report = tester.generate_report()
    
    # Save report
    report_path = '/tmp/api_simulation_test_report.json'
    with open(report_path, 'w') as f:
        json.dump(report, f, indent=2, default=str)
        
    # Print summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    print(f"Total Tests: {report['summary']['total_tests']}")
    print(f"Successful: {report['summary']['successful_tests']}")
    print(f"Failed: {report['summary']['failed_tests']}")
    print(f"Performance Failures: {report['summary']['performance_failures']}")
    print(f"Success Rate: {report['summary']['success_rate']:.1f}%")
    print(f"Overall Status: {report['status']}")
    
    print(f"\nDetailed report saved to: {report_path}")
    print("="*60 + "\n")
    
    # Battle report
    print("\n" + "="*60)
    print("BATTLE REPORT: SIMULATION SCENARIO COVERAGE")
    print("="*60)
    print("\n✅ TESTED SCENARIOS (8/11):")
    for scenario in SCENARIOS:
        print(f"  - {scenario}")
        
    print("\n❌ MISSING SCENARIOS (3/11):")
    for scenario in MISSING_SCENARIOS:
        print(f"  - {scenario} (NOT IMPLEMENTED)")
        
    print("\n📊 COVERAGE: 72.7% (8/11 scenarios)")
    print("🎯 TARGET: 100% (11/11 scenarios)")
    print("⚠️  GAP: 3 scenarios need implementation")
    
    print("\n🔧 IMPLEMENTATION PRIORITY:")
    print("  1. job_loss - Critical for recession planning")
    print("  2. debt_payoff - Essential for debt management")
    print("  3. salary_increase - Career progression planning")
    
    print("\n⚡ PERFORMANCE:")
    if report['summary']['performance_failures'] == 0:
        print("  ✅ All scenarios meet 7-second threshold")
    else:
        print(f"  ⚠️  {report['summary']['performance_failures']} scenarios exceed 7-second threshold")
        
    print("\n💪 RECOMMENDATION:")
    if report['summary']['success_rate'] >= 95:
        print("  PRODUCTION READY for existing scenarios")
    elif report['summary']['success_rate'] >= 80:
        print("  NEEDS OPTIMIZATION before production")
    else:
        print("  CRITICAL ISSUES need resolution")
        
    print("="*60 + "\n")
    
    return 0 if report['status'] == 'PASS' else 1


if __name__ == "__main__":
    exit(main())