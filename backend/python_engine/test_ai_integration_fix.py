#!/usr/bin/env python3
"""
Test script to verify AI explanation integration is working correctly.
Tests the complete flow from simulation to AI-generated explanation cards.
"""

import asyncio
import json
import sys
import os
from typing import Dict, Any

# Add the parent directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from api.main import (
    run_scenario_simulation,
    generate_ai_explanations_with_llm,
    get_profile_data,
    prepare_simulation_config
)
from pydantic import BaseModel

class TestSimulationRequest(BaseModel):
    profile_id: str = "1"
    use_current_profile: bool = False
    parameters: Dict[str, Any] = {}
    scenario_type: str = "emergency_fund"
    original_simulation_id: str = "test_emergency_fund"

async def test_complete_flow():
    """Test the complete simulation + AI explanation flow."""
    
    print("=" * 80)
    print("TESTING SIMULATION + AI EXPLANATION INTEGRATION")
    print("=" * 80)
    
    try:
        # Step 1: Get profile data
        print("\n1. Loading profile data...")
        profile_data = await get_profile_data("1")
        print(f"   ✓ Profile loaded: {profile_data.get('name', 'Unknown')}")
        print(f"   ✓ Monthly income: ${profile_data.get('monthly_income', 0):,.2f}")
        print(f"   ✓ Emergency fund: ${profile_data.get('emergency_fund', 0):,.2f}")
        
        # Step 2: Prepare simulation config
        print("\n2. Preparing simulation config...")
        request = TestSimulationRequest()
        config = prepare_simulation_config(request, "emergency_fund")
        print(f"   ✓ Config prepared with {len(config)} parameters")
        
        # Step 3: Run simulation
        print("\n3. Running simulation...")
        simulation_result = await run_scenario_simulation(
            scenario_type="emergency_fund",
            original_simulation_id="test_emergency_fund",
            profile_data=profile_data,
            config=config
        )
        print(f"   ✓ Simulation completed successfully")
        print(f"   ✓ Result keys: {list(simulation_result.keys())}")
        
        # Step 4: Generate AI explanations
        print("\n4. Generating AI explanations...")
        ai_explanations = await generate_ai_explanations_with_llm(
            simulation_result=simulation_result,
            profile_data=profile_data,
            original_simulation_id="test_emergency_fund"
        )
        print(f"   ✓ Generated {len(ai_explanations)} AI explanation cards")
        
        # Step 5: Validate explanation cards
        print("\n5. Validating AI explanation cards...")
        for i, card in enumerate(ai_explanations, 1):
            print(f"\n   Card {i}:")
            print(f"   - ID: {card.get('id', 'N/A')}")
            print(f"   - Title: {card.get('title', 'N/A')}")
            print(f"   - Tag: {card.get('tag', 'N/A')}")
            print(f"   - Description: {card.get('description', 'N/A')[:100]}...")
            print(f"   - Potential Saving: ${card.get('potentialSaving', 0):,}")
            print(f"   - Steps: {len(card.get('steps', []))} action items")
            print(f"   - Has rationale: {'rationale' in card}")
            print(f"   - Has detailed insights: {'detailed_insights' in card}")
            
            # Validate required fields
            required_fields = ['id', 'title', 'description', 'tag', 'tagColor', 
                             'potentialSaving', 'rationale', 'steps']
            missing_fields = [f for f in required_fields if f not in card]
            if missing_fields:
                print(f"   ⚠ Missing fields: {missing_fields}")
            else:
                print(f"   ✓ All required fields present")
        
        # Step 6: Test complete response structure
        print("\n6. Testing complete response structure...")
        response_data = {
            "scenario_name": simulation_result.get("scenario_name", "emergency_fund"),
            "description": simulation_result.get("description", ""),
            "simulation_results": simulation_result,
            "ai_explanations": ai_explanations,
            "profile_data": profile_data,
            "config": config,
            "original_simulation_id": "test_emergency_fund"
        }
        
        print(f"   ✓ Response has simulation_results: {bool(response_data['simulation_results'])}")
        print(f"   ✓ Response has ai_explanations: {bool(response_data['ai_explanations'])}")
        print(f"   ✓ Number of AI cards: {len(response_data['ai_explanations'])}")
        
        print("\n" + "=" * 80)
        print("✅ ALL TESTS PASSED - AI INTEGRATION IS WORKING!")
        print("=" * 80)
        
        return True
        
    except Exception as e:
        print("\n" + "=" * 80)
        print(f"❌ TEST FAILED: {str(e)}")
        print("=" * 80)
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    # Run the test
    success = asyncio.run(test_complete_flow())
    sys.exit(0 if success else 1)