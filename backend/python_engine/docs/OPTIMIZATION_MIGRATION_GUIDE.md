# Optimization Migration Guide
**Step-by-Step Instructions for Applying Patterns**

## Phase 1: Assessment (Day 1)

### 1.1 Identify Optimization Targets
```bash
# Find all API calls
grep -r "requests\|httpx\|aiohttp\|client.post" --include="*.py" . > api_calls.txt

# Find database queries
grep -r "SELECT\|INSERT\|UPDATE\|DELETE" --include="*.py" . > db_queries.txt

# Find sequential loops that could be parallel
grep -r "for.*await\|async for" --include="*.py" . > sequential_ops.txt
```

### 1.2 Measure Current Performance
```python
# Create baseline script: baseline_metrics.py
import asyncio
import time
from typing import Dict, List

async def measure_baseline():
    metrics = {}
    
    # Measure API calls
    start = time.time()
    for _ in range(100):
        await your_api_function()
    metrics['api_avg_ms'] = (time.time() - start) * 10  # per call
    
    # Measure database queries
    start = time.time()
    for _ in range(100):
        await your_db_query()
    metrics['db_avg_ms'] = (time.time() - start) * 10
    
    return metrics

# Run: python baseline_metrics.py
```

### 1.3 Calculate Potential Savings
```python
# Savings calculator
def calculate_savings(calls_per_day: int, avg_response_ms: float, cache_hit_rate: float = 0.7):
    time_saved_ms = calls_per_day * cache_hit_rate * avg_response_ms
    api_calls_saved = calls_per_day * cache_hit_rate
    cost_saved = api_calls_saved * 0.002  # Average $0.002 per API call
    
    print(f"Daily savings with {cache_hit_rate*100}% cache hit rate:")
    print(f"  Time: {time_saved_ms/1000/60:.1f} minutes")
    print(f"  API calls: {api_calls_saved:,}")
    print(f"  Cost: ${cost_saved:.2f}")
```

## Phase 2: Implementation (Days 2-3)

### 2.1 Set Up Cache Infrastructure
```python
# Step 1: Install dependencies
# requirements.txt
redis==4.5.1
asyncio-cache==0.3.0

# Step 2: Configure cache manager
# config.py
CACHE_CONFIG = {
    'REDIS_URL': os.getenv('REDIS_URL'),
    'DEFAULT_TTL': 300,
    'MAX_MEMORY_MB': 100,
    'EVICTION_POLICY': 'lru'
}

# Step 3: Initialize cache
# __init__.py
from core.cache_manager import cache_manager
cache_manager.initialize(CACHE_CONFIG)
```

### 2.2 Migrate API Calls
```python
# Migration pattern for each API call type

# STEP 1: Create wrapper function
async def migrate_api_call(original_function):
    """Wrapper to migrate existing API calls"""
    
    # Extract the API call logic
    endpoint = original_function.endpoint
    data = original_function.data
    
    # Replace with cached call
    return await api_cache.cached_api_call(
        operation=endpoint.split('/')[-1],
        prompt=data.get('prompt', str(data))
    )

# STEP 2: Update imports
# Before
from external_api import make_request

# After
from core.api_cache import api_cache

# STEP 3: Update function calls
# Before
async def get_analysis(text):
    response = await make_request(
        url="https://api.example.com/analyze",
        data={"text": text}
    )
    return response['result']

# After
async def get_analysis(text):
    return await api_cache.cached_api_call(
        operation="analyze",
        prompt=text
    )
```

### 2.3 Implement Batching
```python
# Convert sequential to parallel processing

# BEFORE: Sequential (slow)
async def process_users(user_ids: List[int]):
    results = []
    for user_id in user_ids:
        result = await process_single_user(user_id)
        results.append(result)
    return results

# AFTER: Batched (fast)
async def process_users(user_ids: List[int]):
    # Create batches of optimal size
    batch_size = 10
    batches = [user_ids[i:i+batch_size] 
               for i in range(0, len(user_ids), batch_size)]
    
    results = []
    for batch in batches:
        # Process batch in parallel
        batch_tasks = [process_single_user(uid) for uid in batch]
        batch_results = await asyncio.gather(*batch_tasks)
        results.extend(batch_results)
    
    return results
```

### 2.4 Add Cache Decorators
```python
# Systematic approach to adding cache decorators

# 1. Identify cacheable functions
CACHEABLE_PATTERNS = [
    'get_*',      # Getters
    'fetch_*',    # Fetchers
    'calculate_*', # Calculations
    'analyze_*',   # Analysis
    'generate_*'   # Generations
]

# 2. Add decorators with appropriate TTLs
@cached(prefix="user_profile", ttl=300)  # 5 min for user data
async def get_user_profile(user_id: int):
    pass

@cached(prefix="market_data", ttl=30)  # 30 sec for real-time
async def get_market_data(symbol: str):
    pass

@cached(prefix="report", ttl=3600)  # 1 hour for reports
async def generate_report(params: dict):
    pass

# 3. Test cache effectiveness
async def test_cache():
    # First call - should hit API
    start = time.time()
    result1 = await get_user_profile(123)
    api_time = time.time() - start
    
    # Second call - should hit cache
    start = time.time()
    result2 = await get_user_profile(123)
    cache_time = time.time() - start
    
    assert result1 == result2
    assert cache_time < api_time / 10  # Should be 10x+ faster
```

