const VERSION = "arquivo-sombrio-20260914-literario-1";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));
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
      const inject = '<script src="js/arquivo-literario-bootstrap.js?v=20260914-2"></script><script src="js/admin-literario.js?v=20260914-2"></script>';
      if (!html.includes("js/admin-literario.js")) html = html.replace("</body>", inject + "</body>");
      const headers = new Headers(response.headers);
      headers.delete("content-length");
      return new Response(html, { status: response.status, statusText: response.statusText, headers });
    } catch (_) {
      return fetch(req);
    }
  })());
});
