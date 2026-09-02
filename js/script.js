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
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

let clienteSupabase = null;
let promessaSupabaseSDK = null;
let casosSupabase = [];


/* ==========================================================================
   CONFIGURAÇÕES
   ========================================================================== */

const CONFIG = {
    STORAGE_CASOS: "arquivo_sombrio_casos",
    STORAGE_LIVROS: "arquivo_sombrio_livros",
    STORAGE_COMENTARIOS: "arquivo_sombrio_comentarios",
    STORAGE_SUGESTOES: "arquivo_sombrio_sugestoes"
};


/* ==========================================================================
   LIVROS INICIAIS
   ========================================================================== */

const livrosIniciais = [
    {
        id: 1,
        titulo: "Casos de Rotina: Perícia Forense em Ação",
        autor: "Dr. A. Forense",
        capa: "imagens/livros/pericia.jpg",
        descricao:
            "Uma introdução aos métodos científicos utilizados na análise de vestígios e cenas de crime.",
        tag: "PERÍCIA & CRIMINOLOGIA"
    },

    {
        id: 2,
        titulo: "Compêndio de Lendas Urbanas e Mitos",
        autor: "H. P. Silva",
        capa: "imagens/livros/lendas.jpg",
        descricao:
            "Uma compilação sobre a origem histórica de mitos, lendas urbanas e folclore obscuro.",
        tag: "FOLCLORE & MISTÉRIOS"
    }
];


/* ==========================================================================
   INICIALIZAÇÃO
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {

    inicializarMenuMobile();
    inicializarFiltrosForenses();
    inicializarNavegacaoInterna();

    carregarCasosSupabase();
    carregarLivros();
    carregarComentarios();

    inicializarForum();
    inicializarSugestao();
    inicializarAdmin();

    inicializarModais();

});


/* ==========================================================================
   SUPABASE / AUTENTICAÇÃO
   ========================================================================== */

function carregarSupabaseSDK() {

    if (
        window.supabase &&
        typeof window.supabase.createClient === "function"
    ) {
        return Promise.resolve();
    }

    if (promessaSupabaseSDK) {
        return promessaSupabaseSDK;
    }

    promessaSupabaseSDK = new Promise((resolve, reject) => {

        const scriptExistente =
            document.querySelector(
                'script[data-arquivo-sombrio-supabase="true"]'
            );

        if (scriptExistente) {

            scriptExistente.addEventListener(
                "load",
                () => resolve(),
                { once: true }
            );

            scriptExistente.addEventListener(
                "error",
                () => reject(
                    new Error("Falha ao carregar o Supabase.")
                ),
                { once: true }
            );

            return;
        }

        const script =
            document.createElement("script");

        script.src = SUPABASE_SDK_URL;
        script.async = true;
        script.dataset.arquivoSombrioSupabase = "true";

        script.addEventListener(
            "load",
            () => resolve(),
            { once: true }
        );

        script.addEventListener(
            "error",
            () => reject(
                new Error("Falha ao carregar o Supabase.")
            ),
            { once: true }
        );

        document.head.appendChild(script);
    });

    return promessaSupabaseSDK;
}


async function obterClienteSupabase() {

    if (clienteSupabase) {
        return clienteSupabase;
    }

    await carregarSupabaseSDK();

    if (
        !window.supabase ||
        typeof window.supabase.createClient !== "function"
    ) {
        throw new Error(
            "A biblioteca do Supabase não ficou disponível."
        );
    }

    clienteSupabase =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_PUBLISHABLE_KEY,
            {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                }
            }
        );

    return clienteSupabase;
}


async function obterSessaoAdmin() {

    try {

        const supabaseClient =
            await obterClienteSupabase();

        const {
            data,
            error
        } =
            await supabaseClient.auth.getSession();

        if (error) {

            console.warn(
                "Não foi possível verificar a sessão administrativa.",
                error
            );

            return null;
        }

        return data?.session || null;

    } catch (erro) {

        console.error(
            "Falha ao inicializar a autenticação administrativa.",
            erro
        );

        return null;
    }
}


async function sairAdmin() {

    try {

        const supabaseClient =
            await obterClienteSupabase();

        await supabaseClient.auth.signOut();

    } catch (erro) {

        console.warn(
            "Não foi possível encerrar a sessão no Supabase.",
            erro
        );
    }

    document
        .getElementById("admin-manager")
        ?.classList.remove("active");

    fecharFormularioAdmin();
}


/* ==========================================================================
   UTILITÁRIOS
   ========================================================================== */

/**
 * Lê um array do localStorage com segurança.
 * Se houver JSON inválido, retorna array vazio em vez de quebrar o site.
 */
