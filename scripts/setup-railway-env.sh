#!/bin/bash

# Railway Environment Setup Script
# This script configures all necessary environment variables for Railway deployment

set -e

echo "🚀 Setting up Railway environment variables..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Please install it first:"
    echo "npm install -g @railway/cli"
    exit 1
fi

# Check if we're in a Railway project
if ! railway status &> /dev/null; then
    echo "❌ Not in a Railway project. Please run 'railway link' first."
    exit 1
fi

echo "📦 Adding PostgreSQL database..."
railway add postgresql

echo "🔧 Setting up environment variables..."

# Core application variables
railway variables set ENVIRONMENT=production
railway variables set LOG_LEVEL=INFO
railway variables set CORS_ORIGINS="*"
railway variables set PORT=8000
railway variables set HOST=0.0.0.0
railway variables set CACHE_TTL_SECONDS=3600
railway variables set NODE_ENV=production
railway variables set PYTHON_VERSION=3.11

# Database URL will be automatically set by Railway
echo "🗄️ Database URL will be automatically configured by Railway"

# API Keys - Replace these with your actual keys
echo "🔑 Setting up API keys (replace with your actual keys)..."
railway variables set OPENAI_API_KEY="sk-your-openai-api-key-here"
railway variables set ANTHROPIC_API_KEY="sk-ant-your-anthropic-api-key-here"
railway variables set PLAID_CLIENT_ID="your-plaid-client-id-here"
railway variables set PLAID_CLIENT_SECRET="your-plaid-client-secret-here"
railway variables set CHASE_API_KEY="your-chase-api-key-here"

# Railway specific settings
railway variables set RAILWAY_DEPLOYMENT_OVERLAP_SECONDS=30

echo "✅ Environment variables configured!"
echo ""
echo "📋 Next steps:"
echo "1. Replace the API keys with your actual keys in Railway dashboard"
echo "2. Deploy your application: railway up"
echo "3. Check logs: railway logs"
echo "4. Open your app: railway open"
echo ""
echo "🔍 To view current variables: railway variables"
echo "🔍 To view logs: railway logs"
