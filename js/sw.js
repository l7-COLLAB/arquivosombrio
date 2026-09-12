const CACHE_NAME = 'v1_cache';
const ASSETS = [
  '/',
  '/index.html',
  '/js/script.js',
  '/js/filtros.js',
  '/data/caso.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});
