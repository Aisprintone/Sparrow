#!/bin/bash

echo "🔍 FinanceAI Deployment Setup Verification"
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

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
echo "📋 Checking Prerequisites..."

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    print_status "success" "Node.js installed: $NODE_VERSION"
else
    print_status "error" "Node.js not installed"
    exit 1
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    print_status "success" "npm installed: $NPM_VERSION"
else
    print_status "error" "npm not installed"
    exit 1
fi

# Check Python
if command_exists python3; then
    PYTHON_VERSION=$(python3 --version)
    print_status "success" "Python installed: $PYTHON_VERSION"
else
    print_status "error" "Python not installed"
    exit 1
fi

# Check git
if command_exists git; then
    GIT_VERSION=$(git --version)
    print_status "success" "Git installed: $GIT_VERSION"
else
    print_status "error" "Git not installed"
    exit 1
fi

echo ""
echo "📁 Checking Project Structure..."

# Check if we're in the right directory
if [ -f "frontend/package.json" ] && [ -f "cloudflare-workers/financeai-backend/package.json" ]; then
    print_status "success" "Project structure looks correct"
else
    print_status "error" "Project structure is incorrect. Make sure you're in the root directory."
    exit 1
fi

# Check frontend dependencies
echo ""
echo "🔧 Checking Frontend Dependencies..."
cd frontend
if [ -f "package-lock.json" ]; then
    print_status "success" "package-lock.json exists"
else
    print_status "warning" "package-lock.json not found, running npm install..."
    npm install
fi

# Check if build works
echo ""
echo "🏗️ Testing Frontend Build..."
if npm run build > /dev/null 2>&1; then
    print_status "success" "Frontend builds successfully"
else
    print_status "error" "Frontend build failed"
    echo "Running build with verbose output:"
    npm run build
    exit 1
fi

# Check build output
if [ -d "out" ]; then
    print_status "success" "Build output directory exists"
    echo "📄 Build files: $(find out -type f | wc -l)"
else
    print_status "error" "Build output directory not found"
    exit 1
fi

cd ..

# Check Cloudflare Workers dependencies
echo ""
echo "🔧 Checking Cloudflare Workers Dependencies..."
cd cloudflare-workers/financeai-backend
if [ -f "package-lock.json" ]; then
    print_status "success" "package-lock.json exists"
else
    print_status "warning" "package-lock.json not found, running npm install..."
    npm install
fi

# Check if wrangler is available
if command_exists wrangler; then
    WRANGLER_VERSION=$(wrangler --version)
    print_status "success" "Wrangler installed: $WRANGLER_VERSION"
else
    print_status "warning" "Wrangler not installed globally, will use npx"
fi

cd ../..

# Check Python backend
echo ""
echo "🔧 Checking Python Backend Dependencies..."
cd backend/python_engine
if [ -f "requirements.txt" ]; then
    print_status "success" "requirements.txt exists"
    echo "Installing Python dependencies..."
    pip install -r requirements.txt > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        print_status "success" "Python dependencies installed"
    else
        print_status "error" "Failed to install Python dependencies"
        exit 1
    fi
else
    print_status "error" "requirements.txt not found"
    exit 1
fi

cd ../..

echo ""
echo "🔐 Checking Environment Variables..."

# Check for required environment variables
REQUIRED_VARS=(
    "NETLIFY_AUTH_TOKEN"
    "NETLIFY_SITE_ID"
    "CLOUDFLARE_API_TOKEN"
    "CLOUDFLARE_ACCOUNT_ID"
    "NEXT_PUBLIC_API_URL"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -n "${!var}" ]; then
        print_status "success" "$var is set"
    else
        print_status "warning" "$var is not set (will need to be configured in GitHub Secrets)"
    fi
done

echo ""
echo "📋 GitHub Actions Workflows..."

# Check if GitHub Actions workflows exist
if [ -f ".github/workflows/deploy-all.yml" ]; then
    print_status "success" "Main deployment workflow exists"
else
    print_status "error" "Main deployment workflow not found"
fi

if [ -f ".github/workflows/deploy-netlify.yml" ]; then
    print_status "success" "Netlify deployment workflow exists"
else
    print_status "error" "Netlify deployment workflow not found"
fi

if [ -f ".github/workflows/deploy-cloudflare.yml" ]; then
    print_status "success" "Cloudflare deployment workflow exists"
else
    print_status "error" "Cloudflare deployment workflow not found"
fi

if [ -f ".github/workflows/monitor-deployments.yml" ]; then
    print_status "success" "Monitoring workflow exists"
else
    print_status "error" "Monitoring workflow not found"
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Set up GitHub Secrets in your repository settings"
echo "2. Configure your Netlify site"
echo "3. Configure your Cloudflare Workers"
echo "4. Push to main branch to trigger deployment"
echo ""
echo "📖 For detailed instructions, see: DEPLOYMENT_GUIDE.md"
echo ""
print_status "success" "Deployment setup verification complete!"
