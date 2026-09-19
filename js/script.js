/* ==========================================================================
   ARQUIVO SOMBRIO
   SCRIPT PRINCIPAL — NAVEGAÇÃO, ACERVO, FÓRUM E ADMINISTRAÇÃO
   ========================================================================== */

"use strict";


/* ==========================================================================
   SUPABASE
   ========================================================================== */

const SUPABASE_URL =
    "https://iuhotznurbyujzbyhizf.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_bpAZ5EhYLIuVoE4Q97s_-A_XQwwRxUj";

const SUPABASE_SDK_URL =
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0";

const TURNSTILE_SITE_KEY =
    "0x4AAAAAAEnNLBi2BDt_aJkF";


let clienteSupabase = null;
let promessaClienteSupabase = null;
let promessaSupabaseSDK = null;
let casosSupabase = [];
let livrosSupabase = [];
let periciasSupabase = [];

/* =========================================================
   CLOUDFLARE TURNSTILE
   ========================================================= */

const TURNSTILE_SDK_URL =
    "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let promessaTurnstileSDK = null;


function carregarTurnstileSDK() {

    if (window.turnstile) {
        return Promise.resolve(
            window.turnstile
        );
    }

    if (promessaTurnstileSDK) {
        return promessaTurnstileSDK;
    }

    promessaTurnstileSDK =
        new Promise(
            (resolve, reject) => {

                let finalizado = false;

                const finalizar =
                    (acao, valor) => {

                        if (finalizado) {
                            return;
                        }

                        finalizado = true;
                        window.clearTimeout(
                            temporizadorCarregamento
                        );
                        acao(valor);
                    };

                const script =
                    document.createElement(
                        "script"
                    );

                script.src =
                    TURNSTILE_SDK_URL;

                script.async = true;
                script.defer = true;

                const temporizadorCarregamento =
                    window.setTimeout(
                        () => {

                            script.remove();

                            finalizar(
                                reject,
                                new Error(
                                    "A proteção de segurança não carregou. Desative o bloqueador de anúncios para este site e tente novamente."
                                )
                            );
                        },
                        15000
                    );

                script.onload = () => {

                    if (window.turnstile) {

                        finalizar(
                            resolve,
                            window.turnstile
                        );

                        return;
                    }

                    finalizar(
                        reject,
                        new Error(
                            "Cloudflare Turnstile não foi carregado."
                        )
                    );
                };

                script.onerror = () => {

                    finalizar(
                        reject,
                        new Error(
                            "Não foi possível carregar a proteção anti-bot. Desative o bloqueador de anúncios para este site e tente novamente."
                        )
                    );
                };

                document.head.appendChild(
                    script
                );

            }
        );

    promessaTurnstileSDK.catch(
        () => {
            promessaTurnstileSDK = null;
        }
    );

    return promessaTurnstileSDK;
}


function obterTokenTurnstile() {

    let container = null;
    let widgetId = null;

    return carregarTurnstileSDK()
        .then(
            turnstile => {

                return new Promise(
                    (resolve, reject) => {

                        container =
                            document.createElement(
                                "div"
                            );

                        container.id =
                            "arquivo-sombrio-turnstile";

                        container.setAttribute(
                            "role",
                            "dialog"
                        );

                        container.setAttribute(
                            "aria-label",
                            "Verificação de segurança"
                        );

                        container.style.cssText =
                            "position:fixed;inset:0;z-index:2147483647;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,.92)";

                        document.body.appendChild(
                            container
                        );


                        let temporizador = null;

                        const limpar = () => {

                            if (
                                temporizador !==
                                null
                            ) {

                                clearTimeout(
                                    temporizador
                                );

                                temporizador =
                                    null;
                            }

                            if (
                                widgetId !== null &&
                                window.turnstile
                            ) {

                                try {

                                    window.turnstile.remove(
                                        widgetId
                                    );

                                } catch (erro) {

                                    console.warn(
                                        erro
                                    );

                                }
                            }

                            if (container) {

                                container.remove();
                                container = null;

                            }
                        };


                        const rejeitar =
                            mensagem => {

                                limpar();

                                reject(
                                    new Error(
                                        mensagem
                                    )
                                );
                            };


                        /*
                         * Instrução visível: o Cloudflare
                         * pode exigir clique no checkbox;
                         * sem este aviso, o usuário não
                         * sabe que precisa interagir.
                         */

                        const aviso =
                            document.createElement(
                                "div"
                            );

                        aviso.textContent =
                            "CONCLUA A VERIFICAÇÃO DE SEGURANÇA";

                        aviso.style.cssText =
                            "font:600 11px/1.4 monospace;letter-spacing:.12em;color:#cfc6bd;text-transform:uppercase;margin:0 0 12px;text-align:center";

                        container.appendChild(
                            aviso
                        );


                        /*
                         * Rede de segurança: se nenhum
                         * callback do widget disparar
                         * em 2 minutos, encerra a
                         * espera com orientação clara
                         * em vez de "Verificando..."
                         * infinito.
                         */

                        temporizador =
                            setTimeout(
                                () => {

                                    rejeitar(
                                        "A verificação de segurança não foi concluída. Clique na caixa exibida e tente novamente."
                                    );

                                },
                                30000
                            );


                        widgetId =
                            turnstile.render(
                                container,
                                {

                                    sitekey:
                                        TURNSTILE_SITE_KEY,

                                    theme:
                                        "dark",

                                    language:
                                        "pt-BR",

                                    callback:
                                        token => {

                                            limpar();

                                            resolve(
                                                token
                                            );
                                        },

                                    "error-callback":
                                        () => {

                                            rejeitar(
                                                "Não foi possível concluir a verificação anti-bot."
                                            );

                                            return true;
                                        },

                                    "expired-callback":
                                        () => {

                                            rejeitar(
                                                "A verificação anti-bot expirou. Tente novamente."
                                            );
                                        },

                                    "timeout-callback":
                                        () => {

                                            rejeitar(
                                                "A verificação anti-bot demorou demais. Tente novamente."
                                            );
                                        }

                                }
                            );

                    }
                );

            }
        )
        .catch(
            erro => {

                if (container) {

                    container.remove();

                }

                throw erro;

            }
        );
}


/* ==========================================================================
   CONFIGURAÇÕES
   ========================================================================== */

const CONFIG = {

    STORAGE_CASOS:
        "arquivo_sombrio_casos",

    STORAGE_LIVROS:
        "arquivo_sombrio_livros",

    STORAGE_COMENTARIOS:
        "arquivo_sombrio_comentarios",

    STORAGE_SUGESTOES:
        "arquivo_sombrio_sugestoes"

};


/* ==========================================================================
   LIVROS INICIAIS
   ========================================================================== */

const livrosIniciais = [

    {

        id: 1,

        titulo:
            "Casos de Rotina: Perícia Forense em Ação",

        autor:
            "Dr. A. Forense",

        ano:
            2024,

        editora:
            "Arquivo Sombrio",

        capa:
            "imagens/livros/pericia.jpg",

        descricao:
            "Uma introdução aos métodos científicos utilizados na análise de vestígios e cenas de crime.",

        tag:
            "PERÍCIA & CRIMINOLOGIA",

        recomendado:
            true,

        criadoEm:
            "2026-01-01T12:00:00.000Z"

    },

    {

        id: 2,

        titulo:
            "Compêndio de Lendas Urbanas e Mitos",

        autor:
            "H. P. Silva",

        ano:
            2023,

        editora:
            "Arquivo Sombrio",

        capa:
            "imagens/livros/lendas.jpg",

        descricao:
            "Uma compilação sobre a origem histórica de mitos, lendas urbanas e folclore obscuro.",

        tag:
            "FOLCLORE & MISTÉRIOS",

        recomendado:
            true,

        criadoEm:
            "2026-01-02T12:00:00.000Z"

    }

];


/* ==========================================================================
   INICIALIZAÇÃO
   ========================================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        inicializarMenuMobile();

        inicializarFiltrosForenses();

        inicializarNavegacaoInterna();

        carregarCasosSupabase();

        carregarPericiasSupabase();

        carregarLivrosSupabase();

        inicializarForum();

        inicializarSugestao();

        inicializarAdmin();

        inicializarModais();

    }
);


/* ==========================================================================
   SUPABASE / AUTENTICAÇÃO
   ========================================================================== */

