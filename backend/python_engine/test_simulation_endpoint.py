#!/usr/bin/env python3
"""
Test the simulation endpoint to ensure AI explanations are included in the response.
"""

import asyncio
import aiohttp
import json
import sys

async def test_simulation_endpoint():
    """Test the simulation API endpoint."""
    
    print("=" * 80)
    print("TESTING SIMULATION ENDPOINT WITH AI EXPLANATIONS")
    print("=" * 80)
    
    # API endpoint
    base_url = "http://localhost:8000"
    endpoint = f"{base_url}/simulation/emergency_fund"
    
    # Request payload
    payload = {
        "profile_id": "1",
        "use_current_profile": False,
        "parameters": {
            "target_months": 6,
            "monthly_contribution": 500,
            "risk_tolerance": "moderate"
        },
        "scenario_type": "emergency_fund",
        "original_simulation_id": "emergency_fund_test"
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            print(f"\n1. Sending POST request to {endpoint}")
            print(f"   Payload: {json.dumps(payload, indent=2)}")
            
            async with session.post(endpoint, json=payload) as response:
                print(f"\n2. Response Status: {response.status}")
                
                # Get response data
                response_data = await response.json()
                
                print(f"\n3. Response Structure:")
                print(f"   - Success: {response_data.get('success', False)}")
                print(f"   - Message: {response_data.get('message', 'N/A')}")
                
                if response_data.get('success'):
                    data = response_data.get('data', {})
                    print(f"\n4. Data Fields Present:")
                    print(f"   - scenario_name: {bool(data.get('scenario_name'))}")
                    print(f"   - description: {bool(data.get('description'))}")
                    print(f"   - simulation_results: {bool(data.get('simulation_results'))}")
                    print(f"   - ai_explanations: {bool(data.get('ai_explanations'))}")
                    print(f"   - profile_data: {bool(data.get('profile_data'))}")
                    print(f"   - config: {bool(data.get('config'))}")
                    
                    # Check AI explanations
                    ai_explanations = data.get('ai_explanations', [])
                    print(f"\n5. AI Explanations:")
                    print(f"   - Number of cards: {len(ai_explanations)}")
                    
                    if ai_explanations:
                        for i, card in enumerate(ai_explanations[:3], 1):
                            print(f"\n   Card {i}:")
                            print(f"   - ID: {card.get('id', 'N/A')}")
                            print(f"   - Title: {card.get('title', 'N/A')}")
                            print(f"   - Tag: {card.get('tag', 'N/A')}")
                            print(f"   - Has rationale: {'rationale' in card}")
                            print(f"   - Has steps: {'steps' in card}")
                            print(f"   - Has detailed_insights: {'detailed_insights' in card}")
                    
                    # Validate critical fields
                    print(f"\n6. Validation:")
                    if ai_explanations and len(ai_explanations) >= 3:
                        print("   ✅ AI explanations field is present and contains cards")
                        print("   ✅ Response structure is complete")
                        print("\n" + "=" * 80)
                        print("✅ ENDPOINT TEST PASSED - AI EXPLANATIONS ARE INCLUDED!")
                        print("=" * 80)
                        return True
                    else:
                        print("   ⚠️ AI explanations missing or incomplete")
                        print(f"   Debug: ai_explanations = {ai_explanations}")
                        return False
                else:
                    print(f"\n❌ Simulation failed: {response_data.get('message', 'Unknown error')}")
                    return False
                    
    except aiohttp.ClientError as e:
        print(f"\n❌ Connection error: {e}")
        print("   Make sure the API server is running on port 8000")
        print("   Start it with: uvicorn api.main:app --reload --port 8000")
        return False
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    # Run the test
    success = asyncio.run(test_simulation_endpoint())
    sys.exit(0 if success else 1)