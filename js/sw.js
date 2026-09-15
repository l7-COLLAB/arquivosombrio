const CACHE_NAME = 'arquivo-sombrio-20260914-2315';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

/*
 * Não manter HTML/JS/CSS administrativo em cache-first.
 * O antigo v1_cache fazia o Safari continuar servindo filtros.js e script.js
 * antigos mesmo depois de novos commits no GitHub Pages.
 */
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const dinamico = request.mode === 'navigate' ||
    /\.(?:js|css|html)$/i.test(url.pathname);

  if (dinamico) {
    event.respondWith((async () => {
      try {
        return await fetch(request, { cache: 'no-store' });
      } catch (error) {
        const cached = await caches.match(request);
        if (cached) return cached;
        throw error;
      }
    })());
  }
});
