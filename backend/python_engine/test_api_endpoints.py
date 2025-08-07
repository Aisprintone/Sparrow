#!/usr/bin/env python3
"""
Test RAG API endpoints integration
"""

import sys
import os

# Add project root to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from api.main import app
from fastapi.testclient import TestClient

def test_rag_api_endpoints():
    """Test all RAG-related API endpoints"""
    client = TestClient(app)
    
    print("🔍 Testing RAG Query Endpoint...")
    try:
        response = client.post('/rag/query/1', json={'query': 'What are my account balances?'})
        print(f'Status: {response.status_code}')
        if response.status_code == 200:
            result = response.json()
            print(f'✅ Success: {result["data"]["result"][:100]}...')
        else:
            print(f'❌ Error: {response.text}')
    except Exception as e:
        print(f'❌ Exception: {e}')
    
    print('\n🔍 Testing Profile Summary Endpoint...')
    try:
        response = client.get('/rag/profiles/summary')
        print(f'Status: {response.status_code}')
        if response.status_code == 200:
            result = response.json()
            print(f'✅ Success: Found {len(result["data"])} profiles')
            for profile_id, summary in result['data'].items():
                if 'data_types' in summary:
                    print(f'  Profile {profile_id}: {summary["total_documents"]} documents, {len(summary["available_tools"])} tools')
        else:
            print(f'❌ Error: {response.text}')
    except Exception as e:
        print(f'❌ Exception: {e}')
    
    print('\n🔍 Testing Profile Tools Endpoint...')
    try:
        response = client.get('/rag/profiles/1/tools')
        print(f'Status: {response.status_code}')
        if response.status_code == 200:
            result = response.json()
            tools = result["data"]["tools"]
            print(f'✅ Success: Found {len(tools)} tools for profile 1')
            for tool in tools[:3]:  # Show first 3 tools
                print(f'  • {tool["name"]}: {tool["description"][:60]}...')
        else:
            print(f'❌ Error: {response.text}')
    except Exception as e:
        print(f'❌ Exception: {e}')
    
    print('\n🔍 Testing Enhanced Emergency Fund Simulation...')
    try:
        response = client.post('/simulation/emergency-fund', json={
            'profile_data': {'monthly_income': 5000, 'monthly_expenses': 3000, 'profile_id': 1},
            'config': {'months': 12}
        })
        print(f'Status: {response.status_code}')
        if response.status_code == 200:
            result = response.json()
            print('✅ Success: Enhanced simulation completed')
            # Check if AI explanation cards are included
            if 'ai_explanation_cards' in result['data']:
                cards = result['data']['ai_explanation_cards']
                print(f'  📊 Generated {len(cards)} AI explanation cards with RAG insights')
            else:
                print('  📋 Simulation completed (no AI cards generated)')
        else:
            print(f'❌ Error: {response.text}')
    except Exception as e:
        print(f'❌ Exception: {e}')
    
    print('\n🎉 RAG API Endpoint Tests Completed!')

if __name__ == "__main__":
    test_rag_api_endpoints()