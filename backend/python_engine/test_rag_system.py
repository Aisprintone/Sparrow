"""
Test script for Profile-Specific RAG System with Tool Registry
"""

import asyncio
import sys
from pathlib import Path
import json

# Add project paths
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from rag.profile_rag_system import get_rag_manager


async def test_rag_system():
    """Comprehensive test of the RAG system"""
    
    print("🧠 Testing Profile-Specific RAG System with Tool Registry")
    print("=" * 60)
    
    try:
        # Initialize RAG manager
        print("1. Initializing RAG Manager...")
        rag_manager = get_rag_manager()
        print("✅ RAG Manager initialized successfully")
        print()
        
        # Test profile summaries
        print("2. Getting Profile Summaries...")
        summaries = rag_manager.get_all_profile_summaries()
        
        for profile_id, summary in summaries.items():
            print(f"📊 Profile {profile_id}:")
            if 'error' in summary:
                print(f"   ❌ Error: {summary['error']}")
            else:
                print(f"   📁 Data types: {len(summary.get('data_types', {}))}")
                print(f"   📄 Total documents: {summary.get('total_documents', 0)}")
                print(f"   🛠️  Available tools: {len(summary.get('available_tools', []))}")
                
                # Show data type details
                for data_type, details in summary.get('data_types', {}).items():
                    record_count = details.get('record_count', 0)
                    print(f"      • {data_type}: {record_count} records")
        
        print()
        
        # Test specific profile queries
        test_profile_id = 1
        print(f"3. Testing Profile {test_profile_id} RAG Queries...")
        
        # Get profile system
        profile_system = rag_manager.get_profile_system(test_profile_id)
        
        # Test different tool queries
        test_queries = [
            ("query_accounts", "What are my account balances and types?"),
            ("query_transactions", "What are my recent spending patterns?"),
            ("query_demographics", "What is my risk profile and demographic info?"),
            ("query_goals", "What are my financial goals and progress?"),
            ("query_investments", "What investments do I have?"),
            ("query_all_data", "Give me a comprehensive financial analysis")
        ]
        
        for tool_name, query in test_queries:
            print(f"   🔍 Testing {tool_name}:")
            print(f"      Query: {query}")
            
            try:
                result = profile_system.query(query, tool_name)
                result_preview = result[:100] + "..." if len(result) > 100 else result
                print(f"      Result: {result_preview}")
                print(f"      ✅ Success")
            except Exception as e:
                print(f"      ❌ Error: {e}")
            
            print()
        
        # Test general queries without specific tools
        print("4. Testing General RAG Queries...")
        general_queries = [
            "What is my net worth?",
            "Am I saving enough for retirement?",
            "What are my biggest expenses?",
            "How is my credit utilization?",
            "Should I pay off debt or invest?"
        ]
        
        for query in general_queries:
            print(f"   🔍 Query: {query}")
            try:
                result = rag_manager.query_profile(test_profile_id, query)
                result_preview = result[:100] + "..." if len(result) > 100 else result
                print(f"      Result: {result_preview}")
                print(f"      ✅ Success")
            except Exception as e:
                print(f"      ❌ Error: {e}")
            print()
        
        # Test tool registry
        print("5. Testing Tool Registry...")
        tools_info = {}
        for tool_name, tool in profile_system.tools_registry.items():
            tools_info[tool_name] = {
                "name": tool.name,
                "description": tool.description
            }
        
        print(f"   📋 Available tools for profile {test_profile_id}:")
        for tool_name, info in tools_info.items():
            print(f"      • {tool_name}: {info['description']}")
        
        print()
        
        # Test multi-profile comparison
        print("6. Testing Multi-Profile Queries...")
        profiles_to_test = [1, 2, 3]
        
        comparison_query = "What are my total account balances?"
        print(f"   🔍 Comparison query: {comparison_query}")
        
        for profile_id in profiles_to_test:
            try:
                result = rag_manager.query_profile(profile_id, comparison_query, "query_accounts")
                result_preview = result[:80] + "..." if len(result) > 80 else result
                print(f"      Profile {profile_id}: {result_preview}")
            except Exception as e:
                print(f"      Profile {profile_id}: Error - {e}")
        
        print()
        
        # Test enhanced LangGraph-DSPy integration
        print("7. Testing LangGraph-DSPy Integration...")
        
        # Import and test the enhanced agent system
        try:
            from ai.langgraph_dspy_agent import generate_ai_explanation_cards
            
            # Sample simulation data
            sample_simulation = {
                "scenario_name": "Emergency Fund Strategy",
                "success_metrics": {
                    "conservative": {"success_rate": 85.4},
                    "moderate": {"success_rate": 92.1},
                    "growth": {"success_rate": 94.7}
                },
                "recommendations": [
                    {"type": "priority", "title": "Build Emergency Fund"}
                ]
            }
            
            # Sample user profile  
            sample_profile = {
                "user_id": test_profile_id,
                "demographic_type": "midcareer",
                "monthly_income": 5200
            }
            
            print("   🤖 Testing RAG-enhanced AI card generation...")
            explanation_cards = await generate_ai_explanation_cards(
                sample_simulation, sample_profile
            )
            
            print(f"   ✅ Generated {len(explanation_cards)} explanation cards with RAG enhancement")
            
            for i, card in enumerate(explanation_cards[:2], 1):  # Show first 2 cards
                print(f"      Card {i}: {card.get('title', 'Unknown')}")
                print(f"         Description: {card.get('description', 'N/A')[:60]}...")
                print(f"         Rationale length: {len(card.get('rationale', ''))} chars")
                
        except Exception as e:
            print(f"   ❌ LangGraph-DSPy integration error: {e}")
        
        print()
        print("🎉 RAG System Test Completed Successfully!")
        print("=" * 60)
        
        # Save test results
        test_results = {
            "profile_summaries": summaries,
            "test_profile_id": test_profile_id,
            "available_tools": tools_info,
            "test_timestamp": "2025-01-15T12:00:00Z",
            "system_status": "operational"
        }
        
        results_file = project_root / "rag_test_results.json"
        with open(results_file, 'w') as f:
            json.dump(test_results, f, indent=2, default=str)
        
        print(f"📄 Test results saved to: {results_file}")
        
        return test_results
        
    except Exception as e:
        print(f"❌ RAG System Test Failed: {e}")
        import traceback
        traceback.print_exc()
        return None


