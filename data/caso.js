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
            "Ausência inicial de identificação formal.",
            "Fragmento de papel associado à expressão 'Tamám Shud'.",
            "Pertences e roupas examinados durante a investigação.",
            "Livro associado ao fragmento encontrado posteriormente.",
            "Diversas hipóteses sobre identidade e causa da morte."
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

if (typeof module !== "undefined" && module.exports) {
    module.exports = casosArquivo;
}
