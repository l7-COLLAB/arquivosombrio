"use strict";

/* Minha biblioteca de novels — usa o mesmo cliente autenticado de Meu Arquivo. */
(async function iniciarLeiturasMeuArquivo() {
    const favoritos = document.getElementById("favoritos");
    if (!favoritos || typeof obterSupabaseMeuArquivo !== "function") return;

    const painel = document.createElement("section");
    painel.className = "novel-library-panel";
    painel.setAttribute("aria-labelledby", "novel-library-title");

    const titulo = document.createElement("h3");
    titulo.id = "novel-library-title";
    titulo.textContent = "Minhas Leituras";
    const descricao = document.createElement("p");
    descricao.textContent = "Novels salvas e o ponto em que você parou.";
    const lista = document.createElement("div");
    lista.id = "novel-library-list";
    lista.className = "novel-library-list";
    lista.setAttribute("aria-live", "polite");
    lista.textContent = "Carregando leituras…";
    painel.append(titulo, descricao, lista);
    favoritos.parentNode.insertBefore(painel, favoritos);

    function mensagem(texto, erro = false) {
        lista.replaceChildren();
        const textoVazio = document.createElement("p");
        textoVazio.className = erro ? "novel-library-error" : "novel-library-empty";
        textoVazio.textContent = texto;
        lista.appendChild(textoVazio);
    }

    try {
        const cliente = await obterSupabaseMeuArquivo();
        const { data: usuarioData, error: erroUsuario } = await cliente.auth.getUser();
        if (erroUsuario) throw erroUsuario;
        const usuario = usuarioData?.user;
        if (!usuario) {
            mensagem("Entre em sua conta para sincronizar suas leituras.");
            return;
        }

        const [bibliotecaResposta, progressoResposta] = await Promise.all([
            cliente.from("novel_biblioteca")
                .select("novel_id,estado,novels(slug,titulo,imagem_capa,status_publicacao)")
                .eq("user_id", usuario.id),
            cliente.from("novel_progresso")
                .select("novel_id,percentual,novel_capitulos(numero,titulo)")
                .eq("user_id", usuario.id)
        ]);
        if (bibliotecaResposta.error) throw bibliotecaResposta.error;
        if (progressoResposta.error) throw progressoResposta.error;

        const progressoPorLivro = new Map((progressoResposta.data || []).map(registro => [registro.novel_id, registro]));
        const livros = (bibliotecaResposta.data || []).filter(registro => {
            const obra = Array.isArray(registro.novels) ? registro.novels[0] : registro.novels;
            return obra && obra.slug && obra.status_publicacao === "publicado";
        });
        if (!livros.length) {
            mensagem("Você ainda não possui novels publicadas salvas na sua biblioteca.");
            return;
        }

        const fragmento = document.createDocumentFragment();
        for (const registro of livros) {
            const obra = Array.isArray(registro.novels) ? registro.novels[0] : registro.novels;
            const progresso = progressoPorLivro.get(registro.novel_id);
            const capitulo = Array.isArray(progresso?.novel_capitulos)
                ? progresso.novel_capitulos[0]
                : progresso?.novel_capitulos;
            const numero = Number(capitulo?.numero);
            const numeroValido = Number.isInteger(numero) && numero > 0;
            const link = document.createElement("a");
            link.className = "novel-library-item";
            link.href = "novel.html?obra=" + encodeURIComponent(obra.slug) +
                (numeroValido ? "&capitulo=" + encodeURIComponent(numero) : "");

            const capa = document.createElement("span");
            capa.className = "novel-library-thumb";
            try {
                const origem = new URL(String(obra.imagem_capa || ""), location.href);
                if (["http:", "https:"].includes(origem.protocol) && obra.imagem_capa) {
                    const imagem = document.createElement("img");
                    imagem.src = origem.href;
                    imagem.alt = "";
                    imagem.loading = "lazy";
                    capa.appendChild(imagem);
                }
            } catch (_) {
                // Capa inválida: mostrar o marcador visual neutro.
            }

            const meta = document.createElement("span");
            meta.className = "novel-library-meta";
            const nome = document.createElement("strong");
            nome.textContent = String(obra.titulo || "Novel");
            const subtitulo = document.createElement("small");
            const percentual = Math.max(0, Math.min(100, Math.round(Number(progresso?.percentual) || 0)));
            subtitulo.textContent = numeroValido
                ? "Capítulo " + numero + " · " + percentual + "%"
                : registro.estado === "concluido" ? "Leitura concluída" : "Na biblioteca";
            meta.append(nome, subtitulo);
            link.append(capa, meta);
            const entrada = document.createElement("div");
            entrada.className = "novel-library-entry";
            const marcadores = document.createElement("button");
            marcadores.type = "button";
            marcadores.className = "arquivo-button arquivo-button-secondary";
            marcadores.dataset.archiveTag = "novel";
            marcadores.dataset.tagItemId = String(registro.novel_id);
            marcadores.textContent = "Marcadores";
            entrada.append(link, marcadores);
            fragmento.appendChild(entrada);
        }
        lista.replaceChildren(fragmento);
    } catch (erro) {
        console.error("Falha ao carregar Minhas Leituras:", erro);
        mensagem("Não foi possível carregar suas leituras. Recarregue a página para tentar novamente.", true);
    }
})();
