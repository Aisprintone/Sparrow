# Railway Deployment Checklist

## Pre-Deployment Setup

### 1. Railway CLI Setup
- [ ] Install Railway CLI: `npm install -g @railway/cli`
- [ ] Login to Railway: `railway login`
- [ ] Initialize project: `railway init` (if new project)
- [ ] Link to existing project: `railway link` (if existing project)

### 2. Database Setup
- [ ] Add PostgreSQL: `railway add postgresql`
- [ ] Verify DATABASE_URL is set: `railway variables`
- [ ] Check database connection: `railway logs`

### 3. Environment Variables Setup

#### Core Application Variables
- [ ] `ENVIRONMENT=production`
- [ ] `LOG_LEVEL=INFO`
- [ ] `CORS_ORIGINS=*`
- [ ] `PORT=8000`
- [ ] `HOST=0.0.0.0`
- [ ] `CACHE_TTL_SECONDS=3600`
- [ ] `NODE_ENV=production`
- [ ] `PYTHON_VERSION=3.11`
- [ ] `RAILWAY_DEPLOYMENT_OVERLAP_SECONDS=30`

#### API Keys (Set these in Railway environment variables)
- [ ] `PLAID_CLIENT_ID` - Plaid client ID
- [ ] `PLAID_CLIENT_SECRET` - Plaid client secret  
- [ ] `OPENAI_API_KEY` - OpenAI API key
- [ ] `ANTHROPIC_API_KEY` - Anthropic API key
- [ ] `FMP_API_KEY` - Financial Modeling Prep API key
- [ ] `CLOUDFLARE_TOKEN` - Cloudflare API token
- [ ] `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account ID
- [ ] `CHASE_API_KEY` - Chase Developer API key

### 4. Backend Code Fixes
- [ ] ✅ Updated `main.py` with error handling
- [ ] ✅ Updated `railway.toml` with proper configuration
- [ ] ✅ Updated `Dockerfile` with better health checks
- [ ] ✅ Updated `core/database.py` with graceful fallbacks
- [ ] ✅ Created setup script: `scripts/setup-railway-env.sh`

### 5. Frontend Configuration
- [ ] Update API client base URL
- [ ] Set `NEXT_PUBLIC_API_URL` in frontend `.env.local`
- [ ] Test frontend-backend connection

## Deployment Commands

### Quick Setup (Run these in order)

```bash
# 1. Navigate to backend
cd backend/python_engine

# 2. Install Railway CLI (if not already installed)
npm install -g @railway/cli

# 3. Login to Railway
railway login

# 4. Link to project (if not already linked)
railway link

# 5. Add PostgreSQL database
railway add postgresql

# 6. Run setup script
cd ../..
chmod +x scripts/setup-railway-env.sh
./scripts/setup-railway-env.sh

# 7. Deploy
cd backend/python_engine
railway up
```

### Manual Environment Variable Setup

If the setup script doesn't work, set variables manually:

```bash
# Core variables
railway variables set ENVIRONMENT=production
railway variables set LOG_LEVEL=INFO
railway variables set CORS_ORIGINS="*"
railway variables set PORT=8000
railway variables set HOST=0.0.0.0
railway variables set CACHE_TTL_SECONDS=3600
railway variables set NODE_ENV=production
railway variables set PYTHON_VERSION=3.11
railway variables set RAILWAY_DEPLOYMENT_OVERLAP_SECONDS=30

# API Keys (Set your actual API keys)
railway variables set OPENAI_API_KEY="your-openai-api-key"
railway variables set ANTHROPIC_API_KEY="your-anthropic-api-key"
railway variables set PLAID_CLIENT_ID="your-plaid-client-id"
railway variables set PLAID_CLIENT_SECRET="your-plaid-client-secret"
railway variables set CHASE_API_KEY="your-chase-api-key"
railway variables set FMP_API_KEY="your-fmp-api-key"
railway variables set CLOUDFLARE_TOKEN="your-cloudflare-token"
railway variables set CLOUDFLARE_ACCOUNT_ID="your-cloudflare-account-id"
```

## Post-Deployment Verification

### 1. Health Checks
- [ ] Main health endpoint: `curl https://your-app.railway.app/health`
- [ ] Database health: `curl https://your-app.railway.app/db/health`
- [ ] Root endpoint: `curl https://your-app.railway.app/`

### 2. Log Verification
- [ ] Check for import errors: `railway logs`
- [ ] Check for database connection errors
- [ ] Check for API key errors
- [ ] Verify application startup

### 3. Database Verification
- [ ] Database connection established
- [ ] Tables created successfully
- [ ] Schema initialized properly

### 4. API Endpoint Tests
- [ ] `/` - Root endpoint
- [ ] `/health` - Health check
- [ ] `/db/health` - Database health
- [ ] `/profiles` - Get profiles
- [ ] `/simulation/emergency_fund` - Simulation endpoint

### 5. Frontend Integration
- [ ] Frontend can connect to backend
- [ ] API calls working
- [ ] No CORS errors
- [ ] Authentication working (if applicable)

## Troubleshooting Commands

### Debugging
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

### Common Issues and Solutions

#### 1. Database Connection Failed
```bash
# Check if PostgreSQL is added
railway add postgresql

# Check database URL
railway variables | grep DATABASE_URL

# Check logs for database errors
railway logs | grep -i database
```

#### 2. Import Errors
```bash
# Check logs for import errors
railway logs | grep -i import

# Redeploy
railway up

# Check if all dependencies are installed
railway run pip list
```

#### 3. Health Check Failed
```bash
# Check health endpoint
curl https://your-app.railway.app/health

# Check database health
curl https://your-app.railway.app/db/health

# Check logs
railway logs
```

#### 4. API Keys Not Working
```bash
# Check if API keys are set
railway variables | grep API_KEY

# Set API keys manually
railway variables set OPENAI_API_KEY="your-actual-key"
```

## Success Indicators

✅ Application starts without errors  
✅ Health endpoint returns 200  
✅ Database connection established  
✅ All API endpoints responding  
✅ Frontend can connect to backend  
✅ No import errors in logs  
✅ Database tables created successfully  
✅ API keys configured and working  
✅ CORS properly configured  
✅ All environment variables set  

## Next Steps After Deployment

1. **Update Frontend Configuration**
   ```bash
   # In frontend directory
   echo "NEXT_PUBLIC_API_URL=https://your-app.railway.app" > .env.local
   ```

2. **Test All Endpoints**
   ```bash
   # Test health
   curl https://your-app.railway.app/health
   
   # Test profiles
   curl https://your-app.railway.app/profiles
   
   # Test simulation
   curl -X POST https://your-app.railway.app/simulation/emergency_fund \
     -H "Content-Type: application/json" \
     -d '{"profile_id": "1", "scenario_type": "emergency_fund"}'
   ```

3. **Monitor Performance**
   ```bash
   # View real-time logs
   railway logs --follow
   
   # Check metrics in Railway dashboard
   railway open
   ```

4. **Set Up Monitoring**
   - Configure alerts in Railway dashboard
   - Set up external monitoring (if needed)
   - Monitor database performance
   - Track API response times