function lerStorage(chave) {

    try {

        const valor = localStorage.getItem(chave);

        if (!valor) {
            return [];
        }

        const dados = JSON.parse(valor);

        return Array.isArray(dados) ? dados : [];

    } catch (erro) {

        console.warn(
            `Não foi possível ler o armazenamento "${chave}".`,
            erro
        );

        return [];
    }
}


/**
 * Salva dados no localStorage com tratamento de erro.
 */
function salvarStorage(chave, dados) {

    try {

        localStorage.setItem(
            chave,
            JSON.stringify(dados)
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


/**
 * Escapa caracteres HTML para evitar que dados digitados pelo usuário
 * sejam interpretados como HTML.
 */
function escaparHTML(valor) {

    if (valor === null || valor === undefined) {
        return "";
    }

    return String(valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/**
 * Normaliza evidências e listas de texto.
 */
function normalizarEvidencias(evidencias) {

    if (Array.isArray(evidencias)) {

        return evidencias
            .map(item => String(item).trim())
            .filter(Boolean);
    }

    if (typeof evidencias === "string") {

        return evidencias
            .split("\n")
            .map(item => item.trim())
            .filter(Boolean);
    }

    return [];
}


/**
 * Retorna os casos iniciais do arquivo dados/caso.js.
 */
function obterCasosIniciais() {

    if (
        typeof casosArquivo !== "undefined" &&
        Array.isArray(casosArquivo)
    ) {
        return casosArquivo;
    }

    return [];
}


/* ==========================================================================
   UPLOADS — SUPABASE STORAGE
   ========================================================================== */

const STORAGE_BUCKET_IMAGENS = "imagens";
const STORAGE_BUCKET_DOCUMENTOS = "documentos";


function limparNomeArquivo(nome) {

    const partes =
        String(nome || "arquivo").split(".");

    const extensao =
        partes.length > 1
            ? partes.pop().toLowerCase()
            : "";

    const base =
        partes
            .join(".")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9_-]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .toLowerCase() || "arquivo";

    return extensao
        ? `${base}.${extensao}`
        : base;
}


function criarCaminhoStorage(pasta, arquivo) {

    const nomeSeguro =
        limparNomeArquivo(arquivo.name);

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

    return documentos
        .map(documento => ({

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
                ) || 0

        }))
        .filter(
            documento =>
                documento.nome &&
                documento.url
        );
}


function criarItemDocumentoAdmin(documento) {

    return `
        <div
            class="admin-document-item"
            data-document-name="${escaparHTML(documento.nome)}"
            data-document-url="${escaparHTML(documento.url)}"
            data-document-path="${escaparHTML(documento.caminho)}"
            data-document-bucket="${escaparHTML(documento.bucket)}"
            data-document-type="${escaparHTML(documento.tipo)}"
            data-document-size="${escaparHTML(documento.tamanho)}"
        >

            <div class="admin-document-info">

                <i class="fa-solid fa-file-lines"></i>

                <div>

                    <strong>
                        ${escaparHTML(documento.nome)}
                    </strong>

                    <small>
                        ${escaparHTML(
                            documento.tipo ||
                            "Documento"
                        )}

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

            <a
                href="${escaparHTML(documento.url)}"
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
    `;
}


function coletarDocumentosAdmin() {

    return Array
        .from(
            document.querySelectorAll(
                "#admin-documents-list .admin-document-item"
            )
        )
        .map(item => ({

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
                ) || 0

        }))
        .filter(
            documento =>
                documento.nome &&
                documento.url
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
        "image/webp",
        "image/gif"
    ];

    if (
        !tiposPermitidos.includes(
            arquivo.type
        )
    ) {

        alert(
            "Escolha uma imagem JPG, PNG, WEBP ou GIF."
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
    dados = null
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
        () => inputArquivo.click()
    );

    inputArquivo.addEventListener(
        "change",
        () =>
            processarUploadImagemAdmin({
                inputArquivo,
                inputUrl,
                preview:
                    "#admin-image-preview",
                pasta: "casos",
                botao
            })
    );
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


function obterTodosCasos() {

    const iniciais =
        obterCasosIniciais();

    const idsSupabase =
        new Set(
            casosSupabase.map(
                caso =>
                    Number(caso.id)
            )
        );

    const casosIniciaisFiltrados =
        iniciais.filter(
            caso =>
                !idsSupabase.has(
                    Number(caso.id)
                )
        );

    return [
        ...casosSupabase,
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

            <a
                href="caso.html?id=${encodeURIComponent(caso.id)}"
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


function carregarForense(
    filtro = "todos"
) {

    const grid =
        document.getElementById(
            "grid-forense"
        );

    if (!grid) {
        return;
    }

    let casos =
        obterTodosCasos()
            .filter(
                caso =>
                    String(
                        caso.categoria
                    ).toUpperCase() ===
                    "PERÍCIA"
            );

    if (filtro !== "todos") {

        casos =
            casos.filter(
                caso =>
                    identificarTipoForense(
                        caso
                    ) === filtro
            );
    }

    if (casos.length === 0) {

        const mensagens = {

            papiloscopia: {
                titulo:
                    "Nenhum arquivo de papiloscopia",
                texto:
                    "Ainda não existem conteúdos de identificação por impressões digitais nesta categoria."
            },

            vestigios: {
                titulo:
                    "Nenhuma análise de vestígios",
                texto:
                    "Ainda não existem conteúdos de análise química ou vestígios cadastrados nesta categoria."
            },

            biologica: {
                titulo:
                    "Nenhuma evidência biológica",
                texto:
                    "Ainda não existem conteúdos de DNA ou evidências biológicas cadastrados nesta categoria."
            },

            todos: {
                titulo:
                    "Nenhum laudo disponível",
                texto:
                    "O arquivo pericial ainda não possui documentos publicados."
            }
        };

        const mensagem =
            mensagens[filtro] ||
            mensagens.todos;

        grid.innerHTML = `
            <div class="empty-state">

                <i class="fa-solid fa-flask"></i>

                <h3>
                    ${escaparHTML(
                        mensagem.titulo
                    )}
                </h3>

                <p>
                    ${escaparHTML(
                        mensagem.texto
                    )}
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


function inicializarFiltrosForenses() {

    const botoes =
        document.querySelectorAll(
            "[data-forensic-filter]"
        );

    if (!botoes.length) {
        return;
    }

    botoes.forEach(
        botao => {

            botao.addEventListener(
                "click",
                evento => {

                    evento.preventDefault();

                    const filtro =
                        botao.dataset
                            .forensicFilter;

                    botoes.forEach(
                        item => {
                            item.classList.remove(
                                "active"
                            );
                        }
                    );

                    botao.classList.add(
                        "active"
                    );

                    carregarForense(
                        filtro
                    );

                    const grid =
                        document.getElementById(
                            "grid-forense"
                        );

                    grid?.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
                }
            );
        }
    );
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


function obterTodosLivros() {

    const personalizados =
        lerStorage(
            CONFIG.STORAGE_LIVROS
        );

    const idsPersonalizados =
        new Set(
            personalizados.map(
                livro => Number(livro.id)
            )
        );

    const iniciaisFiltrados =
        livrosIniciais.filter(
            livro =>
                !idsPersonalizados.has(
                    Number(livro.id)
                )
        );

    return [
        ...personalizados,
        ...iniciaisFiltrados
    ];
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


    function normalizarCategoria(valor) {

        return String(valor || "")
            .normalize("NFD")
            .replace(
                /[\u0300-\u036f]/g,
                ""
            )
            .toLowerCase()
            .trim();
    }


    function identificarCategoria(livro) {

        const categoriaOriginal =
            livro.categoriaLivro ||
            livro.categoria ||
            livro.tag ||
            "";

        const categoria =
            normalizarCategoria(
                categoriaOriginal
            );


        if (
            categoria.includes(
                "crime real"
            ) ||
            categoria.includes(
                "true crime"
            )
        ) {

            return {
                id: "crimes-reais",
                nome: "Crimes Reais"
            };
        }


        if (
            categoria.includes(
                "terror"
            ) ||
            categoria.includes(
                "horror"
            )
        ) {

            return {
                id: "terror",
                nome: "Terror"
            };
        }


        if (
            categoria.includes(
                "mister"
            )
        ) {

            return {
                id: "misterios",
                nome: "Mistérios"
            };
        }


        if (
            categoria.includes(
                "serial"
            )
        ) {

            return {
                id: "serial-killers",
                nome: "Serial Killers"
            };
        }


        if (
            categoria.includes(
                "forense"
            ) ||
            categoria.includes(
                "pericia"
            )
        ) {

            return {
                id: "forense",
                nome: "Ciência Forense"
            };
        }


        if (
            categoria.includes(
                "psicologia"
            ) ||
            categoria.includes(
                "criminologia"
            )
        ) {

            return {
                id:
                    "psicologia-criminal",

                nome:
                    "Psicologia Criminal"
            };
        }


        if (
            categoria.includes(
                "sem solucao"
            ) ||
            categoria.includes(
                "nao solucionado"
            )
        ) {

            return {
                id:
                    "casos-sem-solucao",

                nome:
                    "Casos sem Solução"
            };
        }


        if (
            categoria.includes(
                "lenda"
            ) ||
            categoria.includes(
                "folclore"
            )
        ) {

            return {
                id: "lendas",
                nome: "Lendas & Folclore"
            };
        }


        if (
            categoria.includes(
                "arquivo"
            ) ||
            categoria.includes(
                "segredo"
            )
        ) {

            return {
                id:
                    "arquivos-secretos",

                nome:
                    "Arquivos Secretos"
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
        function(livro) {

            const categoria =
                identificarCategoria(
                    livro
                );

            if (
                !categorias.has(
                    categoria.id
                )
            ) {

                categorias.set(
                    categoria.id,
                    {
                        id:
                            categoria.id,

                        nome:
                            categoria.nome,

                        livros:
                            []
                    }
                );
            }

            categorias
                .get(
                    categoria.id
                )
                .livros
                .push(
                    livro
                );
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
                                function(categoria) {

                                    return `
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
                                    `;
                                }
                            )
                            .join("")
                    }

                </div>


                <div class="bookshelf-base"></div>

            </div>
        `;


        const lombadas =
            grid.querySelectorAll(
                ".bookshelf-spine"
            );


        lombadas.forEach(
            function(lombada) {

                lombada.addEventListener(
                    "click",
                    function() {

                        const id =
                            lombada.dataset
                                .categoria;

                        const categoria =
                            categorias.get(
                                id
                            );

                        if (!categoria) {
                            return;
                        }

                        renderizarCategoria(
                            categoria
                        );
                    }
                );
            }
        );
    }


    function renderizarCategoria(
        categoria
    ) {

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


                <div class="books-category-grid">

                    ${
                        categoria.livros
                            .map(
                                function(livro) {

                                    return `
                                        <article class="book-card">

                                            <div class="book-image">

                                                <img
                                                    src="${escaparHTML(
                                                        livro.capa ||
                                                        ""
                                                    )}"
                                                    alt="${escaparHTML(
                                                        livro.titulo ||
                                                        "Livro"
                                                    )}"
                                                    loading="lazy"
                                                    onerror="this.src='https://placehold.co/300x450/111/777?text=Arquivo+Sombrio'"
                                                >

                                                <span class="book-label">
                                                    RECOMENDADO
                                                </span>

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

                                                <p class="book-description">
                                                    ${escaparHTML(
                                                        livro.descricao ||
                                                        ""
                                                    )}
                                                </p>

                                                ${renderizarLinksAfiliadosLivro(
                                                    livro
                                                )}

                                            </div>

                                        </article>
                                    `;
                                }
                            )
                            .join("")
                    }

                </div>

            </div>
        `;


        const voltar =
            document.getElementById(
                "voltar-estantes"
            );

        if (voltar) {

            voltar.addEventListener(
                "click",
                renderizarEstantes
            );
        }
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
   FÓRUM
   ========================================================================== */

function inicializarForum() {

    const formulario =
        document.getElementById(
            "form-forum"
        );

    if (!formulario) {
        return;
    }

    formulario.addEventListener(
        "submit",
        adicionarComentario
    );
}


function carregarComentarios() {

    const lista =
        document.getElementById(
            "lista-comentarios"
        );

    if (!lista) {
        return;
    }

    const comentarios =
        lerStorage(
            CONFIG.STORAGE_COMENTARIOS
        );

    if (comentarios.length === 0) {

        lista.innerHTML = `
            <div class="empty-state">

                <i class="fa-solid fa-comments"></i>

                <h3>
                    Nenhuma análise publicada
                </h3>

                <p>
                    Seja o primeiro pesquisador a registrar uma observação.
                </p>

            </div>
        `;

        return;
    }

    lista.innerHTML =
        comentarios
            .map(
                comentario => `

                    <article class="comment-card">

                        <div class="comment-header">

                            <strong>
                                <i class="fa-solid fa-user-secret"></i>
                                ${escaparHTML(
                                    comentario.nome
                                )}
                            </strong>

                            <time>
                                ${escaparHTML(
                                    comentario.data
                                )}
                            </time>

                        </div>

                        <p>
                            ${escaparHTML(
                                comentario.mensagem
                            )}
                        </p>

                    </article>

                `
            )
            .join("");
}


function adicionarComentario(evento) {

    evento.preventDefault();

    const nome =
        document
            .getElementById(
                "forum-nome"
            )
            ?.value
            .trim();

    const email =
        document
            .getElementById(
                "forum-email"
            )
            ?.value
            .trim();

    const mensagem =
        document
            .getElementById(
                "forum-mensagem"
            )
            ?.value
            .trim();

    if (
        !nome ||
        !email ||
        !mensagem
    ) {
        return;
    }

    const novoComentario = {

        id:
            Date.now(),

        nome,

        email,

        mensagem,

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

    const comentarios =
        lerStorage(
            CONFIG.STORAGE_COMENTARIOS
        );

    comentarios.unshift(
        novoComentario
    );

    if (
        salvarStorage(
            CONFIG.STORAGE_COMENTARIOS,
            comentarios
        )
    ) {

        evento.target.reset();

        carregarComentarios();

        mostrarMensagem(
            "comentario-sucesso",
            "Sua análise foi publicada no arquivo."
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
            .trim() || "";

    if (!nome || !titulo) {
        return;
    }

    const sugestoes =
        lerStorage(
            CONFIG.STORAGE_SUGESTOES
        );

    sugestoes.unshift({

        id:
            Date.now(),

        nome,

        titulo,

        descricao,

        data:
            new Date()
                .toLocaleString(
                    "pt-BR"
                )
    });

    salvarStorage(
        CONFIG.STORAGE_SUGESTOES,
        sugestoes
    );

    evento.target.reset();

    mostrarMensagem(
        "mensagem-sucesso",
        `Obrigado, ${nome}. Sua sugestão foi enviada para análise.`
    );
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

    setTimeout(
        () => {

            elemento.classList.remove(
                "visible"
            );

        },
        6000
    );
}
/* ==========================================================================
   PAINEL ADMINISTRATIVO
   ========================================================================== */

function inicializarAdmin() {

    const abrir =
        document.getElementById("btn-open-admin");

    const abrirMobile =
        document.getElementById("mobile-btn-admin");

    const fechar =
        document.getElementById("close-modal");

    const formulario =
        document.getElementById("form-admin-login");


    if (abrir) {

        abrir.addEventListener(
            "click",
            abrirPainelAdmin
        );
    }


    if (abrirMobile) {

        abrirMobile.addEventListener(
            "click",
            evento => {

                evento.preventDefault();

                fecharMenuMobile();

                abrirPainelAdmin();

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
}


function fecharMenuMobile() {

    const sidebar =
        document.getElementById("sidebar-menu");

    const overlay =
        document.getElementById("mobile-overlay");

    if (sidebar) {
        sidebar.classList.remove("active");
    }

    if (overlay) {
        overlay.classList.remove("active");
    }

    document.body.classList.remove(
        "menu-open"
    );
}


async function abrirPainelAdmin() {

    const modal =
        document.getElementById("modal-admin");

    if (!modal) {
        return;
    }

    /*
     * Se já houver uma sessão válida no Supabase,
     * não será necessário digitar a senha novamente.
     */
    const sessao =
        await obterSessaoAdmin();

    if (sessao) {

        fecharModalAdmin();

        renderizarGerenciadorAdmin();

        return;
    }

    modal.classList.add("active");

    const email =
        document.getElementById("admin-email");

    const senha =
        document.getElementById("admin-pass");

    setTimeout(
        () => {

            if (email) {
                email.focus();
                return;
            }

            senha?.focus();

        },
        100
    );
}


function fecharModalAdmin() {

    const modal =
        document.getElementById("modal-admin");

    if (!modal) {
        return;
    }

    modal.classList.remove("active");
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
            .getElementById("admin-email")
            ?.value
            .trim();

    const senha =
        document
            .getElementById("admin-pass")
            ?.value;

    if (!email || !senha) {

        mostrarMensagem(
            "admin-login-erro",
            "Informe o e-mail e a senha."
        );

        return;
    }

    const botao =
        formulario?.querySelector(
            'button[type="submit"]'
        );

    const textoOriginal =
        botao?.innerHTML;

    if (botao) {

        botao.disabled = true;

        botao.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Verificando...
        `;
    }

    try {

        const supabaseClient =
            await obterClienteSupabase();

        const {
            data,
            error
        } =
            await supabaseClient.auth.signInWithPassword({
                email,
                password: senha
            });

        if (
            error ||
            !data?.session
        ) {

            console.warn(
                "Falha no login administrativo.",
                error
            );

            mostrarMensagem(
                "admin-login-erro",
                "E-mail ou senha inválidos."
            );

            return;
        }

        formulario?.reset();

        fecharModalAdmin();

        renderizarGerenciadorAdmin();

    } catch (erro) {

        console.error(
            "Erro ao autenticar no Supabase.",
            erro
        );

        mostrarMensagem(
            "admin-login-erro",
            "Não foi possível conectar ao serviço de autenticação."
        );

    } finally {

        if (botao) {

            botao.disabled = false;

            if (textoOriginal !== undefined) {
                botao.innerHTML = textoOriginal;
            }
        }
    }
}


/* ==========================================================================
   GERENCIADOR ADMINISTRATIVO
   ========================================================================== */

function renderizarGerenciadorAdmin() {

    let painel =
        document.getElementById("admin-manager");

    /*
     * Criamos o painel dinamicamente.
     * Isso evita exigir uma estrutura enorme no index.html.
     */

    if (!painel) {

        painel =
            document.createElement("div");

        painel.id = "admin-manager";

        painel.className =
            "admin-manager-overlay";

        document.body.appendChild(painel);
    }

    const casos =
        lerStorage(
            CONFIG.STORAGE_CASOS
        );

    const livros =
        lerStorage(
            CONFIG.STORAGE_LIVROS
        );

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


            <div class="admin-actions">

                <button
                    type="button"
                    class="admin-action-button"
                    id="admin-new-case"
                >
                    <i class="fa-solid fa-folder-plus"></i>
                    Novo Dossiê
                </button>

                <button
                    type="button"
                    class="admin-action-button"
                    id="admin-new-book"
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


            <section class="admin-list-section">

                <h3>
                    Dossiês personalizados
                </h3>

                <div class="admin-list">

                    ${
                        casos.length === 0

                        ? `
                            <p class="admin-empty">
                                Nenhum dossiê personalizado.
                            </p>
                          `

                        : casos.map(caso => `

                            <div class="admin-item">

                                <div>

                                    <strong>
                                        ${escaparHTML(caso.titulo)}
                                    </strong>

                                    <small>
                                        ${escaparHTML(caso.categoria)}
                                    </small>

                                </div>

                                <div class="admin-item-buttons">

                                    <button
                                        type="button"
                                        data-edit-case="${caso.id}"
                                    >
                                        Editar
                                    </button>

                                    <button
                                        type="button"
                                        data-delete-case="${caso.id}"
                                    >
                                        Excluir
                                    </button>

                                </div>

                            </div>

                        `).join("")
                    }

                </div>

            </section>


            <section class="admin-list-section">

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

                            <div class="admin-item">

                                <div>

                                    <strong>
                                        ${escaparHTML(livro.titulo)}
                                    </strong>

                                    <small>
                                        ${escaparHTML(livro.autor)}
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


    painel.classList.add("active");


    document
        .getElementById("admin-manager-close")
        ?.addEventListener(
            "click",
            () => painel.classList.remove("active")
        );


    document
        .getElementById("admin-new-case")
        ?.addEventListener(
            "click",
            () => abrirFormularioAdmin("caso")
        );


    document
        .getElementById("admin-new-book")
        ?.addEventListener(
            "click",
            () => abrirFormularioAdmin("livro")
        );


    document
        .getElementById("admin-logout")
        ?.addEventListener(
            "click",
            sairAdmin
        );


    painel
        .querySelectorAll("[data-edit-case]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => editarCaso(
                    Number(button.dataset.editCase)
                )
            );

        });


    painel
        .querySelectorAll("[data-delete-case]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => removerCaso(
                    Number(button.dataset.deleteCase)
                )
            );

        });


    painel
        .querySelectorAll("[data-edit-book]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => editarLivro(
                    Number(button.dataset.editBook)
                )
            );

        });


    painel
        .querySelectorAll("[data-delete-book]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => removerLivro(
                    Number(button.dataset.deleteBook)
                )
            );

        });
}


