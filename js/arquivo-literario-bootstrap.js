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
  carregar("css/home-literario.css?v=20260915-1", "css");
  carregar("js/home-lendas-creepypastas.js?v=20260915-1", "js");

  function adicionarLinks() {
    const dir = document.querySelector(".home-directory");
    if (dir && !dir.querySelector('a[href="lendas.html"]')) {
      const biblioteca = dir.querySelector('a[href="#livros"]');
      const lenda = document.createElement("a");
      lenda.href = "lendas.html";
      lenda.innerHTML = '<i class="fa-solid fa-book-skull"></i><span><small>FOLCLORE & TRADIÇÃO</small><strong>Lendas</strong></span><i class="fa-solid fa-arrow-right"></i>';
      const creep = document.createElement("a");
      creep.href = "creepypastas.html";
      creep.innerHTML = '<i class="fa-solid fa-ghost"></i><span><small>HORROR DA INTERNET</small><strong>Creepypastas</strong></span><i class="fa-solid fa-arrow-right"></i>';
      dir.insertBefore(lenda, biblioteca);
      dir.insertBefore(creep, biblioteca);
    }
    document.querySelectorAll(".sidebar-links").forEach(nav => {
      if (nav.querySelector('a[href="lendas.html"]')) return;
      const biblioteca = nav.querySelector('a[href="#livros"]');
      if (!biblioteca) return;
      const l = document.createElement("a"); l.href="lendas.html"; l.innerHTML='<i class="fa-solid fa-book-skull"></i>Lendas';
      const c = document.createElement("a"); c.href="creepypastas.html"; c.innerHTML='<i class="fa-solid fa-ghost"></i>Creepypastas';
      nav.insertBefore(l, biblioteca); nav.insertBefore(c, biblioteca);
    });
  }
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", adicionarLinks) : adicionarLinks();
})();
