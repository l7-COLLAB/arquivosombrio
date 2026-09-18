const CACHE_NAME = "arquivo-sombrio-20260918-cache-9";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();

  if (event.data?.type === "CLEAR_CACHES") {
    event.waitUntil(
      caches
        .keys()
        .then(keys => Promise.all(keys.map(key => caches.delete(key))))
    );
  }
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  const isNavigate = request.mode === "navigate";
  const isFreshAsset = /\.(?:js|css|json|xml)$/i.test(url.pathname);

  /*
   * HTML sempre vem da rede quando possível.
   * Não injetamos scripts administrativos no HTML: a autenticação e a
   * abertura do painel pertencem exclusivamente ao js/script.js. Isso evita
   * que o Service Worker intercepte cliques e bloqueie a sessão já autenticada.
   */
  if (isNavigate) {
    event.respondWith((async () => {
      try {
        return await fetch(request, { cache: "no-store" });
      } catch (error) {
        const cached = await caches.match(request);
        if (cached) return cached;
        throw error;
      }
    })());
    return;
  }

  /* JS/CSS e arquivos editoriais devem refletir o deploy mais recente. */
  if (isFreshAsset) {
    event.respondWith((async () => {
      try {
        return await fetch(request, { cache: "no-store" });
      } catch (error) {
        const cached = await caches.match(request);
        if (cached) return cached;
        throw error;
      }
    })());
    return;
  }

  /* Imagens e demais recursos estáticos podem usar cache como fallback. */
  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;

    const response = await fetch(request);

    if (response?.ok && response.type === "basic") {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }

    return response;
  })());
});