/* ==========================================================================
   FORMULÁRIOS ADMINISTRATIVOS
   ========================================================================== */

function abrirFormularioAdmin(tipo, dados = null) {

    let modal =
        document.getElementById("admin-form-modal");

    if (!modal) {

        modal =
            document.createElement("div");

        modal.id =
            "admin-form-modal";

        modal.className =
            "admin-form-overlay";

        document.body.appendChild(modal);
    }


    const caso =
        tipo === "caso";

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
                ${caso ? "NOVO DOSSIÊ" : "NOVA RECOMENDAÇÃO"}
            </span>

            <h2>
                ${dados ? "Editar" : "Cadastrar"}
                ${caso ? " Dossiê" : " Livro"}
            </h2>


            <form id="admin-content-form">

                <input
                    type="hidden"
                    id="admin-edit-id"
                    value="${dados ? escaparHTML(dados.id) : ""}"
                >


                ${
                    caso

                    ? `

                    <label>
                        Título
                        <input
                            type="text"
                            id="admin-title"
                            value="${dados ? escaparHTML(dados.titulo) : ""}"
                            required
                        >
                    </label>

                    <label>
                        Categoria
                        <select id="admin-category">

                            <option value="INVESTIGAÇÃO"
                                ${dados?.categoria === "INVESTIGAÇÃO" ? "selected" : ""}>
                                Investigação
                            </option>

                            <option value="DESAPARECIMENTO"
                                ${dados?.categoria === "DESAPARECIMENTO" ? "selected" : ""}>
                                Desaparecimento
                            </option>

                            <option value="MISTÉRIO"
                                ${dados?.categoria === "MISTÉRIO" ? "selected" : ""}>
                                Mistério
                            </option>

                            <option value="PERÍCIA"
                                ${dados?.categoria === "PERÍCIA" ? "selected" : ""}>
                                Perícia
                            </option>

                            <option value="LENDA"
                                ${dados?.categoria === "LENDA" ? "selected" : ""}>
                                Lenda
                            </option>

                        </select>
                    </label>

                    <label>
                        Local
                        <input
                            type="text"
                            id="admin-location"
                            value="${dados ? escaparHTML(dados.local) : ""}"
                        >
                    </label>

                    <label>
                        Ano / Período
                        <input
                            type="text"
                            id="admin-year"
                            value="${dados ? escaparHTML(dados.ano) : ""}"
                        >
                    </label>

                    <label>
                        Status
                        <input
                            type="text"
                            id="admin-status"
                            value="${dados ? escaparHTML(dados.status) : "EM ARQUIVO"}"
                        >
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
                            accept="image/jpeg,image/png,image/webp,image/gif"
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
                                value="${dados ? escaparHTML(dados.imagem) : ""}"
                                placeholder="A URL será preenchida automaticamente"
                            >
                        </label>

                    </div>

                    <label>
                        Resumo

                        <textarea
                            id="admin-summary"
                            rows="3"
                            required
                        >${dados ? escaparHTML(dados.resumo) : ""}</textarea>
                    </label>

                    <label>
                        História / Relatório

                        <textarea
                            id="admin-history"
                            rows="8"
                            required
                        >${dados ? escaparHTML(dados.historia) : ""}</textarea>
                    </label>

                    <label>
                        Evidências

                        <textarea
                            id="admin-evidence"
                            rows="5"
                            placeholder="Uma evidência por linha"
                        >${dados ? escaparHTML(normalizarEvidencias(dados.evidencias).join("\n")) : ""}</textarea>
                    </label>

                    <label>
                        Hipóteses / Linhas de investigação

                        <textarea
                            id="admin-theories"
                            rows="5"
                            placeholder="Uma hipótese por linha"
                        >${dados ? escaparHTML(normalizarEvidencias(dados.teorias).join("\n")) : ""}</textarea>
                    </label>

                    <div class="admin-upload-section admin-documents-section">

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

                        <small class="admin-upload-hint">
                            Limite configurado no Storage: 20 MB por arquivo.
                        </small>

                    </div>

                    `

                    : `

                    <label>
                        Título

                        <input
                            type="text"
                            id="admin-book-title"
                            value="${dados ? escaparHTML(dados.titulo) : ""}"
                            required
                        >
                    </label>

                    <label>
                        Autor

                        <input
                            type="text"
                            id="admin-book-author"
                            value="${dados ? escaparHTML(dados.autor) : ""}"
                            required
                        >
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
                            accept="image/jpeg,image/png,image/webp,image/gif"
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
                                value="${dados ? escaparHTML(dados.capa) : ""}"
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
                        >${dados ? escaparHTML(dados.descricao) : ""}</textarea>
                    </label>

                    <label>
                        Categoria / Tag

                        <input
                            type="text"
                            id="admin-book-tag"
                            value="${dados ? escaparHTML(dados.tag) : ""}"
                            placeholder="CRIMINOLOGIA"
                        >
                    </label>


                    <div class="admin-affiliate-section">

                        <div class="admin-affiliate-header">

                            <div>

                                <span class="admin-affiliate-eyebrow">
                                    LINKS COMERCIAIS
                                </span>

                                <h4>
                                    Onde encontrar este livro
                                </h4>

                                <p>
                                    Adicione links de lojas, afiliados ou parceiros.
                                    Você pode cadastrar quantas opções quiser.
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
                            Ex.: Amazon, Shopee, Mercado Livre, Kobo,
                            Estante Virtual ou qualquer outra loja parceira.
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


    modal.classList.add("active");


    if (caso) {

        inicializarUploadImagemCaso(
            dados
        );

        inicializarDocumentosCaso(
            dados
        );

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

                } else {

                    salvarLivroAdmin(
                        evento,
                        dados
                    );
                }
            }
        );


    if (!caso) {

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
   SALVAR CASO ADMIN
   ========================================================================== */

function salvarCasoAdmin(
    evento,
    casoExistente = null
) {

    evento.preventDefault();

    const casos =
        lerStorage(
            CONFIG.STORAGE_CASOS
        );

    const caso = {

        id:
            casoExistente
                ? Number(casoExistente.id)
                : Date.now(),

        titulo:
            document
                .getElementById(
                    "admin-title"
                )
                .value
                .trim(),

        categoria:
            document
                .getElementById(
                    "admin-category"
                )
                .value,

        local:
            document
                .getElementById(
                    "admin-location"
                )
                .value
                .trim(),

        ano:
            document
                .getElementById(
                    "admin-year"
                )
                .value
                .trim(),

        status:
            document
                .getElementById(
                    "admin-status"
                )
                .value
                .trim(),

        imagem:
            document
                .getElementById(
                    "admin-image"
                )
                .value
                .trim(),

        resumo:
            document
                .getElementById(
                    "admin-summary"
                )
                .value
                .trim(),

        historia:
            document
                .getElementById(
                    "admin-history"
                )
                .value
                .trim(),

        evidencias:
            normalizarEvidencias(
                document
                    .getElementById(
                        "admin-evidence"
                    )
                    .value
            ),

        teorias:
            normalizarEvidencias(
                document
                    .getElementById(
                        "admin-theories"
                    )
                    .value
            ),

        documentos:
            coletarDocumentosAdmin()
    };


    if (casoExistente) {

        const indice =
            casos.findIndex(
                item =>
                    Number(item.id) ===
                    Number(
                        casoExistente.id
                    )
            );

        if (indice !== -1) {

            casos[indice] =
                caso;

        } else {

            /*
             * Se o conteúdo editado não estiver no localStorage,
             * criamos uma versão personalizada dele.
             */
            casos.unshift(
                caso
            );
        }

    } else {

        casos.unshift(
            caso
        );
    }


    if (
        salvarStorage(
            CONFIG.STORAGE_CASOS,
            casos
        )
    ) {

        fecharFormularioAdmin();

        carregarCasos();
        carregarForense();

        renderizarGerenciadorAdmin();
    }
}


/* ==========================================================================
   SALVAR LIVRO ADMIN
   ========================================================================== */

function salvarLivroAdmin(
    evento,
    livroExistente = null
) {

    evento.preventDefault();

    const livros =
        lerStorage(
            CONFIG.STORAGE_LIVROS
        );

    const livro = {

        id:
            livroExistente
                ? Number(
                    livroExistente.id
                )
                : Date.now(),

        titulo:
            document
                .getElementById(
                    "admin-book-title"
                )
                .value
                .trim(),

        autor:
            document
                .getElementById(
                    "admin-book-author"
                )
                .value
                .trim(),

        capa:
            document
                .getElementById(
                    "admin-book-cover"
                )
                .value
                .trim(),

        descricao:
            document
                .getElementById(
                    "admin-book-description"
                )
                .value
                .trim(),

        tag:
            document
                .getElementById(
                    "admin-book-tag"
                )
                .value
                .trim() ||
            "RECOMENDADO",

        linksAfiliados:
            coletarLinksAfiliadosAdmin()
    };


    if (livroExistente) {

        const indice =
            livros.findIndex(
                item =>
                    Number(item.id) ===
                    Number(
                        livroExistente.id
                    )
            );

        if (indice !== -1) {

            livros[indice] =
                livro;

        } else {

            livros.unshift(
                livro
            );
        }

    } else {

        livros.unshift(
            livro
        );
    }


    if (
        salvarStorage(
            CONFIG.STORAGE_LIVROS,
            livros
        )
    ) {

        fecharFormularioAdmin();

        carregarLivros();

        renderizarGerenciadorAdmin();
    }
}


/* ==========================================================================
   EDIÇÃO
   ========================================================================== */

function editarCaso(id) {

    const casos =
        lerStorage(
            CONFIG.STORAGE_CASOS
        );

    const caso =
        casos.find(
            item =>
                Number(item.id) ===
                Number(id)
        );

    if (!caso) {
        return;
    }

    abrirFormularioAdmin(
        "caso",
        caso
    );
}


function editarLivro(id) {

    const livros =
        lerStorage(
            CONFIG.STORAGE_LIVROS
        );

    const livro =
        livros.find(
            item =>
                Number(item.id) ===
                Number(id)
        );

    if (!livro) {
        return;
    }

    abrirFormularioAdmin(
        "livro",
        livro
    );
}


/* ==========================================================================
   EXCLUSÃO
   ========================================================================== */

function removerCaso(id) {

    const confirmar =
        confirm(
            "Tem certeza que deseja excluir este dossiê?"
        );

    if (!confirmar) {
        return;
    }

    const casos =
        lerStorage(
            CONFIG.STORAGE_CASOS
        )
            .filter(
                caso =>
                    Number(caso.id) !==
                    Number(id)
            );

    salvarStorage(
        CONFIG.STORAGE_CASOS,
        casos
    );

    carregarCasos();
    carregarForense();

    renderizarGerenciadorAdmin();
}


function removerLivro(id) {

    const confirmar =
        confirm(
            "Tem certeza que deseja excluir este livro?"
        );

    if (!confirmar) {
        return;
    }

    const livros =
        lerStorage(
            CONFIG.STORAGE_LIVROS
        )
            .filter(
                livro =>
                    Number(livro.id) !==
                    Number(id)
            );

    salvarStorage(
        CONFIG.STORAGE_LIVROS,
        livros
    );

    carregarLivros();

    renderizarGerenciadorAdmin();
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

/*
 * Mantemos algumas funções globais para evitar problemas caso algum HTML
 * antigo ainda possua onclick="..." enquanto fazemos a transição.
 */

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


window.editarCaso =
    editarCaso;

window.editarLivro =
    editarLivro;


window.sairAdmin =
    sairAdmin;
