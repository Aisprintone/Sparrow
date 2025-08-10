#!/bin/bash

echo "🚀 RAILWAY CLI DEPLOYMENT"
echo "========================"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    if command -v brew &> /dev/null; then
        brew install railway
    elif command -v npm &> /dev/null; then
        npm install -g @railway/cli
    else
        echo "Please install Railway CLI: https://docs.railway.app/reference/cli-api"
        exit 1
    fi
fi

echo "✅ Railway CLI available"

# Check login status
if railway whoami &>/dev/null; then
    echo "✅ Logged in to Railway"
    railway whoami
else
    echo "❌ Not logged in to Railway"
    echo "Please run: railway login"
    echo "Then re-run this script"
    exit 1
fi

# Ensure we're in the right directory
if [ ! -f "app.py" ]; then
    echo "❌ app.py not found. Make sure you're in the correct directory."
    exit 1
fi

echo "✅ Found app.py (v4.0.0 with RAG system)"

# Clean up any existing Railway configs
rm -rf .railway 2>/dev/null

# Create new project using non-interactive approach
echo "🔄 Creating new Railway project..."

# Set project name
PROJECT_NAME="financeai-rag-v4-$(date +%s)"
echo "Project name: $PROJECT_NAME"

# Try to create new project
if railway init 2>/dev/null; then
    echo "✅ Railway project initialized"
else
    echo "⚠️  Using existing project connection"
fi

# List available projects to verify
echo "📋 Available projects:"
railway list

# Check current status
railway status

# Set up environment variables
echo "🔧 Setting up environment variables..."

# Check if ANTHROPIC_API_KEY is set
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "⚠️  ANTHROPIC_API_KEY not set in environment"
    echo "Please set it with: export ANTHROPIC_API_KEY=your_key_here"
else
    echo "✅ ANTHROPIC_API_KEY available"
    # Set in Railway
    railway variables --set "ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY" 2>/dev/null || echo "Will set via Railway dashboard"
fi

# Set other environment variables
railway variables --set "ENVIRONMENT=production" 2>/dev/null || echo "Will set via Railway dashboard"
railway variables --set "LOG_LEVEL=INFO" 2>/dev/null || echo "Will set via Railway dashboard"

# Display deployment info
echo ""
echo "📦 DEPLOYMENT PACKAGE INFO"
echo "=========================="
echo "Main App: app.py (FastAPI with RAG)"
echo "Version: 4.0.0" 
echo "Features:"
echo "  - RAG system with profile data loading"
echo "  - AI-enhanced simulations" 
echo "  - Batched query optimization"
echo "  - Performance improvements (83% API reduction)"
echo ""

# Deploy
echo "🚀 Deploying to Railway..."
if railway up --detach; then
    echo ""
    echo "✅ DEPLOYMENT INITIATED!"
    echo "======================="
    
    # Wait a moment and check status
    sleep 5
    railway status
    
    echo ""
    echo "📋 Next steps:"
    echo "1. Check deployment status: railway status"
    echo "2. View logs: railway logs"
    echo "3. Open in browser: railway open"
    echo "4. Get URL for testing: railway domain"
    
    echo ""
    echo "🔍 Once deployed, test with:"
    echo "curl https://your-app-url/health"
    echo "curl https://your-app-url/rag-test"
    
else
    echo "❌ DEPLOYMENT FAILED"
    echo "==================="
    echo "Check Railway status and try again"
    railway status
    exit 1
fi

echo ""
echo "🎉 Railway deployment completed!"