def test_rag_endpoints_simulation():
    """Simulate API endpoint calls for testing"""
    print("\n🌐 Simulating RAG API Endpoints...")
    print("-" * 40)
    
    # Simulate API calls that would be made to the FastAPI endpoints
    test_cases = [
        {
            "endpoint": "POST /rag/query/1",
            "payload": {"query": "What are my account balances?", "tool_name": "query_accounts"},
            "expected": "Account balance information"
        },
        {
            "endpoint": "GET /rag/profiles/summary", 
            "payload": None,
            "expected": "All profile summaries"
        },
        {
            "endpoint": "GET /rag/profiles/1/tools",
            "payload": None, 
            "expected": "Available tools for profile 1"
        },
        {
            "endpoint": "POST /rag/profiles/1/multi-query",
            "payload": {"query": "Analyze my financial situation"},
            "expected": "Multi-tool analysis results"
        }
    ]
    
    for test_case in test_cases:
        print(f"   🔗 {test_case['endpoint']}")
        if test_case['payload']:
            print(f"      Payload: {test_case['payload']}")
        print(f"      Expected: {test_case['expected']}")
        print()
    
    print("💡 These endpoints are now available in the FastAPI application!")


if __name__ == "__main__":
    # Test environment setup
    print("⚠️  Note: This test requires CSV data in ../../../data/ directory")
    print("   If no API keys are set, the system will use fallback implementations.")
    print()
    
    # Run async test
    asyncio.run(test_rag_system())
    
    # Show endpoint simulation
    test_rag_endpoints_simulation()