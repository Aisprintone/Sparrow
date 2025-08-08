/**
 * Service Worker for FinanceAI
 * Provides offline capability, caching, and performance optimization
 */

const CACHE_NAME = 'financeai-v1.0.0';
const RUNTIME_CACHE = 'financeai-runtime';
const API_CACHE = 'financeai-api';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/_next/static/css/*.css',
  '/_next/static/js/*.js',
  '/manifest.json'
];

// API endpoints to cache
const API_ROUTES = [
  '/api/profiles',
  '/api/spending'
];

// Cache strategies
const CACHE_STRATEGIES = {
  networkFirst: [
    '/api/',
    '/auth/'
  ],
  cacheFirst: [
    '/_next/static/',
    '/fonts/',
    '/images/',
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.svg'
  ],
  staleWhileRevalidate: [
    '/',
    '/profile',
    '/dashboard'
  ]
};

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        // Cache static assets but don't fail if some are missing
        return Promise.allSettled(
          STATIC_ASSETS.map(url => 
            cache.add(url).catch(err => 
              console.warn(`[SW] Failed to cache ${url}:`, err)
            )
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE && name !== API_CACHE)
            .map((name) => {
              console.log(`[SW] Deleting old cache: ${name}`);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

/**
 * Fetch event - implement caching strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Determine cache strategy
  const strategy = getCacheStrategy(url.pathname);
  
  switch (strategy) {
    case 'networkFirst':
      event.respondWith(networkFirst(request));
      break;
    case 'cacheFirst':
      event.respondWith(cacheFirst(request));
      break;
    case 'staleWhileRevalidate':
      event.respondWith(staleWhileRevalidate(request));
      break;
    default:
      event.respondWith(networkFirst(request));
  }
});

/**
 * Get cache strategy for a given path
 */
function getCacheStrategy(pathname) {
  for (const [strategy, patterns] of Object.entries(CACHE_STRATEGIES)) {
    if (patterns.some(pattern => pathname.includes(pattern))) {
      return strategy;
    }
  }
  return 'networkFirst';
}

/**
 * Network First strategy
 * Try network, fall back to cache
 */
async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  
  try {
    const networkResponse = await fetch(request, {
      // Add timeout for better performance
      signal: AbortSignal.timeout(5000)
    });
    
    // Cache successful responses
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network request failed, falling back to cache:', error);
    
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await cache.match('/offline.html');
      if (offlineResponse) {
        return offlineResponse;
      }
    }
    
    throw error;
  }
}

/**
 * Cache First strategy
 * Try cache, fall back to network
 */
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network request failed:', error);
    throw error;
  }
}

/**
 * Stale While Revalidate strategy
 * Return cache immediately, update cache in background
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  
  const cachedResponse = await cache.match(request);
  
  // Fetch in background to update cache
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch((error) => {
      console.log('[SW] Background fetch failed:', error);
      return cachedResponse;
    });
  
  // Return cached response immediately if available
  return cachedResponse || fetchPromise;
}

/**
 * Message handler for cache management
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((names) => {
      Promise.all(names.map(name => caches.delete(name)))
        .then(() => {
          event.ports[0].postMessage({ cleared: true });
        });
    });
  }
  
  if (event.data && event.data.type === 'CACHE_METRICS') {
    // Send cache performance metrics
    getCacheMetrics().then(metrics => {
      event.ports[0].postMessage({ metrics });
    });
  }
});

/**
 * Get cache performance metrics
 */
async function getCacheMetrics() {
  const cacheNames = await caches.keys();
  const metrics = {};
  
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    
    metrics[name] = {
      count: keys.length,
      urls: keys.map(req => req.url)
    };
  }
  
  return metrics;
}

/**
 * Background sync for offline actions
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-profiles') {
    event.waitUntil(syncProfiles());
  }
});

async function syncProfiles() {
  try {
    // Sync any pending profile updates
    const response = await fetch('/api/profiles/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error('Sync failed');
    }
    
    console.log('[SW] Profiles synced successfully');
  } catch (error) {
    console.error('[SW] Sync failed:', error);
    throw error; // Retry later
  }
}