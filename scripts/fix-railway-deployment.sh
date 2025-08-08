#!/bin/bash

# Fix Railway Deployment Script
# Based on Context7 documentation for Railway and FastAPI deployment

echo "🔧 Fixing Railway Deployment Issues..."

# 1. Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
fi

# 2. Navigate to backend directory
cd backend/python_engine

# 3. Check current Railway status
echo "🔍 Checking Railway deployment status..."
railway status

# 4. Deploy the fixes
echo "🚀 Deploying fixes to Railway..."
railway up

# 5. Check logs for any remaining issues
echo "📋 Checking Railway logs..."
railway logs

# 6. Test the deployment
echo "🧪 Testing deployment..."
sleep 10  # Wait for deployment to complete

# Test health endpoint
HEALTH_URL="https://feeble-bite-production.up.railway.app/health"
echo "🏥 Testing health endpoint: $HEALTH_URL"
curl -s "$HEALTH_URL" | jq .

# Test RAG endpoints
echo "🧠 Testing RAG endpoints..."
RAG_SUMMARY_URL="https://feeble-bite-production.up.railway.app/rag/profiles/summary"
curl -s "$RAG_SUMMARY_URL" | jq .

echo "✅ Railway deployment fix completed!"
echo ""
echo "📊 Deployment Status:"
echo "- Health endpoint: $HEALTH_URL"
echo "- RAG endpoints: https://feeble-bite-production.up.railway.app/rag/"
echo "- Railway dashboard: https://railway.app"
