```javascript
/* ==========================================================================
   ARQUIVO SOMBRIO
   CASO.JS
   LÓGICA DA PÁGINA INDIVIDUAL DE DOSSIÊ
   ========================================================================== */


const STORAGE_CASOS = "casos_customizados";


document.addEventListener("DOMContentLoaded", () => {

    configurarMenuCaso();

    carregarDossie();

    configurarComentariosCaso();

});


/* ==========================================================================
   MENU
   ========================================================================== */

function configurarMenuCaso() {

    const botao =
        document.getElementById("menu-toggle");

    const sidebar =
        document.getElementById("sidebar-menu");

    const fechar =
        document.getElementById("close-sidebar");

    if (!botao || !sidebar) return;

    botao.addEventListener("click", () => {
        sidebar.classList.add("active");
    });

    if (fechar) {

        fechar.addEventListener("click", () => {
            sidebar.classList.remove("active");
        });

    }

    sidebar.querySelectorAll("a").forEach(link => {

        link.addEventListener("click", () => {
            sidebar.classList.remove("active");
        });

    });
}


/* ==========================================================================
   BUSCAR CASO
   ========================================================================== */

function obterCasoAtual() {

    const parametros =
        new URLSearchParams(
            window.location.search
        );

    const id =
        Number(parametros.get("id"));

    if (!id) return null;

    const personalizados =
        JSON.parse(
            localStorage.getItem(STORAGE_CASOS) || "[]"
        );

    const padrao =
        Array.isArray(window.casosArquivo)
            ? window.casosArquivo
            : [];

    const todos =
        [...personalizados, ...padrao];

    return todos.find(caso => caso.id === id) || null;
}


/* ==========================================================================
   CARREGAR DOSSIÊ
   ========================================================================== */

function carregarDossie() {

    const caso =
        obterCasoAtual();

    if (!caso) {

        mostrarDossieNaoEncontrado();

        return;
    }

    document.title =
        `${caso.titulo} — Arquivo Sombrio`;

    preencherElemento(
        "case-title",
        caso.titulo
    );

    preencherElemento(
        "case-category",
        caso.categoria
    );

    preencherElemento(
        "case-status",
        caso.status
    );

    preencherElemento(
        "case-location",
        caso.local || "Não informado"
    );

    preencherElemento(
        "case-year",
        caso.ano || "Não informado"
    );

    preencherElemento(
        "case-id",
        `#${caso.id}`
    );

    const imagem =
        document.getElementById("case-image");

    if (imagem) {

        imagem.src = caso.imagem;

        imagem.alt =
            `Imagem do dossiê ${caso.titulo}`;

    }

    preencherElemento(
        "case-summary",
        caso.resumo
    );

    const historia =
        document.getElementById("case-history");

    if (historia) {

        historia.innerHTML =
            caso.historia || "<p>Informação não disponível.</p>";

    }

    carregarEvidencias(caso);

    carregarTeorias(caso);

}


/* ==========================================================================
   EVIDÊNCIAS
   ========================================================================== */

function carregarEvidencias(caso) {

    const lista =
        document.getElementById(
            "case-evidence-list"
        );

    if (!lista) return;

    const evidencias =
        Array.isArray(caso.evidencias)
            ? caso.evidencias
            : [];

    if (!evidencias.length) {

        lista.innerHTML = `
            <li class="evidencia-vazia">
                Nenhuma evidência registrada.
            </li>
        `;

        return;
    }

    lista.innerHTML =
        evidencias.map(evidencia => `
            <li>

                <i class="fa-solid fa-vial-circle-check"></i>

                <span>
                    ${escaparHTML(evidencia)}
                </span>

            </li>
        `).join("");
}


/* ==========================================================================
   TEORIAS
   ========================================================================== */

function carregarTeorias(caso) {

    const caixa =
        document.getElementById(
            "case-theories"
        );

    if (!caixa) return;

    caixa.innerHTML = `
        <p>
            ${escaparHTML(
                caso.teorias ||
                "Nenhuma linha de investigação registrada."
            )}
        </p>
    `;

}


