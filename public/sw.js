// Service Worker for PWA - enables offline caching
const CACHE = 'star-diary-v2'; // bump version to bust old cache
const isLocalhost = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';

// On localhost: skip caching entirely (dev mode)
// On production: cache-first for static assets, network-first for HTML
self.addEventListener('install', (e) => {
  if (!isLocalhost) {
    e.waitUntil(
      caches.open(CACHE).then(c => c.addAll(['./', './manifest.json']))
    );
  }
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  // Purge old caches
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  // Dev mode: bypass cache, go straight to network
  if (isLocalhost) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Production: network-first for navigation, cache-first for assets
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }))
    );
  }
});
