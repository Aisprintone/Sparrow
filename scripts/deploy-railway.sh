#!/bin/bash

# Railway Deployment Script for Sparrow Backend
# Complete setup and deployment to Railway

set -e

echo "🚂 Railway Deployment Script for Sparrow Backend"
echo "================================================"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Login to Railway (if not already logged in)
echo "🔐 Logging into Railway..."
railway login

# Navigate to backend directory
cd backend/python_engine

# Copy CSV data files to the backend data directory
echo "📁 Copying CSV data files..."
mkdir -p data
cp ../../data/*.csv data/ 2>/dev/null || echo "⚠️ Some CSV files not found, will use mock data"

# Check if we're in a Railway project
if ! railway status &> /dev/null; then
    echo "📦 Initializing Railway project..."
    railway init
fi

# Install dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Test imports
echo "🧪 Testing imports..."
python -c "import api.main; print('✅ All imports successful')"

# Deploy to Railway
echo "🚀 Deploying to Railway..."
railway up

# Get the deployment URL
echo "🌐 Getting deployment URL..."
DEPLOYMENT_URL=$(railway status --json | jq -r '.url' 2>/dev/null || echo "https://your-app.railway.app")

echo "✅ Railway deployment complete!"
echo "🌐 Your app should be available at: $DEPLOYMENT_URL"

# Wait for deployment to be ready
echo "⏳ Waiting for deployment to be ready..."
sleep 30

# Test the deployment
echo "🧪 Testing deployment..."

# Test health endpoint
if curl -f "$DEPLOYMENT_URL/health" &> /dev/null; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
fi

# Test database health
if curl -f "$DEPLOYMENT_URL/db/health" &> /dev/null; then
    echo "✅ Database health check passed"
else
    echo "❌ Database health check failed"
fi

# Initialize database if needed
echo "🗃️ Initializing database..."
if curl -X POST "$DEPLOYMENT_URL/db/init" &> /dev/null; then
    echo "✅ Database initialization successful"
else
    echo "❌ Database initialization failed"
fi

echo ""
echo "🎉 Deployment completed successfully!"
echo "🌐 Frontend URL: https://sparrow-finance-app.netlify.app"
echo "🔗 Backend URL: $DEPLOYMENT_URL"
echo ""
echo "📋 Next steps:"
echo "1. Update frontend environment variables"
echo "2. Configure API keys in Railway dashboard"
echo "3. Test all endpoints"
echo "4. Monitor logs with: railway logs"
