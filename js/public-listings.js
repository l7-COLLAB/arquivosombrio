"use strict";
// Public metadata from the same build as the visible HTML. No private data or article bodies.
(() => {
    let catalog = {};
    try {
        catalog = JSON.parse(document.getElementById("as-public-listings")?.textContent || "{}");
    } catch (error) {
        console.warn("Índice inicial indisponível.", error);
    }
    window.ArquivoListagens = {
        has: table => Array.isArray(catalog[table]),
        read: table => Array.isArray(catalog[table]) ? catalog[table].slice() : [],
        published: row => {
            if (row.status_publicacao && row.status_publicacao !== "publicado") return false;
            const value = row.published_at || row.publicado_em;
            return !value || (Number.isFinite(Date.parse(value)) && Date.parse(value) <= Date.now());
        }
    };
})();
