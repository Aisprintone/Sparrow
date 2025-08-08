#!/usr/bin/env python3
"""
Test script to validate AI personalization improvements
Ensures AI generates profile-specific content with actual financial numbers
"""

import asyncio
import json
from typing import Dict, Any, List
from datetime import datetime

# Import the AI system
from ai.langgraph_dspy_agent import FinancialAIAgentSystem

# Define test profiles
TEST_PROFILES = [
    {
        "profile_id": 1,
        "name": "Gen Z Student",
        "age": 22,
        "demographic": "gen_z",
        "monthly_income": 3200,
        "emergency_fund": 1500,
        "student_loans": 25000,
        "total_debt": 27000,
        "monthly_expenses": 2400,
        "description": "College student with part-time income"
    },
    {
        "profile_id": 2,
        "name": "Established Millennial",
        "age": 35,
        "demographic": "millennial",
        "monthly_income": 8500,
        "emergency_fund": 15000,
        "student_loans": 45000,
        "total_debt": 55000,
        "monthly_expenses": 5500,
        "description": "Mid-career professional with family"
    },
    {
        "profile_id": 3,
        "name": "Young Professional",
        "age": 28,
        "demographic": "millennial",
        "monthly_income": 5500,
        "emergency_fund": 8000,
        "student_loans": 35000,
        "total_debt": 38000,
        "monthly_expenses": 3800,
        "description": "Early career with growth potential"
    }
]

# Test scenarios
TEST_SCENARIOS = [
    "emergency_fund",
    "student_loan",
    "gig_economy"
]

