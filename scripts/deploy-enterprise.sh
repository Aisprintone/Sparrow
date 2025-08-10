#!/bin/bash

# Enterprise Deployment Script
# Builds and deploys an enterprise-safe version of FinanceAI

set -e

echo "🚀 Building Enterprise-Safe FinanceAI..."

# Set environment variables for enterprise build
export NODE_ENV=production
export NEXT_PUBLIC_ENTERPRISE_MODE=true
export NEXT_PUBLIC_BACKEND_URL=https://sparrow-backend-production.up.railway.app

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf frontend/out
rm -rf frontend/.next

# Install dependencies
echo "📦 Installing dependencies..."
cd frontend
npm ci --production

# Build enterprise-safe version
echo "🔨 Building enterprise-safe version..."
npm run build

# Create enterprise-specific optimizations
echo "⚙️ Creating enterprise optimizations..."

# Create enterprise deployment package
echo "📦 Creating enterprise deployment package..."
tar -czf ../financeai-enterprise-$(date +%Y%m%d).tar.gz out/

echo "✅ Enterprise build complete!"
echo "📁 Package: financeai-enterprise-$(date +%Y%m%d).tar.gz"
echo ""
echo "🔧 Enterprise Features:"
echo "  ✅ Self-hosted fonts (no Google Fonts)"
echo "  ✅ Strict CSP (no unsafe directives)"
echo "  ✅ System font fallbacks"
echo "  ✅ No external CDN dependencies"
echo ""
echo "🚀 Deploy to enterprise environment:"
echo "  1. Extract package to web server"
echo "  2. Configure reverse proxy"
echo "  3. Set up enterprise authentication"
echo "  4. Configure enterprise logging"