function carregarSupabaseSDK() {

    if (
        window.supabase &&
        typeof window.supabase.createClient ===
            "function"
    ) {

        return Promise.resolve();

    }


    if (promessaSupabaseSDK) {

        return promessaSupabaseSDK;

    }


    promessaSupabaseSDK =
        new Promise(
            (resolve, reject) => {

                let encerrado = false;

                const encerrar = (acao, valor) => {
                    if (encerrado) return;
                    encerrado = true;
                    window.clearTimeout(tempoLimite);
                    acao(valor);
                };

                const tempoLimite =
                    window.setTimeout(
                        () => encerrar(
                            reject,
                            new Error(
                                "O Supabase demorou demais para carregar. Atualize a página e tente novamente."
                            )
                        ),
                        15000
                    );

                const scriptExistente =
                    document.querySelector(
                        'script[data-arquivo-sombrio-supabase="true"]'
                    );


                if (scriptExistente) {

                    scriptExistente
                        .addEventListener(
                            "load",
                            () => encerrar(resolve),
                            {
                                once: true
                            }
                        );

                    scriptExistente
                        .addEventListener(
                            "error",
                            () =>
                                encerrar(
                                    reject,
                                    new Error(
                                        "Falha ao carregar o Supabase."
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
                    SUPABASE_SDK_URL;

                script.async =
                    true;

                script.dataset
                    .arquivoSombrioSupabase =
                    "true";


                script.addEventListener(
                    "load",
                    () => encerrar(resolve),
                    {
                        once: true
                    }
                );


                script.addEventListener(
                    "error",
                    () =>
                        encerrar(
                            reject,
                            new Error(
                                "Falha ao carregar o Supabase."
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


    return promessaSupabaseSDK;
}


/* ==========================================================================
   OBTER CLIENTE SUPABASE
   ========================================================================== */

async function obterClienteSupabase() {

    if (window.arquivoAdminSupabaseClient) {

        clienteSupabase =
            window.arquivoAdminSupabaseClient;

        return clienteSupabase;

    }

    if (clienteSupabase) {

        return clienteSupabase;

    }

    if (promessaClienteSupabase) {

        return promessaClienteSupabase;

    }

    promessaClienteSupabase =
        (async () => {

            await carregarSupabaseSDK();

            if (
                !window.supabase ||
                typeof window.supabase.createClient !==
                    "function"
            ) {

                throw new Error(
                    "A biblioteca do Supabase não ficou disponível."
                );

            }

            const opcoesAuth = {

                persistSession:
                    true,

                autoRefreshToken:
                    true,

                detectSessionInUrl:
                    true

            };

            clienteSupabase =
                window.supabase.createClient(
                    SUPABASE_URL,
                    SUPABASE_PUBLISHABLE_KEY,
                    {

                        auth: opcoesAuth

                    }
                );

            return clienteSupabase;

        })();

    try {

        return await promessaClienteSupabase;

    } catch (erro) {

        promessaClienteSupabase = null;

        throw erro;

    }

}


/* ==========================================================================
   OBTER SESSÃO ADMINISTRATIVA
   ========================================================================== */

async function obterSessaoAdmin() {

    try {

        const supabaseClient =
            await obterClienteSupabase();


        const {
            data,
            error
        } =
            await Promise.race([
                supabaseClient
                    .auth
                    .getSession(),
                new Promise((_, reject) =>
                    window.setTimeout(
                        () => reject(
                            new Error(
                                "A verificação da sessão demorou demais."
                            )
                        ),
                        10000
                    )
                )
            ]);


        if (error) {

            console.warn(
                "Não foi possível verificar a sessão:",
                error
            );

            return null;

        }


        const sessao =
            data?.session;


        if (!sessao?.user) {

            return null;

        }


        const usuario =
            sessao.user;


        const role =
            usuario
                .app_metadata
                ?.role;


        if (
            role !==
            "admin"
        ) {

            console.warn(
                "Acesso administrativo negado."
            );

            return null;

        }


        return sessao;


    } catch (erro) {

        console.error(
            "Falha ao validar a sessão administrativa:",
            erro
        );

        return null;

    }

}


/* ==========================================================================
   SAIR DA ÁREA ADMINISTRATIVA
   ========================================================================== */

async function sairAdmin() {

    try {

        const supabaseClient =
            await obterClienteSupabase();


        await supabaseClient
            .auth
            .signOut();


    } catch (erro) {

        console.warn(
            "Não foi possível encerrar a sessão no Supabase.",
            erro
        );

    }


    if (window.ARQUIVO_ADMIN_PAINEL_DIRETO) {

        window.location.replace(
            "admin.html?logout=1"
        );

        return;
    }


    document
        .getElementById(
            "admin-manager"
        )
        ?.classList.remove(
            "active"
        );


    if (window.ARQUIVO_ADMIN_CAPTCHA_ATIVO) {

        document.body.classList.remove(
            "admin-dashboard-open"
        );

        const modal =
            document.getElementById(
                "modal-admin"
            );

        if (modal) {
            modal.hidden = false;
            modal.classList.add("active");
            modal.setAttribute("aria-hidden", "false");
        }

        if (
            typeof window.arquivoAdminCaptchaReset ===
                "function"
        ) {
            window.arquivoAdminCaptchaReset();
        }

    }


    fecharFormularioAdmin();

}


/* ==========================================================================
   UTILITÁRIOS
   ========================================================================== */

function lerStorage(chave) {

    try {

        const valor =
            localStorage.getItem(
                chave
            );


        if (!valor) {

            return [];

        }


        const dados =
            JSON.parse(
                valor
            );


        return Array.isArray(
            dados
        )
            ? dados
            : [];


    } catch (erro) {

        console.warn(
            `Não foi possível ler o armazenamento "${chave}".`,
            erro
        );


        return [];

    }

}


function salvarStorage(
    chave,
    dados
) {

    try {

        localStorage.setItem(
            chave,
            JSON.stringify(
                dados
            )
        );


        return true;


    } catch (erro) {

        console.error(
            `Não foi possível salvar "${chave}".`,
            erro
        );


        alert(
            "Não foi possível salvar os dados neste navegador."
        );


        return false;

    }

}


function escaparHTML(valor) {

    if (
        valor === null ||
        valor === undefined
    ) {

        return "";

    }


    return String(
        valor
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


function normalizarEvidencias(
    evidencias
) {

    if (
        Array.isArray(
            evidencias
        )
    ) {

        return evidencias
            .map(
                item =>
                    String(
                        item
                    ).trim()
            )
            .filter(
                Boolean
            );

    }


    if (
        typeof evidencias ===
        "string"
    ) {

        return evidencias
            .split(
                "\n"
            )
            .map(
                item =>
                    item.trim()
            )
            .filter(
                Boolean
            );

    }


    return [];

}


function obterCasosIniciais() {

    if (
        typeof casosArquivo !==
            "undefined" &&
        Array.isArray(
            casosArquivo
        )
    ) {

        return casosArquivo;

    }


    return [];

}


/* ==========================================================================
   UPLOADS — SUPABASE STORAGE
   ========================================================================== */

const STORAGE_BUCKET_IMAGENS =
    "imagens";

const STORAGE_BUCKET_DOCUMENTOS =
    "documentos";


function limparNomeArquivo(
    nome
) {

    const partes =
        String(
            nome ||
            "arquivo"
        ).split(
            "."
        );


    const extensao =
        partes.length > 1
            ? partes
                .pop()
                .toLowerCase()
            : "";


    const base =
        partes
            .join(
                "."
            )
            .normalize(
                "NFD"
            )
            .replace(
                /[\u0300-\u036f]/g,
                ""
            )
            .replace(
                /[^a-zA-Z0-9_-]+/g,
                "-"
            )
            .replace(
                /^-+|-+$/g,
                ""
            )
            .toLowerCase() ||
        "arquivo";


    return extensao
        ? `${base}.${extensao}`
        : base;

}


function criarCaminhoStorage(
    pasta,
    arquivo
) {

    const nomeSeguro =
        limparNomeArquivo(
            arquivo.name
        );


    const identificador =
        `${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 9)}`;


    return `${pasta}/${identificador}-${nomeSeguro}`;

}


async function exigirSessaoAdminUpload() {

    const sessao =
        await obterSessaoAdmin();


    if (!sessao) {

        throw new Error(
            "Sua sessão administrativa expirou. Entre novamente na área restrita."
        );

    }


    return sessao;

}


async function enviarArquivoStorage(
    bucket,
    pasta,
    arquivo
) {

    if (!arquivo) {

        throw new Error(
            "Nenhum arquivo foi selecionado."
        );
    }

    await exigirSessaoAdminUpload();

    const supabaseClient =
        await obterClienteSupabase();

    const caminho =
        criarCaminhoStorage(
            pasta,
            arquivo
        );

    const { error } =
        await supabaseClient.storage
            .from(bucket)
            .upload(
                caminho,
                arquivo,
                {
                    cacheControl: "3600",
                    upsert: false,
                    contentType:
                        arquivo.type ||
                        undefined
                }
            );

    if (error) {
        throw error;
    }

    const { data } =
        supabaseClient.storage
            .from(bucket)
            .getPublicUrl(caminho);

    if (!data?.publicUrl) {

        throw new Error(
            "Não foi possível gerar a URL pública do arquivo."
        );
    }

    return {
        bucket,
        caminho,
        url: data.publicUrl,
        nome: arquivo.name,
        tipo: arquivo.type || "",
        tamanho: Number(arquivo.size) || 0
    };
}


async function excluirArquivoStorage(
    bucket,
    caminho
) {

    if (!bucket || !caminho) {
        return;
    }

    await exigirSessaoAdminUpload();

    const supabaseClient =
        await obterClienteSupabase();

    const { error } =
        await supabaseClient.storage
            .from(bucket)
            .remove([caminho]);

    if (error) {
        throw error;
    }
}


function formatarTamanhoArquivo(bytes) {

    const tamanho =
        Number(bytes) || 0;

    if (tamanho < 1024) {
        return `${tamanho} B`;

       }

    if (tamanho < 1024 * 1024) {

        return `${(
            tamanho / 1024
        ).toFixed(1)} KB`;
    }

    return `${(
        tamanho / (1024 * 1024)
    ).toFixed(1)} MB`;
}


function normalizarDocumentos(documentos) {

    if (!Array.isArray(documentos)) {
        return [];
    }

    const categoriasSensiveisPermitidas = [
        "",
        "cena_crime",
        "autopsia",
        "cadaver",
        "ferimento",
        "conteudo_medico",
        "outro"
    ];

    return documentos
        .map(documento => {

            const categoriaSensivel =
                String(
                    documento?.categoria_sensivel ||
                    ""
                )
                    .trim()
                    .toLowerCase();

            return {

                nome:
                    String(
                        documento?.nome || ""
                    ).trim(),

                url:
                    String(
                        documento?.url || ""
                    ).trim(),

                caminho:
                    String(
                        documento?.caminho || ""
                    ).trim(),

                bucket:
                    String(
                        documento?.bucket ||
                        STORAGE_BUCKET_DOCUMENTOS
                    ).trim(),

                tipo:
                    String(
                        documento?.tipo || ""
                    ).trim(),

                tamanho:
                    Number(
                        documento?.tamanho
                    ) || 0,

                legenda:
                    String(
                        documento?.legenda || ""
                    ).trim(),

                fonte:
                    String(
                        documento?.fonte || ""
                    ).trim(),

                credito:
                    String(
                        documento?.credito || ""
                    ).trim(),

                link:
                    String(
                        documento?.link || ""
                    ).trim(),

                sensivel:
                    documento?.sensivel === true ||
                    documento?.sensivel === "true",

                categoria_sensivel:
                    categoriasSensiveisPermitidas
                        .includes(
                            categoriaSensivel
                        )
                        ? categoriaSensivel
                        : "outro"

            };

        })
        .filter(
            documento =>
                documento.nome &&
                documento.url
        );
}


function criarItemDocumentoAdmin(documento) {

    const sensivel =
        documento?.sensivel === true ||
        documento?.sensivel === "true";

    const categoriaSensivel =
        String(
            documento?.categoria_sensivel || ""
        ).trim();

    return `
        <div
            class="admin-document-item"
            data-document-name="${escaparHTML(documento.nome || "")}"
            data-document-url="${escaparHTML(documento.url || "")}"
            data-document-path="${escaparHTML(documento.caminho || "")}"
            data-document-bucket="${escaparHTML(documento.bucket || STORAGE_BUCKET_DOCUMENTOS)}"
            data-document-type="${escaparHTML(documento.tipo || "")}"
            data-document-size="${Number(documento.tamanho) || 0}"
        >

            <div class="admin-document-info">

                <i class="fa-solid fa-file-lines"></i>

                <div>
                    <strong>
                        ${escaparHTML(documento.nome || "Documento")}
                    </strong>

                    <small>
                        ${escaparHTML(documento.tipo || "Documento")}
                        ${
                            documento.tamanho
                                ? ` • ${escaparHTML(
                                    formatarTamanhoArquivo(
                                        documento.tamanho
                                    )
                                )}`
                                : ""
                        }
                    </small>
                </div>

            </div>


            <div class="admin-document-metadata">

                <label>
                    Legenda
                    <input
                        type="text"
                        class="admin-document-caption"
                        value="${escaparHTML(documento.legenda || "")}"
                        placeholder="Ex.: Tribunal durante o julgamento de Lizzie Borden"
                    >
                </label>


                <label>
                    Fonte
                    <input
                        type="text"
                        class="admin-document-source"
                        value="${escaparHTML(documento.fonte || "")}"
                        placeholder="Ex.: Library of Congress"
                    >
                </label>


                <label>
                    Crédito
                    <input
                        type="text"
                        class="admin-document-credit"
                        value="${escaparHTML(documento.credito || "")}"
                        placeholder="Fotógrafo, arquivo ou instituição"
                    >
                </label>


                <label>
                    Link da fonte
                    <input
                        type="url"
                        class="admin-document-link"
                        value="${escaparHTML(documento.link || "")}"
                        placeholder="https://..."
                        inputmode="url"
                    >
                </label>


                <div class="admin-sensitive-control">

                    <label class="admin-sensitive-checkbox">

                        <input
                            type="checkbox"
                            class="admin-document-sensitive"
                            ${sensivel ? "checked" : ""}
                        >

                        <span>
                            Esta imagem contém conteúdo sensível
                        </span>

                    </label>


                    <label
                        class="admin-sensitive-category-wrap"
                        ${sensivel ? "" : 'style="display:none;"'}
                    >
                        Tipo de conteúdo sensível

                        <select class="admin-document-sensitive-category">

                            <option
                                value=""
                                ${!categoriaSensivel ? "selected" : ""}
                            >
                                Selecione
                            </option>

                            <option
                                value="cena_crime"
                                ${categoriaSensivel === "cena_crime" ? "selected" : ""}
                            >
                                Cena de crime
                            </option>

                            <option
                                value="autopsia"
                                ${categoriaSensivel === "autopsia" ? "selected" : ""}
                            >
                                Autópsia
                            </option>

                            <option
                                value="cadaver"
                                ${categoriaSensivel === "cadaver" ? "selected" : ""}
                            >
                                Cadáver
                            </option>

                            <option
                                value="ferimento"
                                ${categoriaSensivel === "ferimento" ? "selected" : ""}
                            >
                                Ferimento
                            </option>

                            <option
                                value="conteudo_medico"
                                ${categoriaSensivel === "conteudo_medico" ? "selected" : ""}
                            >
                                Conteúdo médico
                            </option>

                            <option
                                value="outro"
                                ${categoriaSensivel === "outro" ? "selected" : ""}
                            >
                                Outro
                            </option>

                        </select>

                    </label>

                </div>

            </div>


            <div class="admin-document-actions">

                <a
                    href="${escaparHTML(documento.url || "#")}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="admin-document-open"
                >
                    Abrir
                </a>

                <button
                    type="button"
                    class="admin-document-remove"
                    title="Remover documento"
                    aria-label="Remover documento"
                >
                    <i class="fa-solid fa-trash"></i>
                </button>

            </div>

        </div>
    `;
}


function coletarDocumentosAdmin() {

    return Array
        .from(
            document.querySelectorAll(
                "#admin-documents-list .admin-document-item"
            )
        )
        .map(item => {

            const campoLegenda =
                item.querySelector(
                    ".admin-document-caption"
                );

            const campoFonte =
                item.querySelector(
                    ".admin-document-source"
                );

            const campoCredito =
                item.querySelector(
                    ".admin-document-credit"
                );

            const campoLink =
                item.querySelector(
                    ".admin-document-link"
                );

            const campoSensivel =
                item.querySelector(
                    ".admin-document-sensitive"
                );

            const campoCategoriaSensivel =
                item.querySelector(
                    ".admin-document-sensitive-category"
                );


            return {

                nome:
                    item.dataset.documentName ||
                    "",

                url:
                    item.dataset.documentUrl ||
                    "",

                caminho:
                    item.dataset.documentPath ||
                    "",

                bucket:
                    item.dataset.documentBucket ||
                    STORAGE_BUCKET_DOCUMENTOS,

                tipo:
                    item.dataset.documentType ||
                    "",

                tamanho:
                    Number(
                        item.dataset.documentSize
                    ) || 0,

                legenda:
                    campoLegenda?.value.trim() ||
                    "",

                fonte:
                    campoFonte?.value.trim() ||
                    "",

                credito:
                    campoCredito?.value.trim() ||
                    "",

                link:
                    campoLink?.value.trim() ||
                    "",

                sensivel:
                    Boolean(
                        campoSensivel?.checked
                    ),

                categoria_sensivel:
                    campoSensivel?.checked
                        ? (
                            campoCategoriaSensivel
                                ?.value || ""
                        )
                        : ""

            };

        })
        .filter(
            documento =>
                documento.nome &&
                documento.url
        );
}

function criarIdentificadorBlocoAdmin() {

    if (window.crypto?.randomUUID) {
        return window.crypto.randomUUID();
    }

    return `bloco-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}`;
}


function normalizarDadosBlocoAdmin(bloco = {}) {

    const dadosNovos =
        bloco?.dados &&
        typeof bloco.dados === "object" &&
        !Array.isArray(bloco.dados)
            ? bloco.dados
            : {};

    return {
        ...dadosNovos,
        texto:
            dadosNovos.texto ??
            bloco.conteudo ??
            "",
        url:
            dadosNovos.url ??
            bloco.conteudo ??
            "",
        titulo:
            dadosNovos.titulo ??
            bloco.titulo ??
            bloco.legenda ??
            "",
        legenda:
            dadosNovos.legenda ??
            bloco.legenda ??
            "",
        descricao:
            dadosNovos.descricao ??
            bloco.observacao ??
            "",
        fonte:
            dadosNovos.fonte ??
            bloco.fonte ??
            "",
        credito:
            dadosNovos.credito ??
            bloco.credito ??
            "",
        link_fonte:
            dadosNovos.link_fonte ??
            bloco.link_fonte ??
            "",
        texto_alternativo:
            dadosNovos.texto_alternativo ??
            bloco.texto_alternativo ??
            "",
        sensivel:
            dadosNovos.sensivel === true ||
            bloco.sensivel === true,
        categoria_sensivel:
            dadosNovos.categoria_sensivel ??
            bloco.categoria_sensivel ??
            "",
        alinhamento:
            dadosNovos.alinhamento ??
            bloco.alinhamento ??
            "centro",
        tamanho:
            dadosNovos.tamanho ??
            bloco.tamanho ??
            "medio",

       posicao:
    dadosNovos.posicao ??
    bloco.posicao ??
    "",
       
        acao:
            dadosNovos.acao ??
            bloco.acao ??
            "abrir",
        itens:
            Array.isArray(dadosNovos.itens)
                ? dadosNovos.itens
                : []
    };
}


function separarItensBlocoAdmin(texto, limite = null) {

    const itens =
        String(texto || "")
            .split(/\n\s*\n/)
            .map(item => item.trim())
            .filter(Boolean);

    return Number.isInteger(limite)
        ? itens.slice(0, limite)
        : itens;
}


function validarUrlVideoAdmin(url) {

    if (!url) {
        return false;
    }

    try {

        const endereco =
            new URL(url);

        const dominio =
            endereco.hostname
                .replace(/^www\./, "")
                .toLowerCase();

        return [
            "youtube.com",
            "m.youtube.com",
            "youtu.be",
            "vimeo.com",
            "player.vimeo.com"
        ].includes(dominio);

    } catch (erro) {
        return false;
    }
}


function coletarBlocosConteudoAdmin() {

    const editor =
        document.getElementById(
            "admin-content-blocks"
        );

    const lerCampo = id =>
        document
            .getElementById(id)
            ?.value
            ?.trim() || "";

    const criarBloco = (
        tipo,
        dados
    ) => ({
        id:
            criarIdentificadorBlocoAdmin(),
        tipo,
        ordem: 0,
        dados
    });

    const historia =
        lerCampo(
            "admin-history"
        );

    const cronologia =
        separarItensBlocoAdmin(
            lerCampo(
                "admin-chronology"
            )
        );

    const evidencias =
        separarItensBlocoAdmin(
            lerCampo(
                "admin-evidence"
            ),
            5
        );

    const hipoteses =
        separarItensBlocoAdmin(
            lerCampo(
                "admin-theories"
            )
        );

    const situacaoOficial =
        lerCampo(
            "admin-official-status"
        );

    const fontes =
        lerCampo(
            "admin-sources"
        );

    /*
     * A História permanece em uma única caixa na administração.
     * Internamente, os trechos são separados somente no momento
     * de salvar para permitir imagens entre os parágrafos.
     *
     * Para criar um subtítulo dentro da História, escreva:
     * ## Nome do subtítulo
     */
    const blocosHistoria =
        historia
            .split(/\n\s*\n/)
            .map(trecho =>
                trecho.trim()
            )
            .filter(Boolean)
            .map(trecho => {

                const ehSubtitulo =
                    trecho.startsWith(
                        "## "
                    );

                const texto =
                    ehSubtitulo
                        ? trecho
                            .replace(
                                /^##\s+/,
                                ""
                            )
                            .trim()
                        : trecho;

                return criarBloco(
                    ehSubtitulo
                        ? "subtitulo"
                        : "paragrafo",
                    {
                        texto
                    }
                );
            });

    const blocosMidia =
        editor
            ? Array
                .from(
                    editor.querySelectorAll(
                        "[data-content-block]"
                    )
                )
                .map(bloco => {

                    const tipo =
                        bloco.dataset.blockType;

                    if (
                        ![
                            "imagem",
                            "documento",
                            "video"
                        ].includes(tipo)
                    ) {
                        return null;
                    }

                    const ler = seletor =>
                        bloco
                            .querySelector(
                                seletor
                            )
                            ?.value
                            ?.trim() || "";

                    const dados = {};

                    if (tipo === "imagem") {

                        Object.assign(
                            dados,
                            {
                                url:
                                    ler(
                                        "[data-block-content]"
                                    ),

                                legenda:
                                    ler(
                                        "[data-block-caption]"
                                    ),

                                descricao:
                                    ler(
                                        "[data-block-note]"
                                    ),

                                fonte:
                                    ler(
                                        "[data-block-source]"
                                    ),

                                credito:
                                    ler(
                                        "[data-block-credit]"
                                    ),

                                link_fonte:
                                    ler(
                                        "[data-block-source-link]"
                                    ),

                                texto_alternativo:
                                    ler(
                                        "[data-block-alt]"
                                    ),

                                sensivel:
                                    Boolean(
                                        bloco.querySelector(
                                            "[data-block-sensitive]"
                                        )?.checked
                                    ),

                                categoria_sensivel:
                                    ler(
                                        "[data-block-sensitive-category]"
                                    ),

                                alinhamento:
                                    ler(
                                        "[data-block-align]"
                                    ) ||
                                    "centro",

                                tamanho:
                                    ler(
                                        "[data-block-size]"
                                    ) ||
                                    "medio",

                                posicao:
                                    bloco.dataset
                                        .insertPosition ||
                                    ""
                            }
                        );
                    }

                    if (tipo === "documento") {

                        Object.assign(
                            dados,
                            {
                                url:
                                    ler(
                                        "[data-block-content]"
                                    ),

                                titulo:
                                    ler(
                                        "[data-block-title]"
                                    ),

                                descricao:
                                    ler(
                                        "[data-block-description]"
                                    ),

                                fonte:
                                    ler(
                                        "[data-block-source]"
                                    ),

                                link_original:
                                    ler(
                                        "[data-block-original-link]"
                                    ),

                                acao:
                                    ler(
                                        "[data-block-action]"
                                    ) ||
                                    "abrir",

                                posicao:
                                    bloco.dataset
                                        .insertPosition ||
                                    ""
                            }
                        );
                    }

                    if (tipo === "video") {

                        Object.assign(
                            dados,
                            {
                                url:
                                    ler(
                                        "[data-block-content]"
                                    ),

                                titulo:
                                    ler(
                                        "[data-block-title]"
                                    ),

                                posicao:
                                    bloco.dataset
                                        .insertPosition ||
                                    ""
                            }
                        );
                    }

                    if (!dados.url) {
                        return null;
                    }

                    return {
                        id:
                            bloco.dataset.blockId ||
                            criarIdentificadorBlocoAdmin(),

                        tipo,

                        ordem: 0,

                        dados
                    };
                })
                .filter(Boolean)
            : [];

    const conteudoNarrativo = [
        ...blocosHistoria
    ];

    /*
     * Insere imagens, documentos e vídeos no ponto escolhido.
     * Formato da posição:
     * antes-0
     * apos-0
     */
    blocosMidia.forEach(
        blocoMidia => {

            const posicao =
                blocoMidia.dados
                    .posicao || "";

            const correspondencia =
                posicao.match(
                    /^(antes|apos)-(\d+)$/
                );

            if (!correspondencia) {

                conteudoNarrativo.push(
                    blocoMidia
                );

                return;
            }

            const modo =
                correspondencia[1];

            const indiceTrecho =
                Number(
                    correspondencia[2]
                );

            const blocoAlvo =
                blocosHistoria[
                    indiceTrecho
                ];

            if (!blocoAlvo) {

                conteudoNarrativo.push(
                    blocoMidia
                );

                return;
            }

            const indiceAlvo =
                conteudoNarrativo.indexOf(
                    blocoAlvo
                );

            if (indiceAlvo === -1) {

                conteudoNarrativo.push(
                    blocoMidia
                );

                return;
            }

            conteudoNarrativo.splice(
                modo === "apos"
                    ? indiceAlvo + 1
                    : indiceAlvo,
                0,
                blocoMidia
            );
        }
    );

    if (cronologia.length) {

        conteudoNarrativo.push(
            criarBloco(
                "cronologia",
                {
                    itens:
                        cronologia
                }
            )
        );
    }

    if (evidencias.length) {

        conteudoNarrativo.push(
            criarBloco(
                "evidencias",
                {
                    itens:
                        evidencias
                }
            )
        );
    }

    if (hipoteses.length) {

        conteudoNarrativo.push(
            criarBloco(
                "hipoteses",
                {
                    itens:
                        hipoteses
                }
            )
        );
    }

    if (situacaoOficial) {

        conteudoNarrativo.push(
            criarBloco(
                "situacao_oficial",
                {
                    texto:
                        situacaoOficial
                }
            )
        );
    }

    if (fontes) {

        conteudoNarrativo.push(
            criarBloco(
                "fontes",
                {
                    texto:
                        fontes
                }
            )
        );
    }

    return conteudoNarrativo
        .map(
            (bloco, indice) => ({
                ...bloco,
                ordem:
                    indice + 1
            })
        );
}

function atualizarPreviewImagemAdmin(
    url,
    seletorPreview
) {

    const preview =
        document.querySelector(
            seletorPreview
        );

    if (!preview) {
        return;
    }

    if (!url) {

        preview.innerHTML = `
            <div class="admin-upload-empty">
                <i class="fa-regular fa-image"></i>
                <span>
                    Nenhuma imagem selecionada
                </span>
            </div>
        `;

        return;
    }

    preview.innerHTML = `
        <img
            src="${escaparHTML(url)}"
            alt="Pré-visualização da imagem"
        >
    `;
}


function definirEstadoUpload(
    botao,
    carregando,
    texto = "Enviando..."
) {

    if (!botao) {
        return;
    }

    if (carregando) {

        botao.dataset.originalHtml =
            botao.innerHTML;

        botao.disabled = true;

        botao.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            ${escaparHTML(texto)}
        `;

        return;
    }

    botao.disabled = false;

    if (botao.dataset.originalHtml) {

        botao.innerHTML =
            botao.dataset.originalHtml;

        delete botao.dataset.originalHtml;
    }
}


async function processarUploadImagemAdmin({
    inputArquivo,
    inputUrl,
    preview,
    pasta,
    botao
}) {

    const arquivo =
        inputArquivo?.files?.[0];

    if (!arquivo) {
        return;
    }

    const tiposPermitidos = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (
        !tiposPermitidos.includes(
            arquivo.type
        )
    ) {

        alert(
            "Escolha uma imagem JPG, PNG ou WEBP."
        );

        inputArquivo.value = "";

        return;
    }

    const limiteImagem =
        10 * 1024 * 1024;

    if (arquivo.size > limiteImagem) {

        alert(
            "A imagem deve ter no máximo 10 MB."
        );

        inputArquivo.value = "";

        return;
    }

    try {

        definirEstadoUpload(
            botao,
            true,
            "Enviando imagem..."
        );

        const resultado =
            await enviarArquivoStorage(
                STORAGE_BUCKET_IMAGENS,
                pasta,
                arquivo
            );

        inputUrl.value =
            resultado.url;

        inputUrl.dataset.storagePath =
            resultado.caminho;

        inputUrl.dataset.storageBucket =
            resultado.bucket;

        atualizarPreviewImagemAdmin(
            resultado.url,
            preview
        );

    } catch (erro) {

        console.error(
            "Falha no upload da imagem.",
            erro
        );

        alert(
            erro?.message ||
            "Não foi possível enviar a imagem."
        );

    } finally {

        definirEstadoUpload(
            botao,
            false
        );

        inputArquivo.value = "";
    }
}


function inicializarUploadImagemCaso(
    dados = null,
    pasta = "casos/capas"
) {

    const inputArquivo =
        document.getElementById(
            "admin-image-file"
        );

    const inputUrl =
        document.getElementById(
            "admin-image"
        );

    const botao =
        document.getElementById(
            "admin-image-upload-button"
        );

    if (
        !inputArquivo ||
        !inputUrl ||
        !botao
    ) {
        return;
    }

    atualizarPreviewImagemAdmin(
        inputUrl.value,
        "#admin-image-preview"
    );

    botao.addEventListener(
        "click",
        () => {

            inputArquivo.click();

        }
    );

    inputArquivo.addEventListener(
        "change",
        async () => {

            await processarUploadImagemAdmin({
                inputArquivo,
                inputUrl,
                preview:
                    "#admin-image-preview",
                pasta,
                botao
            });

        }
    );

    inputUrl.addEventListener(
        "input",
        () => {

            atualizarPreviewImagemAdmin(
                inputUrl.value.trim(),
                "#admin-image-preview"
            );

        }
    );

    if (dados?.imagem) {

        atualizarPreviewImagemAdmin(
            dados.imagem,
            "#admin-image-preview"
        );
    }
}
function inicializarUploadCapaLivro(
    dados = null
) {

    const inputArquivo =
        document.getElementById(
            "admin-book-cover-file"
        );

    const inputUrl =
        document.getElementById(
            "admin-book-cover"
        );

    const botao =
        document.getElementById(
            "admin-book-cover-upload-button"
        );

    if (
        !inputArquivo ||
        !inputUrl ||
        !botao
    ) {
        return;
    }

    atualizarPreviewImagemAdmin(
        inputUrl.value,
        "#admin-book-cover-preview"
    );

    botao.addEventListener(
        "click",
        () => inputArquivo.click()
    );

    inputArquivo.addEventListener(
        "change",
        () =>
            processarUploadImagemAdmin({
                inputArquivo,
                inputUrl,
                preview:
                    "#admin-book-cover-preview",
                pasta: "livros",
                botao
            })
    );
}
let blocoInsercaoSelecionadoAdmin = null;

function criarBlocoConteudoAdmin(tipo = "paragrafo", dados = {}) {
    const bloco = document.createElement("div");

    bloco.className = "admin-content-block";
    bloco.dataset.contentBlock = "";
    bloco.dataset.blockType = tipo;

    let titulo = "Parágrafo";
    let placeholder = "Escreva o conteúdo deste parágrafo...";

    if (tipo === "subtitulo") {
        titulo = "Subtítulo";
        placeholder = "Digite o subtítulo...";
    }

    if (tipo === "imagem") {
        titulo = "Imagem";
        placeholder = "Cole a URL da imagem...";
    }

    if (tipo === "documento") {
        titulo = "Documento";
        placeholder = "Cole a URL do documento...";
    }

    bloco.innerHTML = `
        <div class="admin-content-block-header">
            <strong>${titulo}</strong>

            <div class="admin-content-block-actions">
                <button
                    type="button"
                    data-block-up
                    aria-label="Mover para cima"
                >
                    ↑
                </button>

                <button
                    type="button"
                    data-block-down
                    aria-label="Mover para baixo"
                >
                    ↓
                </button>

                <button
                    type="button"
                    data-block-remove
                    aria-label="Excluir bloco"
                >
                    ×
                </button>
            </div>
        </div>

        <textarea
            data-block-content
            rows="${tipo === "paragrafo" ? "6" : "3"}"
            placeholder="${placeholder}"
        >${escaparHTML(dados.conteudo || "")}</textarea>

        ${
            tipo === "imagem"
                ? `
                    <div class="admin-content-block-options">
                        <label>
                            Alinhamento
                          <select data-block-align>
    <option value="centro" ${dados.alinhamento === "centro" || !dados.alinhamento ? "selected" : ""}>Centro</option>
    <option value="esquerda" ${dados.alinhamento === "esquerda" ? "selected" : ""}>Esquerda</option>
    <option value="direita" ${dados.alinhamento === "direita" ? "selected" : ""}>Direita</option>
    <option value="total" ${dados.alinhamento === "total" ? "selected" : ""}>Largura total</option>
</select>
                        </label>

                        <label>
                            Tamanho
                            <select data-block-size>
    <option value="medio" ${dados.tamanho === "medio" || !dados.tamanho ? "selected" : ""}>Médio</option>
    <option value="pequeno" ${dados.tamanho === "pequeno" ? "selected" : ""}>Pequeno</option>
    <option value="grande" ${dados.tamanho === "grande" ? "selected" : ""}>Grande</option>
</select>
                        </label>
                    </div>
                `
                : ""
        }
    `;


    if (tipo === "imagem") {
        const campos = document.createElement("div");
        const campoUrlImagem = bloco.querySelector("[data-block-content]");
        const uploadArea = document.createElement("div");
        uploadArea.style.cssText = "display:grid;gap:12px;margin:16px 0";
        uploadArea.innerHTML = `
            <input type="file" data-block-image-file accept="image/jpeg,image/png,image/webp" hidden>
            <button type="button" class="admin-upload-button" data-block-image-upload>
                Enviar imagem do computador
            </button>
            <small data-block-image-status role="status" aria-live="polite">
                JPG, PNG ou WEBP, até 10 MB. A URL será preenchida após o envio.
            </small>
        `;
        campoUrlImagem.before(uploadArea);
        const inputImagem = uploadArea.querySelector("[data-block-image-file]");
        const botaoUpload = uploadArea.querySelector("[data-block-image-upload]");
        const statusUpload = uploadArea.querySelector("[data-block-image-status]");
        botaoUpload.addEventListener("click", () => inputImagem.click());
        inputImagem.addEventListener("change", async () => {
            const arquivo = inputImagem.files?.[0];
            if (!arquivo) return;
            if (!["image/jpeg", "image/png", "image/webp"].includes(arquivo.type) || arquivo.size > 10 * 1024 * 1024) {
                statusUpload.textContent = "Escolha uma imagem JPG, PNG ou WEBP de até 10 MB.";
                inputImagem.value = "";
                return;
            }
            const formulario = bloco.closest("form");
            const botaoSalvar = formulario?.querySelector('button[type="submit"]');
            const anteriores = [
    [botaoUpload, botaoUpload.disabled],
    [campoUrlImagem, campoUrlImagem.readOnly]
];
            formulario.dataset.uploadsImagens = String(Number(formulario.dataset.uploadsImagens || 0) + 1);
            if (Number(formulario.dataset.uploadsImagens) === 1 && botaoSalvar) {
                formulario.dataset.salvarAntesUpload = String(botaoSalvar.disabled);
            }
            botaoUpload.disabled = true;
            campoUrlImagem.readOnly = true;
            if (botaoSalvar) botaoSalvar.disabled = true;
            statusUpload.textContent = "Enviando imagem...";
            try {
                const resultado = await enviarArquivoStorage(
                    STORAGE_BUCKET_IMAGENS, "casos/conteudo", arquivo
                );
                campoUrlImagem.value = resultado.url;
                campoUrlImagem.dispatchEvent(new Event("input", { bubbles: true }));
                statusUpload.textContent = "Imagem enviada. Clique em Salvar para confirmar no dossiê.";
            } catch (erro) {
                statusUpload.textContent = erro?.message || "Falha no envio. Tente novamente.";
            } finally {
                botaoUpload.disabled = anteriores[0][1];
                campoUrlImagem.readOnly = anteriores[1][1];
                formulario.dataset.uploadsImagens = String(Math.max(0, Number(formulario.dataset.uploadsImagens || 1) - 1));
                if (botaoSalvar && Number(formulario.dataset.uploadsImagens) === 0) {
                    botaoSalvar.disabled = formulario.dataset.salvarAntesUpload === "true";
                }
                inputImagem.value = "";
            }
        });
        campos.className = "admin-image-metadata";
        campos.style.cssText = "display:grid;gap:16px;margin-top:16px";
        campos.innerHTML = `
            <label>Pesquisar uma frase no histórico
                <input type="search" data-block-position-search placeholder="Digite ou cole a frase que deseja encontrar..." autocomplete="off">
            </label>
            <small data-block-position-results role="status" aria-live="polite"></small>
            <div data-block-phrase-results style="display:grid;gap:12px;max-height:360px;overflow:auto"></div>
            <label>Posição no histórico
                <select data-block-position></select>
            </label>
            <small>Os trechos são separados por linhas em branco na História / Relatório. Revise a posição se alterar esse texto.</small>
            <label>Nome / legenda
                <input type="text" data-block-caption value="${escaparHTML(dados.legenda || "")}">
            </label>
            <label>Observação da imagem
                <textarea rows="3" data-block-note>${escaparHTML(dados.observacao || "")}</textarea>
            </label>
            <label>Fonte / crédito
                <input type="text" data-block-source value="${escaparHTML(dados.fonte || "")}">
            </label>
            <label>Link da fonte
                <input type="url" data-block-source-link value="${escaparHTML(dados.link_fonte || "")}" placeholder="https://...">
            </label>
        `;
        bloco.appendChild(campos);
        const seletor = campos.querySelector("[data-block-position]");
        const buscaPosicao = campos.querySelector("[data-block-position-search]");
        const resultadoBusca = campos.querySelector("[data-block-position-results]");
        const listaBusca = campos.querySelector("[data-block-phrase-results]");
        const atualizar = () => {
            const atual = seletor.value || dados.posicao || "fim";
            const textosEditor = Array.from(document.querySelectorAll("#admin-content-blocks [data-content-block]"))
                .filter(el => ["paragrafo", "subtitulo"].includes(el.dataset.blockType))
                .map(el => ({ tipo: el.dataset.blockType, conteudo: el.querySelector("[data-block-content]")?.value.trim() || "" }))
                .filter(el => el.conteudo);
            const trechos = textosEditor.length
                ? textosEditor.flatMap(el => el.tipo === "subtitulo" ? [el.conteudo] : el.conteudo.split(/\n\s*\n/).map(t => t.trim()).filter(Boolean))
                : String(document.getElementById("admin-history")?.value || "")
                    .split(/\n\s*\n/).map(t => t.trim()).filter(Boolean);
            const consulta = buscaPosicao.value.trim();
            const correspondentes = filtrarTrechosImagemAdmin(trechos, consulta);
            const opcoes = [["fim", "No final do histórico"], ["inicio", "No início do histórico"]];
            const todasOpcoes = new Map(opcoes);
            trechos.forEach((texto, i) => {
                todasOpcoes.set("antes-" + i, "Antes do trecho " + (i + 1));
                todasOpcoes.set("apos-" + i, "Depois do trecho " + (i + 1));
            });
            if (!opcoes.some(([valor]) => valor === atual)) {
                opcoes.push([atual, todasOpcoes.has(atual)
                    ? "Posição atual: " + todasOpcoes.get(atual)
                    : "Posição anterior indisponível: revise antes de salvar"]);
            }
            seletor.replaceChildren(...opcoes.map(([valor, texto]) => {
                const opcao = document.createElement("option");
                opcao.value = valor;
                opcao.textContent = texto;
                return opcao;
            }));
            seletor.value = atual;
            resultadoBusca.textContent = consulta
                ? (correspondentes.length ? correspondentes.length + " resultado(s). Escolha onde inserir a imagem." : "Nenhuma frase encontrada.")
                : "Digite uma frase. O número do trecho aparecerá ao lado de cada resultado.";
            listaBusca.replaceChildren();
            if (consulta) correspondentes.forEach(i => {
                const resultado = document.createElement("div");
                resultado.style.cssText = "padding:14px;border:1px solid #75613f;background:rgba(166,140,85,.06)";
                const linha = document.createElement("div");
                linha.style.cssText = "display:flex;align-items:flex-start;gap:14px";
                const numero = document.createElement("strong");
                numero.textContent = "Trecho " + (i + 1);
                numero.style.cssText = "flex:0 0 auto;color:#bba16d";
                const frase = document.createElement("span");
                frase.textContent = trechos[i];
                frase.style.cssText = "min-width:0;overflow-wrap:anywhere;white-space:pre-line";
                linha.append(numero, frase);
                const acoes = document.createElement("div");
                acoes.style.cssText = "display:flex;flex-wrap:wrap;gap:10px;margin-top:12px";
                [["antes", "Inserir antes"], ["apos", "Inserir depois"]].forEach(([valor, rotulo]) => {
                    const botao = document.createElement("button");
                    botao.type = "button";
                    botao.className = "admin-secondary-button";
                    botao.textContent = rotulo;
                    botao.addEventListener("click", () => {
                        const posicao = valor + "-" + i;
                      blocoInsercaoSelecionadoAdmin = {
    modo: valor,
    indice: i
};
                        if (!Array.from(seletor.options).some(o => o.value === posicao)) {
                            const opcao = document.createElement("option");
                            opcao.value = posicao;
                            opcao.textContent = todasOpcoes.get(posicao);
                            seletor.append(opcao);
                        }
                        seletor.value = posicao;
                        seletor.dispatchEvent(new Event("change", {bubbles:true}));
                        resultadoBusca.textContent = "Imagem posicionada: " + todasOpcoes.get(posicao) + ". Clique em Salvar para confirmar.";
                    });
                    acoes.append(botao);
                });
                resultado.append(linha, acoes);
                listaBusca.append(resultado);
            });
        };
        atualizar();
        seletor.addEventListener("focus", atualizar);
        buscaPosicao.addEventListener("input", atualizar);
    }

    return bloco;
}
function configurarBlocoConteudoAdmin(bloco) {
    if (!bloco) return;

    const botaoSubir =
        bloco.querySelector("[data-block-up]");

    const botaoDescer =
        bloco.querySelector("[data-block-down]");

    const botaoRemover =
        bloco.querySelector("[data-block-remove]");

    botaoSubir?.addEventListener(
        "click",
        () => {
            const anterior =
                bloco.previousElementSibling;

            if (anterior) {
                bloco.parentElement.insertBefore(
                    bloco,
                    anterior
                );
            }
        }
    );

    botaoDescer?.addEventListener(
        "click",
        () => {
            const proximo =
                bloco.nextElementSibling;

            if (proximo) {
                bloco.parentElement.insertBefore(
                    proximo,
                    bloco
                );
            }
        }
    );

    botaoRemover?.addEventListener(
        "click",
        () => {
            bloco.remove();
        }
    );
}
function inicializarEditorConteudoAdminLegado(dados = null) {
    const editor =
        document.getElementById(
            "admin-content-blocks"
        );

    if (!editor) return;

    const botoesAdicionar =
        document.querySelectorAll(
            "[data-add-content-block]"
        );

    const adicionarBloco = (
        tipo,
        dadosBloco = {}
    ) => {
        const bloco =
            criarBlocoConteudoAdmin(
                tipo,
                dadosBloco
            );

    if (
    blocoInsercaoSelecionadoAdmin &&
    editor.children[blocoInsercaoSelecionadoAdmin.indice]
) {

    const alvo =
        editor.children[
            blocoInsercaoSelecionadoAdmin.indice
        ];

    if (
        blocoInsercaoSelecionadoAdmin.modo === "apos"
    ) {

        alvo.after(bloco);

    } else {

        alvo.before(bloco);

    }

    blocoInsercaoSelecionadoAdmin = null;

} else {

    editor.appendChild(bloco);

}
        configurarBlocoConteudoAdmin(
            bloco
        );

        return bloco;
    };

    botoesAdicionar.forEach(botao => {
        botao.addEventListener(
            "click",
            () => {
                adicionarBloco(
                    botao.dataset.addContentBlock
                );
            }
        );
    });

    const blocosExistentes =
        Array.isArray(
            dados?.conteudo_blocos
        )
            ? dados.conteudo_blocos
            : [];

    if (blocosExistentes.length) {
        blocosExistentes
            .slice()
            .sort(
                (a, b) =>
                    (a.ordem ?? 0) -
                    (b.ordem ?? 0)
            )
            .forEach(dadosBloco => {
                adicionarBloco(
                    dadosBloco.tipo ||
                        "paragrafo",
                    dadosBloco
                );
            });

        return;
    }

    const historiaAntiga =
        dados?.historia?.trim() || "";

    if (historiaAntiga) {
        adicionarBloco(
            "paragrafo",
            {
                conteudo:
                    historiaAntiga
            }
        );
    }

    const evidenciasAntigas =
        normalizarEvidencias(
            dados?.evidencias
        );

    if (evidenciasAntigas.length) {
        adicionarBloco(
            "evidencias",
            {
                dados: {
                    itens:
                        evidenciasAntigas.slice(0, 5)
                }
            }
        );
    }

    const hipotesesAntigas =
        normalizarEvidencias(
            dados?.teorias
        );

    if (hipotesesAntigas.length) {
        adicionarBloco(
            "hipoteses",
            {
                dados: {
                    itens: hipotesesAntigas
                }
            }
        );
    }
}


function obterConfiguracaoTipoBlocoAdmin(tipo) {

    const configuracoes = {
        subtitulo: ["Subtítulo", "Digite o subtítulo...", 3],
        paragrafo: ["Parágrafo", "Escreva o conteúdo do parágrafo...", 7],
        imagem: ["Imagem", "Cole a URL da imagem ou faça o upload...", 3],
        documento: ["Documento ou anexo", "Cole a URL do documento ou faça o upload...", 3],
        video: ["Vídeo ou incorporação", "Cole um link válido do YouTube...", 3],
        cronologia: ["Cronologia", "Digite um acontecimento por bloco de texto, separando cada item com uma linha em branco...", 7],
        evidencias: ["Evidências", "Digite uma evidência por bloco de texto, separando cada item com uma linha em branco. Limite de cinco...", 7],
        hipoteses: ["Hipóteses e controvérsias", "Digite uma hipótese ou controvérsia por bloco de texto, separando cada item com uma linha em branco...", 7],
        situacao_oficial: ["Situação oficial", "Descreva a situação oficial atual do caso...", 6],
        fontes: ["Fontes", "Informe as fontes utilizadas, preferencialmente uma por linha...", 7]
    };

    return configuracoes[tipo] ||
        configuracoes.paragrafo;
}


function criarCamposExtrasBlocoAdmin(tipo, dados) {

    if (tipo === "imagem") {
        return `
            <div class="admin-content-block-options">
                <label>
                    Alinhamento
                    <select data-block-align>
                        <option value="centro" ${dados.alinhamento === "centro" ? "selected" : ""}>Centro</option>
                        <option value="esquerda" ${dados.alinhamento === "esquerda" ? "selected" : ""}>Esquerda</option>
                        <option value="direita" ${dados.alinhamento === "direita" ? "selected" : ""}>Direita</option>
                        <option value="total" ${dados.alinhamento === "total" ? "selected" : ""}>Largura total</option>
                    </select>
                </label>

                <label>
                    Tamanho
                    <select data-block-size>
                        <option value="pequeno" ${dados.tamanho === "pequeno" ? "selected" : ""}>Pequeno</option>
                        <option value="medio" ${dados.tamanho === "medio" ? "selected" : ""}>Médio</option>
                        <option value="grande" ${dados.tamanho === "grande" ? "selected" : ""}>Grande</option>
                    </select>
                </label>
            </div>

            <div class="admin-image-metadata">
                <label>
                    Legenda
                    <input type="text" data-block-caption value="${escaparHTML(dados.legenda)}">
                </label>

                <label>
                    Descrição ou observação
                    <textarea rows="3" data-block-note>${escaparHTML(dados.descricao)}</textarea>
                </label>

                <label>
                    Fonte
                    <input type="text" data-block-source value="${escaparHTML(dados.fonte)}">
                </label>

                <label>
                    Crédito
                    <input type="text" data-block-credit value="${escaparHTML(dados.credito)}">
                </label>

                <label>
                    Link da fonte
                    <input type="url" data-block-source-link value="${escaparHTML(dados.link_fonte)}" placeholder="https://...">
                </label>

                <label>
                    Texto alternativo
                    <input type="text" data-block-alt value="${escaparHTML(dados.texto_alternativo)}" placeholder="Descreva objetivamente o conteúdo da imagem">
                </label>

                <label class="admin-sensitive-checkbox">
                    <input type="checkbox" data-block-sensitive ${dados.sensivel ? "checked" : ""}>
                    <span>Esta imagem contém conteúdo sensível</span>
                </label>

                <label data-block-sensitive-category-wrap ${dados.sensivel ? "" : 'style="display:none"'}>
                    Tipo de conteúdo sensível
                    <select data-block-sensitive-category>
                        <option value="">Selecione</option>
                        <option value="cena_crime" ${dados.categoria_sensivel === "cena_crime" ? "selected" : ""}>Cena de crime</option>
                        <option value="autopsia" ${dados.categoria_sensivel === "autopsia" ? "selected" : ""}>Autópsia</option>
                        <option value="cadaver" ${dados.categoria_sensivel === "cadaver" ? "selected" : ""}>Cadáver</option>
                        <option value="ferimento" ${dados.categoria_sensivel === "ferimento" ? "selected" : ""}>Ferimento</option>
                        <option value="conteudo_medico" ${dados.categoria_sensivel === "conteudo_medico" ? "selected" : ""}>Conteúdo médico</option>
                        <option value="outro" ${dados.categoria_sensivel === "outro" ? "selected" : ""}>Outro</option>
                    </select>
                </label>
            </div>
        `;
    }

    if (tipo === "documento") {
        return `
            <div class="admin-document-metadata">
                <label>
                    Título do documento
                    <input type="text" data-block-title value="${escaparHTML(dados.titulo)}">
                </label>

                <label>
                    Descrição
                    <textarea rows="3" data-block-description>${escaparHTML(dados.descricao)}</textarea>
                </label>

                <label>
                    Fonte
                    <input type="text" data-block-source value="${escaparHTML(dados.fonte)}">
                </label>

                <label>
                    Link original
                    <input type="url" data-block-original-link value="${escaparHTML(dados.link_original || dados.link_fonte)}" placeholder="https://...">
                </label>

                <label>
                    Ação oferecida ao leitor
                    <select data-block-action>
                        <option value="abrir" ${dados.acao === "abrir" ? "selected" : ""}>Abrir</option>
                        <option value="baixar" ${dados.acao === "baixar" ? "selected" : ""}>Baixar</option>
                    </select>
                </label>
            </div>
        `;
    }

    if (tipo === "video") {
        return `
            <label>
                Título do vídeo
                <input type="text" data-block-title value="${escaparHTML(dados.titulo)}">
            </label>
            <small>
                Somente links validados serão incorporados. Não cole códigos HTML ou iframe.
            </small>
        `;
    }

    return "";
}


function criarBlocoNarrativoAdmin(tipo = "paragrafo", blocoSalvo = {}) {

    const tiposPermitidos = [
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
    ];

    const tipoSeguro =
        tiposPermitidos.includes(tipo)
            ? tipo
            : "paragrafo";

    const dados =
        normalizarDadosBlocoAdmin(
            blocoSalvo
        );

    const [titulo, placeholder, linhas] =
        obterConfiguracaoTipoBlocoAdmin(
            tipoSeguro
        );

    const textoItens =
        dados.itens.length
            ? dados.itens.join("\n\n")
            : dados.texto;

    const valorPrincipal =
        ["imagem", "documento", "video"]
            .includes(tipoSeguro)
                ? dados.url
                : textoItens;

    const bloco =
        document.createElement("div");

    bloco.className =
        "admin-content-block";

    bloco.dataset.contentBlock = "";
    bloco.dataset.blockType = tipoSeguro;
    bloco.dataset.blockId =

               blocoSalvo.id ||
        criarIdentificadorBlocoAdmin();

if (dados.posicao) {

    bloco.dataset.insertPosition =
        dados.posicao;
}
   
    bloco.innerHTML = `
    
        <div class="admin-content-block-header">
            <strong>${escaparHTML(titulo)}</strong>

            <div class="admin-content-block-actions">
                <button type="button" data-block-up aria-label="Mover para cima">↑</button>
                <button type="button" data-block-down aria-label="Mover para baixo">↓</button>
                <button type="button" data-block-remove aria-label="Excluir bloco">×</button>
            </div>
        </div>

        ${
            tipoSeguro === "imagem" ||
            tipoSeguro === "documento"
                ? `
                    <input
                        type="file"
                        data-block-file
                        ${tipoSeguro === "imagem" ? 'accept="image/jpeg,image/png,image/webp"' : 'accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"'}
                        hidden
                    >
                    <button type="button" class="admin-upload-button" data-block-upload>
                        ${tipoSeguro === "imagem" ? "Enviar imagem" : "Enviar documento"}
                    </button>
                    <small data-block-upload-status role="status" aria-live="polite"></small>
                `
                : ""
        }

        <label>
            ${["imagem", "documento", "video"].includes(tipoSeguro) ? "URL" : "Conteúdo"}
            <textarea
                data-block-content
                rows="${linhas}"
                placeholder="${escaparHTML(placeholder)}"
            >${escaparHTML(valorPrincipal)}</textarea>
        </label>

        ${criarCamposExtrasBlocoAdmin(tipoSeguro, dados)}
    `;

    return bloco;
}


function configurarUploadBlocoNarrativoAdmin(bloco) {

    const tipo =
        bloco.dataset.blockType;

    if (![
        "imagem",
        "documento"
    ].includes(tipo)) {
        return;
    }

    const input =
        bloco.querySelector("[data-block-file]");

    const botao =
        bloco.querySelector("[data-block-upload]");

    const status =
        bloco.querySelector("[data-block-upload-status]");

    const campoUrl =
        bloco.querySelector("[data-block-content]");

    botao?.addEventListener(
        "click",
        () => input?.click()
    );

    input?.addEventListener(
        "change",
        async () => {

            const arquivo = input.files?.[0];

            if (!arquivo) {
                return;
            }

            if (
                tipo === "imagem" &&
                !["image/jpeg", "image/png", "image/webp"]
                    .includes(arquivo.type)
            ) {
                status.textContent =
                    "Escolha uma imagem JPG, PNG ou WEBP.";
                input.value = "";
                return;
            }

            const limite =
                tipo === "imagem"
                    ? 10 * 1024 * 1024
                    : 20 * 1024 * 1024;

            if (arquivo.size > limite) {
                status.textContent =
                    `O arquivo deve ter no máximo ${tipo === "imagem" ? "10" : "20"} MB.`;
                input.value = "";
                return;
            }

            const formulario =
                bloco.closest("form");

            formulario.dataset.uploadsImagens =
                String(
                    Number(
                        formulario.dataset.uploadsImagens || 0
                    ) + 1
                );

            definirEstadoUpload(
                botao,
                true,
                "Enviando..."
            );

            try {

                const resultado =
                    await enviarArquivoStorage(
                        tipo === "imagem"
                            ? STORAGE_BUCKET_IMAGENS
                            : STORAGE_BUCKET_DOCUMENTOS,
                        tipo === "imagem"
                            ? "casos/conteudo"
                            : "casos/documentos",
                        arquivo
                    );

                campoUrl.value =
                    resultado.url;

                status.textContent =
                    "Arquivo enviado. Salve o dossiê para confirmar.";

            } catch (erro) {

                status.textContent =
                    erro?.message ||
                    "Não foi possível enviar o arquivo.";

            } finally {

                definirEstadoUpload(
                    botao,
                    false
                );

                formulario.dataset.uploadsImagens =
                    String(
                        Math.max(
                            0,
                            Number(
                                formulario.dataset.uploadsImagens || 1
                            ) - 1
                        )
                    );

                input.value = "";
            }
        }
    );
}


function configurarBlocoNarrativoAdmin(bloco) {

    configurarBlocoConteudoAdmin(
        bloco
    );

    configurarUploadBlocoNarrativoAdmin(
        bloco
    );
   
   configurarLocalizadorImagemNarrativoAdmin(
    bloco
);
    const checkboxSensivel =
        bloco.querySelector(
            "[data-block-sensitive]"
        );

    const categoriaSensivel =
        bloco.querySelector(
            "[data-block-sensitive-category-wrap]"
        );

    checkboxSensivel?.addEventListener(
        "change",
        () => {
            categoriaSensivel.style.display =
                checkboxSensivel.checked
                    ? ""
                    : "none";
        }
    );
}


function inicializarEditorConteudoAdmin(dados = null) {

    const editor =
        document.getElementById(
            "admin-content-blocks"
        );

    if (!editor) {
        return;
    }

    const adicionarBloco = (
        tipo,
        dadosBloco = {}
    ) => {

        const bloco =
            criarBlocoNarrativoAdmin(
                tipo,
                dadosBloco
            );

        if (
    blocoInsercaoSelecionadoAdmin &&
    editor.children[blocoInsercaoSelecionadoAdmin.indice]
) {

    const alvo =
        editor.children[
            blocoInsercaoSelecionadoAdmin.indice
        ];

    if (
        blocoInsercaoSelecionadoAdmin.modo === "apos"
    ) {

        alvo.after(bloco);

    } else {

        alvo.before(bloco);

    }

    blocoInsercaoSelecionadoAdmin = null;

} else {

    editor.appendChild(bloco);

}

        configurarBlocoNarrativoAdmin(
            bloco
        );
    };

    document
        .querySelectorAll(
            "[data-add-content-block]"
        )
        .forEach(botao => {
            botao.addEventListener(
                "click",
                () =>
                    adicionarBloco(
                        botao.dataset.addContentBlock
                    )
            );
        });

  
const blocosExistentes =
    Array.isArray(
        dados?.conteudo_blocos
    )
        ? dados.conteudo_blocos
        : [];

const tiposPermitidosNoEditor = [
    "imagem",
    "documento",
    "video"
];

blocosExistentes
    .slice()
    .sort(
        (a, b) =>
            Number(a.ordem || 0) -
            Number(b.ordem || 0)
    )
    .filter(bloco =>
        tiposPermitidosNoEditor.includes(
            bloco.tipo
        )
    )
    .forEach(bloco => {
        adicionarBloco(
            bloco.tipo,
            bloco
        );
    });

   }

function inicializarDocumentosCaso(
    dados = null
) {

    const input =
        document.getElementById(
            "admin-document-file"
        );

    const botao =
        document.getElementById(
            "admin-document-upload-button"
        );

    const lista =
        document.getElementById(
            "admin-documents-list"
        );

    if (!input || !botao || !lista) {
        return;
    }

    const documentosExistentes =
        normalizarDocumentos(
            dados?.documentos
        );

    lista.innerHTML =
        documentosExistentes
            .map(
                criarItemDocumentoAdmin
            )
            .join("");

const configurarConteudoSensivel = item => {

    const checkbox =
        item.querySelector(
            ".admin-document-sensitive"
        );

    const categoriaWrap =
        item.querySelector(
            ".admin-sensitive-category-wrap"
        );

    const categoria =
        item.querySelector(
            ".admin-document-sensitive-category"
        );

    if (
        !checkbox ||
        !categoriaWrap
    ) {
        return;
    }

    const atualizarEstado = () => {

        if (checkbox.checked) {

            categoriaWrap.style.display = "";

        } else {

            categoriaWrap.style.display = "none";

            if (categoria) {
                categoria.value = "";
            }

        }

    };

    checkbox.addEventListener(
        "change",
        atualizarEstado
    );

    atualizarEstado();
};


lista
    .querySelectorAll(
        ".admin-document-item"
    )
    .forEach(
        configurarConteudoSensivel
    );

    const configurarRemocao =
        item => {

            item
                .querySelector(
                    ".admin-document-remove"
                )
                ?.addEventListener(
                    "click",
                    async () => {

                        const nome =
                            item.dataset
                                .documentName ||
                            "este documento";

                        if (
                            !confirm(
                                `Remover "${nome}" do dossiê?`
                            )
                        ) {
                            return;
                        }

                        const caminho =
                            item.dataset
                                .documentPath;

                        const bucket =
                            item.dataset
                                .documentBucket ||
                            STORAGE_BUCKET_DOCUMENTOS;

                        try {

                            if (caminho) {

                                await excluirArquivoStorage(
                                    bucket,
                                    caminho
                                );
                            }

                            item.remove();

                        } catch (erro) {

                            console.error(
                                "Falha ao remover documento.",
                                erro
                            );

                            alert(
                                "Não foi possível remover o documento."
                            );
                        }
                    }
                );
        };

    lista
        .querySelectorAll(
            ".admin-document-item"
        )
        .forEach(
            configurarRemocao
        );

    botao.addEventListener(
        "click",
        () => input.click()
    );

    input.addEventListener(
        "change",
        async () => {

            const arquivos =
                Array.from(
                    input.files || []
                );

            if (!arquivos.length) {
                return;
            }

            try {

                definirEstadoUpload(
                    botao,
                    true,
                    arquivos.length > 1
                        ? "Enviando documentos..."
                        : "Enviando documento..."
                );

                for (
                    const arquivo
                    of arquivos
                ) {

                    const resultado =
                        await enviarArquivoStorage(
                            STORAGE_BUCKET_DOCUMENTOS,
                            "casos",
                            arquivo
                        );

                    const documento = {

                        nome:
                            resultado.nome,

                        url:
                            resultado.url,

                        caminho:
                            resultado.caminho,

                        bucket:
                            resultado.bucket,

                        tipo:
                            resultado.tipo,

                        tamanho:
                            resultado.tamanho
                    };

                    lista.insertAdjacentHTML(
                        "beforeend",
                        criarItemDocumentoAdmin(
                            documento
                        )
                    );

configurarConteudoSensivel(
    lista.lastElementChild
);

                    configurarRemocao(
                        lista.lastElementChild
                    );
                }

            } catch (erro) {

                console.error(
                    "Falha no upload de documentos.",
                    erro
                );

                alert(
                    erro?.message ||
                    "Não foi possível enviar um dos documentos."
                );

            } finally {

                definirEstadoUpload(
                    botao,
                    false
                );

                input.value = "";
            }
        }
    );
}


/* ==========================================================================
   BANCO DE CASOS
   ========================================================================== */

async function carregarCasosSupabase() {

    try {

        const supabaseClient =
            await obterClienteSupabase();

        const {
            data,
            error
        } =
            await supabaseClient
                .from("Casos")
                .select("*")
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );

        if (error) {
            throw error;
        }

        casosSupabase =
            Array.isArray(data)
                ? data
                : [];

        carregarCasos();
        carregarForense();

    } catch (erro) {

        console.error(
            "Não foi possível carregar os casos do Supabase.",
            erro
        );
    }
}


/* ==========================================================================
   BANCO DE PERÍCIAS
   ========================================================================== */

async function carregarPericiasSupabase() {

    try {

        const supabaseClient =
            await obterClienteSupabase();

        const {
            data,
            error
        } =
            await supabaseClient
                .from("pericias")
                .select("*")
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );

        if (error) {
            throw error;
        }

        periciasSupabase =
            Array.isArray(data)
                ? data
                : [];

        carregarForense();

    } catch (erro) {

        /*
         * A tabela será criada na próxima etapa do projeto.
         * Até lá, a falha fica isolada e não impede o restante do site.
         */
        console.warn(
            "A área de perícias aguarda a configuração da tabela no Supabase.",
            erro
        );

        periciasSupabase = [];
    }
}


function casoEstaPublicado(
    caso
) {

    /*
     * Registros sem a coluna status_publicacao
     * (legado / antes da migração SQL) são
     * tratados como publicados.
     */

    const status =
        String(
            caso?.status_publicacao ||
            "publicado"
        ).toLowerCase();

    return status === "publicado";
}


function obterTodosCasos() {

    const iniciais =
        obterCasosIniciais();

    const casosSupabasePublicos =
        casosSupabase.filter(
            casoEstaPublicado
        );

    const idsSupabase =
        new Set(
            casosSupabasePublicos.map(
                caso =>
                    String(caso.id)
            )
        );

    const casosIniciaisFiltrados =
        iniciais.filter(
            caso =>
                !idsSupabase.has(
                    String(caso.id)
                )
        );

    return [
        ...casosSupabasePublicos,
        ...casosIniciaisFiltrados
    ];
}


/* ==========================================================================
   RENDERIZAÇÃO DOS CASOS
   ========================================================================== */

function criarCardCaso(caso) {

    return `
        <article
            class="case-card"
            data-case-id="${escaparHTML(caso.id)}"
        >

            <button
                type="button"
                class="content-favorite-button"
                aria-label="Adicionar caso aos favoritos"
                data-favorite-type="case"
                data-favorite-id="${escaparHTML(caso.id)}"
                data-favorite-title="${escaparHTML(caso.titulo || "Dossiê") }"
                data-favorite-subtitle="${escaparHTML(caso.categoria || "Caso") }"
                data-favorite-image="${escaparHTML(caso.imagem || "") }"
                data-favorite-url="${obterURLPublicaDossie(caso)}"
            >
                <i class="fa-regular fa-bookmark"></i>
            </button>

            <a
                href="${obterURLPublicaDossie(caso)}"
                class="case-card-link"
                aria-label="Abrir dossiê: ${escaparHTML(caso.titulo)}"
            >

                <div class="card-image">

                    <img
                        src="${escaparHTML(caso.imagem)}"
                        alt="${escaparHTML(caso.titulo)}"
                        loading="lazy"
                        onerror="this.src='https://placehold.co/800x500/111/777?text=Arquivo+Sombrio';"
                    >

                    <span class="badge status">
                        ${escaparHTML(
                            caso.status ||
                            "EM ARQUIVO"
                        )}
                    </span>

                </div>

                <div class="card-content">

                    <span class="badge category">
                        ${escaparHTML(
                            caso.categoria ||
                            "ARQUIVO"
                        )}
                    </span>

                    <h3>
                        ${escaparHTML(caso.titulo)}
                    </h3>

                    <div class="card-meta">

                        <span>
                            <i class="fa-solid fa-location-dot"></i>
                            ${escaparHTML(
                                caso.local ||
                                "Local desconhecido"
                            )}
                        </span>

                        <span>
                            <i class="fa-solid fa-calendar"></i>
                            ${escaparHTML(
                                caso.ano ||
                                "Data desconhecida"
                            )}
                        </span>

                    </div>

                    <p class="card-summary">
                        ${escaparHTML(
                            caso.resumo ||
                            "Sem resumo disponível."
                        )}
                    </p>

                    <span class="btn-read-more">
                        Abrir dossiê
                        <i class="fa-solid fa-arrow-right"></i>
                    </span>

                </div>

            </a>

        </article>
    `;
}


function carregarCasos() {

    const grid =
        document.getElementById(
            "grid-casos"
        );

    if (!grid) {
        return;
    }

    const casos =
        obterTodosCasos()
            .filter(
                caso =>
                    String(
                        caso.categoria
                    ).toUpperCase() !==
                    "PERÍCIA"
            );

    if (casos.length === 0) {

        grid.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-folder-open"></i>
                <h3>Acervo vazio</h3>
                <p>
                    Nenhum dossiê disponível no momento.
                </p>
            </div>
        `;

        return;
    }

    grid.innerHTML =
        casos
            .map(criarCardCaso)
            .join("");
}


/* ==========================================================================
   PERÍCIA / FILTROS FORENSES
   ========================================================================== */

function normalizarTextoForense(valor) {

    return String(valor || "")
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase()
        .trim();
}
function identificarTipoForense(caso) {

    const texto =
        normalizarTextoForense(
            [
                caso.titulo,
                caso.resumo,
                caso.historia,
                caso.descricao,
                caso.categoria,
                caso.tipoForense,
                caso.tag
            ].join(" ")
        );

    if (
        texto.includes("papiloscopia") ||
        texto.includes(
            "impressao digital"
        ) ||
        texto.includes(
            "impressoes digitais"
        ) ||
        texto.includes("datiloscopia")
    ) {
        return "papiloscopia";
    }

    if (
        texto.includes("dna") ||
        texto.includes("biologico") ||
        texto.includes("biologica") ||
        texto.includes("sangue") ||
        texto.includes("saliva") ||
        texto.includes("genetica")
    ) {
        return "biologica";
    }

    if (
        texto.includes("vestigio") ||
        texto.includes("quimica") ||
        texto.includes("luminol") ||
        texto.includes("toxicologia") ||
        texto.includes("substancia") ||
        texto.includes("reagente")
    ) {
        return "vestigios";
    }

    return "geral";
}


const estadoFiltroForense = { busca: "", tipo: "todos", ordem: "recentes" };

function obterPericiasParaGrade() {
    const novas = (Array.isArray(periciasSupabase) ? periciasSupabase : []).map(item => ({ ...item, origem_forense: "nova" }));
    const legadas = obterTodosCasos().filter(item => String(item.categoria).toUpperCase() === "PERÍCIA").map(item => ({ ...item, origem_forense: "legada" }));
    const titulosNovos = new Set(novas.map(item => normalizarTextoForense(item.titulo)));
    return novas.concat(legadas.filter(item => !titulosNovos.has(normalizarTextoForense(item.titulo))));
}

function criarCardPericia(pericia) {
    const url = "pericia.html?id=" + encodeURIComponent(pericia.id) + "#forense";
    return '<article class="case-card" data-forensic-id="' + escaparHTML(pericia.id) + '">' +
        '<button type="button" class="content-favorite-button" aria-label="Adicionar perícia aos favoritos" data-favorite-type="forensic" data-favorite-id="' + escaparHTML(pericia.id) + '" data-favorite-title="' + escaparHTML(pericia.titulo || "Perícia") + '" data-favorite-subtitle="' + escaparHTML(pericia.categoria || "Ciência Forense") + '" data-favorite-image="' + escaparHTML(pericia.imagem || "") + '" data-favorite-url="' + escaparHTML(url) + '"><i class="fa-regular fa-bookmark"></i></button>' +
        '<a href="' + escaparHTML(url) + '" class="case-card-link" aria-label="Abrir perícia: ' + escaparHTML(pericia.titulo || "") + '">' +
        '<div class="card-image"><img src="' + escaparHTML(pericia.imagem || "") + '" alt="' + escaparHTML(pericia.legenda_imagem || pericia.titulo || "") + '" loading="lazy" onerror="this.src=\'https://placehold.co/800x500/111/777?text=Ciencia+Forense\';"><span class="badge status">TÉCNICO / METODOLÓGICO</span></div>' +
        '<div class="card-content"><span class="badge category">' + escaparHTML(pericia.categoria || "PERÍCIA") + '</span><h3>' + escaparHTML(pericia.titulo || "Matéria forense") + '</h3>' +
        '<div class="card-meta"><span><i class="fa-solid fa-flask-vial"></i> Ciência Forense</span><span><i class="fa-solid fa-file-lines"></i> Artigo técnico</span></div>' +
        '<p class="card-summary">' + escaparHTML(pericia.resumo || "Sem resumo disponível.") + '</p><span class="btn-read-more">Abrir perícia <i class="fa-solid fa-arrow-right"></i></span></div></a></article>';
}

function paragrafosPericia(valor) {
    return String(valor || "").split(/\n\s*\n/).map(p => p.trim()).filter(Boolean).map(p => "<p>" + escaparHTML(p).replace(/\n/g, "<br>") + "</p>").join("");
}

function renderizarDetalhePericia(grid, pericia) {
    const secoes = [
        ["Introdução", pericia.introducao], ["Como funciona", pericia.como_funciona],
        ["História da técnica", pericia.historia_tecnica], ["Aplicação em casos reais", pericia.aplicacao_casos_reais],
        ["Limitações e controvérsias", pericia.limitacoes_controversias], ["Curiosidades", pericia.curiosidades],
        ["Casos relacionados", pericia.casos_relacionados], ["Fontes", pericia.fontes]
    ].filter(item => String(item[1] || "").trim());
    const imagem = pericia.imagem ? '<figure class="forensic-detail-image"><img src="' + escaparHTML(pericia.imagem) + '" alt="' + escaparHTML(pericia.legenda_imagem || pericia.titulo || "") + '">' + (pericia.legenda_imagem ? "<figcaption>" + escaparHTML(pericia.legenda_imagem) + (pericia.fonte_imagem ? " · " + escaparHTML(pericia.fonte_imagem) : "") + "</figcaption>" : "") + "</figure>" : "";
    grid.innerHTML = '<article class="forensic-detail"><a class="forensic-back" href="pericia.html#forense"><i class="fa-solid fa-arrow-left"></i> Voltar para todas as perícias</a><header><span class="badge category">' + escaparHTML(pericia.categoria || "CIÊNCIA FORENSE") + '</span><h1>' + escaparHTML(pericia.titulo || "Matéria forense") + '</h1><p>' + escaparHTML(pericia.resumo || "") + '</p></header>' + imagem + '<div class="forensic-detail-content">' + secoes.map(item => "<section><h2>" + escaparHTML(item[0]) + "</h2>" + paragrafosPericia(item[1]) + "</section>").join("") + "</div></article>";
    window.ArquivoSEO?.aplicar({
        id: pericia.id,
        titulo: pericia.titulo,
        descricao: pericia.resumo,
        imagem: pericia.imagem || pericia.imagem_capa,
        caminho: "pericia.html",
        secao: "Ciência Forense",
        publicadoEm: pericia.publicado_em,
        modificadoEm: pericia.updated_at,
        createdAt: pericia.created_at
    });
}

function atualizarCategoriasForenses() {
    const select = document.getElementById("forensic-type");
    if (!select) return;
    const atual = select.value || estadoFiltroForense.tipo;
    const categorias = [...new Set(obterPericiasParaGrade().map(item => String(item.categoria || "Geral").trim()).filter(Boolean))].sort((a,b) => a.localeCompare(b, "pt-BR"));
    select.innerHTML = '<option value="todos">Todos os assuntos</option>' + categorias.map(cat => '<option value="' + escaparHTML(normalizarTextoForense(cat)) + '">' + escaparHTML(cat) + "</option>").join("");
    if ([...select.options].some(opcao => opcao.value === atual)) select.value = atual;
}

function carregarForense() {
    const grid = document.getElementById("grid-forense");
    if (!grid) return;
    const id = new URLSearchParams(location.search).get("id");
    if (id) {
        const selecionada = (Array.isArray(periciasSupabase) ? periciasSupabase : []).find(item => String(item.id) === String(id));
        if (selecionada) { renderizarDetalhePericia(grid, selecionada); document.querySelector(".forensic-tools")?.setAttribute("hidden", ""); document.getElementById("forensic-results-status")?.setAttribute("hidden", ""); return; }
    }
    document.querySelector(".forensic-tools")?.removeAttribute("hidden");
    document.getElementById("forensic-results-status")?.removeAttribute("hidden");
    atualizarCategoriasForenses();
    let itens = obterPericiasParaGrade();
    const busca = normalizarTextoForense(estadoFiltroForense.busca);
    if (busca) itens = itens.filter(item => normalizarTextoForense([item.titulo,item.categoria,item.resumo,item.introducao,item.como_funciona].join(" ")).includes(busca));
    if (estadoFiltroForense.tipo !== "todos") itens = itens.filter(item => normalizarTextoForense(item.categoria || "Geral") === estadoFiltroForense.tipo);
    itens.sort((a,b) => {
        if (estadoFiltroForense.ordem === "az") return String(a.titulo||"").localeCompare(String(b.titulo||""),"pt-BR");
        if (estadoFiltroForense.ordem === "za") return String(b.titulo||"").localeCompare(String(a.titulo||""),"pt-BR");
        const da = new Date(a.created_at || a.criadoEm || 0).getTime() || 0, db = new Date(b.created_at || b.criadoEm || 0).getTime() || 0;
        return estadoFiltroForense.ordem === "antigos" ? da-db : db-da;
    });
    const status = document.getElementById("forensic-results-status");
    if (status) status.textContent = itens.length === 1 ? "1 matéria encontrada" : itens.length + " matérias encontradas";
    grid.innerHTML = itens.length ? itens.map(item => item.origem_forense === "nova" ? criarCardPericia(item) : criarCardCaso(item)).join("") : '<div class="empty-state"><i class="fa-solid fa-magnifying-glass"></i><h3>Nenhuma perícia encontrada</h3><p>Tente outro nome ou selecione todos os assuntos.</p></div>';
}

function inicializarFiltrosForenses() {
    const busca = document.getElementById("forensic-search"), tipo = document.getElementById("forensic-type"), ordem = document.getElementById("forensic-order"), limpar = document.getElementById("forensic-clear");
    busca?.addEventListener("input", () => { estadoFiltroForense.busca = busca.value; carregarForense(); });
    tipo?.addEventListener("change", () => { estadoFiltroForense.tipo = tipo.value; carregarForense(); });
    ordem?.addEventListener("change", () => { estadoFiltroForense.ordem = ordem.value; carregarForense(); });
    limpar?.addEventListener("click", () => { estadoFiltroForense.busca=""; estadoFiltroForense.tipo="todos"; estadoFiltroForense.ordem="recentes"; if(busca)busca.value=""; if(tipo)tipo.value="todos"; if(ordem)ordem.value="recentes"; carregarForense(); });
}

/* ==========================================================================
   LIVROS
   ========================================================================== */

function normalizarLinksAfiliados(links) {

    if (!Array.isArray(links)) {
        return [];
    }

    return links
        .map(link => ({
            loja:
                String(
                    link?.loja || ""
                ).trim(),

            formato:
                String(
                    link?.formato || ""
                ).trim(),

            url:
                String(
                    link?.url || ""
                ).trim(),

            destaque:
                String(
                    link?.destaque || ""
                ).trim()
        }))
        .filter(
            link =>
                link.loja ||
                link.formato ||
                link.url ||
                link.destaque
        );
}


function normalizarURLComercial(url) {

    const valor =
        String(url || "").trim();

    if (!valor) {
        return "";
    }

    try {

        const urlValida =
            new URL(valor);

        if (
            urlValida.protocol !==
                "https:" &&
            urlValida.protocol !==
                "http:"
        ) {
            return "";
        }

        return urlValida.href;

    } catch (erro) {

        return "";
    }
}


function renderizarLinksAfiliadosLivro(
    livro
) {

    const links =
        normalizarLinksAfiliados(
            livro.linksAfiliados
        )
            .map(link => ({
                ...link,
                url:
                    normalizarURLComercial(
                        link.url
                    )
            }))
            .filter(
                link => link.url
            );

    if (!links.length) {
        return "";
    }

    return `
        <div class="book-commerce">

            <div class="book-commerce-heading">

                <span>
                    ONDE ENCONTRAR
                </span>

                <p>
                    Edições e ofertas em lojas parceiras.
                </p>

            </div>

            <div class="book-commerce-links">

                ${
                    links
                        .map(
                            link => `

                                <a
                                    class="book-commerce-link"
                                    href="${escaparHTML(link.url)}"
                                    target="_blank"
                                    rel="sponsored nofollow noopener noreferrer"
                                >

                                    <span class="book-commerce-store">
                                        ${escaparHTML(
                                            link.loja ||
                                            "Loja parceira"
                                        )}
                                    </span>

                                    ${
                                        link.formato
                                            ? `
                                                <small>
                                                    ${escaparHTML(
                                                        link.formato
                                                    )}
                                                </small>
                                            `
                                            : ""
                                    }

                                    <strong>
                                        ${escaparHTML(
                                            link.destaque ||
                                            "Consultar oferta"
                                        )}
                                    </strong>

                                    <i class="fa-solid fa-arrow-up-right-from-square"></i>

                                </a>

                            `
                        )
                        .join("")
                }

            </div>

            <p class="book-affiliate-disclosure">
                Alguns links são de afiliados. O Arquivo Sombrio
                pode receber comissão sem custo adicional para você.
            </p>

        </div>
    `;
}


function criarLinhaAfiliado(link = {}) {

    const loja =
        escaparHTML(link.loja || "");

    const formato =
        escaparHTML(link.formato || "");

    const url =
        escaparHTML(link.url || "");

    const destaque =
        escaparHTML(link.destaque || "");

    return `
        <div class="admin-affiliate-row">

            <label>
                Loja
                <input
                    type="text"
                    class="admin-affiliate-store"
                    value="${loja}"
                    placeholder="Ex.: Shopee"
                >
            </label>

            <label>
                Formato
                <input
                    type="text"
                    class="admin-affiliate-format"
                    value="${formato}"
                    placeholder="Físico, Digital, Audiobook..."
                >
            </label>

            <label class="admin-affiliate-url-field">
                Link
                <input
                    type="url"
                    class="admin-affiliate-url"
                    value="${url}"
                    placeholder="https://..."
                >
            </label>

            <label>
                Texto da oferta
                <input
                    type="text"
                    class="admin-affiliate-highlight"
                    value="${destaque}"
                    placeholder="Consultar oferta"
                >
            </label>

            <button
                type="button"
                class="admin-remove-affiliate-link"
                aria-label="Remover link comercial"
                title="Remover link"
            >
                <i class="fa-solid fa-trash"></i>
            </button>

        </div>
    `;
}


function adicionarLinhaAfiliado(
    container,
    link = {}
) {

    if (!container) {
        return;
    }

    container.insertAdjacentHTML(
        "beforeend",
        criarLinhaAfiliado(link)
    );

    const linha =
        container.lastElementChild;

    linha
        ?.querySelector(
            ".admin-remove-affiliate-link"
        )
        ?.addEventListener(
            "click",
            () => linha.remove()
        );
}


function coletarLinksAfiliadosAdmin() {

    return Array
        .from(
            document.querySelectorAll(
                "#admin-affiliate-links .admin-affiliate-row"
            )
        )
        .map(linha => {

            const loja =
                linha
                    .querySelector(
                        ".admin-affiliate-store"
                    )
                    ?.value
                    .trim() || "";

            const formato =
                linha
                    .querySelector(
                        ".admin-affiliate-format"
                    )
                    ?.value
                    .trim() || "";

            const url =
                linha
                    .querySelector(
                        ".admin-affiliate-url"
                    )
                    ?.value
                    .trim() || "";

            const destaque =
                linha
                    .querySelector(
                        ".admin-affiliate-highlight"
                    )
                    ?.value
                    .trim() || "";

            return {
                loja,
                formato,
                url,
                destaque
            };
        })
        .filter(link =>
            link.loja ||
            link.formato ||
            link.url ||
            link.destaque
        );
}

async function carregarLivrosSupabase() {

    try {

        const supabaseClient =
            await obterClienteSupabase();

        const {
            data,
            error
        } =
            await supabaseClient
                .from("livros")
                .select("*")
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );

        if (error) {
            throw error;
        }

        livrosSupabase =
            Array.isArray(data)
                ? data.map(
                    livro => ({
                        ...livro,

                        linksAfiliados:
                            Array.isArray(
                                livro.links_afiliados
                            )
                                ? livro.links_afiliados
                                : []
                    })
                )
                : [];

        carregarLivros();

    } catch (erro) {

        console.error(
            "Não foi possível carregar os livros do Supabase:",
            erro
        );

        livrosSupabase = [];

        carregarLivros();
    }
}


function obterTodosLivros() {

    const idsSupabase =
        new Set(
            livrosSupabase.map(
                livro =>
                    String(
                        livro.id
                    )
            )
        );

    const iniciaisFiltrados =
        livrosIniciais.filter(
            livro =>
                !idsSupabase.has(
                    String(
                        livro.id
                    )
                )
        );

    return [
        ...livrosSupabase,
        ...iniciaisFiltrados
    ];
}

function normalizarTextoLivro(valor) {

    return String(valor || "")
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase()
        .trim();
}
function obterDataLivro(livro) {

    const valor =
        livro.criadoEm ||
        livro.created_at ||
        livro.dataCadastro ||
        "";

    const timestamp =
        Date.parse(valor);

    if (!Number.isNaN(timestamp)) {
        return timestamp;
    }

    const idNumerico =
        Number(livro.id);

    if (
        Number.isFinite(idNumerico) &&
        idNumerico > 1000000000000
    ) {
        return idNumerico;
    }

    return 0;
}


function livroEhRecomendado(livro) {

    if (
        typeof livro.recomendado ===
        "boolean"
    ) {
        return livro.recomendado;
    }

    const texto =
        normalizarTextoLivro(
            `${livro.tag || ""} ${livro.destaque || ""}`
        );

    return texto.includes(
        "recomendado"
    );
}


function livroTemLinkCompra(livro) {

    return normalizarLinksAfiliados(
        livro.linksAfiliados
    ).some(
        link =>
            Boolean(
                normalizarURLComercial(
                    link.url
                )
            )
    );
}


function carregarLivros() {

    const grid =
        document.getElementById(
            "grid-livros"
        );

    if (!grid) {
        return;
    }

    const livros =
        obterTodosLivros();

    if (livros.length === 0) {

        grid.innerHTML = `
            <div class="empty-state">

                <i class="fa-solid fa-book"></i>

                <h3>
                    Nenhuma recomendação
                </h3>

                <p>
                    O arquivo ainda não possui livros cadastrados.
                </p>

            </div>
        `;

        return;
    }


    function identificarCategoria(livro) {

        const categoriaOriginal =
            livro.categoriaLivro ||
            livro.categoria ||
            livro.tag ||
            "";

        const categoria =
            normalizarTextoLivro(
                categoriaOriginal
            );

        if (
            categoria.includes("crime real") ||
            categoria.includes("true crime")
        ) {
            return {
                id: "crimes-reais",
                nome: "Crimes Reais"
            };
        }

        if (
            categoria.includes("terror") ||
            categoria.includes("horror")
        ) {
            return {
                id: "terror",
                nome: "Terror"
            };
        }

        if (
            categoria.includes("mister")
        ) {
            return {
                id: "misterios",
                nome: "Mistérios"
            };
        }

        if (
            categoria.includes("serial")
        ) {
            return {
                id: "serial-killers",
                nome: "Serial Killers"
            };
        }

        if (
            categoria.includes("forense") ||
            categoria.includes("pericia")
        ) {
            return {
                id: "forense",
                nome: "Ciência Forense"
            };
        }

        if (
            categoria.includes("psicologia") ||
            categoria.includes("criminologia")
        ) {
            return {
                id: "psicologia-criminal",
                nome: "Psicologia Criminal"
            };
        }

        if (
            categoria.includes("sem solucao") ||
            categoria.includes("nao solucionado")
        ) {
            return {
                id: "casos-sem-solucao",
                nome: "Casos sem Solução"
            };
        }

        if (
            categoria.includes("lenda") ||
            categoria.includes("folclore")
        ) {
            return {
                id: "lendas",
                nome: "Lendas & Folclore"
            };
        }

        if (
            categoria.includes("arquivo") ||
            categoria.includes("segredo")
        ) {
            return {
                id: "arquivos-secretos",
                nome: "Arquivos Secretos"
            };
        }

        return {
            id: "outros",
            nome:
                categoriaOriginal ||
                "Outros"
        };
    }


    const categorias =
        new Map();

    livros.forEach(
        livro => {

            const categoria =
                identificarCategoria(
                    livro
                );

            if (!categorias.has(categoria.id)) {

                categorias.set(
                    categoria.id,
                    {
                        id: categoria.id,
                        nome: categoria.nome,
                        livros: []
                    }
                );
            }

            categorias
                .get(categoria.id)
                .livros
                .push(livro);
        }
    );


    function renderizarEstantes() {

        grid.innerHTML = `
            <div class="bookshelf-library">

                <div class="bookshelf-intro">

                    <span>
                        ESCOLHA UMA ESTANTE
                    </span>

                    <p>
                        Cada volume foi arquivado de acordo com o tema da investigação.
                    </p>

                </div>

                <div class="bookshelf">

                    ${
                        Array
                            .from(
                                categorias.values()
                            )
                            .map(
                                categoria => `
                                    <button
                                        type="button"
                                        class="bookshelf-spine"
                                        data-categoria="${escaparHTML(categoria.id)}"
                                    >

                                        <span class="bookshelf-spine-title">
                                            ${escaparHTML(categoria.nome)}
                                        </span>

                                        <small>
                                            ${categoria.livros.length}
                                        </small>

                                    </button>
                                `
                            )
                            .join("")
                    }

                </div>

                <div class="bookshelf-base"></div>

            </div>
        `;

        grid
            .querySelectorAll(
                ".bookshelf-spine"
            )
            .forEach(lombada => {

                lombada.addEventListener(
                    "click",
                    () => {

                        const categoria =
                            categorias.get(
                                lombada.dataset.categoria
                            );

                        if (categoria) {
                            renderizarCategoria(
                                categoria
                            );
                        }
                    }
                );
            });
    }


    function criarOpcoesUnicas(
        lista,
        campo
    ) {

        return Array.from(
            new Set(
                lista
                    .map(item =>
                        String(
                            item?.[campo] || ""
                        ).trim()
                    )
                    .filter(Boolean)
            )
        ).sort(
            (a, b) =>
                a.localeCompare(
                    b,
                    "pt-BR",
                    { sensitivity: "base" }
                )
        );
    }


    function criarCardLivro(
        livro,
        categoria
    ) {

        const metadados = [];

        if (livro.ano) {
            metadados.push(
                `<span><i class="fa-regular fa-calendar"></i>${escaparHTML(livro.ano)}</span>`
            );
        }

        if (livro.editora) {
            metadados.push(
                `<span><i class="fa-solid fa-building-columns"></i>${escaparHTML(livro.editora)}</span>`
            );
        }

        return `
            <article class="book-card" data-book-id="${escaparHTML(livro.id || livro.titulo || "livro")}">

                <button
                    type="button"
                    class="content-favorite-button"
                    aria-label="Adicionar livro aos favoritos"
                    data-favorite-type="book"
                    data-favorite-id="${escaparHTML(livro.id || livro.titulo || "livro") }"
                    data-favorite-title="${escaparHTML(livro.titulo || "Livro") }"
                    data-favorite-subtitle="${escaparHTML(livro.autor || "Autor não informado") }"
                    data-favorite-image="${escaparHTML(livro.capa || "") }"
                    data-favorite-url="index.html#livros"
                >
                    <i class="fa-regular fa-bookmark"></i>
                </button>

                <div class="book-image">

                    <img
                        src="${escaparHTML(
                            livro.capa || ""
                        )}"
                        alt="${escaparHTML(
                            livro.titulo || "Livro"
                        )}"
                        loading="lazy"
                        decoding="async"
                        referrerpolicy="no-referrer"
                        onerror="if(!this.dataset.capaDireta){this.dataset.capaDireta='1';try{const original=new URL(this.src).searchParams.get('url');if(original){this.src=original;return;}}catch(erro){} }this.onerror=null;this.src='icon-512.png';this.alt='Capa temporariamente indisponível';"
                    >

                    ${
                        livroEhRecomendado(livro)
                            ? `
                                <span class="book-label">
                                    RECOMENDADO
                                </span>
                            `
                            : ""
                    }

                </div>

                <div class="book-content">

                    <span class="book-category">
                        ${escaparHTML(
                            livro.tag ||
                            categoria.nome
                        )}
                    </span>

                    <h3>
                        ${escaparHTML(
                            livro.titulo ||
                            "Sem título"
                        )}
                    </h3>

                    <p class="book-author">
                        ${escaparHTML(
                            livro.autor ||
                            "Autor não informado"
                        )}
                    </p>

                    ${
                        metadados.length
                            ? `
                                <div class="book-meta">
                                    ${metadados.join("")}
                                </div>
                            `
                            : ""
                    }

                    <p class="book-description">
                        ${escaparHTML(
                            livro.descricao || ""
                        )}
                    </p>

                    ${renderizarLinksAfiliadosLivro(
                        livro
                    )}

                </div>

            </article>
        `;
    }


    function renderizarCategoria(
        categoria
    ) {

        const autores =
            criarOpcoesUnicas(
                categoria.livros,
                "autor"
            );

        const editoras =
            criarOpcoesUnicas(
                categoria.livros,
                "editora"
            );

        const anos =
            Array.from(
                new Set(
                    categoria.livros
                        .map(livro =>
                            Number(livro.ano)
                        )
                        .filter(ano =>
                            Number.isFinite(ano) &&
                            ano > 0
                        )
                )
            )
                .sort((a, b) => b - a);

        grid.innerHTML = `
            <div class="books-category-view">

                <div class="books-category-header">

                    <button
                        type="button"
                        class="books-back-button"
                        id="voltar-estantes"
                    >
                        <i class="fa-solid fa-arrow-left"></i>
                        VOLTAR ÀS ESTANTES
                    </button>

                    <div>

                        <span>
                            ESTANTE SELECIONADA
                        </span>

                        <h3>
                            ${escaparHTML(
                                categoria.nome
                            )}
                        </h3>

                        <p>
                            ${categoria.livros.length}
                            ${
                                categoria.livros.length === 1
                                    ? "livro arquivado"
                                    : "livros arquivados"
                            }
                        </p>

                    </div>

                </div>


                <div class="books-filter-panel">

                    <div class="books-filter-search">

                        <i class="fa-solid fa-magnifying-glass"></i>

                        <input
                            type="search"
                            id="books-search"
                            placeholder="Pesquisar título, autor ou editora..."
                            autocomplete="off"
                        >

                        <button
                            type="button"

                        </button>

                    </div>

                    <div class="books-filter-chips">

                        <button
                            type="button"
                            class="books-filter-chip active"
                            data-book-highlight="todos"
                        >
                            Todos
                        </button>

                        <button
                            type="button"
                            class="books-filter-chip"
                            data-book-highlight="recomendados"
                        >
                            Recomendados
                        </button>

                        <button
                            type="button"
                            class="books-filter-chip"
                            data-book-highlight="comprar"
                        >
                            Com link de compra
                        </button>

                    </div>

                    <div class="books-filter-grid">

                        <label>
                            ORDENAR POR
                            <select id="books-sort">
                                <option value="recentes">
                                    Adicionados recentemente
                                </option>

                                <option value="antigos-adicionados">
                                    Adicionados há mais tempo
                                </option>

                                <option value="titulo-az">
                                    Título: A–Z
                                </option>

                                <option value="titulo-za">
                                    Título: Z–A
                                </option>

                                <option value="autor-az">
                                    Autor: A–Z
                                </option>

                                <option value="autor-za">
                                    Autor: Z–A
                                </option>

                                <option value="ano-recente">
                                    Ano: mais recente
                                </option>

                                <option value="ano-antigo">
                                    Ano: mais antigo
                                </option>
                            </select>
                        </label>


                        <label>
                            AUTOR

                            <select id="books-author-filter">

                                <option value="">
                                    Todos os autores
                                </option>

                                ${
                                    autores
                                        .map(autor => `
                                            <option value="${escaparHTML(autor)}">
                                                ${escaparHTML(autor)}
                                            </option>
                                        `)
                                        .join("")
                                }

                            </select>
                        </label>


                        <label>
                            ANO

                            <select id="books-year-filter">

                                <option value="">
                                    Todos os anos
                                </option>

                                ${
                                    anos
                                        .map(ano => `
                                            <option value="${ano}">
                                                ${ano}
                                            </option>
                                        `)
                                        .join("")
                                }

                            </select>
                        </label>


                        <label>
                            EDITORA

                            <select id="books-publisher-filter">

                                <option value="">
                                    Todas as editoras
                                </option>

                                ${
                                    editoras
                                        .map(editora => `
                                            <option value="${escaparHTML(editora)}">
                                                ${escaparHTML(editora)}
                                            </option>
                                        `)
                                        .join("")
                                }

                            </select>
                        </label>

                    </div>


                    <div class="books-results-bar">

                        <p id="books-results-count">
                            Exibindo ${categoria.livros.length} de ${categoria.livros.length}
                        </p>

                        <button
                            type="button"
                            class="books-reset-filters"
                            id="books-reset-filters"
                        >
                            <i class="fa-solid fa-rotate-left"></i>
                            Limpar filtros
                        </button>

                    </div>

                </div>


                <div
                    class="books-category-grid"
                    id="books-category-results"
                ></div>

            </div>
        `;


        const campoBusca =
            document.getElementById(
                "books-search"
            );

        const ordenar =
            document.getElementById(
                "books-sort"
            );

        const filtroAutor =
            document.getElementById(
                "books-author-filter"
            );

        const filtroAno =
            document.getElementById(
                "books-year-filter"
            );

        const filtroEditora =
            document.getElementById(
                "books-publisher-filter"
            );

        const resultados =
            document.getElementById(
                "books-category-results"
            );

        const contador =
            document.getElementById(
                "books-results-count"
            );

        const chips =
            Array.from(
                document.querySelectorAll(
                    "[data-book-highlight]"
                )
            );

        let destaqueAtivo =
            "todos";


        function aplicarFiltrosLivros() {

            const busca =
                normalizarTextoLivro(
                    campoBusca?.value
                );

            const autor =
                filtroAutor?.value || "";

            const ano =
                filtroAno?.value || "";

            const editora =
                filtroEditora?.value || "";

            const ordem =
                ordenar?.value ||
                "recentes";

            let filtrados =
                categoria.livros.filter(
                    livro => {

                        const textoBusca =
                            normalizarTextoLivro(
                                [
                                    livro.titulo,
                                    livro.autor,
                                    livro.editora,
                                    livro.ano,
                                    livro.tag
                                ].join(" ")
                            );

                        if (
                            busca &&
                            !textoBusca.includes(
                                busca
                            )
                        ) {
                            return false;
                        }

                        if (
                            autor &&
                            String(
                                livro.autor || ""
                            ) !== autor
                        ) {
                            return false;
                        }

                        if (
                            ano &&
                            String(
                                livro.ano || ""
                            ) !== ano
                        ) {
                            return false;
                        }

                        if (
                            editora &&
                            String(
                                livro.editora || ""
                            ) !== editora
                        ) {
                            return false;
                        }

                        if (
                            destaqueAtivo ===
                                "recomendados" &&
                            !livroEhRecomendado(
                                livro
                            )
                        ) {
                            return false;
                        }

                        if (
                            destaqueAtivo ===
                                "comprar" &&
                            !livroTemLinkCompra(
                                livro
                            )
                        ) {
                            return false;
                        }

                        return true;
                    }
                );


            filtrados =
                [...filtrados];


            const compararTexto =
                (a, b, campo) =>
                    String(
                        a?.[campo] || ""
                    )
                        .localeCompare(
                            String(
                                b?.[campo] || ""
                            ),
                            "pt-BR",
                            {
                                sensitivity:
                                    "base"
                            }
                        );


            switch (ordem) {

                case "antigos-adicionados":

                    filtrados.sort(
                        (a, b) =>
                            obterDataLivro(a) -
                            obterDataLivro(b)
                    );

                    break;


                case "titulo-az":

                    filtrados.sort(
                        (a, b) =>
                            compararTexto(
                                a,
                                b,
                                "titulo"
                            )
                    );

                    break;


                case "titulo-za":

                    filtrados.sort(
                        (a, b) =>
                            compararTexto(
                                b,
                                a,
                                "titulo"
                            )
                    );

                    break;


                case "autor-az":

                    filtrados.sort(
                        (a, b) =>
                            compararTexto(
                                a,
                                b,
                                "autor"
                            )
                    );

                    break;


                case "autor-za":

                    filtrados.sort(
                        (a, b) =>
                            compararTexto(
                                b,
                                a,
                                "autor"
                            )
                    );

                    break;


                case "ano-recente":

                    filtrados.sort(
                        (a, b) =>
                            Number(
                                b.ano || 0
                            ) -
                            Number(
                                a.ano || 0
                            )
                    );

                    break;


                case "ano-antigo":

                    filtrados.sort(
                        (a, b) => {

                            const anoA =
                                Number(
                                    a.ano || 0
                                ) ||
                                Number.MAX_SAFE_INTEGER;

                            const anoB =
                                Number(
                                    b.ano || 0
                                ) ||
                                Number.MAX_SAFE_INTEGER;

                            return anoA - anoB;
                        }
                    );

                    break;


                case "recentes":
                default:

                    filtrados.sort(
                        (a, b) =>
                            obterDataLivro(b) -
                            obterDataLivro(a)
                    );

                    break;
            }


            if (!filtrados.length) {

                resultados.innerHTML = `
                    <div class="empty-state">

                        <i class="fa-solid fa-book-open"></i>

                        <h3>
                            Nenhum livro encontrado
                        </h3>

                        <p>
                            Nenhum volume desta estante corresponde aos filtros selecionados.
                        </p>

                    </div>
                `;

            } else {

                resultados.innerHTML =
                    filtrados
                        .map(
                            livro =>
                                criarCardLivro(
                                    livro,
                                    categoria
                                )
                        )
                        .join("");
            }


            if (contador) {

                contador.textContent =
                    `Exibindo ${filtrados.length} de ${categoria.livros.length} ${
                        categoria.livros.length === 1
                            ? "livro"
                            : "livros"
                    }`;
            }
        }


        campoBusca?.addEventListener(
            "input",
            aplicarFiltrosLivros
        );


        ordenar?.addEventListener(
            "change",
            aplicarFiltrosLivros
        );


        filtroAutor?.addEventListener(
            "change",
            aplicarFiltrosLivros
        );


        filtroAno?.addEventListener(
            "change",
            aplicarFiltrosLivros
        );


        filtroEditora?.addEventListener(
            "change",
            aplicarFiltrosLivros
        );


        chips.forEach(
            chip => {

                chip.addEventListener(
                    "click",
                    () => {

                        destaqueAtivo =
                            chip.dataset
                                .bookHighlight ||
                            "todos";

                        chips.forEach(
                            item =>
                                item.classList
                                    .remove(
                                        "active"
                                    )
                        );

                        chip.classList.add(
                            "active"
                        );

                        aplicarFiltrosLivros();
                    }
                );
            }
        );


        document
            .getElementById(
                "books-clear-search"
            )
            ?.addEventListener(
                "click",
                () => {

                    if (campoBusca) {

                        campoBusca.value =
                            "";

                        campoBusca.focus();
                    }

                    aplicarFiltrosLivros();
                }
            );


        document
            .getElementById(
                "books-reset-filters"
            )
            ?.addEventListener(
                "click",
                () => {

                    if (campoBusca) {
                        campoBusca.value = "";
                    }

                    if (ordenar) {
                        ordenar.value =
                            "recentes";
                    }

                    if (filtroAutor) {
                        filtroAutor.value =
                            "";
                    }

                    if (filtroAno) {
                        filtroAno.value =
                            "";
                    }

                    if (filtroEditora) {
                        filtroEditora.value =
                            "";
                    }

                    destaqueAtivo =
                        "todos";

                    chips.forEach(
                        item =>
                            item.classList
                                .toggle(
                                    "active",
                                    item.dataset
                                        .bookHighlight ===
                                        "todos"
                                )
                    );

                    aplicarFiltrosLivros();
                }
            );


        document
            .getElementById(
                "voltar-estantes"
            )
            ?.addEventListener(
                "click",
                renderizarEstantes
            );


        aplicarFiltrosLivros();
    }


    renderizarEstantes();
}
/* ==========================================================================
   MENU MOBILE
   ========================================================================== */

function inicializarMenuMobile() {

    const button =
        document.getElementById(
            "menu-toggle"
        );

    const sidebar =
        document.getElementById(
            "sidebar-menu"
        );

    const closeButton =
        document.getElementById(
            "close-sidebar"
        );

    if (!button || !sidebar) {
        return;
    }

    let overlay =
        document.getElementById(
            "mobile-overlay"
        );

    if (!overlay) {

        overlay =
            document.createElement(
                "div"
            );

        overlay.id =
            "mobile-overlay";

        overlay.className =
            "mobile-overlay";

        document.body.appendChild(
            overlay
        );
    }


    function abrir() {

        sidebar.classList.add(
            "active"
        );

        overlay.classList.add(
            "active"
        );

        document.body.classList.add(
            "menu-open"
        );

        button.setAttribute(
            "aria-expanded",
            "true"
        );
    }


    function fechar() {

        sidebar.classList.remove(
            "active"
        );

        overlay.classList.remove(
            "active"
        );

        document.body.classList.remove(
            "menu-open"
        );

        button.setAttribute(
            "aria-expanded",
            "false"
        );
    }


    button.addEventListener(
        "click",
        abrir
    );

    if (closeButton) {

        closeButton.addEventListener(
            "click",
            fechar
        );
    }

    overlay.addEventListener(
        "click",
        fechar
    );

    sidebar
        .querySelectorAll("a")
        .forEach(link => {

            link.addEventListener(
                "click",
                fechar
            );
        });

    document.addEventListener(
        "keydown",
        evento => {

            if (
                evento.key ===
                "Escape"
            ) {
                fechar();
            }
        }
    );
}


/* ==========================================================================
   NAVEGAÇÃO INTERNA
   ========================================================================== */

function inicializarNavegacaoInterna() {

    document
        .querySelectorAll(
            'a[href^="#"]'
        )
        .forEach(link => {

            link.addEventListener(
                "click",
                evento => {

                    const alvoId =
                        link.getAttribute(
                            "href"
                        );

                    if (
                        !alvoId ||
                        alvoId === "#"
                    ) {
                        return;
                    }

                    const alvo =
                        document.querySelector(
                            alvoId
                        );

                    if (!alvo) {
                        return;
                    }

                    evento.preventDefault();

                    alvo.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
                }
            );
        });
}


/* ==========================================================================
   FÓRUM — AUTENTICAÇÃO DA COMUNIDADE
   ========================================================================== */

async function inicializarForum() {

    const formulario =
        document.getElementById("form-forum");

    const botaoLogin =
        document.getElementById("forum-btn-login");

    const botaoCadastro =
        document.getElementById("forum-btn-signup");

    const botaoLoginNoForum =
        document.getElementById("forum-inline-login");

    const botaoCadastroNoForum =
        document.getElementById("forum-inline-signup");

    const botaoSair =
        document.getElementById("forum-btn-logout");

    const botaoExcluirConta =
        document.getElementById(
            "forum-btn-delete-account"
        );


    if (
        !formulario &&
        !botaoLogin &&
        !botaoCadastro
    ) {
        return;
    }


    try {

        const supabaseClient =
            await obterClienteSupabase();


        /* VERIFICAR SESSÃO ATUAL */

        const { data } =
            await supabaseClient.auth.getSession();

        atualizarInterfaceForum(
            data?.session || null
        );


        /* OBSERVAR LOGIN / LOGOUT */

        supabaseClient.auth.onAuthStateChange(
            (_evento, sessao) => {

                atualizarInterfaceForum(
                    sessao || null
                );

            }
        );


    } catch (erro) {

        console.error(
            "Não foi possível inicializar a autenticação do fórum.",
            erro
        );

    }


    botaoLogin?.addEventListener(
        "click",
        entrarForum
    );


    botaoCadastro?.addEventListener(
        "click",
        cadastrarForum
    );


    botaoLoginNoForum?.addEventListener(
        "click",
        entrarForum
    );


    botaoCadastroNoForum?.addEventListener(
        "click",
        cadastrarForum
    );


    botaoSair?.addEventListener(
        "click",
        sairForum
    );


    botaoExcluirConta?.addEventListener(
        "click",
        excluirPropriaConta
    );


    formulario?.addEventListener(
        "submit",
        publicarForum
    );


    await carregarComentarios();

}


/* ==========================================================================
   INTERFACE DO USUÁRIO
   ========================================================================== */

function atualizarInterfaceForum(sessao) {

    const visitante =
        document.getElementById(
            "forum-guest-area"
        );

    const usuarioArea =
        document.getElementById(
            "forum-user-area"
        );

    const formulario =
        document.getElementById(

                   "form-forum"
        );

    const conviteVisitante =
        document.getElementById(
            "forum-guest-prompt"
        );

    const nome =
        document.getElementById(
            "forum-user-name"
        );


    const usuario =
        sessao?.user || null;


    if (!usuario) {

        if (visitante) {
            visitante.hidden = false;
        }

        if (usuarioArea) {
            usuarioArea.hidden = true;
        }

        if (formulario) {
            formulario.hidden = true;
        }

        if (conviteVisitante) {
            conviteVisitante.hidden = false;
        }

        return;
    }


    if (visitante) {
        visitante.hidden = true;
    }

    if (usuarioArea) {
        usuarioArea.hidden = false;
    }

    if (formulario) {
        formulario.hidden = false;
    }

    if (conviteVisitante) {
        conviteVisitante.hidden = true;
    }


    if (nome) {

        nome.textContent =
            usuario.user_metadata?.display_name ||
            usuario.user_metadata?.name ||
            usuario.email?.split("@")[0] ||
            "Investigador";

    }

}
/* ==========================================================================
   CADASTRO
   ========================================================================== */

async function cadastrarForum() {

    const nome =
        prompt(
            "Escolha seu nome ou codinome no Arquivo Sombrio:"
        )?.trim();

    if (!nome) {
        return;
    }


    const email =
        prompt(
            "Digite seu e-mail:"
        )?.trim();

    if (!email) {
        return;
    }


    const senha =
        prompt(
            "Crie uma senha com pelo menos 6 caracteres:"
        );


    if (!senha || senha.length < 6) {

        alert(
            "A senha precisa ter pelo menos 6 caracteres."
        );

        return;
    }


    const confirmouMaioridade =
        confirm(
            "CONFIRMAÇÃO DE IDADE\n\n" +
            "A Comunidade do Arquivo Sombrio é destinada exclusivamente a pessoas com 18 anos ou mais.\n\n" +
            "Você confirma que possui 18 anos ou mais?"
        );


    if (!confirmouMaioridade) {

        alert(
            "Não é possível criar uma conta na Comunidade sem confirmar que você possui 18 anos ou mais."
        );

        return;
    }


    const aceitouPoliticas =
        confirm(
            "TERMOS E POLÍTICAS\n\n" +
            "Para criar sua conta, você precisa declarar que leu e aceita os Termos de Uso, a Política de Privacidade e as Diretrizes da Comunidade.\n\n" +
            "Você concorda com esses documentos?"
        );


    if (!aceitouPoliticas) {

        alert(
            "Para criar uma conta, é necessário aceitar os Termos de Uso, a Política de Privacidade e as Diretrizes da Comunidade."
        );

        return;
    }


    try {

        const supabaseClient =
            await obterClienteSupabase();


        const captchaToken =
            await obterTokenTurnstile();


        const {
            data,
            error
        } =
            await supabaseClient.auth.signUp({

                email,

                password: senha,

                options: {

                    captchaToken,

                    emailRedirectTo:
                        "https://l7-collab.github.io/arquivosombrio/",

                    data: {

                        display_name:
                            nome,

                        age_18_confirmed:
                            true,

                        legal_acceptance:
                            true,

                        terms_version:
                            "1.0",

                        privacy_version:
                            "1.0",

                        guidelines_version:
                            "1.0",

                        legal_accepted_at:
                            new Date().toISOString()

                    }

                }

            });


        if (error) {
            throw error;
        }


        if (data?.session) {

            alert(
                "Conta criada. Você já está conectado ao Arquivo Sombrio."
            );

        } else {

            alert(
                "Conta criada. Verifique seu e-mail para confirmar o cadastro antes de entrar."
            );
        }


    } catch (erro) {

        console.error(
            "Falha ao criar conta no fórum.",
            erro
        );

        alert(
            erro?.message ||
            "Não foi possível criar sua conta."
        );

    }

}


/* ==========================================================================
   LOGIN
   ========================================================================== */

async function entrarForum() {

    const email =
        prompt(
            "Digite o e-mail da sua conta:"
        )?.trim();

    if (!email) {
        return;
    }


    const senha =
        prompt(
            "Digite sua senha:"
        );


    if (!senha) {
        return;
    }


    try {

        const supabaseClient =
            await obterClienteSupabase();


        const captchaToken =
            await obterTokenTurnstile();


        const {
            error
        } =
            await supabaseClient.auth
                .signInWithPassword({

                    email,

                    password:
                        senha,

                    options: {

                        captchaToken

                    }

                });


        if (error) {
            throw error;
        }


        alert(
            "Login realizado com sucesso."
        );


    } catch (erro) {

        console.error(
            "Falha no login do fórum.",
            erro
        );

        alert(
            erro?.message ||
            "E-mail ou senha inválidos."
        );

    }

}


/* ==========================================================================
   LOGOUT
   ========================================================================== */

async function sairForum() {

    try {

        const supabaseClient =
            await obterClienteSupabase();


        const {
            error
        } =
            await supabaseClient.auth
                .signOut();


        if (error) {
            throw error;
        }


    } catch (erro) {

        console.error(
            "Falha ao sair do fórum.",
            erro
        );

        alert(
            "Não foi possível encerrar a sessão."
        );

    }

}


/* ==========================================================================
   EXCLUSÃO DA PRÓPRIA CONTA
   ========================================================================== */

async function excluirPropriaConta() {

    const primeiraConfirmacao =
        confirm(
            "ATENÇÃO, INVESTIGADOR:\n\n" +
            "Esta ação é permanente. Sua conta e os dados associados " +
            "a ela serão excluídos do Arquivo Sombrio.\n\n" +
            "Deseja realmente prosseguir?"
        );


    if (!primeiraConfirmacao) {
        return;
    }


    const confirmacaoFinal =
        prompt(
            "Para confirmar a exclusão permanente, digite EXCLUIR:"
        );


    if (
        String(
            confirmacaoFinal || ""
        )
            .trim()
            .toUpperCase() !==
        "EXCLUIR"
    ) {

        alert(
            "Exclusão cancelada. A palavra de confirmação não foi informada corretamente."
        );

        return;
    }


    try {

        const supabaseClient =
            await obterClienteSupabase();


        const {
            data: sessaoData,
            error: erroSessao
        } =
            await supabaseClient.auth
                .getSession();


        if (erroSessao) {
            throw erroSessao;
        }


        const session =
            sessaoData?.session;


        if (
            !session?.user ||
            !session?.access_token
        ) {

            alert(
                "Sua sessão expirou. Entre novamente antes de excluir a conta."
            );

            return;
        }


        const urlEdgeFunction =
            `${SUPABASE_URL}/functions/v1/delete-own-account`;


        const resposta =
            await fetch(
                urlEdgeFunction,
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${session.access_token}`

                    },

                    body:
                        JSON.stringify({})

                }
            );


        let dadosResposta =
            null;


        try {

            dadosResposta =
                await resposta.json();

        } catch (erroJson) {

            console.warn(
                "A Edge Function retornou uma resposta sem JSON.",
                erroJson
            );

        }


        if (!resposta.ok) {

            throw new Error(
                dadosResposta?.error ||
                "Não foi possível excluir a conta."
            );
        }


        if (!dadosResposta?.success) {

            throw new Error(
                dadosResposta?.error ||
                "O servidor não confirmou a exclusão da conta."
            );
        }


        try {

            await supabaseClient.auth
                .signOut({
                    scope: "local"
                });

        } catch (erroLogout) {

            console.warn(
                "A conta foi excluída, mas não foi possível limpar completamente a sessão local.",
                erroLogout
            );

        }


        alert(
            "Sua conta foi excluída permanentemente do Arquivo Sombrio."
        );


        window.location.href =
            "index.html";


    } catch (erro) {

        console.error(
            "Falha ao excluir a conta:",
            erro
        );


        alert(
            "Não foi possível excluir sua conta. Nenhuma nova tentativa será realizada automaticamente."
        );

    }

}
/* ==========================================================================
   CARREGAR PUBLICAÇÕES
   ========================================================================== */

async function carregarComentarios() {

    const lista =
        document.getElementById(
            "lista-comentarios"
        );

    if (!lista) {
        return;
    }


    try {

        const supabaseClient =
            await obterClienteSupabase();


        const {
            data,
            error
        } =
            await supabaseClient
                .from("forum_posts")
                .select("*")
                .order(
                    "is_pinned",
                    {
                        ascending: false
                    }
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        if (error) {
            throw error;
        }


        const publicacoes =
            Array.isArray(data)
                ? data
                : [];


        if (!publicacoes.length) {

            lista.innerHTML = `
                <div class="empty-state">

                    <i class="fa-solid fa-comments"></i>

                    <h3>
                        Nenhuma análise publicada
                    </h3>

                    <p>
                        Seja o primeiro investigador
                        a iniciar uma discussão.
                    </p>

                </div>
            `;

            return;
        }


        lista.innerHTML =
            publicacoes
                .map(publicacao => `

                    <article
                        class="comment-card"
                        data-post-id="${escaparHTML(publicacao.id)}"
                    >

                        <div class="comment-header">

                            <strong>
                                <i class="fa-solid fa-user-secret"></i>

                                ${escaparHTML(
                                    publicacao.author_name ||
                                    "Investigador"
                                )}
                            </strong>

                            <time>
                                ${escaparHTML(
                                    new Date(
                                        publicacao.created_at
                                    ).toLocaleString(
                                        "pt-BR",
                                        {
                                            dateStyle: "short",
                                            timeStyle: "short"
                                        }
                                    )
                                )}
                            </time>

                        </div>

                        ${
                            publicacao.title
                                ? `
                                    <h3>
                                        ${escaparHTML(
                                            publicacao.title
                                        )}
                                    </h3>
                                `
                                : ""
                        }

                        <p>
                            ${escaparHTML(
                                publicacao.content || ""
                            )}
                        </p>

                    </article>

                `)
                .join("");


    } catch (erro) {

        console.error(
            "Falha ao carregar publicações do fórum.",
            erro
        );

        lista.innerHTML = `
            <div class="empty-state">

                <i class="fa-solid fa-triangle-exclamation"></i>

                <h3>
                    Não foi possível carregar o fórum
                </h3>

                <p>
                    Tente novamente em alguns instantes.
                </p>

            </div>
        `;

    }

}


/* ==========================================================================
   PUBLICAR
   ========================================================================== */

async function publicarForum(evento) {

    evento.preventDefault();


    const titulo =
        document
            .getElementById(
                "forum-titulo"
            )
            ?.value
            .trim();


    const categoria =
        document
            .getElementById(
                "forum-categoria"
            )
            ?.value;


    const conteudo =
        document
            .getElementById(
                "forum-mensagem"
            )
            ?.value
            .trim();


    if (
        !titulo ||
        !categoria ||
        !conteudo
    ) {

        alert(
            "Preencha todos os campos da publicação."
        );

        return;
    }


    try {

        const supabaseClient =
            await obterClienteSupabase();


        const {
            data: sessaoData,
            error: sessaoErro
        } =
            await supabaseClient.auth
                .getSession();


        if (sessaoErro) {
            throw sessaoErro;
        }


        const usuario =
            sessaoData?.session?.user;


        if (!usuario) {

            alert(
                "Entre na sua conta para publicar."
            );

            atualizarInterfaceForum(null);

            return;
        }


        const nome =
            usuario.user_metadata?.display_name ||
            usuario.user_metadata?.name ||
            usuario.email?.split("@")[0] ||
            "Investigador";


        const {
            error
        } =
            await supabaseClient
                .from("forum_posts")
                .insert({

                    author_name: nome,
                    title: titulo,
                    content: conteudo,
                    category: categoria,
                    user_id: usuario.id,
                    status: "publicado",
                    is_pinned: false

                });


        if (error) {
            throw error;
        }


        evento.target.reset();


        mostrarMensagem(
            "comentario-sucesso",
            "Sua análise foi publicada no arquivo."
        );


        await carregarComentarios();


    } catch (erro) {

        console.error(
            "Falha ao publicar no fórum.",
            erro
        );

        alert(
            erro?.message ||
            "Não foi possível publicar sua análise."
        );

    }

}


/* ==========================================================================
   SUGESTÕES
   ========================================================================== */

function inicializarSugestao() {

    const formulario =
        document.getElementById(
            "form-sugestao"
        );

    if (!formulario) {
        return;
    }

    formulario.addEventListener(
        "submit",
        enviarSugestao
    );
}


function enviarSugestao(evento) {

    evento.preventDefault();

    const nome =
        document
            .getElementById(
                "sug-nome"
            )
            ?.value
            .trim();

    const titulo =
        document
            .getElementById(
                "sug-titulo"
            )
            ?.value
            .trim();

    const descricao =
        document
            .getElementById(
                "sug-descricao"
            )
            ?.value
            .trim();

    if (
        !nome ||
        !titulo
    ) {
        return;
    }

    const sugestao = {

        id:
            Date.now(),

        nome,

        titulo,

        descricao,

        data:
            new Date()
                .toLocaleString(
                    "pt-BR",
                    {
                        dateStyle:
                            "short",

                        timeStyle:
                            "short"
                    }
                )
    };

    /*
     * Persistência real: Supabase primeiro.
     * O localStorage continua como cópia de
     * segurança local, mas a administradora
     * recebe a sugestão em qualquer dispositivo.
     */

    enviarSugestaoSupabase(sugestao);

    const sugestoes =
        lerStorage(
            CONFIG.STORAGE_SUGESTOES
        );

    sugestoes.unshift(
        sugestao
    );

    if (
        salvarStorage(
            CONFIG.STORAGE_SUGESTOES,
            sugestoes
        )
    ) {

        evento.target.reset();

        mostrarMensagem(
            "mensagem-sucesso",
            "Sugestão enviada para o arquivo."
        );
    }
}


async function enviarSugestaoSupabase(
    sugestao
) {

    try {

        const supabaseClient =
            await obterClienteSupabase();

        const {
            error
        } =
            await supabaseClient
                .from("Sugestoes")
                .insert([
                    {
                        nome:
                            sugestao.nome,
                        titulo:
                            sugestao.titulo,
                        descricao:
                            sugestao.descricao ||
                            null
                    }
                ]);

        if (error) {

            throw error;
        }

    } catch (erro) {

        /*
         * Sem a migração SQL aplicada (colunas
         * nome/titulo/descricao), a inserção
         * falha e a sugestão fica apenas no
         * localStorage, como antes.
         */

        console.warn(
            "Sugestão não registrada no Supabase (verifique a migração SQL):",
            erro?.message ||
            erro
        );
    }
}


/* ==========================================================================
   MENSAGENS
   ========================================================================== */

function mostrarMensagem(
    id,
    texto
) {

    const elemento =
        document.getElementById(
            id
        );

    if (!elemento) {
        return;
    }

    elemento.textContent =
        texto;

    elemento.classList.add(
        "visible"
    );

    window.setTimeout(
        () => {

            elemento.classList.remove(
                "visible"
            );

        },
        4500
    );
}


/* ==========================================================================
   PAINEL ADMINISTRATIVO
   ========================================================================== */
function inicializarAdmin() {

    const abrir =
        document.getElementById(
            "btn-open-admin"
        );

    const abrirMobile =
        document.getElementById(
            "mobile-btn-admin"
        );

    const modal =
        document.getElementById(
            "modal-admin"
        );

    const fechar =
        document.getElementById(
            "close-modal"
        );

    const formulario =
        document.getElementById(
            "form-admin-login"
        );

    if (abrir) {

        abrir.addEventListener(
            "click",
            async () => {

                const sessao =
                    await obterSessaoAdmin();

                if (sessao) {

                    abrirPainelAdmin();
                    return;
                }

                modal?.classList.add(
                    "active"
                );
            }
        );
    }


    if (abrirMobile) {

        abrirMobile.addEventListener(
            "click",
            async evento => {

                evento.preventDefault();

                const sessao =
                    await obterSessaoAdmin();

                if (sessao) {

                    abrirPainelAdmin();
                    return;
                }

                modal?.classList.add(
                    "active"
                );
            }
        );
    }


    if (fechar) {

        fechar.addEventListener(
            "click",
            fecharModalAdmin
        );
    }


    if (formulario) {

        formulario.addEventListener(
            "submit",
            autenticarAdmin
        );
    }


    obterSessaoAdmin()
        .then(sessao => {

            if (!sessao) {
                return;
            }

            console.info(
                "Sessão administrativa ativa."
            );
        });
}


function fecharModalAdmin() {

    const modal =
        document.getElementById(
            "modal-admin"
        );

    if (!modal) {
        return;
    }

    modal.classList.remove(
        "active"
    );

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    if (window.ARQUIVO_ADMIN_CAPTCHA_ATIVO) {
        modal.hidden = true;
    }
}


async function abrirPainelAdmin(sessaoValidada = null) {

    const sessao =
        sessaoValidada ||
        await obterSessaoAdmin();

    if (!sessao) {

        alert(
            "Acesso administrativo não autorizado."
        );

        return;
    }

    /*
     * O gerenciador não pode ser montado antes que o acervo termine
     * de carregar. Sem essa espera, a primeira renderização usa
     * casosSupabase = [] e mostra falsamente uma lista vazia.
     */
    await Promise.all([
        carregarCasosSupabase(),
        carregarPericiasSupabase(),
        carregarLivrosSupabase()
    ]);

    renderizarGerenciadorAdmin();

    const painel =
        document.getElementById(
            "admin-manager"
        );

    if (
        !painel ||
        !painel.querySelector(
            ".admin-manager"
        )
    ) {
        throw new Error(
            "O painel administrativo não pôde ser montado."
        );
    }

    if (window.ARQUIVO_ADMIN_CAPTCHA_ATIVO) {

        painel.hidden = false;
        painel.classList.add("active");
        painel.setAttribute("aria-hidden", "false");

        document.body.classList.add(
            "admin-dashboard-open"
        );

    }

    fecharModalAdmin();
}


/* ==========================================================================
   LOGIN ADMINISTRATIVO COM SUPABASE
   ========================================================================== */

async function autenticarAdmin(evento) {

    evento.preventDefault();

    const formulario =
        evento.currentTarget;

    const email =
        document
            .getElementById(
                "admin-email"
            )
            ?.value
            .trim();

    const senha =
        document
            .getElementById(
                "admin-pass"
            )
            ?.value || "";

    const erroElemento =
        document.getElementById(
            "admin-login-erro"
        );

    if (erroElemento) {

        erroElemento.textContent =
            "";

        erroElemento.classList.remove(
            "visible"
        );
    }


    if (!email || !senha) {

        if (erroElemento) {

            erroElemento.textContent =
                "Preencha o e-mail e a senha.";

            erroElemento.classList.add(
                "visible"
            );
        }

        return;
    }


    const botao =
        formulario
            .querySelector(
                'button[type="submit"]'
            );

    const htmlOriginal =
        botao?.innerHTML;


    if (botao) {

        botao.disabled = true;

        botao.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Verificando...
        `;
    }


    /*
     * Orientação imediata: o widget do
     * Cloudflare pode exigir clique no
     * checkbox. Sem este aviso, a tela
     * parece travada em "Verificando...".
     */

    if (erroElemento) {

        erroElemento.textContent =
            window.ARQUIVO_ADMIN_CAPTCHA_ATIVO
                ? "Entrando na área administrativa..."
                : "Se aparecer uma caixa de verificação, conclua-a para continuar.";

        erroElemento.classList.add(
            "visible"
        );
    }


    try {

        const supabaseClient =
            await Promise.race([
                obterClienteSupabase(),
                new Promise((_, reject) =>
                    window.setTimeout(
                        () => reject(
                            new Error(
                                "O Supabase demorou demais para iniciar. Atualize a página e tente novamente."
                            )
                        ),
                        15000
                    )
                )
            ]);

        const captchaToken =
            window.ARQUIVO_ADMIN_CAPTCHA_TOKEN ||
            await Promise.race([
                obterTokenTurnstile(),
                new Promise((_, reject) =>
                    window.setTimeout(
                        () => reject(
                            new Error(
                                "A verificação de segurança demorou demais. Feche a janela, abra novamente e tente outra vez."
                            )
                        ),
                        50000
                    )
                )
            ]);


        if (erroElemento) {

            erroElemento.textContent = "";

            erroElemento.classList.remove(
                "visible"
            );
        }


        const {
            data,
            error
        } =
            await Promise.race([
                supabaseClient
                    .auth
                    .signInWithPassword({
                        email,
                        password: senha,

                        options: {
                            captchaToken
                        }
                    }),
                new Promise((_, reject) =>
                    window.setTimeout(
                        () => reject(
                            new Error(
                                "O servidor demorou demais para responder. Tente novamente."
                            )
                        ),
                        20000
                    )
                )
            ]);


        if (error) {
            throw error;
        }


        if (!data?.session) {

            throw new Error(
                "Não foi possível iniciar a sessão."
            );
        }


        const role =
            data.session.user
                ?.app_metadata
                ?.role;


        if (role !== "admin") {

            await supabaseClient.auth.signOut();

            throw new Error(
                "Este usuário não possui permissão administrativa."
            );
        }


        if (window.ARQUIVO_ADMIN_CAPTCHA_ATIVO) {

            window.location.replace(
                "painel-admin.html?v=20260918-13"
            );

            return;
        }


        formulario.reset();

        await abrirPainelAdmin(
            data.session
        );


    } catch (erro) {

        console.error(
            "Falha no login administrativo.",
            erro
        );

        if (
            window.ARQUIVO_ADMIN_CAPTCHA_ATIVO &&
            typeof window.arquivoAdminCaptchaReset === "function"
        ) {
            window.arquivoAdminCaptchaReset();
        }


        if (erroElemento) {

            const mensagemAntiBot =
                /anti-bot|verificação|Turnstile/i.test(
                    erro?.message ||
                    ""
                );

            erroElemento.textContent =
                mensagemAntiBot
                    ? erro.message
                    : "Credenciais inválidas ou acesso não autorizado.";

            erroElemento.classList.add(
                "visible"
            );
        }


    } finally {

        if (botao) {

            botao.disabled = Boolean(
                window.ARQUIVO_ADMIN_CAPTCHA_ATIVO &&
                !window.ARQUIVO_ADMIN_CAPTCHA_TOKEN
            );

            if (
                htmlOriginal !==
                undefined
            ) {
                botao.innerHTML =
                    htmlOriginal;
            }
        }
    }
}



function obterURLPublicaDossie(caso) {

    const rotas = {
        "2": "dossies/caso-isabella-nardoni.html",
        "4": "dossies/lizzie-borden.html",
        "5": "dossies/caso-dana-chandler.html",
        "6": "dossies/unabomber-ted-kaczynski.html",
        "7": "dossies/caso-jonbenet-ramsey.html",
        "8": "dossies/gemeos-reimer-john-money.html"
    };

    return rotas[String(caso?.id)] ||
        `caso.html?id=${encodeURIComponent(caso?.id)}`;
}


/* ==========================================================================
   GERENCIADOR ADMINISTRATIVO
   ========================================================================== */

let secaoAdminAtiva = "dossies";

function renderizarGerenciadorAdmin() {

    let painel =
        document.getElementById(
            "admin-manager"
        );

    if (!painel) {

        painel =
            document.createElement(
                "div"
            );

        painel.id =
            "admin-manager";

        painel.className =
            "admin-manager-overlay";

        document.body.appendChild(
            painel
        );
    }


    /*
     * CASOS:
     * Agora vêm diretamente do Supabase.
     */
    const casos =
        Array.isArray(casosSupabase)
            ? casosSupabase
            : [];


    /*
 * LIVROS:
 * Agora vêm diretamente do Supabase.
 */
const livros =
    Array.isArray(livrosSupabase)
        ? livrosSupabase
        : [];

const pericias =
    Array.isArray(periciasSupabase)
        ? periciasSupabase
        : [];


    painel.innerHTML = `

        <div class="admin-manager">

            <button
                type="button"
                class="admin-close"
                id="admin-manager-close"
                aria-label="Fechar painel"
            >
                &times;
            </button>


            <div class="admin-heading">

                <span class="admin-eyebrow">
                    ÁREA RESTRITA
                </span>

                <h2>
                    Central de Arquivo
                </h2>

                <p>
                    Gerencie os conteúdos personalizados do site.
                </p>

            </div>


            <nav class="admin-content-tabs" aria-label="Categorias administrativas">
                <button type="button" data-admin-tab="dossies"><i class="fa-regular fa-folder-open"></i><span>Dossiês</span><small>${casos.length}</small></button>
                <button type="button" data-admin-tab="diarios"><i class="fa-regular fa-newspaper"></i><span>Casos diários</span><small>${casosDiariosAdmin?.length || 0}</small></button>
                <button type="button" data-admin-tab="pericias"><i class="fa-solid fa-microscope"></i><span>Perícia</span><small>${pericias.length}</small></button>
                <button type="button" data-admin-tab="livros"><i class="fa-solid fa-book-open"></i><span>Livros</span><small>${livros.length}</small></button>
            </nav>

            <div class="admin-content-tools">
                <label class="admin-content-search">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="search" id="admin-content-search" placeholder="Pesquisar nesta área..." autocomplete="off">
                </label>
                <select id="admin-content-order" aria-label="Ordenar registros">
                    <option value="recentes">Mais recentes</option>
                    <option value="az">Nome: A–Z</option>
                    <option value="za">Nome: Z–A</option>
                </select>
            </div>


            <div class="admin-actions">

                <button
                    type="button"
                    class="admin-action-button"
                    id="admin-new-case"
                    data-admin-create="dossies"
                >
                    <i class="fa-solid fa-folder-plus"></i>
                    Novo Dossiê
                </button>

<button
    type="button"
    class="admin-action-button"
    id="admin-new-forensic"
    data-admin-create="pericias"
>
    <i class="fa-solid fa-microscope"></i>
    Nova Perícia
</button>

                <button
                    type="button"
                    class="admin-action-button"
                    id="admin-new-book"
                    data-admin-create="livros"
                >
                    <i class="fa-solid fa-book-medical"></i>
                    Novo Livro
                </button>

                <button
                    type="button"
                    class="admin-action-button"
                    id="admin-logout"
                >
                    <i class="fa-solid fa-right-from-bracket"></i>
                    Sair
                </button>

            </div>


            <section class="admin-list-section" data-admin-section="dossies">

                <h3>
                    Dossiês
                </h3>

                <div class="admin-list">

                    ${
                        casos.length === 0

                        ? `
                            <p class="admin-empty">
                                Nenhum dossiê cadastrado no Supabase.
                            </p>
                          `

                        : casos.map(caso => `

                            <div class="admin-item" data-admin-title="${escaparHTML(caso.titulo || "")}" data-admin-date="${escaparHTML(caso.created_at || "")}">

                                <div>

                                    <strong>
                                        ${escaparHTML(
                                            caso.titulo ||
                                            "Dossiê sem título"
                                        )}
                                    </strong>

                                    <small>
                                        ${escaparHTML(
                                            caso.categoria ||
                                            "Sem categoria"
                                        )}${caso.status_publicacao === "rascunho" ? " · <strong style=\"color:#c96a5a;\">RASCUNHO</strong>" : ""}
                                    </small>

                                </div>

                                <div class="admin-item-buttons">

                                    <button
                                        type="button"
                                        data-edit-case="${escaparHTML(caso.id)}"
                                    >
                                        Editar
                                    </button>

                                    <button
                                        type="button"
                                        data-delete-case="${escaparHTML(caso.id)}"
                                    >
                                        Excluir
                                    </button>

                                </div>

                            </div>

                        `).join("")
                    }

                </div>

            </section>


            <section class="admin-list-section" data-admin-section="pericias">

                <h3>
                    Ciência Forense
                </h3>

                <div class="admin-list">

                    ${
                        pericias.length === 0

                        ? `
                            <p class="admin-empty">
                                Nenhum conteúdo pericial cadastrado.
                            </p>
                          `

                        : pericias.map(pericia => `

                            <div class="admin-item" data-admin-title="${escaparHTML(pericia.titulo || "")}" data-admin-date="${escaparHTML(pericia.created_at || "")}">

                                <div>

                                    <strong>
                                        ${escaparHTML(
                                            pericia.titulo ||
                                            "Perícia sem título"
                                        )}
                                    </strong>

                                    <small>
                                        ${escaparHTML(
                                            pericia.categoria ||
                                            "Sem categoria"
                                        )}
                                    </small>

                                </div>

                                <div class="admin-item-buttons">

                                    <button
                                        type="button"
                                        data-edit-forensic="${escaparHTML(pericia.id)}"
                                    >
                                        Editar
                                    </button>

                                    <button
                                        type="button"
                                        data-delete-forensic="${escaparHTML(pericia.id)}"
                                    >
                                        Excluir
                                    </button>

                                </div>

                            </div>

                        `).join("")
                    }

                </div>

            </section>


            <section class="admin-list-section" data-admin-section="livros">

                <h3>
                    Livros personalizados
                </h3>

                <div class="admin-list">

                    ${
                        livros.length === 0

                        ? `
                            <p class="admin-empty">
                                Nenhum livro personalizado.
                            </p>
                          `

                        : livros.map(livro => `

                            <div class="admin-item" data-admin-title="${escaparHTML(livro.titulo || "")}" data-admin-date="${escaparHTML(livro.created_at || livro.criadoEm || "")}">

                                <div>

                                    <strong>
                                        ${escaparHTML(
                                            livro.titulo
                                        )}
                                    </strong>

                                    <small>
                                        ${escaparHTML(
                                            livro.autor
                                        )}
                                    </small>

                                </div>

                                <div class="admin-item-buttons">

                                    <button
                                        type="button"
                                        data-edit-book="${livro.id}"
                                    >
                                        Editar
                                    </button>

                                    <button
                                        type="button"
                                        data-delete-book="${livro.id}"
                                    >
                                        Excluir
                                    </button>

                                </div>

                            </div>

                        `).join("")
                    }

                </div>

            </section>

        </div>
    `;


    painel.classList.add(
        "active"
    );


    document
        .getElementById(
            "admin-manager-close"
        )
        ?.addEventListener(
            "click",
            () =>
                painel.classList.remove(
                    "active"
                )
        );


    document
        .getElementById(
            "admin-new-case"
        )
        ?.addEventListener(
            "click",
            () =>
                abrirFormularioAdmin(
                    "caso"
                )
        );


    document
        .getElementById(
            "admin-new-book"
        )
        ?.addEventListener(
            "click",
            () =>
                abrirFormularioAdmin(
                    "livro"
                )
        );

document
.getElementById(
    "admin-new-forensic"
)
?.addEventListener(
    "click",
    () => 
        abrirFormularioAdmin(
            "pericia"
        )
);
    document
        .getElementById(
            "admin-logout"
        )
        ?.addEventListener(
            "click",
            sairAdmin
        );


    /*
     * IMPORTANTE:
     * Não usamos Number() nos IDs dos casos.
     * Assim o código funciona também se o
     * Supabase utilizar UUID ou outro formato.
     */
    painel
        .querySelectorAll(
            "[data-edit-case]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    editarCaso(
                        button.dataset.editCase
                    )
            );

        });


    painel
        .querySelectorAll(
            "[data-delete-case]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    removerCaso(
                        button.dataset.deleteCase
                    )
            );

        });


    /*
     * Livros ainda utilizam IDs numéricos
     * porque continuam no localStorage.
     */
    painel
        .querySelectorAll(
            "[data-edit-book]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    editarLivro(
    button.dataset.editBook
)
            );

        });


    painel
        .querySelectorAll(
            "[data-delete-book]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                   removerLivro(
    button.dataset.deleteBook
)
            );

        });


    painel
        .querySelectorAll(
            "[data-edit-forensic]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    editarPericia(
                        button.dataset.editForensic
                    )
            );
        });


    painel
        .querySelectorAll(
            "[data-delete-forensic]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () =>
                    removerPericia(
                        button.dataset.deleteForensic
                    )
            );
        });
}


