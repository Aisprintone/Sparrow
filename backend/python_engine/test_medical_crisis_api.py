#!/usr/bin/env python3
"""
Test script to verify the medical crisis scenario API integration.
"""

import requests
import json
import sys

def test_medical_crisis_api():
    """Test the medical crisis scenario through the API."""
    
    # API endpoint
    base_url = "http://localhost:8000"
    
    # Test health check first
    print("Testing health check...")
    try:
        health_response = requests.get(f"{base_url}/health", timeout=5)
        if health_response.status_code == 200:
            print("✅ Health check passed")
        else:
            print(f"❌ Health check failed: {health_response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Cannot connect to server: {e}")
        print("Make sure the server is running: python -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000")
        return False
    
    # Test medical crisis scenario
    print("\nTesting medical crisis scenario...")
    
    payload = {
        "profile_id": "1",
        "use_current_profile": False,
        "scenario_type": "medical_crisis",
        "parameters": {
            "insurance_coverage": "standard",
            "emergency_fund_months": 6,
            "health_status": "good"
        }
    }
    
    try:
        response = requests.post(
            f"{base_url}/simulation/medical_crisis",
            json=payload,
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            
            # Verify response structure
            if result.get("success"):
                print("✅ API request successful")
                
                data = result.get("data", {})
                
                # Check for simulation result
                if "simulation_result" in data:
                    sim_result = data["simulation_result"]
                    print(f"✅ Simulation result received")
                    print(f"   - Scenario type: {sim_result.get('scenario_type')}")
                    print(f"   - Resilience score: {sim_result.get('risk_assessment', {}).get('resilience_score', 'N/A')}")
                else:
                    print("❌ No simulation result in response")
                
                # Check for AI explanations
                if "ai_explanations" in data:
                    explanations = data["ai_explanations"]
                    print(f"✅ AI explanations received: {len(explanations)} cards")
                    
                    if explanations:
                        # Show first explanation card structure
                        first_card = explanations[0]
                        print(f"   - First card title: {first_card.get('title', 'N/A')}")
                        print(f"   - Category: {first_card.get('category', 'N/A')}")
                        print(f"   - Potential saving: ${first_card.get('potential_saving', 0):,.0f}")
                else:
                    print("❌ No AI explanations in response")
                
                return True
            else:
                print(f"❌ API returned success=false: {result.get('error', 'Unknown error')}")
                return False
        else:
            print(f"❌ HTTP {response.status_code}: {response.text[:500]}")
            return False
            
    except requests.exceptions.Timeout:
        print("❌ Request timed out after 30 seconds")
        print("The AI explanation generation might be taking too long")
        return False
    except Exception as e:
        print(f"❌ Request failed: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("Medical Crisis Scenario API Test")
    print("=" * 60)
    
    success = test_medical_crisis_api()
    
    print("\n" + "=" * 60)
    if success:
        print("✅ All tests passed! Medical crisis scenario is working.")
    else:
        print("❌ Tests failed. Please check the errors above.")
    print("=" * 60)
    
    sys.exit(0 if success else 1)