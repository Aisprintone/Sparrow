# FinanceAI Microservice Security

## Overview

This security implementation provides comprehensive protection for the Railway backend API, ensuring only authorized Netlify frontend services can access sensitive financial data and AI capabilities.

## Architecture

```
Netlify Frontend → Railway Backend
      |                    |
   [Service Key]    [Microservice Auth]
   [Signature]      [Rate Limiting]
   [Timestamp]      [CORS Policy]
```

## Security Layers

### 1. Microservice Authentication (`microservice_auth.py`)

**Service Keys**: Each microservice has a unique service key
- `NETLIFY_SERVICE_KEY`: Identifies Netlify frontend service
- `RAILWAY_SERVICE_KEY`: Identifies Railway backend service

**Request Signing**: HMAC-SHA256 signatures prevent tampering
```python
# Frontend request headers
{
    "X-Service-Key": "netlify-service-key",
    "X-Timestamp": "1691234567",
    "X-Signature": "sha256=abcd1234...",
    "Content-Type": "application/json"
}
```

**Timestamp Validation**: Prevents replay attacks (5-minute window)

### 2. Rate Limiting (`middleware.py`)

**Service Level**: 200 requests/minute for Netlify frontend
**Endpoint Specific**: 
- Simulations: 10/minute
- RAG queries: 30/minute  
- Market data: 60/minute

**Burst Protection**: Max 20 requests in 10 seconds

### 3. CORS Security

**Strict Origins**: Only allows requests from:
- `https://your-app.netlify.app`
- `https://*.netlify.app` (preview deployments)
- `localhost:3000` (development)

### 4. Security Headers

Applied to all responses:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security`
- Content Security Policy

## Environment Variables

### Required Production Variables
```bash
# Service authentication
NETLIFY_SERVICE_KEY=your-netlify-service-key-256-chars
RAILWAY_SERVICE_KEY=your-railway-service-key-256-chars

# Domain configuration
NETLIFY_DOMAIN=your-app.netlify.app
ENVIRONMENT=production
```

### Optional Security Variables
```bash
# JWT configuration (if using user sessions)
JWT_SECRET_KEY=your-jwt-secret-key-256-chars

# API keys for different access levels
FRONTEND_API_KEY=frontend-specific-api-key
ADMIN_API_KEY=admin-access-api-key
```

## Protected Endpoints

All main API endpoints require microservice authentication:

- `POST /simulation/{scenario_type}` - Financial simulations
- `POST /rag/query/{profile_id}` - RAG system queries
- `GET /rag/profiles/summary` - Profile summaries
- `GET /api/market-data` - Market data access
- `GET /profiles` - User profile access

## Frontend Integration

### Netlify Function Example
```javascript
// netlify/functions/api-proxy.js
export async function handler(event, context) {
    const serviceKey = process.env.NETLIFY_SERVICE_KEY;
    const backendUrl = process.env.RAILWAY_BACKEND_URL;
    
    // Create signed headers
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const payload = event.body || '';
    const signature = createHmacSignature(payload, serviceKey, timestamp);
    
    const headers = {
        'X-Service-Key': serviceKey,
        'X-Timestamp': timestamp,
        'X-Signature': signature,
        'Content-Type': 'application/json'
    };
    
    // Proxy to Railway backend
    const response = await fetch(`${backendUrl}${event.path}`, {
        method: event.httpMethod,
        headers,
        body: event.body
    });
    
    return {
        statusCode: response.status,
        body: await response.text(),
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
        }
    };
}
```

### React Frontend Example
```javascript
// utils/api.js
const API_BASE = '/.netlify/functions/api-proxy';

export async function callSecureAPI(endpoint, data = null) {
    const options = {
        method: data ? 'POST' : 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    // Request goes through Netlify function proxy
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    
    if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
    }
    
    return await response.json();
}
```

## Security Monitoring

### Metrics Tracked
- Total requests
- Authentication failures
- Rate limit violations
- Invalid signatures
- Blocked origins

### Access via `/api/security/metrics`
```json
{
    "total_requests": 15420,
    "authenticated_requests": 15200,
    "failed_auth": 45,
    "invalid_signatures": 12,
    "rate_limited": 163,
    "blocked_origins": 8,
    "success_rate": 98.6
}
```

## Deployment Checklist

### Railway Backend
- [ ] Set `NETLIFY_SERVICE_KEY` environment variable
- [ ] Set `RAILWAY_SERVICE_KEY` environment variable  
- [ ] Set `NETLIFY_DOMAIN` to your actual domain
- [ ] Set `ENVIRONMENT=production`
- [ ] Verify security middleware is active
- [ ] Test `/health` endpoint accessibility

### Netlify Frontend
- [ ] Set `NETLIFY_SERVICE_KEY` in environment variables
- [ ] Set `RAILWAY_BACKEND_URL` to your Railway app URL
- [ ] Implement API proxy functions
- [ ] Test signed requests to Railway backend
- [ ] Verify CORS headers in responses

## Testing Security

```bash
# Test without service key (should fail)
curl -X POST https://your-railway-app.railway.app/simulation/emergency_fund \
  -H "Content-Type: application/json" \
  -d '{"profile_id": "1"}'

# Test with invalid service key (should fail)  
curl -X POST https://your-railway-app.railway.app/simulation/emergency_fund \
  -H "X-Service-Key: invalid-key" \
  -H "Content-Type: application/json" \
  -d '{"profile_id": "1"}'

# Test with valid service key (should succeed)
curl -X POST https://your-railway-app.railway.app/simulation/emergency_fund \
  -H "X-Service-Key: your-netlify-service-key" \
  -H "X-Timestamp: $(date +%s)" \
  -H "X-Signature: sha256=..." \
  -H "Content-Type: application/json" \
  -d '{"profile_id": "1"}'
```

## Security Best Practices

1. **Rotate Keys Regularly**: Change service keys every 90 days
2. **Monitor Metrics**: Set up alerts for authentication failures
3. **Use HTTPS Only**: All communication must be encrypted
4. **Log Security Events**: Track all authentication attempts
5. **Rate Limit Aggressively**: Prevent abuse and DoS attacks
6. **Validate All Inputs**: Never trust client data
7. **Regular Security Audits**: Review access patterns monthly

## Troubleshooting

### Common Issues

1. **"X-Service-Key header required"**
   - Frontend not sending service key
   - Check Netlify environment variables

2. **"Invalid service key"**  
   - Key mismatch between frontend and backend
   - Verify both services have same key

3. **"Invalid or expired timestamp"**
   - Clock skew between services
   - Timestamp older than 5 minutes

4. **"Invalid request signature"**
   - HMAC calculation error
   - Check payload encoding and key

5. **"Origin not allowed"**
   - Request from unauthorized domain
   - Update ALLOWED_ORIGINS configuration

### Debug Mode
Set `ENVIRONMENT=development` to:
- Allow localhost origins
- Extended timestamp window (15 minutes)
- Detailed error messages
- Reduced rate limits