/* ==========================================================================
   FORMULÁRIOS ADMINISTRATIVOS
   ========================================================================== */
function abrirFormularioAdmin(
    tipo,
    dados = null
) {

    let modal =
        document.getElementById(
            "admin-form-modal"
        );

    if (!modal) {

        modal =
            document.createElement(
                "div"
            );

        modal.id =
            "admin-form-modal";

        modal.className =
            "admin-form-overlay";

        document.body.appendChild(
            modal
        );
    }


    const caso =
        tipo === "caso";
   
const pericia =
    tipo === "pericia";

const livro =
    tipo === "livro";
    modal.innerHTML = `

        <div class="admin-form-card">

            <button
                type="button"
                class="admin-close"
                id="admin-form-close"
            >
                &times;
            </button>


            <span class="admin-eyebrow">

                ${
                    caso
                        ? "DOSSIÊ"
                        : pericia
                            ? "CIÊNCIA FORENSE"
                            : "RECOMENDAÇÃO"
                }

            </span>


            <h2>
                ${
                    dados
                        ? "Editar"
                        : "Cadastrar"
                }

                ${
                    caso
                        ? " Dossiê"
                        : pericia
                            ? " Perícia"
                            : " Livro"
                }

            </h2>


            <form id="admin-content-form">

                <input
                    type="hidden"
                    id="admin-edit-id"
                    value="${
                        dados
                            ? escaparHTML(
                                dados.id
                            )
                            : ""
                    }"
                >


                ${
                    caso

                    ? `

                    <label>
                        Título

                        <input
                            type="text"
                            id="admin-title"
                            value="${
                                dados
                                    ? escaparHTML(
                                        dados.titulo
                                    )
                                    : ""
                            }"
                            required
                        >

                    </label>


                    <label>

                        Categoria

                        <select
                            id="admin-category"
                        >

                            <option
                                value="INVESTIGAÇÃO"
                                ${
                                    dados?.categoria ===
                                    "INVESTIGAÇÃO"
                                        ? "selected"
                                        : ""
                                }
                            >
                                Investigação
                            </option>


                            <option
                                value="DESAPARECIMENTO"
                                ${
                                    dados?.categoria ===
                                    "DESAPARECIMENTO"
                                        ? "selected"
                                        : ""
                                }
                            >
                                Desaparecimento
                            </option>


                            <option
                                value="MISTÉRIO"
                                ${
                                    dados?.categoria ===
                                    "MISTÉRIO"
                                        ? "selected"
                                        : ""
                                }
                            >
                                Mistério
                            </option>


                            <option
                                value="PERÍCIA"
                                ${
                                    dados?.categoria ===
                                    "PERÍCIA"
                                        ? "selected"
                                        : ""
                                }
                            >
                                Perícia
                            </option>


                            <option
                                value="LENDA"
                                ${
                                    dados?.categoria ===
                                    "LENDA"
                                        ? "selected"
                                        : ""
                                }
                            >
                                Lenda
                            </option>

                        </select>

                    </label>


                    <label>

                        Local

                        <input
                            type="text"
                            id="admin-location"
                            value="${
                                dados
                                    ? escaparHTML(
                                        dados.local
                                    )
                                    : ""
                            }"
                        >

                    </label>


                    <label>

                        Ano / Período

                        <input
                            type="text"
                            id="admin-year"
                            value="${
                                dados
                                    ? escaparHTML(
                                        dados.ano
                                    )
                                    : ""
                            }"
                        >

                    </label>


                    <label>

                        Status

                        <input
                            type="text"
                            id="admin-status"
                            value="${
                                dados
                                    ? escaparHTML(
                                        dados.status
                                    )
                                    : "EM ARQUIVO"
                            }"
                        >

                    </label>


                    <label>

                        Publicação

                        <select
                            id="admin-publicacao"
                        >

                            <option
                                value="publicado"
                                ${
                                    dados?.status_publicacao !==
                                    "rascunho"
                                        ? "selected"
                                        : ""
                                }
                            >
                                Publicado
                            </option>


                            <option
                                value="rascunho"
                                ${
                                    dados?.status_publicacao ===
                                    "rascunho"
                                        ? "selected"
                                        : ""
                                }
                            >
                                Rascunho (invisível ao público)
                            </option>

                        </select>

                    </label>


                    <label>

                        Endereço amigável (slug)

                        <input
                            type="text"
                            id="admin-slug"
                            value="${
                                dados
                                    ? escaparHTML(
                                        dados.slug ||
                                        ""
                                    )
                                    : ""
                            }"
                            placeholder="ex.: lizzie-borden (gerado a partir do título se vazio)"
                        >

                        <small>
                            Usado em caso.html?slug=... Deixe vazio para gerar automaticamente.
                        </small>

                    </label>


                    <div class="admin-upload-section">


                        <div class="admin-upload-heading">

                            <span class="admin-eyebrow">
                                IMAGEM DO DOSSIÊ
                            </span>

                            <p>
                                Selecione uma imagem do computador.
                                O arquivo será enviado para o Supabase automaticamente.
                            </p>

                        </div>


                        <input
                            type="file"
                            id="admin-image-file"
                            accept="image/jpeg,image/png,image/webp"
                            hidden
                        >


                        <button
                            type="button"
                            class="admin-upload-button"
                            id="admin-image-upload-button"
                        >

                            <i class="fa-solid fa-cloud-arrow-up"></i>

                            Escolher imagem

                        </button>


                        <div
                            class="admin-image-preview"
                            id="admin-image-preview"
                        ></div>


                        <label>

                            URL da imagem

                            <input
                                type="url"
                                id="admin-image"
                                value="${
                                    dados
                                        ? escaparHTML(
                                            dados.imagem
                                        )
                                        : ""
                                }"
                                placeholder="A URL será preenchida automaticamente"
                            >

                        </label>

                    </div>


                    <label>

                        Resumo

                        <textarea
                            id="admin-summary"
                            rows="4"
                            required
                        >${
                            dados
    ? escaparHTML(
        dados.resumo
    )
    : ""
                        }</textarea>

                    </label>


                    <label>

                        História / Relatório

                        <textarea
                            id="admin-history"
                            rows="24"
                            required
                            placeholder="Escreva toda a narrativa do dossiê nesta caixa. Separe os parágrafos com uma linha em branco."
                        >${
                            dados
                                ? escaparHTML(
                                    dados.historia
                                )
                                : ""
                        }</textarea>

                        <small>
                            Mantenha toda a narrativa nesta única caixa. Separe os parágrafos e subtítulos com uma linha em branco.
                        </small>

                    </label>


                    <div class="admin-content-editor">

                        <div class="admin-content-editor-header">

                            <div>

                                <strong>
                                    Imagens, documentos e vídeos
                                </strong>

                                <small>
                                    Adicione somente os materiais que deverão aparecer durante a leitura do dossiê.
                                </small>

                            </div>

                        </div>

                        <div
                            id="admin-content-blocks"
                            class="admin-content-blocks"
                        ></div>

                        <div class="admin-content-toolbar">

                            <button
                                type="button"
                                class="admin-secondary-button"
                                data-add-content-block="imagem"
                            >
                                + Imagem
                            </button>

                            <button
                                type="button"
                                class="admin-secondary-button"
                                data-add-content-block="documento"
                            >
                                + Documento
                            </button>

                            <button
                                type="button"
                                class="admin-secondary-button"
                                data-add-content-block="video"
                            >
                                + Vídeo
                            </button>

                        </div>

                        <p class="admin-field-help">
                            O posicionamento de cada material dentro da História será definido pelo localizador de trechos.
                        </p>

                    </div>


                    <label>

                        Cronologia

                        <textarea
                            id="admin-chronology"
                            rows="12"
                            placeholder="Digite um acontecimento por bloco de texto. Separe cada acontecimento com uma linha em branco."
                        >${
                            dados &&
                            Array.isArray(
                                dados.conteudo_blocos
                            )
                                ? escaparHTML(
                                    dados.conteudo_blocos
                                        .filter(
                                            bloco =>
                                                bloco.tipo ===
                                                "cronologia"
                                        )
                                        .flatMap(
                                            bloco =>
                                                Array.isArray(
                                                    bloco.dados?.itens
                                                )
                                                    ? bloco.dados.itens
                                                    : []
                                        )
                                        .join("\n\n")
                                )
                                : ""
                        }</textarea>

                        <small>
                            Separe cada acontecimento com uma linha em branco.
                        </small>

                    </label>


                    <label>

                        Evidências

                        <textarea
                            id="admin-evidence"
                            rows="12"
                            placeholder="Digite uma evidência por bloco de texto. Separe cada evidência com uma linha em branco."
                        >${
                            dados
                                ? escaparHTML(
                                    normalizarEvidencias(
                                        dados.evidencias
                                    ).join("\n\n")
                                )
                                : ""
                        }</textarea>

                        <small>
                            Limite de cinco evidências. Separe cada evidência com uma linha em branco.
                        </small>

                    </label>


                    <label>

                        Hipóteses e controvérsias

                        <textarea
                            id="admin-theories"
                            rows="14"
                            placeholder="Digite uma hipótese ou controvérsia por bloco de texto. Separe cada item com uma linha em branco."
                        >${
                            dados
                                ? escaparHTML(
                                    normalizarEvidencias(
                                        dados.teorias
                                    ).join("\n\n")
                                )
                                : ""
                        }</textarea>

                        <small>
                            Separe cada hipótese ou controvérsia com uma linha em branco.
                        </small>

                    </label>


                    <label>

                        Situação oficial

                        <textarea
                            id="admin-official-status"
                            rows="8"
                            placeholder="Descreva a situação oficial e atual do caso."
                        >${
                            dados &&
                            Array.isArray(
                                dados.conteudo_blocos
                            )
                                ? escaparHTML(
                                    dados.conteudo_blocos
                                        .filter(
                                            bloco =>
                                                bloco.tipo ===
                                                "situacao_oficial"
                                        )
                                        .map(
                                            bloco =>
                                                bloco.dados?.texto ||
                                                ""
                                        )
                                        .filter(Boolean)
                                        .join("\n\n")
                                )
                                : ""
                        }</textarea>

                    </label>


                    <label>

                        Fontes

                        <textarea
                            id="admin-sources"
                            rows="14"
                            placeholder="Informe as fontes utilizadas, preferencialmente uma por linha."
                        >${
                            dados &&
                            Array.isArray(
                                dados.conteudo_blocos
                            )
                                ? escaparHTML(
                                    dados.conteudo_blocos
                                        .filter(
                                            bloco =>
                                                bloco.tipo ===
                                                "fontes"
                                        )
                                        .map(
                                            bloco =>
                                                bloco.dados?.texto ||
                                                ""
                                        )
                                        .filter(Boolean)
                                        .join("\n\n")
                                )
                                : ""
                        }</textarea>

                        <small>
                            Inclua o nome da fonte e o link correspondente sempre que estiver disponível.
                        </small>

                    </label>


                    <div
                        class="admin-upload-section admin-documents-section"
                    >


                        <div class="admin-upload-heading">

                            <span class="admin-eyebrow">
                                DOCUMENTOS DO ARQUIVO
                            </span>

                            <p>
                                Anexe PDF, Word, Excel, CSV ou TXT relacionados ao dossiê.
                            </p>

                        </div>


                        <input
                            type="file"
                            id="admin-document-file"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,text/plain"
                            multiple
                            hidden
                        >


                        <button
                            type="button"
                            class="admin-upload-button"
                            id="admin-document-upload-button"
                        >

                            <i class="fa-solid fa-paperclip"></i>

                            Anexar documento

                        </button>


                        <div
                            class="admin-documents-list"
                            id="admin-documents-list"
                        ></div>


                        <small
                            class="admin-upload-hint"
                        >
                            Limite configurado no Storage:
                            20 MB por arquivo.
                        </small>

                    </div>

                    `

                    : pericia

                    ? `

                    <label>
                        Título
                        <input
                            type="text"
                            id="admin-forensic-title"
                            value="${dados ? escaparHTML(dados.titulo || "") : ""}"
                            required
                        >
                    </label>

                    <label>
                        Categoria
                        <select id="admin-forensic-category" required>
                            ${[
                                "DNA Forense",
                                "Balística",
                                "Medicina Legal",
                                "Entomologia Forense",
                                "Toxicologia",
                                "Psicologia Criminal",
                                "Impressões Digitais",
                                "Técnicas de Investigação"
                            ].map(categoria => `
                                <option
                                    value="${escaparHTML(categoria)}"
                                    ${dados?.categoria === categoria ? "selected" : ""}
                                >
                                    ${escaparHTML(categoria)}
                                </option>
                            `).join("")}
                        </select>
                    </label>

                    <label>
                        Resumo
                        <textarea
                            id="admin-forensic-summary"
                            rows="4"
                            required
                        >${dados ? escaparHTML(dados.resumo || "") : ""}</textarea>
                    </label>

                    <div class="admin-upload-section">
                        <div class="admin-upload-heading">
                            <span class="admin-eyebrow">
                                IMAGEM PRINCIPAL
                            </span>
                            <p>
                                Selecione uma imagem do computador.
                                O arquivo será enviado para o Supabase automaticamente.
                            </p>
                        </div>

                        <input
                            type="file"
                            id="admin-image-file"
                            accept="image/jpeg,image/png,image/webp"
                            hidden
                        >

                        <button
                            type="button"
                            class="admin-upload-button"
                            id="admin-image-upload-button"
                        >
                            <i class="fa-solid fa-cloud-arrow-up"></i>
                            Escolher imagem
                        </button>

                        <div
                            class="admin-image-preview"
                            id="admin-image-preview"
                        ></div>

                        <label>
                            URL da imagem
                            <input
                                type="url"
                                id="admin-image"
                                value="${dados ? escaparHTML(dados.imagem || "") : ""}"
                                placeholder="A URL será preenchida automaticamente"
                            >
                        </label>

                        <label>
                            Legenda
                            <input
                                type="text"
                                id="admin-forensic-image-caption"
                                value="${dados ? escaparHTML(dados.legenda_imagem || "") : ""}"
                            >
                        </label>

                        <label>
                            Fonte da imagem
                            <input
                                type="text"
                                id="admin-forensic-image-source"
                                value="${dados ? escaparHTML(dados.fonte_imagem || "") : ""}"
                                placeholder="Instituição, arquivo ou endereço da fonte"
                            >
                        </label>
                    </div>

                    ${[
                        ["introduction", "Introdução", "introducao", 7],
                        ["operation", "Como funciona", "como_funciona", 7],
                        ["history", "História da técnica", "historia_tecnica", 7],
                        ["real-cases", "Aplicação em casos reais", "aplicacao_casos_reais", 7],
                        ["limitations", "Limitações e controvérsias", "limitacoes_controversias", 7],
                        ["curiosities", "Curiosidades", "curiosidades", 5],
                        ["sources", "Fontes", "fontes", 6],
                        ["related-cases", "Casos relacionados", "casos_relacionados", 5]
                    ].map(([id, rotulo, campo, linhas]) => `
                        <label>
                            ${rotulo}
                            <textarea
                                id="admin-forensic-${id}"
                                rows="${linhas}"
                            >${dados ? escaparHTML(dados[campo] || "") : ""}</textarea>
                        </label>
                    `).join("")}

                    `

                    : `

                    <label>

                        Título

                        <input
                            type="text"
                            id="admin-book-title"
                            value="${
                                dados
                                    ? escaparHTML(
                                        dados.titulo
                                    )
                                    : ""
                            }"
                            required
                        >

                    </label>


                    <label>

                        Autor

                        <input
                            type="text"
                            id="admin-book-author"
                            value="${
                                dados
                                    ? escaparHTML(
                                        dados.autor
                                    )
                                    : ""
                            }"
                            required
                        >

                    </label>


                    <div class="admin-book-metadata-grid">

                        <label>

                            Ano de publicação

                            <input
                                type="number"
                                id="admin-book-year"
                                min="0"
                                max="2100"
                                step="1"
                                value="${
                                    dados?.ano
                                        ? escaparHTML(
                                            dados.ano
                                        )
                                        : ""
                                }"
                                placeholder="Ex.: 1977"
                            >

                        </label>


                        <label>

                            Editora

                            <input
                                type="text"
                                id="admin-book-publisher"
                                value="${
                                    dados?.editora
                                        ? escaparHTML(
                                            dados.editora
                                        )
                                        : ""
                                }"
                                placeholder="Ex.: Suma"
                            >

                        </label>

                    </div>


                    <label class="admin-book-featured-option">

                        <input
                            type="checkbox"
                            id="admin-book-recommended"
                            ${
                                dados
                                    ? (
                                        livroEhRecomendado(dados)
                                            ? "checked"
                                            : ""
                                    )
                                    : "checked"
                            }
                        >

                        <span>
                            Marcar como livro recomendado
                        </span>

                    </label>


                    <div class="admin-upload-section">


                        <div class="admin-upload-heading">

                            <span class="admin-eyebrow">
                                CAPA DO LIVRO
                            </span>

                            <p>
                                Selecione a capa do computador.
                                O arquivo será enviado para o Supabase automaticamente.
                            </p>

                        </div>


                        <input
                            type="file"
                            id="admin-book-cover-file"
                            accept="image/jpeg,image/png,image/webp"
                            hidden
                        >


                        <button
                            type="button"
                            class="admin-upload-button"
                            id="admin-book-cover-upload-button"
                        >

                            <i class="fa-solid fa-cloud-arrow-up"></i>

                            Escolher capa

                        </button>


                        <div
                            class="admin-image-preview admin-book-cover-preview"
                            id="admin-book-cover-preview"
                        ></div>


                        <label>

                            URL da capa

                            <input
                                type="url"
                                id="admin-book-cover"
                                value="${
                                    dados
                                        ? escaparHTML(
                                            dados.capa
                                        )
                                        : ""
                                }"
                                placeholder="A URL será preenchida automaticamente"
                                required
                            >

                        </label>

                    </div>


                    <label>

                        Descrição

                        <textarea
                            id="admin-book-description"
                            rows="5"
                            required
                        >${
                            dados
                                ? escaparHTML(
                                    dados.descricao
                                )
                                : ""
                        }</textarea>

                    </label>


                    <label>

                        Categoria / Tag

                        <input
                            type="text"
                            id="admin-book-tag"
                            value="${
                                dados
                                    ? escaparHTML(
                                        dados.tag
                                    )
                                    : ""
                            }"
                            placeholder="CRIMINOLOGIA"
                        >

                    </label>


                    <div class="admin-affiliate-section">


                        <div class="admin-affiliate-header">

                            <div>

                                <span
                                    class="admin-affiliate-eyebrow"
                                >
                                    LINKS COMERCIAIS
                                </span>

                                <h4>
                                    Onde encontrar este livro
                                </h4>

                                <p>
                                    Adicione links de lojas,
                                    afiliados ou parceiros.
                                    Você pode cadastrar quantas
                                    opções quiser.
                                </p>

                            </div>

                        </div>


                        <div
                            id="admin-affiliate-links"
                            class="admin-affiliate-links"
                        ></div>


                        <button
                            type="button"
                            id="admin-add-affiliate-link"
                            class="admin-add-affiliate-link"
                        >

                            <i class="fa-solid fa-plus"></i>

                            Adicionar loja / link

                        </button>


                        <p class="admin-affiliate-hint">
                            Ex.: Amazon, Shopee,
                            Mercado Livre, Kobo,
                            Estante Virtual ou qualquer
                            outra loja parceira.
                        </p>


                    </div>

                    `
                }


                <button
                    type="submit"
                    class="admin-submit"
                >

                    <i class="fa-solid fa-floppy-disk"></i>

                    Salvar

                </button>

            </form>

        </div>
    `;


    modal.classList.add(
        "active"
    );


    if (caso || pericia) {

        inicializarUploadImagemCaso(
            dados,
            pericia
                ? "pericias/capas"
                : "casos/capas"
        );

        if (caso) {

            inicializarDocumentosCaso(
                dados
            );

            inicializarEditorConteudoAdmin(
                dados
            );
        }

    } else {

        inicializarUploadCapaLivro(
            dados
        );
    }


    document
        .getElementById(
            "admin-form-close"
        )
        ?.addEventListener(
            "click",
            () =>
                modal.classList.remove(
                    "active"
                )
        );


    document
        .getElementById(
            "admin-content-form"
        )
        ?.addEventListener(
            "submit",
            evento => {

                if (caso) {

                    salvarCasoAdmin(
                        evento,
                        dados
                    );

                } else if (pericia) {

                    salvarPericiaAdmin(
                        evento,
                        dados
                    );

                } else {

                    salvarLivroAdmin(
                        evento,
                        dados
                    );
                }
            }
        );


    if (livro) {

        const containerLinks =
            document.getElementById(
                "admin-affiliate-links"
            );

        const botaoAdicionar =
            document.getElementById(
                "admin-add-affiliate-link"
            );


        const linksExistentes =
            normalizarLinksAfiliados(
                dados?.linksAfiliados
            );


        if (
            linksExistentes.length > 0
        ) {

            linksExistentes.forEach(
                link => {

                    adicionarLinhaAfiliado(
                        containerLinks,
                        link
                    );
                }
            );

        } else {

            adicionarLinhaAfiliado(
                containerLinks
            );
        }


        botaoAdicionar
            ?.addEventListener(
                "click",
                () => {

                    adicionarLinhaAfiliado(
                        containerLinks
                    );
                }
            );
    }
}


