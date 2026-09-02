/* ==========================================================================
   ARQUIVO SOMBRIO
   BANCO DE DADOS PRINCIPAL — CASOS, MISTÉRIOS E PERÍCIA
   ========================================================================== */

"use strict";

/*
 * IMPORTANTE:
 * Este arquivo contém apenas os dados iniciais do site.
 *
 * Casos adicionados posteriormente pelo painel administrativo serão
 * armazenados no localStorage pelo script.js.
 *
 * Não coloque lógica, funções ou elementos HTML neste arquivo.
 */

const casosArquivo = [
    {
        id: 101,

        titulo: "O Incidente do Passo Dyatlov",

        categoria: "INVESTIGAÇÃO",

        local: "Montes Urais, Rússia",

        ano: "1959",

        status: "NÃO SOLUCIONADO",

        imagem: "imagens/misterio/dyatlov.JPG",

        resumo:
            "Nove caminhantes experientes morreram durante uma expedição nas montanhas dos Urais sob circunstâncias que durante décadas alimentaram inúmeras teorias.",

        historia: `
            <p>Em fevereiro de 1959, nove estudantes e experientes praticantes de esqui partiram para uma expedição na região dos Montes Urais, na então União Soviética.</p>

            <p>O grupo montou acampamento nas proximidades da montanha Kholat Syakhl. Quando as equipes de busca chegaram ao local, encontraram a barraca parcialmente aberta e sinais de que os ocupantes haviam deixado o abrigo às pressas.</p>

            <p>Os corpos foram encontrados em diferentes pontos da região. Alguns apresentavam ferimentos graves, enquanto outros morreram devido à exposição extrema ao frio.</p>

            <p>O caso permaneceu cercado por dúvidas durante décadas e tornou-se um dos episódios mais conhecidos da história dos mistérios não solucionados.</p>
        `,

        evidencias: [
            "Barraca encontrada aberta e parcialmente rasgada.",
            "Grupo deixou o abrigo em condições climáticas extremas.",
            "Corpos encontrados em diferentes pontos da encosta.",
            "Algumas vítimas apresentavam lesões internas graves.",
            "Vestígios e circunstâncias da cena alimentaram diferentes hipóteses."
        ],

teorias: [
    "A hipótese de avalanche de placa é uma das principais explicações estudadas para o incidente.",
    "As condições meteorológicas extremas podem ter contribuído para que o grupo abandonasse a barraca de maneira repentina.",
    "Fenômenos acústicos e efeitos provocados pelo vento também foram considerados como possíveis fatores.",
    "Outras hipóteses envolvendo ação humana e acontecimentos incomuns surgiram ao longo das décadas, embora muitas não possuam evidências suficientes."
]
},

    {
        id: 102,

        titulo: "Análise de Luminol em Cenas de Crime",

        categoria: "PERÍCIA",

        local: "Laboratório Pericial",

        ano: "Artigo Técnico",

        status: "TÉCNICO / METODOLÓGICO",

        imagem: "imagens/forense/luminol.PNG",

        resumo:
            "Análise introdutória sobre o uso de reagentes quimioluminescentes na localização de possíveis vestígios de sangue em investigações forenses.",

        historia: `
            <p>O luminol é um reagente utilizado em determinadas investigações forenses para auxiliar na localização de possíveis vestígios de sangue que não são facilmente perceptíveis visualmente.</p>

            <p>A reação produz quimioluminescência, permitindo que determinadas áreas sejam examinadas em condições apropriadas de baixa luminosidade.</p>

            <p>Apesar de sua utilidade investigativa, uma reação luminosa não deve ser interpretada isoladamente como confirmação definitiva da presença de sangue humano.</p>

            <p>Por esse motivo, procedimentos periciais podem utilizar métodos complementares para confirmar a natureza e a origem do material encontrado.</p>
        `,

        evidencias: [
            "Reação quimioluminescente característica.",
            "Possibilidade de localizar vestígios não perceptíveis a olho nu.",
            "Existência de substâncias capazes de produzir reações semelhantes.",
            "Necessidade de testes confirmatórios.",
            "Importância da documentação e da cadeia de custódia."
        ],

        teorias:
            "O luminol deve ser tratado como ferramenta de localização e triagem. A confirmação da origem de um vestígio depende de métodos analíticos complementares e do contexto da investigação."
    },

    {
        id: 103,

        titulo: "O Homem de Somerton",

        categoria: "DESAPARECIMENTO",

        local: "Adelaide, Austrália",

        ano: "1948",

        status: "CASO HISTÓRICO",

        imagem: "imagens/misterio/somerton.PNG",

        resumo:
            "Um homem foi encontrado morto na praia de Somerton, dando origem a uma das investigações de identidade mais intrigantes da Austrália.",

        historia: `
            <p>Em dezembro de 1948, um homem foi encontrado morto na praia de Somerton, em Adelaide, Austrália.</p>

            <p>A ausência de documentos de identificação e circunstâncias incomuns relacionadas às roupas e aos pertences da vítima dificultaram inicialmente sua identificação.</p>

            <p>O caso recebeu atenção adicional após a descoberta de um pequeno fragmento de papel contendo as palavras associadas à expressão persa “Tamám Shud”.</p>

            <p>Ao longo das décadas, diferentes pesquisadores analisaram documentos, possíveis códigos, objetos e relações pessoais que poderiam ajudar a esclarecer a identidade e a morte do homem.</p>
        `,

        evidencias: [

    {
        titulo:
            "O fragmento com as palavras “Tamám Shud”",

        resumo:
            "Um pequeno pedaço de papel escondido no bolso da calça tornou-se a pista mais famosa do caso.",

        detalhes:
            "Durante o exame das roupas do homem, foi encontrado em um pequeno bolso da calça um fragmento de papel com as palavras “Tamám Shud”, expressão persa geralmente traduzida como “terminado” ou “acabado”. Investigadores descobriram que a frase aparecia ao final de determinadas edições de O Rubáiyát de Omar Khayyám. O fragmento parecia ter sido arrancado de um livro, o que levou a polícia a procurar a obra correspondente.",

        imagem:
            "",

        legenda:
            "",

        fonte:
            "Inquérito do Coroner da Austrália do Sul, 1949."
    },


    {
        titulo:
            "O exemplar de O Rubáiyát",

        resumo:
            "Meses depois, um livro relacionado ao fragmento foi entregue à polícia — e trouxe novas pistas.",

        detalhes:
            "Em julho de 1949, um homem entregou à polícia um exemplar de O Rubáiyát de Omar Khayyám que teria sido encontrado no banco traseiro de seu carro em novembro de 1948. A polícia concluiu que o fragmento “Tamám Shud” correspondia à página arrancada daquele exemplar. No verso do livro havia anotações que pareciam formar uma sequência de letras, além de um número de telefone. Essas anotações alimentaram décadas de especulações sobre códigos, espionagem e mensagens secretas, embora nunca tenha sido demonstrado de forma conclusiva que se tratava de uma cifra.",

        imagem:
            "",

        legenda:
            "",

        fonte:
            "State Records of South Australia — arquivo do inquérito do Somerton Man."
    },


    {
        titulo:
            "O número de telefone escrito no livro",

        resumo:
            "Um dos números anotados no Rubáiyát levou os investigadores até uma mulher que vivia perto de Somerton Beach.",

        detalhes:
            "Entre as anotações encontradas no exemplar de O Rubáiyát havia um número de telefone que foi rastreado até uma mulher posteriormente associada ao caso pela imprensa e por pesquisadores. A polícia a entrevistou, mas os documentos públicos do primeiro inquérito não registram uma conclusão que estabeleça uma ligação definitiva entre ela e a morte. Essa conexão se tornou uma das partes mais debatidas do mistério ao longo das décadas.",

        imagem:
            "",

        legenda:
            "",

        fonte:
            "State Records of South Australia."
    },


    {
        titulo:
            "As roupas e as etiquetas removidas",

        resumo:
            "Várias peças de roupa apresentavam etiquetas de identificação removidas ou ausentes.",

        detalhes:
            "A ausência de identificação foi um dos primeiros obstáculos da investigação. Algumas etiquetas das roupas haviam sido removidas, fato que posteriormente ajudou a alimentar teorias de espionagem. Entretanto, nem todas as peças estavam completamente sem marcas: entre os pertences associados ao caso surgiram nomes como “Keane”, que décadas mais tarde ganhariam nova importância nas pesquisas genealógicas que apontaram para Carl “Charles” Webb.",

        imagem:
            "",

        legenda:
            "",

        fonte:
            "Registros do inquérito e investigação genealógica divulgada em 2022."
    },


    {
        titulo:
            "A mala deixada na estação ferroviária",

        resumo:
            "Uma mala localizada na estação de Adelaide forneceu roupas e objetos que a polícia associou ao homem.",

        detalhes:
            "A investigação localizou uma mala depositada na estação ferroviária de Adelaide antes da morte. Dentro dela havia roupas e outros objetos considerados compatíveis com os pertences do homem encontrado na praia. A mala ajudou a reconstruir parte de seus movimentos, mas não forneceu naquele momento uma identidade definitiva. O caso continuou oficialmente sem nome por décadas.",

        imagem:
            "",

        legenda:
            "",

        fonte:
            "Registros históricos da investigação do Somerton Man."
    },


    {
        titulo:
            "A suspeita de envenenamento",

        resumo:
            "O estado dos órgãos levantou suspeitas de intoxicação, mas nenhum veneno comum foi identificado.",

        detalhes:
            "O exame post-mortem encontrou alterações internas que fizeram médicos considerar a possibilidade de envenenamento. Testes não identificaram nenhum dos venenos comuns conhecidos na época. No inquérito, o especialista químico declarou que, caso um veneno tivesse provocado a morte, provavelmente seria uma substância incomum ou difícil de detectar. A causa exata da morte permaneceu inconclusiva.",

        imagem:
            "",

        legenda:
            "",

        fonte:
            "Inquérito coronial de 1949, State Records of South Australia."
    },


    {
        titulo:
            "A identificação por genealogia genética",

        resumo:
            "Décadas depois, DNA obtido de fios de cabelo levou pesquisadores até um nome: Carl “Charles” Webb.",

        detalhes:
            "Em 2022, o pesquisador Derek Abbott e a genealogista forense Colleen Fitzpatrick anunciaram que evidências genéticas e genealógicas apontavam para Carl, conhecido como Charles Webb, um engenheiro e fabricante de instrumentos nascido em Melbourne. O trabalho utilizou DNA obtido de fios de cabelo preservados no molde de gesso produzido após a morte e o comparou com árvores genealógicas e parentes vivos. A descoberta resolveu grande parte do mistério sobre a identidade do homem, embora não tenha explicado de forma conclusiva como ou por que ele morreu.",

        imagem:
            "",

        legenda:
            "",

        fonte:
            "ABC Australia — investigação de Derek Abbott e Colleen Fitzpatrick, 2022."
    }

],

        teorias:
            "O caso foi associado a hipóteses envolvendo identidade desconhecida, possível envenenamento, relações pessoais e espionagem. Algumas interpretações históricas permanecem controversas."
    },

    {
        id: 104,

        titulo: "Datiloscopia e Identificação Papiloscópica",

        categoria: "PERÍCIA",

        local: "Instituto de Identificação",

        ano: "Artigo Técnico",

        status: "TÉCNICO / METODOLÓGICO",

        imagem: "imagens/forense/papiloscopia.PNG",

        resumo:
            "Introdução aos princípios utilizados na identificação papiloscópica e no confronto de impressões digitais.",

        historia: `
            <p>A papiloscopia é uma área da identificação humana baseada na análise das cristas papilares presentes nos dedos, nas palmas das mãos e em outras regiões específicas.</p>

            <p>Em contextos forenses, impressões encontradas em objetos ou superfícies podem ser examinadas e comparadas com padrões conhecidos.</p>

            <p>Entre os elementos observados durante o confronto estão características como terminações, bifurcações e outras minúcias.</p>

            <p>A correta documentação, preservação e cadeia de custódia do vestígio são elementos fundamentais para a confiabilidade do procedimento.</p>
        `,

        evidencias: [
            "Impressões papilares latentes.",
            "Terminações e bifurcações das cristas.",
            "Comparação entre impressão questionada e padrão conhecido.",
            "Utilização de técnicas de revelação adequadas.",
            "Registro e preservação da cadeia de custódia."
        ],

        teorias:
            "A identificação papiloscópica depende da qualidade do vestígio, da metodologia utilizada e da análise realizada pelo profissional responsável."
    }
];


