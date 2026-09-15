const CACHE_NAME = "arquivo-sombrio-20260915-cache-7";

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
    event.waitUntil(caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key)))));
  }
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isNavigate = request.mode === "navigate";
  const isFreshAsset = /\.(?:js|css|json|xml)$/i.test(url.pathname);

  if (isNavigate) {
    event.respondWith((async () => {
      try {
        const response = await fetch(request, { cache: "no-store" });
        if (!response.ok) return response;

        const type = response.headers.get("content-type") || "";
        if (!type.includes("text/html")) return response;

        let html = await response.text();

        const adminEmergencyScript = `
<script id="admin-emergency-access">
(function(){
  if(window.__arquivoSombrioAdminEmergency)return;
  window.__arquivoSombrioAdminEmergency=true;

  function abrirAdmin(){
    var modal=document.getElementById('modal-admin');
    if(!modal)return;
    modal.classList.add('active');
    modal.removeAttribute('hidden');
    modal.setAttribute('aria-hidden','false');
    modal.style.setProperty('display','flex','important');
    modal.style.setProperty('visibility','visible','important');
    modal.style.setProperty('opacity','1','important');
    modal.style.setProperty('pointer-events','auto','important');
    modal.style.setProperty('z-index','2147483647','important');
  }

  document.addEventListener('click',function(e){
    var alvo=e.target && e.target.closest ? e.target.closest('#btn-open-admin,#mobile-btn-admin,.sidebar-admin-link') : null;
    if(!alvo)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    abrirAdmin();
  },true);
})();
<\/script>`;

        if (!html.includes('id="admin-emergency-access"')) {
          html = html.replace('</body>', adminEmergencyScript + '</body>');
        }

        const headers = new Headers(response.headers);
        headers.delete("content-length");
        headers.set("cache-control", "no-store, no-cache, must-revalidate");
        return new Response(html, {
          status: response.status,
          statusText: response.statusText,
          headers
        });
      } catch (error) {
        const cached = await caches.match(request);
        if (cached) return cached;
        throw error;
      }
    })());
    return;
  }

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