/* ==========================================================================
   SLUG DE DOSSIÊ
   ========================================================================== */

function normalizarSlugDossie(
    texto
) {

    return String(
        texto || ""
    )
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase()
        .replace(
            /[^a-z0-9]+/g,
            "-"
        )
        .replace(
            /^-+|-+$/g,
            ""
        )
        .slice(
            0,
            80
        );
}


/* ==========================================================================
   SALVAR CASO ADMIN — SUPABASE
   ========================================================================== */
async function salvarCasoAdmin(
    evento,
    casoExistente = null
) {

    evento.preventDefault();
    if (Number(document.getElementById("admin-content-form")?.dataset.uploadsImagens || 0) > 0) {
        alert("Aguarde o envio das imagens terminar antes de salvar.");
        return;
    }

    const formulario =
        evento.currentTarget;

    const botaoSalvar =
        formulario?.querySelector(
            'button[type="submit"]'
        );

    const htmlOriginal =
        botaoSalvar?.innerHTML;


    if (botaoSalvar) {

        botaoSalvar.disabled =
            true;

        botaoSalvar.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Salvando...
        `;
    }


    try {

        const sessao =
            await obterSessaoAdmin();


        if (!sessao) {
            throw new Error(
                "Sua sessão administrativa expirou. Entre novamente."
            );
        }


        const supabaseClient =
            await obterClienteSupabase();


        const caso = {

            titulo:
                document
                    .getElementById(
                        "admin-title"
                    )
                    ?.value
                    .trim() ||
                "",

            categoria:
                document
                    .getElementById(
                        "admin-category"
                    )
                    ?.value ||
                "",


            local:
                document
                    .getElementById(
                        "admin-location"
                    )
                    ?.value
                    .trim() ||
                "",

            ano:
                document
                    .getElementById(
                        "admin-year"
                    )
                    ?.value
                    .trim() ||
                "",


            status:
                document
                    .getElementById(
                        "admin-status"
                    )
                    ?.value
                    .trim() ||
                "EM ARQUIVO",

            status_publicacao:
                document
                    .getElementById(
                        "admin-publicacao"
                    )
                    ?.value ===
                "rascunho"
                    ? "rascunho"
                    : "publicado",

            slug:
                normalizarSlugDossie(
                    document
                        .getElementById(
                            "admin-slug"
                        )
                        ?.value
                ) ||
                normalizarSlugDossie(
                    document
                        .getElementById(
                            "admin-title"
                        )
                        ?.value
                ) ||
                null,

            imagem:
                document
                    .getElementById(
                        "admin-image"
                    )
                    ?.value
                    .trim() ||
                "",


            resumo:
                document
                    .getElementById(
                        "admin-summary"
                    )
                    ?.value
                    .trim() ||
                "",

            historia:
                document
                    .getElementById(
                        "admin-history"
                    )
                    ?.value
                    .trim() ||
                "",

conteudo_blocos:
    coletarBlocosConteudoAdmin(),

            evidencias:
                normalizarEvidencias(
                    document
                        .getElementById(
                            "admin-evidence"
                        )
                        ?.value ||
                    ""
                ),

            teorias:
                normalizarEvidencias(
                    document
                        .getElementById(
                            "admin-theories"
                        )
                        ?.value ||
                    ""
                ),


            documentos:
                coletarDocumentosAdmin()
        };

           const blocosNarrativos =
            Array.isArray(caso.conteudo_blocos)
                ? caso.conteudo_blocos
                : [];

        const videosInvalidos =
            blocosNarrativos.filter(
                bloco =>
                    bloco.tipo === "video" &&
                    !validarUrlVideoAdmin(
                        bloco.dados?.url
                    )
            );

        if (videosInvalidos.length) {
            throw new Error(
                "Revise os blocos de vídeo. São aceitos links válidos do YouTube ou Vimeo, sem códigos HTML."
            );
        }

        const textoNarrativo =
            blocosNarrativos
                .filter(bloco =>
                    bloco.tipo === "paragrafo" ||
                    bloco.tipo === "subtitulo"
                )
.map(bloco => {

    const texto =
        bloco.dados?.texto || "";

    return bloco.tipo === "subtitulo"
        ? `## ${texto}`
        : texto;
})
                .filter(Boolean)
                .join("\n\n")
                .trim();

        if (textoNarrativo) {
            caso.historia = textoNarrativo;
        }

        const evidenciasDosBlocos =
            blocosNarrativos
                .filter(
                    bloco =>
                        bloco.tipo === "evidencias"
                )
                .flatMap(
                    bloco =>
                        Array.isArray(bloco.dados?.itens)
                            ? bloco.dados.itens
                            : []
                )
                .slice(0, 5);

        if (evidenciasDosBlocos.length) {
            caso.evidencias =
                evidenciasDosBlocos;
        }

        const hipotesesDosBlocos =
            blocosNarrativos
                .filter(
                    bloco =>
                        bloco.tipo === "hipoteses"
                )
                .flatMap(
                    bloco =>
                        Array.isArray(bloco.dados?.itens)
                            ? bloco.dados.itens
                            : []
                );

        if (hipotesesDosBlocos.length) {
            caso.teorias =
                hipotesesDosBlocos;
        }


        if (!caso.titulo) {

            throw new Error(
                "Informe o título do dossiê."
            );
        }

        if (!caso.resumo) {

            throw new Error(
                "Informe o resumo do dossiê."
            );
        }


