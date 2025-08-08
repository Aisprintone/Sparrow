"""
Test script for LangGraph-DSPy AI explanation system
"""

import asyncio
import json
import os
import sys
from pathlib import Path

# Add the project root to the Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from ai.langgraph_dspy_agent import generate_ai_explanation_cards


async def test_ai_system():
    """Test the AI explanation card generation system"""
    
    # Sample simulation data (similar to what emergency fund simulation produces)
    sample_simulation_data = {
        "scenario_name": "Emergency Fund Strategy",
        "description": "Simulate emergency fund growth with real market data",
        "market_data": {
            "bond_yield": 0.0035,
            "money_market_rate": 0.00375,
            "stock_return": 0.008,
            "last_updated": "2025-01-15T10:30:00Z"
        },
        "success_metrics": {
            "conservative": {
                "success_rate": 85.4,
                "avg_time_to_target": 48.2,
                "avg_final_amount": 18500.0
            },
            "moderate": {
                "success_rate": 92.1,
                "avg_time_to_target": 44.8,
                "avg_final_amount": 19800.0
            },
            "growth": {
                "success_rate": 94.7,
                "avg_time_to_target": 42.1,
                "avg_final_amount": 21200.0
            }
        },
        "recommendations": [
            {
                "type": "priority",
                "title": "Build Emergency Fund",
                "description": "You need $12,000 more to reach your 6-month emergency fund target.",
                "action": "Increase monthly savings",
                "impact": "high"
            },
            {
                "type": "strategy",
                "title": "Consider High-Yield Savings",
                "description": "Current money market rates are attractive for emergency funds.",
                "action": "Open high-yield savings account",
                "impact": "medium"
            }
        ],
        "target_emergency_fund": 18000,
        "current_emergency_fund": 6000,
        "monthly_contribution": 500
    }
    
    # Sample user profile
    sample_user_profile = {
        "user_id": 2,
        "demographic_type": "midcareer",
        "age": 32,
        "monthly_income": 5200,
        "monthly_expenses": 3400,
        "net_worth": 45000,
        "credit_score": 720,
        "risk_tolerance": "moderate"
    }
    
    print("🚀 Testing LangGraph-DSPy AI System...")
    print(f"Simulation: {sample_simulation_data['scenario_name']}")
    print(f"User Profile: {sample_user_profile['demographic_type']}")
    print()
    
    try:
        # Generate explanation cards
        explanation_cards = await generate_ai_explanation_cards(
            sample_simulation_data, 
            sample_user_profile
        )
        
        print(f"✅ Generated {len(explanation_cards)} explanation cards:")
        print()
        
        for i, card in enumerate(explanation_cards, 1):
            print(f"📋 Card {i}: {card['title']}")
            print(f"   ID: {card['id']}")
            print(f"   Tag: {card['tag']} ({card['tagColor']})")
            print(f"   Description: {card['description']}")
            print(f"   Potential Saving: {card['potentialSaving']}")
            print(f"   Rationale Length: {len(card['rationale'])} chars")
            print(f"   Steps: {len(card['steps'])} action items")
            print()
        
        # Validate card structure
        required_fields = ["id", "title", "description", "tag", "tagColor", "potentialSaving", "rationale", "steps"]
        
        for i, card in enumerate(explanation_cards, 1):
            missing_fields = [field for field in required_fields if field not in card]
            if missing_fields:
                print(f"❌ Card {i} missing fields: {missing_fields}")
            else:
                print(f"✅ Card {i} structure valid")
        
        print()
        print("🎯 AI System Test Completed Successfully!")
        
        # Save results for inspection
        output_file = project_root / "test_results.json"
        with open(output_file, 'w') as f:
            json.dump({
                "simulation_data": sample_simulation_data,
                "user_profile": sample_user_profile,
                "generated_cards": explanation_cards,
                "test_timestamp": "2025-01-15T10:30:00Z"
            }, f, indent=2)
        
        print(f"📄 Results saved to: {output_file}")
        
        return explanation_cards
        
    except Exception as e:
        print(f"❌ AI System Test Failed: {e}")
        import traceback
        traceback.print_exc()
        return None


if __name__ == "__main__":
    # Set environment variables for testing (if not already set)
    if not os.getenv("OPENAI_API_KEY") and not os.getenv("ANTHROPIC_API_KEY"):
        print("⚠️  Warning: No API keys found in environment.")
        print("   Set OPENAI_API_KEY or ANTHROPIC_API_KEY to test with real AI models.")
        print("   The system will fall back to mock cards.")
        print()
    
    # Run the test
    asyncio.run(test_ai_system())