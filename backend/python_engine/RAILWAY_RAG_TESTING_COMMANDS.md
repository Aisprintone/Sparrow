# Railway RAG System Testing Commands

## 🚀 Quick Start

### 1. Get Your Railway URL
```bash
# Check your deployment status and URL
railway status

# Or view in dashboard
railway open
```

### 2. Set Railway URL as Environment Variable
```bash
export RAILWAY_URL="https://your-app.up.railway.app"
```

### 3. Run Complete RAG Verification
```bash
# Run the comprehensive test suite
python test_railway_rag_proof.py $RAILWAY_URL

# Or let it prompt you for the URL
python test_railway_rag_proof.py
```

## 📊 Individual RAG Endpoint Tests

### Test RAG System Health
```bash
# Check if RAG is initialized
curl -s "$RAILWAY_URL/rag/profiles/summary" | python -m json.tool

# Expected: List of profile summaries with document counts
```

### Test Direct RAG Queries
```bash
# Query accounts for profile 1
curl -X POST "$RAILWAY_URL/rag/query/1" \
  -H "Content-Type: application/json" \
  -d '{"query": "What are my account balances?", "tool_name": "query_accounts"}' \
  | python -m json.tool

# Query transactions
curl -X POST "$RAILWAY_URL/rag/query/1" \
  -H "Content-Type: application/json" \
  -d '{"query": "Show my recent transactions", "tool_name": "query_transactions"}' \
  | python -m json.tool

# Query demographics
curl -X POST "$RAILWAY_URL/rag/query/1" \
  -H "Content-Type: application/json" \
  -d '{"query": "What is my demographic information?", "tool_name": "query_demographics"}' \
  | python -m json.tool
```

### Test Batched RAG Service
```bash
# Send multiple queries in parallel
curl -X POST "$RAILWAY_URL/rag/profiles/1/multi-query" \
  -H "Content-Type: application/json" \
  -d '{
    "queries": [
      {"query": "What are my accounts?", "tool_name": "query_accounts"},
      {"query": "Show transactions", "tool_name": "query_transactions"},
      {"query": "What are my goals?", "tool_name": "query_goals"}
    ]
  }' | python -m json.tool
```

## 🎯 Test RAG Integration in Simulations

### Run Simulation with RAG-Enhanced AI Explanations
```bash
# Emergency fund simulation for profile 1
curl -X POST "$RAILWAY_URL/simulation/emergency_fund" \
  -H "Content-Type: application/json" \
  -d '{
    "profile_id": "1",
    "use_current_profile": false,
    "scenario_type": "emergency_fund",
    "parameters": {
      "target_months": 6,
      "monthly_contribution": 500,
      "risk_tolerance": "moderate"
    }
  }' | python -m json.tool | grep -A 10 "ai_explanations"
```

### Medical Crisis Simulation (Heavy RAG Usage)
```bash
curl -X POST "$RAILWAY_URL/simulation/medical_crisis" \
  -H "Content-Type: application/json" \
  -d '{
    "profile_id": "2",
    "use_current_profile": false,
    "scenario_type": "medical_crisis",
    "parameters": {
      "insurance_coverage": "standard",
      "emergency_fund_months": 6,
      "health_status": "good"
    }
  }' | python -m json.tool
```

## 📈 Monitor RAG Performance

### Check Optimization Metrics
```bash
# View RAG batching and cache metrics
curl -s "$RAILWAY_URL/api/optimization/metrics" | python -m json.tool

# Look for:
# - rag_batching.total_queries
# - rag_batching.success_rate
# - rag_batching.average_latency_ms
# - api_cache.hit_rate
```

### Warm Up RAG Cache
```bash
# Pre-load common queries for better performance
curl -X POST "$RAILWAY_URL/api/optimization/warm-cache" \
  -H "Content-Type: application/json" \
  -d '{
    "warm_rag": true,
    "profile_ids": [1, 2, 3]
  }' | python -m json.tool
```

## 🔍 Railway Log Monitoring

### View All RAG Logs
```bash
# Tail logs and filter for RAG
railway logs --tail | grep -E "RAG|rag|Retriever|Vector|query_"

# View last 500 lines of RAG activity
railway logs --tail 500 | grep -E "(RAG QUERY|ProfileRAGSystem|query_accounts|embeddings)"
```

### Monitor RAG Initialization
```bash
# Check if RAG loaded properly on startup
railway logs | grep -E "(RAG manager initialized|CSV data loader|profiles loaded|FAISS index)"
```

### Track AI Explanation Generation
```bash
# See when AI uses RAG for explanations
railway logs --tail | grep -E "(generate_explanation_cards|AI EXPLANATIONS|personalized|LangGraph)"
```

### Performance Monitoring
```bash
# Track execution times
railway logs --tail 100 | grep -E "(execution_time|Processing time|latency|Cache hit)"
```

