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

    const usouBlocos =
        renderizarBlocosConteudo(caso);

    alternarSecoesLegadasDoCaso(
        usouBlocos
    );

    if (!usouBlocos) {
        renderizarHistoria(caso);
        renderizarEvidencias(caso.evidencias);
        renderizarTeorias(caso.teorias);
    }

    /*
     * Os recursos de leitura são iniciados somente depois que o conteúdo
     * definitivo foi colocado no documento. Assim, paginação, sumário e
     * marcações também reconhecem os blocos narrativos.
     */
    inicializarModoLeitura(caso.id);

    restaurarSublinhadosLeitura(caso.id);

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


function renderizarBlocosConteudoLegado(caso) {
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


/* ==========================================================================
   EDITOR NARRATIVO — RENDERIZAÇÃO PÚBLICA SEGURA
   ========================================================================== */

const TIPOS_BLOCO_DOSSIE = new Set([
    "subtitulo",
    "paragrafo",
    "imagem",
    "documento",
    "video",
    "cronologia",
    "evidencias",
    "hipoteses",
    "situacao_oficial",
    "fontes"
]);


function textoBlocoDossie(valor) {
    return String(valor ?? "").trim();
}


function validarUrlPublicaDossie(valor) {

    const textoUrl =
        textoBlocoDossie(valor);

    if (!textoUrl) {
        return "";
    }

    try {

        const url =
            new URL(
                textoUrl,
                document.baseURI
            );

        return ["http:", "https:"]
            .includes(url.protocol)
                ? url.href
                : "";

    } catch (erro) {
        return "";
    }
}


function criarElementoTextoDossie(
    tag,
    valor,
    classe = ""
) {

    const elemento =
        document.createElement(tag);

    if (classe) {
        elemento.className = classe;
    }

    elemento.textContent =
        textoBlocoDossie(valor);

    return elemento;
}


function adicionarTextoComQuebrasDossie(
    elemento,
    valor
) {

    const linhas =
        String(valor ?? "")
            .replace(/\r\n?/g, "\n")
            .split("\n");

    linhas.forEach((linha, indice) => {

        if (indice > 0) {
            elemento.appendChild(
                document.createElement("br")
            );
        }

        elemento.appendChild(
            document.createTextNode(linha)
        );
    });
}


function criarLinkExternoDossie(
    urlOriginal,
    rotulo,
    classe = ""
) {

    const url =
        validarUrlPublicaDossie(
            urlOriginal
        );

    if (!url) {
        return null;
    }

    const link =
        criarElementoTextoDossie(
            "a",
            rotulo || "Abrir referência",
            classe
        );

    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    return link;
}


function criarSlugDossie(
    valor,
    usados
) {

    const base =
        textoBlocoDossie(valor)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 70) ||
        "secao";

    let slug = base;
    let numero = 2;

    while (usados.has(slug)) {
        slug = `${base}-${numero}`;
        numero += 1;
    }

    usados.add(slug);

    return `dossie-${slug}`;
}


function obterDadosBlocoDossie(bloco) {

    const dadosInternos =
        bloco &&
        typeof bloco.dados === "object" &&
        !Array.isArray(bloco.dados)
            ? bloco.dados
            : {};

    /*
     * As propriedades diretas permanecem como compatibilidade defensiva com
     * testes ou versões intermediárias. Os dados atuais do administrador,
     * porém, têm prioridade e ficam dentro de bloco.dados.
     */
    return {
        ...bloco,
        ...dadosInternos
    };
}


function normalizarItensBlocoDossie(
    dados,
    separarPorLinha = false
) {

    if (Array.isArray(dados.itens)) {
        return dados.itens.filter(
            item =>
                typeof item === "object"
                    ? item !== null
                    : Boolean(textoBlocoDossie(item))
        );
    }

    const texto =
        textoBlocoDossie(
            dados.texto
        );

    if (!texto) {
        return [];
    }

    return texto
        .split(
            separarPorLinha
                ? /\n+/g
                : /\n\s*\n/g
        )
        .map(item => item.trim())
        .filter(Boolean);
}


function normalizarBlocosConteudoDossie(caso) {

    if (!Array.isArray(caso?.conteudo_blocos)) {
        return [];
    }

    return caso.conteudo_blocos
        .map((bloco, indice) => ({
            bloco,
            indice
        }))
        .filter(({ bloco }) =>
            bloco &&
            typeof bloco === "object" &&
            TIPOS_BLOCO_DOSSIE.has(
                textoBlocoDossie(bloco.tipo)
            )
        )
        .sort((a, b) => {

            const ordemA =
                Number(a.bloco.ordem);

            const ordemB =
                Number(b.bloco.ordem);

            const valorA =
                Number.isFinite(ordemA)
                    ? ordemA
                    : a.indice + 1;

            const valorB =
                Number.isFinite(ordemB)
                    ? ordemB
                    : b.indice + 1;

            return valorA - valorB ||
                a.indice - b.indice;
        })
        .map(({ bloco }) => ({
            id: textoBlocoDossie(bloco.id),
            tipo: textoBlocoDossie(bloco.tipo),
            ordem: Number(bloco.ordem) || 0,
            dados: obterDadosBlocoDossie(bloco)
        }))
        .filter(bloco => {

            const dados = bloco.dados;

            if ([
                "cronologia",
                "evidencias",
                "hipoteses"
            ].includes(bloco.tipo)) {
                return normalizarItensBlocoDossie(dados).length > 0;
            }

            if (bloco.tipo === "fontes") {
                return normalizarItensBlocoDossie(dados, true).length > 0;
            }

            if ([
                "imagem",
                "documento",
                "video"
            ].includes(bloco.tipo)) {
                return Boolean(
                    validarUrlPublicaDossie(dados.url)
                );
            }

            return Boolean(
                textoBlocoDossie(dados.texto)
            );
        });
}


