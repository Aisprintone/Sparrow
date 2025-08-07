#!/bin/bash

echo "🚀 PRODUCTION DEPLOYMENT SCRIPT"
echo "================================"

# Check if we're in the right directory
if [ ! -f "app.py" ]; then
    echo "❌ app.py not found. Make sure you're in the correct directory."
    exit 1
fi

echo "✅ Found app.py"

# Check if Railway CLI is available
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Please install Railway CLI first."
    exit 1
fi

echo "✅ Railway CLI found"

# Set environment variables for production
export ENVIRONMENT=production
export LOG_LEVEL=INFO
export RAILWAY_ENVIRONMENT=production

echo "✅ Environment variables set"

# Create a deployment marker
echo "$(date)" > .deployment_timestamp

echo "📦 Creating production deployment..."

# Deploy to Railway
railway up --service feeble-bite --detach

echo "⏳ Waiting for deployment to complete..."
sleep 60

# Test deployment
echo "🔍 Testing deployment..."

RAILWAY_URL="https://feeble-bite-production.up.railway.app"

# Test root endpoint
echo "Testing root endpoint..."
ROOT_RESPONSE=$(curl -s "$RAILWAY_URL/" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('version', 'unknown'))" 2>/dev/null)

if [[ "$ROOT_RESPONSE" == "3."* ]]; then
    echo "✅ New deployment active (version: $ROOT_RESPONSE)"
    
    # Test RAG endpoints
    echo "Testing RAG endpoints..."
    
    RAG_TEST=$(curl -s "$RAILWAY_URL/rag-test" 2>/dev/null | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('status', 'unknown'))" 2>/dev/null)
    
    if [ "$RAG_TEST" = "RAG_OPERATIONAL" ]; then
        echo "✅ RAG system operational in production"
        
        echo ""
        echo "🎉 DEPLOYMENT SUCCESSFUL!"
        echo "========================"
        echo "Production URL: $RAILWAY_URL"
        echo "RAG Status: Operational"
        echo "API Version: $ROOT_RESPONSE"
        echo ""
        echo "🔗 Available Endpoints:"
        echo "- GET  $RAILWAY_URL/"
        echo "- GET  $RAILWAY_URL/health"
        echo "- GET  $RAILWAY_URL/rag-test"
        echo "- GET  $RAILWAY_URL/rag/profiles/summary"
        echo "- POST $RAILWAY_URL/rag/query/{profile_id}"
        
    else
        echo "⚠️  RAG system not yet ready. May need additional time."
        echo "   Check manually: $RAILWAY_URL/rag-test"
    fi
    
else
    echo "⚠️  Deployment may still be in progress or cached."
    echo "   Current version: $ROOT_RESPONSE"
    echo "   Expected: 3.x.x"
    echo "   Check Railway dashboard for deployment status"
fi

echo ""
echo "📋 Next Steps:"
echo "1. Verify all endpoints are working: $RAILWAY_URL/health"
echo "2. Test RAG functionality: $RAILWAY_URL/rag-test"
echo "3. Monitor logs: railway logs"
echo "4. Check metrics: $RAILWAY_URL/api/optimization/metrics"

echo ""
echo "🏁 Deployment script completed."