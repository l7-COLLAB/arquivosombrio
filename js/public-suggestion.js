/* Sugestões públicas: confirmação remota, proteção contra envios repetidos e rascunho local. */
"use strict";
(() => {
    const DRAFT_KEY = "arquivo_sombrio_sugestao_pendente_v1";

    function loadDraft() {
        try {
            const value = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
            if (value && typeof value === "object" &&
                typeof value.nome === "string" && typeof value.titulo === "string" &&
                typeof value.descricao === "string") return value;
        } catch (_) { /* Armazenamento indisponível ou inválido. */ }
        return null;
    }

    function saveDraft(value) {
        try {
            localStorage.setItem(DRAFT_KEY, JSON.stringify(value));
            return true;
        } catch (_) { return false; }
    }

    function clearDraft() {
        try { localStorage.removeItem(DRAFT_KEY); } catch (_) { /* A confirmação remota prevalece. */ }
    }

    function init() {
        const form = document.getElementById("form-sugestao");
        if (!form || form.dataset.suggestionReady === "true") return;
        const nome = document.getElementById("sug-nome");
        const titulo = document.getElementById("sug-titulo");
        const descricao = document.getElementById("sug-descricao");
        const message = document.getElementById("mensagem-sucesso");
        const button = form.querySelector('button[type="submit"]');
        if (!nome || !titulo || !descricao || !message || !button) return;
        form.dataset.suggestionReady = "true";

        function status(text, type) {
            message.textContent = text;
            message.classList.add("visible");
            message.classList.toggle("error-message", type === "error");
            message.setAttribute("role", "status");
        }

        const draft = loadDraft();
        if (draft && !nome.value && !titulo.value && !descricao.value) {
            nome.value = draft.nome;
            titulo.value = draft.titulo;
            descricao.value = draft.descricao;
            status("Rascunho não confirmado recuperado deste navegador. Revise os dados e clique em Enviar para o Arquivo.", "error");
        }

        form.addEventListener("submit", async event => {
            event.preventDefault();
            if (form.dataset.suggestionBusy === "true") return;

            const payload = {
                nome: nome.value.trim(),
                titulo: titulo.value.trim(),
                descricao: descricao.value.trim()
            };
            if (payload.nome.length < 2 || payload.nome.length > 60 ||
                payload.titulo.length < 3 || payload.titulo.length > 150 ||
                payload.descricao.length > 1200) {
                status("Informe um nome de 2 a 60 caracteres, um tema de 3 a 150 caracteres e até 1.200 caracteres na descrição.", "error");
                return;
            }

            // A gravação local é apenas um rascunho, nunca a confirmação de recebimento.
            const saved = saveDraft(payload);
            form.dataset.suggestionBusy = "true";
            form.setAttribute("aria-busy", "true");
            button.disabled = true;
            nome.disabled = titulo.disabled = descricao.disabled = true;
            status("Enviando sugestão e aguardando a confirmação do Arquivo Sombrio.", "pending");

            try {
                // A função já aplica validação, origem permitida, rate limit e inserção protegida.
                // Sem Authorization: visitantes não autenticados podem enviar sem abrir a tabela ao público.
                const response = await fetch(SUPABASE_URL + "/functions/v1/public-contribution-submit", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "apikey": SUPABASE_PUBLISHABLE_KEY
                    },
                    body: JSON.stringify({
                        kind: "suggestion",
                        name: payload.nome,
                        title: payload.titulo,
                        description: payload.descricao
                    })
                });
                const result = await response.json().catch(() => null);
                if (!response.ok || result?.ok !== true) {
                    const detail = response.status === 429
                        ? "Limite temporário de envios atingido. Tente novamente mais tarde."
                        : "O serviço não confirmou o recebimento.";
                    throw new Error(detail);
                }
                clearDraft();
                form.reset();
                status("Sugestão recebida e registrada no Arquivo Sombrio.", "success");
            } catch (error) {
                console.warn("Não foi possível confirmar o envio da sugestão.", error);
                status(
                    saved
                        ? "Não foi possível confirmar o recebimento. Seu texto foi guardado como rascunho neste navegador. Revise antes de reenviar, pois a tentativa anterior pode ter sido recebida."
                        : "Não foi possível confirmar o recebimento nem guardar um rascunho neste navegador. Copie seu texto antes de sair e tente novamente.",
                    "error"
                );
            } finally {
                form.dataset.suggestionBusy = "false";
                form.removeAttribute("aria-busy");
                button.disabled = false;
                nome.disabled = titulo.disabled = descricao.disabled = false;
            }
        });
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})();
