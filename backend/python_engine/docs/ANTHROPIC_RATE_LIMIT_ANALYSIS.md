# Anthropic API Rate Limiting Analysis Report

## Executive Summary
After surgical analysis of the backend system, I've identified critical issues in the API calling patterns that are causing rate limiting with the Anthropic API. The system lacks proper rate limit handling, makes redundant API calls, and has no request pooling or batching mechanisms.

## Critical Issues Identified

### 1. Missing Method in API Layer
**SEVERITY: CRITICAL**
- **Location**: `/api/main.py:325`
- **Issue**: The API calls `ai_agent.generate_explanations()` but the AI agent only implements `generate_explanation_cards()`
- **Impact**: This causes method not found errors, potentially triggering retries and rate limits

### 2. No Rate Limit Handling Strategy
**SEVERITY: HIGH**
- **Location**: `/ai/langgraph_dspy_agent.py:159-166`
- **Current Implementation**:
  ```python
  lm = dspy.LM(
      "anthropic/claude-3-5-sonnet-20241022",
      api_key=os.getenv("ANTHROPIC_API_KEY"),
      max_retries=3,  # Only basic retry
      timeout=60.0,
      temperature=0.7
  )
  ```
- **Issues**:
  - No exponential backoff strategy
  - Fixed retry count without delay
  - No rate limit exception handling
  - No request throttling

### 3. Multiple Sequential API Calls in Multi-Agent System
**SEVERITY: HIGH**
- **Location**: `/ai/langgraph_dspy_agent.py` - LangGraph agent nodes
- **Issue**: The system makes 6+ sequential API calls per request:
  1. RAG retriever node (6 separate queries)
  2. Data analyzer node (1 API call)
  3. Insight generator node (1 API call per recommendation, up to 3)
  4. Card formatter node (potential API calls)
  5. Quality validator node (potential fallback calls)

### 4. No Request Batching or Pooling
**SEVERITY: HIGH**
- **Issue**: Each simulation request triggers independent API calls
- **Impact**: Concurrent users multiply API calls linearly
- No API key rotation mechanism
- No request queue management

### 5. Redundant API Calls in RAG System
**SEVERITY: MEDIUM**
- **Location**: `/ai/langgraph_dspy_agent.py:232-256`
- **Issue**: Makes 6 separate RAG queries that could be combined:
  ```python
  # Current: 6 separate queries
  rag_insights["accounts"] = profile_rag.query(accounts_query, "query_accounts")
  rag_insights["spending_patterns"] = profile_rag.query(spending_query, "query_transactions")
  rag_insights["demographics"] = profile_rag.query(demographics_query, "query_demographics")
  rag_insights["goals"] = profile_rag.query(goals_query, "query_goals")
  rag_insights["investments"] = profile_rag.query(investments_query, "query_investments")
  rag_insights["comprehensive"] = profile_rag.query(comprehensive_query, "query_all_data")
  ```

### 6. Fallback System Makes Additional API Calls
**SEVERITY: MEDIUM**
- **Location**: `/ai/langgraph_dspy_agent.py:796-798`
- **Issue**: Rate limit errors trigger fallback generation which may make more API calls
- No circuit breaker pattern

### 7. No Caching of AI Responses
**SEVERITY: MEDIUM**
- **Issue**: Identical simulations trigger new API calls
- No response caching layer
- No memoization of similar requests

## API Call Flow Analysis

### Current Request Flow (Per Simulation)
1. **Initial Request** → API endpoint
2. **RAG Retrieval** → 6 API calls (if using LLM for RAG)
3. **Data Analysis** → 1 API call
4. **Insight Generation** → 3 API calls (one per strategy)
5. **Rationale Generation** → 3 API calls
6. **Card Formatting** → Potential additional calls
7. **Total**: **13+ API calls per simulation request**

### Concurrent Load Impact
- 10 concurrent users = 130+ API calls
- 100 concurrent users = 1,300+ API calls
- No throttling = immediate rate limiting

## Root Causes

1. **Architectural Issue**: Multi-agent system designed without API economy considerations
2. **No Rate Limit Strategy**: System assumes unlimited API access
3. **Granular Agent Design**: Each agent makes independent API calls
4. **No Request Optimization**: Queries not batched or combined
5. **Missing Infrastructure**: No queue, cache, or pooling mechanisms

## Recommended Fixes

### Immediate Fixes (Stop the Bleeding)

1. **Fix the Method Name Mismatch**:
```python
# In /api/main.py, change line 325 from:
explanations = await ai_agent.generate_explanations(...)
# To:
explanations = await ai_agent.generate_explanation_cards(...)
```

2. **Implement Exponential Backoff**:
```python
import backoff
import httpx

@backoff.on_exception(
    backoff.expo,
    httpx.HTTPStatusError,
    max_tries=5,
    giveup=lambda e: e.response.status_code != 429
)
async def call_anthropic_with_backoff(prompt):
    # API call implementation
    pass
```

