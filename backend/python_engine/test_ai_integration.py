#!/usr/bin/env python3
"""
Test script to verify AI-generated content integration.
Tests the complete flow from simulation to AI-powered explanations.
"""

import asyncio
import json
import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

from dotenv import load_dotenv
load_dotenv()

# Import required modules
from ai.langgraph_dspy_agent import FinancialAIAgentSystem
from scenarios.medical_crisis import MedicalCrisisScenario
from core.api_cache import api_cache, APIProvider

import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def test_ai_integration():
    """Test the complete AI integration flow."""
    
    print("\n" + "="*60)
    print("AI INTEGRATION TEST - Medical Crisis Scenario")
    print("="*60 + "\n")
    
    # 1. Check API configuration
    print("1. Checking API Configuration...")
    try:
        provider = api_cache._select_best_provider()
        print(f"   ✓ Using {provider.value} provider")
        print(f"   ✓ API keys configured: {list(api_cache.configs.keys())}")
    except Exception as e:
        print(f"   ✗ API configuration error: {e}")
        print("   Please ensure ANTHROPIC_API_KEY or OPENAI_API_KEY is set in .env")
        return
    
    # 2. Initialize AI Agent System
    print("\n2. Initializing AI Agent System...")
    try:
        ai_agent = FinancialAIAgentSystem()
        print("   ✓ AI Agent initialized successfully")
    except Exception as e:
        print(f"   ✗ Failed to initialize AI Agent: {e}")
        return
    
    # 3. Create test profile data
    print("\n3. Creating test profile data...")
    profile_data = {
        "customer_id": 1,
        "name": "Test User",
        "age": 35,
        "monthly_income": 6000,
        "monthly_expenses": 3500,
        "emergency_fund": 12000,
        "student_loan_balance": 25000,
        "credit_card_debt": 5000,
        "risk_tolerance": "moderate",
        "credit_score": 720,
        "insurance_type": "employer_ppo",
        "deductible": 1500,
        "out_of_pocket_max": 6000,
        "geographic_location": "midwest"
    }
    print("   ✓ Profile created with:")
    print(f"     - Monthly Income: ${profile_data['monthly_income']:,}")
    print(f"     - Emergency Fund: ${profile_data['emergency_fund']:,}")
    print(f"     - Total Debt: ${profile_data['student_loan_balance'] + profile_data['credit_card_debt']:,}")
    
    # 4. Run Medical Crisis Simulation
    print("\n4. Running Medical Crisis Simulation...")
    try:
        scenario = MedicalCrisisScenario()
        config = {
            "num_simulations": 100,
            "time_horizon_months": 24
        }
        
        simulation_result = await scenario.run_simulation(profile_data, config)
        print("   ✓ Simulation completed successfully")
        print(f"     - Scenario: {simulation_result.get('scenario_name', 'Medical Crisis')}")
        print(f"     - Financial Impact calculated")
    except Exception as e:
        print(f"   ✗ Simulation failed: {e}")
        return
    
    # 5. Generate AI Explanations
    print("\n5. Generating AI-Powered Explanations...")
    try:
        # Use generate_explanation_cards which exists, then format it
        explanations = await ai_agent.generate_explanation_cards(
            simulation_data=simulation_result,
            user_profile=profile_data,
            scenario_context="medical_crisis"
        )
        
        print(f"   ✓ Generated {len(explanations)} AI-powered action plans")
        
        # Display each plan
        for i, plan in enumerate(explanations, 1):
            print(f"\n   Plan {i}: {plan.get('title', 'Unnamed Plan')}")
            print(f"   - Tag: {plan.get('tag', 'N/A')}")
            print(f"   - Potential Saving: {plan.get('potentialSaving', 'N/A')}")
            
            # Show first 100 chars of rationale
            rationale = plan.get('rationale', 'No rationale provided')
            if len(rationale) > 100:
                print(f"   - Rationale: {rationale[:100]}...")
            else:
                print(f"   - Rationale: {rationale}")
            
            # Show steps
            steps = plan.get('steps', [])
            if steps:
                print(f"   - Steps ({len(steps)}):")
                for j, step in enumerate(steps[:2], 1):  # Show first 2 steps
                    print(f"     {j}. {step}")
                if len(steps) > 2:
                    print(f"     ... and {len(steps) - 2} more steps")
    
    except Exception as e:
        print(f"   ✗ Failed to generate AI explanations: {e}")
        import traceback
        traceback.print_exc()
        return
    
    # 6. Verify Content Quality
    print("\n6. Verifying Content Quality...")
    quality_checks = []
    
    for plan in explanations:
        checks = {
            "has_id": bool(plan.get('id')),
            "has_title": bool(plan.get('title')),
            "has_rationale": len(plan.get('rationale', '')) > 50,
            "has_steps": len(plan.get('steps', [])) >= 3,
            "has_tag": bool(plan.get('tag')),
            "has_savings": plan.get('potentialSaving') is not None
        }
        quality_checks.append(all(checks.values()))
        
        if not all(checks.values()):
            print(f"   ⚠ Quality issues in {plan.get('title', 'Unknown')}:")
            for check, passed in checks.items():
                if not passed:
                    print(f"     - Missing or insufficient: {check}")
    
    if all(quality_checks):
        print("   ✓ All AI-generated content passes quality checks")
    else:
        print(f"   ⚠ {sum(quality_checks)}/{len(quality_checks)} plans pass quality checks")
    
    # 7. Test Cache Performance
    print("\n7. Testing Cache Performance...")
    cache_stats = api_cache.get_stats()
    print(f"   - Cache Hits: {cache_stats.get('cache_hits', 0)}")
    print(f"   - Cache Misses: {cache_stats.get('cache_misses', 0)}")
    print(f"   - Hit Rate: {cache_stats.get('hit_rate', '0%')}")
    print(f"   - API Calls: {cache_stats.get('api_calls', 0)}")
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    if all(quality_checks):
        print("✅ SUCCESS: AI integration is working correctly!")
        print("   - API connection established")
        print("   - Simulation runs successfully")
        print("   - AI generates personalized content")
        print("   - Content quality meets standards")
    else:
        print("⚠️  PARTIAL SUCCESS: AI integration needs attention")
        print("   Check the warnings above for details")
    
    print("\nThe frontend should now display:")
    print("- Real AI-generated financial advice")
    print("- Personalized rationales based on user profile")
    print("- Specific action steps with numbers")
    print("- Different strategies (Conservative, Balanced, Aggressive)")
    
    return explanations


if __name__ == "__main__":
    # Run the test
    result = asyncio.run(test_ai_integration())
    
    if result:
        print("\n" + "="*60)
        print("Sample JSON Output (for debugging):")
        print("="*60)
        print(json.dumps(result[0], indent=2, default=str)[:500] + "...")