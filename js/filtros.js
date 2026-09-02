"use strict";


/* =========================================================
   ARQUIVO SOMBRIO
   SISTEMA DE PESQUISA E FILTROS
   ========================================================= */


document.addEventListener(
    "DOMContentLoaded",
    inicializarFiltrosArquivo
);


function inicializarFiltrosArquivo() {

    const busca =
        document.getElementById("busca-casos");

    const limparBusca =
        document.getElementById("limpar-busca");

    const chips =
        document.querySelectorAll(".filter-chip");

    const botaoAvancados =
        document.getElementById(
            "abrir-filtros-avancados"
        );

    const painelAvancados =
        document.getElementById(
            "filtros-avancados"
        );

    const iconeFiltros =
        document.getElementById(
            "icone-filtros"
        );

    const filtroStatus =
        document.getElementById(
            "filtro-status"
        );

    const filtroCrime =
        document.getElementById(
            "filtro-crime"
        );

    const filtroAutor =
        document.getElementById(
            "filtro-autor"
        );

    const filtroPais =
        document.getElementById(
            "filtro-pais"
        );

    const ordenar =
        document.getElementById(
            "ordenar-casos"
        );

    const resetar =
        document.getElementById(
            "resetar-filtros"
        );


    if (!busca) {
        return;
    }


    busca.addEventListener(
        "input",
        aplicarFiltros
    );


    if (limparBusca) {

        limparBusca.addEventListener(
            "click",
            function() {

                busca.value = "";

                aplicarFiltros();

                busca.focus();

            }
        );

    }


    chips.forEach(function(chip) {

        chip.addEventListener(
            "click",
            function() {

                chips.forEach(
                    item =>
                        item.classList.remove(
                            "active"
                        )
                );

                chip.classList.add(
                    "active"
                );

                aplicarFiltros();

            }
        );

    });


    if (
        botaoAvancados &&
        painelAvancados
    ) {

        botaoAvancados.addEventListener(
            "click",
            function() {

                const estaFechado =
                    painelAvancados.hidden;

                painelAvancados.hidden =
                    !estaFechado;

                botaoAvancados.classList.toggle(
                    "active",
                    estaFechado
                );

                if (iconeFiltros) {

                    iconeFiltros.classList.toggle(
                        "fa-chevron-down",
                        !estaFechado
                    );

                    iconeFiltros.classList.toggle(
                        "fa-chevron-up",
                        estaFechado
                    );

                }

            }
        );

    }


    [
        filtroStatus,
        filtroCrime,
        filtroAutor,
        filtroPais,
        ordenar
    ]
        .filter(Boolean)
        .forEach(function(elemento) {

            elemento.addEventListener(
                "change",
                aplicarFiltros
            );

        });


    if (resetar) {

        resetar.addEventListener(
            "click",
            function() {

                busca.value = "";

                if (filtroStatus) {
                    filtroStatus.value = "";
                }

                if (filtroCrime) {
                    filtroCrime.value = "";
                }

                if (filtroAutor) {
                    filtroAutor.value = "";
                }

                if (filtroPais) {
                    filtroPais.value = "";
                }

                if (ordenar) {
                    ordenar.value = "padrao";
                }


                chips.forEach(
                    item =>
                        item.classList.remove(
                            "active"
                        )
                );


                const todos =
                    document.querySelector(
                        '.filter-chip[data-filtro="todos"]'
                    );

                if (todos) {
                    todos.classList.add(
                        "active"
                    );
                }


                aplicarFiltros();

            }
        );

    }


    aplicarFiltros();

}



/* =========================================================
   DADOS
   ========================================================= */

function obterCasosParaFiltro() {

    if (
        typeof obterTodosCasos ===
        "function"
    ) {

        try {

            const dados =
                obterTodosCasos();

            if (
                Array.isArray(dados)
            ) {
                return dados;
            }

        } catch (erro) {

            console.warn(
                "Não foi possível usar obterTodosCasos().",
                erro
            );

        }

    }


    if (
        typeof casosArquivo !==
            "undefined" &&
        Array.isArray(casosArquivo)
    ) {

        return casosArquivo;

    }


    return [];

}