## Phase 3: Testing (Day 4)

### 3.1 Unit Tests
```python
# test_cache_optimization.py
import pytest
from unittest.mock import patch, AsyncMock

@pytest.mark.asyncio
async def test_cache_hit_prevents_api_call():
    with patch('core.api_cache.make_actual_call') as mock_api:
        # First call
        result1 = await api_cache.cached_api_call(
            operation="test",
            prompt="test query"
        )
        assert mock_api.call_count == 1
        
        # Second call (should hit cache)
        result2 = await api_cache.cached_api_call(
            operation="test",
            prompt="test query"
        )
        assert mock_api.call_count == 1  # No additional call
        assert result1 == result2

@pytest.mark.asyncio
async def test_batch_processing():
    items = list(range(100))
    
    # Process batch
    start = time.time()
    results = await process_batch(items)
    batch_time = time.time() - start
    
    # Should complete in reasonable time
    assert batch_time < 5.0  # seconds
    assert len(results) == 100
```

### 3.2 Load Tests
```python
# load_test.py
import asyncio
from concurrent.futures import ThreadPoolExecutor

async def load_test(concurrent_users=50, requests_per_user=10):
    async def user_session():
        for _ in range(requests_per_user):
            await your_optimized_function()
    
    # Simulate concurrent users
    tasks = [user_session() for _ in range(concurrent_users)]
    start = time.time()
    await asyncio.gather(*tasks)
    total_time = time.time() - start
    
    total_requests = concurrent_users * requests_per_user
    rps = total_requests / total_time
    
    print(f"Load test results:")
    print(f"  Total requests: {total_requests}")
    print(f"  Total time: {total_time:.2f}s")
    print(f"  Requests/second: {rps:.2f}")
    
    # Assert performance targets
    assert rps > 100  # Should handle 100+ req/s
```

### 3.3 Performance Validation
```python
# validate_performance.py
async def validate_optimization():
    results = {
        'cache_hit_rate': 0,
        'api_reduction': 0,
        'speed_improvement': 0
    }
    
    # Run test workload
    api_cache.reset_stats()
    
    # Execute 1000 queries with 80% repetition
    queries = ['query1', 'query2', 'query3', 'query4', 'query5'] * 200
    
    for query in queries:
        await api_cache.cached_api_call(
            operation="test",
            prompt=query
        )
    
    # Calculate metrics
    stats = api_cache.get_stats()
    results['cache_hit_rate'] = stats['cache_hits'] / (stats['cache_hits'] + stats['cache_misses'])
    results['api_reduction'] = 1 - (stats['api_calls'] / len(queries))
    
    # Validate targets
    assert results['cache_hit_rate'] > 0.7  # 70% hit rate
    assert results['api_reduction'] > 0.5   # 50% fewer API calls
    
    return results
```

## Phase 4: Deployment (Day 5)

### 4.1 Gradual Rollout
```python
# feature_flags.py
OPTIMIZATION_FLAGS = {
    'enable_cache': os.getenv('ENABLE_CACHE', 'false') == 'true',
    'enable_batching': os.getenv('ENABLE_BATCHING', 'false') == 'true',
    'cache_percentage': int(os.getenv('CACHE_PERCENTAGE', '10'))  # Start with 10%
}

# Gradual enablement
async def maybe_cached_call(operation, prompt):
    if OPTIMIZATION_FLAGS['enable_cache']:
        if random.randint(1, 100) <= OPTIMIZATION_FLAGS['cache_percentage']:
            return await api_cache.cached_api_call(operation, prompt)
    
    # Fallback to direct call
    return await direct_api_call(operation, prompt)
```

### 4.2 Monitoring Setup
```python
# monitoring.py
import prometheus_client as prom

# Define metrics
cache_hit_rate = prom.Gauge('cache_hit_rate', 'Cache hit rate percentage')
api_calls_saved = prom.Counter('api_calls_saved', 'Total API calls saved by cache')
response_time = prom.Histogram('response_time_seconds', 'Response time in seconds')

# Update metrics
async def update_metrics():
    while True:
        stats = api_cache.get_stats()
        hit_rate = stats['cache_hits'] / max(1, stats['cache_hits'] + stats['cache_misses'])
        
        cache_hit_rate.set(hit_rate * 100)
        api_calls_saved.inc(stats['cache_hits'])
        
        await asyncio.sleep(60)  # Update every minute
```

### 4.3 Rollback Plan
```python
# rollback.py
async def emergency_disable_optimizations():
    """Emergency switch to disable all optimizations"""
    
    # Disable cache
    api_cache.enabled = False
    
    # Disable batching
    BatchedRAGService.max_batch_size = 1
    
    # Clear all caches
    await cache_manager.clear_all()
    
    # Log incident
    logger.critical("Optimizations disabled due to emergency")
    
    # Notify team
    await send_alert("Optimizations disabled - manual intervention required")
```