function alternarSecoesLegadasDoCaso(usandoBlocos) {

    const secaoEvidencias =
        document.getElementById("evidencias");

    const secaoTeorias =
        document.getElementById("teorias");

    if (secaoEvidencias) {
        secaoEvidencias.hidden =
            Boolean(usandoBlocos);
    }

    if (secaoTeorias) {
        secaoTeorias.hidden =
            Boolean(usandoBlocos);
    }

    const tituloHistorico =
        document.querySelector(
            "#historico .case-block-heading h2"
        );

    if (tituloHistorico) {
        tituloHistorico.textContent =
            usandoBlocos
                ? "Conteúdo do Dossiê"
                : "Histórico do Caso";
    }
}


function renderizarSubtituloBlocoDossie(
    dados,
    contexto
) {

    const titulo =
        textoBlocoDossie(dados.texto);

    if (!titulo) {
        return null;
    }

    const elemento =
        criarElementoTextoDossie(
            "h3",
            titulo,
            "case-content-subtitle"
        );

    elemento.id =
        criarSlugDossie(
            titulo,
            contexto.slugs
        );

    return elemento;
}


function renderizarParagrafoBlocoDossie(dados) {

    const fragmento =
        document.createDocumentFragment();

    textoBlocoDossie(dados.texto)
        .split(/\n\s*\n/g)
        .map(paragrafo => paragrafo.trim())
        .filter(Boolean)
        .forEach(paragrafo => {

            const elemento =
                document.createElement("p");

            elemento.className =
                "case-content-paragraph";

            adicionarTextoComQuebrasDossie(
                elemento,
                paragrafo
            );

            fragmento.appendChild(elemento);
        });

    return fragmento.childNodes.length
        ? fragmento
        : null;
}


function renderizarImagemBlocoDossie(
    dados,
    caso
) {

    const url =
        validarUrlPublicaDossie(
            normalizarUrlImagemDossie(
                dados.url
            )
        );

    if (!url) {
        return null;
    }

    const alinhamentos =
        ["centro", "esquerda", "direita", "total"];

    const tamanhos =
        ["pequeno", "medio", "grande"];

    const alinhamento =
        alinhamentos.includes(dados.alinhamento)
            ? dados.alinhamento
            : "centro";

    const tamanho =
        tamanhos.includes(dados.tamanho)
            ? dados.tamanho
            : "medio";

    const figura =
        document.createElement("figure");

    figura.className =
        `case-content-image case-content-image--${alinhamento} ` +
        `case-content-image--${tamanho}`;

    const moldura =
        document.createElement("div");

    moldura.className =
        "case-content-image-frame";

    const imagem =
        document.createElement("img");

    imagem.src = url;
    imagem.alt =
        textoBlocoDossie(
            dados.texto_alternativo
        ) ||
        textoBlocoDossie(dados.legenda) ||
        `Imagem documental do dossiê ${textoBlocoDossie(caso.titulo)}`;
    imagem.loading = "lazy";
    imagem.decoding = "async";
    imagem.referrerPolicy = "no-referrer";

    imagem.addEventListener("error", () => {
        figura.classList.add("case-content-image--error");
        imagem.remove();

        if (!moldura.querySelector(".case-content-media-error")) {
            moldura.appendChild(
                criarElementoTextoDossie(
                    "p",
                    "Não foi possível carregar esta imagem.",
                    "case-content-media-error"
                )
            );
        }
    });

    moldura.appendChild(imagem);

    if (dados.sensivel === true) {

        figura.classList.add(
            "case-content-image--sensitive"
        );

        const aviso =
            document.createElement("div");

        aviso.className =
            "case-sensitive-warning";

        aviso.appendChild(
            criarElementoTextoDossie(
                "strong",
                "Conteúdo sensível"
            )
        );

        aviso.appendChild(
            criarElementoTextoDossie(
                "p",
                "Esta imagem pode conter conteúdo perturbador. A visualização é opcional."
            )
        );

        const acoes =
            document.createElement("div");

        acoes.className =
            "case-sensitive-actions";

        const botao =
            criarElementoTextoDossie(
                "button",
                "Ver imagem",
                "case-sensitive-toggle"
            );

        botao.type = "button";
        botao.setAttribute("aria-expanded", "false");

        botao.addEventListener("click", () => {

            const revelada =
                figura.classList.toggle(
                    "is-revealed"
                );

            botao.setAttribute(
                "aria-expanded",
                String(revelada)
            );

            botao.textContent =
                revelada
                    ? "Ocultar imagem"
                    : "Ver imagem";
        });

        const termos =
            criarElementoTextoDossie(
                "a",
                "Termos de responsabilidade",
                "case-sensitive-terms"
            );

        termos.href = "termos.html";

        acoes.append(botao, termos);
        aviso.appendChild(acoes);
        moldura.appendChild(aviso);
    }

    figura.appendChild(moldura);

    const legenda =
        document.createElement("figcaption");

    if (textoBlocoDossie(dados.legenda)) {
        legenda.appendChild(
            criarElementoTextoDossie(
                "div",
                dados.legenda,
                "case-image-caption"
            )
        );
    }

    if (textoBlocoDossie(dados.descricao)) {
        legenda.appendChild(
            criarElementoTextoDossie(
                "div",
                dados.descricao,
                "case-image-note"
            )
        );
    }

    if (textoBlocoDossie(dados.credito)) {
        legenda.appendChild(
            criarElementoTextoDossie(
                "div",
                `Crédito: ${dados.credito}`,
                "case-image-credit"
            )
        );
    }

    const linkFonte =
        criarLinkExternoDossie(
            dados.link_fonte,
            textoBlocoDossie(dados.fonte) ||
                "Consultar fonte"
        );

    if (textoBlocoDossie(dados.fonte) || linkFonte) {

        const fonte =
            criarElementoTextoDossie(
                "div",
                "Fonte: ",
                "case-image-source"
            );

        if (linkFonte) {
            fonte.appendChild(linkFonte);
        } else {
            fonte.appendChild(
                document.createTextNode(
                    textoBlocoDossie(dados.fonte)
                )
            );
        }

        legenda.appendChild(fonte);
    }

    if (legenda.childNodes.length) {
        figura.appendChild(legenda);
    }

    return figura;
}


