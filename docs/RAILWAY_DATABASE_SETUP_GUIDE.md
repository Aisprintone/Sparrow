# Railway Database Setup Guide

## Overview

This guide explains how to properly configure PostgreSQL on Railway and align your local development environment with Railway's requirements.

## Railway PostgreSQL Requirements

### 1. Database Service Setup

Railway requires a PostgreSQL service to be added to your project:

```bash
# Add PostgreSQL service to your Railway project
railway add -d postgres
```

### 2. Environment Variables

Railway automatically provides these environment variables when you add a PostgreSQL service:

- `DATABASE_URL`: The primary connection string for private network access
- `DATABASE_PUBLIC_URL`: Public connection string (incurs egress costs)
- `PGHOST`: Database hostname
- `PGPORT`: Database port (usually 5432)
- `PGDATABASE`: Database name
- `PGUSER`: Database username
- `PGPASSWORD`: Database password

### 3. Connection Requirements

Railway PostgreSQL has specific requirements:

- **Private Network**: Use `DATABASE_URL` for private network communication
- **Connection Timeouts**: 60-second connection timeout recommended
- **SSL Mode**: `require` for secure connections
- **Connection Pooling**: Configured for Railway's infrastructure

## Local vs Railway Database Alignment

### Local Development Setup

```bash
# Local PostgreSQL connection
DATABASE_URL=postgresql://localhost/sparrow
LOCAL_DATABASE_URL=postgresql://localhost/sparrow
```

### Railway Production Setup

```bash
# Railway PostgreSQL connection (automatically provided)
DATABASE_URL=postgresql://username:password@postgres.railway.internal:5432/railway
```

## Database Initialization Process

### 1. Connection Testing

The system now includes Railway-optimized connection testing:

- **Retry Logic**: 5 attempts with exponential backoff
- **Timeout Configuration**: 60-second connection timeout
- **Connection Pooling**: Optimized for Railway's infrastructure

### 2. Schema Loading

The schema loading process has been improved:

- **Multiple Path Resolution**: Tries multiple schema file locations
- **Comment Filtering**: Removes SQL comments before execution
- **Transaction Handling**: Railway-optimized transaction management

### 3. Health Verification

Database health checks include:

- **Connection Testing**: Verifies database connectivity
- **Table Counts**: Confirms schema was loaded correctly
- **Environment Reporting**: Includes Railway-specific information

## Troubleshooting Database Issues

### Common Issues and Solutions

#### 1. Connection Timeout

**Symptoms**: `connection to server at "postgres.railway.internal" failed: timeout expired`

**Solutions**:
- Ensure PostgreSQL service is added to your Railway project
- Check that `DATABASE_URL` environment variable is set
- Verify the service is running in Railway dashboard

#### 2. Schema Loading Failures

**Symptoms**: Database tables not created or populated

**Solutions**:
- Run the database setup script: `python scripts/setup_railway_db.py`
- Check schema file exists in the correct location
- Verify database permissions

#### 3. Environment Variable Issues

**Symptoms**: `DATABASE_URL` not found or invalid

**Solutions**:
- Add PostgreSQL service to Railway project
- Check Railway dashboard for environment variables
- Ensure service is properly linked

### Debugging Steps

1. **Check Environment Variables**:
   ```bash
   echo $DATABASE_URL
   echo $RAILWAY_ENVIRONMENT
   ```

2. **Test Database Connection**:
   ```bash
   python scripts/setup_railway_db.py
   ```

3. **Check Railway Logs**:
   ```bash
   railway logs
   ```

4. **Verify Service Status**:
   - Check Railway dashboard for service status
   - Ensure PostgreSQL service is running

## Railway-Specific Optimizations

### 1. Connection Configuration

The database configuration has been optimized for Railway:

```python
connect_args = {
    "connect_timeout": 60,  # Increased for Railway
    "application_name": "sparrow_finance",
    "keepalives_idle": 60,
    "keepalives_interval": 10,
    "keepalives_count": 5,
    "options": "-c statement_timeout=60000 -c idle_in_transaction_session_timeout=300000",
    "tcp_user_timeout": 60000,
}
```

### 2. Connection Pooling

Railway-optimized connection pooling:

```python
pool_size=5,
max_overflow=10,
pool_timeout=30,
```

### 3. Retry Logic

Improved retry logic for Railway's network:

```python
max_retries = 5
base_delay = 2
delay = base_delay * (2 ** attempt) + (time.time() % 1)
```

## Deployment Checklist

### Before Deployment

- [ ] Add PostgreSQL service to Railway project
- [ ] Verify `DATABASE_URL` environment variable is set
- [ ] Test database connection locally
- [ ] Ensure schema file is in the correct location

### During Deployment

- [ ] Monitor Railway logs for database connection issues
- [ ] Check that pre-deploy database setup script runs successfully
- [ ] Verify health check endpoint returns healthy status

### After Deployment

- [ ] Test database connectivity via health check endpoint
- [ ] Verify tables are created and populated
- [ ] Check application logs for any database errors

## Monitoring and Maintenance

### Health Check Endpoints

- `/health`: Overall application health including database
- `/db/health`: Database-specific health check
- `/db/init`: Manual database initialization endpoint

### Logging

The system includes comprehensive logging for database operations:

- Connection attempts and failures
- Schema loading progress
- Health check results
- Railway-specific environment information

## Best Practices

### 1. Use Private Network

Always use `DATABASE_URL` (private network) instead of `DATABASE_PUBLIC_URL` to avoid egress costs.

### 2. Implement Proper Retry Logic

The system now includes Railway-optimized retry logic with exponential backoff and jitter.

### 3. Monitor Connection Pool

Configure appropriate pool sizes for your application's needs.

### 4. Handle Failures Gracefully

The application continues to function with degraded database capabilities when connection fails.

## Conclusion

By following this guide and using the updated database configuration, your application should properly connect to Railway's PostgreSQL service. The key improvements include:

- Railway-optimized connection parameters
- Improved retry logic with exponential backoff
- Better error handling and logging
- Comprehensive health checks
- Pre-deployment database setup

If you continue to experience issues, check the Railway logs and ensure all environment variables are properly configured in your Railway project dashboard.
