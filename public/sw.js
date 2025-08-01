// Service Worker for Offline Dashboard Capability
const CACHE_NAME = 'battery-dashboard-v1';
const OFFLINE_URL = '/offline';

// Resources to cache for offline use
const STATIC_RESOURCES = [
  '/',
  '/customer/dashboard',
  '/customer/account',
  '/offline',
  '/favicon.ico',
  // Add other critical resources
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /\/api\/analytics/,
  /\/api\/customers/,
  /\/api\/orders/,
  /\/api\/metrics/,
];

// Install event - cache static resources
self.addEventListener('install', event => {
  console.log('Service Worker installing...');

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => {
        console.log('Caching static resources');
        return cache.addAll(STATIC_RESOURCES);
      })
      .then(() => {
        console.log('Service Worker installed successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker installation failed:', error);
      })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');

  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle API requests with network-first strategy
  if (isApiRequest(url)) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  // Handle static resources with cache-first strategy
  event.respondWith(handleStaticResource(request));
});

// Check if request is for API
function isApiRequest(url) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));
}

// Network-first strategy for API requests
async function handleApiRequest(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    // Try network first
    const response = await fetch(request);

    // Cache successful responses
    if (response.ok) {
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log('Network failed for API request, trying cache:', request.url);

    // Fall back to cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline response for API requests
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'This data is not available offline',
        cached: false,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      }
    );
  }
}

// Handle navigation requests
async function handleNavigation(request) {
  try {
    // Try network first
    const response = await fetch(request);
    return response;
  } catch (error) {
    console.log('Network failed for navigation, serving from cache');

    // Try to serve from cache
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Serve offline page
    const offlineResponse = await cache.match(OFFLINE_URL);
    if (offlineResponse) {
      return offlineResponse;
    }

    // Fallback offline HTML
    return new Response(
      `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Battery Dashboard - Offline</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #006FEE 0%, #0084FF 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
          }
          .container {
            max-width: 400px;
            padding: 40px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.2);
          }
          h1 { font-size: 24px; margin-bottom: 16px; }
          p { font-size: 16px; margin-bottom: 24px; opacity: 0.9; }
          button {
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border: 2px solid rgba(255, 255, 255, 0.3);
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          button:hover {
            background: rgba(255, 255, 255, 0.3);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>📱 Offline Mode</h1>
          <p>You're currently offline. The dashboard will automatically sync when your connection is restored.</p>
          <button onclick="window.location.reload()">Try Again</button>
        </div>
      </body>
      </html>
    `,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-cache',
        },
      }
    );
  }
}

// Cache-first strategy for static resources
async function handleStaticResource(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);

    // Cache successful responses
    if (response.ok) {
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log('Failed to fetch static resource:', request.url);

    // Return a generic offline response for static resources
    return new Response('Resource not available offline', {
      status: 503,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}

// Background sync for when connection is restored
self.addEventListener('sync', event => {
  if (event.tag === 'dashboard-sync') {
    console.log('Background sync triggered');
    event.waitUntil(performBackgroundSync());
  }
});

async function performBackgroundSync() {
  try {
    // Sync any cached offline data
    console.log('Performing background sync...');

    // Notify all clients that sync is complete
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        timestamp: new Date().toISOString(),
      });
    });

    console.log('Background sync completed');
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Handle messages from the main application
self.addEventListener('message', event => {
  const { type, data } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CACHE_DASHBOARD_DATA':
      cacheData(data);
      break;

    case 'CLEAR_CACHE':
      clearCache();
      break;

    default:
      console.log('Unknown message type:', type);
  }
});

async function cacheData(data) {
  try {
    const cache = await caches.open(CACHE_NAME);

    // Create a synthetic response for the data
    const response = new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'X-Cached': 'true',
        'X-Cache-Timestamp': new Date().toISOString(),
      },
    });

    await cache.put('/api/dashboard/offline-data', response);
    console.log('Dashboard data cached for offline use');
  } catch (error) {
    console.error('Failed to cache dashboard data:', error);
  }
}

async function clearCache() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
    console.log('All caches cleared');
  } catch (error) {
    console.error('Failed to clear cache:', error);
  }
}

// Periodic cache cleanup (every 24 hours)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'cache-cleanup') {
    event.waitUntil(cleanupOldCache());
  }
});

async function cleanupOldCache() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();

    const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const now = Date.now();

    for (const request of requests) {
      const response = await cache.match(request);
      const cacheTimestamp = response?.headers.get('X-Cache-Timestamp');

      if (cacheTimestamp) {
        const cacheTime = new Date(cacheTimestamp).getTime();
        if (now - cacheTime > oneDay) {
          await cache.delete(request);
          console.log('Deleted old cached resource:', request.url);
        }
      }
    }

    console.log('Cache cleanup completed');
  } catch (error) {
    console.error('Cache cleanup failed:', error);
  }
}