/* =========================================================
   NORMALIZAÇÃO
   ========================================================= */

function normalizarFiltro(valor) {

    return String(valor || "")
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .toLowerCase()
        .trim();

}


function transformarEmLista(valor) {

    if (
        Array.isArray(valor)
    ) {

        return valor.map(
            normalizarFiltro
        );

    }


    if (!valor) {
        return [];
    }


    return [
        normalizarFiltro(valor)
    ];

}



/* =========================================================
   FILTRAGEM
   ========================================================= */

function aplicarFiltros() {

    const grid =
        document.getElementById(
            "grid-casos"
        );

    if (!grid) {
        return;
    }


    const todosCasos =
        obterCasosParaFiltro();


    const busca =
        normalizarFiltro(
            document
                .getElementById(
                    "busca-casos"
                )
                ?.value
        );


    const chipAtivo =
        document.querySelector(
            ".filter-chip.active"
        );


    const filtroRapido =
        normalizarFiltro(
            chipAtivo?.dataset.filtro ||
            "todos"
        );


    const status =
        normalizarFiltro(
            document
                .getElementById(
                    "filtro-status"
                )
                ?.value
        );


    const crime =
        normalizarFiltro(
            document
                .getElementById(
                    "filtro-crime"
                )
                ?.value
        );


    const autor =
        normalizarFiltro(
            document
                .getElementById(
                    "filtro-autor"
                )
                ?.value
        );


    const pais =
        normalizarFiltro(
            document
                .getElementById(
                    "filtro-pais"
                )
                ?.value
        );


    let encontrados =
        todosCasos.filter(
            function(caso) {

                return casoCorresponde(
                    caso,
                    {
                        busca,
                        filtroRapido,
                        status,
                        crime,
                        autor,
                        pais
                    }
                );

            }
        );


    encontrados =
        ordenarCasosFiltrados(
            encontrados
        );


    exibirResultadoFiltro(
        encontrados
    );

}



/* =========================================================
   VERIFICAÇÃO DE UM CASO
   ========================================================= */

function casoCorresponde(
    caso,
    filtros
) {

    const titulo =
        normalizarFiltro(
            caso.titulo
        );

    const resumo =
        normalizarFiltro(
            caso.resumo
        );

    const local =
        normalizarFiltro(
            caso.local
        );

    const categoria =
        normalizarFiltro(
            caso.categoria
        );

    const tipoArquivo =
        normalizarFiltro(
            caso.tipoArquivo
        );

    const status =
        normalizarFiltro(
            caso.statusFiltro ||
            caso.status
        );

    const pais =
        normalizarFiltro(
            caso.pais
        );

    const tipos =
        transformarEmLista(
            caso.tipos
        );

    const perfilAutor =
        transformarEmLista(
            caso.perfilAutor
        );

    const relacaoFamiliar =
        transformarEmLista(
            caso.relacaoFamiliar
        );


    if (filtros.busca) {

        const textoCompleto =
            [
                titulo,
                resumo,
                local,
                categoria,
                pais,
                ...tipos,
                ...perfilAutor,
                ...relacaoFamiliar
            ].join(" ");


        if (
            !textoCompleto.includes(
                filtros.busca
            )
        ) {

            return false;

        }

    }


    if (
        filtros.filtroRapido &&
        filtros.filtroRapido !==
            "todos"
    ) {

        const valor =
            filtros.filtroRapido;


        const correspondeRapido =
            status === valor ||
            tipos.includes(valor) ||
            perfilAutor.includes(valor) ||
            relacaoFamiliar.includes(valor) ||
            categoria === valor ||
            tipoArquivo === valor;


        if (!correspondeRapido) {
            return false;
        }

    }


    if (
        filtros.status &&
        status !== filtros.status
    ) {

        return false;

    }


    if (
        filtros.crime &&
        !tipos.includes(
            filtros.crime
        ) &&
        !relacaoFamiliar.includes(
            filtros.crime
        )
    ) {

        return false;

    }


    if (
        filtros.autor &&
        !perfilAutor.includes(
            filtros.autor
        )
    ) {

        return false;

    }


    if (
        filtros.pais &&
        pais !== filtros.pais
    ) {

        return false;

    }


    return true;

}