function renderizarDocumentoBlocoDossie(dados) {

    const url =
        validarUrlPublicaDossie(
            dados.url
        );

    if (!url) {
        return null;
    }

    const ficha =
        document.createElement("article");

    ficha.className =
        "case-content-document";

    ficha.appendChild(
        criarElementoTextoDossie(
            "span",
            "Documento ou anexo",
            "case-content-document-label"
        )
    );

    if (textoBlocoDossie(dados.titulo)) {
        ficha.appendChild(
            criarElementoTextoDossie(
                "h3",
                dados.titulo
            )
        );
    }

    if (textoBlocoDossie(dados.descricao)) {
        ficha.appendChild(
            criarElementoTextoDossie(
                "p",
                dados.descricao
            )
        );
    }

    if (textoBlocoDossie(dados.fonte)) {
        ficha.appendChild(
            criarElementoTextoDossie(
                "small",
                `Fonte: ${dados.fonte}`
            )
        );
    }

    const acoes =
        document.createElement("div");

    acoes.className =
        "case-content-document-actions";

    const baixar =
        dados.acao === "baixar";

    const principal =
        criarLinkExternoDossie(
            url,
            baixar
                ? "Baixar documento"
                : "Abrir documento",
            "case-content-document-button"
        );

    if (principal) {
        if (baixar) {
            principal.setAttribute("download", "");
        }
        acoes.appendChild(principal);
    }

    const original =
        criarLinkExternoDossie(
            dados.link_original,
            "Consultar link original",
            "case-content-document-source"
        );

    if (original && original.href !== principal?.href) {
        acoes.appendChild(original);
    }

    if (acoes.childNodes.length) {
        ficha.appendChild(acoes);
    }

    return ficha;
}


function obterUrlIncorporacaoVideoDossie(valor) {

    const urlSegura =
        validarUrlPublicaDossie(valor);

    if (!urlSegura) {
        return "";
    }

    try {

        const url = new URL(urlSegura);
        const dominio =
            url.hostname
                .replace(/^www\./, "")
                .toLowerCase();

        let id = "";

        if (dominio === "youtu.be") {
            id = url.pathname.split("/").filter(Boolean)[0] || "";
        }

        if ([
            "youtube.com",
            "m.youtube.com",
            "youtube-nocookie.com"
        ].includes(dominio)) {

            if (url.pathname === "/watch") {
                id = url.searchParams.get("v") || "";
            } else {
                const partes =
                    url.pathname.split("/").filter(Boolean);

                if (["embed", "shorts", "live"].includes(partes[0])) {
                    id = partes[1] || "";
                }
            }
        }

        if (/^[A-Za-z0-9_-]{6,20}$/.test(id)) {
            return `https://www.youtube-nocookie.com/embed/${id}`;
        }

        if (["vimeo.com", "player.vimeo.com"].includes(dominio)) {
            const partes =
                url.pathname.split("/").filter(Boolean);

            const idVimeo =
                partes.find(parte => /^\d+$/.test(parte)) || "";

            if (idVimeo) {
                return `https://player.vimeo.com/video/${idVimeo}`;
            }
        }

    } catch (erro) {
        return "";
    }

    return "";
}


function renderizarVideoBlocoDossie(dados) {

    const urlOriginal =
        validarUrlPublicaDossie(dados.url);

    if (!urlOriginal) {
        return null;
    }

    const secao =
        document.createElement("figure");

    secao.className =
        "case-content-video";

    const titulo =
        textoBlocoDossie(dados.titulo);

    if (titulo) {
        secao.appendChild(
            criarElementoTextoDossie(
                "h3",
                titulo
            )
        );
    }

    const incorporacao =
        obterUrlIncorporacaoVideoDossie(
            urlOriginal
        );

    if (incorporacao) {

        const moldura =
            document.createElement("div");

        moldura.className =
            "case-content-video-frame";

        const iframe =
            document.createElement("iframe");

        iframe.src = incorporacao;
        iframe.title = titulo || "Vídeo relacionado ao dossiê";
        iframe.loading = "lazy";
        iframe.referrerPolicy = "strict-origin-when-cross-origin";
        iframe.allow =
            "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
        iframe.setAttribute("allowfullscreen", "");
        iframe.setAttribute(
            "sandbox",
            "allow-scripts allow-same-origin allow-presentation"
        );

        moldura.appendChild(iframe);
        secao.appendChild(moldura);

    } else {

        const link =
            criarLinkExternoDossie(
                urlOriginal,
                "Abrir vídeo em nova guia",
                "case-content-video-link"
            );

        if (link) {
            secao.appendChild(link);
        } else {
            secao.appendChild(
                criarElementoTextoDossie(
                    "p",
                    "O link deste vídeo não é compatível com a incorporação segura.",
                    "case-content-media-error"
                )
            );
        }
    }

    if (textoBlocoDossie(dados.legenda)) {
        secao.appendChild(
            criarElementoTextoDossie(
                "figcaption",
                dados.legenda
            )
        );
    }

    return secao;
}


