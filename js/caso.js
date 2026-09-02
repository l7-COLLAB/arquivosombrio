"use strict";


document.addEventListener(
    "DOMContentLoaded",
    carregarCaso
);


function lerStorage(chave, fallback = []) {

    try {

        const valor = localStorage.getItem(chave);

        if (!valor) {
            return fallback;
        }

        return JSON.parse(valor);

    } catch (erro) {

        console.error(
            "Erro ao ler localStorage:",
            erro
        );

        return fallback;
    }
}


function escaparHTML(valor) {

    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function obterTodosCasos() {

    const base =
        typeof casosArquivo !== "undefined"
            ? casosArquivo
            : [];

    const personalizados =
        lerStorage(
            "arquivo_sombrio_casos",
            []
        );

    return [
        ...base,
        ...personalizados
    ];
}


function obterIdDaURL() {

    const parametros =
        new URLSearchParams(
            window.location.search
        );

    const id =
        parametros.get("id");

    if (!id) {
        return null;
    }

    return String(id);
}


function carregarCaso() {

    const id =
        obterIdDaURL();

    if (!id) {

        mostrarNaoEncontrado();

        return;
    }


    const casos =
        obterTodosCasos();


    const caso =
        casos.find(
            item =>
                String(item.id) === id
        );


    if (!caso) {

        mostrarNaoEncontrado();

        return;
    }


    renderizarCaso(caso);
}


function renderizarCaso(caso) {

    preencherTexto(
        "caso-titulo",
        caso.titulo
    );

    preencherTexto(
        "caso-categoria",
        caso.categoria || "ARQUIVO"
    );

    preencherTexto(
        "caso-status",
        caso.status || "EM ANÁLISE"
    );

    preencherTexto(
        "caso-local",
        caso.local || "Não informado"
    );

    preencherTexto(
        "caso-ano",
        caso.ano || "—"
    );

    preencherTexto(
        "caso-status-meta",
        caso.status || "Em análise"
    );

    preencherTexto(
        "caso-resumo",
        caso.resumo || ""
    );


    preencherTexto(
        "caso-id",
        `AS-${String(caso.id).padStart(3, "0")}`
    );

    preencherTexto(
        "caso-categoria-sidebar",
        caso.categoria || "ARQUIVO"
    );

    preencherTexto(
        "caso-local-sidebar",
        caso.local || "Não informado"
    );

    preencherTexto(
        "caso-ano-sidebar",
        caso.ano || "—"
    );

    preencherTexto(
        "caso-status-sidebar",
        caso.status || "Em análise"
    );


    renderizarImagem(caso);

    renderizarHistoria(caso);

    renderizarEvidencias(caso.evidencias);

    renderizarTeorias(caso.teorias);


    document.title =
        `${caso.titulo} — Arquivo Sombrio`;
}


function preencherTexto(id, valor) {

    const elemento =
        document.getElementById(id);

    if (!elemento) {
        return;
    }

    elemento.textContent =
        valor ?? "";
}


function renderizarImagem(caso) {

    const imagem =
        document.getElementById(
            "caso-imagem"
        );

    if (!imagem) {
        return;
    }


    imagem.src =
        caso.imagem ||
        "https://placehold.co/900x650/111/777?text=Arquivo+Sombrio";


    imagem.alt =
        caso.titulo
            ? `Imagem relacionada ao caso ${caso.titulo}`
            : "Imagem do dossiê";


    imagem.onerror =
        function () {

            this.onerror = null;

            this.src =
                "https://placehold.co/900x650/111/777?text=Arquivo+Sombrio";
        };
}


function renderizarHistoria(caso) {

    const container =
        document.getElementById(
            "caso-historia"
        );

    if (!container) {
        return;
    }


    const casoBase =
        typeof casosArquivo !== "undefined" &&
        casosArquivo.some(
            item =>
                String(item.id) ===
                String(caso.id)
        );


    if (
        casoBase &&
        caso.historia
    ) {

        container.innerHTML =
            caso.historia;

        return;
    }


    const historia =
        String(
            caso.historia || ""
        ).trim();


    if (!historia) {

        container.innerHTML =
            "<p>Este arquivo ainda não possui histórico detalhado.</p>";

        return;
    }


    const paragrafos =
        historia
            .split(/\n\s*\n/)
            .map(
                trecho =>
                    trecho.trim()
            )
            .filter(Boolean);


    container.innerHTML =
        paragrafos
            .map(
                paragrafo =>
                    `<p>${escaparHTML(paragrafo)}</p>`
            )
            .join("");
}


function renderizarEvidencias(evidencias) {

    const container =
        document.getElementById(
            "caso-evidencias"
        );

    if (!container) {
        return;
    }

    const lista =
        Array.isArray(evidencias)
            ? evidencias
            : [];

    if (!lista.length) {

        container.innerHTML =
            `
            <div class="evidence-item">
                <i class="fa-solid fa-folder-open"></i>

                <p>
                    Nenhuma evidência foi cadastrada.
                </p>
            </div>
            `;

        return;
    }

    container.innerHTML =
        lista
            .map(
                function(evidencia, indice) {

                    /*
                     * Compatibilidade com os casos antigos:
                     * se a evidência ainda for apenas texto,
                     * ela continua sendo exibida normalmente.
                     */

                    if (
                        typeof evidencia ===
                        "string"
                    ) {

                        return `
                            <div class="evidence-card evidence-card-simple">

                                <div class="evidence-card-header">

                                    <i class="fa-solid fa-magnifying-glass"></i>

                                    <div>
                                        <span class="evidence-number">
                                            EVIDÊNCIA ${String(indice + 1).padStart(2, "0")}
                                        </span>

                                        <h3>
                                            ${escaparHTML(evidencia)}
                                        </h3>
                                    </div>

                                </div>

                            </div>
                        `;
                    }


                    const titulo =
                        evidencia.titulo ||
                        "Evidência sem título";

                    const resumo =
                        evidencia.resumo ||
                        "";

                    const detalhes =
                        evidencia.detalhes ||
                        evidencia.descricao ||
                        "";

                    const imagem =
                        evidencia.imagem ||
                        "";

                    const legenda =
                        evidencia.legenda ||
                        "";

                    const fonte =
                        evidencia.fonte ||
                        "";

                    return `
                        <article class="evidence-card">

                            <button
                                type="button"
                                class="evidence-toggle"
                                aria-expanded="false"
                            >

                                <div class="evidence-card-header">

                                    <i class="fa-solid fa-magnifying-glass"></i>

                                    <div class="evidence-heading">

                                        <span class="evidence-number">
                                            EVIDÊNCIA ${String(indice + 1).padStart(2, "0")}
                                        </span>

                                        <h3>
                                            ${escaparHTML(titulo)}
                                        </h3>

                                        ${
                                            resumo
                                                ? `
                                                    <p>
                                                        ${escaparHTML(resumo)}
                                                    </p>
                                                `
                                                : ""
                                        }

                                    </div>

                                    <span class="evidence-open-label">
                                        ABRIR
                                        <i class="fa-solid fa-plus"></i>
                                    </span>

                                </div>

                            </button>


                            <div
                                class="evidence-details"
                                hidden
                            >

                                ${
                                    imagem
                                        ? `
                                            <figure class="evidence-image">

                                                <img
                                                    src="${escaparHTML(imagem)}"
                                                    alt="${escaparHTML(titulo)}"
                                                    loading="lazy"
                                                >

                                                ${
                                                    legenda
                                                        ? `
                                                            <figcaption>
                                                                ${escaparHTML(legenda)}
                                                            </figcaption>
                                                        `
                                                        : ""
                                                }

                                            </figure>
                                        `
                                        : ""
                                }


                                ${
                                    detalhes
                                        ? `
                                            <div class="evidence-text">
                                                <p>
                                                    ${escaparHTML(detalhes)}
                                                </p>
                                            </div>
                                        `
                                        : `
                                            <div class="evidence-text">
                                                <p>
                                                    Informações complementares desta evidência ainda não foram cadastradas.
                                                </p>
                                            </div>
                                        `
                                }


                                ${
                                    fonte
                                        ? `
                                            <div class="evidence-source">
                                                <span>FONTE / REFERÊNCIA</span>
                                                <p>
                                                    ${escaparHTML(fonte)}
                                                </p>
                                            </div>
                                        `
                                        : ""
                                }

                            </div>

                        </article>
                    `;
                }
            )
            .join("");


    const botoes =
        container.querySelectorAll(
            ".evidence-toggle"
        );

    botoes.forEach(
        function(botao) {

            botao.addEventListener(
                "click",
                function() {

                    const card =
                        botao.closest(
                            ".evidence-card"
                        );

                    const detalhes =
                        card.querySelector(
                            ".evidence-details"
                        );

                    const aberto =
                        botao.getAttribute(
                            "aria-expanded"
                        ) === "true";

                    botao.setAttribute(
                        "aria-expanded",
                        String(!aberto)
                    );

                    detalhes.hidden =
                        aberto;

                    const label =
                        botao.querySelector(
                            ".evidence-open-label"
                        );

                    if (label) {

                        label.innerHTML =
                            aberto
                                ? `
                                    ABRIR
                                    <i class="fa-solid fa-plus"></i>
                                `
                                : `
                                    FECHAR
                                    <i class="fa-solid fa-minus"></i>
                                `;
                    }

                    card.classList.toggle(
                        "open",
                        !aberto
                    );
                }
            );
        }
    );
}

function renderizarTeorias(teorias) {

    const container =
        document.getElementById(
            "caso-teorias"
        );

    if (!container) {
        return;
    }


    const lista =
        Array.isArray(teorias)
            ? teorias
            : [];


    if (!lista.length) {

        container.innerHTML =
            `
            <div class="theory-item">

                <i class="fa-solid fa-question"></i>

                <p>
                    Nenhuma teoria foi registrada neste arquivo.
                </p>

            </div>
            `;

        return;
    }


    container.innerHTML =
        lista
            .map(
                teoria =>
                    `
                    <div class="theory-item">

                        <i class="fa-solid fa-circle-question"></i>

                        <p>
                            ${escaparHTML(teoria)}
                        </p>

                    </div>
                    `
            )
            .join("");
}


function mostrarNaoEncontrado() {

    const hero =
        document.querySelector(
            ".case-hero"
        );

    const conteudo =
        document.querySelector(
            ".case-content-section"
        );

    const erro =
        document.getElementById(
            "caso-nao-encontrado"
        );


    if (hero) {
        hero.style.display = "none";
    }

    if (conteudo) {
        conteudo.style.display = "none";
    }

    if (erro) {
        erro.classList.add("active");
    }


    document.title =
        "Arquivo não encontrado — Arquivo Sombrio";
}
