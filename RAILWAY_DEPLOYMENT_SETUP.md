# Railway Deployment Setup Guide

## Quick Setup Commands

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login to Railway
railway login

# 3. Initialize project (if not already done)
railway init

# 4. Link to existing project (if already created)
railway link

# 5. Add PostgreSQL database
railway add postgresql

# 6. Run the setup script
chmod +x scripts/setup-railway-env.sh
./scripts/setup-railway-env.sh

# 7. Deploy
railway up
```

## Environment Variables Setup

### Required Environment Variables

Set these in Railway dashboard or via CLI:

```bash
# Core Application
ENVIRONMENT=production
LOG_LEVEL=INFO
CORS_ORIGINS=*
PORT=8000
HOST=0.0.0.0

# Database (automatically set by Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# API Keys (REPLACE WITH YOUR ACTUAL KEYS)
OPENAI_API_KEY=sk-your-openai-api-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here
PLAID_CLIENT_ID=your-plaid-client-id-here
PLAID_CLIENT_SECRET=your-plaid-client-secret-here
CHASE_API_KEY=your-chase-api-key-here

# Application Settings
CACHE_TTL_SECONDS=3600
NODE_ENV=production
PYTHON_VERSION=3.11

# Railway Specific
RAILWAY_DEPLOYMENT_OVERLAP_SECONDS=30
```

### Setting Variables via CLI

```bash
# Core variables
railway variables set ENVIRONMENT=production
railway variables set LOG_LEVEL=INFO
railway variables set CORS_ORIGINS="*"
railway variables set PORT=8000
railway variables set HOST=0.0.0.0

# API Keys (replace with actual keys)
railway variables set OPENAI_API_KEY="sk-your-openai-api-key-here"
railway variables set ANTHROPIC_API_KEY="sk-ant-your-anthropic-api-key-here"
railway variables set PLAID_CLIENT_ID="your-plaid-client-id-here"
railway variables set PLAID_CLIENT_SECRET="your-plaid-client-secret-here"
railway variables set CHASE_API_KEY="your-chase-api-key-here"

# Application settings
railway variables set CACHE_TTL_SECONDS=3600
railway variables set NODE_ENV=production
railway variables set PYTHON_VERSION=3.11
railway variables set RAILWAY_DEPLOYMENT_OVERLAP_SECONDS=30
```

## Database Setup

The PostgreSQL database will be automatically configured by Railway. The `DATABASE_URL` will be set automatically when you add the PostgreSQL service.

### Database Initialization

After deployment, the database will be automatically initialized with the schema from `schema.sql`.

## Frontend Configuration

Update your frontend environment variables:

```bash
# In your frontend directory
echo "NEXT_PUBLIC_API_URL=https://your-railway-app.railway.app" > .env.local
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check if PostgreSQL is added
   railway add postgresql
   
   # Check database URL
   railway variables
   ```

2. **Import Errors**
   ```bash
   # Check logs
   railway logs
   
   # Redeploy
   railway up
   ```

3. **Health Check Failed**
   ```bash
   # Check health endpoint
   curl https://your-app.railway.app/health
   
   # Check database health
   curl https://your-app.railway.app/db/health
   ```

### Debugging Commands

```bash
# View logs
railway logs

# View variables
railway variables

# Check status
railway status

# Open app
railway open

# Redeploy
railway up

# Restart service
railway restart
```

## API Keys Setup

### Getting API Keys

1. **OpenAI API Key**
   - Go to https://platform.openai.com/api-keys
   - Create a new API key
   - Replace `sk-your-openai-api-key-here` with your actual key

2. **Anthropic API Key**
   - Go to https://console.anthropic.com/
   - Create a new API key
   - Replace `sk-ant-your-anthropic-api-key-here` with your actual key

3. **Plaid Keys**
   - Go to https://dashboard.plaid.com/
   - Get your Client ID and Secret
   - Replace the placeholder values

4. **Chase API Key**
   - Contact Chase for API access
   - Replace the placeholder value

### Setting API Keys in Railway

```bash
# Via CLI
railway variables set OPENAI_API_KEY="sk-abc123..."

# Or via Railway Dashboard
# Go to your project → Variables → Add each key
```

## Deployment Checklist

- [ ] Railway CLI installed and logged in
- [ ] Project linked to Railway
- [ ] PostgreSQL database added
- [ ] Environment variables set
- [ ] API keys configured
- [ ] Application deployed
- [ ] Health checks passing
- [ ] Frontend configured with backend URL
- [ ] Database initialized
- [ ] All endpoints working

## Monitoring

### Health Endpoints

- **Main Health**: `https://your-app.railway.app/health`
- **Database Health**: `https://your-app.railway.app/db/health`
- **Root**: `https://your-app.railway.app/`

### Logs

```bash
# View real-time logs
railway logs --follow

# View specific deployment logs
railway logs --deployment
```

## Success Indicators

✅ Application starts without errors  
✅ Health endpoint returns 200  
✅ Database connection established  
✅ All API endpoints responding  
✅ Frontend can connect to backend  
✅ No import errors in logs  
✅ Database tables created successfully