function obterCampoItemDossie(
    item,
    campos,
    fallback = ""
) {

    if (typeof item !== "object" || !item) {
        return fallback;
    }

    for (const campo of campos) {
        const valor = textoBlocoDossie(item[campo]);
        if (valor) {
            return valor;
        }
    }

    return fallback;
}


function renderizarCronologiaBlocoDossie(dados) {

    const itens =
        normalizarItensBlocoDossie(dados);

    if (!itens.length) {
        return null;
    }

    const secao =
        document.createElement("section");

    secao.className =
        "case-content-timeline";

    secao.appendChild(
        criarElementoTextoDossie(
            "h3",
            textoBlocoDossie(dados.titulo) || "Cronologia"
        )
    );

    const lista =
        document.createElement("ol");

    itens.forEach(item => {

        const linha =
            document.createElement("li");

        if (typeof item === "string") {
            adicionarTextoComQuebrasDossie(linha, item);
        } else {

            const periodo =
                obterCampoItemDossie(
                    item,
                    ["data", "periodo", "quando"]
                );

            const descricao =
                obterCampoItemDossie(
                    item,
                    ["descricao", "texto", "titulo"]
                );

            if (periodo) {
                linha.appendChild(
                    criarElementoTextoDossie(
                        "time",
                        periodo
                    )
                );
            }

            if (descricao) {
                linha.appendChild(
                    criarElementoTextoDossie(
                        "p",
                        descricao
                    )
                );
            }
        }

        if (linha.childNodes.length) {
            lista.appendChild(linha);
        }
    });

    if (!lista.childNodes.length) {
        return null;
    }

    secao.appendChild(lista);
    return secao;
}


function renderizarCardsBlocoDossie(
    tipo,
    dados
) {

    const limite =
        tipo === "evidencias"
            ? 5
            : Infinity;

    const itens =
        normalizarItensBlocoDossie(dados)
            .slice(0, limite);

    if (!itens.length) {
        return null;
    }

    const hipoteses =
        tipo === "hipoteses";

    const secao =
        document.createElement("section");

    secao.className = hipoteses
        ? "case-content-hypotheses"
        : "case-content-evidence";

    secao.appendChild(
        criarElementoTextoDossie(
            "h3",
            textoBlocoDossie(dados.titulo) ||
                (hipoteses
                    ? "Hipóteses e controvérsias"
                    : "Evidências")
        )
    );

    const lista =
        document.createElement("div");

    lista.className =
        "case-content-card-list";

    itens.forEach((item, indice) => {

        const card =
            document.createElement("article");

        card.className = hipoteses
            ? "case-content-card case-content-card--hypothesis"
            : "case-content-card case-content-card--evidence";

        const classificacao =
            typeof item === "object" && item
                ? obterCampoItemDossie(
                    item,
                    ["classificacao", "tipo"],
                    hipoteses
                        ? "Hipótese ou interpretação"
                        : `Evidência ${indice + 1}`
                )
                : hipoteses
                    ? "Hipótese ou interpretação"
                    : `Evidência ${indice + 1}`;

        card.appendChild(
            criarElementoTextoDossie(
                "span",
                classificacao,
                "case-content-card-label"
            )
        );

        if (typeof item === "string") {
            card.appendChild(
                criarElementoTextoDossie(
                    "p",
                    item
                )
            );
        } else {

            const titulo =
                obterCampoItemDossie(
                    item,
                    ["titulo", "nome"]
                );

            const descricao =
                obterCampoItemDossie(
                    item,
                    ["descricao", "detalhes", "resumo", "texto"]
                );

            if (titulo) {
                card.appendChild(
                    criarElementoTextoDossie(
                        "h4",
                        titulo
                    )
                );
            }

            if (descricao) {
                card.appendChild(
                    criarElementoTextoDossie(
                        "p",
                        descricao
                    )
                );
            }

            const fonte =
                obterCampoItemDossie(item, ["fonte"]);

            if (fonte) {
                card.appendChild(
                    criarElementoTextoDossie(
                        "small",
                        `Fonte: ${fonte}`
                    )
                );
            }

            const link =
                criarLinkExternoDossie(
                    item.link || item.url || item.link_fonte,
                    "Consultar referência",
                    "case-content-card-link"
                );

            if (link) {
                card.appendChild(link);
            }
        }

        lista.appendChild(card);
    });

    secao.appendChild(lista);
    return secao;
}


function renderizarSituacaoOficialBlocoDossie(dados) {

    const texto =
        textoBlocoDossie(
            dados.texto ||
            dados.descricao
        );

    if (!texto) {
        return null;
    }

    const secao =
        document.createElement("section");

    secao.className =
        "case-content-official-status";

    secao.appendChild(
        criarElementoTextoDossie(
            "span",
            "Situação oficial registrada pelas fontes",
            "case-content-official-label"
        )
    );

    if (textoBlocoDossie(dados.status)) {
        secao.appendChild(
            criarElementoTextoDossie(
                "h3",
                dados.status
            )
        );
    }

    secao.appendChild(
        criarElementoTextoDossie(
            "p",
            texto
        )
    );

    if (textoBlocoDossie(dados.data_atualizacao)) {
        secao.appendChild(
            criarElementoTextoDossie(
                "small",
                `Última atualização: ${dados.data_atualizacao}`
            )
        );
    }

    if (textoBlocoDossie(dados.fonte)) {
        secao.appendChild(
            criarElementoTextoDossie(
                "small",
                `Fonte: ${dados.fonte}`
            )
        );
    }

    const link =
        criarLinkExternoDossie(
            dados.link || dados.url_fonte,
            "Consultar fonte oficial",
            "case-content-official-link"
        );

    if (link) {
        secao.appendChild(link);
    }

    return secao;
}


