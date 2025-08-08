# Railway Setup Guide for Sparrow Backend

## Overview

This guide covers setting up the Sparrow backend on Railway with PostgreSQL database and Redis caching.

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **Railway CLI**: Install with `npm install -g @railway/cli`
3. **Git Repository**: Your code should be in a Git repository

## Step 1: Railway Project Setup

### Create Railway Project
```bash
# Login to Railway
railway login

# Create new project
railway init

# Link to existing project (if you have one)
railway link
```

### Add Services
```bash
# Add PostgreSQL service
railway service create postgresql

# Add Redis service (optional, for caching)
railway service create redis
```

## Step 2: Environment Variables

Set up the following environment variables in Railway dashboard:

### Required Variables
```bash
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/sparrow

# API Keys (set these in Railway dashboard)
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_CLIENT_SECRET=your_plaid_client_secret
CHASE_API_KEY=your_chase_api_key

# Application Settings
ENVIRONMENT=production
LOG_LEVEL=INFO
CORS_ORIGINS=*
CACHE_TTL_SECONDS=3600
```

### Optional Variables
```bash
# Redis (if using Redis caching)
REDIS_URL=redis://localhost:6379

# Local development fallback
LOCAL_DATABASE_URL=postgresql://localhost/sparrow
```

## Step 3: Deploy Backend

### Automatic Deployment
```bash
# Deploy to Railway
railway up

# Or deploy specific service
railway up --service backend
```

### Manual Deployment
```bash
# Navigate to backend directory
cd backend/python_engine

# Deploy
railway up
```

## Step 4: Database Setup

### Initialize Database
```bash
# Run database initialization
railway run "python -c \"from core.database import init_database; init_database()\""
```

### Verify Database
```bash
# Check database health
curl https://your-app.railway.app/db/health

# Initialize database via API
curl -X POST https://your-app.railway.app/db/init
```

## Step 5: Verify Deployment

### Health Check
```bash
# Check application health
curl https://your-app.railway.app/health
```

### Test Endpoints
```bash
# Test root endpoint
curl https://your-app.railway.app/

# Test profiles endpoint
curl https://your-app.railway.app/profiles

# Test simulation endpoint
curl -X POST https://your-app.railway.app/simulation/emergency_fund \
  -H "Content-Type: application/json" \
  -d '{"profile_id": "1", "scenario_type": "emergency_fund"}'
```

## Step 6: Update Frontend Configuration

Update your frontend to point to the Railway backend:

### Netlify Configuration
```toml
# frontend/netlify.toml
[build.environment]
BACKEND_URL = "https://your-app.railway.app"
```

### Environment Variables
```bash
# Set in your frontend deployment
NEXT_PUBLIC_API_URL=https://your-app.railway.app
```

## Step 7: Monitoring and Logs

### View Logs
```bash
# View application logs
railway logs

# View specific service logs
railway logs --service backend
```

### Monitor Performance
```bash
# Check Railway dashboard for:
# - CPU usage
# - Memory usage
# - Request count
# - Error rates
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check DATABASE_URL environment variable
   railway variables list
   
   # Test database connection
   railway run "python -c \"from core.database import db_config; print(db_config.test_connection())\""
   ```

2. **Missing Dependencies**
   ```bash
   # Check requirements.txt is up to date
   pip install -r requirements.txt
   
   # Verify all imports work
   python -c "import api.main"
   ```

3. **Port Issues**
   ```bash
   # Ensure PORT environment variable is set
   echo $PORT
   
   # Check if port 8000 is available
   lsof -i :8000
   ```

4. **Memory Issues**
   ```bash
   # Check memory usage
   railway logs --service backend | grep memory
   
   # Consider upgrading Railway plan for more memory
   ```

### Performance Optimization

1. **Database Connection Pooling**
   - Already configured in `core/database.py`
   - Uses SQLAlchemy connection pooling

2. **Redis Caching**
   - Configured in `core/cache_manager.py`
   - Falls back to in-memory cache if Redis unavailable

3. **Async Operations**
   - All database operations are async
   - FastAPI handles concurrent requests

## File Structure

```
backend/python_engine/
├── main.py                 # Entry point for Railway
├── requirements.txt        # Python dependencies
├── railway.json           # Railway configuration
├── Procfile              # Railway process file
├── runtime.txt           # Python version
├── core/
│   ├── database.py       # Database configuration
│   ├── cache_manager.py  # Redis caching
│   └── config.py         # Application config
├── api/
│   ├── main.py          # FastAPI application
│   └── workflow_endpoints.py
└── workflows/
    ├── workflow_engine.py
    └── workflow_definitions.py
```

## Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `REDIS_URL` | Redis connection string | No | - |
| `OPENAI_API_KEY` | OpenAI API key | No | - |
| `ANTHROPIC_API_KEY` | Anthropic API key | No | - |
| `PLAID_CLIENT_ID` | Plaid client ID | No | - |
| `PLAID_CLIENT_SECRET` | Plaid client secret | No | - |
| `CHASE_API_KEY` | Chase API key | No | - |
| `ENVIRONMENT` | Environment name | No | `production` |
| `LOG_LEVEL` | Logging level | No | `INFO` |
| `CACHE_TTL_SECONDS` | Cache TTL in seconds | No | `3600` |
| `PORT` | Application port | No | `8000` |

## Security Considerations

1. **Environment Variables**: Never commit API keys to Git
2. **CORS**: Configure CORS origins properly for production
3. **Database**: Use strong passwords for PostgreSQL
4. **Redis**: Configure Redis with authentication if needed
5. **HTTPS**: Railway provides HTTPS by default

## Scaling

1. **Horizontal Scaling**: Railway supports multiple replicas
2. **Database Scaling**: Upgrade PostgreSQL plan as needed
3. **Caching**: Redis helps with read-heavy workloads
4. **CDN**: Consider using a CDN for static assets

## Support

- **Railway Documentation**: [docs.railway.app](https://docs.railway.app)
- **FastAPI Documentation**: [fastapi.tiangolo.com](https://fastapi.tiangolo.com)
- **PostgreSQL Documentation**: [postgresql.org/docs](https://postgresql.org/docs)
- **Redis Documentation**: [redis.io/documentation](https://redis.io/documentation)
