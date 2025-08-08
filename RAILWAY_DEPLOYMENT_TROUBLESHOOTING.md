# Railway Deployment Troubleshooting Guide

## Database Connection Issues

### Common Error: `connection to server at "postgres.railway.internal" failed: timeout expired`

This is the most common Railway deployment issue. Here's how to fix it:

### 1. Immediate Actions

#### Restart/Redeploy the Application
```bash
# From your project root
railway up --detach
```

#### Use the Restart Script
```bash
# Run the automated restart script
./scripts/restart-railway-deployment.sh
```

### 2. Check Railway Service Status

#### Verify Database Service
```bash
# Check if PostgreSQL service is running
railway status

# View recent logs
railway logs --tail 100

# Check environment variables
railway variables
```

#### Verify DATABASE_URL
The `DATABASE_URL` should be automatically set by Railway when you add a PostgreSQL service:
```bash
# Should show something like:
# DATABASE_URL=postgresql://postgres:password@postgres.railway.internal:5432/railway
railway variables | grep DATABASE_URL
```

### 3. Database Service Setup

#### Add PostgreSQL Service (if missing)
```bash
# Add PostgreSQL service to your project
railway add -d postgres

# Link your application to the database
railway link
```

#### Set Environment Variables
```bash
# Set DATABASE_URL to reference the PostgreSQL service
railway variables --set "DATABASE_URL=\${{Postgres.DATABASE_URL}}"
```

### 4. Configuration Optimizations

The following settings have been optimized in `railway.toml`:

```toml
# Increased timeouts for Railway
healthcheckTimeout = 300
restartPolicyMaxRetries = 15

# Database connection settings
RAILWAY_DATABASE_TIMEOUT = "120"
RAILWAY_DATABASE_RETRIES = "10"
RAILWAY_DATABASE_CONNECT_TIMEOUT = "120"
RAILWAY_DATABASE_STATEMENT_TIMEOUT = "120000"
RAILWAY_DATABASE_IDLE_TIMEOUT = "600000"

# PostgreSQL pool settings
PGPOOL_SIZE = "3"
PGMAX_OVERFLOW = "5"
PGPOOL_TIMEOUT = "60"
PGPOOL_RECYCLE = "600"
```

### 5. Database Connection Retry Logic

The application now includes robust retry logic:

- **Connection attempts**: 15 (increased from 10)
- **Base delay**: 5 seconds (increased from 3)
- **Exponential backoff**: With jitter for Railway
- **Connection timeout**: 120 seconds
- **Statement timeout**: 120 seconds
- **Idle timeout**: 600 seconds

### 6. Railway Dashboard Actions

#### Check Service Health
1. Go to Railway Dashboard
2. Select your project
3. Check if PostgreSQL service is "Healthy"
4. Verify the service is not in "Starting" or "Failed" state

#### Restart Services
1. In Railway Dashboard, select the problematic service
2. Click "Deploy" → "Redeploy"
3. Or use "Restart" if available

#### Check Environment Variables
1. Go to your application service
2. Click "Variables" tab
3. Verify `DATABASE_URL` is set correctly
4. Should reference: `${{Postgres.DATABASE_URL}}`

### 7. Advanced Troubleshooting

#### Test Database Connection Locally
```bash
# Connect to Railway database from local machine
railway connect

# This will open a psql shell if PostgreSQL client is installed
```

#### Check Railway Network Status
```bash
# View detailed service information
railway status --json

# Check service logs
railway logs --service postgres
```

#### Manual Database Setup
If automatic setup fails:
```bash
# Connect to database and run schema manually
railway connect
# Then run: \i schema.sql
```

### 8. Common Solutions

#### Solution 1: Wait and Retry
- Railway services can take 2-5 minutes to fully start
- Wait 5 minutes and try redeploying

#### Solution 2: Restart PostgreSQL Service
```bash
# In Railway Dashboard, restart the PostgreSQL service
# Then redeploy your application
railway up
```

#### Solution 3: Recreate Database Service
If the database service is corrupted:
1. Delete the PostgreSQL service in Railway Dashboard
2. Add a new PostgreSQL service: `railway add -d postgres`
3. Redeploy your application: `railway up`

#### Solution 4: Check Railway Status
- Visit [Railway Status Page](https://status.railway.app/)
- Check if Railway is experiencing issues

### 9. Prevention Strategies

#### Use Health Checks
The application includes health check endpoints:
- `/health` - Basic health check
- `/health/database` - Database-specific health check

#### Monitor Logs
```bash
# Monitor logs in real-time
railway logs --follow

# Check for specific errors
railway logs | grep -i "timeout\|connection\|error"
```

#### Set Up Alerts
- Configure Railway notifications for service failures
- Monitor deployment status via Railway Dashboard

### 10. Emergency Procedures

If all else fails:

1. **Complete Redeploy**:
   ```bash
   railway up --force
   ```

2. **Reset Environment**:
   ```bash
   # Clear and reset environment variables
   railway variables --clear
   railway variables --set "DATABASE_URL=\${{Postgres.DATABASE_URL}}"
   ```

3. **Contact Railway Support**:
   - If issues persist for more than 30 minutes
   - Include logs and error messages
   - Reference this troubleshooting guide

### 11. Performance Monitoring

#### Check Database Performance
```bash
# Monitor database connections
railway logs | grep "Database connection"

# Check for connection pool issues
railway logs | grep "pool\|connection"
```

#### Monitor Application Health
- Use Railway Dashboard metrics
- Check application logs for performance issues
- Monitor response times and error rates

## Quick Reference

### Commands
```bash
# Restart deployment
railway up --detach

# Check status
railway status

# View logs
railway logs --tail 50

# Check variables
railway variables

# Connect to database
railway connect
```

### Environment Variables
```bash
# Required for database connection
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Optional optimizations
RAILWAY_DATABASE_TIMEOUT=120
RAILWAY_DATABASE_RETRIES=10
```

### Common Error Messages
- `timeout expired` → Increase timeouts, retry deployment
- `connection refused` → Check if PostgreSQL service is running
- `authentication failed` → Verify DATABASE_URL is correct
- `database does not exist` → Run database initialization script

## Support

If you continue experiencing issues:

1. Check this troubleshooting guide
2. Review Railway documentation
3. Check Railway status page
4. Contact Railway support with logs and error details

---

**Last Updated**: $(date)
**Version**: 1.0

