# Sparrow.io Cloudflare Workers Deployment

This document outlines the deployment setup for the Sparrow.io backend using Cloudflare Workers with GitHub Actions.

## Architecture Overview

- **Backend**: Cloudflare Workers (TypeScript)
- **Database**: Cloudflare D1 (SQLite)
- **Cache**: Cloudflare KV
- **Deployment**: GitHub Actions CI/CD
- **Domain**: api.sparrow.io

## Prerequisites

1. **Cloudflare Account**: You need a Cloudflare account with Workers enabled
2. **GitHub Repository**: Code must be pushed to a GitHub repository
3. **API Tokens**: Cloudflare API token with appropriate permissions

## Required Secrets

Add these secrets to your GitHub repository (Settings > Secrets and variables > Actions):

### `CLOUDFLARE_API_TOKEN`
- Go to Cloudflare Dashboard > My Profile > API Tokens
- Create a new token with the following permissions:
  - Account: Workers Scripts:Edit
  - Account: Workers Routes:Edit
  - Zone: Workers Routes:Edit (for your domain)
  - Account: D1:Edit
  - Account: KV Storage:Edit

### `CLOUDFLARE_ACCOUNT_ID`
- Found in Cloudflare Dashboard > Workers & Pages > Overview
- Copy your Account ID

## Deployment Process

### 1. Initial Setup

```bash
# Navigate to the workers directory
cd sparrow-workers/sparrow-backend

# Install dependencies
npm install

# Authenticate with Cloudflare (first time only)
npx wrangler login
```

### 2. Database Setup

```bash
# Create D1 database
npx wrangler d1 create sparrow-profiles

# Apply schema
npx wrangler d1 execute sparrow-profiles --file=../../schema.sql
```

### 3. KV Namespace Setup

```bash
# Create KV namespace
npx wrangler kv:namespace create SPARROW_CACHE
```

### 4. Environment Configuration

The project uses two environments:
- **Development**: Uses `wrangler.jsonc`
- **Production**: Uses `wrangler.production.jsonc`

### 5. GitHub Actions Workflow

The `.github/workflows/deploy.yml` file handles:
- Automatic deployment on push to main branch
- Running tests before deployment
- Deploying to both staging and production environments
- Using GitHub secrets for secure credential management

## Deployment Commands

### Manual Deployment

```bash
# Development deployment
npm run deploy

# Production deployment
npm run deploy:prod
```

### Automated Deployment

The GitHub Actions workflow automatically deploys when:
- Code is pushed to the `main` branch
- Pull requests are created (runs tests only)

## Environment Variables

The following environment variables are configured:

- `ENVIRONMENT`: Set to "production" in production environment
- Database binding: `DB` (D1 database)
- Cache binding: `SPARROW_CACHE` (KV namespace)

## Monitoring and Observability

- **Logs**: Available in Cloudflare Dashboard > Workers > sparrow-backend > Logs
- **Analytics**: Real-time analytics in the Workers dashboard
- **Performance**: Built-in performance monitoring

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Ensure `CLOUDFLARE_API_TOKEN` is correctly set in GitHub secrets
   - Verify token has appropriate permissions

2. **Database Connection Issues**
   - Check D1 database ID in wrangler configuration
   - Verify database exists and is accessible

3. **Deployment Failures**
   - Check GitHub Actions logs for detailed error messages
   - Verify all required secrets are set

### Debug Commands

```bash
# Test local development
npm run dev

# Check wrangler configuration
npx wrangler whoami

# List D1 databases
npx wrangler d1 list

# List KV namespaces
npx wrangler kv:namespace list
```

## Security Considerations

1. **API Token Security**: Never commit API tokens to the repository
2. **Environment Separation**: Production and development environments are separate
3. **CORS Configuration**: Properly configured for sparrow.io domain
4. **Database Security**: D1 databases are isolated per environment

## Performance Optimization

The deployment includes several performance optimizations:

1. **KV Caching**: Frequently accessed data is cached in KV
2. **Database Indexing**: Optimized queries with proper indexing
3. **Response Compression**: Automatic compression by Cloudflare
4. **Edge Computing**: Global deployment for low latency

## Rollback Strategy

To rollback a deployment:

1. **GitHub**: Revert to previous commit and push
2. **Manual**: Use `wrangler rollback` command
3. **Dashboard**: Use Cloudflare Workers dashboard to rollback

## Support

For deployment issues:
1. Check GitHub Actions logs
2. Review Cloudflare Workers dashboard
3. Verify configuration files
4. Test locally with `npm run dev`
