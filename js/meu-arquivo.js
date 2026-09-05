/* =========================================================
   ARQUIVO SOMBRIO
   MEU ARQUIVO — JAVASCRIPT
   ========================================================= */


/* =========================================================
   CONFIGURAÇÃO INICIAL
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        await inicializarMeuArquivo();

    }
);


/* =========================================================
   ELEMENTOS PRINCIPAIS
   ========================================================= */

const arquivoElements = {

    authWall:
        document.getElementById(
            "arquivo-auth-wall"
        ),

    modal:
        document.getElementById(
            "arquivo-modal"
        ),

    modalTitle:
        document.getElementById(
            "arquivo-modal-title"
        ),

    modalContent:
        document.getElementById(
            "arquivo-modal-content"
        ),

    investigadorAvatar:
        document.getElementById(
            "investigador-avatar"
        ),

    investigadorNome:
        document.getElementById(
            "investigador-nome"
        ),

    investigadorUsuario:
        document.getElementById(
            "investigador-usuario"
        ),

    investigadorBio:
        document.getElementById(
            "investigador-bio"
        ),

    investigadorRegistro:
        document.getElementById(
            "investigador-registro"
        ),

    segurancaEmail:
        document.getElementById(
            "seguranca-email"
        ),

    totalDossies:
        document.getElementById(
            "total-dossies"
        ),

    totalObservacao:
        document.getElementById(
            "total-observacao"
        ),

    totalMurais:
        document.getElementById(
            "total-murais"
        ),

    totalAnotacoes:
        document.getElementById(
            "total-anotacoes"
        ),

    totalFavoritos:
        document.getElementById(
            "total-favoritos"
        ),

    totalPublicacoes:
        document.getElementById(
            "total-publicacoes"
        ),

    totalComentarios:
        document.getElementById(
            "total-comentarios"
        ),

    totalSeguidos:
        document.getElementById(
            "total-seguidos"
        ),

    totalBloqueados:
        document.getElementById(
            "total-bloqueados"
        ),

    totalAlertas:
        document.getElementById(
            "total-alertas"
        )

};


/* =========================================================
   ESTADO DA ÁREA PESSOAL
   ========================================================= */

const meuArquivoState = {

    usuario: null,

    sessao: null,

    perfil: null,

    carregando: false,

    murais: [],

    dossies: [],

    favoritos: [],

    observacao: [],

    marcadores: [],

    historico: [],

    anotacoes: [],

    teorias: [],

    evidencias: [],

    linhasDoTempo: [],

    publicacoes: [],

    comentarios: [],

    seguidos: [],

    bloqueados: [],

    alertas: [],

    casosEnviados: []

};


/* =========================================================
   ACESSO AO CLIENTE SUPABASE
   O cliente principal já é carregado pelo script.js.
   Não colocamos nenhuma chave privada neste arquivo.
   ========================================================= */




/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

async function inicializarMeuArquivo() {

    if (
        meuArquivoState.carregando
    ) {

        return;

    }


    meuArquivoState.carregando = true;


    try {

        const supabase =
    await obterSupabaseMeuArquivo();


        if (!supabase) {

            mostrarErroInicial(
                "Não foi possível conectar esta área ao Arquivo."
            );

            return;

        }


        const {
            data,
            error
        } =
            await supabase.auth.getSession();


        if (error) {

            throw error;

        }


        const sessao =
            data?.session || null;


        meuArquivoState.sessao =
            sessao;


        meuArquivoState.usuario =
            sessao?.user || null;


        if (
            !meuArquivoState.usuario
        ) {

            mostrarParedeAutenticacao();

            return;

        }


        esconderParedeAutenticacao();


        preencherDadosBasicosUsuario(
            meuArquivoState.usuario
        );


        prepararEventosMeuArquivo();


        await carregarDadosMeuArquivo();

    }
    catch (erro) {

        console.error(
            "Erro ao inicializar Meu Arquivo:",
            erro
        );


        mostrarErroInicial(
            "O Arquivo encontrou um erro ao carregar sua área pessoal."
        );

    }
    finally {

        meuArquivoState.carregando =
            false;

    }

}


/* =========================================================
   AUTENTICAÇÃO
   ========================================================= */

function mostrarParedeAutenticacao() {

    if (
        arquivoElements.authWall
    ) {

        arquivoElements.authWall.hidden =
            false;

    }

}


function esconderParedeAutenticacao() {

    if (
        arquivoElements.authWall
    ) {

        arquivoElements.authWall.hidden =
            true;

    }

}


/* =========================================================
   DADOS BÁSICOS DO USUÁRIO
   ========================================================= */

function preencherDadosBasicosUsuario(
    usuario
) {

    if (!usuario) {

        return;

    }


    const metadata =
        usuario.user_metadata || {};


    const nome =
        metadata.display_name ||
        metadata.full_name ||
        metadata.name ||
        "Investigador";


    const usuarioArquivo =
        metadata.username ||
        gerarUsuarioArquivo(
            usuario.email
        );


    const bio =
        metadata.bio ||
        "Nenhuma anotação registrada no perfil.";


    if (
        arquivoElements.investigadorNome
    ) {

        arquivoElements.investigadorNome.textContent =
            nome;

    }


    if (
        arquivoElements.investigadorUsuario
    ) {

        arquivoElements.investigadorUsuario.textContent =
            "@" + usuarioArquivo;

    }


    if (
        arquivoElements.investigadorBio
    ) {

        arquivoElements.investigadorBio.textContent =
            bio;

    }


    if (
        arquivoElements.segurancaEmail
    ) {

        arquivoElements.segurancaEmail.textContent =
            usuario.email ||
            "E-mail não identificado";

    }


    preencherDataRegistro(
        usuario.created_at
    );


    preencherAvatarUsuario(
        metadata,
        nome
    );

}


/* =========================================================
   IDENTIFICADOR VISUAL DO USUÁRIO
   ========================================================= */

function gerarUsuarioArquivo(
    email
) {

    if (!email) {

        return "investigador";

    }


    const base =
        email
            .split("@")[0]
            .toLowerCase()
            .replace(
                /[^a-z0-9._-]/g,
                ""
            );


    return (
        base ||
        "investigador"
    );

}


/* =========================================================
   DATA DE REGISTRO
   ========================================================= */

function preencherDataRegistro(
    dataRegistro
) {

    if (
        !arquivoElements.investigadorRegistro
    ) {

        return;

    }


    if (!dataRegistro) {

        arquivoElements
            .investigadorRegistro
            .textContent =
                "Registro não identificado";

        return;

    }


    const data =
        new Date(
            dataRegistro
        );


    if (
        Number.isNaN(
            data.getTime()
        )
    ) {

        arquivoElements
            .investigadorRegistro
            .textContent =
                "Registro não identificado";

        return;

    }


    arquivoElements
        .investigadorRegistro
        .textContent =
            data.toLocaleDateString(
                "pt-BR",
                {
                    day: "2-digit",
                    month: "long",
                    year: "numeric"
                }
            );

}


/* =========================================================
   AVATAR
   ========================================================= */

function preencherAvatarUsuario(
    metadata,
    nome
) {

    const elemento =
        arquivoElements
            .investigadorAvatar;


    if (!elemento) {

        return;

    }


    const avatarUrl =
        metadata.avatar_url ||
        metadata.picture ||
        "";


    if (avatarUrl) {

        if (
            elemento.tagName === "IMG"
        ) {

            elemento.src =
                avatarUrl;

            elemento.alt =
                "Avatar de " + nome;

        }
        else {

            elemento.style.backgroundImage =
                `url("${avatarUrl}")`;

            elemento.classList.add(
                "has-avatar"
            );

        }


        return;

    }


    const inicial =
        String(nome || "I")
            .trim()
            .charAt(0)
            .toUpperCase();


    if (
        elemento.tagName === "IMG"
    ) {

        elemento.removeAttribute(
            "src"
        );

        elemento.alt =
            "Investigador " + inicial;

    }
    else {

        elemento.textContent =
            inicial;

    }

}

/* =========================================================
   CARREGAMENTO DOS DADOS DO MEU ARQUIVO
   ========================================================= */

async function carregarDadosMeuArquivo() {

    const supabase =
        obterSupabaseMeuArquivo();


    const usuario =
        meuArquivoState.usuario;


    if (
        !supabase ||
        !usuario
    ) {

        return;

    }


    ativarEstadoCarregamento();


    try {

        await Promise.allSettled([

            carregarDossiesUsuario(),

            carregarFavoritosUsuario(),

            carregarCasosObservacao(),

            carregarMarcadoresUsuario(),

            carregarHistoricoUsuario(),

            carregarMuraisUsuario(),

            carregarAnotacoesUsuario(),

            carregarTeoriasUsuario(),

            carregarEvidenciasUsuario(),

            carregarLinhasDoTempoUsuario(),

            carregarAtividadeComunidade(),

            carregarAlertasUsuario(),

            carregarCasosEnviadosUsuario()

        ]);


        atualizarResumoMeuArquivo();

    }
    catch (erro) {

        console.error(
            "Erro ao carregar dados do Meu Arquivo:",
            erro
        );

    }
    finally {

        desativarEstadoCarregamento();

    }

}


/* =========================================================
   FUNÇÃO SEGURA PARA CONSULTAR TABELAS
   ========================================================= */

async function consultarTabelaUsuario(
    tabela,
    colunaUsuario = "user_id",
    configuracao = {}
) {

    const supabase =
    await obterSupabaseMeuArquivo();


    const usuario =
        meuArquivoState.usuario;


    if (
        !supabase ||
        !usuario
    ) {

        return [];

    }


    try {

        let consulta =
            supabase
                .from(tabela)
                .select(
                    configuracao.select || "*"
                )
                .eq(
                    colunaUsuario,
                    usuario.id
                );


        if (
            configuracao.ordem
        ) {

            consulta =
                consulta.order(
                    configuracao.ordem,
                    {
                        ascending:
                            configuracao.ascending ??
                            false
                    }
                );

        }


        if (
            configuracao.limite
        ) {

            consulta =
                consulta.limit(
                    configuracao.limite
                );

        }


        const {
            data,
            error
        } =
            await consulta;


        if (error) {

            /*
             * Algumas estruturas desta área ainda serão
             * criadas no Supabase.
             *
             * Por isso uma tabela inexistente não deve
             * derrubar toda a página Meu Arquivo.
             */

            console.warn(
                `Meu Arquivo: não foi possível carregar "${tabela}".`,
                error.message
            );

            return [];

        }


        return Array.isArray(data)
            ? data
            : [];

    }
    catch (erro) {

        console.warn(
            `Meu Arquivo: falha ao consultar "${tabela}".`,
            erro
        );

        return [];

    }

}


/* =========================================================
   MEUS DOSSIÊS
   ========================================================= */

async function carregarDossiesUsuario() {

    meuArquivoState.dossies =
        await consultarTabelaUsuario(
            "user_dossiers",
            "user_id",
            {
                ordem: "created_at"
            }
        );


    renderizarColecaoGenerica(
        "lista-meus-dossies",
        meuArquivoState.dossies,
        {
            vazio:
                "Nenhum dossiê foi arquivado até o momento.",

            titulo:
                "Dossiê",

            icone:
                "fa-folder-open"
        }
    );

}


/* =========================================================
   FAVORITOS
   ========================================================= */

async function carregarFavoritosUsuario() {

    meuArquivoState.favoritos =
        await consultarTabelaUsuario(
            "user_favorites",
            "user_id",
            {
                ordem: "created_at"
            }
        );


    renderizarColecaoGenerica(
        "lista-favoritos",
        meuArquivoState.favoritos,
        {
            vazio:
                "Nenhum registro foi marcado como favorito.",

            titulo:
                "Registro favorito",

            icone:
                "fa-heart"
        }
    );

}


/* =========================================================
   CASOS EM OBSERVAÇÃO
   ========================================================= */

async function carregarCasosObservacao() {

    meuArquivoState.observacao =
        await consultarTabelaUsuario(
            "user_watchlist",
            "user_id",
            {
                ordem: "created_at"
            }
        );


    renderizarColecaoGenerica(
        "lista-observacao",
        meuArquivoState.observacao,
        {
            vazio:
                "Nenhum caso está sendo observado.",

            titulo:
                "Caso em observação",

            icone:
                "fa-eye"
        }
    );

}