function chaveFonteDossie(item) {

    if (typeof item === "string") {
        return textoBlocoDossie(item)
            .toLocaleLowerCase("pt-BR");
    }

    if (!item || typeof item !== "object") {
        return "";
    }

    return [
        item.titulo,
        item.instituicao,
        item.autor,
        item.data_publicacao,
        item.link,
        item.url
    ]
        .map(textoBlocoDossie)
        .join("|")
        .toLocaleLowerCase("pt-BR");
}


function renderizarFontesBlocoDossie(dados) {

    const vistos = new Set();

    const itens =
        normalizarItensBlocoDossie(dados, true)
            .filter(item => {

                const chave =
                    chaveFonteDossie(item);

                if (!chave || vistos.has(chave)) {
                    return false;
                }

                vistos.add(chave);
                return true;
            });

    if (!itens.length) {
        return null;
    }

    const secao =
        document.createElement("section");

    secao.className =
        "case-content-sources";

    secao.appendChild(
        criarElementoTextoDossie(
            "h3",
            textoBlocoDossie(dados.titulo) || "Fontes"
        )
    );

    const lista =
        document.createElement("ol");

    itens.forEach(item => {

        const linha =
            document.createElement("li");

        if (typeof item === "string") {

            const linkDireto =
                criarLinkExternoDossie(
                    item,
                    item
                );

            if (linkDireto) {
                linha.appendChild(linkDireto);
            } else {
                linha.textContent = item;
            }

        } else {

            const titulo =
                obterCampoItemDossie(
                    item,
                    ["titulo", "nome"]
                );

            const autoria =
                obterCampoItemDossie(
                    item,
                    ["instituicao", "autor"]
                );

            if (titulo) {
                linha.appendChild(
                    criarElementoTextoDossie(
                        "strong",
                        titulo
                    )
                );
            }

            if (autoria) {
                linha.appendChild(
                    criarElementoTextoDossie(
                        "span",
                        autoria
                    )
                );
            }

            const datas = [
                item.data_publicacao
                    ? `Publicado em ${item.data_publicacao}`
                    : "",
                item.data_acesso
                    ? `Acesso em ${item.data_acesso}`
                    : ""
            ].filter(Boolean).join(" · ");

            if (datas) {
                linha.appendChild(
                    criarElementoTextoDossie(
                        "small",
                        datas
                    )
                );
            }

            const link =
                criarLinkExternoDossie(
                    item.link || item.url,
                    "Acessar fonte",
                    "case-content-source-link"
                );

            if (link) {
                linha.appendChild(link);
            }
        }

        if (linha.childNodes.length) {
            lista.appendChild(linha);
        }
    });

    if (!lista.childNodes.length) {
        return null;
    }

    secao.appendChild(lista);
    return secao;
}


function renderizarUmBlocoConteudoDossie(
    bloco,
    caso,
    contexto
) {

    const dados = bloco.dados;

    switch (bloco.tipo) {
        case "subtitulo":
            return renderizarSubtituloBlocoDossie(dados, contexto);
        case "paragrafo":
            return renderizarParagrafoBlocoDossie(dados);
        case "imagem":
            return renderizarImagemBlocoDossie(dados, caso);
        case "documento":
            return renderizarDocumentoBlocoDossie(dados);
        case "video":
            return renderizarVideoBlocoDossie(dados);
        case "cronologia":
            return renderizarCronologiaBlocoDossie(dados);
        case "evidencias":
        case "hipoteses":
            return renderizarCardsBlocoDossie(bloco.tipo, dados);
        case "situacao_oficial":
            return renderizarSituacaoOficialBlocoDossie(dados);
        case "fontes":
            return renderizarFontesBlocoDossie(dados);
        default:
            return null;
    }
}


function renderizarBlocosConteudo(caso) {

    const container =
        document.getElementById(
            "caso-historia"
        );

    if (!container) {
        console.error(
            "O contêiner público do conteúdo do dossiê não foi encontrado."
        );
        return false;
    }

    const blocos =
        normalizarBlocosConteudoDossie(
            caso
        );

    if (!blocos.length) {
        return false;
    }

    const fragmento =
        document.createDocumentFragment();

    const contexto = {
        slugs: new Set()
    };

    let renderizados = 0;

    blocos.forEach(bloco => {

        try {

            const elemento =
                renderizarUmBlocoConteudoDossie(
                    bloco,
                    caso,
                    contexto
                );

            if (elemento) {
                fragmento.appendChild(elemento);
                renderizados += 1;
            }

        } catch (erro) {
            console.error(
                `Não foi possível renderizar o bloco ${bloco.tipo}.`,
                erro
            );
        }
    });

    if (!renderizados) {
        return false;
    }

    container.replaceChildren(fragmento);
    container.dataset.contentFormat = "blocks";

    return true;
}


/* Modo de leitura: altera o layout sem copiar ou substituir o conteúdo. */
function inicializarModoLeitura(casoId) {

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

   configurarSublinhadoLeitura(
    barra,
    casoId
);
   configurarSumarioDossie();
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

        janela.scrollTop =
            0;

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

            janela.scrollTop =
                0;

            janela.style.removeProperty(
                "height"
            );

            janela.style.removeProperty(
                "max-height"
            );

            janela.style.removeProperty(
                "overflow"
            );

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


        const alturaVisivel =
            window.visualViewport?.height ||
            window.innerHeight;

        const altura =
            Math.max(
                260,
                alturaVisivel -
                    barra.getBoundingClientRect()
                        .height -
                40
            );


        janela.style.height =
            altura + "px";

        janela.style.maxHeight =
            altura + "px";

        janela.style.overflow =
            "hidden";


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


    if (window.visualViewport) {

        window.visualViewport
            .addEventListener(
                "resize",
                agendar
            );
    }


    recalcular();
}

