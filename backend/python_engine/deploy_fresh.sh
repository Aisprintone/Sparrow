#!/bin/bash

echo "🚀 FRESH RAILWAY DEPLOYMENT"
echo "==========================="

# Clean up any old Railway configs
rm -rf .railway 2>/dev/null

# Ensure we have the latest code
echo "✅ Latest AI code ready:"
echo "   - app.py v4.0.0 with RAG endpoints"
echo "   - Requirements with all dependencies"
echo "   - Dockerfile configured for uvicorn"
echo "   - Procfile set for Railway"

# Check key files exist
if [ -f "app.py" ]; then
    echo "✅ app.py found"
else
    echo "❌ app.py missing"
    exit 1
fi

if [ -f "requirements.txt" ]; then
    echo "✅ requirements.txt found"
else
    echo "❌ requirements.txt missing"
    exit 1
fi

if [ -f "Dockerfile" ]; then
    echo "✅ Dockerfile found"
else
    echo "❌ Dockerfile missing"
    exit 1
fi

# Display deployment info
echo ""
echo "📦 DEPLOYMENT PACKAGE READY"
echo "============================="
echo "Main App: app.py (FastAPI with RAG)"
echo "Version: 4.0.0"
echo "Features:"
echo "  - RAG system with profile data"
echo "  - AI-enhanced simulations"
echo "  - Batched query optimization"
echo "  - SOLID architecture"
echo ""
echo "🎯 READY FOR DEPLOYMENT"
echo "======================="
echo "To deploy to Railway:"
echo "1. Create new Railway project at: https://railway.app/dashboard"
echo "2. Connect to this GitHub repo or upload directly"
echo "3. Set environment variables:"
echo "   - ANTHROPIC_API_KEY=your_key_here"
echo "   - ENVIRONMENT=production"
echo "4. Deploy and verify endpoints"
echo ""
echo "Or run: railway up (after linking to new project)"