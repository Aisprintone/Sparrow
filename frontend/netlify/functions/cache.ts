import type { Context } from '@netlify/edge-functions';

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

// In-memory cache for edge function (will be cleared on function restart)
const edgeCache = new Map<string, CacheEntry>();

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/cache/', '');
  
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    switch (request.method) {
      case 'GET':
        return await handleGet(path, headers);
      case 'POST':
        return await handlePost(path, request, headers);
      case 'DELETE':
        return await handleDelete(path, headers);
      default:
        return new Response('Method not allowed', { status: 405, headers });
    }
  } catch (error) {
    console.error('Cache function error:', error);
    return new Response('Internal server error', { status: 500, headers });
  }
};

async function handleGet(path: string, headers: Record<string, string>) {
  const key = decodeURIComponent(path);
  const entry = edgeCache.get(key);
  
  if (!entry) {
    return new Response('Not found', { status: 404, headers });
  }

  // Check if expired
  if (Date.now() - entry.timestamp > entry.ttl) {
    edgeCache.delete(key);
    return new Response('Not found', { status: 404, headers });
  }

  return new Response(JSON.stringify(entry), { headers });
}

async function handlePost(path: string, request: Request, headers: Record<string, string>) {
  const key = decodeURIComponent(path);
  const entry: CacheEntry = await request.json();
  
  // Validate entry
  if (!entry.data || typeof entry.timestamp !== 'number' || typeof entry.ttl !== 'number') {
    return new Response('Invalid cache entry', { status: 400, headers });
  }

  edgeCache.set(key, entry);
  return new Response('OK', { status: 200, headers });
}

async function handleDelete(path: string, headers: Record<string, string>) {
  const key = decodeURIComponent(path);
  const deleted = edgeCache.delete(key);
  
  return new Response(deleted ? 'OK' : 'Not found', { 
    status: deleted ? 200 : 404, 
    headers 
  });
}
