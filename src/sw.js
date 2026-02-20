// Service Worker for TraceeSolar Minigrid
// Provides offline support and caching for production build

const CACHE_NAME = 'tracee-solar-v2';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/briefing.html',
    '/output.css',
    '/minigrid_diagram.svg',
    '/distribution_layout.svg',
    '/capex_composition.svg',
    '/capital_structure.svg',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching app assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                console.log('Assets cached successfully');
                return self.skipWaiting();
            })
    );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('Service worker activated');
            return self.clients.claim();
        })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Return cached version, but update cache in background
                    event.waitUntil(updateCache(event.request));
                    return cachedResponse;
                }

                // Not in cache - fetch from network
                return fetchAndCache(event.request);
            })
            .catch(() => {
                // Offline - return offline page for HTML requests
                if (event.request.headers.get('accept').includes('text/html')) {
                    return caches.match('/index.html');
                }
            })
    );
});

// Fetch from network and cache the response
async function fetchAndCache(request) {
    const response = await fetch(request);
    
    // Don't cache non-successful responses
    if (!response || response.status !== 200 || response.type !== 'basic') {
        return response;
    }

    // Clone the response
    const responseToCache = response.clone();

    caches.open(CACHE_NAME)
        .then((cache) => {
            cache.put(request, responseToCache);
        });

    return response;
}

// Update cache in background (stale-while-revalidate)
async function updateCache(request) {
    try {
        const response = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response);
    } catch (error) {
        // Network error - ignore, we already have cached version
        console.log('Background update failed:', error);
    }
}
