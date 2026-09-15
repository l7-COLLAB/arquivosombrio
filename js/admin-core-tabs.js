"use strict";

(() => {
    function garantirModulosLiterariosAdmin() {
        const painel = document.querySelector("#admin-manager .admin-manager");
        const tabs = painel?.querySelector(".admin-content-tabs");
        const actions = painel?.querySelector(".admin-actions");
        if (!painel || !tabs || !actions) return false;

        const modulos = [
            { tipo: "lendas", nome: "Lendas", singular: "Lenda", icone: "fa-book-skull" },
            { tipo: "creepypastas", nome: "Creepypastas", singular: "Creepypasta", icone: "fa-ghost" }
        ];

        modulos.forEach(modulo => {
            if (!tabs.querySelector(`[data-admin-tab="${modulo.tipo}"]`)) {
                const botao = document.createElement("button");
                botao.type = "button";
                botao.dataset.adminTab = modulo.tipo;
                botao.innerHTML = `<i class="fa-solid ${modulo.icone}"></i><span>${modulo.nome}</span><small data-lit-count="${modulo.tipo}">0</small>`;
                tabs.appendChild(botao);
            }

            if (!actions.querySelector(`[data-admin-create="${modulo.tipo}"]`)) {
                const novo = document.createElement("button");
                novo.type = "button";
                novo.className = "admin-action-button";
                novo.dataset.adminCreate = modulo.tipo;
                novo.hidden = true;
                novo.innerHTML = `<i class="fa-solid fa-square-plus"></i> NOVA ${modulo.singular.toUpperCase()}`;
                actions.insertBefore(novo, actions.querySelector("#admin-logout"));
            }

            if (!painel.querySelector(`[data-admin-section="${modulo.tipo}"]`)) {
                const secao = document.createElement("section");
                secao.className = "admin-list-section literary-admin-section";
                secao.dataset.adminSection = modulo.tipo;
                secao.hidden = true;
                secao.innerHTML = `<h3>${modulo.nome}</h3><div class="literary-status-tabs"><button type="button" data-lit-filter="all">TODAS</button><button type="button" data-lit-filter="rascunho">RASCUNHOS</button><button type="button" data-lit-filter="publicado">PUBLICADAS</button></div><div class="admin-list" data-lit-list="${modulo.tipo}"><p class="admin-empty">Carregando...</p></div>`;
                painel.appendChild(secao);
            }
        });

        return true;
    }

    window.garantirModulosLiterariosAdmin = garantirModulosLiterariosAdmin;

    const observer = new MutationObserver(() => garantirModulosLiterariosAdmin());
    observer.observe(document.documentElement, { childList: true, subtree: true });

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", garantirModulosLiterariosAdmin);
    } else {
        garantirModulosLiterariosAdmin();
    }
})();