if (
    !caso.historia &&
    (
        !Array.isArray(caso.conteudo_blocos) ||
        !caso.conteudo_blocos.length
    )
) {
    throw new Error(
        "Adicione conteúdo à história ou ao editor do dossiê."
    );
}


        let resultado;


        if (
            casoExistente &&
            casoExistente.id !== undefined &&
            casoExistente.id !== null
        ) {

            resultado =
                await supabaseClient
                    .from("Casos")
                    .update(
                        caso
                    )
                    .eq(
                        "id",
                        casoExistente.id
                    )
                    .select()
                    .single();

        } else {

            resultado =
                await supabaseClient
                    .from("Casos")
                    .insert([
                        caso
                    ])
                    .select()
                    .single();
        }


        if (resultado.error) {

            /*
             * Compatibilidade: se a migração SQL
             * ainda não foi aplicada, o banco não
             * conhece status_publicacao/slug.
             * Repete a operação sem esses campos
             * em vez de falhar.
             */

            const mensagemErro =
                String(
                    resultado.error.message ||
                    ""
                );

            const faltaColuna =
                mensagemErro.includes(
                    "status_publicacao"
                ) ||
                mensagemErro.includes(
                    "'slug'"
                );

            if (faltaColuna) {

                const casoCompativel =
                    {
                        ...caso
                    };

                delete casoCompativel.status_publicacao;

                delete casoCompativel.slug;

                resultado =
                    casoExistente
                        ? await supabaseClient
                              .from("Casos")
                              .update(casoCompativel)
                              .eq(
                                  "id",
                                  casoExistente.id
                              )
                              .select()
                              .single()
                        : await supabaseClient
                              .from("Casos")
                              .insert([
                                  casoCompativel
                              ])
                              .select()
                              .single();

                if (resultado.error) {

                    throw resultado.error;
                }

            } else {

                throw resultado.error;
            }
        }


        await concluirRascunhoAdmin();
        fecharFormularioAdmin();

        await carregarCasosSupabase();

        renderizarGerenciadorAdmin();

        alert(
            casoExistente
                ? "Dossiê atualizado com sucesso."
                : "Dossiê salvo com sucesso."
        );


    } catch (erro) {

        console.error(
            "Erro ao salvar dossiê no Supabase:",
            erro
        );


        alert(
            erro?.message ||
            "Não foi possível salvar o dossiê."
        );


    } finally {

        if (botaoSalvar) {

            botaoSalvar.disabled =
                false;

            if (
                htmlOriginal !==
                undefined
            ) {

                botaoSalvar.innerHTML =
                    htmlOriginal;
            }
        }
    }
}


