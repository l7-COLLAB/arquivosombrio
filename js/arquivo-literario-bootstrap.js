"use strict";
(() => {
  function carregar(href, tipo) {
    const seletor = tipo === "css" ? `link[href^="${href}"]` : `script[src^="${href}"]`;
    if (document.querySelector(seletor)) return;
    const el = document.createElement(tipo === "css" ? "link" : "script");
    if (tipo === "css") { el.rel = "stylesheet"; el.href = href; }
    else { el.src = href; el.defer = true; }
    document.head.appendChild(el);
  }
  carregar("css/home-literario.css?v=20260923-title-spacing-1", "css");
  carregar("js/home-lendas-creepypastas.js?v=20260915-1", "js");

  function adicionarLinks() {
    document.querySelectorAll(".sidebar-links").forEach(nav => {
      const biblioteca = nav.querySelector('a[href="#livros"]');
      if (!biblioteca) return;
      if (!nav.querySelector('a[href="lendas.html"]')) {
        const l = document.createElement("a"); l.href="lendas.html"; l.innerHTML='<i class="fa-solid fa-book-skull"></i>Lendas'; nav.insertBefore(l,biblioteca);
      }
      if (!nav.querySelector('a[href="creepypastas.html"]')) {
        const c = document.createElement("a"); c.href="creepypastas.html"; c.innerHTML='<i class="fa-solid fa-ghost"></i>Creepypastas'; nav.insertBefore(c,biblioteca);
      }
      if (!nav.querySelector('a[href="novels.html"]')) {
        const n = document.createElement("a"); n.href="novels.html"; n.innerHTML='<i class="fa-solid fa-feather-pointed"></i>Novels'; nav.insertBefore(n,biblioteca);
      }
    });
  }
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", adicionarLinks) : adicionarLinks();
})();