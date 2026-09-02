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
