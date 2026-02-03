// Service Worker for Japan Trip 2026
// Provides offline access to critical pages

const CACHE_NAME = 'japan-trip-v1';

const OFFLINE_URLS = [
  '/',
  '/itinerary/',
  '/reservations/',
  '/packing/',
  '/pokemon/',
  '/emergency/',
  '/days/day-01/',
  '/days/day-02/',
  '/days/day-03/',
  '/days/day-04/',
  '/days/day-05/',
  '/days/day-06/',
  '/days/day-07/',
  '/days/day-08/',
  '/days/day-09/',
  '/days/day-10/',
  '/days/day-11/',
  '/days/day-12/',
  '/days/day-13/',
  '/days/day-14/',
  '/days/day-15/',
  '/assets/css/style.css',
  '/assets/js/app.js'
];

// Install - cache core files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching offline pages');
        return cache.addAll(OFFLINE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch - network first, fall back to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip external requests
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone and cache successful responses
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Return offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        });
      })
  );
});
