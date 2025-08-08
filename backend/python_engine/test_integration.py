#!/usr/bin/env python3
"""
Integration test script to verify optimized backend integration
Tests batching, caching, and API endpoints
"""

import asyncio
import httpx
import json
import time
from typing import Dict, Any, List

# Test configuration
BASE_URL = "http://localhost:8000"
TEST_PROFILE_ID = 1

async def test_health_endpoints(client: httpx.AsyncClient):
    """Test health and database endpoints"""
    print("\n=== Testing Health Endpoints ===")
    
    # Test main health endpoint
    response = await client.get(f"{BASE_URL}/health")
    print(f"Health check: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"  Status: {data.get('status')}")
        print(f"  Database: {data.get('database', {}).get('status', 'N/A')}")
        print(f"  Market data: {data.get('market_data', 'N/A')}")
    
    # Test database health
    response = await client.get(f"{BASE_URL}/db/health")
    print(f"Database health: {response.status_code}")
    
    return response.status_code == 200


async def test_cache_warming(client: httpx.AsyncClient):
    """Test cache warming functionality"""
    print("\n=== Testing Cache Warming ===")
    
    # Warm the cache
    response = await client.post(
        f"{BASE_URL}/api/optimization/warm-cache",
        json={"warm_rag": True, "profile_ids": [1, 2, 3]}
    )
    
    print(f"Cache warming: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"  Success: {data.get('success')}")
        print(f"  Message: {data.get('message')}")
    
    return response.status_code == 200


async def test_optimization_metrics(client: httpx.AsyncClient):
    """Test optimization metrics endpoint"""
    print("\n=== Testing Optimization Metrics ===")
    
    response = await client.get(f"{BASE_URL}/api/optimization/metrics")
    print(f"Optimization metrics: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        
        # Check API cache stats
        api_cache_stats = data.get("metrics", {}).get("api_cache", {})
        if api_cache_stats:
            print("  API Cache:")
            print(f"    Cache hits: {api_cache_stats.get('cache_hits', 0)}")
            print(f"    Cache misses: {api_cache_stats.get('cache_misses', 0)}")
            print(f"    Hit rate: {api_cache_stats.get('hit_rate', 'N/A')}")
            print(f"    API calls: {api_cache_stats.get('api_calls', 0)}")
        
        # Check RAG batching stats
        rag_stats = data.get("metrics", {}).get("rag_batching")
        if rag_stats:
            print("  RAG Batching:")
            batch_metrics = rag_stats.get("batch_metrics", {})
            if batch_metrics:
                print(f"    Total batches: {batch_metrics.get('total_batches', 0)}")
                print(f"    Avg batch size: {batch_metrics.get('avg_batch_size', 0):.1f}")
                print(f"    Avg duration: {batch_metrics.get('avg_duration_ms', 0):.2f}ms")
    
    return response.status_code == 200


async def test_batched_rag_queries(client: httpx.AsyncClient):
    """Test batched RAG multi-query endpoint"""
    print("\n=== Testing Batched RAG Queries ===")
    
    # Prepare multiple queries
    queries = [
        {"query": "What are my account balances?", "tool_name": "query_accounts"},
        {"query": "Show my recent transactions", "tool_name": "query_transactions"},
        {"query": "What are my financial goals?", "tool_name": "query_goals"},
        {"query": "What is my investment portfolio?", "tool_name": "query_investments"}
    ]
    
    # Execute batched queries
    start_time = time.time()
    response = await client.post(
        f"{BASE_URL}/rag/profiles/{TEST_PROFILE_ID}/multi-query",
        json={"queries": queries}
    )
    elapsed_time = (time.time() - start_time) * 1000
    
    print(f"Batched RAG queries: {response.status_code}")
    print(f"  Client-side time: {elapsed_time:.2f}ms")
    
    if response.status_code == 200:
        data = response.json()
        if "execution_time_ms" in data:
            print(f"  Server-side time: {data['execution_time_ms']:.2f}ms")
            print(f"  Success rate: {data.get('success_rate', 0) * 100:.1f}%")
            print(f"  Results received: {len(data.get('results', {}))}")
        else:
            print(f"  Results received: {len(data.get('results', {}))}")
    
    return response.status_code == 200


async def test_simulation_with_caching(client: httpx.AsyncClient):
    """Test simulation endpoint with caching"""
    print("\n=== Testing Simulation with Caching ===")
    
    simulation_request = {
        "profile_id": str(TEST_PROFILE_ID),
        "use_current_profile": False,
        "scenario_type": "emergency_fund",
        "parameters": {
            "target_months": 6,
            "monthly_contribution": 500
        }
    }
    
    # First simulation (cache miss)
    print("\nFirst simulation (expect cache miss):")
    start_time = time.time()
    response = await client.post(
        f"{BASE_URL}/simulation/emergency_fund",
        json=simulation_request
    )
    first_time = (time.time() - start_time) * 1000
    print(f"  Status: {response.status_code}")
    print(f"  Time: {first_time:.2f}ms")
    
    # Second simulation (cache hit)
    print("\nSecond simulation (expect cache hit):")
    start_time = time.time()
    response = await client.post(
        f"{BASE_URL}/simulation/emergency_fund",
        json=simulation_request
    )
    second_time = (time.time() - start_time) * 1000
    print(f"  Status: {response.status_code}")
    print(f"  Time: {second_time:.2f}ms")
    
    if second_time < first_time * 0.5:
        print(f"  Cache optimization: {(1 - second_time/first_time) * 100:.1f}% faster")
    
    return response.status_code == 200


async def test_profile_endpoints(client: httpx.AsyncClient):
    """Test profile-related endpoints"""
    print("\n=== Testing Profile Endpoints ===")
    
    # Get all profiles
    response = await client.get(f"{BASE_URL}/profiles")
    print(f"Get all profiles: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        profiles = data.get("profiles", [])
        print(f"  Found {len(profiles)} profiles")
    
    # Get specific profile
    response = await client.get(f"{BASE_URL}/profiles/{TEST_PROFILE_ID}")
    print(f"Get profile {TEST_PROFILE_ID}: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        profile = data.get("profile", {})
        print(f"  Customer ID: {profile.get('customer_id')}")
        print(f"  Name: {profile.get('name')}")
    
    return response.status_code == 200


async def main():
    """Run all integration tests"""
    print("=" * 60)
    print("INTEGRATION TEST SUITE - Optimized Backend")
    print("=" * 60)
    
    # Create HTTP client with timeout
    async with httpx.AsyncClient(timeout=30.0) as client:
        
        # Track test results
        results = []
        
        # Run tests
        try:
            # Basic health checks
            results.append(("Health Endpoints", await test_health_endpoints(client)))
            
            # Cache warming
            results.append(("Cache Warming", await test_cache_warming(client)))
            
            # Profile endpoints
            results.append(("Profile Endpoints", await test_profile_endpoints(client)))
            
            # Batched RAG queries
            results.append(("Batched RAG Queries", await test_batched_rag_queries(client)))
            
            # Simulation with caching
            results.append(("Simulation with Caching", await test_simulation_with_caching(client)))
            
            # Check optimization metrics
            results.append(("Optimization Metrics", await test_optimization_metrics(client)))
            
        except httpx.ConnectError:
            print("\n ERROR: Cannot connect to API server")
            print("Please ensure the server is running on http://localhost:8000")
            return
        except Exception as e:
            print(f"\n ERROR: Unexpected error: {e}")
            return
        
        # Print summary
        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for _, result in results if result)
        total = len(results)
        
        for test_name, result in results:
            status = "PASS" if result else "FAIL"
            print(f"  {test_name:.<40} [{status}]")
        
        print("\n" + "-" * 60)
        print(f"Total: {passed}/{total} tests passed")
        
        if passed == total:
            print("STATUS: ALL TESTS PASSED")
        else:
            print("STATUS: SOME TESTS FAILED")


if __name__ == "__main__":
    asyncio.run(main())