## 🧪 Advanced RAG Testing

### Test Specific Profile Tools
```bash
# Get available tools for profile 1
curl -s "$RAILWAY_URL/rag/profiles/1/tools" | python -m json.tool

# Get profile 1 summary
curl -s "$RAILWAY_URL/rag/profiles/1/summary" | python -m json.tool
```

### Load Test RAG System
```bash
# Run multiple queries in sequence
for i in {1..5}; do
  echo "Query $i:"
  time curl -s -X POST "$RAILWAY_URL/rag/query/1" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"Test query $i\", \"tool_name\": \"query_all_data\"}" \
    | python -m json.tool | head -5
  echo ""
done
```

### Test All Profiles
```bash
# Query each profile to ensure all data is loaded
for profile in 1 2 3; do
  echo "Testing Profile $profile:"
  curl -s -X POST "$RAILWAY_URL/rag/query/$profile" \
    -H "Content-Type: application/json" \
    -d '{"query": "Summarize my financial situation", "tool_name": "query_all_data"}' \
    | python -m json.tool | grep -E "(success|result)" | head -5
  echo ""
done
```

## 🎛️ Railway CLI Commands

### Deployment Management
```bash
# Deploy latest changes
railway up

# Check deployment status
railway status

# View deployment logs
railway logs

# Open Railway dashboard
railway open

# Restart deployment
railway restart
```

### Environment Variables
```bash
# List all env vars
railway variables

# Set an env var
railway variables set KEY=value

# Enable debug logging for RAG
railway variables set LOG_LEVEL=DEBUG
railway variables set RAG_DEBUG=true
```

## 🔥 Quick Proof Commands

### One-Liner RAG Proof
```bash
# Proves RAG is working with a single command
curl -s "$RAILWAY_URL/rag/profiles/summary" | grep -q "profile_summaries" && echo "✅ RAG IS WORKING" || echo "❌ RAG NOT FOUND"
```

### Check if AI Uses RAG
```bash
# Run simulation and check for personalization
curl -s -X POST "$RAILWAY_URL/simulation/emergency_fund" \
  -H "Content-Type: application/json" \
  -d '{"profile_id": "1", "scenario_type": "emergency_fund", "parameters": {}}' \
  | grep -o "ai_explanations" | wc -l
```

### Monitor Live RAG Activity
```bash
# Watch RAG queries in real-time
railway logs --tail | grep --line-buffered "RAG QUERY"
```

## 📝 Automated Testing Script

### Run All Tests
```bash
# Make monitoring script executable
chmod +x railway_rag_monitor.sh

# Run interactive monitor
./railway_rag_monitor.sh
```

### Python Test Suite
```bash
# Run comprehensive verification
python test_railway_rag_proof.py $RAILWAY_URL

# The script will:
# 1. Check health endpoints
# 2. Test all RAG endpoints
# 3. Run direct RAG queries
# 4. Test simulations with RAG
# 5. Verify batched service
# 6. Check metrics
# 7. Generate a detailed report
```

## 🚨 Troubleshooting

### If RAG Queries Return Empty
```bash
# Check if profiles are loaded
railway logs | grep "CSV data loader"

# Check for initialization errors
railway logs | grep -E "(ERROR|Failed|Exception)" | grep -i rag

# Verify CSV files are included in deployment
railway logs | grep -E "(data/profiles|.csv)"
```

### If AI Explanations Are Generic
```bash
# Check if AI agent has RAG access
railway logs | grep -E "(RAGToolkit|ProfileRAGSystem.*AI)"

# Verify personalization is working
railway logs --tail 100 | grep -E "(personalized|profile_specific|based on your)"
```

### Performance Issues
```bash
# Check cache status
curl -s "$RAILWAY_URL/api/optimization/metrics" | python -m json.tool | grep -A 5 "cache"

# Warm up caches
curl -X POST "$RAILWAY_URL/api/optimization/warm-cache" -H "Content-Type: application/json" -d '{"warm_rag": true}'
```

## ✅ Success Indicators

You know RAG is working when you see:

1. **In Logs:**
   - "RAG manager initialized successfully"
   - "ProfileRAGSystem initialized for profile X"
   - "RAG QUERY: [profile_id=X]"
   - "Retrieved X documents"

2. **In API Responses:**
   - `/rag/profiles/summary` returns profile data
   - AI explanations contain specific numbers from profiles
   - Simulation results include personalized insights

3. **In Metrics:**
   - `rag_batching.total_queries` > 0
   - `rag_batching.success_rate` > 0.9
   - Cache hit rates improving over time

## 📊 Generate Evidence Report

```bash
# Run this to generate a comprehensive evidence report
python test_railway_rag_proof.py $RAILWAY_URL

# The report will be saved as:
# railway_rag_report_YYYYMMDD_HHMMSS.json
```

This report provides definitive proof that RAG is operational in your Railway deployment.