/* =========================================================
   MARCADORES
   ========================================================= */

async function carregarMarcadoresUsuario() {

    meuArquivoState.marcadores =
        await consultarTabelaUsuario(
            "user_tags",
            "user_id",
            {
                ordem: "created_at"
            }
        );


    renderizarMarcadores();

}


/* =========================================================
   HISTÓRICO
   ========================================================= */

async function carregarHistoricoUsuario() {

    meuArquivoState.historico =
        await consultarTabelaUsuario(
            "user_history",
            "user_id",
            {
                ordem: "created_at",
                limite: 50
            }
        );


    renderizarHistorico();

}


/* =========================================================
   MURAIS DE INVESTIGAÇÃO
   ========================================================= */

async function carregarMuraisUsuario() {

    meuArquivoState.murais =
        await consultarTabelaUsuario(
            "investigation_boards",
            "user_id",
            {
                ordem: "created_at"
            }
        );


    renderizarMurais();

}


/* =========================================================
   CADERNO DO INVESTIGADOR
   ========================================================= */

async function carregarAnotacoesUsuario() {

    meuArquivoState.anotacoes =
        await consultarTabelaUsuario(
            "investigator_notes",
            "user_id",
            {
                ordem: "updated_at"
            }
        );


    atualizarContador(
        "contador-caderno",
        meuArquivoState.anotacoes.length
    );

}


/* =========================================================
   TEORIAS
   ========================================================= */

async function carregarTeoriasUsuario() {

    meuArquivoState.teorias =
        await consultarTabelaUsuario(
            "user_theories",
            "user_id",
            {
                ordem: "updated_at"
            }
        );


    atualizarContador(
        "contador-teorias",
        meuArquivoState.teorias.length
    );

}


/* =========================================================
   EVIDÊNCIAS SALVAS
   ========================================================= */

async function carregarEvidenciasUsuario() {

    meuArquivoState.evidencias =
        await consultarTabelaUsuario(
            "saved_evidence",
            "user_id",
            {
                ordem: "created_at"
            }
        );


    atualizarContador(
        "contador-evidencias",
        meuArquivoState.evidencias.length
    );

}


/* =========================================================
   LINHAS DO TEMPO
   ========================================================= */

async function carregarLinhasDoTempoUsuario() {

    meuArquivoState.linhasDoTempo =
        await consultarTabelaUsuario(
            "investigation_timelines",
            "user_id",
            {
                ordem: "created_at"
            }
        );


    renderizarLinhasDoTempo();

}


/* =========================================================
   ATIVIDADE NA COMUNIDADE
   ========================================================= */

async function carregarAtividadeComunidade() {

    await Promise.allSettled([

        carregarPublicacoesUsuario(),

        carregarComentariosUsuario(),

        carregarSeguidosUsuario(),

        carregarBloqueadosUsuario()

    ]);

}


/* =========================================================
   PUBLICAÇÕES DO USUÁRIO
   ========================================================= */

async function carregarPublicacoesUsuario() {

    meuArquivoState.publicacoes =
        await consultarTabelaUsuario(
            "forum_posts",
            "user_id",
            {
                ordem: "created_at"
            }
        );


    atualizarContador(
        "total-publicacoes",
        meuArquivoState.publicacoes.length
    );

}


/* =========================================================
   COMENTÁRIOS DO USUÁRIO
   ========================================================= */

async function carregarComentariosUsuario() {

    /*
     * O projeto possui estruturas de comentários já existentes.
     * A integração definitiva será ligada à coluna de autoria
     * confirmada no Supabase.
     */

    const comentariosForum =
        await consultarTabelaUsuario(
            "forum_comments",
            "user_id",
            {
                ordem: "created_at"
            }
        );


    const comentariosCasos =
        await consultarTabelaUsuario(
            "Comentarios",
            "user_id",
            {
                ordem: "created_at"
            }
        );


    meuArquivoState.comentarios = [
        ...comentariosForum,
        ...comentariosCasos
    ];


    atualizarContador(
        "total-comentarios",
        meuArquivoState.comentarios.length
    );

}


/* =========================================================
   INVESTIGADORES SEGUIDOS
   ========================================================= */

async function carregarSeguidosUsuario() {

    meuArquivoState.seguidos =
        await consultarTabelaUsuario(
            "user_follows",
            "follower_id",
            {
                ordem: "created_at"
            }
        );


    atualizarContador(
        "total-seguidos",
        meuArquivoState.seguidos.length
    );

}


/* =========================================================
   USUÁRIOS BLOQUEADOS
   ========================================================= */

async function carregarBloqueadosUsuario() {

    meuArquivoState.bloqueados =
        await consultarTabelaUsuario(
            "user_blocks",
            "user_id",
            {
                ordem: "created_at"
            }
        );


    atualizarContador(
        "total-bloqueados",
        meuArquivoState.bloqueados.length
    );

}


/* =========================================================
   ALERTAS
   ========================================================= */

async function carregarAlertasUsuario() {

    meuArquivoState.alertas =
        await consultarTabelaUsuario(
            "user_notifications",
            "user_id",
            {
                ordem: "created_at",
                limite: 30
            }
        );


    renderizarAlertas();

}


/* =========================================================
   CASOS ENVIADOS
   ========================================================= */

async function carregarCasosEnviadosUsuario() {

    /*
     * Sugestoes já existe no projeto.
     * A associação exata com o usuário será confirmada
     * antes de habilitarmos gravações nesta área.
     */

    meuArquivoState.casosEnviados =
        await consultarTabelaUsuario(
            "Sugestoes",
            "user_id",
            {
                ordem: "created_at"
            }
        );


    renderizarCasosEnviados();

}


/* =========================================================
   CONTADORES DO RESUMO
   ========================================================= */

function atualizarResumoMeuArquivo() {

    atualizarContador(
        "total-dossies",
        meuArquivoState.dossies.length
    );


    atualizarContador(
        "total-observacao",
        meuArquivoState.observacao.length
    );


    atualizarContador(
        "total-murais",
        meuArquivoState.murais.length
    );


    atualizarContador(
        "total-anotacoes",
        meuArquivoState.anotacoes.length
    );


    atualizarContador(
        "total-favoritos",
        meuArquivoState.favoritos.length
    );

}


/* =========================================================
   ATUALIZAÇÃO SEGURA DE CONTADORES
   ========================================================= */

function atualizarContador(
    id,
    valor
) {

    const elemento =
        document.getElementById(id);


    if (!elemento) {

        return;

    }


    const numero =
        Number(valor);


    elemento.textContent =
        Number.isFinite(numero)
            ? String(numero)
            : "0";

}

/* =========================================================
   UTILITÁRIOS DE TEXTO
   ========================================================= */