/* ==========================================================================
   SALVAR PERÍCIA ADMIN — SUPABASE
   ========================================================================== */

async function salvarPericiaAdmin(
    evento,
    periciaExistente = null
) {

    evento.preventDefault();

    const formulario =
        evento.currentTarget;

    const botaoSalvar =
        formulario?.querySelector(
            'button[type="submit"]'
        );

    const htmlOriginal =
        botaoSalvar?.innerHTML;

    if (botaoSalvar) {

        botaoSalvar.disabled = true;

        botaoSalvar.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Salvando...
        `;
    }

    const valor = id =>
        document
            .getElementById(id)
            ?.value
            .trim() || "";

    try {

        const sessao =
            await obterSessaoAdmin();

        if (!sessao) {
            throw new Error(
                "Sua sessão administrativa expirou. Entre novamente."
            );
        }

        const pericia = {
            titulo:
                valor("admin-forensic-title"),
            categoria:
                valor("admin-forensic-category"),
            resumo:
                valor("admin-forensic-summary"),
            imagem:
                valor("admin-image"),
            legenda_imagem:
                valor("admin-forensic-image-caption"),
            fonte_imagem:
                valor("admin-forensic-image-source"),
            introducao:
                valor("admin-forensic-introduction"),
            como_funciona:
                valor("admin-forensic-operation"),
            historia_tecnica:
                valor("admin-forensic-history"),
            aplicacao_casos_reais:
                valor("admin-forensic-real-cases"),
            limitacoes_controversias:
                valor("admin-forensic-limitations"),
            curiosidades:
                valor("admin-forensic-curiosities"),
            fontes:
                valor("admin-forensic-sources"),
            casos_relacionados:
                valor("admin-forensic-related-cases")
        };

        if (!pericia.titulo) {
            throw new Error(
                "Informe o título da perícia."
            );
        }

        if (!pericia.categoria) {
            throw new Error(
                "Selecione a categoria da perícia."
            );
        }

        if (!pericia.resumo) {
            throw new Error(
                "Informe o resumo da perícia."
            );
        }

        const supabaseClient =
            await obterClienteSupabase();

        let resultado;

        if (
            periciaExistente?.id !== undefined &&
            periciaExistente?.id !== null
        ) {

            resultado =
                await supabaseClient
                    .from("pericias")
                    .update(pericia)
                    .eq(
                        "id",
                        periciaExistente.id
                    )
                    .select()
                    .single();

        } else {

            resultado =
                await supabaseClient
                    .from("pericias")
                    .insert([pericia])
                    .select()
                    .single();
        }

        if (resultado.error) {
            throw resultado.error;
        }

        await concluirRascunhoAdmin();
        fecharFormularioAdmin();

        await carregarPericiasSupabase();

        renderizarGerenciadorAdmin();

        alert(
            periciaExistente
                ? "Perícia atualizada com sucesso."
                : "Perícia cadastrada com sucesso."
        );

    } catch (erro) {

        console.error(
            "Erro ao salvar perícia no Supabase:",
            erro
        );

        alert(
            erro?.message ||
            "Não foi possível salvar a perícia. Verifique se a tabela pericias já foi criada no Supabase."
        );

    } finally {

        if (botaoSalvar) {

            botaoSalvar.disabled = false;

            if (htmlOriginal !== undefined) {
                botaoSalvar.innerHTML = htmlOriginal;
            }
        }
    }
}


/* ==========================================================================
   SALVAR LIVRO ADMIN
   ========================================================================== */

async function salvarLivroAdmin(
    evento,
    livroExistente = null
) {

    evento.preventDefault();

    const titulo =
        document
            .getElementById(
                "admin-book-title"
            )
            ?.value
            .trim() ||
        "";

    const autor =
        document
            .getElementById(
                "admin-book-author"
            )
            ?.value
            .trim() ||
        "";

    const capa =
        document
            .getElementById(
                "admin-book-cover"
            )
            ?.value
            .trim() ||
        "";

    const descricao =
        document
            .getElementById(
                "admin-book-description"
            )
            ?.value
            .trim() ||
        "";

    const tag =
        document
            .getElementById(
                "admin-book-tag"
            )
            ?.value
            .trim() ||
        "RECOMENDADO";

    const anoValor =
        document
            .getElementById(
                "admin-book-year"
            )
            ?.value
            .trim() ||
        "";

    const editora =
        document
            .getElementById(
                "admin-book-publisher"
            )
            ?.value
            .trim() ||
        "";

    const recomendado =
        Boolean(
            document
                .getElementById(
                    "admin-book-recommended"
                )
                ?.checked
        );

    if (!titulo) {
        alert(
            "Informe o título do livro."
        );
        return;
    }

    if (!autor) {
        alert(
            "Informe o autor do livro."
        );
        return;
    }

    if (!capa) {
        alert(
            "Adicione uma capa para o livro."
        );
        return;
    }

    if (!descricao) {
        alert(
            "Informe uma descrição para o livro."
        );
        return;
    }

    let ano = null;

    if (anoValor) {

        ano =
            Number(
                anoValor
            );

        if (
            !Number.isInteger(ano) ||
            ano < 0 ||
            ano > 2100
        ) {

            alert(
                "Informe um ano de publicação válido."
            );

            return;
        }
    }

    const livro = {

        titulo,

        autor,

        ano,

        editora,

        capa,

        descricao,

        tag,

        recomendado,

        links_afiliados:
            coletarLinksAfiliadosAdmin()

    };

    try {

        const sessao =
            await obterSessaoAdmin();

        if (!sessao) {

            throw new Error(
                "Sua sessão administrativa expirou. Entre novamente."
            );
        }

        const supabaseClient =
            await obterClienteSupabase();

        let consulta;

        if (livroExistente?.id) {

            consulta =
                supabaseClient
                    .from("livros")
                    .update(livro)
                    .eq(
                        "id",
                        livroExistente.id
                    );

        } else {

            consulta =
                supabaseClient
                    .from("livros")
                    .insert(livro);
        }

        const {
            error
        } =
            await consulta;

        if (error) {
            throw error;
        }

        await concluirRascunhoAdmin();
        fecharFormularioAdmin();

        await carregarLivrosSupabase();

        renderizarGerenciadorAdmin();

        alert(
            livroExistente
                ? "Livro atualizado com sucesso."
                : "Livro cadastrado com sucesso."
        );

    } catch (erro) {

        console.error(
            "Erro ao salvar livro no Supabase:",
            erro
        );

        alert(
            erro?.message ||
            "Não foi possível salvar o livro."
        );
    }
}

/* ==========================================================================
   EDIÇÃO
   ========================================================================== */

async function editarCaso(id) {

    try {

        let caso =
            casosSupabase.find(
                item =>
                    String(item.id) ===
                    String(id)
            );


        if (!caso) {

            const supabaseClient =
                await obterClienteSupabase();


            const {
                data,
                error
            } =
                await supabaseClient
                    .from("Casos")
                    .select("*")
                    .eq(
                        "id",
                        id
                    )
                    .single();


            if (error) {

                throw error;
            }


            caso =
                data;
        }


        if (!caso) {

            throw new Error(
                "Dossiê não encontrado."
            );
        }


        abrirFormularioAdmin(
            "caso",
            caso
        );


    } catch (erro) {

        console.error(
            "Erro ao abrir dossiê para edição:",
            erro
        );


        alert(
            erro?.message ||
            "Não foi possível abrir este dossiê."
        );
    }
}


async function editarLivro(id) {

    try {

        let livro =
            livrosSupabase.find(
                item =>
                    String(item.id) ===
                    String(id)
            );

        if (!livro) {

            const supabaseClient =
                await obterClienteSupabase();

            const {
                data,
                error
            } =
                await supabaseClient
                    .from("livros")
                    .select("*")
                    .eq(
                        "id",
                        id
                    )
                    .single();

            if (error) {
                throw error;
            }

            livro =
                data
                    ? {
                        ...data,

                        linksAfiliados:
                            Array.isArray(
                                data.links_afiliados
                            )
                                ? data.links_afiliados
                                : []
                    }
                    : null;
        }

        if (!livro) {

            throw new Error(
                "Livro não encontrado."
            );
        }

        abrirFormularioAdmin(
            "livro",
            livro
        );

    } catch (erro) {

        console.error(
            "Erro ao abrir livro para edição:",
            erro
        );

        alert(
            erro?.message ||
            "Não foi possível abrir este livro."
        );
    }
}


async function editarPericia(id) {

    try {

        let pericia =
            periciasSupabase.find(
                item =>
                    String(item.id) ===
                    String(id)
            );

        if (!pericia) {

            const supabaseClient =
                await obterClienteSupabase();

            const {
                data,
                error
            } =
                await supabaseClient
                    .from("pericias")
                    .select("*")
                    .eq(
                        "id",
                        id
                    )
                    .single();

            if (error) {
                throw error;
            }

            pericia = data;
        }

        if (!pericia) {
            throw new Error(
                "Perícia não encontrada."
            );
        }

        abrirFormularioAdmin(
            "pericia",
            pericia
        );

    } catch (erro) {

        console.error(
            "Erro ao abrir perícia para edição:",
            erro
        );

        alert(
            erro?.message ||
            "Não foi possível abrir esta perícia."
        );
    }
}


/* ==========================================================================
   EXCLUSÃO
   ========================================================================== */

async function removerCaso(id) {

    const confirmar =
        confirm(
            "Tem certeza que deseja excluir este dossiê? Esta ação não poderá ser desfeita."
        );


    if (!confirmar) {

        return;
    }


    try {

        const sessao =
            await obterSessaoAdmin();


        if (!sessao) {

            throw new Error(
                "Sua sessão administrativa expirou. Entre novamente."
            );
        }


        const supabaseClient =
            await obterClienteSupabase();


        const {
            error
        } =
            await supabaseClient
                .from("Casos")
                .delete()
                .eq(
                    "id",
                    id
                );


        if (error) {

            throw error;
        }


        await carregarCasosSupabase();

        renderizarGerenciadorAdmin();


        alert(
            "Dossiê excluído com sucesso."
        );


    } catch (erro) {

        console.error(
            "Erro ao excluir dossiê do Supabase:",
            erro
        );


        alert(
            erro?.message ||
            "Não foi possível excluir o dossiê."
        );
    }
}


async function removerPericia(id) {

    const confirmar =
        confirm(
            "Tem certeza que deseja excluir esta perícia? Esta ação não poderá ser desfeita."
        );

    if (!confirmar) {
        return;
    }

    try {

        const sessao =
            await obterSessaoAdmin();

        if (!sessao) {
            throw new Error(
                "Sua sessão administrativa expirou. Entre novamente."
            );
        }

        const supabaseClient =
            await obterClienteSupabase();

        const {
            error
        } =
            await supabaseClient
                .from("pericias")
                .delete()
                .eq(
                    "id",
                    id
                );

        if (error) {
            throw error;
        }

        await carregarPericiasSupabase();

        renderizarGerenciadorAdmin();

        alert(
            "Perícia excluída com sucesso."
        );

    } catch (erro) {

        console.error(
            "Erro ao excluir perícia do Supabase:",
            erro
        );

        alert(
            erro?.message ||
            "Não foi possível excluir a perícia."
        );
    }
}





/* ==========================================================================
   FECHAMENTO DE FORMULÁRIO ADMIN
   ========================================================================== */

function fecharFormularioAdmin() {

    const modal =
        document.getElementById(
            "admin-form-modal"
        );


    if (modal) {

        modal.classList.remove(
            "active"
        );
    }
}
async function removerLivro(id) {

    const confirmar =
        confirm(
            "Tem certeza que deseja excluir este livro? Esta ação não poderá ser desfeita."
        );

    if (!confirmar) {
        return;
    }

    try {

        const sessao =
            await obterSessaoAdmin();

        if (!sessao) {

            throw new Error(
                "Sua sessão administrativa expirou. Entre novamente."
            );
        }

        const supabaseClient =
            await obterClienteSupabase();

        const {
            error
        } =
            await supabaseClient
                .from("livros")
                .delete()
                .eq(
                    "id",
                    id
                );

        if (error) {
            throw error;
        }

        await carregarLivrosSupabase();

        renderizarGerenciadorAdmin();

        alert(
            "Livro excluído com sucesso."
        );

    } catch (erro) {

        console.error(
            "Erro ao excluir livro do Supabase:",
            erro
        );

        alert(
            erro?.message ||
            "Não foi possível excluir o livro."
        );
    }
}

/* ==========================================================================
   MODAIS
   ========================================================================== */
function inicializarModais() {

    document.addEventListener(
        "click",
        evento => {


            if (
                evento.target
                    .classList
                    .contains(
                        "modal-overlay"
                    )
            ) {

                evento.target
                    .classList
                    .remove(
                        "active"
                    );
            }


            if (
                evento.target
                    .classList
                    .contains(
                        "admin-manager-overlay"
                    )
            ) {

                evento.target
                    .classList
                    .remove(
                        "active"
                    );
            }


            if (
                evento.target
                    .classList
                    .contains(
                        "admin-form-overlay"
                    )
            ) {

                evento.target
                    .classList
                    .remove(
                        "active"
                    );
            }

        }
    );


    document.addEventListener(
        "keydown",
        evento => {

            if (
                evento.key !==
                "Escape"
            ) {

                return;
            }


            document
                .querySelectorAll(
                    ".modal-overlay.active, .admin-manager-overlay.active, .admin-form-overlay.active"
                )
                .forEach(
                    modal => {

                        modal.classList.remove(
                            "active"
                        );
                    }
                );

        }
    );
}


/* ==========================================================================
   COMPATIBILIDADE
   ========================================================================== */

window.carregarCasos =
    carregarCasos;

window.carregarForense =
    carregarForense;

window.carregarLivros =
    carregarLivros;

window.carregarComentarios =
    carregarComentarios;


window.abrirPainelAdmin =
    abrirPainelAdmin;

window.fecharAdmin =
    fecharModalAdmin;


window.removerCaso =
    removerCaso;

window.removerLivro =
    removerLivro;

window.removerPericia =
    removerPericia;


window.editarCaso =
    editarCaso;

window.editarLivro =
    editarLivro;

window.editarPericia =
    editarPericia;


window.sairAdmin =
    sairAdmin;

/* Busca para posicionar imagens: número exato do trecho ou texto completo. */
function filtrarTrechosImagemAdmin(trechos, consulta) {
    const normalizar = valor => String(valor || "").normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    const termo = normalizar(consulta);
    return trechos.reduce((indices, texto, i) => {
        if (!termo || normalizar(texto).includes(termo)) indices.push(i);
        return indices;
    }, []);
}

/* =========================================================
   POSICIONAMENTO DE IMAGENS NO EDITOR NARRATIVO ATUAL
   ========================================================= */

function configurarLocalizadorImagemNarrativoAdmin(blocoMidia) {

    if (
        !blocoMidia ||
        ![
            "imagem",
            "documento",
            "video"
        ].includes(
            blocoMidia.dataset.blockType
        ) ||
        blocoMidia.querySelector(
            "[data-image-position-manager]"
        )
    ) {
        return;
    }

    const campoHistoria =
        document.getElementById(
            "admin-history"
        );

    if (!campoHistoria) {
        return;
    }

    const painel =
        document.createElement(
            "div"
        );

    painel.dataset.imagePositionManager =
        "";

    painel.style.cssText = `
        display: grid;
        gap: 12px;
        margin-top: 16px;
        padding: 16px;
        border: 1px solid rgba(187, 161, 109, 0.45);
        background: rgba(166, 140, 85, 0.06);
    `;

    painel.innerHTML = `
        <label>
            Localizar trecho para posicionar este material

            <input
                type="search"
                data-image-position-search
                placeholder="Digite ou cole uma frase da História..."
                autocomplete="off"
            >
        </label>

        <small
            data-image-position-status
            role="status"
            aria-live="polite"
        >
            Digite uma frase presente na caixa História / Relatório.
        </small>

        <div
            data-image-current-position
            style="
                display: none;
                padding: 10px 12px;
                border-left: 3px solid #bba16d;
                background: rgba(187, 161, 109, 0.08);
            "
        ></div>

        <div
            data-image-position-results
            style="
                display: grid;
                gap: 12px;
                max-height: 420px;
                overflow: auto;
            "
        ></div>

        <button
            type="button"
            class="admin-secondary-button"
            data-image-position-end
        >
            Colocar no final da História
        </button>
    `;

    blocoMidia.appendChild(
        painel
    );

    const busca =
        painel.querySelector(
            "[data-image-position-search]"
        );

    const status =
        painel.querySelector(
            "[data-image-position-status]"
        );

    const posicaoAtual =
        painel.querySelector(
            "[data-image-current-position]"
        );

    const resultados =
        painel.querySelector(
            "[data-image-position-results]"
        );

    const botaoFinal =
        painel.querySelector(
            "[data-image-position-end]"
        );

    const normalizar = valor =>
        String(valor || "")
            .normalize("NFD")
            .replace(
                /[\u0300-\u036f]/g,
                ""
            )
            .toLowerCase()
            .trim();

    const obterTrechos = () =>
        String(
            campoHistoria.value || ""
        )
            .split(/\n\s*\n/)
            .map(trecho =>
                trecho.trim()
            )
            .filter(Boolean);

    const nomePosicao = posicao => {

        if (!posicao) {
            return "";
        }

        if (posicao === "fim") {
            return "No final da História";
        }

        const correspondencia =
            posicao.match(
                /^(antes|apos)-(\d+)$/
            );

        if (!correspondencia) {
            return "";
        }

        const modo =
            correspondencia[1] ===
            "antes"
                ? "Antes"
                : "Depois";

        const numero =
            Number(
                correspondencia[2]
            ) + 1;

        return `${modo} do trecho ${numero}`;
    };

    const mostrarPosicaoAtual = () => {

        const posicao =
            blocoMidia.dataset
                .insertPosition || "";

        const nome =
            nomePosicao(
                posicao
            );

        if (!nome) {

            posicaoAtual.style.display =
                "none";

            posicaoAtual.textContent =
                "";

            return;
        }

        posicaoAtual.style.display =
            "block";

        posicaoAtual.textContent =
            `Posição definida: ${nome}.`;
    };

    const definirPosicao = (
        modo,
        indice
    ) => {

        const posicao =
            modo === "fim"
                ? "fim"
                : `${modo}-${indice}`;

        blocoMidia.dataset
            .insertPosition =
                posicao;

        mostrarPosicaoAtual();

        resultados.replaceChildren();

        busca.value = "";

        status.textContent =
            "Posição registrada. Clique em Salvar para aplicar na página pública.";
    };

    const pesquisar = () => {

        const consulta =
            normalizar(
                busca.value
            );

        resultados.replaceChildren();

        if (!consulta) {

            status.textContent =
                "Digite uma frase presente na caixa História / Relatório.";

            return;
        }

        const trechos =
            obterTrechos();

        const encontrados =
            trechos
                .map(
                    (trecho, indice) => ({
                        trecho,
                        indice
                    })
                )
                .filter(item =>
                    normalizar(
                        item.trecho
                    )
                        .includes(
                            consulta
                        )
                );

        if (!encontrados.length) {

            status.textContent =
                "Nenhum trecho foi encontrado na História.";

            return;
        }

        status.textContent =
            `${encontrados.length} trecho(s) encontrado(s). Escolha a posição.`;

        encontrados.forEach(item => {

            const resultado =
                document.createElement(
                    "div"
                );

            resultado.style.cssText = `
                padding: 14px;
                border: 1px solid rgba(117, 97, 63, 0.8);
                background: rgba(0, 0, 0, 0.16);
            `;

            const texto =
                document.createElement(
                    "p"
                );

            texto.style.cssText = `
                margin: 0;
                white-space: pre-line;
                overflow-wrap: anywhere;
            `;

            texto.textContent =
                `Trecho ${item.indice + 1}: ` +
                item.trecho.replace(
                    /^##\s+/,
                    ""
                );

            const acoes =
                document.createElement(
                    "div"
                );

            acoes.style.cssText = `
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                margin-top: 12px;
            `;

            const botaoAntes =
                document.createElement(
                    "button"
                );

            botaoAntes.type =
                "button";

            botaoAntes.className =
                "admin-secondary-button";

            botaoAntes.textContent =
                "Inserir antes";

            botaoAntes.addEventListener(
                "click",
                () =>
                    definirPosicao(
                        "antes",
                        item.indice
                    )
            );

            const botaoDepois =
                document.createElement(
                    "button"
                );

            botaoDepois.type =
                "button";

            botaoDepois.className =
                "admin-secondary-button";

            botaoDepois.textContent =
                "Inserir depois";

            botaoDepois.addEventListener(
                "click",
                () =>
                    definirPosicao(
                        "apos",
                        item.indice
                    )
            );

            acoes.append(
                botaoAntes,
                botaoDepois
            );

            resultado.append(
                texto,
                acoes
            );

            resultados.appendChild(
                resultado
            );
        });
    };

    busca.addEventListener(
        "input",
        pesquisar
    );

    botaoFinal.addEventListener(
        "click",
        () =>
            definirPosicao(
                "fim",
                null
            )
    );

    mostrarPosicaoAtual();
}

/* ==========================================================================
   FÓRUM — COMENTÁRIOS VINCULADOS AOS POSTS
   ========================================================================== */

function formatarDataForum(valor) {
    if (!valor) return "";

    return new Date(valor).toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short"
    });
}


async function carregarComentarios() {
    const lista = document.getElementById("lista-comentarios");

    if (!lista) return;

    try {
        const supabaseClient = await obterClienteSupabase();
        const { data: sessaoData } = await supabaseClient.auth.getSession();
        const usuario = sessaoData?.session?.user || null;

        const { data: postsData, error: postsErro } = await supabaseClient
            .from("forum_posts")
            .select("id, created_at, author_name, title, content, category, user_id, is_pinned")
            .order("is_pinned", { ascending: false })
            .order("created_at", { ascending: false });

        if (postsErro) throw postsErro;

        const publicacoes = Array.isArray(postsData) ? postsData : [];

        if (!publicacoes.length) {
            lista.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-comments"></i>
                    <h3>Nenhuma análise publicada</h3>
                    <p>Seja o primeiro investigador a iniciar uma discussão.</p>
                </div>
            `;
            return;
        }

        const idsPosts = publicacoes.map(publicacao => publicacao.id);

        const { data: comentariosData, error: comentariosErro } = await supabaseClient
            .from("forum_comments")
            .select("id, created_at, post_id, user_id, author_name, content")
            .in("post_id", idsPosts)
            .order("created_at", { ascending: true });

        if (comentariosErro) throw comentariosErro;

        const comentarios = Array.isArray(comentariosData) ? comentariosData : [];

        const comentariosPorPost = comentarios.reduce((grupos, comentario) => {
            const chave = String(comentario.post_id);

            if (!grupos[chave]) grupos[chave] = [];
            grupos[chave].push(comentario);
            return grupos;
        }, {});

        lista.innerHTML = publicacoes.map(publicacao => {
            const comentariosPost = comentariosPorPost[String(publicacao.id)] || [];
            const totalComentarios = comentariosPost.length;
            const textoContagem = totalComentarios === 1
                ? "1 comentário"
                : `${totalComentarios} comentários`;

            const respostasHTML = comentariosPost.length
                ? comentariosPost.map(comentario => `
                    <article class="forum-reply-card">
                        <div class="forum-reply-header">
                            <strong>
                                <i class="fa-solid fa-user-secret"></i>
                                ${escaparHTML(comentario.author_name || "Investigador")}
                            </strong>
                            <div class="forum-entry-meta">
                                <time>${escaparHTML(formatarDataForum(comentario.created_at))}</time>
                                ${usuario?.id === comentario.user_id ? `
                                    <button
                                        type="button"
                                        class="forum-delete-action forum-delete-comment"
                                        data-comment-id="${escaparHTML(comentario.id)}"
                                    >
                                        <i class="fa-regular fa-trash-can"></i>
                                        Excluir
                                    </button>
                                ` : ""}
                            </div>
                        </div>
                        <p>${escaparHTML(comentario.content || "")}</p>
                    </article>
                `).join("")
                : `<p class="forum-no-replies">Ainda não há comentários nesta análise.</p>`;

            const formularioHTML = usuario
                ? `
                    <form class="forum-comment-form" data-post-id="${escaparHTML(publicacao.id)}" hidden>
                        <label>
                            ADICIONAR COMENTÁRIO
                            <textarea
                                name="comment-content"
                                rows="3"
                                maxlength="1500"
                                placeholder="Escreva seu comentário..."
                                required
                            ></textarea>
                        </label>
                        <div class="forum-comment-actions">
                            <button type="button" class="btn-secondary forum-comment-cancel">
                                Cancelar
                            </button>
                            <button type="submit" class="btn-primary">
                                <i class="fa-solid fa-paper-plane"></i>
                                Publicar comentário
                            </button>
                        </div>
                    </form>
                `
                : `
                    <p class="forum-comment-guest">
                        Entre na sua conta para comentar.
                        <button type="button" class="forum-comment-login">Entrar</button>
                    </p>
                `;

            return `
                <article class="comment-card forum-post-card" data-post-id="${escaparHTML(publicacao.id)}">
                    <div class="comment-header">
                        <strong>
                            <i class="fa-solid fa-user-secret"></i>
                            ${escaparHTML(publicacao.author_name || "Investigador")}
                        </strong>
                        <div class="forum-entry-meta">
                            <time>${escaparHTML(formatarDataForum(publicacao.created_at))}</time>
                            ${usuario?.id === publicacao.user_id ? `
                                <button
                                    type="button"
                                    class="forum-delete-action forum-delete-post"
                                    data-post-id="${escaparHTML(publicacao.id)}"
                                >
                                    <i class="fa-regular fa-trash-can"></i>
                                    Excluir publicação
                                </button>
                            ` : ""}
                        </div>
                    </div>

                    ${publicacao.title ? `<h3>${escaparHTML(publicacao.title)}</h3>` : ""}

                    <p class="forum-post-content">${escaparHTML(publicacao.content || "")}</p>

                    <section class="forum-comments-thread">
                        <div class="forum-comments-heading">
                            <span>
                                <i class="fa-regular fa-comments"></i>
                                ${textoContagem}
                            </span>

                            ${usuario ? `
                                <button
                                    type="button"
                                    class="forum-comment-toggle"
                                    data-post-id="${escaparHTML(publicacao.id)}"
                                >
                                    Comentar
                                </button>
                            ` : ""}
                        </div>

                        <div class="forum-replies-list">${respostasHTML}</div>
                        ${formularioHTML}
                    </section>
                </article>
            `;
        }).join("");

        liberarEnvioPublicacaoForum();

    } catch (erro) {
        console.error("Falha ao carregar publicações e comentários do fórum.", erro);

        lista.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <h3>Não foi possível carregar o fórum</h3>
                <p>Tente novamente em alguns instantes.</p>
            </div>
        `;
    }
}


async function publicarComentarioForum(formulario) {
    const campo = formulario.querySelector('textarea[name="comment-content"]');
    const conteudo = campo?.value.trim();
    const postId = formulario.dataset.postId;

    if (!conteudo || !postId) return;

    if (formulario.dataset.submitting === "true") return;
    formulario.dataset.submitting = "true";

    let botao = null;

    try {
        const supabaseClient = await obterClienteSupabase();
        const { data: sessaoData, error: sessaoErro } = await supabaseClient.auth.getSession();

        if (sessaoErro) throw sessaoErro;

        const usuario = sessaoData?.session?.user;

        if (!usuario) {
            alert("Entre na sua conta para comentar.");
            atualizarInterfaceForum(null);
            return;
        }

        const nome = usuario.user_metadata?.display_name ||
            usuario.user_metadata?.name ||
            usuario.email?.split("@")[0] ||
            "Investigador";

        botao = formulario.querySelector('button[type="submit"]');
        if (botao) botao.disabled = true;

        const { error } = await supabaseClient
            .from("forum_comments")
            .insert({
                post_id: Number(postId),
                user_id: usuario.id,
                author_name: nome,
                content: conteudo,
                account_content_state: "active"
            });

        if (error) throw error;

        formulario.reset();
        await carregarComentarios();

    } catch (erro) {
        console.error("Falha ao publicar comentário no fórum.", erro);
        alert(erro?.message || "Não foi possível publicar o comentário.");

    } finally {
        if (botao) botao.disabled = false;
        formulario.dataset.submitting = "false";
    }
}


function liberarEnvioPublicacaoForum() {
    const formulario = document.getElementById("form-forum");
    const botao = formulario?.querySelector('button[type="submit"]');

    if (formulario) formulario.dataset.submitting = "false";
    if (botao) botao.disabled = false;
}


async function excluirItemForum(tabela, id, descricao) {
    const numeroId = Number(id);

    if (!Number.isFinite(numeroId)) return;

    const confirmou = confirm(
        `Excluir ${descricao}?\n\nEsta ação é permanente e não poderá ser desfeita.`
    );

    if (!confirmou) return;

    try {
        const supabaseClient = await obterClienteSupabase();
        const { data: sessaoData, error: sessaoErro } = await supabaseClient.auth.getSession();

        if (sessaoErro) throw sessaoErro;

        const usuario = sessaoData?.session?.user;

        if (!usuario) {
            alert("Entre novamente na sua conta para excluir este conteúdo.");
            atualizarInterfaceForum(null);
            return;
        }

        const { data, error } = await supabaseClient
            .from(tabela)
            .delete()
            .eq("id", numeroId)
            .eq("user_id", usuario.id)
            .select("id");

        if (error) throw error;

        if (!Array.isArray(data) || !data.length) {
            throw new Error("O conteúdo não foi encontrado ou não pertence à sua conta.");
        }

        await carregarComentarios();

    } catch (erro) {
        console.error(`Falha ao excluir ${descricao}.`, erro);
        alert(erro?.message || `Não foi possível excluir ${descricao}.`);
    }
}


function inicializarInteracoesComentariosForum() {
    const lista = document.getElementById("lista-comentarios");

    if (!lista || lista.dataset.commentsReady === "true") return;
    lista.dataset.commentsReady = "true";

    const formularioPublicacao = document.getElementById("form-forum");

    if (formularioPublicacao && formularioPublicacao.dataset.submitGuard !== "true") {
        formularioPublicacao.dataset.submitGuard = "true";

        formularioPublicacao.addEventListener("submit", evento => {
            if (formularioPublicacao.dataset.submitting === "true") {
                evento.preventDefault();
                evento.stopImmediatePropagation();
                return;
            }

            formularioPublicacao.dataset.submitting = "true";

            const botao = formularioPublicacao.querySelector('button[type="submit"]');
            if (botao) botao.disabled = true;

            window.setTimeout(liberarEnvioPublicacaoForum, 8000);
        }, true);
    }

    lista.addEventListener("click", evento => {
        const excluirPost = evento.target.closest(".forum-delete-post");

        if (excluirPost) {
            excluirItemForum(
                "forum_posts",
                excluirPost.dataset.postId,
                "esta publicação"
            );
            return;
        }

        const excluirComentario = evento.target.closest(".forum-delete-comment");

        if (excluirComentario) {
            excluirItemForum(
                "forum_comments",
                excluirComentario.dataset.commentId,
                "este comentário"
            );
            return;
        }

        const botaoComentar = evento.target.closest(".forum-comment-toggle");

        if (botaoComentar) {
            const post = botaoComentar.closest(".forum-post-card");
            const formulario = post?.querySelector(".forum-comment-form");

            if (formulario) {
                formulario.hidden = !formulario.hidden;
                if (!formulario.hidden) formulario.querySelector("textarea")?.focus();
            }
            return;
        }

        const botaoCancelar = evento.target.closest(".forum-comment-cancel");

        if (botaoCancelar) {
            const formulario = botaoCancelar.closest(".forum-comment-form");

            if (formulario) {
                formulario.reset();
                formulario.hidden = true;
            }
            return;
        }

        if (evento.target.closest(".forum-comment-login")) entrarForum();
    });

    lista.addEventListener("submit", evento => {
        const formulario = evento.target.closest(".forum-comment-form");

        if (!formulario) return;

        evento.preventDefault();
        publicarComentarioForum(formulario);
    });

    obterClienteSupabase()
        .then(supabaseClient => {
            supabaseClient.auth.onAuthStateChange(() => {
                window.setTimeout(carregarComentarios, 0);
            });
        })
        .catch(erro => {
            console.error("Não foi possível observar a sessão dos comentários.", erro);
        });
}


if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        inicializarInteracoesComentariosForum,
        { once: true }
    );
} else {
    inicializarInteracoesComentariosForum();
}


/* ==========================================================================
   FAVORITOS PRIVADOS — CASOS E LIVROS
   ========================================================================== */

async function alternarFavoritoConteudo(botao) {
    if (!botao || botao.disabled) return;

    const supabaseClient = await obterClienteSupabase();
    const { data: sessaoData } = await supabaseClient.auth.getSession();
    const usuario = sessaoData?.session?.user;

    if (!usuario) {
        alert("Entre na sua conta para salvar favoritos.");
        entrarForum();
        return;
    }

    botao.disabled = true;

    try {
        const tipo = botao.dataset.favoriteType;
        const itemId = botao.dataset.favoriteId;
        const ativo = botao.classList.contains("is-favorite");

        if (ativo) {
            const { error } = await supabaseClient
                .from("user_favorites")
                .delete()
                .eq("user_id", usuario.id)
                .eq("item_type", tipo)
                .eq("item_id", itemId);
            if (error) throw error;
        } else {
            const { error } = await supabaseClient.from("user_favorites").upsert({
                user_id: usuario.id,
                item_type: tipo,
                item_id: itemId,
                title: botao.dataset.favoriteTitle || "Favorito",
                subtitle: botao.dataset.favoriteSubtitle || null,
                image_url: botao.dataset.favoriteImage || null,
                target_url: botao.dataset.favoriteUrl || "index.html"
            }, { onConflict: "user_id,item_type,item_id" });
            if (error) throw error;
        }

        botao.classList.toggle("is-favorite", !ativo);
        botao.querySelector("i")?.classList.toggle("fa-solid", !ativo);
        botao.querySelector("i")?.classList.toggle("fa-regular", ativo);
        botao.setAttribute("aria-label", ativo ? "Adicionar aos favoritos" : "Remover dos favoritos");
    } catch (erro) {
        console.error("Não foi possível alterar o favorito.", erro);
        alert("Não foi possível atualizar seus favoritos.");
    } finally {
        botao.disabled = false;
    }
}


async function marcarFavoritosSalvos() {
    const botoes = [...document.querySelectorAll("[data-favorite-type][data-favorite-id]")];
    if (!botoes.length) return;

    try {
        const supabaseClient = await obterClienteSupabase();
        const { data: sessaoData } = await supabaseClient.auth.getSession();
        const usuario = sessaoData?.session?.user;
        if (!usuario) return;

        const { data, error } = await supabaseClient
            .from("user_favorites")
            .select("item_type,item_id")
            .eq("user_id", usuario.id);
        if (error) throw error;

        const salvos = new Set((data || []).map(item => `${item.item_type}:${item.item_id}`));
        botoes.forEach(botao => {
            const ativo = salvos.has(`${botao.dataset.favoriteType}:${botao.dataset.favoriteId}`);
            botao.classList.toggle("is-favorite", ativo);
            botao.querySelector("i")?.classList.toggle("fa-solid", ativo);
            botao.querySelector("i")?.classList.toggle("fa-regular", !ativo);
        });
    } catch (erro) {
        console.warn("Não foi possível identificar os favoritos salvos.", erro);
    }
}


document.addEventListener("click", evento => {
    const botao = evento.target.closest(".content-favorite-button");
    if (botao) alternarFavoritoConteudo(botao);
});


const observadorFavoritos = new MutationObserver(() => {
    window.clearTimeout(observadorFavoritos.timer);
    observadorFavoritos.timer = window.setTimeout(marcarFavoritosSalvos, 120);
});

document.addEventListener("DOMContentLoaded", () => {
    observadorFavoritos.observe(document.body, { childList: true, subtree: true });
    marcarFavoritosSalvos();
});


/* ==========================================================================
   CASOS CURTOS DIÁRIOS — ADMINISTRAÇÃO
   Módulo independente dos dossiês.
   ========================================================================== */

let casosDiariosAdmin = [];
let casosDiariosAdminCarregados = false;
let casosDiariosAdminCarregando = false;

function normalizarBuscaAdmin(valor) {
    return String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function aplicarOrganizacaoAdmin() {
    const painel = document.querySelector("#admin-manager .admin-manager");
    if (!painel) return;

    painel.querySelectorAll("[data-admin-tab]").forEach(botao => {
        const ativo = botao.dataset.adminTab === secaoAdminAtiva;
        botao.classList.toggle("active", ativo);
        botao.setAttribute("aria-selected", String(ativo));
    });

    painel.querySelectorAll("[data-admin-section]").forEach(secao => {
        secao.hidden = secao.dataset.adminSection !== secaoAdminAtiva;
    });

    painel.querySelectorAll("[data-admin-create]").forEach(botao => {
        botao.hidden = botao.dataset.adminCreate !== secaoAdminAtiva;
    });

    const secao = painel.querySelector(`[data-admin-section="${secaoAdminAtiva}"]`);
    if (!secao) return;

    const busca = normalizarBuscaAdmin(document.getElementById("admin-content-search")?.value);
    const ordem = document.getElementById("admin-content-order")?.value || "recentes";
    const lista = secao.querySelector(".admin-list");
    const itens = [...(lista?.querySelectorAll(".admin-item") || [])];

    itens.sort((a, b) => {
        const tituloA = normalizarBuscaAdmin(a.dataset.adminTitle || a.textContent);
        const tituloB = normalizarBuscaAdmin(b.dataset.adminTitle || b.textContent);
        if (ordem === "az") return tituloA.localeCompare(tituloB, "pt-BR");
        if (ordem === "za") return tituloB.localeCompare(tituloA, "pt-BR");
        return String(b.dataset.adminDate || "").localeCompare(String(a.dataset.adminDate || ""));
    }).forEach(item => lista?.appendChild(item));

    let visiveis = 0;
    itens.forEach(item => {
        const corresponde = !busca || normalizarBuscaAdmin(item.dataset.adminTitle || item.textContent).includes(busca);
        item.hidden = !corresponde;
        if (corresponde) visiveis += 1;
    });

    let vazio = secao.querySelector(".admin-filter-empty");
    if (!vazio) {
        vazio = document.createElement("p");
        vazio.className = "admin-empty admin-filter-empty";
        vazio.textContent = "Nenhum registro encontrado com esse nome.";
        lista?.appendChild(vazio);
    }
    vazio.hidden = visiveis > 0 || itens.length === 0;
}

function inicializarOrganizacaoAdmin() {
    const painel = document.querySelector("#admin-manager .admin-manager");
    if (!painel) return;

    if (!painel.dataset.organizacaoAtiva) {
        painel.dataset.organizacaoAtiva = "true";
        painel.querySelectorAll("[data-admin-tab]").forEach(botao => {
            botao.addEventListener("click", () => {
                secaoAdminAtiva = botao.dataset.adminTab;
                const busca = document.getElementById("admin-content-search");
                if (busca) busca.value = "";
                aplicarOrganizacaoAdmin();
            });
        });
        document.getElementById("admin-content-search")?.addEventListener("input", aplicarOrganizacaoAdmin);
        document.getElementById("admin-content-order")?.addEventListener("change", aplicarOrganizacaoAdmin);
    }

    const contadorDiarios = painel.querySelector('[data-admin-tab="diarios"] small');
    if (contadorDiarios) contadorDiarios.textContent = String(casosDiariosAdmin.length);
    aplicarOrganizacaoAdmin();
}

function slugCasoDiario(texto) {
    return String(texto || "caso")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 150) || "caso";
}

async function carregarCasosDiariosAdmin() {
    if (casosDiariosAdminCarregando) return;
    casosDiariosAdminCarregando = true;

    try {
        const cliente = await obterClienteSupabase();
        const { data, error } = await cliente
            .from("casos_diarios")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;
        casosDiariosAdmin = Array.isArray(data) ? data : [];
        casosDiariosAdminCarregados = true;
        injetarCasosDiariosNoGerenciador();
    } catch (erro) {
        console.error("Não foi possível carregar os casos diários.", erro);
    } finally {
        casosDiariosAdminCarregando = false;
    }
}

function injetarCasosDiariosNoGerenciador() {
    const painel = document.querySelector("#admin-manager .admin-manager");
    const acoes = painel?.querySelector(".admin-actions");
    if (!painel || !acoes) return;

    if (!document.getElementById("admin-new-daily-case")) {
        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "admin-action-button";
        botao.id = "admin-new-daily-case";
        botao.dataset.adminCreate = "diarios";
        botao.innerHTML = '<i class="fa-solid fa-newspaper"></i> Novo Caso Diário';
        const sair = document.getElementById("admin-logout");
        acoes.insertBefore(botao, sair || null);
        botao.addEventListener("click", () => abrirFormularioCasoDiario());
    }

    let secao = document.getElementById("admin-daily-cases-section");
    if (!secao) {
        secao = document.createElement("section");
        secao.id = "admin-daily-cases-section";
        secao.className = "admin-list-section admin-daily-cases-section";
        secao.dataset.adminSection = "diarios";
        acoes.after(secao);
    }

    secao.innerHTML = `
        <div class="admin-section-title-row">
            <div>
                <span class="admin-eyebrow">GARIMPO SOMBRIO</span>
                <h3>Casos curtos diários</h3>
            </div>
            <small>${casosDiariosAdmin.length} registro(s)</small>
        </div>
        <div class="admin-list">
            ${!casosDiariosAdminCarregados
                ? '<p class="admin-empty">Consultando casos diários...</p>'
                : casosDiariosAdmin.length === 0
                    ? '<p class="admin-empty">Nenhum caso diário cadastrado.</p>'
                    : casosDiariosAdmin.map(caso => `
                        <div class="admin-item" data-admin-title="${escaparHTML(caso.titulo || "")}" data-admin-date="${escaparHTML(caso.created_at || caso.publicado_em || "")}">
                            <div>
                                <strong>${escaparHTML(caso.titulo || "Caso sem título")}</strong>
                                <small>${escaparHTML(caso.status_publicacao === "publicado" ? "PUBLICADO" : "RASCUNHO")} · ${escaparHTML(caso.categoria || "GARIMPO SOMBRIO")}</small>
                            </div>
                            <div class="admin-item-buttons">
                                <button type="button" data-edit-daily-case="${escaparHTML(caso.id)}">Editar</button>
                                <button type="button" data-delete-daily-case="${escaparHTML(caso.id)}">Excluir</button>
                            </div>
                        </div>
                    `).join("")}
        </div>`;

    secao.querySelectorAll("[data-edit-daily-case]").forEach(botao => {
        botao.addEventListener("click", () => {
            const caso = casosDiariosAdmin.find(item => String(item.id) === String(botao.dataset.editDailyCase));
            if (caso) abrirFormularioCasoDiario(caso);
        });
    });

    secao.querySelectorAll("[data-delete-daily-case]").forEach(botao => {
        botao.addEventListener("click", () => removerCasoDiario(botao.dataset.deleteDailyCase));
    });

    inicializarOrganizacaoAdmin();
}

const renderizarGerenciadorAdminBase = renderizarGerenciadorAdmin;
renderizarGerenciadorAdmin = function renderizarGerenciadorAdminComCasosDiarios() {
    renderizarGerenciadorAdminBase();
    injetarCasosDiariosNoGerenciador();
    inicializarOrganizacaoAdmin();
    if (!casosDiariosAdminCarregados) carregarCasosDiariosAdmin();
};

function criarLinhaImagemCasoDiario(imagem = {}) {
    const linha = document.createElement("div");
    linha.className = "daily-admin-repeat-row daily-admin-image-row";
    linha.innerHTML = `
        <input class="daily-image-url" type="url" placeholder="URL da imagem" value="${escaparHTML(imagem.url || "")}">
        <input class="daily-image-file" type="file" accept="image/jpeg,image/png,image/webp" hidden>
        <button class="admin-secondary-button daily-image-upload" type="button"><i class="fa-solid fa-cloud-arrow-up"></i> Enviar imagem</button>
        <input class="daily-image-caption" type="text" placeholder="Legenda" value="${escaparHTML(imagem.legenda || "")}">
        <input class="daily-image-source" type="text" placeholder="Fonte ou instituição" value="${escaparHTML(imagem.fonte || "")}">
        <input class="daily-image-credit" type="text" placeholder="Crédito" value="${escaparHTML(imagem.credito || "")}">
        <input class="daily-image-link" type="url" placeholder="Link original da fonte" value="${escaparHTML(imagem.link || "")}">
        <label class="daily-sensitive-check"><input class="daily-image-sensitive" type="checkbox" ${imagem.sensivel ? "checked" : ""}> Imagem sensível</label>
        <button class="daily-remove-row" type="button" aria-label="Remover imagem">Remover</button>`;

    const arquivo = linha.querySelector(".daily-image-file");
    const enviar = linha.querySelector(".daily-image-upload");
    enviar.addEventListener("click", () => arquivo.click());
    arquivo.addEventListener("change", async () => {
        const selecionado = arquivo.files?.[0];
        if (!selecionado) return;
        const original = enviar.innerHTML;
        enviar.disabled = true;
        enviar.textContent = "Enviando...";
        try {
            const resultado = await enviarArquivoStorage("imagens", "casos-diarios/conteudo", selecionado);
            linha.querySelector(".daily-image-url").value = resultado.url;
        } catch (erro) {
            alert(erro?.message || "Não foi possível enviar a imagem.");
        } finally {
            enviar.disabled = false;
            enviar.innerHTML = original;
            arquivo.value = "";
        }
    });
    linha.querySelector(".daily-remove-row").addEventListener("click", () => linha.remove());
    return linha;
}

function criarLinhaFonteCasoDiario(fonte = {}) {
    const linha = document.createElement("div");
    linha.className = "daily-admin-repeat-row daily-admin-source-row";
    linha.innerHTML = `
        <input class="daily-source-title" type="text" placeholder="Nome da fonte" value="${escaparHTML(fonte.titulo || "")}">
        <input class="daily-source-url" type="url" placeholder="https://..." value="${escaparHTML(fonte.url || "")}">
        <button class="daily-remove-row" type="button" aria-label="Remover fonte">Remover</button>`;
    linha.querySelector(".daily-remove-row").addEventListener("click", () => linha.remove());
    return linha;
}

function abrirFormularioCasoDiario(dados = null) {
    let modal = document.getElementById("admin-daily-case-modal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "admin-daily-case-modal";
        modal.className = "admin-form-overlay";
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="admin-form-card daily-case-form-card">
            <button type="button" class="admin-close" id="daily-form-close" aria-label="Fechar">&times;</button>
            <span class="admin-eyebrow">GARIMPO SOMBRIO</span>
            <h2>${dados ? "Editar" : "Cadastrar"} Caso Diário</h2>
            <p class="daily-form-intro">Registro curto, verificável e separado dos dossiês extensos.</p>
            <form id="daily-case-form">
                <div class="daily-admin-grid">
                    <label>Título<input id="daily-title" type="text" maxlength="180" required value="${escaparHTML(dados?.titulo || "")}"></label>
                    <label>Categoria
                        <select id="daily-category">
                            ${["GARIMPO SOMBRIO", "CRIME REAL", "DESAPARECIMENTO", "MISTÉRIO", "CASO FAMILIAR", "SOBREVIVÊNCIA", "FALHA INVESTIGATIVA"].map(item => `<option value="${item}" ${dados?.categoria === item ? "selected" : ""}>${item}</option>`).join("")}
                        </select>
                    </label>
                    <label>Local<input id="daily-location" type="text" value="${escaparHTML(dados?.local || "")}"></label>
                    <label>Data ou período<input id="daily-date" type="text" value="${escaparHTML(dados?.data_caso || "")}"></label>
                    <label>Status do caso<input id="daily-case-status" type="text" value="${escaparHTML(dados?.status_caso || "EM INVESTIGAÇÃO")}"></label>
                    <label>Publicação
                        <select id="daily-publication-status">
                            <option value="rascunho" ${dados?.status_publicacao !== "publicado" ? "selected" : ""}>Rascunho</option>
                            <option value="publicado" ${dados?.status_publicacao === "publicado" ? "selected" : ""}>Publicado</option>
                        </select>
                    </label>
                </div>

                <div class="admin-upload-section">
                    <span class="admin-eyebrow">IMAGEM DE CAPA</span>
                    <input id="daily-cover-file" type="file" accept="image/jpeg,image/png,image/webp" hidden>
                    <button id="daily-cover-upload" class="admin-upload-button" type="button"><i class="fa-solid fa-cloud-arrow-up"></i> Escolher imagem</button>
                    <div id="daily-cover-preview" class="admin-image-preview"></div>
                    <label>URL da capa<input id="daily-cover" type="url" required value="${escaparHTML(dados?.imagem_capa || "")}"></label>
                </div>

                <label>Resumo curto<textarea id="daily-summary" rows="4" maxlength="700" required>${escaparHTML(dados?.resumo || "")}</textarea></label>
                <label>Relato do caso<textarea id="daily-content" rows="14" required placeholder="Escreva o caso de forma curta, imersiva e objetiva.">${escaparHTML(dados?.conteudo || "")}</textarea></label>
                <label>Cronologia opcional<textarea id="daily-chronology" rows="5">${escaparHTML(dados?.cronologia || "")}</textarea></label>
                <label>Evidências<textarea id="daily-evidence" rows="5" placeholder="Separe os itens com uma linha em branco.">${escaparHTML(Array.isArray(dados?.evidencias) ? dados.evidencias.join("\n\n") : "")}</textarea></label>
                <label>Hipóteses e controvérsias<textarea id="daily-theories" rows="5" placeholder="Separe os itens com uma linha em branco.">${escaparHTML(Array.isArray(dados?.hipoteses) ? dados.hipoteses.join("\n\n") : "")}</textarea></label>
                <label>Situação oficial<textarea id="daily-official-status" rows="4">${escaparHTML(dados?.situacao_oficial || "")}</textarea></label>

                <section class="daily-admin-repeat-section">
                    <div class="daily-repeat-heading"><div><span class="admin-eyebrow">IMAGENS INTERNAS</span><p>Inclua legenda, crédito e origem.</p></div><button id="daily-add-image" class="admin-secondary-button" type="button">+ Imagem</button></div>
                    <div id="daily-images-list"></div>
                </section>

                <section class="daily-admin-repeat-section">
                    <div class="daily-repeat-heading">
                        <div>
                            <span class="admin-eyebrow">FONTES</span>
                            <p>Informe o nome e o link de cada fonte. Separe fontes diferentes com uma linha em branco.</p>
                        </div>
                    </div>
                    <textarea
                        id="daily-sources-text"
                        rows="9"
                        placeholder="Nome da fonte&#10;https://exemplo.com/materia&#10;&#10;Nome da segunda fonte&#10;https://exemplo.com/documento"
                    >${escaparHTML(formatarFontesCasoDiario(dados?.fontes))}</textarea>
                </section>

                <button type="submit" class="admin-submit"><i class="fa-solid fa-floppy-disk"></i> Salvar Caso Diário</button>
            </form>
        </div>`;

    modal.classList.add("active");
    document.getElementById("daily-form-close").addEventListener("click", () => modal.classList.remove("active"));

    const listaImagens = document.getElementById("daily-images-list");
    (Array.isArray(dados?.imagens) ? dados.imagens : []).forEach(item =>
        listaImagens.appendChild(criarLinhaImagemCasoDiario(item))
    );

    document.getElementById("daily-add-image").addEventListener("click", () =>
        listaImagens.appendChild(criarLinhaImagemCasoDiario())
    );

    const capa = document.getElementById("daily-cover");
    atualizarPreviewImagemAdmin(capa.value, "#daily-cover-preview");
    document.getElementById("daily-cover-upload").addEventListener("click", () => document.getElementById("daily-cover-file").click());
    document.getElementById("daily-cover-file").addEventListener("change", async evento => {
        const arquivo = evento.target.files?.[0];
        if (!arquivo) return;
        const botao = document.getElementById("daily-cover-upload");
        definirEstadoUpload(botao, true, "Enviando imagem...");
        try {
            const resultado = await enviarArquivoStorage("imagens", "casos-diarios/capas", arquivo);
            capa.value = resultado.url;
            atualizarPreviewImagemAdmin(resultado.url, "#daily-cover-preview");
        } catch (erro) {
            alert(erro?.message || "Não foi possível enviar a capa.");
        } finally {
            definirEstadoUpload(botao, false);
            evento.target.value = "";
        }
    });
    capa.addEventListener("input", () => atualizarPreviewImagemAdmin(capa.value.trim(), "#daily-cover-preview"));
    document.getElementById("daily-case-form").addEventListener("submit", evento => salvarCasoDiario(evento, dados));
}

