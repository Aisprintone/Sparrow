import crypto from 'crypto';

// Create HMAC signature for request authentication
function createSignature(payload, serviceKey, timestamp) {
    const message = `${timestamp}.${payload}`;
    const signature = crypto
        .createHmac('sha256', serviceKey)
        .update(message)
        .digest('hex');
    return `sha256=${signature}`;
}

export async function handler(event, context) {
    console.log('Netlify function called with event:', {
        path: event.path,
        httpMethod: event.httpMethod,
        body: event.body ? 'present' : 'missing'
    });
    
    // Get environment variables
    const serviceKey = process.env.NETLIFY_SERVICE_KEY;
    const backendUrl = process.env.RAILWAY_BACKEND_URL;

    if (!serviceKey || !backendUrl) {
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                success: false,
                error: 'Missing configuration',
                message: 'Backend service configuration not found'
            })
        };
    }

    try {
        // Create authentication headers
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const payload = event.body || '';
        const signature = createSignature(payload, serviceKey, timestamp);

        const headers = {
            'X-Service-Key': serviceKey,
            'X-Timestamp': timestamp,
            'X-Signature': signature,
            'Content-Type': 'application/json',
            'Origin': 'https://sparrow-finance-app.netlify.app'
        };

        // Proxy request to Railway backend
        const requestConfig = {
            method: event.httpMethod,
            headers
        };
        
        // Only add body for non-GET/HEAD requests
        if (event.httpMethod !== 'GET' && event.httpMethod !== 'HEAD' && event.body) {
            requestConfig.body = event.body;
        }
        
        // Extract the path after the function name
        const path = event.path.replace('/.netlify/functions/api-proxy', '');
        const targetUrl = `${backendUrl}${path}`;
        
        console.log('Proxying request:', {
            from: event.path,
            to: targetUrl,
            method: event.httpMethod
        });
        
        const response = await fetch(targetUrl, requestConfig);

        const responseData = await response.text();

        return {
            statusCode: response.status,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: responseData
        };

    } catch (error) {
        console.error('Proxy error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                error: 'Internal server error',
                message: error.message,
                details: {
                    path: event.path,
                    method: event.httpMethod,
                    backendUrl: backendUrl
                }
            })
        };
    }
}