class PersonalizationTester:
    """Test AI personalization quality"""
    
    def __init__(self):
        self.ai_system = FinancialAIAgentSystem()
        self.results = []
        
    async def test_profile(self, profile: Dict[str, Any], scenario: str) -> Dict[str, Any]:
        """Test a single profile with a scenario"""
        
        print(f"\n{'='*60}")
        print(f"Testing: {profile['name']} - {scenario}")
        print(f"Income: ${profile['monthly_income']:,}/mo | Debt: ${profile['total_debt']:,}")
        print(f"{'='*60}")
        
        # Create simulation data
        simulation_data = {
            "scenario_name": scenario,
            "result": {
                "percentiles": {"50": 0.5, "75": 0.75, "90": 0.9},
                "probability_success": 0.72,
                "final_amount": profile['emergency_fund'] * 3
            },
            "monthly_expenses": profile['monthly_expenses'],
            "emergency_fund": profile['emergency_fund']
        }
        
        try:
            # Generate AI cards
            cards = await self.ai_system.generate_explanation_cards(
                simulation_data=simulation_data,
                user_profile=profile,
                scenario_context=scenario
            )
            
            # Analyze personalization quality
            analysis = self.analyze_personalization(cards, profile, scenario)
            
            return {
                "profile": profile['name'],
                "scenario": scenario,
                "cards": cards,
                "analysis": analysis,
                "success": analysis['score'] >= 7.0
            }
            
        except Exception as e:
            print(f"Error testing {profile['name']}: {e}")
            return {
                "profile": profile['name'],
                "scenario": scenario,
                "error": str(e),
                "success": False
            }
    
    def analyze_personalization(self, cards: List[Dict], profile: Dict, scenario: str) -> Dict:
        """Analyze how well personalized the cards are"""
        
        checks = {
            "has_income_mention": False,
            "has_demographic_language": False,
            "has_specific_amounts": False,
            "has_actionable_titles": False,
            "has_concrete_steps": False,
            "generic_plan_titles": False,
            "review_language": False
        }
        
        income_str = f"${profile['monthly_income']:,.0f}"
        income_variations = [
            str(profile['monthly_income']),
            f"{profile['monthly_income']:,}",
            income_str
        ]
        
        for card in cards:
            title = card.get('title', '')
            rationale = card.get('rationale', '')
            steps = card.get('steps', [])
            all_text = f"{title} {rationale} {' '.join(steps)}"
            
            # Check for income mentions
            if any(amount in all_text for amount in income_variations):
                checks['has_income_mention'] = True
            
            # Check for demographic-specific language
            if profile['demographic'] in all_text.lower():
                checks['has_demographic_language'] = True
            
            # Check for specific dollar amounts
            if '$' in all_text and any(char.isdigit() for char in all_text):
                checks['has_specific_amounts'] = True
            
            # Check for generic titles (BAD)
            if 'Financial Plan' in title or 'Financial Strategy' in title:
                checks['generic_plan_titles'] = True
            else:
                checks['has_actionable_titles'] = True
            
            # Check for vague review language (BAD)
            if 'Review your financial situation' in all_text:
                checks['review_language'] = True
            
            # Check for concrete steps
            concrete_verbs = ['Transfer', 'Allocate', 'Open', 'Set up', 'Pay', 'Invest']
            if any(verb in ' '.join(steps) for verb in concrete_verbs):
                checks['has_concrete_steps'] = True
            
            # Print card details
            print(f"\nCard: {title}")
            print(f"  Tag: {card.get('tag', 'N/A')}")
            print(f"  Rationale preview: {rationale[:100]}...")
            print(f"  First step: {steps[0] if steps else 'N/A'}")
        
        # Calculate score
        positive_checks = sum([
            checks['has_income_mention'],
            checks['has_demographic_language'],
            checks['has_specific_amounts'],
            checks['has_actionable_titles'],
            checks['has_concrete_steps']
        ])
        
        negative_checks = sum([
            checks['generic_plan_titles'],
            checks['review_language']
        ])
        
        score = (positive_checks * 2) - (negative_checks * 3)
        score = max(0, min(10, score))
        
        print(f"\nPersonalization Analysis:")
        print(f"  ✓ Income mentioned: {checks['has_income_mention']}")
        print(f"  ✓ Demographic language: {checks['has_demographic_language']}")
        print(f"  ✓ Specific amounts: {checks['has_specific_amounts']}")
        print(f"  ✓ Actionable titles: {checks['has_actionable_titles']}")
        print(f"  ✓ Concrete steps: {checks['has_concrete_steps']}")
        print(f"  ✗ Generic titles: {checks['generic_plan_titles']}")
        print(f"  ✗ Vague language: {checks['review_language']}")
        print(f"  Score: {score}/10")
        
        return {
            "checks": checks,
            "score": score,
            "positive_count": positive_checks,
            "negative_count": negative_checks
        }
    
    async def run_all_tests(self):
        """Run all test combinations"""
        
        print("\n" + "="*60)
        print("AI PERSONALIZATION TEST SUITE")
        print("="*60)
        
        for profile in TEST_PROFILES:
            for scenario in TEST_SCENARIOS:
                result = await self.test_profile(profile, scenario)
                self.results.append(result)
                
                # Small delay between tests
                await asyncio.sleep(1)
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        
        successful = sum(1 for r in self.results if r.get('success', False))
        total = len(self.results)
        
        print(f"\nOverall: {successful}/{total} tests passed")
        
        # Group by profile
        for profile in TEST_PROFILES:
            profile_results = [r for r in self.results if r.get('profile') == profile['name']]
            profile_success = sum(1 for r in profile_results if r.get('success', False))
            
            print(f"\n{profile['name']}:")
            print(f"  Success rate: {profile_success}/{len(profile_results)}")
            
            for result in profile_results:
                if 'analysis' in result:
                    score = result['analysis']['score']
                    status = "✓" if result['success'] else "✗"
                    print(f"  {status} {result['scenario']}: Score {score}/10")
                else:
                    print(f"  ✗ {result['scenario']}: ERROR - {result.get('error', 'Unknown')}")
        
        # Identify common issues
        print("\n" + "="*60)
        print("COMMON ISSUES FOUND:")
        print("="*60)
        
        issues = {
            'generic_titles': 0,
            'no_income': 0,
            'no_demographic': 0,
            'vague_steps': 0
        }
        
        for result in self.results:
            if 'analysis' in result:
                checks = result['analysis']['checks']
                if checks.get('generic_plan_titles'):
                    issues['generic_titles'] += 1
                if not checks.get('has_income_mention'):
                    issues['no_income'] += 1
                if not checks.get('has_demographic_language'):
                    issues['no_demographic'] += 1
                if checks.get('review_language'):
                    issues['vague_steps'] += 1
        
        for issue, count in issues.items():
            if count > 0:
                print(f"  - {issue}: {count}/{total} tests")
        
        # Save detailed results
        with open('personalization_test_results.json', 'w') as f:
            json.dump(self.results, f, indent=2, default=str)
        
        print(f"\nDetailed results saved to: personalization_test_results.json")

async def main():
    """Main test function"""
    tester = PersonalizationTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())