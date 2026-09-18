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

        if (senha.length < 8) {
            mostrarMensagem(
                "A senha deve possuir pelo menos 8 caracteres.",
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
            mostrarMensagem(
                "Não foi possível alterar a senha. O link pode ter expirado; solicite uma nova verificação.",
                "erro"
            );
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