## Phase 5: Maintenance (Ongoing)

### 5.1 Weekly Reviews
```python
# weekly_review.py
async def generate_weekly_report():
    report = {
        'period': 'last_7_days',
        'cache_metrics': {},
        'performance_metrics': {},
        'cost_savings': {}
    }
    
    # Cache effectiveness
    stats = api_cache.get_weekly_stats()
    report['cache_metrics'] = {
        'avg_hit_rate': stats['avg_hit_rate'],
        'total_hits': stats['total_hits'],
        'total_misses': stats['total_misses']
    }
    
    # Performance improvements
    report['performance_metrics'] = {
        'avg_response_time_ms': stats['avg_response_time'],
        'p95_response_time_ms': stats['p95_response_time'],
        'total_requests': stats['total_requests']
    }
    
    # Cost analysis
    report['cost_savings'] = {
        'api_calls_saved': stats['total_hits'],
        'estimated_savings_usd': stats['total_hits'] * 0.002,
        'time_saved_hours': stats['total_hits'] * 0.1 / 3600  # 100ms per call
    }
    
    return report
```

### 5.2 TTL Optimization
```python
# ttl_optimizer.py
async def optimize_ttls():
    """Analyze cache patterns and optimize TTLs"""
    
    recommendations = {}
    
    for operation in api_cache.get_operations():
        stats = api_cache.get_operation_stats(operation)
        
        # If high hit rate, consider longer TTL
        if stats['hit_rate'] > 0.9:
            recommendations[operation] = {
                'current_ttl': stats['current_ttl'],
                'recommended_ttl': stats['current_ttl'] * 1.5,
                'reason': 'High hit rate suggests stable data'
            }
        
        # If low hit rate, consider shorter TTL
        elif stats['hit_rate'] < 0.3:
            recommendations[operation] = {
                'current_ttl': stats['current_ttl'],
                'recommended_ttl': stats['current_ttl'] * 0.5,
                'reason': 'Low hit rate suggests frequently changing data'
            }
    
    return recommendations
```

### 5.3 Cache Warming Schedule
```python
# cache_warmer.py
import schedule

async def warm_morning_cache():
    """Warm cache for morning peak"""
    scenarios = [
        # Common morning queries
        {"operation": "portfolio_summary", "user_id": "*"},
        {"operation": "market_overview", "market": "US"},
        {"operation": "news_digest", "category": "finance"}
    ]
    await api_cache.warm_cache(scenarios)

async def warm_evening_cache():
    """Warm cache for evening peak"""
    scenarios = [
        # Common evening queries
        {"operation": "daily_report", "user_id": "*"},
        {"operation": "transaction_summary", "date": "today"},
        {"operation": "spending_analysis", "period": "month"}
    ]
    await api_cache.warm_cache(scenarios)

# Schedule warming
schedule.every().day.at("06:00").do(warm_morning_cache)
schedule.every().day.at("17:00").do(warm_evening_cache)
```

## Migration Checklist

### Pre-Migration
- [ ] Identify all API calls and expensive operations
- [ ] Measure baseline performance
- [ ] Calculate expected savings
- [ ] Set up monitoring infrastructure
- [ ] Create rollback plan

### During Migration
- [ ] Implement cache infrastructure
- [ ] Add cache decorators systematically
- [ ] Convert sequential to batch processing
- [ ] Write comprehensive tests
- [ ] Document changes

### Post-Migration
- [ ] Validate performance improvements
- [ ] Monitor cache hit rates
- [ ] Optimize TTLs based on usage
- [ ] Set up automated cache warming
- [ ] Schedule regular reviews

### Success Criteria
- [ ] Cache hit rate > 70%
- [ ] API call reduction > 50%
- [ ] Response time improvement > 10x for cached
- [ ] Zero increase in error rate
- [ ] Cost reduction > 40%

## Common Migration Issues

### Issue 1: Cache Key Collisions
**Symptom:** Wrong data returned from cache
**Solution:** Include all varying parameters in cache key
```python
# Bad
cache_key = f"user_data"

# Good
cache_key = f"user:{user_id}:data:{data_type}:{timestamp}"
```

### Issue 2: Memory Overflow
**Symptom:** Out of memory errors
**Solution:** Implement cache eviction
```python
class BoundedCache:
    def __init__(self, max_size_mb=100):
        self.max_size_mb = max_size_mb
        self.cache = {}
    
    def set(self, key, value):
        if self.get_size_mb() > self.max_size_mb:
            self.evict_lru()
        self.cache[key] = value
```

### Issue 3: Stale Data
**Symptom:** Users see outdated information
**Solution:** Implement smart invalidation
```python
async def invalidate_related(key: str):
    """Invalidate cache entries related to key"""
    patterns = [
        f"{key}:*",  # Direct children
        f"*:{key}",  # References
        f"summary:*" if "detail" in key else None  # Aggregates
    ]
    for pattern in patterns:
        if pattern:
            await cache_manager.clear_pattern(pattern)
```

---

*This migration guide ensures systematic, safe, and measurable optimization deployment.*