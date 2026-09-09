"use strict";


/* ==========================================================================
   SUPABASE — PÁGINA INDIVIDUAL DO DOSSIÊ
   ========================================================================== */

const CASO_SUPABASE_URL =
    "https://iuhotznurbyujzbyhizf.supabase.co";

const CASO_SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_bpAZ5EhYLIuVoE4Q97s_-A_XQwwRxUj";

const CASO_SUPABASE_SDK_URL =
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

let casoClienteSupabase = null;

let casoPromessaSupabaseSDK = null;


/* ==========================================================================
   INICIALIZAÇÃO
   ========================================================================== */

document.addEventListener(
    "DOMContentLoaded",
    carregarCaso
);


/* ==========================================================================
   SUPABASE
   ========================================================================== */

function carregarSupabaseCasoSDK() {

    if (
        window.supabase &&
        typeof window.supabase.createClient ===
            "function"
    ) {

        return Promise.resolve();
    }


    if (casoPromessaSupabaseSDK) {

        return casoPromessaSupabaseSDK;
    }


    casoPromessaSupabaseSDK =
        new Promise(
            (resolve, reject) => {

                const scriptExistente =
                    document.querySelector(
                        'script[data-caso-supabase="true"]'
                    );


                if (scriptExistente) {

                    scriptExistente.addEventListener(
                        "load",
                        resolve,
                        {
                            once: true
                        }
                    );

                    scriptExistente.addEventListener(
                        "error",
                        () =>
                            reject(
                                new Error(
                                    "Não foi possível carregar o Supabase."
                                )
                            ),
                        {
                            once: true
                        }
                    );

                    return;
                }


                const script =
                    document.createElement(
                        "script"
                    );


                script.src =
                    CASO_SUPABASE_SDK_URL;

                script.async =
                    true;

                script.dataset.casoSupabase =
                    "true";


                script.addEventListener(
                    "load",
                    resolve,
                    {
                        once: true
                    }
                );


                script.addEventListener(
                    "error",
                    () =>
                        reject(
                            new Error(
                                "Não foi possível carregar o Supabase."
                            )
                        ),
                    {
                        once: true
                    }
                );


                document.head.appendChild(
                    script
                );
            }
        );


    return casoPromessaSupabaseSDK;
}


async function obterClienteSupabaseCaso() {

    if (casoClienteSupabase) {

        return casoClienteSupabase;
    }


    await carregarSupabaseCasoSDK();


    if (
        !window.supabase ||
        typeof window.supabase.createClient !==
            "function"
    ) {

        throw new Error(
            "A biblioteca do Supabase não está disponível."
        );
    }


    casoClienteSupabase =
        window.supabase.createClient(
            CASO_SUPABASE_URL,
            CASO_SUPABASE_PUBLISHABLE_KEY,
            {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                }
            }
        );


    return casoClienteSupabase;
}


/* ==========================================================================
   UTILITÁRIOS
   ========================================================================== */

function lerStorage(
    chave,
    fallback = []
) {

    try {

        const valor =
            localStorage.getItem(
                chave
            );


        if (!valor) {

            return fallback;
        }


        return JSON.parse(
            valor
        );


    } catch (erro) {

        console.error(
            "Erro ao ler localStorage:",
            erro
        );


        return fallback;
    }
}


