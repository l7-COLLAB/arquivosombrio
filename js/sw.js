const CACHE_NAME = 'v1_cache';
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/main.js'
];

// Instala o Service Worker e guarda os arquivos em cache
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Responde às requisições usando o cache quando offline
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});