/* ==========================================================================
   COMPATIBILIDADE
   ========================================================================== */

/*
 * O navegador utiliza diretamente a constante acima.
 *
 * O bloco abaixo permite que o mesmo arquivo também seja utilizado em
 * ambientes que trabalhem com CommonJS, sem interferir no funcionamento
 * normal do site.
 */
/* =========================================================
   CLASSIFICAÇÃO DOS DOSSIÊS
   ========================================================= */

const classificacoesCasos = {

    101: {
        statusFiltro: "nao-solucionado",

        tipos: [
            "misterio",
            "morte-inexplicada",
            "caso-historico"
        ],

        relacaoFamiliar: [],

        perfilAutor: [
            "desconhecido"
        ],

        pais: "Rússia",

        decada: "1950",

        tipoArquivo: "mistério"
    },


    102: {
        statusFiltro: "educacional",

        tipos: [
            "pericia",
            "quimica-forense"
        ],

        relacaoFamiliar: [],

        perfilAutor: [],

        pais: "",

        decada: "",

        tipoArquivo: "perícia"
    },


    103: {
        statusFiltro: "nao-solucionado",

        tipos: [
            "misterio",
            "morte-inexplicada",
            "caso-historico"
        ],

        relacaoFamiliar: [],

        perfilAutor: [
            "desconhecido"
        ],

        pais: "Austrália",

        decada: "1940",

        tipoArquivo: "crime-real"
    },


    104: {
        statusFiltro: "educacional",

        tipos: [
            "pericia",
            "identificacao-forense"
        ],

        relacaoFamiliar: [],

        perfilAutor: [],

        pais: "",

        decada: "",

        tipoArquivo: "perícia"
    }

};


casosArquivo.forEach(function(caso) {

    const classificacao =
        classificacoesCasos[caso.id];

    if (!classificacao) {
        return;
    }

    Object.assign(
        caso,
        classificacao
    );

});

if (typeof module !== "undefined" && module.exports) {
    module.exports = casosArquivo;
}
