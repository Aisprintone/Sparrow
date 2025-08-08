#!/usr/bin/env python3
"""
Integration test for AI explanation API endpoint.
Tests the complete flow from API request to card generation.
"""

import asyncio
import httpx
import json
import time
from typing import Dict, Any, List
from pprint import pprint


class ExplanationAPITester:
    """Test harness for explanation API endpoint."""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def test_explanation_endpoint(self) -> None:
        """Test the /api/simulation/explain endpoint."""
        print("\n" + "="*60)
        print("TESTING AI EXPLANATION ENDPOINT")
        print("="*60)
        
        # Test configurations
        test_cases = [
            {
                "profile_id": 1,
                "scenario": "emergency_fund",
                "description": "Gen-Z Emergency Fund"
            },
            {
                "profile_id": 2,
                "scenario": "student_loan_payoff",
                "description": "Millennial Student Loans"
            },
            {
                "profile_id": 3,
                "scenario": "emergency_fund",
                "description": "Mid-Career Emergency Fund"
            }
        ]
        
        for test in test_cases:
            print(f"\n📊 Testing: {test['description']}")
            print("-" * 40)
            
            # Prepare request
            request_data = {
                "profile_id": test["profile_id"],
                "scenario_type": test["scenario"],
                "iterations": 1000  # Fewer iterations for faster testing
            }
            
            try:
                # Time the request
                start_time = time.time()
                
                # Make API call
                response = await self.client.post(
                    f"{self.base_url}/api/simulation/explain",
                    json=request_data
                )
                
                elapsed = time.time() - start_time
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Validate response structure
                    assert data["success"] == True
                    assert "cards" in data
                    assert len(data["cards"]) == 3
                    
                    print(f"✅ Success! Generated 3 cards in {elapsed:.2f}s")
                    
                    # Display card summaries
                    for i, card in enumerate(data["cards"], 1):
                        self._validate_card_format(card)
                        print(f"\n  Card {i}: {card['title']}")
                        print(f"  - Tag: {card['tag']} ({card['tagColor']})")
                        print(f"  - Saving: {card['potentialSaving']}")
                        print(f"  - Rationale: {len(card['rationale'])} chars")
                        print(f"  - Steps: {len(card['steps'])} actions")
                    
                    # Check AI provider
                    ai_provider = data.get("simulation_metadata", {}).get("ai_provider", "unknown")
                    print(f"\n  🤖 AI Provider: {ai_provider}")
                    
                else:
                    print(f"❌ Failed with status {response.status_code}")
                    print(f"   Error: {response.text}")
                    
            except Exception as e:
                print(f"❌ Error: {str(e)}")
    
    async def test_combined_endpoint(self) -> None:
        """Test the /api/simulation/with-explanations endpoint."""
        print("\n" + "="*60)
        print("TESTING COMBINED SIMULATION + EXPLANATION ENDPOINT")
        print("="*60)
        
        request_data = {
            "profile_id": 2,
            "scenario_type": "emergency_fund",
            "iterations": 1000
        }
        
        print("\n📊 Running simulation with explanations...")
        print(f"   Profile: {request_data['profile_id']}")
        print(f"   Scenario: {request_data['scenario_type']}")
        
        try:
            start_time = time.time()
            
            response = await self.client.post(
                f"{self.base_url}/api/simulation/with-explanations",
                json=request_data
            )
            
            elapsed = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                print(f"\n✅ Success! Completed in {elapsed:.2f}s")
                
                # Check simulation results
                if "result" in data:
                    result = data["result"]
                    print(f"\n📈 Simulation Results:")
                    print(f"   - Percentile 50: {result.get('percentile_50', 0):.1f}")
                    print(f"   - Percentile 90: {result.get('percentile_90', 0):.1f}")
                    print(f"   - Success Rate: {result.get('probability_success', 0)*100:.1f}%")
                
                # Check explanations
                if "explanations" in data:
                    print(f"\n💡 Generated {len(data['explanations'])} explanation cards")
                    for card in data["explanations"]:
                        print(f"   - {card['title']}: {card['potentialSaving']}")
                
            else:
                print(f"❌ Failed with status {response.status_code}")
                print(f"   Error: {response.text}")
                
        except Exception as e:
            print(f"❌ Error: {str(e)}")
    
    async def test_performance_benchmark(self) -> None:
        """Benchmark API performance."""
        print("\n" + "="*60)
        print("PERFORMANCE BENCHMARK")
        print("="*60)
        
        request_data = {
            "profile_id": 1,
            "scenario_type": "emergency_fund",
            "iterations": 1000
        }
        
        print("\n⏱️  Running 5 sequential requests...")
        
        times = []
        for i in range(5):
            start = time.time()
            
            response = await self.client.post(
                f"{self.base_url}/api/simulation/explain",
                json=request_data
            )
            
            elapsed = time.time() - start
            times.append(elapsed)
            
            status = "✅" if response.status_code == 200 else "❌"
            print(f"   Request {i+1}: {elapsed:.2f}s {status}")
        
        # Calculate statistics
        avg_time = sum(times) / len(times)
        min_time = min(times)
        max_time = max(times)
        
        print(f"\n📊 Performance Summary:")
        print(f"   Average: {avg_time:.2f}s")
        print(f"   Min: {min_time:.2f}s")
        print(f"   Max: {max_time:.2f}s")
        
        if avg_time < 2.0:
            print(f"   ✅ Meets sub-2 second requirement!")
        else:
            print(f"   ⚠️  Exceeds 2 second target")
    
    def _validate_card_format(self, card: Dict[str, Any]) -> None:
        """Validate that card matches required format."""
        required_fields = {
            'id', 'title', 'description', 'tag',
            'tagColor', 'potentialSaving', 'rationale', 'steps'
        }
        
        missing = required_fields - set(card.keys())
        if missing:
            raise ValueError(f"Card missing fields: {missing}")
        
        # Type validations
        assert isinstance(card['id'], str)
        assert isinstance(card['title'], str)
        assert isinstance(card['description'], str)
        assert isinstance(card['tag'], str)
        assert isinstance(card['tagColor'], str)
        assert isinstance(card['potentialSaving'], (int, str))
        assert isinstance(card['rationale'], str)
        assert isinstance(card['steps'], list)
        assert len(card['steps']) == 4
    
    async def close(self):
        """Clean up client."""
        await self.client.aclose()


async def main():
    """Run all tests."""
    tester = ExplanationAPITester()
    
    try:
        # Check if server is running
        print("🔍 Checking API server status...")
        try:
            response = await tester.client.get(f"{tester.base_url}/health")
            if response.status_code == 200:
                print("✅ API server is running\n")
            else:
                print("⚠️  API server returned unexpected status\n")
        except:
            print("❌ API server is not running!")
            print("   Please start the server with: python run_server.py")
            return
        
        # Run tests
        await tester.test_explanation_endpoint()
        await tester.test_combined_endpoint()
        await tester.test_performance_benchmark()
        
        print("\n" + "="*60)
        print("✅ ALL TESTS COMPLETED")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ Test suite failed: {str(e)}")
    finally:
        await tester.close()


if __name__ == "__main__":
    asyncio.run(main())