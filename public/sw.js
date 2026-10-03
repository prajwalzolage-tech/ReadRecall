// public/sw.js
// Service Worker for ReadRecall PWA - Network-First Strategy

const CACHE_NAME = 'readrecall-v2';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Never cache API, auth, or non-GET requests
  if (
    request.url.includes('/api/') ||
    request.url.includes('firebase') ||
    request.method !== 'GET'
  ) {
    return;
  }

  // Network-First: Always attempt fresh network fetch first
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        // Only cache static assets (images, fonts, manifest)
        if (
          request.url.match(/\.(png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|json)$/)
        ) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Only use cache when network fails (offline)
        return caches.match(request);
      })
  );
});