/* ==========================================================================
   SUBLINHADOS DO MODO DE LEITURA
   ========================================================================== */

let ultimaSelecaoLeitura = null;


function chaveSublinhadosLeitura(casoId) {

    return (
        "arquivo_sombrio_sublinhados_" +
        String(casoId)
    );
}


function lerSublinhadosLeitura(casoId) {

    try {

        const dados =
            JSON.parse(
                localStorage.getItem(
                    chaveSublinhadosLeitura(
                        casoId
                    )
                )
            );

        return Array.isArray(dados)
            ? dados
            : [];

    } catch {

        return [];
    }
}


function salvarSublinhadosLeitura(
    casoId,
    lista
) {

    try {

        localStorage.setItem(
            chaveSublinhadosLeitura(
                casoId
            ),
            JSON.stringify(lista)
        );

    } catch (erro) {

        console.warn(
            "Não foi possível salvar os sublinhados.",
            erro
        );
    }
}


function normalizarSublinhadosLeitura(
    lista
) {

    const ordenados =
        lista
            .filter(
                item =>
                    Number.isFinite(
                        item.inicio
                    ) &&
                    Number.isFinite(
                        item.fim
                    ) &&
                    item.fim >
                        item.inicio
            )
            .sort(
                (a, b) =>
                    a.inicio -
                    b.inicio
            );


    const resultado = [];


    ordenados.forEach(
        item => {

            const ultimo =
                resultado[
                    resultado.length - 1
                ];

            if (
                ultimo &&
                item.inicio <=
                    ultimo.fim
            ) {

                ultimo.fim =
                    Math.max(
                        ultimo.fim,
                        item.fim
                    );

                return;
            }


            resultado.push({
                inicio:
                    item.inicio,

                fim:
                    item.fim
            });
        }
    );


    return resultado;
}


function obterIntervaloSelecaoLeitura() {

    const artigo =
        document.querySelector(
            ".case-main-content"
        );

    const selecao =
        window.getSelection();

    if (
        !artigo ||
        !selecao ||
        selecao.rangeCount === 0 ||
        selecao.isCollapsed
    ) {
        return null;
    }


    const range =
        selecao.getRangeAt(0);


    const inicioElemento =
        range.startContainer.nodeType ===
        Node.TEXT_NODE
            ? range.startContainer.parentNode
            : range.startContainer;

    const fimElemento =
        range.endContainer.nodeType ===
        Node.TEXT_NODE
            ? range.endContainer.parentNode
            : range.endContainer;


    if (
        !artigo.contains(
            inicioElemento
        ) ||
        !artigo.contains(
            fimElemento
        )
    ) {
        return null;
    }


    const antes =
        document.createRange();

    antes.selectNodeContents(
        artigo
    );

    antes.setEnd(
        range.startContainer,
        range.startOffset
    );


    const inicio =
        antes.toString().length;

    const texto =
        range.toString();


    if (!texto.trim()) {
        return null;
    }


    return {
        inicio,

        fim:
            inicio +
            texto.length
    };
}


function removerMarcacoesVisuaisLeitura() {

    const artigo =
        document.querySelector(
            ".case-main-content"
        );

    if (!artigo) {
        return;
    }


    artigo
        .querySelectorAll(
            "mark.reader-underline"
        )
        .forEach(
            marca => {

                const pai =
                    marca.parentNode;

                while (
                    marca.firstChild
                ) {

                    pai.insertBefore(
                        marca.firstChild,
                        marca
                    );
                }

                marca.remove();

                pai.normalize();
            }
        );
}


function aplicarIntervaloSublinhado(
    inicio,
    fim
) {

    const artigo =
        document.querySelector(
            ".case-main-content"
        );

    if (!artigo) {
        return;
    }


    const walker =
        document.createTreeWalker(
            artigo,
            NodeFilter.SHOW_TEXT
        );


    const partes = [];

    let no;
    let posicao = 0;


    while (
        (
            no =
                walker.nextNode()
        )
    ) {

        const tamanho =
            no.nodeValue.length;

        const inicioNo =
            posicao;

        const fimNo =
            posicao +
            tamanho;


        if (
            fim > inicioNo &&
            inicio < fimNo
        ) {

            partes.push({
                no,

                inicio:
                    Math.max(
                        0,
                        inicio -
                        inicioNo
                    ),

                fim:
                    Math.min(
                        tamanho,
                        fim -
                        inicioNo
                    )
            });
        }


        posicao =
            fimNo;
    }


    partes
        .reverse()
        .forEach(
            parte => {

                if (
                    parte.fim <=
                    parte.inicio
                ) {
                    return;
                }


                const range =
                    document.createRange();

                range.setStart(
                    parte.no,
                    parte.inicio
                );

                range.setEnd(
                    parte.no,
                    parte.fim
                );


                const marca =
                    document.createElement(
                        "mark"
                    );

                marca.className =
                    "reader-underline";


                try {

                    range.surroundContents(
                        marca
                    );

                } catch {

                    /* Ignora apenas trechos
                       que o navegador não
                       consegue envolver. */
                }
            }
        );
}


function restaurarSublinhadosLeitura(
    casoId
) {

    removerMarcacoesVisuaisLeitura();


    const lista =
        normalizarSublinhadosLeitura(
            lerSublinhadosLeitura(
                casoId
            )
        );


    lista.forEach(
        item => {

            aplicarIntervaloSublinhado(
                item.inicio,
                item.fim
            );
        }
    );
}


