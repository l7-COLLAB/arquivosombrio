"use strict";

(() => {
    const MODULOS = [
        { tipo: "lendas", nome: "Lendas", singular: "Lenda", icone: "fa-book-skull" },
        { tipo: "creepypastas", nome: "Creepypastas", singular: "Creepypasta", icone: "fa-ghost" }
    ];

    function recarregarEditorEAcionar(tipo, acao) {
        const base = "js/admin-literario.js";
        document.querySelectorAll(`script[src^="${base}"]`).forEach(s => s.remove());
        const script = document.createElement("script");
        script.src = `${base}?v=20260915-0751-${Date.now()}`;
        script.async = false;
        script.addEventListener("load", () => {
            window.setTimeout(() => {
                if (acao === "abrir") {
                    document.querySelector(`[data-admin-tab="${tipo}"]:not([data-core-literary])`)?.click();
                } else {
                    document.querySelector(`[data-admin-create="${tipo}"]:not([data-core-literary])`)?.click();
                }
            }, 0);
        }, { once: true });
        document.head.appendChild(script);
    }

    function garantirModulosLiterariosAdmin() {
        const painel = document.querySelector("#admin-manager .admin-manager");
        const tabs = painel?.querySelector(".admin-content-tabs");
        const actions = painel?.querySelector(".admin-actions");
        if (!painel || !tabs || !actions) return false;

        MODULOS.forEach(modulo => {
            if (!tabs.querySelector(`[data-admin-tab="${modulo.tipo}"]`)) {
                const botao = document.createElement("button");
                botao.type = "button";
                botao.dataset.adminTab = modulo.tipo;
                botao.dataset.coreLiterary = "true";
                botao.innerHTML = `<i class="fa-solid ${modulo.icone}"></i><span>${modulo.nome}</span><small data-lit-count="${modulo.tipo}">0</small>`;
                botao.addEventListener("click", () => {
                    botao.remove();
                    recarregarEditorEAcionar(modulo.tipo, "abrir");
                });
                tabs.appendChild(botao);
            }

            if (!actions.querySelector(`[data-admin-create="${modulo.tipo}"]`)) {
                const novo = document.createElement("button");
                novo.type = "button";
                novo.className = "admin-action-button";
                novo.dataset.adminCreate = modulo.tipo;
                novo.dataset.coreLiterary = "true";
                novo.hidden = true;
                novo.innerHTML = `<i class="fa-solid fa-square-plus"></i> NOVA ${modulo.singular.toUpperCase()}`;
                novo.addEventListener("click", () => {
                    novo.remove();
                    recarregarEditorEAcionar(modulo.tipo, "novo");
                });
                actions.insertBefore(novo, actions.querySelector("#admin-logout"));
            }

            if (!painel.querySelector(`[data-admin-section="${modulo.tipo}"]`)) {
                const secao = document.createElement("section");
                secao.className = "admin-list-section literary-admin-section";
                secao.dataset.adminSection = modulo.tipo;
                secao.dataset.coreLiterary = "true";
                secao.hidden = true;
                secao.innerHTML = `<h3>${modulo.nome}</h3><div class="literary-status-tabs"><button type="button" data-lit-filter="all">TODAS</button><button type="button" data-lit-filter="rascunho">RASCUNHOS</button><button type="button" data-lit-filter="publicado">PUBLICADAS</button></div><div class="admin-list" data-lit-list="${modulo.tipo}"><p class="admin-empty">Abra ${modulo.nome} para consultar os registros.</p></div>`;
                painel.appendChild(secao);
            }
        });

        if (typeof inicializarOrganizacaoAdmin === "function") inicializarOrganizacaoAdmin();
        return true;
    }

    window.garantirModulosLiterariosAdmin = garantirModulosLiterariosAdmin;

    const observer = new MutationObserver(() => garantirModulosLiterariosAdmin());
    observer.observe(document.documentElement, { childList: true, subtree: true });

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", garantirModulosLiterariosAdmin, { once: true });
    } else {
        garantirModulosLiterariosAdmin();
    }
})();
