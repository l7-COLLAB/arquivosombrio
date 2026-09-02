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
        ano: 2024,
        editora: "Arquivo Sombrio",
        capa: "imagens/livros/pericia.jpg",
        descricao:
            "Uma introdução aos métodos científicos utilizados na análise de vestígios e cenas de crime.",
        tag: "PERÍCIA & CRIMINOLOGIA",
        recomendado: true,
        criadoEm: "2026-01-01T12:00:00.000Z"
    },

    {
        id: 2,
        titulo: "Compêndio de Lendas Urbanas e Mitos",
        autor: "H. P. Silva",
        ano: 2023,
        editora: "Arquivo Sombrio",
        capa: "imagens/livros/lendas.jpg",
        descricao:
            "Uma compilação sobre a origem histórica de mitos, lendas urbanas e folclore obscuro.",
        tag: "FOLCLORE & MISTÉRIOS",
        recomendado: true,
        criadoEm: "2026-01-02T12:00:00.000Z"
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
            <article class="book-card">

                <div class="book-image">

                    <img
                        src="${escaparHTML(
                            livro.capa || ""
                        )}"
                        alt="${escaparHTML(
                            livro.titulo || "Livro"
                        )}"
                        loading="lazy"
                        onerror="this.src='https://placehold.co/300x450/111/777?text=Arquivo+Sombrio'"
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
                            id="books-clear-search"
                            aria-label="Limpar pesquisa"
                            title="Limpar pesquisa"
                        >
                            <i class="fa-solid fa-xmark"></i>
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
                                Number
                                    .MAX_SAFE_INTEGER;

                            const anoB =
                                Number(
                                    b.ano || 0
                                ) ||
                                Number
                                    .MAX_SAFE_INTEGER;

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
            "btn-open-admin-mobile"
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

    document
        .getElementById(
            "modal-admin"
        )
        ?.classList.remove(
            "active"
        );
}


function abrirPainelAdmin() {

    fecharModalAdmin();

    renderizarGerenciadorAdmin();
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


    try {

        const supabaseClient =
            await obterClienteSupabase();

        const {
            data,
            error
        } =
            await supabaseClient
                .auth
                .signInWithPassword({
                    email,
                    password: senha
                });


        if (error) {
            throw error;
        }


        if (!data?.session) {

            throw new Error(
                "Não foi possível iniciar a sessão."
            );
        }


        formulario.reset();

        fecharModalAdmin();

        abrirPainelAdmin();


    } catch (erro) {

        console.error(
            "Falha no login administrativo.",
            erro
        );


        if (erroElemento) {

            erroElemento.textContent =
                "Credenciais inválidas ou acesso não autorizado.";

            erroElemento.classList.add(
                "visible"
            );
        }


    } finally {

        if (botao) {

            botao.disabled = false;

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

/* ==========================================================================
   GERENCIADOR ADMINISTRATIVO
   ========================================================================== */

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
     * Continuam no localStorage por enquanto.
     */
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

                            <div class="admin-item">

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
                                        )}
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
                        Number(
                            button.dataset.editBook
                        )
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
                        Number(
                            button.dataset.deleteBook
                        )
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
                            rows="3"
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
                            rows="8"
                            required
                        >${
                            dados
                                ? escaparHTML(
                                    dados.historia
                                )
                                : ""
                        }</textarea>

                    </label>


                    <label>

                        Evidências

                        <textarea
                            id="admin-evidence"
                            rows="5"
                            placeholder="Uma evidência por linha"
                        >${
                            dados
                                ? escaparHTML(
                                    normalizarEvidencias(
                                        dados.evidencias
                                    ).join("\n")
                                )
                                : ""
                        }</textarea>

                    </label>


                    <label>

                        Hipóteses / Linhas de investigação

                        <textarea
                            id="admin-theories"
                            rows="5"
                            placeholder="Uma hipótese por linha"
                        >${
                            dados
                                ? escaparHTML(
                                    normalizarEvidencias(
                                        dados.teorias
                                    ).join("\n")
                                )
                                : ""
                        }</textarea>

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
   SALVAR CASO ADMIN — SUPABASE
   ========================================================================== */

async function salvarCasoAdmin(
    evento,
    casoExistente = null
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


        if (!caso.historia) {

            throw new Error(
                "Informe a história ou relatório do dossiê."
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

            throw resultado.error;
        }


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


    const criadoEm =
        livroExistente?.criadoEm ||
        livroExistente?.created_at ||
        new Date().toISOString();


    const livro = {

        id:
            livroExistente
                ? Number(
                    livroExistente.id
                )
                : Date.now(),

        titulo,

        autor,

        ano,

        editora,

        capa,

        descricao,

        tag,

        recomendado,

        criadoEm,

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

        alert(
            "Livro não encontrado."
        );

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