/* ==========================================================================
   CASO NÃO ENCONTRADO
   ========================================================================== */

function mostrarDossieNaoEncontrado() {

    document.title =
        "Dossiê não encontrado — Arquivo Sombrio";

    const conteudo =
        document.querySelector(
            ".case-details-container"
        );

    if (!conteudo) return;

    conteudo.innerHTML = `
        <section class="dossie-erro">

            <i class="fa-solid fa-folder-open"></i>

            <span>ARQUIVO NÃO LOCALIZADO</span>

            <h1>
                Dossiê não encontrado
            </h1>

            <p>
                O documento solicitado não existe,
                foi removido ou o identificador informado
                é inválido.
            </p>

            <a
                href="index.html#casos"
                class="btn-voltar"
            >
                <i class="fa-solid fa-arrow-left"></i>
                Voltar ao acervo
            </a>

        </section>
    `;
}


/* ==========================================================================
   COMENTÁRIOS
   ========================================================================== */

function configurarComentariosCaso() {

    const formulario =
        document.getElementById(
            "form-case-comment"
        );

    if (!formulario) return;

    formulario.addEventListener(
        "submit",
        adicionarComentarioCaso
    );

    carregarComentariosCaso();
}


function obterChaveComentarios() {

    const caso =
        obterCasoAtual();

    if (!caso) return null;

    return `comentarios_caso_${caso.id}`;
}


function carregarComentariosCaso() {

    const lista =
        document.getElementById(
            "case-comments-list"
        );

    const chave =
        obterChaveComentarios();

    if (!lista || !chave) return;

    const comentarios =
        JSON.parse(
            localStorage.getItem(chave) || "[]"
        );

    if (!comentarios.length) {

        lista.innerHTML = `
            <div class="comentarios-vazio">
                <i class="fa-solid fa-comment-slash"></i>
                <p>
                    Nenhuma análise publicada neste dossiê.
                </p>
            </div>
        `;

        return;
    }

    lista.innerHTML =
        comentarios.map(comentario => `
            <article class="comentario-caso">

                <header>

                    <strong>
                        <i class="fa-solid fa-user-secret"></i>
                        ${escaparHTML(comentario.autor)}
                    </strong>

                    <time>
                        ${escaparHTML(comentario.data)}
                    </time>

                </header>

                <p>
                    ${escaparHTML(comentario.texto)}
                </p>

            </article>
        `).join("");
}


function adicionarComentarioCaso(event) {

    event.preventDefault();

    const autor =
        document.getElementById(
            "comment-author"
        );

    const texto =
        document.getElementById(
            "comment-text"
        );

    if (!autor || !texto) return;

    const autorValor =
        autor.value.trim();

    const textoValor =
        texto.value.trim();

    if (!autorValor || !textoValor) return;

    const chave =
        obterChaveComentarios();

    if (!chave) return;

    const comentarios =
        JSON.parse(
            localStorage.getItem(chave) || "[]"
        );

    const agora =
        new Date();

    comentarios.unshift({

        autor: autorValor,

        texto: textoValor,

        data:
            agora.toLocaleDateString("pt-BR")
            + " • "
            + agora.toLocaleTimeString(
                "pt-BR",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            )

    });

    localStorage.setItem(
        chave,
        JSON.stringify(comentarios)
    );

    event.target.reset();

    carregarComentariosCaso();

}


/* ==========================================================================
   UTILITÁRIO
   ========================================================================== */

function preencherElemento(id, valor) {

    const elemento =
        document.getElementById(id);

    if (elemento) {
        elemento.textContent =
            valor ?? "";
    }

}


function escaparHTML(valor) {

    if (valor === null || valor === undefined) {
        return "";
    }

    return String(valor)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


window.carregarDossie = carregarDossie;
```