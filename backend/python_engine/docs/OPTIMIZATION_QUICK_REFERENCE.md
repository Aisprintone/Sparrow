# Quick Reference: Optimization Patterns
**For Immediate Application**

## Cache Any API Call (2 minutes)
```python
from core.api_cache import api_cache

# Before: Direct API call
response = await client.post("https://api.example.com/endpoint", json=data)

# After: Cached API call
response = await api_cache.cached_api_call(
    operation="your_operation",
    prompt=data["prompt"]
)
```

## Add Caching to Function (1 minute)
```python
from core.cache_manager import cached

# Just add decorator
@cached(prefix="function_name", ttl=300)  # 5 minutes cache
async def expensive_function(param1, param2):
    # Your expensive operation
    return result
```

## Batch Multiple Queries (5 minutes)
```python
from rag.batched_service import BatchedRAGService
from rag.abstractions import BatchedRAGRequest, RAGQuery

# Create batch request
queries = [
    RAGQuery(query_type=QueryType.ACCOUNTS, query_text="Get accounts"),
    RAGQuery(query_type=QueryType.TRANSACTIONS, query_text="Get transactions")
]

request = BatchedRAGRequest(profile_id=user_id, queries=queries)

# Execute in parallel
response = await batched_service.execute_batch(request)
```

## Performance Testing Template (10 minutes)
```python
import time
import asyncio

async def test_optimization():
    # Baseline (without optimization)
    start = time.time()
    for i in range(100):
        await original_function()
    baseline_time = time.time() - start
    
    # With optimization
    start = time.time()
    for i in range(100):
        await optimized_function()
    optimized_time = time.time() - start
    
    improvement = (baseline_time - optimized_time) / baseline_time * 100
    print(f"Performance improvement: {improvement:.1f}%")
```

## Cache TTL Guidelines

| Data Type | TTL | Example |
|-----------|-----|---------|
| Static content | 24h | Embeddings, documentation |
| User profiles | 5m | Personal data, preferences |
| Financial data | 30m | Calculations, analysis |
| Real-time | 30s | Stock prices, rates |
| Expensive compute | 1h | ML predictions, reports |

## Common Cache Keys
```python
# User-specific
f"user:{user_id}:profile"
f"user:{user_id}:transactions:{date_range}"

# Global data
f"market:stocks:{symbol}:{date}"
f"embeddings:{hash(text)}"

# API responses
f"api:{provider}:{operation}:{hash(prompt)}"
```

## Monitoring Commands
```bash
# Check cache stats
curl http://localhost:8000/cache/stats

# Warm cache
curl -X POST http://localhost:8000/cache/warm

# Clear cache
curl -X DELETE http://localhost:8000/cache/clear

# View usage
curl http://localhost:8000/cache/usage
```

## Debug Slow Queries
```python
import logging
logging.basicConfig(level=logging.DEBUG)

# Add timing
import time
start = time.time()
result = await slow_function()
print(f"Execution time: {(time.time() - start)*1000:.2f}ms")

# Check cache hit
stats = api_cache.get_stats()
print(f"Cache hit rate: {stats['cache_hits']/(stats['cache_hits']+stats['cache_misses'])*100:.1f}%")
```

## Emergency Fallbacks
```python
# Multiple provider fallback
providers = [APIProvider.ANTHROPIC, APIProvider.OPENAI, APIProvider.MOCK]
for provider in providers:
    try:
        return await api_cache.cached_api_call(
            operation="completion",
            provider=provider,
            prompt=prompt
        )
    except Exception as e:
        logger.warning(f"Provider {provider} failed: {e}")
        continue
```

## Quick Wins Checklist
- [ ] Add `@cached` decorator to expensive functions
- [ ] Replace direct API calls with `api_cache.cached_api_call()`
- [ ] Batch related queries together
- [ ] Set appropriate TTLs (not too short, not too long)
- [ ] Add cache warming for predictable queries
- [ ] Monitor cache hit rate (target >70%)
- [ ] Test with concurrent load
- [ ] Document cache dependencies

## Red Flags to Avoid
- ❌ Caching user-specific data with global keys
- ❌ TTLs shorter than computation time
- ❌ Missing error handling on cache failures
- ❌ Unbounded cache growth
- ❌ Cache keys without version/schema info
- ❌ Direct API calls bypassing cache
- ❌ Sequential processing of batchable queries

## Copy-Paste Templates

### Template 1: Cached Service Class
```python
class OptimizedService:
    def __init__(self):
        self.cache = cache_manager
        
    @cached(prefix="service", ttl=300)
    async def get_data(self, param):
        # Expensive operation
        return await self._fetch_data(param)
```

### Template 2: Batch Processor
```python
async def process_batch(items):
    tasks = [process_single(item) for item in items]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    return [r for r in results if not isinstance(r, Exception)]
```

### Template 3: Performance Monitor
```python
from functools import wraps

def monitor_performance(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        start = time.time()
        result = await func(*args, **kwargs)
        duration = (time.time() - start) * 1000
        logger.info(f"{func.__name__} took {duration:.2f}ms")
        return result
    return wrapper
```

---
*Keep this guide handy for instant optimization wins*