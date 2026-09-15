const VERSION = "arquivo-sombrio-20260914-admin-core-3";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.map(key=>caches.delete(key)));await self.clients.claim();})()));
self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.mode !== "navigate") return;
  const url = new URL(req.url);
  const isHome = url.pathname === "/arquivosombrio/" || url.pathname.endsWith("/arquivosombrio/index.html");
  if (!isHome) return;
  event.respondWith((async () => {
    try {
      const response = await fetch(req, { cache: "no-store" });
      if (!response.ok) return response;
      let html = await response.text();
      const inject = '<script src="js/admin-core-tabs.js?v=20260914-2338"></script><script src="js/arquivo-literario-bootstrap.js?v=20260914-2338"></script><script src="js/admin-literario.js?v=20260914-2338"></script>';
      html = html.replace(/<script src="js\/admin-core-tabs\.js[^>]*><\/script>/g, "").replace(/<script src="js\/arquivo-literario-bootstrap\.js[^>]*><\/script>/g, "").replace(/<script src="js\/admin-literario\.js[^>]*><\/script>/g, "");
      html = html.replace("</body>", inject + "</body>");
      const headers = new Headers(response.headers);
      headers.delete("content-length");
      headers.set("cache-control","no-store, no-cache, must-revalidate");
      return new Response(html,{status:response.status,statusText:response.statusText,headers});
    } catch (_) { return fetch(req,{cache:"no-store"}); }
  })());
});
