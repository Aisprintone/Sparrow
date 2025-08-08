#!/bin/bash

# Railway Deployment Restart Script
# This script helps restart and redeploy Railway applications when database connection issues occur

set -e

echo "🚀 Railway Deployment Restart Script"
echo "====================================="

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI is not installed. Please install it first:"
    echo "npm install -g @railway/cli"
    exit 1
fi

# Check if we're in a Railway project
if [ ! -f "railway.toml" ] && [ ! -f "railway.json" ]; then
    echo "❌ Not in a Railway project directory. Please run this from your project root."
    exit 1
fi

echo "📋 Current Railway status:"
railway status

echo ""
echo "🔄 Restarting Railway deployment..."

# Option 1: Restart the current deployment
echo "1️⃣ Attempting to restart current deployment..."
railway up --detach

# Wait a moment for the restart to process
sleep 10

# Check deployment status
echo ""
echo "📊 Checking deployment status..."
railway status

echo ""
echo "🔍 Checking logs for database connection issues..."
railway logs --tail 50

echo ""
echo "✅ Restart completed!"
echo ""
echo "💡 If you're still experiencing database connection issues:"
echo "1. Check Railway dashboard for service status"
echo "2. Verify DATABASE_URL environment variable is set"
echo "3. Ensure PostgreSQL service is running"
echo "4. Try redeploying with: railway up"
echo "5. Check Railway service health in the dashboard"

echo ""
echo "🔗 Useful Railway commands:"
echo "- railway status          # Check service status"
echo "- railway logs            # View deployment logs"
echo "- railway variables       # Check environment variables"
echo "- railway connect         # Connect to database shell"
echo "- railway up              # Redeploy application"

