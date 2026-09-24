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
    const dir = document.querySelector(".home-directory");
    if (dir) {
      const biblioteca = dir.querySelector('a[href="#livros"]');
      if (biblioteca && !dir.querySelector('a[href="lendas.html"]')) {
        const lenda = document.createElement("a");
        lenda.href = "lendas.html";
        lenda.innerHTML = '<i class="fa-solid fa-book-skull"></i><span><small>FOLCLORE & TRADIÇÃO</small><strong>Lendas</strong></span><i class="fa-solid fa-arrow-right"></i>';
        dir.insertBefore(lenda, biblioteca);
      }
      if (biblioteca && !dir.querySelector('a[href="creepypastas.html"]')) {
        const creep = document.createElement("a");
        creep.href = "creepypastas.html";
        creep.innerHTML = '<i class="fa-solid fa-ghost"></i><span><small>HORROR DA INTERNET</small><strong>Creepypastas</strong></span><i class="fa-solid fa-arrow-right"></i>';
        dir.insertBefore(creep, biblioteca);
      }
      if (biblioteca && !dir.querySelector('a[href="novels.html"]')) {
        const novel = document.createElement("a");
        novel.href = "novels.html";
        novel.innerHTML = '<i class="fa-solid fa-feather-pointed"></i><span><small>LEITURA SERIADA</small><strong>Novels</strong></span><i class="fa-solid fa-arrow-right"></i>';
        dir.insertBefore(novel, biblioteca);
      }
    }
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