function escaparHTML(valor) {

    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function obterPrimeiroValor(
    objeto,
    campos,
    fallback = ""
) {

    if (!objeto) {
        return fallback;
    }


    for (const campo of campos) {

        const valor =
            objeto[campo];


        if (
            valor !== undefined &&
            valor !== null &&
            String(valor).trim() !== ""
        ) {

            return valor;

        }

    }


    return fallback;

}


/* =========================================================
   FORMATAÇÃO DE DATAS
   ========================================================= */

function formatarDataArquivo(
    valor,
    incluirHora = false
) {

    if (!valor) {
        return "Data não registrada";
    }


    const data =
        new Date(valor);


    if (
        Number.isNaN(
            data.getTime()
        )
    ) {

        return "Data não registrada";

    }


    const configuracao = {

        day: "2-digit",
        month: "short",
        year: "numeric"

    };


    if (incluirHora) {

        configuracao.hour =
            "2-digit";

        configuracao.minute =
            "2-digit";

    }


    return data.toLocaleDateString(
        "pt-BR",
        configuracao
    );

}


/* =========================================================
   ESTADO VAZIO
   ========================================================= */

function criarEstadoVazio(
    mensagem,
    icone = "fa-folder-open"
) {

    return `
        <div class="arquivo-empty-state">

            <i class="fa-solid ${icone}"></i>

            <p>
                ${escaparHTML(mensagem)}
            </p>

        </div>
    `;

}


/* =========================================================
   COLEÇÕES GENÉRICAS
   ========================================================= */

function renderizarColecaoGenerica(
    containerId,
    itens,
    configuracao = {}
) {

    const container =
        document.getElementById(
            containerId
        );


    if (!container) {
        return;
    }


    if (
        !Array.isArray(itens) ||
        itens.length === 0
    ) {

        container.innerHTML =
            criarEstadoVazio(
                configuracao.vazio ||
                "Nenhum registro encontrado.",
                configuracao.icone ||
                "fa-folder-open"
            );

        return;

    }


    container.innerHTML =
        itens
            .map(
                function (item) {

                    const titulo =
                        obterPrimeiroValor(
                            item,
                            [
                                "title",
                                "titulo",
                                "name",
                                "nome",
                                "case_title",
                                "caso_titulo"
                            ],
                            configuracao.titulo ||
                            "Registro"
                        );


                    const descricao =
                        obterPrimeiroValor(
                            item,
                            [
                                "description",
                                "descricao",
                                "summary",
                                "resumo",
                                "notes",
                                "nota"
                            ],
                            "Registro arquivado no seu espaço pessoal."
                        );


                    const data =
                        obterPrimeiroValor(
                            item,
                            [
                                "updated_at",
                                "created_at",
                                "data"
                            ],
                            ""
                        );


                    return `
                        <article class="arquivo-item-card">

                            <div class="arquivo-item-thumb">

                                <i class="fa-solid ${
                                    escaparHTML(
                                        configuracao.icone ||
                                        "fa-file-lines"
                                    )
                                }"></i>

                            </div>

                            <div class="arquivo-item-info">

                                <h4>
                                    ${escaparHTML(titulo)}
                                </h4>

                                <p>
                                    ${escaparHTML(descricao)}
                                </p>

                                <small>
                                    ${escaparHTML(
                                        formatarDataArquivo(data)
                                    )}
                                </small>

                            </div>

                            <button
                                type="button"
                                class="arquivo-item-action"
                                aria-label="Abrir registro"
                                data-arquivo-item-id="${
                                    escaparHTML(
                                        item.id || ""
                                    )
                                }"
                            >

                                <i class="fa-solid fa-arrow-right"></i>

                            </button>

                        </article>
                    `;

                }
            )
            .join("");

}


/* =========================================================
   MARCADORES
   ========================================================= */

function renderizarMarcadores() {

    const container =
        document.getElementById(
            "lista-marcadores"
        );


    if (!container) {
        return;
    }


    const itens =
        meuArquivoState.marcadores;


    if (
        !Array.isArray(itens) ||
        itens.length === 0
    ) {

        container.innerHTML =
            criarEstadoVazio(
                "Você ainda não criou nenhum marcador.",
                "fa-tags"
            );

        return;

    }


    container.innerHTML =
        itens
            .map(
                function (item) {

                    const nome =
                        obterPrimeiroValor(
                            item,
                            [
                                "name",
                                "nome",
                                "title",
                                "titulo"
                            ],
                            "Marcador"
                        );


                    return `
                        <article class="marcador-card">

                            <div class="marcador-icon">
                                <i class="fa-solid fa-tag"></i>
                            </div>

                            <div>

                                <strong>
                                    ${escaparHTML(nome)}
                                </strong>

                                <span>
                                    Marcador pessoal
                                </span>

                            </div>

                        </article>
                    `;

                }
            )
            .join("");

}


/* =========================================================
   HISTÓRICO DE INVESTIGAÇÃO
   ========================================================= */

function renderizarHistorico() {

    const container =
        document.getElementById(
            "lista-historico"
        );


    if (!container) {
        return;
    }


    const itens =
        meuArquivoState.historico;


    if (
        !Array.isArray(itens) ||
        itens.length === 0
    ) {

        container.innerHTML =
            criarEstadoVazio(
                "Nenhuma atividade foi registrada no histórico.",
                "fa-clock-rotate-left"
            );

        return;

    }


    container.innerHTML =
        itens
            .map(
                function (item) {

                    const titulo =
                        obterPrimeiroValor(
                            item,
                            [
                                "title",
                                "titulo",
                                "action",
                                "acao"
                            ],
                            "Registro consultado"
                        );


                    const data =
                        obterPrimeiroValor(
                            item,
                            [
                                "created_at",
                                "updated_at",
                                "data"
                            ],
                            ""
                        );


                    return `
                        <article class="historico-item">

                            <div class="historico-info">

                                <i class="fa-solid fa-clock-rotate-left"></i>

                                <span>
                                    ${escaparHTML(titulo)}
                                </span>

                            </div>

                            <time class="historico-data">

                                ${escaparHTML(
                                    formatarDataArquivo(
                                        data,
                                        true
                                    )
                                )}

                            </time>

                        </article>
                    `;

                }
            )
            .join("");

}


/* =========================================================
   MURAIS
   ========================================================= */

function renderizarMurais() {

    const container =
        document.getElementById(
            "lista-murais"
        );


    if (!container) {
        return;
    }


    const murais =
        meuArquivoState.murais;


    if (
        !Array.isArray(murais) ||
        murais.length === 0
    ) {

        container.innerHTML =
            criarEstadoVazio(
                "Nenhum mural particular foi criado.",
                "fa-thumbtack"
            );

        return;

    }


    container.innerHTML =
        murais
            .map(
                function (mural) {

                    const titulo =
                        obterPrimeiroValor(
                            mural,
                            [
                                "title",
                                "titulo",
                                "name",
                                "nome"
                            ],
                            "Investigação sem título"
                        );


                    const data =
                        obterPrimeiroValor(
                            mural,
                            [
                                "updated_at",
                                "created_at"
                            ],
                            ""
                        );


                    return `
                        <article class="arquivo-item-card mural-list-item">

                            <div class="arquivo-item-thumb">

                                <i class="fa-solid fa-thumbtack"></i>

                            </div>

                            <div class="arquivo-item-info">

                                <h4>
                                    ${escaparHTML(titulo)}
                                </h4>

                                <p>
                                    Mural particular de investigação.
                                </p>

                                <small>
                                    Atualizado:
                                    ${escaparHTML(
                                        formatarDataArquivo(data)
                                    )}
                                </small>

                            </div>

                            <button
                                type="button"
                                class="arquivo-item-action"
                                data-mural-id="${
                                    escaparHTML(
                                        mural.id || ""
                                    )
                                }"
                                aria-label="Abrir mural"
                            >

                                <i class="fa-solid fa-arrow-right"></i>

                            </button>

                        </article>
                    `;

                }
            )
            .join("");

}


/* =========================================================
   LINHAS DO TEMPO
   ========================================================= */

function renderizarLinhasDoTempo() {

    const container =
        document.getElementById(
            "lista-linhas-tempo"
        );


    if (!container) {
        return;
    }


    const linhas =
        meuArquivoState.linhasDoTempo;


    if (
        !Array.isArray(linhas) ||
        linhas.length === 0
    ) {

        container.innerHTML =
            criarEstadoVazio(
                "Nenhuma linha do tempo foi criada.",
                "fa-timeline"
            );

        return;

    }


    container.innerHTML =
        linhas
            .map(
                function (item) {

                    const titulo =
                        obterPrimeiroValor(
                            item,
                            [
                                "title",
                                "titulo",
                                "name",
                                "nome"
                            ],
                            "Linha do tempo"
                        );


                    const descricao =
                        obterPrimeiroValor(
                            item,
                            [
                                "description",
                                "descricao",
                                "notes",
                                "nota"
                            ],
                            "Cronologia particular de investigação."
                        );


                    return `
                        <article class="timeline-item">

                            <div class="timeline-marker"></div>

                            <div class="timeline-content">

                                <strong>
                                    ${escaparHTML(titulo)}
                                </strong>

                                <p>
                                    ${escaparHTML(descricao)}
                                </p>

                            </div>

                        </article>
                    `;

                }
            )
            .join("");

}


/* =========================================================
   ALERTAS
   ========================================================= */

function renderizarAlertas() {

    const container =
        document.getElementById(
            "lista-alertas"
        );


    const alertas =
        meuArquivoState.alertas;


    atualizarContador(
        "total-alertas",
        Array.isArray(alertas)
            ? alertas.filter(
                item =>
                    item.read !== true &&
                    item.lido !== true
            ).length
            : 0
    );


    if (!container) {
        return;
    }


    if (
        !Array.isArray(alertas) ||
        alertas.length === 0
    ) {

        container.innerHTML =
            criarEstadoVazio(
                "Nenhum alerta registrado.",
                "fa-bell"
            );

        return;

    }


    container.innerHTML =
        alertas
            .map(
                function (alerta) {

                    const mensagem =
                        obterPrimeiroValor(
                            alerta,
                            [
                                "message",
                                "mensagem",
                                "title",
                                "titulo"
                            ],
                            "Nova atividade registrada."
                        );


                    const data =
                        obterPrimeiroValor(
                            alerta,
                            [
                                "created_at",
                                "data"
                            ],
                            ""
                        );


                    return `
                        <article class="alerta-item">

                            <div class="alerta-icon">

                                <i class="fa-solid fa-bell"></i>

                            </div>

                            <div class="alerta-content">

                                <p>
                                    ${escaparHTML(mensagem)}
                                </p>

                            </div>

                            <time class="alerta-data">

                                ${escaparHTML(
                                    formatarDataArquivo(
                                        data,
                                        true
                                    )
                                )}

                            </time>

                        </article>
                    `;

                }
            )
            .join("");

}


/* =========================================================
   CASOS ENVIADOS
   ========================================================= */

function renderizarCasosEnviados() {

    const container =
        document.getElementById(
            "lista-casos-enviados"
        );


    if (!container) {
        return;
    }


    const casos =
        meuArquivoState.casosEnviados;


    if (
        !Array.isArray(casos) ||
        casos.length === 0
    ) {

        container.innerHTML =
            criarEstadoVazio(
                "Você ainda não enviou nenhuma sugestão de caso.",
                "fa-paper-plane"
            );

        return;

    }


    container.innerHTML =
        casos
            .map(
                function (caso) {

                    const titulo =
                        obterPrimeiroValor(
                            caso,
                            [
                                "titulo",
                                "title",
                                "nome",
                                "caso"
                            ],
                            "Sugestão enviada"
                        );


                    const status =
                        obterPrimeiroValor(
                            caso,
                            [
                                "status",
                                "situacao"
                            ],
                            "Recebido"
                        );


                    return `
                        <article class="caso-enviado-item">

                            <div>

                                <strong>
                                    ${escaparHTML(titulo)}
                                </strong>

                                <span>
                                    Protocolo de sugestão
                                </span>

                            </div>

                            <span class="caso-enviado-status">

                                ${escaparHTML(status)}

                            </span>

                        </article>
                    `;

                }
            )
            .join("");

}

/* =========================================================
   SISTEMA DE MODAL
   ========================================================= */

function abrirModalArquivo(
    titulo,
    conteudo
) {

    const modal =
        arquivoElements.modal;


    if (!modal) {
        return;
    }


    if (
        arquivoElements.modalTitle
    ) {

        arquivoElements
            .modalTitle
            .textContent =
                titulo || "Meu Arquivo";

    }


    if (
        arquivoElements.modalContent
    ) {

        arquivoElements
            .modalContent
            .innerHTML =
                conteudo || "";

    }


    modal.hidden =
        false;


    document.body.classList.add(
        "arquivo-modal-aberto"
    );


    const primeiroCampo =
        modal.querySelector(
            "input, textarea, select, button"
        );


    if (primeiroCampo) {

        window.setTimeout(
            function () {

                primeiroCampo.focus();

            },
            50
        );

    }

}


function fecharModalArquivo() {

    const modal =
        arquivoElements.modal;


    if (!modal) {
        return;
    }


    modal.hidden =
        true;


    document.body.classList.remove(
        "arquivo-modal-aberto"
    );


    if (
        arquivoElements.modalContent
    ) {

        arquivoElements
            .modalContent
            .innerHTML = "";

    }

}


/* =========================================================
   EDIÇÃO DO PERFIL
   ========================================================= */

function abrirEdicaoPerfil() {

    const usuario =
        meuArquivoState.usuario;


    if (!usuario) {
        return;
    }


    const metadata =
        usuario.user_metadata || {};


    const nome =
        metadata.display_name ||
        metadata.full_name ||
        metadata.name ||
        "";


    const username =
        metadata.username ||
        gerarUsuarioArquivo(
            usuario.email
        );


    const bio =
        metadata.bio || "";


    abrirModalArquivo(
        "Editar credencial",
        `
            <form
                id="form-editar-perfil"
                class="arquivo-form"
            >

                <div class="arquivo-field">

                    <label for="perfil-nome">
                        Nome de exibição
                    </label>

                    <input
                        id="perfil-nome"
                        name="nome"
                        type="text"
                        maxlength="80"
                        autocomplete="name"
                        value="${escaparHTML(nome)}"
                        required
                    >

                </div>


                <div class="arquivo-field">

                    <label for="perfil-usuario">
                        Identificador
                    </label>

                    <input
                        id="perfil-usuario"
                        name="username"
                        type="text"
                        maxlength="40"
                        autocomplete="off"
                        value="${escaparHTML(username)}"
                    >

                </div>


                <div class="arquivo-field">

                    <label for="perfil-bio">
                        Nota de perfil
                    </label>

                    <textarea
                        id="perfil-bio"
                        name="bio"
                        maxlength="300"
                        placeholder="Escreva uma breve nota sobre você..."
                    >${escaparHTML(bio)}</textarea>

                </div>


                <div
                    id="perfil-mensagem"
                    aria-live="polite"
                ></div>


                <div class="arquivo-form-actions">

                    <button
                        type="button"
                        class="arquivo-button arquivo-button-secondary"
                        data-close-arquivo-modal
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        class="arquivo-button"
                    >
                        <i class="fa-solid fa-floppy-disk"></i>
                        Salvar alterações
                    </button>

                </div>

            </form>
        `
    );


    const formulario =
        document.getElementById(
            "form-editar-perfil"
        );


    if (formulario) {

        formulario.addEventListener(
            "submit",
            salvarEdicaoPerfil
        );

    }

}


async function salvarEdicaoPerfil(
    evento
) {

    evento.preventDefault();


    const formulario =
        evento.currentTarget;


    const botao =
        formulario.querySelector(
            'button[type="submit"]'
        );


    const mensagem =
        document.getElementById(
            "perfil-mensagem"
        );


    const nome =
        formulario.nome.value.trim();


    const username =
        formulario.username.value
            .trim()
            .toLowerCase()
            .replace(
                /[^a-z0-9._-]/g,
                ""
            );


    const bio =
        formulario.bio.value.trim();


    if (!nome) {

        mostrarMensagemElemento(
            mensagem,
            "Informe um nome de exibição.",
            "erro"
        );

        return;

    }


    const supabase =
        obterSupabaseMeuArquivo();


    if (!supabase) {
        return;
    }


    try {

        definirBotaoCarregando(
            botao,
            true
        );


        const {
            data,
            error
        } =
            await supabase.auth.updateUser({
                data: {
                    display_name: nome,
                    username:
                        username ||
                        gerarUsuarioArquivo(
                            meuArquivoState.usuario?.email
                        ),
                    bio: bio
                }
            });


        if (error) {
            throw error;
        }


        if (data?.user) {

            meuArquivoState.usuario =
                data.user;


            preencherDadosBasicosUsuario(
                data.user
            );

        }


        mostrarMensagemElemento(
            mensagem,
            "Credencial atualizada com sucesso.",
            "sucesso"
        );


        window.setTimeout(
            fecharModalArquivo,
            700
        );

    }
    catch (erro) {

        console.error(
            "Erro ao atualizar perfil:",
            erro
        );


        mostrarMensagemElemento(
            mensagem,
            "Não foi possível atualizar a credencial.",
            "erro"
        );

    }
    finally {

        definirBotaoCarregando(
            botao,
            false
        );

    }

}


/* =========================================================
   MENSAGENS DOS FORMULÁRIOS
   ========================================================= */

function mostrarMensagemElemento(
    elemento,
    texto,
    tipo = "erro"
) {

    if (!elemento) {
        return;
    }


    const classe =
        tipo === "sucesso"
            ? "arquivo-message-success"
            : "arquivo-message-error";


    const icone =
        tipo === "sucesso"
            ? "fa-circle-check"
            : "fa-triangle-exclamation";


    elemento.innerHTML = `
        <div class="arquivo-message ${classe}">

            <i class="fa-solid ${icone}"></i>

            <span>
                ${escaparHTML(texto)}
            </span>

        </div>
    `;

}


/* =========================================================
   BOTÃO EM ESTADO DE CARREGAMENTO
   ========================================================= */

function definirBotaoCarregando(
    botao,
    carregando
) {

    if (!botao) {
        return;
    }


    if (carregando) {

        if (
            !botao.dataset.textoOriginal
        ) {

            botao.dataset.textoOriginal =
                botao.innerHTML;

        }


        botao.disabled =
            true;


        botao.setAttribute(
            "aria-busy",
            "true"
        );


        botao.innerHTML = `
            <i class="fa-solid fa-circle-notch fa-spin"></i>
            Processando...
        `;


        return;

    }


    botao.disabled =
        false;


    botao.removeAttribute(
        "aria-busy"
    );


    if (
        botao.dataset.textoOriginal
    ) {

        botao.innerHTML =
            botao.dataset.textoOriginal;

    }

}


/* =========================================================
   ESTADO DE CARREGAMENTO DA PÁGINA
   ========================================================= */

function ativarEstadoCarregamento() {

    document.body.setAttribute(
        "aria-busy",
        "true"
    );

}


function desativarEstadoCarregamento() {

    document.body.removeAttribute(
        "aria-busy"
    );

}


/* =========================================================
   ERRO DE INICIALIZAÇÃO
   ========================================================= */

function mostrarErroInicial(
    mensagem
) {

    console.error(
        mensagem
    );


    if (
        arquivoElements.authWall
    ) {

        arquivoElements.authWall.hidden =
            false;


        const card =
            arquivoElements.authWall
                .querySelector(
                    ".arquivo-auth-card"
                );


        if (card) {

            card.innerHTML = `
                <div class="arquivo-auth-icon">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                </div>

                <small>
                    FALHA DE ACESSO
                </small>

                <h2>
                    Arquivo indisponível
                </h2>

                <p>
                    ${escaparHTML(mensagem)}
                </p>

                <div class="arquivo-auth-actions">

                    <button
                        type="button"
                        class="arquivo-button"
                        onclick="window.location.reload()"
                    >
                        Tentar novamente
                    </button>

                    <a
                        href="index.html"
                        class="arquivo-button arquivo-button-secondary"
                    >
                        Voltar ao início
                    </a>

                </div>
            `;

        }

    }

}


/* =========================================================
   FECHAMENTO DO MODAL
   ========================================================= */

function prepararEventosModal() {

    const modal =
        arquivoElements.modal;


    if (!modal) {
        return;
    }


    modal.addEventListener(
        "click",
        function (evento) {

            const fechar =
                evento.target.closest(
                    "[data-close-arquivo-modal]"
                );


            if (fechar) {

                fecharModalArquivo();

            }

        }
    );


    document.addEventListener(
        "keydown",
        function (evento) {

            if (
                evento.key === "Escape" &&
                !modal.hidden
            ) {

                fecharModalArquivo();

            }

        }
    );

}


/* =========================================================
   EVENTOS PRINCIPAIS DO MEU ARQUIVO
   ========================================================= */

function prepararEventosMeuArquivo() {

    prepararEventosModal();

    prepararEventoEditarPerfil();

    prepararEventoAvatar();

    prepararEventoCriarMural();

    prepararEventosInvestigacao();

    prepararEventosColecoes();

    prepararEventosComunidade();

    prepararEventosSeguranca();

}


/* =========================================================
   EDITAR PERFIL
   ========================================================= */

function prepararEventoEditarPerfil() {

    const botao =
        document.getElementById(
            "editar-perfil"
        );


    if (!botao) {
        return;
    }


    botao.addEventListener(
        "click",
        abrirEdicaoPerfil
    );

}


/* =========================================================
   ALTERAR AVATAR
   ========================================================= */

function prepararEventoAvatar() {

    const botao =
        document.getElementById(
            "alterar-avatar"
        );


    if (!botao) {
        return;
    }


    botao.addEventListener(
        "click",
        function () {

            abrirModalArquivo(
                "Alterar identificação",
                `
                    <div class="arquivo-form">

                        <div class="arquivo-message">

                            <i class="fa-solid fa-camera"></i>

                            <span>
                                A fotografia de identificação será
                                integrada ao armazenamento privado
                                do Arquivo na próxima etapa.
                            </span>

                        </div>

                        <div class="arquivo-form-actions">

                            <button
                                type="button"
                                class="arquivo-button"
                                data-close-arquivo-modal
                            >
                                Entendido
                            </button>

                        </div>

                    </div>
                `
            );

        }
    );

}


/* =========================================================
   CRIAR MURAL
   ========================================================= */

function prepararEventoCriarMural() {

    const botao =
        document.getElementById(
            "criar-mural"
        );


    if (!botao) {
        return;
    }


    botao.addEventListener(
        "click",
        abrirFormularioNovoMural
    );

}


function abrirFormularioNovoMural() {

    abrirModalArquivo(
        "Novo mural de investigação",
        `
            <form
                id="form-novo-mural"
                class="arquivo-form"
            >

                <div class="arquivo-field">

                    <label for="mural-nome">
                        Nome da investigação
                    </label>

                    <input
                        id="mural-nome"
                        name="nome"
                        type="text"
                        maxlength="120"
                        placeholder="Ex.: Caso sem identificação"
                        required
                    >

                </div>


                <div class="arquivo-field">

                    <label for="mural-descricao">
                        Nota inicial
                    </label>

                    <textarea
                        id="mural-descricao"
                        name="descricao"
                        maxlength="500"
                        placeholder="Descreva o objetivo desta investigação..."
                    ></textarea>

                </div>


                <div
                    class="arquivo-message"
                >

                    <i class="fa-solid fa-lock"></i>

                    <span>
                        O mural será privado por padrão.
                        Somente você poderá acessá-lo.
                    </span>

                </div>


                <div
                    id="mural-form-mensagem"
                    aria-live="polite"
                ></div>


                <div class="arquivo-form-actions">

                    <button
                        type="button"
                        class="arquivo-button arquivo-button-secondary"
                        data-close-arquivo-modal
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        class="arquivo-button"
                    >
                        <i class="fa-solid fa-thumbtack"></i>
                        Criar mural
                    </button>

                </div>

            </form>
        `
    );


    const formulario =
        document.getElementById(
            "form-novo-mural"
        );


    if (formulario) {

        formulario.addEventListener(
            "submit",
            criarNovoMural
        );

    }

}


/* =========================================================
   SALVAR NOVO MURAL
   ========================================================= */

async function criarNovoMural(
    evento
) {

    evento.preventDefault();


    const formulario =
        evento.currentTarget;


    const botao =
        formulario.querySelector(
            'button[type="submit"]'
        );


    const mensagem =
        document.getElementById(
            "mural-form-mensagem"
        );


    const nome =
        formulario.nome.value.trim();


    const descricao =
        formulario.descricao.value.trim();


    if (!nome) {

        mostrarMensagemElemento(
            mensagem,
            "Informe um nome para o mural.",
            "erro"
        );

        return;

    }


    const supabase =
    await obterSupabaseMeuArquivo();


    const usuario =
        meuArquivoState.usuario;


    if (
        !supabase ||
        !usuario
    ) {

        mostrarMensagemElemento(
            mensagem,
            "Sua sessão não pôde ser confirmada.",
            "erro"
        );

        return;

    }


    try {

        definirBotaoCarregando(
            botao,
            true
        );


        const {
            data,
            error
        } =
            await supabase
                .from(
                    "investigation_boards"
                )
                .insert({
                    user_id:
                        usuario.id,

                    title:
                        nome,

                    description:
                        descricao,

                    is_private:
                        true
                })
                .select()
                .single();


        if (error) {
            throw error;
        }


        if (data) {

            meuArquivoState.murais.unshift(
                data
            );


            renderizarMurais();


            atualizarResumoMeuArquivo();

        }


        mostrarMensagemElemento(
            mensagem,
            "Mural criado e arquivado.",
            "sucesso"
        );


        window.setTimeout(
            fecharModalArquivo,
            750
        );

    }
    catch (erro) {

        console.error(
            "Erro ao criar mural:",
            erro
        );


        mostrarMensagemElemento(
            mensagem,
            "O mural ainda não pôde ser criado. A estrutura de armazenamento será configurada no Supabase.",
            "erro"
        );

    }
    finally {

        definirBotaoCarregando(
            botao,
            false
        );

    }

}


/* =========================================================
   FERRAMENTAS DE INVESTIGAÇÃO
   ========================================================= */

function prepararEventosInvestigacao() {

    const abrirCaderno =
        document.getElementById(
            "abrir-caderno"
        );


    const abrirTeorias =
        document.getElementById(
            "abrir-teorias"
        );


    const abrirEvidencias =
        document.getElementById(
            "abrir-evidencias"
        );


    const novaLinhaTempo =
        document.getElementById(
            "nova-linha-tempo"
        );


    if (abrirCaderno) {

        abrirCaderno.addEventListener(
            "click",
            abrirCadernoInvestigador
        );

    }


    if (abrirTeorias) {

        abrirTeorias.addEventListener(
            "click",
            abrirMinhasTeorias
        );

    }


    if (abrirEvidencias) {

        abrirEvidencias.addEventListener(
            "click",
            abrirEvidenciasSalvas
        );

    }


    if (novaLinhaTempo) {

        novaLinhaTempo.addEventListener(
            "click",
            abrirNovaLinhaTempo
        );

    }

}


/* =========================================================
   CADERNO DO INVESTIGADOR
   ========================================================= */

function abrirCadernoInvestigador() {

    const anotacoes =
        meuArquivoState.anotacoes;


    let conteudo = "";


    if (
        !Array.isArray(anotacoes) ||
        anotacoes.length === 0
    ) {

        conteudo =
            criarEstadoVazio(
                "Seu caderno ainda não possui anotações.",
                "fa-book"
            );

    }
    else {

        conteudo =
            anotacoes
                .map(
                    function (item) {

                        const titulo =
                            obterPrimeiroValor(
                                item,
                                [
                                    "title",
                                    "titulo"
                                ],
                                "Anotação"
                            );


                        const texto =
                            obterPrimeiroValor(
                                item,
                                [
                                    "content",
                                    "conteudo",
                                    "notes",
                                    "nota"
                                ],
                                ""
                            );


                        return `
                            <article class="arquivo-message">

                                <i class="fa-solid fa-note-sticky"></i>

                                <div>

                                    <strong>
                                        ${escaparHTML(titulo)}
                                    </strong>

                                    <p>
                                        ${escaparHTML(texto)}
                                    </p>

                                </div>

                            </article>
                        `;

                    }
                )
                .join("");

    }


    abrirModalArquivo(
        "Caderno do Investigador",
        `
            <div class="arquivo-form">

                ${conteudo}

                <div class="arquivo-form-actions">

                    <button
                        type="button"
                        class="arquivo-button"
                        id="nova-anotacao"
                    >
                        <i class="fa-solid fa-plus"></i>
                        Nova anotação
                    </button>

                </div>

            </div>
        `
    );


    const botao =
        document.getElementById(
            "nova-anotacao"
        );


    if (botao) {

        botao.addEventListener(
            "click",
            abrirFormularioNovaAnotacao
        );

    }

}


/* =========================================================
   FORMULÁRIO DE NOVA ANOTAÇÃO
   ========================================================= */

function abrirFormularioNovaAnotacao() {

    abrirModalArquivo(
        "Nova anotação privada",
        `
            <form
                id="form-nova-anotacao"
                class="arquivo-form"
            >

                <div class="arquivo-field">

                    <label for="anotacao-titulo">
                        Título
                    </label>

                    <input
                        id="anotacao-titulo"
                        name="titulo"
                        type="text"
                        maxlength="120"
                        required
                    >

                </div>


                <div class="arquivo-field">

                    <label for="anotacao-conteudo">
                        Anotação
                    </label>

                    <textarea
                        id="anotacao-conteudo"
                        name="conteudo"
                        maxlength="5000"
                        required
                    ></textarea>

                </div>


                <div
                    id="anotacao-mensagem"
                    aria-live="polite"
                ></div>


                <div class="arquivo-form-actions">

                    <button
                        type="button"
                        class="arquivo-button arquivo-button-secondary"
                        data-close-arquivo-modal
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        class="arquivo-button"
                    >
                        <i class="fa-solid fa-floppy-disk"></i>
                        Arquivar anotação
                    </button>

                </div>

            </form>
        `
    );


    const formulario =
        document.getElementById(
            "form-nova-anotacao"
        );


    if (formulario) {

        formulario.addEventListener(
            "submit",
            salvarNovaAnotacao
        );

    }

}

/* =========================================================
   SALVAR NOVA ANOTAÇÃO
   ========================================================= */

async function salvarNovaAnotacao(
    evento
) {

    evento.preventDefault();


    const formulario =
        evento.currentTarget;


    const botao =
        formulario.querySelector(
            'button[type="submit"]'
        );


    const mensagem =
        document.getElementById(
            "anotacao-mensagem"
        );


    const titulo =
        formulario.titulo.value.trim();


    const conteudo =
        formulario.conteudo.value.trim();


    if (
        !titulo ||
        !conteudo
    ) {

        mostrarMensagemElemento(
            mensagem,
            "Preencha o título e a anotação.",
            "erro"
        );

        return;

    }


    const supabase =
    await obterSupabaseMeuArquivo();


    const usuario =
        meuArquivoState.usuario;


    if (
        !supabase ||
        !usuario
    ) {

        mostrarMensagemElemento(
            mensagem,
            "Sua sessão não pôde ser confirmada.",
            "erro"
        );

        return;

    }


    try {

        definirBotaoCarregando(
            botao,
            true
        );


        const {
            data,
            error
        } =
            await supabase
                .from(
                    "investigator_notes"
                )
                .insert({
                    user_id:
                        usuario.id,

                    title:
                        titulo,

                    content:
                        conteudo
                })
                .select()
                .single();


        if (error) {
            throw error;
        }


        if (data) {

            meuArquivoState.anotacoes.unshift(
                data
            );


            atualizarContador(
                "contador-caderno",
                meuArquivoState.anotacoes.length
            );


            atualizarResumoMeuArquivo();

        }


        mostrarMensagemElemento(
            mensagem,
            "Anotação arquivada com sucesso.",
            "sucesso"
        );


        window.setTimeout(
            abrirCadernoInvestigador,
            700
        );

    }
    catch (erro) {

        console.error(
            "Erro ao salvar anotação:",
            erro
        );


        mostrarMensagemElemento(
            mensagem,
            "A anotação ainda não pôde ser arquivada. A estrutura será configurada no Supabase.",
            "erro"
        );

    }
    finally {

        definirBotaoCarregando(
            botao,
            false
        );

    }

}


/* =========================================================
   MINHAS TEORIAS
   ========================================================= */

function abrirMinhasTeorias() {

    const teorias =
        meuArquivoState.teorias;


    let conteudo = "";


    if (
        !Array.isArray(teorias) ||
        teorias.length === 0
    ) {

        conteudo =
            criarEstadoVazio(
                "Nenhuma teoria particular foi registrada.",
                "fa-lightbulb"
            );

    }
    else {

        conteudo =
            teorias
                .map(
                    function (teoria) {

                        const titulo =
                            obterPrimeiroValor(
                                teoria,
                                [
                                    "title",
                                    "titulo"
                                ],
                                "Teoria sem título"
                            );


                        const texto =
                            obterPrimeiroValor(
                                teoria,
                                [
                                    "content",
                                    "conteudo",
                                    "theory",
                                    "teoria"
                                ],
                                ""
                            );


                        return `
                            <article class="arquivo-message">

                                <i class="fa-solid fa-lightbulb"></i>

                                <div>

                                    <strong>
                                        ${escaparHTML(titulo)}
                                    </strong>

                                    <p>
                                        ${escaparHTML(texto)}
                                    </p>

                                </div>

                            </article>
                        `;

                    }
                )
                .join("");

    }


    abrirModalArquivo(
        "Minhas Teorias",
        `
            <div class="arquivo-form">

                <div class="arquivo-message">

                    <i class="fa-solid fa-lock"></i>

                    <span>
                        Teorias pessoais permanecem privadas
                        até que você escolha compartilhá-las.
                    </span>

                </div>

                ${conteudo}

                <div class="arquivo-form-actions">

                    <button
                        type="button"
                        class="arquivo-button"
                        id="nova-teoria"
                    >
                        <i class="fa-solid fa-plus"></i>
                        Nova teoria
                    </button>

                </div>

            </div>
        `
    );


    const botao =
        document.getElementById(
            "nova-teoria"
        );


    if (botao) {

        botao.addEventListener(
            "click",
            abrirFormularioNovaTeoria
        );

    }

}


/* =========================================================
   NOVA TEORIA
   ========================================================= */

function abrirFormularioNovaTeoria() {

    abrirModalArquivo(
        "Registrar teoria",
        `
            <form
                id="form-nova-teoria"
                class="arquivo-form"
            >

                <div class="arquivo-field">

                    <label for="teoria-titulo">
                        Título da teoria
                    </label>

                    <input
                        id="teoria-titulo"
                        name="titulo"
                        type="text"
                        maxlength="140"
                        required
                    >

                </div>


                <div class="arquivo-field">

                    <label for="teoria-conteudo">
                        Desenvolvimento
                    </label>

                    <textarea
                        id="teoria-conteudo"
                        name="conteudo"
                        maxlength="8000"
                        placeholder="Registre sua hipótese, relações e dúvidas..."
                        required
                    ></textarea>

                </div>


                <div class="arquivo-message">

                    <i class="fa-solid fa-scale-balanced"></i>

                    <span>
                        Diferencie hipóteses pessoais de fatos
                        documentados, especialmente quando houver
                        pessoas reais envolvidas.
                    </span>

                </div>


                <div
                    id="teoria-mensagem"
                    aria-live="polite"
                ></div>


                <div class="arquivo-form-actions">

                    <button
                        type="button"
                        class="arquivo-button arquivo-button-secondary"
                        data-close-arquivo-modal
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        class="arquivo-button"
                    >
                        <i class="fa-solid fa-floppy-disk"></i>
                        Arquivar teoria
                    </button>

                </div>

            </form>
        `
    );


    const formulario =
        document.getElementById(
            "form-nova-teoria"
        );


    if (formulario) {

        formulario.addEventListener(
            "submit",
            salvarNovaTeoria
        );

    }

}


/* =========================================================
   SALVAR TEORIA
   ========================================================= */

async function salvarNovaTeoria(
    evento
) {

    evento.preventDefault();


    const formulario =
        evento.currentTarget;


    const botao =
        formulario.querySelector(
            'button[type="submit"]'
        );


    const mensagem =
        document.getElementById(
            "teoria-mensagem"
        );


    const titulo =
        formulario.titulo.value.trim();


    const conteudo =
        formulario.conteudo.value.trim();


    if (
        !titulo ||
        !conteudo
    ) {

        mostrarMensagemElemento(
            mensagem,
            "Preencha o título e o desenvolvimento da teoria.",
            "erro"
        );

        return;

    }


    const supabase =
    await obterSupabaseMeuArquivo();


    const usuario =
        meuArquivoState.usuario;


    if (
        !supabase ||
        !usuario
    ) {
        return;
    }


    try {

        definirBotaoCarregando(
            botao,
            true
        );


        const {
            data,
            error
        } =
            await supabase
                .from(
                    "user_theories"
                )
                .insert({
                    user_id:
                        usuario.id,

                    title:
                        titulo,

                    content:
                        conteudo,

                    is_public:
                        false
                })
                .select()
                .single();


        if (error) {
            throw error;
        }


        if (data) {

            meuArquivoState.teorias.unshift(
                data
            );


            atualizarContador(
                "contador-teorias",
                meuArquivoState.teorias.length
            );

        }


        mostrarMensagemElemento(
            mensagem,
            "Teoria arquivada como registro privado.",
            "sucesso"
        );


        window.setTimeout(
            abrirMinhasTeorias,
            700
        );

    }
    catch (erro) {

        console.error(
            "Erro ao salvar teoria:",
            erro
        );


        mostrarMensagemElemento(
            mensagem,
            "A teoria ainda não pôde ser arquivada. A estrutura será configurada no Supabase.",
            "erro"
        );

    }
    finally {

        definirBotaoCarregando(
            botao,
            false
        );

    }

}


/* =========================================================
   EVIDÊNCIAS SALVAS
   ========================================================= */

function abrirEvidenciasSalvas() {

    const evidencias =
        meuArquivoState.evidencias;


    let conteudo = "";


    if (
        !Array.isArray(evidencias) ||
        evidencias.length === 0
    ) {

        conteudo =
            criarEstadoVazio(
                "Nenhuma evidência foi salva.",
                "fa-paperclip"
            );

    }
    else {

        conteudo =
            evidencias
                .map(
                    function (item) {

                        const titulo =
                            obterPrimeiroValor(
                                item,
                                [
                                    "title",
                                    "titulo",
                                    "label",
                                    "nome"
                                ],
                                "Evidência"
                            );


                        const tipo =
                            obterPrimeiroValor(
                                item,
                                [
                                    "type",
                                    "tipo"
                                ],
                                "Registro"
                            );


                        return `
                            <article class="arquivo-message">

                                <i class="fa-solid fa-paperclip"></i>

                                <div>

                                    <strong>
                                        ${escaparHTML(titulo)}
                                    </strong>

                                    <p>
                                        ${escaparHTML(tipo)}
                                    </p>

                                </div>

                            </article>
                        `;

                    }
                )
                .join("");

    }


    abrirModalArquivo(
        "Evidências Salvas",
        `
            <div class="arquivo-form">

                ${conteudo}

                <div class="arquivo-message">

                    <i class="fa-solid fa-circle-info"></i>

                    <span>
                        Evidências poderão ser adicionadas diretamente
                        dos dossiês e vinculadas aos murais.
                    </span>

                </div>

            </div>
        `
    );

}


/* =========================================================
   NOVA LINHA DO TEMPO
   ========================================================= */

function abrirNovaLinhaTempo() {

    abrirModalArquivo(
        "Nova linha do tempo",
        `
            <form
                id="form-nova-linha-tempo"
                class="arquivo-form"
            >

                <div class="arquivo-field">

                    <label for="timeline-titulo">
                        Nome da cronologia
                    </label>

                    <input
                        id="timeline-titulo"
                        name="titulo"
                        type="text"
                        maxlength="140"
                        placeholder="Ex.: Últimas 48 horas"
                        required
                    >

                </div>


                <div class="arquivo-field">

                    <label for="timeline-descricao">
                        Descrição
                    </label>

                    <textarea
                        id="timeline-descricao"
                        name="descricao"
                        maxlength="1000"
                        placeholder="Qual período ou sequência será analisada?"
                    ></textarea>

                </div>


                <div
                    id="timeline-mensagem"
                    aria-live="polite"
                ></div>


                <div class="arquivo-form-actions">

                    <button
                        type="button"
                        class="arquivo-button arquivo-button-secondary"
                        data-close-arquivo-modal
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        class="arquivo-button"
                    >
                        <i class="fa-solid fa-timeline"></i>
                        Criar cronologia
                    </button>

                </div>

            </form>
        `
    );


    const formulario =
        document.getElementById(
            "form-nova-linha-tempo"
        );


    if (formulario) {

        formulario.addEventListener(
            "submit",
            salvarNovaLinhaTempo
        );

    }

}

/* =========================================================
   SALVAR NOVA LINHA DO TEMPO
   ========================================================= */

async function salvarNovaLinhaTempo(
    evento
) {

    evento.preventDefault();


    const formulario =
        evento.currentTarget;


    const botao =
        formulario.querySelector(
            'button[type="submit"]'
        );


    const mensagem =
        document.getElementById(
            "timeline-mensagem"
        );


    const titulo =
        formulario.titulo.value.trim();


    const descricao =
        formulario.descricao.value.trim();


    if (!titulo) {

        mostrarMensagemElemento(
            mensagem,
            "Informe um nome para a linha do tempo.",
            "erro"
        );

        return;

    }


    const supabase =
    await obterSupabaseMeuArquivo();


    const usuario =
        meuArquivoState.usuario;


    if (
        !supabase ||
        !usuario
    ) {

        mostrarMensagemElemento(
            mensagem,
            "Sua sessão não pôde ser confirmada.",
            "erro"
        );

        return;

    }


    try {

        definirBotaoCarregando(
            botao,
            true
        );


        const {
            data,
            error
        } =
            await supabase
                .from(
                    "investigation_timelines"
                )
                .insert({
                    user_id:
                        usuario.id,

                    title:
                        titulo,

                    description:
                        descricao
                })
                .select()
                .single();


        if (error) {
            throw error;
        }


        if (data) {

            meuArquivoState
                .linhasDoTempo
                .unshift(
                    data
                );


            renderizarLinhasDoTempo();

        }


        mostrarMensagemElemento(
            mensagem,
            "Linha do tempo criada com sucesso.",
            "sucesso"
        );


        window.setTimeout(
            fecharModalArquivo,
            700
        );

    }
    catch (erro) {

        console.error(
            "Erro ao criar linha do tempo:",
            erro
        );


        mostrarMensagemElemento(
            mensagem,
            "A linha do tempo ainda não pôde ser criada. A estrutura será configurada no Supabase.",
            "erro"
        );

    }
    finally {

        definirBotaoCarregando(
            botao,
            false
        );

    }

}


/* =========================================================
   EVENTOS DAS COLEÇÕES
   ========================================================= */

function prepararEventosColecoes() {

    const criarMarcador =
        document.getElementById(
            "criar-marcador"
        );


    const limparHistorico =
        document.getElementById(
            "limpar-historico"
        );


    if (criarMarcador) {

        criarMarcador.addEventListener(
            "click",
            abrirFormularioMarcador
        );

    }


    if (limparHistorico) {

        limparHistorico.addEventListener(
            "click",
            confirmarLimpezaHistorico
        );

    }

}


/* =========================================================
   NOVO MARCADOR
   ========================================================= */

function abrirFormularioMarcador() {

    abrirModalArquivo(
        "Criar marcador",
        `
            <form
                id="form-novo-marcador"
                class="arquivo-form"
            >

                <div class="arquivo-field">

                    <label for="marcador-nome">
                        Nome do marcador
                    </label>

                    <input
                        id="marcador-nome"
                        name="nome"
                        type="text"
                        maxlength="60"
                        placeholder="Ex.: Casos não solucionados"
                        required
                    >

                </div>


                <div
                    id="marcador-mensagem"
                    aria-live="polite"
                ></div>


                <div class="arquivo-form-actions">

                    <button
                        type="button"
                        class="arquivo-button arquivo-button-secondary"
                        data-close-arquivo-modal
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        class="arquivo-button"
                    >
                        <i class="fa-solid fa-tag"></i>
                        Criar marcador
                    </button>

                </div>

            </form>
        `
    );


    const formulario =
        document.getElementById(
            "form-novo-marcador"
        );


    if (formulario) {

        formulario.addEventListener(
            "submit",
            salvarNovoMarcador
        );

    }

}


async function salvarNovoMarcador(
    evento
) {

    evento.preventDefault();


    const formulario =
        evento.currentTarget;


    const botao =
        formulario.querySelector(
            'button[type="submit"]'
        );


    const mensagem =
        document.getElementById(
            "marcador-mensagem"
        );


    const nome =
        formulario.nome.value.trim();


    if (!nome) {

        mostrarMensagemElemento(
            mensagem,
            "Informe um nome para o marcador.",
            "erro"
        );

        return;

    }


    const supabase =
    await obterSupabaseMeuArquivo();


    const usuario =
        meuArquivoState.usuario;


    if (
        !supabase ||
        !usuario
    ) {

        return;

    }


    try {

        definirBotaoCarregando(
            botao,
            true
        );


        const {
            data,
            error
        } =
            await supabase
                .from(
                    "user_tags"
                )
                .insert({
                    user_id:
                        usuario.id,

                    name:
                        nome
                })
                .select()
                .single();


        if (error) {
            throw error;
        }


        if (data) {

            meuArquivoState
                .marcadores
                .unshift(
                    data
                );


            renderizarMarcadores();

        }


        mostrarMensagemElemento(
            mensagem,
            "Marcador criado.",
            "sucesso"
        );


        window.setTimeout(
            fecharModalArquivo,
            650
        );

    }
    catch (erro) {

        console.error(
            "Erro ao criar marcador:",
            erro
        );


        mostrarMensagemElemento(
            mensagem,
            "O marcador ainda não pôde ser salvo. A estrutura será configurada no Supabase.",
            "erro"
        );

    }
    finally {

        definirBotaoCarregando(
            botao,
            false
        );

    }

}


/* =========================================================
   LIMPAR HISTÓRICO
   ========================================================= */

function confirmarLimpezaHistorico() {

    abrirModalArquivo(
        "Limpar histórico",
        `
            <div class="arquivo-form">

                <div class="arquivo-message arquivo-message-error">

                    <i class="fa-solid fa-triangle-exclamation"></i>

                    <span>
                        Esta ação removerá o histórico de investigação
                        associado à sua conta. Seus dossiês, notas,
                        teorias e murais não serão apagados.
                    </span>

                </div>


                <div
                    id="historico-mensagem"
                    aria-live="polite"
                ></div>


                <div class="arquivo-form-actions">

                    <button
                        type="button"
                        class="arquivo-button arquivo-button-secondary"
                        data-close-arquivo-modal
                    >
                        Cancelar
                    </button>

                    <button
                        type="button"
                        class="arquivo-button arquivo-button-danger"
                        id="confirmar-limpar-historico"
                    >
                        <i class="fa-solid fa-trash"></i>
                        Limpar histórico
                    </button>

                </div>

            </div>
        `
    );


    const botao =
        document.getElementById(
            "confirmar-limpar-historico"
        );


    if (botao) {

        botao.addEventListener(
            "click",
            limparHistoricoUsuario
        );

    }

}


async function limparHistoricoUsuario(
    evento
) {

    const botao =
        evento.currentTarget;


    const mensagem =
        document.getElementById(
            "historico-mensagem"
        );


    const supabase =
    await obterSupabaseMeuArquivo();


    const usuario =
        meuArquivoState.usuario;


    if (
        !supabase ||
        !usuario
    ) {

        return;

    }


    try {

        definirBotaoCarregando(
            botao,
            true
        );


        const {
            error
        } =
            await supabase
                .from(
                    "user_history"
                )
                .delete()
                .eq(
                    "user_id",
                    usuario.id
                );


        if (error) {
            throw error;
        }


        meuArquivoState.historico =
            [];


        renderizarHistorico();


        mostrarMensagemElemento(
            mensagem,
            "Histórico removido.",
            "sucesso"
        );


        window.setTimeout(
            fecharModalArquivo,
            650
        );

    }
    catch (erro) {

        console.error(
            "Erro ao limpar histórico:",
            erro
        );


        mostrarMensagemElemento(
            mensagem,
            "O histórico não pôde ser removido.",
            "erro"
        );

    }
    finally {

        definirBotaoCarregando(
            botao,
            false
        );

    }

}


/* =========================================================
   CLIQUES EM ITENS DINÂMICOS
   ========================================================= */

document.addEventListener(
    "click",
    function (evento) {

        const mural =
            evento.target.closest(
                "[data-mural-id]"
            );


        if (mural) {

            const muralId =
                mural.dataset.muralId;


            abrirMuralInvestigacao(
                muralId
            );

            return;

        }


        const item =
            evento.target.closest(
                "[data-arquivo-item-id]"
            );


        if (item) {

            abrirRegistroArquivo(
                item.dataset.arquivoItemId
            );

        }

    }
);


/* =========================================================
   ABRIR MURAL
   ========================================================= */

function abrirMuralInvestigacao(
    muralId
) {

    const mural =
        meuArquivoState.murais.find(
            item =>
                String(item.id) ===
                String(muralId)
        );


    if (!mural) {

        abrirModalArquivo(
            "Mural de investigação",
            criarEstadoVazio(
                "Este mural não pôde ser localizado.",
                "fa-thumbtack"
            )
        );

        return;

    }


    const titulo =
        obterPrimeiroValor(
            mural,
            [
                "title",
                "titulo",
                "name",
                "nome"
            ],
            "Investigação"
        );


    const descricao =
        obterPrimeiroValor(
            mural,
            [
                "description",
                "descricao"
            ],
            "Nenhuma nota inicial registrada."
        );


    abrirModalArquivo(
        titulo,
        `
            <div class="arquivo-form">

                <div class="arquivo-message">

                    <i class="fa-solid fa-lock"></i>

                    <div>

                        <strong>
                            Mural particular
                        </strong>

                        <p>
                            ${escaparHTML(descricao)}
                        </p>

                    </div>

                </div>


                <div class="arquivo-message">

                    <i class="fa-solid fa-diagram-project"></i>

                    <span>
                        A área interativa para posicionar fotografias,
                        documentos, pessoas, pistas e fios de conexão
                        será vinculada a este mural nas próximas etapas.
                    </span>

                </div>

            </div>
        `
    );

}


/* =========================================================
   ABRIR REGISTRO GENÉRICO
   ========================================================= */

function abrirRegistroArquivo(
    itemId
) {

    if (!itemId) {
        return;
    }


    abrirModalArquivo(
        "Registro arquivado",
        `
            <div class="arquivo-form">

                <div class="arquivo-message">

                    <i class="fa-solid fa-folder-open"></i>

                    <span>
                        O registro está vinculado ao seu arquivo pessoal.
                        A abertura direta do dossiê será conectada
                        quando integrarmos esta coleção aos casos.
                    </span>

                </div>

            </div>
        `
    );

}

/* =========================================================
   EVENTOS DA COMUNIDADE
   ========================================================= */

function prepararEventosComunidade() {

    const abrirPublicacoes =
        document.getElementById(
            "abrir-publicacoes"
        );

    const abrirComentarios =
        document.getElementById(
            "abrir-comentarios"
        );

    const abrirSeguidos =
        document.getElementById(
            "abrir-seguidos"
        );

    const abrirBloqueados =
        document.getElementById(
            "abrir-bloqueados"
        );

    const marcarAlertas =
        document.getElementById(
            "marcar-alertas-lidos"
        );


    if (abrirPublicacoes) {

        abrirPublicacoes.addEventListener(
            "click",
            mostrarPublicacoesUsuario
        );

    }


    if (abrirComentarios) {

        abrirComentarios.addEventListener(
            "click",
            mostrarComentariosUsuario
        );

    }


    if (abrirSeguidos) {

        abrirSeguidos.addEventListener(
            "click",
            mostrarSeguidosUsuario
        );

    }


    if (abrirBloqueados) {

        abrirBloqueados.addEventListener(
            "click",
            mostrarBloqueadosUsuario
        );

    }


    if (marcarAlertas) {

        marcarAlertas.addEventListener(
            "click",
            marcarTodosAlertasComoLidos
        );

    }

}


/* =========================================================
   MINHAS PUBLICAÇÕES
   ========================================================= */

function mostrarPublicacoesUsuario() {

    const publicacoes =
        meuArquivoState.publicacoes;


    if (
        !Array.isArray(publicacoes) ||
        publicacoes.length === 0
    ) {

        abrirModalArquivo(
            "Minhas Publicações",
            criarEstadoVazio(
                "Você ainda não publicou registros na comunidade.",
                "fa-file-pen"
            )
        );

        return;

    }


    const conteudo =
        publicacoes
            .map(
                function (item) {

                    const titulo =
                        obterPrimeiroValor(
                            item,
                            [
                                "title",
                                "titulo"
                            ],
                            "Publicação"
                        );


                    const data =
                        obterPrimeiroValor(
                            item,
                            [
                                "created_at",
                                "data"
                            ],
                            ""
                        );


                    return `
                        <article class="arquivo-message">

                            <i class="fa-solid fa-file-pen"></i>

                            <div>

                                <strong>
                                    ${escaparHTML(titulo)}
                                </strong>

                                <p>
                                    ${escaparHTML(
                                        formatarDataArquivo(
                                            data,
                                            true
                                        )
                                    )}
                                </p>

                            </div>

                        </article>
                    `;

                }
            )
            .join("");


    abrirModalArquivo(
        "Minhas Publicações",
        `
            <div class="arquivo-form">
                ${conteudo}
            </div>
        `
    );

}


/* =========================================================
   MEUS COMENTÁRIOS
   ========================================================= */

function mostrarComentariosUsuario() {

    const comentarios =
        meuArquivoState.comentarios;


    if (
        !Array.isArray(comentarios) ||
        comentarios.length === 0
    ) {

        abrirModalArquivo(
            "Registros de Interrogatório",
            criarEstadoVazio(
                "Nenhum comentário foi localizado.",
                "fa-comments"
            )
        );

        return;

    }


    const conteudo =
        comentarios
            .map(
                function (item) {

                    const texto =
                        obterPrimeiroValor(
                            item,
                            [
                                "content",
                                "conteudo",
                                "comment",
                                "comentario",
                                "texto"
                            ],
                            "Comentário registrado."
                        );


                    const data =
                        obterPrimeiroValor(
                            item,
                            [
                                "created_at",
                                "data"
                            ],
                            ""
                        );


                    return `
                        <article class="arquivo-message">

                            <i class="fa-solid fa-comment"></i>

                            <div>

                                <p>
                                    ${escaparHTML(texto)}
                                </p>

                                <small>
                                    ${escaparHTML(
                                        formatarDataArquivo(
                                            data,
                                            true
                                        )
                                    )}
                                </small>

                            </div>

                        </article>
                    `;

                }
            )
            .join("");


    abrirModalArquivo(
        "Registros de Interrogatório",
        `
            <div class="arquivo-form">
                ${conteudo}
            </div>
        `
    );

}


/* =========================================================
   INVESTIGADORES SEGUIDOS
   ========================================================= */

function mostrarSeguidosUsuario() {

    const seguidos =
        meuArquivoState.seguidos;


    if (
        !Array.isArray(seguidos) ||
        seguidos.length === 0
    ) {

        abrirModalArquivo(
            "Investigadores Seguidos",
            criarEstadoVazio(
                "Você ainda não acompanha outros investigadores.",
                "fa-user-group"
            )
        );

        return;

    }


    abrirModalArquivo(
        "Investigadores Seguidos",
        `
            <div class="arquivo-form">

                ${
                    seguidos
                        .map(
                            function (item) {

                                const nome =
                                    obterPrimeiroValor(
                                        item,
                                        [
                                            "display_name",
                                            "username",
                                            "name",
                                            "nome"
                                        ],
                                        "Investigador"
                                    );


                                return `
                                    <article class="arquivo-message">

                                        <i class="fa-solid fa-user-secret"></i>

                                        <strong>
                                            ${escaparHTML(nome)}
                                        </strong>

                                    </article>
                                `;

                            }
                        )
                        .join("")
                }

            </div>
        `
    );

}


/* =========================================================
   USUÁRIOS BLOQUEADOS
   ========================================================= */

function mostrarBloqueadosUsuario() {

    const bloqueados =
        meuArquivoState.bloqueados;


    if (
        !Array.isArray(bloqueados) ||
        bloqueados.length === 0
    ) {

        abrirModalArquivo(
            "Bloqueados",
            criarEstadoVazio(
                "Nenhum investigador está bloqueado.",
                "fa-user-slash"
            )
        );

        return;

    }


    abrirModalArquivo(
        "Bloqueados",
        `
            <div class="arquivo-form">

                ${
                    bloqueados
                        .map(
                            function (item) {

                                const nome =
                                    obterPrimeiroValor(
                                        item,
                                        [
                                            "blocked_name",
                                            "username",
                                            "name",
                                            "nome"
                                        ],
                                        "Investigador bloqueado"
                                    );


                                return `
                                    <article class="arquivo-message">

                                        <i class="fa-solid fa-user-slash"></i>

                                        <strong>
                                            ${escaparHTML(nome)}
                                        </strong>

                                    </article>
                                `;

                            }
                        )
                        .join("")
                }

            </div>
        `
    );

}


/* =========================================================
   MARCAR ALERTAS COMO LIDOS
   ========================================================= */

async function marcarTodosAlertasComoLidos(
    evento
) {

    const botao =
        evento?.currentTarget || null;


    const supabase =
    await obterSupabaseMeuArquivo();


    const usuario =
        meuArquivoState.usuario;


    if (
        !supabase ||
        !usuario
    ) {

        return;

    }


    try {

        definirBotaoCarregando(
            botao,
            true
        );


        const {
            error
        } =
            await supabase
                .from(
                    "user_notifications"
                )
                .update({
                    read: true
                })
                .eq(
                    "user_id",
                    usuario.id
                );


        if (error) {
            throw error;
        }


        meuArquivoState.alertas =
            meuArquivoState.alertas.map(
                function (item) {

                    return {
                        ...item,
                        read: true
                    };

                }
            );


        renderizarAlertas();

    }
    catch (erro) {

        console.error(
            "Erro ao atualizar alertas:",
            erro
        );

    }
    finally {

        definirBotaoCarregando(
            botao,
            false
        );

    }

}


/* =========================================================
   EVENTOS DA SALA DE SEGURANÇA
   ========================================================= */

function prepararEventosSeguranca() {

    const alterarEmail =
        document.getElementById(
            "alterar-email"
        );

    const alterarSenha =
        document.getElementById(
            "alterar-senha"
        );

    const logout =
        document.getElementById(
            "arquivo-logout"
        );


    if (alterarEmail) {

        alterarEmail.addEventListener(
            "click",
            abrirAlteracaoEmail
        );

    }


    if (alterarSenha) {

        alterarSenha.addEventListener(
            "click",
            abrirAlteracaoSenha
        );

    }


    if (logout) {

        logout.addEventListener(
            "click",
            confirmarLogoutArquivo
        );

    }

}


/* =========================================================
   ALTERAÇÃO DE E-MAIL
   ========================================================= */

function abrirAlteracaoEmail() {

    const emailAtual =
        meuArquivoState.usuario?.email ||
        "";


    abrirModalArquivo(
        "Alterar e-mail",
        `
            <form
                id="form-alterar-email"
                class="arquivo-form"
            >

                <div class="arquivo-field">

                    <label>
                        E-mail atual
                    </label>

                    <input
                        type="email"
                        value="${escaparHTML(emailAtual)}"
                        disabled
                    >

                </div>


                <div class="arquivo-field">

                    <label for="novo-email">
                        Novo e-mail
                    </label>

                    <input
                        id="novo-email"
                        name="email"
                        type="email"
                        autocomplete="email"
                        required
                    >

                </div>


                <div
                    id="email-mensagem"
                    aria-live="polite"
                ></div>


                <div class="arquivo-form-actions">

                    <button
                        type="button"
                        class="arquivo-button arquivo-button-secondary"
                        data-close-arquivo-modal
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        class="arquivo-button"
                    >
                        Atualizar e-mail
                    </button>

                </div>

            </form>
        `
    );


    const formulario =
        document.getElementById(
            "form-alterar-email"
        );


    if (formulario) {

        formulario.addEventListener(
            "submit",
            salvarNovoEmail
        );

    }

}


async function salvarNovoEmail(
    evento
) {

    evento.preventDefault();


    const formulario =
        evento.currentTarget;


    const botao =
        formulario.querySelector(
            'button[type="submit"]'
        );


    const mensagem =
        document.getElementById(
            "email-mensagem"
        );


    const novoEmail =
        formulario.email.value
            .trim()
            .toLowerCase();


    if (!novoEmail) {

        mostrarMensagemElemento(
            mensagem,
            "Informe o novo e-mail.",
            "erro"
        );

        return;

    }


    const supabase =
    await obterSupabaseMeuArquivo();


    if (!supabase) {
        return;
    }


    try {

        definirBotaoCarregando(
            botao,
            true
        );


        const {
            error
        } =
            await supabase.auth.updateUser({
                email: novoEmail
            });


        if (error) {
            throw error;
        }


        mostrarMensagemElemento(
            mensagem,
            "Solicitação registrada. Verifique as mensagens de confirmação enviadas pelo sistema.",
            "sucesso"
        );

    }
    catch (erro) {

        console.error(
            "Erro ao alterar e-mail:",
            erro
        );


        mostrarMensagemElemento(
            mensagem,
            "Não foi possível alterar o e-mail.",
            "erro"
        );

    }
    finally {

        definirBotaoCarregando(
            botao,
            false
        );

    }

}

/* =========================================================
   ALTERAÇÃO DE SENHA
   ========================================================= */

function abrirAlteracaoSenha() {

    abrirModalArquivo(
        "Alterar senha",
        `
            <form
                id="form-alterar-senha"
                class="arquivo-form"
            >

                <div class="arquivo-field">

                    <label for="nova-senha">
                        Nova senha
                    </label>

                    <input
                        id="nova-senha"
                        name="senha"
                        type="password"
                        minlength="8"
                        maxlength="128"
                        autocomplete="new-password"
                        required
                    >

                </div>


                <div class="arquivo-field">

                    <label for="confirmar-nova-senha">
                        Confirmar nova senha
                    </label>

                    <input
                        id="confirmar-nova-senha"
                        name="confirmacao"
                        type="password"
                        minlength="8"
                        maxlength="128"
                        autocomplete="new-password"
                        required
                    >

                </div>


                <div class="arquivo-message">

                    <i class="fa-solid fa-shield-halved"></i>

                    <span>
                        Use uma senha exclusiva para sua conta
                        e não a compartilhe com outras pessoas.
                    </span>

                </div>


                <div
                    id="senha-mensagem"
                    aria-live="polite"
                ></div>


                <div class="arquivo-form-actions">

                    <button
                        type="button"
                        class="arquivo-button arquivo-button-secondary"
                        data-close-arquivo-modal
                    >
                        Cancelar
                    </button>

                    <button
                        type="submit"
                        class="arquivo-button"
                    >
                        <i class="fa-solid fa-key"></i>
                        Alterar senha
                    </button>

                </div>

            </form>
        `
    );


    const formulario =
        document.getElementById(
            "form-alterar-senha"
        );


    if (formulario) {

        formulario.addEventListener(
            "submit",
            salvarNovaSenha
        );

    }

}


/* =========================================================
   SALVAR NOVA SENHA
   ========================================================= */

async function salvarNovaSenha(
    evento
) {

    evento.preventDefault();


    const formulario =
        evento.currentTarget;


    const botao =
        formulario.querySelector(
            'button[type="submit"]'
        );


    const mensagem =
        document.getElementById(
            "senha-mensagem"
        );


    const senha =
        formulario.senha.value;


    const confirmacao =
        formulario.confirmacao.value;


    if (
        senha.length < 8
    ) {

        mostrarMensagemElemento(
            mensagem,
            "A nova senha deve possuir pelo menos 8 caracteres.",
            "erro"
        );

        return;

    }


    if (
        senha !== confirmacao
    ) {

        mostrarMensagemElemento(
            mensagem,
            "As duas senhas não coincidem.",
            "erro"
        );

        return;

    }


    const supabase =
    await obterSupabaseMeuArquivo();


    if (!supabase) {
        return;
    }


    try {

        definirBotaoCarregando(
            botao,
            true
        );


        const {
            error
        } =
            await supabase.auth.updateUser({
                password: senha
            });


        if (error) {
            throw error;
        }


        formulario.reset();


        mostrarMensagemElemento(
            mensagem,
            "Senha alterada com sucesso.",
            "sucesso"
        );


        window.setTimeout(
            fecharModalArquivo,
            900
        );

    }
    catch (erro) {

        console.error(
            "Erro ao alterar senha:",
            erro
        );


        mostrarMensagemElemento(
            mensagem,
            "Não foi possível alterar a senha.",
            "erro"
        );

    }
    finally {

        definirBotaoCarregando(
            botao,
            false
        );

    }

}


/* =========================================================
   SAIR DA CONTA
   ========================================================= */

function confirmarLogoutArquivo() {

    abrirModalArquivo(
        "Encerrar sessão",
        `
            <div class="arquivo-form">

                <div class="arquivo-message">

                    <i class="fa-solid fa-door-open"></i>

                    <span>
                        Deseja encerrar sua sessão no Arquivo Sombrio?
                        Seus registros pessoais permanecerão salvos.
                    </span>

                </div>


                <div
                    id="logout-mensagem"
                    aria-live="polite"
                ></div>


                <div class="arquivo-form-actions">

                    <button
                        type="button"
                        class="arquivo-button arquivo-button-secondary"
                        data-close-arquivo-modal
                    >
                        Permanecer
                    </button>

                    <button
                        type="button"
                        id="confirmar-arquivo-logout"
                        class="arquivo-button"
                    >
                        <i class="fa-solid fa-right-from-bracket"></i>
                        Sair da conta
                    </button>

                </div>

            </div>
        `
    );


    const botao =
        document.getElementById(
            "confirmar-arquivo-logout"
        );


    if (botao) {

        botao.addEventListener(
            "click",
            executarLogoutArquivo
        );

    }

}


/* =========================================================
   EXECUTAR LOGOUT
   ========================================================= */

async function executarLogoutArquivo(
    evento
) {

    const botao =
        evento.currentTarget;


    const mensagem =
        document.getElementById(
            "logout-mensagem"
        );


    const supabase =
    await obterSupabaseMeuArquivo();


    if (!supabase) {
        return;
    }


    try {

        definirBotaoCarregando(
            botao,
            true
        );


        const {
            error
        } =
            await supabase.auth.signOut();


        if (error) {
            throw error;
        }


        meuArquivoState.usuario =
            null;


        meuArquivoState.sessao =
            null;


        window.location.href =
            "index.html";

    }
    catch (erro) {

        console.error(
            "Erro ao encerrar sessão:",
            erro
        );


        mostrarMensagemElemento(
            mensagem,
            "Não foi possível encerrar a sessão.",
            "erro"
        );


        definirBotaoCarregando(
            botao,
            false
        );

    }

}


/* =========================================================
   PREFERÊNCIAS
   ========================================================= */

function prepararEventosPreferencias() {

    const notificacoes =
        document.getElementById(
            "configurar-notificacoes"
        );


    const privacidade =
        document.getElementById(
            "configurar-privacidade"
        );


    const preferencias =
        document.getElementById(
            "configurar-preferencias"
        );


    if (notificacoes) {

        notificacoes.addEventListener(
            "click",
            function () {

                abrirPainelPreferencia(
                    "Notificações",
                    "As preferências de alertas e notificações serão vinculadas à sua conta quando configurarmos esta estrutura no banco de dados."
                );

            }
        );

    }


    if (privacidade) {

        privacidade.addEventListener(
            "click",
            function () {

                abrirPainelPreferencia(
                    "Privacidade",
                    "Murais, anotações, teorias e evidências pessoais permanecem privados por padrão. As opções detalhadas de visibilidade serão configuradas nesta área."
                );

            }
        );

    }


    if (preferencias) {

        preferencias.addEventListener(
            "click",
            function () {

                abrirPainelPreferencia(
                    "Preferências do Arquivo",
                    "Aqui você poderá ajustar opções de exibição e comportamento da sua área pessoal."
                );

            }
        );

    }

}


function abrirPainelPreferencia(
    titulo,
    mensagem
) {

    abrirModalArquivo(
        titulo,
        `
            <div class="arquivo-form">

                <div class="arquivo-message">

                    <i class="fa-solid fa-sliders"></i>

                    <span>
                        ${escaparHTML(mensagem)}
                    </span>

                </div>

                <div class="arquivo-form-actions">

                    <button
                        type="button"
                        class="arquivo-button"
                        data-close-arquivo-modal
                    >
                        Fechar
                    </button>

                </div>

            </div>
        `
    );

}


/* =========================================================
   COMPARTILHAR TEORIA
   ========================================================= */

function prepararEventoCompartilharTeoria() {

    const botao =
        document.getElementById(
            "compartilhar-teoria"
        );


    if (!botao) {
        return;
    }


    botao.addEventListener(
        "click",
        function () {

            abrirModalArquivo(
                "Compartilhar teoria",
                `
                    <div class="arquivo-form">

                        <div class="arquivo-message">

                            <i class="fa-solid fa-share-nodes"></i>

                            <span>
                                No futuro, você poderá selecionar uma
                                teoria privada e publicá-la na comunidade.
                                Nenhuma teoria será compartilhada
                                automaticamente.
                            </span>

                        </div>


                        <div class="arquivo-message">

                            <i class="fa-solid fa-scale-balanced"></i>

                            <span>
                                Ao publicar hipóteses sobre casos reais,
                                fatos documentados e interpretações pessoais
                                deverão permanecer claramente diferenciados.
                            </span>

                        </div>


                        <div class="arquivo-form-actions">

                            <button
                                type="button"
                                class="arquivo-button"
                                data-close-arquivo-modal
                            >
                                Entendido
                            </button>

                        </div>

                    </div>
                `
            );

        }
    );

}

/* =========================================================
   COMPLETAR EVENTOS PRINCIPAIS
   ========================================================= */

function prepararEventosComplementares() {

    prepararEventosPreferencias();

    prepararEventoCompartilharTeoria();

    prepararEventoExcluirConta();

    prepararObservadorAutenticacao();

}


/* =========================================================
   EXCLUSÃO DA CONTA
   ========================================================= */

function prepararEventoExcluirConta() {

    const botao =
        document.getElementById(
            "excluir-conta-arquivo"
        );


    if (!botao) {
        return;
    }


    botao.addEventListener(
        "click",
        abrirConfirmacaoExclusaoConta
    );

}


/* =========================================================
   CONFIRMAÇÃO DE EXCLUSÃO
   ========================================================= */

function abrirConfirmacaoExclusaoConta() {

    abrirModalArquivo(
        "Encerrar Arquivo",
        `
            <div class="arquivo-form">

                <div class="arquivo-message arquivo-message-error">

                    <i class="fa-solid fa-triangle-exclamation"></i>

                    <div>

                        <strong>
                            Exclusão permanente
                        </strong>

                        <p>
                            Esta ação solicitará a exclusão definitiva
                            da sua conta no Arquivo Sombrio.
                        </p>

                    </div>

                </div>


                <div class="arquivo-field">

                    <label for="confirmacao-exclusao">
                        Para confirmar, digite EXCLUIR
                    </label>

                    <input
                        id="confirmacao-exclusao"
                        type="text"
                        autocomplete="off"
                        autocapitalize="characters"
                        placeholder="EXCLUIR"
                    >

                </div>


                <div
                    id="exclusao-mensagem"
                    aria-live="polite"
                ></div>


                <div class="arquivo-form-actions">

                    <button
                        type="button"
                        class="arquivo-button arquivo-button-secondary"
                        data-close-arquivo-modal
                    >
                        Cancelar
                    </button>

                    <button
                        type="button"
                        class="arquivo-button arquivo-button-danger"
                        id="confirmar-exclusao-conta"
                    >
                        <i class="fa-solid fa-user-xmark"></i>
                        Excluir minha conta
                    </button>

                </div>

            </div>
        `
    );


    const botao =
        document.getElementById(
            "confirmar-exclusao-conta"
        );


    if (botao) {

        botao.addEventListener(
            "click",
            solicitarExclusaoConta
        );

    }

}


/* =========================================================
   SOLICITAR EXCLUSÃO
   ========================================================= */

async function solicitarExclusaoConta(
    evento
) {

    const botao =
        evento.currentTarget;


    const campo =
        document.getElementById(
            "confirmacao-exclusao"
        );


    const mensagem =
        document.getElementById(
            "exclusao-mensagem"
        );


    const confirmacao =
        campo?.value
            ?.trim()
            .toUpperCase() ||
        "";


    if (
        confirmacao !== "EXCLUIR"
    ) {

        mostrarMensagemElemento(
            mensagem,
            'Digite "EXCLUIR" para confirmar.',
            "erro"
        );

        return;

    }


const supabase =
    await obterSupabaseMeuArquivo();


    if (!supabase) {

        mostrarMensagemElemento(
            mensagem,
            "Não foi possível acessar sua sessão.",
            "erro"
        );

        return;

    }


    try {

        definirBotaoCarregando(
            botao,
            true
        );


        const {
            data: sessaoData,
            error: sessaoError
        } =
            await supabase.auth.getSession();


        if (sessaoError) {
            throw sessaoError;
        }


        const accessToken =
            sessaoData?.session?.access_token;


        if (!accessToken) {

            throw new Error(
                "Sessão autenticada não encontrada."
            );

        }


        /*
         * A chamada destrutiva será ligada ao endpoint
         * delete-own-account já existente no projeto
         * depois da conferência final da integração.
         *
         * Não executamos exclusão por fallback nem
         * tentamos apagar diretamente auth.users.
         */

        mostrarMensagemElemento(
            mensagem,
            "Confirmação validada. A exclusão definitiva será executada somente pelo serviço seguro de encerramento de conta.",
            "sucesso"
        );


        console.info(
            "Meu Arquivo: exclusão confirmada pelo usuário; aguardando integração final com delete-own-account."
        );

    }
    catch (erro) {

        console.error(
            "Erro ao preparar exclusão da conta:",
            erro
        );


        mostrarMensagemElemento(
            mensagem,
            "Não foi possível validar a sessão para exclusão.",
            "erro"
        );

    }
    finally {

        definirBotaoCarregando(
            botao,
            false
        );

    }

}


/* =========================================================
   OBSERVADOR DE AUTENTICAÇÃO
   ========================================================= */

async function prepararObservadorAutenticacao() {

    const supabase =
    await obterSupabaseMeuArquivo();


    if (!supabase) {
        return;
    }


    supabase.auth.onAuthStateChange(
        function (
            evento,
            sessao
        ) {

            meuArquivoState.sessao =
                sessao || null;


            meuArquivoState.usuario =
                sessao?.user || null;


            if (
                evento === "SIGNED_OUT" ||
                !sessao?.user
            ) {

                mostrarParedeAutenticacao();

                return;

            }


            esconderParedeAutenticacao();


            preencherDadosBasicosUsuario(
                sessao.user
            );

        }
    );

}


/* =========================================================
   STATUS VISUAL DA SESSÃO
   ========================================================= */

function atualizarStatusVisualSessao() {

    const status =
        document.querySelector(
            ".arquivo-status"
        );


    if (!status) {
        return;
    }


    const texto =
        status.querySelector(
            "span:last-child"
        );


    if (!texto) {
        return;
    }


    if (
        meuArquivoState.usuario
    ) {

        texto.textContent =
            "SESSÃO AUTENTICADA";

        status.classList.add(
            "sessao-autenticada"
        );

    }
    else {

        texto.textContent =
            "ACESSO NÃO AUTENTICADO";

        status.classList.remove(
            "sessao-autenticada"
        );

    }

}


/* =========================================================
   ATUALIZAR STATUS APÓS AUTENTICAÇÃO
   ========================================================= */

function sincronizarEstadoSessao() {

    atualizarStatusVisualSessao();


    if (
        meuArquivoState.usuario
    ) {

        esconderParedeAutenticacao();

    }
    else {

        mostrarParedeAutenticacao();

    }

}


/* =========================================================
   ANO DO RODAPÉ
   ========================================================= */

function atualizarAnoMeuArquivo() {

    const elemento =
        document.getElementById(
            "arquivo-current-year"
        );


    if (!elemento) {
        return;
    }


    elemento.textContent =
        String(
            new Date().getFullYear()
        );

}


/* =========================================================
   INICIALIZAÇÃO COMPLEMENTAR
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        prepararEventosComplementares();

        atualizarAnoMeuArquivo();


        window.setTimeout(
            sincronizarEstadoSessao,
            0
        );

    }
);


