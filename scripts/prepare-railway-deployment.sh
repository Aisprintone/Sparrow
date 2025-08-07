#!/bin/bash

# Prepare Railway Deployment Script
# Copies CSV data files to the backend directory for Railway deployment

set -e

echo "🚂 Preparing Railway Deployment"
echo "================================"

# Navigate to backend directory
cd backend/python_engine

# Create data directory if it doesn't exist
mkdir -p data

# Copy CSV files from root data directory
echo "📁 Copying CSV data files..."
cp ../../data/*.csv data/ 2>/dev/null || {
    echo "⚠️ Warning: Some CSV files not found"
    echo "📋 Available files in data directory:"
    ls -la data/ 2>/dev/null || echo "No files found"
}

echo "✅ Railway deployment preparation complete!"
echo "📁 Data directory contents:"
ls -la data/

echo ""
echo "🎯 Next steps:"
echo "1. Deploy to Railway: railway up"
echo "2. Check deployment: railway logs"
echo "3. Test health endpoint: curl https://your-app.railway.app/health"