function coletarImagensCasoDiario() {
    return [...document.querySelectorAll("#daily-images-list .daily-admin-image-row")]
        .map(linha => ({
            url: linha.querySelector(".daily-image-url").value.trim(),
            legenda: linha.querySelector(".daily-image-caption").value.trim(),
            fonte: linha.querySelector(".daily-image-source").value.trim(),
            credito: linha.querySelector(".daily-image-credit").value.trim(),
            link: linha.querySelector(".daily-image-link").value.trim(),
            sensivel: linha.querySelector(".daily-image-sensitive").checked
        }))
        .filter(item => item.url);
}

function formatarFontesCasoDiario(fontes) {
    if (!Array.isArray(fontes)) return "";

    return fontes
        .map(fonte =>
            [
                String(fonte?.titulo || "").trim(),
                String(fonte?.url || "").trim()
            ]
                .filter(Boolean)
                .join("\n")
        )
        .filter(Boolean)
        .join("\n\n");
}

function coletarFontesCasoDiario() {
    const texto =
        document
            .getElementById("daily-sources-text")
            ?.value || "";

    return texto
        .split(/\n\s*\n/)
        .map(bloco => {
            const linhas =
                bloco
                    .split("\n")
                    .map(linha => linha.trim())
                    .filter(Boolean);

            const indiceUrl =
                linhas.findIndex(linha =>
                    /^https?:\/\//i.test(linha)
                );

            if (indiceUrl < 0) {
                return {
                    titulo: linhas.join(" "),
                    url: ""
                };
            }

            return {
                titulo:
                    linhas
                        .filter((_, indice) =>
                            indice !== indiceUrl
                        )
                        .join(" ")
                        .replace(
                            /^(nome da fonte|fonte)\s*:\s*/i,
                            ""
                        )
                        .trim(),
                url: linhas[indiceUrl]
            };
        })
        .filter(fonte =>
            fonte.titulo ||
            fonte.url
        );
}