/* =========================================================
   ORDENAÇÃO
   ========================================================= */

function ordenarCasosFiltrados(
    casos
) {

    const ordem =
        document
            .getElementById(
                "ordenar-casos"
            )
            ?.value ||
        "padrao";


    const copia =
        [...casos];


    switch (ordem) {

        case "az":

            return copia.sort(
                (a, b) =>
                    String(a.titulo)
                        .localeCompare(
                            String(b.titulo),
                            "pt-BR"
                        )
            );


        case "za":

            return copia.sort(
                (a, b) =>
                    String(b.titulo)
                        .localeCompare(
                            String(a.titulo),
                            "pt-BR"
                        )
            );


        case "recentes":

            return copia.sort(
                (a, b) =>
                    Number(b.ano || 0) -
                    Number(a.ano || 0)
            );


        case "antigos":

            return copia.sort(
                (a, b) =>
                    Number(a.ano || 0) -
                    Number(b.ano || 0)
            );


        default:

            return copia;

    }

}



/* =========================================================
   RENDERIZAÇÃO DOS RESULTADOS
   ========================================================= */

function exibirResultadoFiltro(
    casos
) {

    const grid =
        document.getElementById(
            "grid-casos"
        );

    if (!grid) {
        return;
    }


    /*
     * Se o script principal possuir sua própria
     * função de renderização, usamos a mesma.
     */

    if (
        typeof criarCardCaso ===
        "function"
    ) {

        grid.innerHTML = "";


        if (!casos.length) {

            renderizarNenhumResultado(
                grid
            );

        } else {

            casos.forEach(
                function(caso) {

                    const card =
                        criarCardCaso(
                            caso
                        );

                    if (
                        typeof card ===
                        "string"
                    ) {

                        grid.insertAdjacentHTML(
                            "beforeend",
                            card
                        );

                    } else if (
                        card instanceof
                        HTMLElement
                    ) {

                        grid.appendChild(
                            card
                        );

                    }

                }
            );

        }

    } else {

        filtrarCardsExistentes(
            casos
        );

    }


    atualizarContador(
        casos.length
    );

}



/* =========================================================
   FALLBACK PARA CARDS EXISTENTES
   ========================================================= */

function filtrarCardsExistentes(
    casos
) {

    const ids =
        new Set(
            casos.map(
                caso =>
                    String(caso.id)
            )
        );


    const cards =
        document.querySelectorAll(
            "#grid-casos [data-id]"
        );


    cards.forEach(
        function(card) {

            card.hidden =
                !ids.has(
                    String(
                        card.dataset.id
                    )
                );

        }
    );

}



/* =========================================================
   SEM RESULTADO
   ========================================================= */

function renderizarNenhumResultado(
    grid
) {

    grid.innerHTML =
        `
        <div class="archive-no-results">

            <i class="fa-solid fa-folder-open"></i>

            <strong>
                Nenhum dossiê encontrado
            </strong>

            <p>
                Tente alterar os filtros ou pesquisar outro termo.
            </p>

        </div>
        `;

}



/* =========================================================
   CONTADOR
   ========================================================= */

function atualizarContador(
    quantidade
) {

    const contador =
        document.getElementById(
            "contador-casos"
        );

    const texto =
        document.getElementById(
            "contador-texto"
        );


    if (contador) {

        contador.textContent =
            quantidade;

    }


    if (texto) {

        texto.textContent =
            quantidade === 1
                ? "dossiê encontrado"
                : "dossiês encontrados";

    }

}