function mostrarStatusSublinhado(
    barra,
    mensagem
) {

    const area =
        barra.querySelector(
            "[data-reader-popovers]"
        );

    if (!area) {
        return;
    }


    area.classList.add(
        "active"
    );

    area.innerHTML = `
        <div class="reader-popover reader-underline-status">
            ${mensagem}
        </div>
    `;


    window.setTimeout(
        () => {

            if (
                area.querySelector(
                    ".reader-underline-status"
                )
            ) {

                area.innerHTML =
                    "";

                area.classList.remove(
                    "active"
                );
            }
        },
        1400
    );
}


function configurarSublinhadoLeitura(
    barra,
    casoId
) {

    const botao =
        barra.querySelector(
            "[data-reader-underline]"
        );

    if (!botao) {
        return;
    }


    document.addEventListener(
        "selectionchange",
        () => {

            const intervalo =
                obterIntervaloSelecaoLeitura();

            if (intervalo) {

                ultimaSelecaoLeitura =
                    intervalo;
            }
        }
    );


    botao.addEventListener(
        "click",
        () => {

            const intervalo =
                obterIntervaloSelecaoLeitura() ||
                ultimaSelecaoLeitura;


            if (!intervalo) {

                mostrarStatusSublinhado(
                    barra,
                    "Selecione um trecho do texto primeiro."
                );

                return;
            }


            let lista =
                lerSublinhadosLeitura(
                    casoId
                );


            const sobreposto =
                lista.some(
                    item =>
                        intervalo.inicio <
                            item.fim &&
                        intervalo.fim >
                            item.inicio
                );


            if (sobreposto) {

                lista =
                    lista.filter(
                        item =>
                            !(
                                intervalo.inicio <
                                    item.fim &&
                                intervalo.fim >
                                    item.inicio
                            )
                    );


                salvarSublinhadosLeitura(
                    casoId,
                    lista
                );


                restaurarSublinhadosLeitura(
                    casoId
                );


                mostrarStatusSublinhado(
                    barra,
                    "Sublinhado removido."
                );

            } else {

                lista.push({
                    inicio:
                        intervalo.inicio,

                    fim:
                        intervalo.fim
                });


                lista =
                    normalizarSublinhadosLeitura(
                        lista
                    );


                salvarSublinhadosLeitura(
                    casoId,
                    lista
                );


                restaurarSublinhadosLeitura(
                    casoId
                );


                mostrarStatusSublinhado(
                    barra,
                    "Trecho sublinhado."
                );
            }


            ultimaSelecaoLeitura =
                null;


            window
                .getSelection()
                ?.removeAllRanges();
        }
    );
}

/* ==========================================================================
   SUMÁRIO DO DOSSIÊ — PERGAMINHO
   ========================================================================== */

function configurarSumarioDossieLegado() {

    const artigo =
        document.querySelector(
            ".case-main-content"
        );


    if (!artigo) {
        return;
    }


    if (
        document.querySelector(
            ".dossie-summary"
        )
    ) {
        return;
    }


    const secoes =
        [
            {
                id:
                    "historico",

                titulo:
                    "Histórico do Caso"
            },

            {
                id:
                    "evidencias",

                titulo:
                    "Evidências & Vestígios"
            },

            {
                id:
                    "teorias",

                titulo:
                    "Teorias"
            }
        ];


    const sumario =
        document.createElement(
            "aside"
        );


    sumario.className =
        "dossie-summary";


    sumario.innerHTML = `

        <div class="dossie-summary-title">
            SUMÁRIO DO ARQUIVO
        </div>


      <nav>

    <ul>

        ${
            secoes.map(
                secao => `

                <li>

                    <a
                        href="#${secao.id}"
                        data-summary-target="${secao.id}"
                    >
                        ${secao.titulo}
                    </a>

                </li>

                `
            ).join("")
        }

    </ul>

</nav>

    `;


    artigo.before(
        sumario
    );


    sumario
        .querySelectorAll(
            "a"
        )
        .forEach(
            link => {

                link.addEventListener(
                    "click",
                    evento => {

                        evento.preventDefault();


                        const destino =
                            document.getElementById(
                                link.dataset.summaryTarget
                            );


                        if (destino) {

                            destino.scrollIntoView(
                                {
                                    behavior:
                                        "smooth",

                                    block:
                                        "start"
                                }
                            );
                        }
                    }
                );

            }
        );

}


/*
 * Sumário compatível com o fluxo narrativo novo e com as seções antigas.
 * Os textos são inseridos com textContent para que subtítulos vindos do banco
 * nunca sejam interpretados como HTML.
 */

