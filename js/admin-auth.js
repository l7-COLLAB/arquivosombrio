"use strict";

(() => {
    const SUPABASE_URL =
        "https://iuhotznurbyujzbyhizf.supabase.co";

    const SUPABASE_KEY =
        "sb_publishable_bpAZ5EhYLIuVoE4Q97s_-A_XQwwRxUj";

    const STORAGE_KEY =
        "arquivo-sombrio-admin-auth-v2";

    function mensagem(elemento, texto, erro = false) {
        if (!elemento) return;
        elemento.textContent = texto;
        elemento.classList.toggle("visible", Boolean(texto));
        elemento.style.color = erro ? "#e1a09a" : "";
    }

    function clienteAdmin() {
        if (window.arquivoAdminSupabaseClient) {
            return window.arquivoAdminSupabaseClient;
        }

        if (!window.supabase?.createClient) {
            throw new Error(
                "A biblioteca de autenticação não carregou. Atualize a página."
            );
        }

        window.arquivoAdminSupabaseClient =
            window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_KEY,
                {
                    auth: {
                        storageKey: STORAGE_KEY,
                        persistSession: true,
                        autoRefreshToken: true,
                        detectSessionInUrl: false
                    }
                }
            );

        return window.arquivoAdminSupabaseClient;
    }

    function comPrazo(promessa, milissegundos, texto) {
        return Promise.race([
            promessa,
            new Promise((_, rejeitar) =>
                window.setTimeout(
                    () => rejeitar(new Error(texto)),
                    milissegundos
                )
            )
        ]);
    }

    async function obterSessaoAdminIsolada() {
        const cliente = clienteAdmin();
        const { data, error } = await comPrazo(
            cliente.auth.getSession(),
            12000,
            "A sessão demorou demais para responder."
        );

        if (error) throw error;

        const sessao = data?.session;
        if (sessao?.user?.app_metadata?.role !== "admin") {
            return null;
        }

        return sessao;
    }

    async function entrar(evento) {
        evento.preventDefault();

        const formulario = evento.currentTarget;
        const email = document.getElementById("admin-email")?.value.trim();
        const senha = document.getElementById("admin-pass")?.value || "";
        const token = window.ARQUIVO_ADMIN_CAPTCHA_TOKEN || "";
        const erro = document.getElementById("admin-login-erro");
        const status = document.getElementById("admin-captcha-status");
        const botao = document.getElementById("admin-submit");
        const original = botao?.innerHTML || "Acessar Painel";

        if (!email || !senha) {
            mensagem(erro, "Preencha o e-mail e a senha.", true);
            return;
        }

        if (!token) {
            mensagem(erro, "Conclua a verificação de segurança.", true);
            return;
        }

        if (botao) {
            botao.disabled = true;
            botao.innerHTML =
                '<i class="fa-solid fa-spinner fa-spin"></i> Entrando...';
        }

        mensagem(erro, "");
        if (status) status.textContent = "Autenticando com segurança...";

        try {
            const cliente = clienteAdmin();
            const { data, error } = await comPrazo(
                cliente.auth.signInWithPassword({
                    email,
                    password: senha,
                    options: { captchaToken: token }
                }),
                25000,
                "O servidor demorou demais para responder. Tente novamente."
            );

            if (error) throw error;
            if (!data?.session?.user) {
                throw new Error("O Supabase não criou a sessão administrativa.");
            }

            if (data.session.user.app_metadata?.role !== "admin") {
                await cliente.auth.signOut();
                throw new Error("Esta conta não possui permissão administrativa.");
            }

            if (status) status.textContent = "Acesso confirmado. Abrindo o painel...";
            sessionStorage.setItem("arquivo-admin-verified-at", String(Date.now()));
            sessionStorage.setItem("arquivo-admin-verified-user", data.session.user.id);
            const destino = new URLSearchParams(window.location.search).get("next");
            window.location.replace(
                destino === "adm" || destino === "admin-v2"
                    ? "adm/"
                    : "painel-admin.html?v=20260923-agendado-1"
            );
        } catch (falha) {
            console.error("Falha no acesso administrativo.", falha);
            const texto = String(falha?.message || "");
            const amigavel = /invalid login credentials/i.test(texto)
                ? "E-mail ou senha incorretos."
                : /captcha|turnstile|challenge/i.test(texto)
                    ? "A verificação de segurança expirou. Marque-a novamente."
                    : texto || "Não foi possível entrar na área administrativa.";

            mensagem(erro, amigavel, true);
            if (status) status.textContent = "Faça uma nova verificação para tentar novamente.";
            window.arquivoAdminCaptchaReset?.();
        } finally {
            if (botao) {
                botao.disabled = !window.ARQUIVO_ADMIN_CAPTCHA_TOKEN;
                botao.innerHTML = original;
            }
        }
    }

    window.obterClienteAdminIsolado = clienteAdmin;
    window.obterSessaoAdminIsolada = obterSessaoAdminIsolada;

    window.addEventListener("DOMContentLoaded", () => {
        try {
            clienteAdmin();
        } catch (erro) {
            mensagem(
                document.getElementById("admin-login-erro"),
                erro.message,
                true
            );
        }

        document
            .getElementById("form-admin-login")
            ?.addEventListener("submit", entrar);
    });
})();
