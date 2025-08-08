#!/bin/bash

# Deploy Python backend to Railway
echo "Deploying Python backend to Railway..."

# Install Railway CLI if not installed
if ! command -v railway &> /dev/null; then
    echo "Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Deploy to Railway
railway up

echo "Deployment complete!"
echo "Your API will be available at: https://your-app-name.railway.app"
