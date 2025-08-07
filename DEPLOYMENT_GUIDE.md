# Deployment Guide

This guide covers automated deployment to Netlify (frontend) and Cloudflare Workers (backend) using GitHub Actions.

## Prerequisites

### 1. GitHub Repository Setup
- Push your code to GitHub
- Enable GitHub Actions in your repository settings

### 2. Netlify Setup
1. Create a Netlify account
2. Create a new site from GitHub
3. Get your Netlify credentials:
   - Go to User Settings → Applications → Personal access tokens
   - Create a new token
   - Get your Site ID from Site Settings → General → Site information

### 3. Cloudflare Setup
1. Create a Cloudflare account
2. Get your Cloudflare credentials:
   - Go to My Profile → API Tokens
   - Create a new token with Workers permissions
   - Get your Account ID from the dashboard

## GitHub Secrets Setup

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

### Netlify Secrets
```
NETLIFY_AUTH_TOKEN=your_netlify_auth_token
NETLIFY_SITE_ID=your_netlify_site_id
```

### Cloudflare Secrets
```
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
```

### API Configuration
```
NEXT_PUBLIC_API_URL=https://your-cloudflare-worker.your-subdomain.workers.dev
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_CLIENT_SECRET=your_plaid_client_secret
CHASE_API_KEY=your_chase_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

## Deployment Workflows

### 1. Individual Deployments
- `deploy-netlify.yml`: Deploys frontend to Netlify
- `deploy-cloudflare.yml`: Deploys backend to Cloudflare Workers

### 2. Combined Deployment
- `deploy-all.yml`: Deploys both services with testing

## Workflow Triggers

### Path-based Triggers
- Frontend changes: `frontend/**`
- Backend changes: `backend/**`, `cloudflare-workers/**`
- Workflow changes: `.github/workflows/**`

### Branch Triggers
- `main`: Production deployments
- `develop`: Staging deployments
- Pull requests: Test deployments

## Deployment Process

### 1. Frontend (Netlify)
1. Install dependencies
2. Run tests
3. Build application
4. Deploy to Netlify
5. Post deployment comments

### 2. Backend (Cloudflare Workers)
1. Install dependencies
2. Run tests
3. Build Workers
4. Deploy to Cloudflare
5. Verify Python backend modules

### 3. Combined Process
1. Run all tests
2. Deploy frontend and backend in parallel
3. Notify deployment status

## Environment Configuration

### Frontend Environment Variables
```bash
NEXT_PUBLIC_API_URL=https://your-cloudflare-worker.your-subdomain.workers.dev
```

### Backend Environment Variables
```bash
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_CLIENT_SECRET=your_plaid_client_secret
CHASE_API_KEY=your_chase_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
```

## Monitoring Deployments

### GitHub Actions
- View deployment status in Actions tab
- Check logs for any errors
- Monitor deployment times

### Netlify Dashboard
- View deployment status
- Check build logs
- Monitor site performance

### Cloudflare Dashboard
- View Workers deployment status
- Monitor Workers performance
- Check KV storage usage

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check dependency versions
   - Verify environment variables
   - Review build logs

2. **Deployment Failures**
   - Verify API tokens
   - Check account permissions
   - Review deployment logs

3. **Cache Issues**
   - Clear Cloudflare KV cache
   - Clear Netlify cache
   - Restart Workers

### Debug Commands

```bash
# Test frontend build locally
cd frontend
npm run build

# Test backend build locally
cd cloudflare-workers/financeai-backend
npm run build

# Test Python backend
cd backend/python_engine
python -c "import api.main; print('Backend loaded successfully')"
```

## Performance Optimization

### Caching Strategy
- Frontend: Edge functions + localStorage
- Backend: Cloudflare KV + memory cache
- API responses: 30s-5min TTL based on data type

### CDN Configuration
- Netlify: Global CDN with edge functions
- Cloudflare: Global CDN with Workers

## Security Considerations

### Environment Variables
- Never commit secrets to repository
- Use GitHub Secrets for sensitive data
- Rotate API tokens regularly

### Access Control
- Limit API token permissions
- Use least privilege principle
- Monitor access logs

## Cost Optimization

### Netlify
- Free tier: 100GB bandwidth/month
- Pro tier: $19/month for more features

### Cloudflare Workers
- Free tier: 100,000 requests/day
- Paid tier: $5/month for additional requests

## Support

For deployment issues:
1. Check GitHub Actions logs
2. Review service-specific dashboards
3. Consult documentation for each service
4. Contact support if needed