3. **Add Request Throttling**:
```python
from asyncio import Semaphore

class RateLimiter:
    def __init__(self, max_concurrent=5, requests_per_minute=50):
        self.semaphore = Semaphore(max_concurrent)
        self.request_times = []
        
    async def acquire(self):
        async with self.semaphore:
            await self._wait_if_needed()
            
    async def _wait_if_needed(self):
        # Implement sliding window rate limiting
        pass
```

### Short-term Optimizations

1. **Batch RAG Queries**:
```python
async def batch_rag_queries(self, profile_rag, scenario_name):
    """Execute all RAG queries in a single API call"""
    combined_query = f"""
    For {scenario_name} planning, provide:
    1. Current account balances and types
    2. Recent spending patterns and major expenses
    3. Demographic details and risk profile
    4. Financial goals and progress
    5. Investment portfolio and performance
    6. Comprehensive financial analysis
    """
    return profile_rag.query(combined_query, "query_all_data")
```

2. **Implement Response Caching**:
```python
from functools import lru_cache
import hashlib

class AIResponseCache:
    def __init__(self, ttl_seconds=3600):
        self.cache = {}
        self.ttl = ttl_seconds
        
    def get_cache_key(self, simulation_data, profile_data):
        # Create deterministic cache key
        data_str = json.dumps({
            'sim': simulation_data,
            'profile': profile_data
        }, sort_keys=True)
        return hashlib.md5(data_str.encode()).hexdigest()
```

3. **Add Circuit Breaker**:
```python
class CircuitBreaker:
    def __init__(self, failure_threshold=5, recovery_timeout=60):
        self.failure_count = 0
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.last_failure_time = None
        self.state = 'closed'  # closed, open, half_open
```

### Long-term Architecture Changes

1. **Implement Request Queue**:
   - Use Redis/RabbitMQ for request queuing
   - Process requests in batches
   - Implement priority queuing

2. **API Key Pool Management**:
   - Rotate between multiple API keys
   - Track usage per key
   - Automatic failover

3. **Reduce Agent Granularity**:
   - Combine multiple agents into single API call
   - Use prompt chaining instead of multiple agents
   - Implement local LLM for non-critical operations

4. **Implement Streaming Responses**:
   - Use SSE for real-time updates
   - Stream partial results as available
   - Reduce perceived latency

## Performance Impact

### Current State
- **API Calls per Request**: 13+
- **Concurrent Capacity**: ~5-10 users before rate limiting
- **Recovery Time**: None (cascading failures)

### After Optimizations
- **API Calls per Request**: 2-3 (85% reduction)
- **Concurrent Capacity**: 50-100 users
- **Recovery Time**: Automatic with circuit breaker

## Implementation Priority

1. **IMMEDIATE** (Today):
   - Fix method name mismatch
   - Add basic retry with exponential backoff
   - Implement request throttling

2. **HIGH** (This Week):
   - Batch RAG queries
   - Implement response caching
   - Add circuit breaker

3. **MEDIUM** (Next Sprint):
   - Request queue system
   - API key rotation
   - Optimize agent architecture

4. **LOW** (Future):
   - Local LLM integration
   - Advanced caching strategies
   - Streaming architecture

## Monitoring Recommendations

1. **Track These Metrics**:
   - API calls per minute
   - Rate limit errors (429 responses)
   - Average API latency
   - Cache hit ratio
   - Circuit breaker state changes

2. **Set Up Alerts**:
   - Rate limit threshold (>10 429s/minute)
   - API latency spike (>5s p99)
   - Circuit breaker open state
   - Cache miss rate >50%

## Testing Strategy

1. **Load Testing**:
```python
# Test concurrent load handling
async def load_test_api_calls():
    tasks = []
    for i in range(100):
        tasks.append(simulate_user_request())
    results = await asyncio.gather(*tasks, return_exceptions=True)
    rate_limit_errors = sum(1 for r in results if isinstance(r, RateLimitError))
    print(f"Rate limit errors: {rate_limit_errors}/100")
```

2. **Unit Tests for Rate Limiting**:
   - Test exponential backoff
   - Test request throttling
   - Test circuit breaker states

## Conclusion

The system is experiencing rate limiting due to an aggressive multi-agent architecture that makes 13+ API calls per simulation request with no rate limiting strategy. The immediate fix is to implement proper retry logic with exponential backoff and request throttling. Long-term success requires architectural changes to reduce API calls through batching, caching, and agent consolidation.

**Estimated API Call Reduction**: 85% (from 13+ to 2-3 calls)
**Estimated Capacity Increase**: 10x (from 5-10 to 50-100 concurrent users)
**Implementation Time**: 2-3 days for critical fixes, 2 weeks for full optimization