function configurarSumarioDossie() {

    const artigo =
        document.querySelector(
            ".case-main-content"
        );

    if (
        !artigo ||
        document.querySelector(
            ".dossie-summary"
        )
    ) {
        return;
    }

    const secoes = [];

    const historico =
        document.getElementById(
            "historico"
        );

    if (
        historico &&
        !historico.hidden
    ) {
        secoes.push({
            id:
                "historico",

            titulo:
                historico
                    .querySelector(
                        ".case-block-heading h2"
                    )
                    ?.textContent
                    ?.trim() ||
                "Histórico do Caso"
        });
    }

    document
        .querySelectorAll(
            "#caso-historia .case-content-subtitle[id]"
        )
        .forEach(subtitulo => {

            secoes.push({
                id:
                    subtitulo.id,

                titulo:
                    subtitulo
                        .textContent
                        .trim()
            });
        });

    [
        [
            "evidencias",
            "Evidências & Vestígios"
        ],
        [
            "teorias",
            "Teorias"
        ]
    ].forEach(
        ([id, titulo]) => {

            const elemento =
                document.getElementById(
                    id
                );

            if (
                elemento &&
                !elemento.hidden
            ) {
                secoes.push({
                    id,
                    titulo
                });
            }
        }
    );

    if (!secoes.length) {
        return;
    }

    const ITENS_POR_PAGINA = 5;

    const totalPaginas =
        Math.ceil(
            secoes.length /
            ITENS_POR_PAGINA
        );

    let paginaAtual = 0;

    const sumario =
        document.createElement(
            "aside"
        );

    sumario.className =
        "dossie-summary";

    sumario.appendChild(
        criarElementoTextoDossie(
            "div",
            "SUMÁRIO DO ARQUIVO",
            "dossie-summary-title"
        )
    );

    const navegacao =
        document.createElement(
            "nav"
        );

    navegacao.setAttribute(
        "aria-label",
        "Sumário do dossiê"
    );

    const lista =
        document.createElement(
            "ul"
        );

    const paginacao =
        document.createElement(
            "div"
        );

    paginacao.className =
        "dossie-summary-pagination";

    const botaoAnterior =
        document.createElement(
            "button"
        );

    botaoAnterior.type =
        "button";

    botaoAnterior.className =
        "dossie-summary-page-button";

    botaoAnterior.textContent =
        "Anterior";

    botaoAnterior.setAttribute(
        "aria-label",
        "Mostrar página anterior do sumário"
    );

    const indicador =
        document.createElement(
            "span"
        );

    indicador.className =
        "dossie-summary-page-indicator";

    indicador.setAttribute(
        "aria-live",
        "polite"
    );

    const botaoProximo =
        document.createElement(
            "button"
        );

    botaoProximo.type =
        "button";

    botaoProximo.className =
        "dossie-summary-page-button";

    botaoProximo.textContent =
        "Próxima";

    botaoProximo.setAttribute(
        "aria-label",
        "Mostrar próxima página do sumário"
    );

    paginacao.append(
        botaoAnterior,
        indicador,
        botaoProximo
    );

    const abrirSecao = secao => {

        const destino =
            document.getElementById(
                secao.id
            );

        destino?.scrollIntoView({
            behavior:
                window.matchMedia(
                    "(prefers-reduced-motion: reduce)"
                ).matches
                    ? "auto"
                    : "smooth",

            block:
                "start"
        });
    };

    const renderizarPagina = () => {

        const inicio =
            paginaAtual *
            ITENS_POR_PAGINA;

        const itensDaPagina =
            secoes.slice(
                inicio,
                inicio +
                ITENS_POR_PAGINA
            );

        lista.replaceChildren();

        itensDaPagina.forEach(
            secao => {

                const item =
                    document.createElement(
                        "li"
                    );

                const link =
                    criarElementoTextoDossie(
                                               "a",
                        secao.titulo
                    );

                link.href =
                    `#${secao.id}`;

                link.dataset.summaryTarget =
                    secao.id;

                link.addEventListener(
                    "click",
                    evento => {

                        evento.preventDefault();

                        abrirSecao(
                            secao
                        );
                    }
                );

                item.appendChild(
                    link
                );

                lista.appendChild(
                    item
                );
            }
        );

        indicador.textContent =
            `${paginaAtual + 1} / ${totalPaginas}`;

        botaoAnterior.disabled =
            paginaAtual === 0;

        botaoProximo.disabled =
            paginaAtual ===
            totalPaginas - 1;

        paginacao.hidden =
            totalPaginas <= 1;
    };

    botaoAnterior.addEventListener(
        "click",
        () => {

            if (paginaAtual <= 0) {
                return;
            }

            paginaAtual -= 1;

            renderizarPagina();
        }
    );

    botaoProximo.addEventListener(
        "click",
        () => {

            if (
                paginaAtual >=
                totalPaginas - 1
            ) {
                return;
            }

            paginaAtual += 1;

            renderizarPagina();
        }
    );

    navegacao.appendChild(
        lista
    );

    sumario.append(
        navegacao,
        paginacao
    );

    artigo.before(
        sumario
    );

    renderizarPagina();
}

/* =========================================================
   BOTÃO FLUTUANTE — VOLTAR AO TOPO
   ========================================================= */

function inicializarBotaoVoltarTopo() {

    if (
        document.querySelector(
            "[data-back-to-top]"
        )
    ) {
        return;
    }

    const botao =
        document.createElement(
            "button"
        );

    botao.type =
        "button";

    botao.className =
        "case-back-to-top";

    botao.dataset.backToTop =
        "";

    botao.setAttribute(
        "aria-label",
        "Voltar ao início do dossiê"
    );

    botao.setAttribute(
        "title",
        "Voltar ao topo"
    );

    botao.innerHTML = `
        <span aria-hidden="true">
            ↑
        </span>
    `;

    document.body.appendChild(
        botao
    );

    const atualizarVisibilidade = () => {

        const deveMostrar =
            window.scrollY > 700;

        botao.classList.toggle(
            "is-visible",
            deveMostrar
        );

        botao.tabIndex =
            deveMostrar
                ? 0
                : -1;

        botao.setAttribute(
            "aria-hidden",
            deveMostrar
                ? "false"
                : "true"
        );
    };

    botao.addEventListener(
        "click",
        () => {

            window.scrollTo({
                top: 0,

                behavior:
                    window.matchMedia(
                        "(prefers-reduced-motion: reduce)"
                    ).matches
                        ? "auto"
                        : "smooth"
            });
        }
    );

    window.addEventListener(
        "scroll",
        atualizarVisibilidade,
        {
            passive: true
        }
    );

    atualizarVisibilidade();
}


if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        inicializarBotaoVoltarTopo,
        {
            once: true
        }
    );

} else {

    inicializarBotaoVoltarTopo();
}

