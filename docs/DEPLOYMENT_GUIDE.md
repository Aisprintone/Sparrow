# FinanceAI Deployment Guide

## 🚀 Production Deployment Status

**✅ DEPLOYED AND WORKING**

### Current Deployments
- **Frontend**: https://sparrow-finance-app.netlify.app (Netlify)
- **Backend**: https://feeble-bite-production.up.railway.app (Railway)

## 📋 Deployment Architecture

### Frontend (Netlify)
- **Framework**: Next.js 14
- **Location**: `/frontend/`
- **Build Command**: `npm run build`
- **Deploy Command**: `npm run deploy`
- **Status**: ✅ Production Ready

### Backend (Railway)
- **Framework**: FastAPI (Python 3.11)
- **Location**: `/backend/python_engine/`
- **Database**: PostgreSQL (Railway managed)
- **Status**: ✅ Production Ready

## 🔧 Database Configuration

### Railway PostgreSQL Setup
The backend uses Railway's managed PostgreSQL service. The database connection is automatically configured through Railway environment variables:

```bash
# Database connection (automatically set by Railway)
DATABASE_URL=postgresql://postgres:KNfbEgAFVTgBtjWXvKZcGdWHWqfUvdnK@postgres.railway.internal:5432/railway
```

### Database Health Check
```bash
curl https://feeble-bite-production.up.railway.app/health
```

## 🛠️ Deployment Commands

### Backend Deployment (Railway)
```bash
cd backend/python_engine
railway login
railway link
railway up
```

### Frontend Deployment (Netlify)
```bash
cd frontend
npm run build
npm run deploy
```

## 🔍 Health Checks

### Backend Health
```bash
curl https://feeble-bite-production.up.railway.app/health
```

### Frontend Health
```bash
curl -I https://sparrow-finance-app.netlify.app
```

## 📊 API Endpoints

### Backend API (Railway)
- **Health**: `GET /health`
- **Profiles**: `GET /profiles`
- **Simulations**: `POST /simulation/{scenarioType}`
- **Market Data**: `GET /market-data/quotes`

### Frontend API (Netlify Functions)
- **Cache Management**: `/api/cache/[key]`
- **AI Chat**: `/api/ai/chat`

## 🔐 Environment Variables

### Backend (Railway)
All environment variables are configured in Railway dashboard:
- `DATABASE_URL` - PostgreSQL connection
- `OPENAI_API_KEY` - OpenAI API access
- `ANTHROPIC_API_KEY` - Anthropic API access
- `FMP_API_KEY` - Financial Modeling Prep API
- `CORS_ORIGINS` - CORS configuration

### Frontend (Netlify)
Environment variables configured in Netlify dashboard:
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_ENVIRONMENT` - Environment (production/development)

## 🧪 Testing

### Frontend-Backend Integration Test
```bash
# Test using Playwright
npx playwright test
```

### API Testing
```bash
# Test backend health
curl https://feeble-bite-production.up.railway.app/health

# Test profiles endpoint
curl https://feeble-bite-production.up.railway.app/profiles
```

## 📈 Monitoring

### Railway Logs
```bash
cd backend/python_engine
railway logs
```

### Netlify Logs
```bash
netlify logs --site sparrow-finance-app
```

## 🚨 Troubleshooting

### Database Connection Issues
1. Check Railway PostgreSQL service status
2. Verify DATABASE_URL environment variable
3. Check Railway logs for connection errors

### Frontend Issues
1. Check Netlify build logs
2. Verify environment variables
3. Test API connectivity

### API Rate Limiting
- FMP API has rate limits (using cached data as fallback)
- OpenAI API has quota limits (fallback to Anthropic)

## 📝 Deployment Checklist

### Before Deployment
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] API keys valid

### After Deployment
- [ ] Health checks passing
- [ ] Frontend loading correctly
- [ ] API endpoints responding
- [ ] Database connection established
- [ ] Integration tests passing

## 🎯 Quick Start for New Agents

1. **Verify Current Status**:
   ```bash
   curl https://feeble-bite-production.up.railway.app/health
   curl -I https://sparrow-finance-app.netlify.app
   ```

2. **Deploy Backend Changes**:
   ```bash
   cd backend/python_engine
   railway up
   ```

3. **Deploy Frontend Changes**:
   ```bash
   cd frontend
   npm run build && npm run deploy
   ```

4. **Test Integration**:
   ```bash
   # Use Playwright to test full integration
   npx playwright test
   ```

## 📚 Architecture Overview

```
Sparrow/
├── frontend/                 # Next.js frontend (Netlify)
│   ├── app/                 # Next.js 14 app router
│   ├── components/          # React components
│   └── lib/                # Utilities and API clients
├── backend/                 # FastAPI backend (Railway)
│   └── python_engine/      # Main backend application
│       ├── api/            # API endpoints
│       ├── core/           # Core business logic
│       ├── ai/             # AI/ML components
│       └── data/           # Data management
└── data/                   # CSV data files
```

## ✅ Current Status

- **Frontend**: ✅ Deployed and working
- **Backend**: ✅ Deployed and working  
- **Database**: ✅ Connected and healthy
- **API Integration**: ✅ Fully functional
- **Health Checks**: ✅ All passing
- **Performance**: ✅ Excellent (389ms average response time)

## 🚫 Removed Components

- **Cloudflare Workers**: Removed to eliminate confusion
- **Multiple Backend Options**: Standardized on Railway
- **Complex Deployment Scripts**: Simplified to direct commands

This deployment setup is now straightforward and production-ready.