async function salvarCasoDiario(evento, existente = null) {
    evento.preventDefault();
    const botao = evento.currentTarget.querySelector('button[type="submit"]');
    const original = botao.innerHTML;
    botao.disabled = true;
    botao.textContent = "Salvando...";

    try {
        if (!await obterSessaoAdmin()) throw new Error("Sua sessão administrativa expirou.");
        const titulo = document.getElementById("daily-title").value.trim();
        const resumo = document.getElementById("daily-summary").value.trim();
        const conteudo = document.getElementById("daily-content").value.trim();
        const imagemCapa = document.getElementById("daily-cover").value.trim();
        const fontes = coletarFontesCasoDiario();
        const statusPublicacao = document.getElementById("daily-publication-status").value;

        if (titulo.length < 3) throw new Error("Informe o título do caso.");
        if (resumo.length < 20) throw new Error("O resumo precisa ter pelo menos 20 caracteres.");
        if (conteudo.length < 50) throw new Error("O relato precisa ter pelo menos 50 caracteres.");
        if (!imagemCapa) throw new Error("Adicione a imagem de capa.");
        if (statusPublicacao === "publicado" && !fontes.some(fonte => fonte.titulo && fonte.url)) {
            throw new Error("Para publicar, adicione pelo menos uma fonte com nome e link.");
        }

        const agora = new Date().toISOString();
        const registro = {
            titulo,
            slug: existente?.slug || `${slugCasoDiario(titulo)}-${Date.now().toString(36)}`,
            categoria: document.getElementById("daily-category").value,
            local: document.getElementById("daily-location").value.trim() || null,
            data_caso: document.getElementById("daily-date").value.trim() || null,
            status_caso: document.getElementById("daily-case-status").value.trim() || "EM INVESTIGAÇÃO",
            status_publicacao: statusPublicacao,
            imagem_capa: imagemCapa,
            resumo,
            conteudo,
            cronologia: document.getElementById("daily-chronology").value.trim() || null,
            evidencias: normalizarEvidencias(document.getElementById("daily-evidence").value),
            hipoteses: normalizarEvidencias(document.getElementById("daily-theories").value),
            situacao_oficial: document.getElementById("daily-official-status").value.trim() || null,
            imagens: coletarImagensCasoDiario(),
            fontes,
            atualizado_em: undefined,
            updated_at: agora,
            publicado_em: statusPublicacao === "publicado" ? (existente?.publicado_em || agora) : null
        };
        delete registro.atualizado_em;

        const cliente = await obterClienteSupabase();
        const consulta = existente?.id
            ? cliente.from("casos_diarios").update(registro).eq("id", existente.id)
            : cliente.from("casos_diarios").insert([registro]);
        const { error } = await consulta.select().single();
        if (error) throw error;

        await concluirRascunhoAdmin();
        document.getElementById("admin-daily-case-modal").classList.remove("active");
        casosDiariosAdminCarregados = false;
        await carregarCasosDiariosAdmin();
        renderizarGerenciadorAdmin();
        alert(existente ? "Caso diário atualizado." : "Caso diário salvo.");
    } catch (erro) {
        console.error("Erro ao salvar caso diário.", erro);
        alert(erro?.message || "Não foi possível salvar o caso diário.");
    } finally {
        botao.disabled = false;
        botao.innerHTML = original;
    }
}

async function removerCasoDiario(id) {
    if (!confirm("Excluir este caso diário permanentemente?")) return;
    try {
        if (!await obterSessaoAdmin()) throw new Error("Sua sessão administrativa expirou.");
        const cliente = await obterClienteSupabase();
        const { error } = await cliente.from("casos_diarios").delete().eq("id", id);
        if (error) throw error;
        casosDiariosAdminCarregados = false;
        await carregarCasosDiariosAdmin();
        renderizarGerenciadorAdmin();
    } catch (erro) {
        console.error("Erro ao excluir caso diário.", erro);
        alert(erro?.message || "Não foi possível excluir o caso diário.");
    }
}

/* ==========================================================================
   GARIMPO SOMBRIO — VITRINE E ACERVO PÚBLICO
   ========================================================================== */

function criarPreviaCasoDiario(caso) {
    return `
        <a class="home-daily-card" href="garimpo.html?id=${encodeURIComponent(caso.id)}">
            <img src="${escaparHTML(caso.imagem_capa || "")}" alt="" loading="lazy">
            <div>
                <small>${escaparHTML(caso.categoria || "GARIMPO SOMBRIO")}</small>
                <strong>${escaparHTML(caso.titulo || "Registro sem título")}</strong>
                <p>${escaparHTML(caso.resumo || "Abrir registro do arquivo.")}</p>
            </div>
        </a>`;
}

async function carregarGarimpoPublico() {
    const feed = document.getElementById("home-daily-feed");
    const grade = document.getElementById("daily-archive-grid");
    const detalhe = document.getElementById("daily-case-detail");
    if (!feed && !grade && !detalhe) return;

    try {
        const cliente = await obterClienteSupabase();
        const { data, error } = await cliente
            .from("casos_diarios")
            .select("*")
            .eq("status_publicacao", "publicado")
            .order("publicado_em", { ascending: false });
        if (error) throw error;

        const casos = Array.isArray(data) ? data : [];

        if (feed) {
            feed.innerHTML = casos.length
                ? casos.slice(0, 6).map(criarPreviaCasoDiario).join("")
                : '<p class="home-preview-loading">O primeiro registro será arquivado em breve.</p>';
        }

        if (grade) {
            grade.innerHTML = casos.length
                ? casos.map(criarPreviaCasoDiario).join("")
                : '<p class="home-preview-loading">Nenhum caso curto publicado.</p>';
        }

        if (detalhe) {
            const id = new URLSearchParams(location.search).get("id");
            const caso = casos.find(item => String(item.id) === String(id));
            detalhe.hidden = !caso;
            document.getElementById("daily-archive-list")?.toggleAttribute("hidden", Boolean(caso));
            if (caso) renderizarDetalheCasoDiario(detalhe, caso);
        }
    } catch (erro) {
        console.error("Não foi possível abrir o Garimpo Sombrio.", erro);
        if (feed) feed.innerHTML = '<p class="home-preview-loading">Registros temporariamente indisponíveis.</p>';
        if (grade) grade.innerHTML = '<p class="home-preview-loading">Registros temporariamente indisponíveis.</p>';
    }
}

function renderizarDetalheCasoDiario(container, caso) {
    const fontes = Array.isArray(caso.fontes) ? caso.fontes : [];
    const imagens = Array.isArray(caso.imagens) ? caso.imagens : [];
    container.innerHTML = `
        <a class="archive-back" href="garimpo.html"><i class="fa-solid fa-arrow-left"></i> Voltar ao Garimpo</a>
        <article class="daily-reader">
            <header>
                <small>${escaparHTML(caso.categoria || "GARIMPO SOMBRIO")}</small>
                <h1>${escaparHTML(caso.titulo || "Registro")}</h1>
                <p>${escaparHTML([caso.local, caso.data_caso, caso.status_caso].filter(Boolean).join(" · "))}</p>
            </header>
            ${caso.imagem_capa ? `<img class="daily-reader-cover" src="${escaparHTML(caso.imagem_capa)}" alt="">` : ""}
            <p class="daily-reader-lead">${escaparHTML(caso.resumo || "")}</p>
            <div class="daily-reader-text">${escaparHTML(caso.conteudo || "").split(/\n{2,}/).map(paragrafo => `<p>${paragrafo.replace(/\n/g, "<br>")}</p>`).join("")}</div>
            ${imagens.map(imagem => `<figure><img src="${escaparHTML(imagem.url || "")}" alt="${escaparHTML(imagem.legenda || "")}" loading="lazy"><figcaption>${escaparHTML([imagem.legenda, imagem.credito].filter(Boolean).join(" · "))}</figcaption></figure>`).join("")}
            ${fontes.length ? `<section class="daily-reader-sources"><h2>Fontes</h2>${fontes.map(fonte => `<a href="${escaparHTML(fonte.url || "#")}" target="_blank" rel="noopener noreferrer">${escaparHTML(fonte.titulo || fonte.url || "Fonte")}</a>`).join("")}</section>` : ""}
        </article>`;
    window.ArquivoSEO?.aplicar({
        id: caso.id,
        titulo: caso.titulo,
        descricao: caso.resumo,
        imagem: caso.imagem_capa,
        caminho: "garimpo.html",
        secao: "Garimpo Sombrio",
        publicadoEm: caso.publicado_em,
        modificadoEm: caso.updated_at,
        createdAt: caso.created_at
    });
}


/* RASCUNHOS AUTOMÁTICOS — ADMINISTRAÇÃO */
const RASCUNHO_ADMIN_ESPERA=800;
let rascunhoAdmin=null,timerRascunhoAdmin=null;
function chaveRascunhoAdmin(tipo,id){return tipo+":"+(id==null||id===""?"novo":id);}
function tituloRascunhoAdmin(tipo){
 const ids={dossie:"admin-title",caso_diario:"daily-title",pericia:"admin-forensic-title",livro:"admin-book-title"};
 return document.getElementById(ids[tipo])?.value?.trim()||"Rascunho sem título";
}
function camposRascunhoAdmin(form){
 const usados={};
 return [...form.querySelectorAll("input,textarea,select")]
 .filter(c=>!["file","submit","button"].includes(c.type)).map(c=>{
  const base=c.id?"#"+c.id:c.name?'[name="'+c.name+'"]':"."+[...c.classList].join(".");
  const indice=usados[base]||0;usados[base]=indice+1;
  return{base,indice,valor:c.value,marcado:c.checked};
 });
}
function aplicarCamposRascunhoAdmin(form,campos){
 (Array.isArray(campos)?campos:[]).forEach(item=>{
  let lista=[];try{lista=[...form.querySelectorAll(item.base)];}catch(_){return;}
  const c=lista[item.indice||0];if(!c)return;
  if(c.type==="checkbox"||c.type==="radio")c.checked=Boolean(item.marcado);
  else c.value=item.valor??"";
 });
}
function extrasRascunhoAdmin(tipo){
 if(tipo==="dossie")return{blocos:coletarBlocosConteudoAdmin(),documentos:coletarDocumentosAdmin()};
 if(tipo==="livro")return{links:coletarLinksAfiliadosAdmin()};
 if(tipo==="caso_diario")return{imagens:coletarImagensCasoDiario(),fontes:coletarFontesCasoDiario()};
 return{};
}
function clonarSemEventosAdmin(seletor){
 const el=document.querySelector(seletor);if(!el)return null;
 const novo=el.cloneNode(true);el.replaceWith(novo);return novo;
}
function aplicarExtrasRascunhoAdmin(tipo,extras){
 if(!extras)return;
 if(tipo==="dossie"){
  const editor=document.getElementById("admin-content-blocks");
  if(editor&&Array.isArray(extras.blocos)){
   editor.replaceChildren();
   document.querySelectorAll("[data-add-content-block]").forEach(b=>{const n=b.cloneNode(true);b.replaceWith(n);});
   inicializarEditorConteudoAdmin({conteudo_blocos:extras.blocos});
  }
  if(Array.isArray(extras.documentos)){
   clonarSemEventosAdmin("#admin-document-file");clonarSemEventosAdmin("#admin-document-upload-button");
   inicializarDocumentosCaso({documentos:extras.documentos});
  }
 }
 if(tipo==="livro"&&Array.isArray(extras.links)){
  const lista=document.getElementById("admin-affiliate-links");
  const botao=clonarSemEventosAdmin("#admin-add-affiliate-link");
  if(lista){lista.replaceChildren();(extras.links.length?extras.links:[{}]).forEach(l=>adicionarLinhaAfiliado(lista,l));}
  botao?.addEventListener("click",()=>adicionarLinhaAfiliado(lista));
 }
 if(tipo==="caso_diario"){
  const imagens=document.getElementById("daily-images-list"),fontes=document.getElementById("daily-sources-list");
  if(imagens&&Array.isArray(extras.imagens)){imagens.replaceChildren();extras.imagens.forEach(i=>imagens.appendChild(criarLinhaImagemCasoDiario(i)));}
  if(fontes&&Array.isArray(extras.fontes)){fontes.replaceChildren();(extras.fontes.length?extras.fontes:[{}]).forEach(f=>fontes.appendChild(criarLinhaFonteCasoDiario(f)));}
  const caixaFontes=document.getElementById("daily-sources-text");
  if(caixaFontes&&Array.isArray(extras.fontes)&&!caixaFontes.value.trim()){
   caixaFontes.value=formatarFontesCasoDiario(extras.fontes);
  }
 }
}
function statusRascunhoAdmin(texto,falha=false){
 const el=rascunhoAdmin?.form?.querySelector("[data-draft-status]");if(!el)return;
 el.textContent=texto;el.style.color=falha?"#d88":"";
}
async function gravarRascunhoAdmin(manual=false){
 const atual=rascunhoAdmin;
 if(!atual||atual.restaurando||atual.finalizado||atual.salvando||!atual.form.isConnected)return false;
 clearTimeout(timerRascunhoAdmin);atual.salvando=true;
 try{
  const sessao=await obterSessaoAdmin();if(!sessao?.user)throw new Error("Sua sessão administrativa expirou.");
  const cliente=await obterClienteSupabase();
  const payload={versao:2,salvo_em:new Date().toISOString(),campos:camposRascunhoAdmin(atual.form),extras:extrasRascunhoAdmin(atual.tipo)};
  const{error}=await cliente.from("admin_drafts").upsert({
   user_id:sessao.user.id,draft_key:atual.chave,content_type:atual.tipo,
   record_id:atual.id==null?null:String(atual.id),title:tituloRascunhoAdmin(atual.tipo),
   payload,updated_at:new Date().toISOString()
  },{onConflict:"user_id,draft_key"});
  if(error)throw error;
  statusRascunhoAdmin(manual?"Rascunho salvo.":"Rascunho salvo automaticamente.");
  return true;
 }catch(erro){
  console.error("Falha ao salvar rascunho.",erro);statusRascunhoAdmin("Falha ao salvar o rascunho.",true);
  if(manual)alert(erro?.message||"Não foi possível salvar o rascunho.");
  return false;
 }finally{if(rascunhoAdmin===atual)atual.salvando=false;}
}
function agendarRascunhoAdmin(){
 if(!rascunhoAdmin||rascunhoAdmin.restaurando||rascunhoAdmin.finalizado)return;
 statusRascunhoAdmin("Salvamento automático pendente...");clearTimeout(timerRascunhoAdmin);
 timerRascunhoAdmin=setTimeout(()=>gravarRascunhoAdmin(false),RASCUNHO_ADMIN_ESPERA);
}
async function apagarRascunhoAdmin(descartar=false){
 const atual=rascunhoAdmin;if(!atual)return true;
 if(descartar&&!confirm("Descartar este rascunho? O conteúdo não publicado será perdido."))return false;
 clearTimeout(timerRascunhoAdmin);atual.finalizado=true;
 try{
  const sessao=await obterSessaoAdmin();if(!sessao?.user)throw new Error("Sua sessão administrativa expirou.");
  const cliente=await obterClienteSupabase();
  const{error}=await cliente.from("admin_drafts").delete().eq("user_id",sessao.user.id).eq("draft_key",atual.chave);
  if(error)throw error;
  if(descartar){atual.modal.classList.remove("active");rascunhoAdmin=null;}return true;
 }catch(erro){
  atual.finalizado=false;console.error("Falha ao apagar rascunho.",erro);
  if(descartar)alert(erro?.message||"Não foi possível descartar o rascunho.");return false;
 }
}
async function concluirRascunhoAdmin(){await apagarRascunhoAdmin(false);}
async function recuperarRascunhoAdmin(){
 const atual=rascunhoAdmin;
 try{
  const sessao=await obterSessaoAdmin();if(!sessao?.user)return;
  const cliente=await obterClienteSupabase();
  const{data,error}=await cliente.from("admin_drafts").select("payload,updated_at")
   .eq("user_id",sessao.user.id).eq("draft_key",atual.chave).maybeSingle();
  if(error)throw error;if(!data?.payload||rascunhoAdmin!==atual)return;
  aplicarCamposRascunhoAdmin(atual.form,data.payload.campos);aplicarExtrasRascunhoAdmin(atual.tipo,data.payload.extras);
  [["admin-image","#admin-image-preview"],["admin-book-cover","#admin-book-cover-preview"],["daily-cover","#daily-cover-preview"]].forEach(([id,seletor])=>{
   const valor=document.getElementById(id)?.value;if(valor)atualizarPreviewImagemAdmin(valor,seletor);
  });
  statusRascunhoAdmin("Rascunho recuperado de "+new Date(data.updated_at).toLocaleString("pt-BR")+".");
 }catch(erro){console.error("Falha ao recuperar rascunho.",erro);statusRascunhoAdmin("Não foi possível recuperar o rascunho.",true);}
 finally{if(rascunhoAdmin===atual)atual.restaurando=false;}
}
function prepararRascunhoAdmin(tipo,id,form,modal,fechar){
 if(!form||!modal)return;
 const submit=form.querySelector('button[type="submit"]'),acoes=document.createElement("div");
 acoes.className="admin-draft-actions";acoes.style.cssText="display:flex;flex-wrap:wrap;gap:10px;align-items:center";
 acoes.innerHTML='<button type="button" class="admin-secondary-button" data-save-draft><i class="fa-regular fa-floppy-disk"></i> Salvar rascunho</button><button type="button" class="admin-secondary-button" data-discard-draft><i class="fa-regular fa-trash-can"></i> Descartar</button><small data-draft-status aria-live="polite"></small>';
 submit?.before(acoes);
 rascunhoAdmin={tipo,id,chave:chaveRascunhoAdmin(tipo,id),form,modal,restaurando:true,finalizado:false,salvando:false};
 form.addEventListener("input",agendarRascunhoAdmin);form.addEventListener("change",agendarRascunhoAdmin);
 form.addEventListener("click",e=>{
  if(e.target.closest("[data-add-content-block],.admin-block-remove,.admin-document-remove,#admin-add-affiliate-link,.admin-affiliate-remove,#daily-add-image,.daily-remove-row"))setTimeout(agendarRascunhoAdmin,0);
 });
 acoes.querySelector("[data-save-draft]").addEventListener("click",async()=>{
  const salvo=await gravarRascunhoAdmin(true);
  if(salvo&&rascunhoAdmin===rascunhoAdmin){
   modal.classList.remove("active");
   rascunhoAdmin=null;
  }
 });
 acoes.querySelector("[data-discard-draft]").addEventListener("click",()=>apagarRascunhoAdmin(true));
 fechar?.addEventListener("click",async e=>{
  e.preventDefault();e.stopImmediatePropagation();await gravarRascunhoAdmin(false);
  modal.classList.remove("active");rascunhoAdmin=null;
 },true);
 recuperarRascunhoAdmin();
}
const abrirFormularioAdminSemRascunho=abrirFormularioAdmin;
abrirFormularioAdmin=function(tipo,dados=null){
 abrirFormularioAdminSemRascunho(tipo,dados);
 const modal=document.getElementById("admin-form-modal");
 prepararRascunhoAdmin(tipo==="caso"?"dossie":tipo==="pericia"?"pericia":"livro",dados?.id??null,
  document.getElementById("admin-content-form"),modal,document.getElementById("admin-form-close"));
};
const abrirFormularioCasoDiarioSemRascunho=abrirFormularioCasoDiario;
abrirFormularioCasoDiario=function(dados=null){
 abrirFormularioCasoDiarioSemRascunho(dados);
 const modal=document.getElementById("admin-daily-case-modal");
 prepararRascunhoAdmin("caso_diario",dados?.id??null,document.getElementById("daily-case-form"),modal,document.getElementById("daily-form-close"));
};
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")gravarRascunhoAdmin(false);});
window.addEventListener("pagehide",()=>gravarRascunhoAdmin(false));

document.addEventListener("DOMContentLoaded", carregarGarimpoPublico);

// Aceita links públicos de vídeo de qualquer plataforma no editor administrativo.
function validarUrlVideoAdmin(url) {
    const valor = String(url || "").trim();

    if (!valor || /<\/?(?:iframe|video|script)\b/i.test(valor)) {
        return false;
    }

    try {
        const endereco = new URL(valor);

        return ["http:", "https:"]
            .includes(endereco.protocol);

    } catch (erro) {
        return false;
    }
}
