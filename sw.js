// ===== STELLAR TALES SERVICE WORKER =====
// Enhanced PWA with offline capabilities and progress synchronization

const CACHE_NAME = 'stellar-tales-v1.2';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/manifest.json'
];

// Dynamic cache for user data and API responses
const DYNAMIC_CACHE = 'stellar-tales-dynamic-v1';

// Install event - cache static assets
self.addEventListener('install', event => {
    console.log('🚀 Service Worker installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('✅ Service Worker activated');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
                            console.log('🗑️ Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Handle different types of requests
    if (request.method === 'GET') {
        event.respondWith(handleGetRequest(request));
    }
});

async function handleGetRequest(request) {
    const url = new URL(request.url);
    
    // Strategy 1: Cache First for static assets
    if (STATIC_ASSETS.some(asset => url.pathname.endsWith(asset))) {
        return cacheFirst(request);
    }
    
    // Strategy 2: Network First for API calls
    if (url.pathname.includes('/api/') || url.hostname.includes('nasa.gov')) {
        return networkFirst(request);
    }
    
    // Strategy 3: Stale While Revalidate for dynamic content
    return staleWhileRevalidate(request);
}

// Cache First Strategy
async function cacheFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    
    if (cached) {
        return cached;
    }
    
    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        console.error('Cache first failed:', error);
        return new Response('Offline', { status: 503 });
    }
}

// Network First Strategy
async function networkFirst(request) {
    const cache = await caches.open(DYNAMIC_CACHE);
    
    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        console.warn('Network first fallback to cache:', error);
        const cached = await cache.match(request);
        
        if (cached) {
            return cached;
        }
        
        // Return offline fallback for API requests
        return new Response(JSON.stringify({
            offline: true,
            message: 'Data unavailable offline',
            timestamp: new Date().toISOString()
        }), {
            headers: { 'Content-Type': 'application/json' },
            status: 503
        });
    }
}

// Stale While Revalidate Strategy
async function staleWhileRevalidate(request) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cached = await cache.match(request);
    
    // Always try to fetch in background
    const fetchPromise = fetch(request).then(response => {
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    }).catch(error => {
        console.warn('Stale while revalidate fetch failed:', error);
    });
    
    // Return cached version immediately if available
    if (cached) {
        return cached;
    }
    
    // Wait for network if no cache
    return fetchPromise || new Response('Offline', { status: 503 });
}

// Background Sync for user progress
self.addEventListener('sync', event => {
    console.log('🔄 Background sync triggered:', event.tag);
    
    if (event.tag === 'user-progress-sync') {
        event.waitUntil(syncUserProgress());
    }
    
    if (event.tag === 'space-weather-sync') {
        event.waitUntil(syncSpaceWeatherData());
    }
});

async function syncUserProgress() {
    try {
        // Get pending user progress from IndexedDB
        const pendingProgress = await getPendingProgress();
        
        if (pendingProgress.length > 0) {
            console.log('📊 Syncing user progress:', pendingProgress.length, 'items');
            
            // Send to server when online
            for (const progress of pendingProgress) {
                await fetch('/api/user/progress', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(progress)
                });
            }
            
            // Clear pending progress
            await clearPendingProgress();
            
            // Notify clients
            const clients = await self.clients.matchAll();
            clients.forEach(client => {
                client.postMessage({
                    type: 'PROGRESS_SYNCED',
                    count: pendingProgress.length
                });
            });
        }
    } catch (error) {
        console.error('Progress sync failed:', error);
    }
}

async function syncSpaceWeatherData() {
    try {
        console.log('🌌 Syncing space weather data');
        
        const response = await fetch('/api/space-weather/current');
        if (response.ok) {
            const data = await response.json();
            
            // Cache the data
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put('/api/space-weather/current', new Response(JSON.stringify(data)));
            
            // Notify clients
            const clients = await self.clients.matchAll();
            clients.forEach(client => {
                client.postMessage({
                    type: 'SPACE_WEATHER_UPDATED',
                    data: data
                });
            });
        }
    } catch (error) {
        console.error('Space weather sync failed:', error);
    }
}

// Push notifications for space weather alerts
self.addEventListener('push', event => {
    if (event.data) {
        const data = event.data.json();
        console.log('📡 Push notification received:', data);
        
        const options = {
            body: data.message,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            data: data,
            actions: [
                {
                    action: 'view',
                    title: 'View Details'
                },
                {
                    action: 'dismiss',
                    title: 'Dismiss'
                }
            ]
        };
        
        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
    console.log('🔔 Notification clicked:', event.action);
    
    event.notification.close();
    
    if (event.action === 'view') {
        event.waitUntil(
            clients.openWindow('/dashboard')
        );
    }
});

// Message handler for client communication
self.addEventListener('message', event => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'CACHE_USER_PROGRESS':
            cacheUserProgress(data);
            break;
            
        case 'REQUEST_SYNC':
            // Request background sync
            self.registration.sync.register(data.tag);
            break;
    }
});

// IndexedDB helpers for offline storage
async function getPendingProgress() {
    // Implementation would use IndexedDB to get pending progress
    // This is a placeholder for the concept
    return [];
}

async function clearPendingProgress() {
    // Implementation would clear pending progress from IndexedDB
}

async function cacheUserProgress(progressData) {
    try {
        // Store in IndexedDB for offline access
        // This would be implemented with IndexedDB operations
        console.log('💾 Caching user progress offline');
    } catch (error) {
        console.error('Failed to cache user progress:', error);
    }
}

// Periodic background fetch for space weather updates
self.addEventListener('periodicsync', event => {
    if (event.tag === 'space-weather-update') {
        event.waitUntil(updateSpaceWeatherCache());
    }
});

async function updateSpaceWeatherCache() {
    try {
        console.log('🌌 Periodic space weather update');
        await syncSpaceWeatherData();
    } catch (error) {
        console.error('Periodic space weather update failed:', error);
    }
}

console.log('🌟 Stellar Tales Service Worker loaded!');