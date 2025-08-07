#!/bin/bash

echo "🚀 Testing FinanceAI Deployment Workflows"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ "$1" = "success" ]; then
        echo -e "${GREEN}✅ $2${NC}"
    elif [ "$1" = "warning" ]; then
        echo -e "${YELLOW}⚠️ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

echo ""
echo "📋 Pre-deployment Checks..."

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    print_status "error" "Not in a git repository"
    exit 1
fi

# Check if we have uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    print_status "warning" "You have uncommitted changes"
    echo "Current changes:"
    git status --short
    echo ""
    read -p "Do you want to commit these changes? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        git commit -m "🔧 Update deployment configuration and fix build issues"
        print_status "success" "Changes committed"
    else
        print_status "warning" "Skipping commit - make sure to commit changes before deployment"
    fi
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo ""
echo "📍 Current branch: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "develop" ]; then
    print_status "warning" "You're not on main or develop branch"
    read -p "Do you want to switch to main branch? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git checkout main
        print_status "success" "Switched to main branch"
    fi
fi

echo ""
echo "🔍 Checking GitHub Actions Workflows..."

# Check if workflows exist
if [ -f ".github/workflows/deploy-all.yml" ]; then
    print_status "success" "Main deployment workflow exists"
else
    print_status "error" "Main deployment workflow missing"
    exit 1
fi

if [ -f ".github/workflows/deploy-netlify.yml" ]; then
    print_status "success" "Netlify deployment workflow exists"
else
    print_status "error" "Netlify deployment workflow missing"
    exit 1
fi

if [ -f ".github/workflows/deploy-cloudflare.yml" ]; then
    print_status "success" "Cloudflare deployment workflow exists"
else
    print_status "error" "Cloudflare deployment workflow missing"
    exit 1
fi

if [ -f ".github/workflows/monitor-deployments.yml" ]; then
    print_status "success" "Monitoring workflow exists"
else
    print_status "error" "Monitoring workflow missing"
    exit 1
fi

echo ""
echo "🧪 Testing Build Process..."

# Test frontend build
echo "Testing frontend build..."
cd frontend
if npm run build > /dev/null 2>&1; then
    print_status "success" "Frontend build test passed"
else
    print_status "error" "Frontend build test failed"
    exit 1
fi
cd ..

# Test Cloudflare Workers build
echo "Testing Cloudflare Workers build..."
cd cloudflare-workers/financeai-backend
if npm run build > /dev/null 2>&1; then
    print_status "success" "Cloudflare Workers build test passed"
else
    print_status "error" "Cloudflare Workers build test failed"
    exit 1
fi
cd ../..

# Test Python backend
echo "Testing Python backend..."
cd backend/python_engine
if python -c "import api.main; print('Backend modules loaded successfully')" > /dev/null 2>&1; then
    print_status "success" "Python backend test passed"
else
    print_status "error" "Python backend test failed"
    exit 1
fi
cd ../..

echo ""
echo "📊 Deployment Readiness Summary"
echo "=============================="
echo "✅ All workflows present"
echo "✅ Frontend builds successfully"
echo "✅ Cloudflare Workers build works"
echo "✅ Python backend loads correctly"
echo ""
echo "🔐 Required GitHub Secrets:"
echo "   - NETLIFY_AUTH_TOKEN"
echo "   - NETLIFY_SITE_ID"
echo "   - CLOUDFLARE_API_TOKEN"
echo "   - CLOUDFLARE_ACCOUNT_ID"
echo "   - NEXT_PUBLIC_API_URL"
echo ""
echo "🚀 Ready to deploy!"
echo ""
echo "To trigger deployment:"
echo "1. Push to main branch: git push origin main"
echo "2. Monitor deployment: https://github.com/Aisprintone/Sparrow/actions"
echo "3. Check deployment status in the Actions tab"
echo ""
print_status "success" "Deployment test completed successfully!"
