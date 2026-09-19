(function () {
    "use strict";

    const hashInicial =
        window.location.hash;

    const parametrosHash =
        new URLSearchParams(
            hashInicial.replace(/^#/, "")
        );

    const parametrosBusca =
        new URLSearchParams(
            window.location.search
        );

    let recuperacaoAutorizada =
        parametrosHash.get("type") === "recovery" ||
        parametrosBusca.get("type") === "recovery";

    document.addEventListener(
        "DOMContentLoaded",
        iniciarRedefinicaoSenha
    );

    async function iniciarRedefinicaoSenha() {
        const carregando =
            document.getElementById("recovery-loading");
        const formulario =
            document.getElementById("recovery-form");
        const invalido =
            document.getElementById("recovery-invalid");

        try {
            if (typeof obterClienteSupabase !== "function") {
                throw new Error("Cliente de autenticação indisponível.");
            }

            const supabase =
                await obterClienteSupabase();

            if (!supabase) {
                throw new Error("Não foi possível conectar ao serviço de autenticação.");
            }

            const {
                data: observador
            } = supabase.auth.onAuthStateChange(
                function (evento) {
                    if (evento === "PASSWORD_RECOVERY") {
                        recuperacaoAutorizada = true;
                        exibirFormulario();
                    }
                }
            );

            const {
                data,
                error
            } = await supabase.auth.getSession();

            if (error) {
                throw error;
            }

            window.setTimeout(
                function () {
                    if (
                        recuperacaoAutorizada &&
                        data?.session
                    ) {
                        exibirFormulario();
                        return;
                    }

                    if (!recuperacaoAutorizada) {
                        exibirLinkInvalido();
                    }
                },
                450
            );

            formulario.addEventListener(
                "submit",
                function (evento) {
                    salvarNovaSenha(
                        evento,
                        supabase,
                        observador?.subscription
                    );
                }
            );

            formulario
                .querySelectorAll("[data-password-toggle]")
                .forEach(function (botao) {
                    botao.addEventListener("click", function () {
                        const campo = document.getElementById(
                            botao.dataset.passwordToggle
                        );

                        if (!campo) return;

                        const visivel = campo.type === "password";
                        campo.type = visivel ? "text" : "password";
                        botao.setAttribute("aria-pressed", String(visivel));
                        botao.setAttribute(
                            "aria-label",
                            visivel ? "Ocultar senha" : "Mostrar senha"
                        );
                        botao.innerHTML = visivel
                            ? '<i class="fa-regular fa-eye-slash" aria-hidden="true"></i>'
                            : '<i class="fa-regular fa-eye" aria-hidden="true"></i>';
                    });
                });
        }
        catch (erro) {
            console.error(
                "Erro ao validar recuperação de senha:",
                erro
            );
            exibirLinkInvalido();
        }

        function exibirFormulario() {
            carregando.hidden = true;
            invalido.hidden = true;
            formulario.hidden = false;
            document.getElementById(
                "recovery-password"
            )?.focus();
        }

        function exibirLinkInvalido() {
            carregando.hidden = true;
            formulario.hidden = true;
            invalido.hidden = false;
        }
    }

    async function salvarNovaSenha(
        evento,
        supabase,
        subscription
    ) {
        evento.preventDefault();

        const formulario =
            evento.currentTarget;
        const senha =
            formulario.password.value;
        const confirmacao =
            formulario.confirmation.value;
        const encerrarOutras =
            document.getElementById(
                "recovery-revoke-others"
            ).checked;
        const botao =
            document.getElementById(
                "recovery-submit"
            );
        const mensagem =
            document.getElementById(
                "recovery-message"
            );

        mensagem.dataset.status = "";
        mensagem.textContent = "";

        const senhaSegura =
            senha.length >= 12 &&
            /[a-z]/.test(senha) &&
            /[A-Z]/.test(senha) &&
            /\d/.test(senha) &&
            /[^A-Za-z0-9]/.test(senha);

        if (!senhaSegura) {
            mostrarMensagem(
                "A senha precisa ter no mínimo 12 caracteres, com letra maiúscula, minúscula, número e símbolo.",
                "erro"
            );
            return;
        }

        if (senha !== confirmacao) {
            mostrarMensagem(
                "As duas senhas não coincidem.",
                "erro"
            );
            return;
        }

        try {
            botao.disabled = true;
            botao.textContent = "Salvando…";

            const {
                error
            } = await supabase.auth.updateUser({
                password: senha
            });

            if (error) {
                throw error;
            }

            if (encerrarOutras) {
                const {
                    error: erroSessoes
                } = await supabase.auth.signOut({
                    scope: "others"
                });

                if (erroSessoes) {
                    console.warn(
                        "Senha alterada, mas outras sessões não foram encerradas:",
                        erroSessoes
                    );
                }
            }

            formulario.reset();
            mostrarMensagem(
                "Senha alterada com segurança. Você será direcionado ao Meu Arquivo.",
                "sucesso"
            );

            subscription?.unsubscribe();

            window.history.replaceState(
                {},
                document.title,
                "redefinir-senha.html"
            );

            window.setTimeout(
                function () {
                    window.location.replace(
                        "meu-arquivo.html"
                    );
                },
                1600
            );
        }
        catch (erro) {
            console.error(
                "Erro ao salvar nova senha:",
                erro
            );
            const detalhe = String(erro?.message || "");

            if (/password|senha|weak|leaked|character|caractere/i.test(detalhe)) {
                mostrarMensagem(
                    "A senha foi recusada pelo sistema: " + detalhe,
                    "erro"
                );
            } else if (/reauth|nonce|current password|senha atual/i.test(detalhe)) {
                mostrarMensagem(
                    "Esta conta exige uma confirmação adicional. Solicite uma nova verificação e tente novamente.",
                    "erro"
                );
            } else {
                mostrarMensagem(
                    "Não foi possível alterar a senha agora. " + (detalhe || "Tente solicitar um novo link de verificação."),
                    "erro"
                );
            }
            botao.disabled = false;
            botao.innerHTML =
                '<i class="fa-solid fa-key"></i> Salvar nova senha';
        }

        function mostrarMensagem(texto, status) {
            mensagem.textContent = texto;
            mensagem.dataset.status = status;
        }
    }
})();