function escaparHTML(valor) {

    return String(
        valor ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}


/* ==========================================================================
   CASOS LOCAIS / ANTIGOS
   ========================================================================== */

function obterCasosLocais() {

    const base =
        typeof casosArquivo !==
            "undefined" &&
        Array.isArray(
            casosArquivo
        )
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


/* ==========================================================================
   ID DA URL
   ========================================================================== */

function obterIdDaURL() {

    const parametros =
        new URLSearchParams(
            window.location.search
        );


    const id =
        parametros.get(
            "id"
        );


    if (!id) {

        return null;
    }


    return String(
        id
    );
}


/* ==========================================================================
   BUSCAR CASO NO SUPABASE
   ========================================================================== */

async function buscarCasoSupabase(
    id
) {

    try {

        const supabaseClient =
            await obterClienteSupabaseCaso();


        const {
            data,
            error
        } =
            await supabaseClient
                .from(
                    "Casos"
                )
                .select(
                    "*"
                )
                .eq(
                    "id",
                    id
                )
                .maybeSingle();


        if (error) {

            throw error;
        }


        return data || null;


    } catch (erro) {

        console.error(
            "Erro ao buscar o dossiê no Supabase:",
            erro
        );


        return null;
    }
}


/* ==========================================================================
   CARREGAR DOSSIÊ
   ========================================================================== */

async function carregarCaso() {

    const id =
        obterIdDaURL();


    if (!id) {

        mostrarNaoEncontrado();

        return;
    }


    /*
     * 1. Tenta buscar o dossiê diretamente
     *    no Supabase.
     */

    let caso =
        await buscarCasoSupabase(
            id
        );


    /*
     * 2. Se não estiver no Supabase,
     *    procura nos casos antigos do site.
     */

    if (!caso) {

        const casosLocais =
            obterCasosLocais();


        caso =
            casosLocais.find(
                item =>
                    String(
                        item.id
                    ) ===
                    String(
                        id
                    )
            );
    }


    /*
     * 3. Só mostra "Arquivo não encontrado"
     *    se o dossiê não existir em nenhuma
     *    das duas fontes.
     */

    if (!caso) {

        mostrarNaoEncontrado();

        return;
    }


    renderizarCaso(
        caso
    );
}


function renderizarCaso(caso) {

    inicializarModoLeitura();

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

    renderizarBlocosConteudo(caso);


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


/* ==========================================================================
   BLOCOS VISUAIS DO DOSSIÊ
   ========================================================================== */

function normalizarUrlImagemDossie(urlOriginal) {

    const url =
        String(urlOriginal || "")
            .trim();

    if (!url) {
        return "";
    }

    const marcadorWikimedia =
        "/wiki/File:";

    const posicaoArquivo =
        url.indexOf(marcadorWikimedia);

    if (
        url.includes("commons.wikimedia.org") &&
        posicaoArquivo !== -1
    ) {

        const trechoArquivo =
            url.slice(
                posicaoArquivo +
                marcadorWikimedia.length
            );

        let nomeArquivo;

        try {

            nomeArquivo =
                decodeURIComponent(
                    trechoArquivo
                        .split("#")[0]
                        .split("?")[0]
                );

        } catch (erro) {

            nomeArquivo =
                trechoArquivo
                    .split("#")[0]
                    .split("?")[0];
        }

        return (
            "https://commons.wikimedia.org/wiki/" +
            "Special:Redirect/file/" +
            encodeURIComponent(nomeArquivo) +
            "?width=1400"
        );
    }

    return url;
}


function renderizarBlocosConteudo(caso) {
    const historia = document.getElementById("caso-historia");
    const blocos = Array.isArray(caso?.conteudo_blocos)
        ? caso.conteudo_blocos.filter(Boolean).slice().sort((a,b) => (Number(a.ordem)||0)-(Number(b.ordem)||0)) : [];
    if (!historia || !blocos.length) return;
    const urlSegura = valor => {
        try {
            const url = new URL(String(valor || "").trim(), document.baseURI);
            return ["https:", "http:"].includes(url.protocol) ? url.href : "";
        } catch { return ""; }
    };
    const texto = (tag, valor, classe) => {
        const el = document.createElement(tag);
        el.textContent = String(valor || "");
        if (classe) el.className = classe;
        return el;
    };
    const posicionadas = [];
    const usaTextoBlocos = blocos.some(b => ["paragrafo","subtitulo"].includes(b.tipo) && String(b.conteudo || "").trim());
    // Sem blocos de texto, preserva integralmente o histórico antigo.
    if (usaTextoBlocos) historia.replaceChildren();
    for (const bloco of blocos) {
        const conteudo = String(bloco.conteudo || "").trim();
        if (!conteudo) continue;
        if (bloco.tipo === "paragrafo") {
            conteudo.split(/\n\s*\n/).filter(t => t.trim()).forEach(t => historia.append(texto("p",t.trim())));
        } else if (bloco.tipo === "subtitulo") {
            historia.append(texto("h3",conteudo,"case-content-subtitle"));
        } else if (bloco.tipo === "imagem") {
            const url = urlSegura(normalizarUrlImagemDossie(conteudo));
            if (!url) continue;
            const figura = document.createElement("figure");
            const alinhamento = ["centro","esquerda","direita","total"].includes(bloco.alinhamento) ? bloco.alinhamento : "centro";
            const tamanho = ["pequeno","medio","grande"].includes(bloco.tamanho) ? bloco.tamanho : "medio";
            figura.className = "case-content-image case-content-image--" + alinhamento + " case-content-image--" + tamanho;
            const img = document.createElement("img");
            img.src = url;
            img.alt = bloco.legenda || "Imagem documental do dossiê " + (caso.titulo || "");
            img.loading = "lazy";
            img.referrerPolicy = "no-referrer";
            figura.append(img);
            const legenda = document.createElement("figcaption");
            if (bloco.legenda) legenda.append(texto("div",bloco.legenda,"case-image-caption"));
            if (bloco.observacao) legenda.append(texto("div",bloco.observacao,"case-image-note"));
            const link = bloco.link_fonte ? urlSegura(bloco.link_fonte) : "";
            if (bloco.fonte || link) {
                const fonte = texto("div","Fonte: ","case-image-source");
                if (link) {
                    const a = texto("a",bloco.fonte || "Consultar fonte");
                    a.href = link; a.target = "_blank"; a.rel = "noopener noreferrer";
                    fonte.append(a);
                } else fonte.append(document.createTextNode(bloco.fonte));
                legenda.append(fonte);
            }
            if (legenda.childNodes.length) figura.append(legenda);
            if (bloco.posicao) posicionadas.push({figura, posicao: bloco.posicao});
            else historia.append(figura);
        } else if (bloco.tipo === "documento") {
            const url = urlSegura(conteudo);
            if (url) {
                const a = texto("a","Abrir documento");
                a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer";
                const p = document.createElement("p"); p.append(a); historia.append(p);
            }
        }
    }
    const trechos = Array.from(historia.children).filter(el => ["P","H3"].includes(el.tagName));
    const depois = new Map();
    let ultimoInicio = null;
    posicionadas.forEach(({figura,posicao}) => {
        const match = /^(antes|apos)-(\d+)$/.exec(posicao);
        const alvo = match ? trechos[Number(match[2])] : null;
        if (posicao === "inicio") {
            if (ultimoInicio) ultimoInicio.after(figura); else historia.prepend(figura);
            ultimoInicio = figura;
        } else if (alvo && match[1] === "antes") {
            alvo.before(figura);
        } else if (alvo) {
            (depois.get(alvo) || alvo).after(figura);
            depois.set(alvo, figura);
        } else historia.append(figura);
    });
}


/* Modo de leitura: altera o layout sem copiar ou substituir o conteúdo. */
function inicializarModoLeitura() {

    const secao =
        document.querySelector(
            ".case-content-section"
        );

    if (
        !secao ||
        document.querySelector(
            ".case-reader-toolbar"
        )
    ) {
        return;
    }

    document.body.classList.add(
        "case-reading"
    );


    const barra =
        document.createElement(
            "div"
        );

    barra.className =
        "case-reader-toolbar";


    barra.innerHTML = `

        <div class="case-reader-toolbar-inner">

            <a
                href="index.html"
                class="case-reader-back"
                aria-label="Voltar ao Arquivo"
            >
                <i class="fa-solid fa-arrow-left"></i>

                <span>
                    Voltar
                </span>
            </a>


            <div class="case-reader-actions">

                <button
                    type="button"
                    class="case-reader-action"
                    data-reader-text
                    aria-label="Ajustar texto"
                    title="Ajustar texto"
                >
                    <span class="reader-aa">
                        Aa
                    </span>

                    <small>
                        Texto
                    </small>
                </button>


                <button
                    type="button"
                    class="case-reader-action"
                    data-reader-theme-button
                    aria-label="Alterar tema"
                    title="Tema"
                >
                    <i class="fa-regular fa-moon"></i>

                    <small>
                        Tema
                    </small>
                </button>


                <button
                    type="button"
                    class="case-reader-action"
                    data-reader-font-button
                    aria-label="Escolher fonte"
                    title="Fonte"
                >
                    <i class="fa-solid fa-font"></i>

                    <small>
                        Fonte
                    </small>
                </button>


                <button
                    type="button"
                    class="case-reader-action"
                    data-reader-lines-button
                    aria-label="Ajustar espaçamento entre linhas"
                    title="Linhas"
                >
                    <i class="fa-solid fa-align-left"></i>

                    <small>
                        Linhas
                    </small>
                </button>


                <button
                    type="button"
                    class="case-reader-action"
                    data-reader-format-button
                    aria-label="Alterar formato de leitura"
                    title="Formato"
                >
                    <i class="fa-regular fa-file-lines"></i>

                    <small>
                        Formato
                    </small>
                </button>


                <button
                    type="button"
                    class="case-reader-action"
                    data-reader-underline
                    aria-label="Sublinhar trecho selecionado"
                    title="Sublinhar"
                >
                    <i class="fa-solid fa-underline"></i>

                    <small>
                        Sublinhar
                    </small>
                </button>

            </div>

        </div>

        <div
            class="case-reader-popovers"
            data-reader-popovers
        ></div>

    `;


    secao.prepend(
        barra
    );


    configurarPreferenciasLeitura(
        barra
    );

    configurarPaginasLeitura(
        barra
    );
}

/* ==========================================================================
   VALIDAÇÃO DAS PREFERÊNCIAS DE LEITURA
   ========================================================================== */

function validarPreferenciasLeitura(valor) {

    const preferencias =
        valor &&
        typeof valor === "object"
            ? valor
            : {};

    return {

        tema:
            [
                "arquivo",
                "papel"
            ].includes(
                preferencias.tema
            )
                ? preferencias.tema
                : "arquivo",

        fonte:
            [
                "baskerville",
                "georgia",
                "arial",
                "verdana"
            ].includes(
                preferencias.fonte
            )
                ? preferencias.fonte
                : "baskerville",

        tamanho:
            Number.isFinite(
                preferencias.tamanho
            )
                ? Math.min(
                    30,
                    Math.max(
                        16,
                        Math.round(
                            preferencias.tamanho
                        )
                    )
                )
                : 18,

        espaco:
            [
                1.5,
                1.8,
                2.1
            ].includes(
                preferencias.espaco
            )
                ? preferencias.espaco
                : 1.8

    };
}

function configurarPreferenciasLeitura(barra) {

    const chave =
        "arquivo_sombrio_preferencias_leitura_v1";

    let preferencias;

    try {

        preferencias =
            validarPreferenciasLeitura(
                JSON.parse(
                    localStorage.getItem(
                        chave
                    )
                )
            );

    } catch {

        preferencias =
            validarPreferenciasLeitura(
                null
            );
    }


    const areaPopovers =
        barra.querySelector(
            "[data-reader-popovers]"
        );

    const botaoTexto =
        barra.querySelector(
            "[data-reader-text]"
        );

    const botaoTema =
        barra.querySelector(
            "[data-reader-theme-button]"
        );

    const botaoFonte =
        barra.querySelector(
            "[data-reader-font-button]"
        );

    const botaoLinhas =
        barra.querySelector(
            "[data-reader-lines-button]"
        );


    if (
        !areaPopovers ||
        !botaoTexto ||
        !botaoTema ||
        !botaoFonte ||
        !botaoLinhas
    ) {
        return;
    }


    const familias = {

        baskerville:
            '"Libre Baskerville", Georgia, serif',

        georgia:
            'Georgia, "Times New Roman", serif',

        arial:
            'Arial, Helvetica, sans-serif',

        verdana:
            'Verdana, Geneva, sans-serif'

    };


    function salvarPreferencias() {

        try {

            localStorage.setItem(
                chave,
                JSON.stringify(
                    preferencias
                )
            );

        } catch (erro) {

            console.warn(
                "Não foi possível salvar as preferências de leitura.",
                erro
            );
        }
    }


    function aplicarPreferencias(
        salvar = false
    ) {

        preferencias =
            validarPreferenciasLeitura(
                preferencias
            );

        document.body.dataset.readerTheme =
            preferencias.tema;

        document.body.style.setProperty(
            "--reader-font",
            familias[
                preferencias.fonte
            ]
        );

        document.body.style.setProperty(
            "--reader-size",
            preferencias.tamanho +
                "px"
        );

        document.body.style.setProperty(
            "--reader-spacing",
            String(
                preferencias.espaco
            )
        );

        if (salvar) {
            salvarPreferencias();
        }
    }


    function fecharPopover() {

        areaPopovers.innerHTML =
            "";

        areaPopovers.classList.remove(
            "active"
        );

        barra
            .querySelectorAll(
                ".case-reader-action.active"
            )
            .forEach(
                botao =>
                    botao.classList.remove(
                        "active"
                    )
            );
    }


    function abrirPopover(
        botao,
        conteudo
    ) {

        const jaAberto =
            botao.classList.contains(
                "active"
            );

        fecharPopover();

        if (jaAberto) {
            return;
        }

        botao.classList.add(
            "active"
        );

        areaPopovers.classList.add(
            "active"
        );

        areaPopovers.innerHTML =
            conteudo;
    }


    botaoTexto.addEventListener(
        "click",
        () => {

            abrirPopover(
                botaoTexto,
                `
                <div class="reader-popover">
                    <strong>
                        Tamanho do texto
                    </strong>

                    <div class="reader-size-control">

                        <button
                            type="button"
                            data-reader-smaller-new
                            aria-label="Diminuir texto"
                        >
                            A−
                        </button>

                        <span
                            data-reader-size-new
                        >
                            ${preferencias.tamanho}px
                        </span>

                        <button
                            type="button"
                            data-reader-larger-new
                            aria-label="Aumentar texto"
                        >
                            A+
                        </button>

                    </div>
                </div>
                `
            );


            const menor =
                areaPopovers.querySelector(
                    "[data-reader-smaller-new]"
                );

            const maior =
                areaPopovers.querySelector(
                    "[data-reader-larger-new]"
                );

            const tamanho =
                areaPopovers.querySelector(
                    "[data-reader-size-new]"
                );


            const atualizar =
                () => {

                    tamanho.textContent =
                        preferencias.tamanho +
                        "px";

                    menor.disabled =
                        preferencias.tamanho <=
                        16;

                    maior.disabled =
                        preferencias.tamanho >=
                        30;
                };


            menor.addEventListener(
                "click",
                () => {

                    preferencias.tamanho -=
                        1;

                    aplicarPreferencias(
                        true
                    );

                    atualizar();
                }
            );


            maior.addEventListener(
                "click",
                () => {

                    preferencias.tamanho +=
                        1;

                    aplicarPreferencias(
                        true
                    );

                    atualizar();
                }
            );


            atualizar();
        }
    );


    botaoTema.addEventListener(
        "click",
        () => {

            abrirPopover(
                botaoTema,
                `
                <div class="reader-popover">
                    <strong>
                        Tema
                    </strong>

                    <button
                        type="button"
                        data-theme-option="arquivo"
                    >
                        Escuro
                    </button>

                    <button
                        type="button"
                        data-theme-option="papel"
                    >
                        Papel antigo
                    </button>
                </div>
                `
            );


            areaPopovers
                .querySelectorAll(
                    "[data-theme-option]"
                )
                .forEach(
                    opcao => {

                        opcao.addEventListener(
                            "click",
                            () => {

                                preferencias.tema =
                                    opcao.dataset
                                        .themeOption;

                                aplicarPreferencias(
                                    true
                                );

                                fecharPopover();
                            }
                        );
                    }
                );
        }
    );


    botaoFonte.addEventListener(
        "click",
        () => {

            abrirPopover(
                botaoFonte,
                `
                <div class="reader-popover">
                    <strong>
                        Fonte
                    </strong>

                    <button
                        type="button"
                        data-font-option="baskerville"
                    >
                        Baskerville
                    </button>

                    <button
                        type="button"
                        data-font-option="georgia"
                    >
                        Georgia
                    </button>

                    <button
                        type="button"
                        data-font-option="arial"
                    >
                        Arial
                    </button>

                    <button
                        type="button"
                        data-font-option="verdana"
                    >
                        Verdana
                    </button>
                </div>
                `
            );


            areaPopovers
                .querySelectorAll(
                    "[data-font-option]"
                )
                .forEach(
                    opcao => {

                        opcao.addEventListener(
                            "click",
                            () => {

                                preferencias.fonte =
                                    opcao.dataset
                                        .fontOption;

                                aplicarPreferencias(
                                    true
                                );

                                fecharPopover();
                            }
                        );
                    }
                );
        }
    );


    botaoLinhas.addEventListener(
        "click",
        () => {

            abrirPopover(
                botaoLinhas,
                `
                <div class="reader-popover">
                    <strong>
                        Espaçamento
                    </strong>

                    <button
                        type="button"
                        data-spacing-option="1.5"
                    >
                        Compacto
                    </button>

                    <button
                        type="button"
                        data-spacing-option="1.8"
                    >
                        Normal
                    </button>

                    <button
                        type="button"
                        data-spacing-option="2.1"
                    >
                        Amplo
                    </button>
                </div>
                `
            );


            areaPopovers
                .querySelectorAll(
                    "[data-spacing-option]"
                )
                .forEach(
                    opcao => {

                        opcao.addEventListener(
                            "click",
                            () => {

                                preferencias.espaco =
                                    Number(
                                        opcao.dataset
                                            .spacingOption
                                    );

                                aplicarPreferencias(
                                    true
                                );

                                fecharPopover();
                            }
                        );
                    }
                );
        }
    );


    document.addEventListener(
        "click",
        evento => {

            if (
                !barra.contains(
                    evento.target
                )
            ) {
                fecharPopover();
            }
        }
    );


    aplicarPreferencias();
}

/* Páginas de leitura: usa o conteúdo original, incluindo imagens e créditos. */
function calcularPaginaLeitura(total, pagina) {
    return Math.min(Math.max(0, Math.trunc(pagina) || 0), Math.max(0, total - 1));
}

function configurarPaginasLeitura(barra) {

    const artigo =
        document.querySelector(
            ".case-main-content"
        );

    const botaoFormato =
        barra.querySelector(
            "[data-reader-format-button]"
        );

    const areaPopovers =
        barra.querySelector(
            "[data-reader-popovers]"
        );

    if (
        !artigo ||
        !botaoFormato ||
        !areaPopovers
    ) {
        return;
    }


    const janela =
        document.createElement(
            "div"
        );

    janela.className =
        "reader-page-window";

    artigo.before(
        janela
    );

    janela.append(
        artigo
    );


    const navegacao =
        document.createElement(
            "div"
        );

    navegacao.className =
        "reader-page-navigation";

    navegacao.hidden =
        true;

    navegacao.innerHTML = `

        <button
            type="button"
            data-page-prev
            aria-label="Página anterior"
        >
            <i class="fa-solid fa-chevron-left"></i>
        </button>

        <output
            data-page-count
            aria-live="polite"
        >
            1 / 1
        </output>

        <button
            type="button"
            data-page-next
            aria-label="Próxima página"
        >
            <i class="fa-solid fa-chevron-right"></i>
        </button>

    `;

    barra.append(
        navegacao
    );


    const anterior =
        navegacao.querySelector(
            "[data-page-prev]"
        );

    const proxima =
        navegacao.querySelector(
            "[data-page-next]"
        );

    const contador =
        navegacao.querySelector(
            "[data-page-count]"
        );


    let modo =
        "scroll";

    let pagina =
        0;

    let total =
        1;

    let largura =
        0;

    let agendado =
        false;


    function paginasAtivas() {

        return (
            document.body
                .classList
                .contains(
                    "case-reading"
                ) &&
            modo ===
                "pages"
        );
    }


    function mostrarPagina(
        destino
    ) {

        pagina =
            calcularPaginaLeitura(
                total,
                destino
            );

        janela.scrollLeft =
            pagina *
            largura;

        contador.textContent =
            `${pagina + 1} / ${total}`;

        anterior.disabled =
            pagina === 0;

        proxima.disabled =
            pagina ===
            total - 1;
    }


    function recalcular() {

        agendado =
            false;

        const ativo =
            paginasAtivas();

        document.body
            .classList
            .toggle(
                "case-paginated",
                ativo
            );

        navegacao.hidden =
            !ativo;

        if (!ativo) {

            janela.scrollLeft =
                0;

            artigo.style.removeProperty(
                "--reader-page-height"
            );

            artigo.style.removeProperty(
                "--reader-page-width"
            );

            return;
        }


        largura =
            janela.clientWidth;

        if (!largura) {
            return;
        }


        const altura =
            Math.max(
                260,
                window.innerHeight -
                barra.getBoundingClientRect()
                    .height -
                40
            );


        artigo.style.setProperty(
            "--reader-page-height",
            altura + "px"
        );

        artigo.style.setProperty(
            "--reader-page-width",
            largura + "px"
        );


        total =
            Math.max(
                1,
                Math.ceil(
                    (
                        artigo.scrollWidth -
                        1
                    ) /
                    largura
                )
            );


        mostrarPagina(
            pagina
        );
    }


    function agendar() {

        if (agendado) {
            return;
        }

        agendado =
            true;

        requestAnimationFrame(
            recalcular
        );
    }


    function fecharMenuFormato() {

        areaPopovers.innerHTML =
            "";

        areaPopovers.classList.remove(
            "active"
        );

        botaoFormato.classList.remove(
            "active"
        );
    }


    botaoFormato.addEventListener(
        "click",
        () => {

            const aberto =
                botaoFormato
                    .classList
                    .contains(
                        "active"
                    );

            areaPopovers.innerHTML =
                "";

            barra
                .querySelectorAll(
                    ".case-reader-action.active"
                )
                .forEach(
                    botao =>
                        botao.classList.remove(
                            "active"
                        )
                );

            if (aberto) {

                areaPopovers
                    .classList
                    .remove(
                        "active"
                    );

                return;
            }


            botaoFormato.classList.add(
                "active"
            );

            areaPopovers.classList.add(
                "active"
            );


            areaPopovers.innerHTML = `

                <div class="reader-popover">

                    <strong>
                        Formato de leitura
                    </strong>

                    <button
                        type="button"
                        data-format-option="scroll"
                    >
                        <i class="fa-solid fa-bars"></i>

                        Rolagem contínua
                    </button>

                    <button
                        type="button"
                        data-format-option="pages"
                    >
                        <i class="fa-regular fa-file"></i>

                        Páginas de livro
                    </button>

                </div>

            `;


            areaPopovers
                .querySelectorAll(
                    "[data-format-option]"
                )
                .forEach(
                    opcao => {

                        opcao.addEventListener(
                            "click",
                            () => {

                                modo =
                                    opcao.dataset
                                        .formatOption;

                                pagina =
                                    0;

                                fecharMenuFormato();

                                recalcular();
                            }
                        );
                    }
                );
        }
    );


    anterior.addEventListener(
        "click",
        () =>
            mostrarPagina(
                pagina - 1
            )
    );


    proxima.addEventListener(
        "click",
        () =>
            mostrarPagina(
                pagina + 1
            )
    );


    document.addEventListener(
        "keydown",
        evento => {

            if (
                !paginasAtivas() ||
                evento.altKey ||
                evento.ctrlKey ||
                evento.metaKey ||
                evento.shiftKey
            ) {
                return;
            }

            if (
                evento.target.closest?.(
                    "input, textarea, select, button, a, [contenteditable]"
                )
            ) {
                return;
            }


            if (
                evento.key ===
                "ArrowLeft"
            ) {

                evento.preventDefault();

                mostrarPagina(
                    pagina - 1
                );
            }


            if (
                evento.key ===
                "ArrowRight"
            ) {

                evento.preventDefault();

                mostrarPagina(
                    pagina + 1
                );
            }
        }
    );


    window.addEventListener(
        "resize",
        agendar
    );


    recalcular();
}
