#!/bin/bash

# FinanceAI Deployment Script
# This script deploys both frontend and backend to production

set -e

echo "🚀 FinanceAI Deployment Script"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "DEPLOYMENT_GUIDE.md" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Starting deployment..."

# Deploy Backend (Railway)
echo ""
echo "📦 Deploying Backend to Railway..."
cd backend/python_engine

if command -v railway &> /dev/null; then
    print_status "Railway CLI found"
    
    # Check if linked to Railway project
    if railway status &> /dev/null; then
        print_status "Railway project linked"
        
        # Deploy to Railway
        echo "Deploying to Railway..."
        railway up
        
        print_status "Backend deployed successfully"
    else
        print_error "Not linked to Railway project. Please run: railway link"
        exit 1
    fi
else
    print_error "Railway CLI not found. Please install it first: npm install -g @railway/cli"
    exit 1
fi

cd ../..

# Deploy Frontend (Netlify)
echo ""
echo "🌐 Deploying Frontend to Netlify..."
cd frontend

# Check if Netlify CLI is available
if command -v netlify &> /dev/null; then
    print_status "Netlify CLI found"
    
    # Build the frontend
    echo "Building frontend..."
    npm run build
    
    # Deploy to Netlify
    echo "Deploying to Netlify..."
    netlify deploy --prod --dir=out
    
    print_status "Frontend deployed successfully"
else
    print_warning "Netlify CLI not found. Building for manual deployment..."
    npm run build
    print_status "Frontend built successfully. Deploy manually to Netlify."
fi

cd ..

# Health Checks
echo ""
echo "🔍 Running Health Checks..."

# Check backend health
echo "Checking backend health..."
BACKEND_HEALTH=$(curl -s https://feeble-bite-production.up.railway.app/health)
if echo "$BACKEND_HEALTH" | grep -q '"status":"healthy"'; then
    print_status "Backend health check passed"
else
    print_error "Backend health check failed"
    echo "$BACKEND_HEALTH"
fi

# Check frontend health
echo "Checking frontend health..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://sparrow-finance-app.netlify.app)
if [ "$FRONTEND_STATUS" = "200" ]; then
    print_status "Frontend health check passed"
else
    print_error "Frontend health check failed (HTTP $FRONTEND_STATUS)"
fi

echo ""
print_status "Deployment completed!"
echo ""
echo "🌐 Frontend: https://sparrow-finance-app.netlify.app"
echo "🔧 Backend: https://feeble-bite-production.up.railway.app"
echo ""
echo "📊 Test the full integration with:"
echo "   npx playwright test"
