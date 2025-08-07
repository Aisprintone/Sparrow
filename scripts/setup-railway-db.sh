#!/bin/bash

# Railway Database Setup Script
# Sets up PostgreSQL database on Railway

set -e

echo "🗄️ Setting up Railway database..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Login to Railway (if not already logged in)
echo "🔐 Logging into Railway..."
railway login

# Create PostgreSQL service
echo "📦 Creating PostgreSQL service..."
railway service create postgresql

# Get the service ID
SERVICE_ID=$(railway service list --json | jq -r '.[] | select(.name == "postgresql") | .id')

if [ -z "$SERVICE_ID" ]; then
    echo "❌ Failed to get PostgreSQL service ID"
    exit 1
fi

echo "✅ PostgreSQL service created with ID: $SERVICE_ID"

# Set up environment variables
echo "🔧 Setting up environment variables..."
railway variables set DATABASE_URL="postgresql://postgres:password@localhost:5432/sparrow"

# Initialize database
echo "🗃️ Initializing database schema..."
sleep 10  # Wait for database to be ready

# Test database connection
echo "🧪 Testing database connection..."
railway run "python -c \"from core.database import db_config; print('✅ Database connection successful' if db_config.test_connection() else '❌ Database connection failed')\""

# Initialize database with schema
echo "📋 Running database initialization..."
railway run "python -c \"from core.database import init_database; print('✅ Database initialized' if init_database() else '❌ Database initialization failed')\""

echo "✅ Railway database setup complete!"
echo "🌐 Your database should be available at the DATABASE_URL environment variable"
echo "🔗 You can view your database in the Railway dashboard"
