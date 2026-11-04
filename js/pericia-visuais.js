/* Ilustrações e notas didáticas dos nove exercícios originais. Sem imagens externas. */
(function () {
  "use strict";
  var root = typeof window !== "undefined" ? window : null;
  var bg = '<rect width="560" height="260" rx="15" fill="#111f36"/><rect x="14" y="14" width="532" height="232" rx="11" fill="#162a48" stroke="#537eb6" stroke-width="2"/>';
  function svg(desc, drawing) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 260" role="img" aria-label="' + desc + '">' +
      bg + drawing + '</svg>';
  }
  var VISUALS = Object.freeze([
    {
      alt:"Cinco manchas avermelhadas arredondadas e separadas sobre uma superfície lisa, sem escala.",
      html:svg("Cinco manchas arredondadas separadas. Ilustração esquemática, sem escala.",
        '<rect x="39" y="43" width="482" height="165" rx="8" fill="#e6edf4" stroke="#9cafc7"/>' +
        '<path d="M40 99H520M40 159H520" stroke="#c3cdd8" stroke-width="2"/>' +
        '<circle cx="112" cy="87" r="18" fill="#bd1c32"/><circle cx="208" cy="149" r="29" fill="#c32438"/>' +
        '<circle cx="312" cy="101" r="22" fill="#b51c33"/><circle cx="404" cy="154" r="25" fill="#cb2b3e"/>' +
        '<circle cx="476" cy="89" r="12" fill="#bc2337"/>' +
        '<text x="280" y="232" text-anchor="middle" font-size="17" fill="#dce9fc">Superfície ilustrativa · sem escala</text>')
    },
    {
      alt:"Três manchas alongadas, com bordas delimitadas, sem indicação de trajetória.",
      html:svg("Três manchas elípticas e alongadas. A imagem não apresenta uma trajetória calculada.",
        '<rect x="42" y="39" width="476" height="172" rx="9" fill="#e8edf4"/>' +
        '<g fill="#bd1c32"><ellipse cx="153" cy="89" rx="69" ry="19" transform="rotate(-18 153 89)"/>' +
        '<ellipse cx="321" cy="150" rx="89" ry="24" transform="rotate(-12 321 150)"/>' +
        '<ellipse cx="420" cy="89" rx="38" ry="12" transform="rotate(-20 420 89)"/></g>' +
        '<text x="280" y="232" text-anchor="middle" font-size="17" fill="#dce9fc">Registro do formato das marcas</text>')
    },
    {
      alt:"Mancha irregular conectada a um rastro contínuo, para ilustrar transferência por contato.",
      html:svg("Uma mancha irregular ligada a um rastro contínuo na superfície.",
        '<rect x="42" y="38" width="476" height="172" rx="9" fill="#e8edf4"/>' +
        '<path d="M87 90Q129 53 168 87Q200 72 213 117Q194 161 151 172Q94 175 78 126Z" fill="#c02639"/>' +
        '<path d="M194 118C281 82 323 164 478 111" stroke="#b91d32" stroke-width="25" stroke-linecap="round" fill="none" opacity=".80"/>' +
        '<path d="M188 161C271 173 363 183 474 161" stroke="#bd2d40" stroke-width="11" stroke-linecap="round" fill="none" opacity=".65"/>' +
        '<text x="280" y="232" text-anchor="middle" font-size="17" fill="#dce9fc">Contato · marca e rastro simulados</text>')
    },
    {
      alt:"Dois cartões com tipagem A positivo, um vestígio e uma amostra de referência.",
      html:svg("Dois cartões de tipagem A positivo. Um representa o vestígio, outro a referência.",
        '<rect x="45" y="48" width="205" height="143" rx="12" fill="#e8eef9"/><rect x="310" y="48" width="205" height="143" rx="12" fill="#e8eef9"/>' +
        '<text x="147" y="78" font-size="18" text-anchor="middle" fill="#172844">VESTÍGIO</text>' +
        '<text x="413" y="78" font-size="18" text-anchor="middle" fill="#172844">REFERÊNCIA</text>' +
        '<text x="147" y="149" font-size="54" text-anchor="middle" font-weight="700" fill="#bc1e33">A+</text>' +
        '<text x="413" y="149" font-size="54" text-anchor="middle" font-weight="700" fill="#bc1e33">A+</text>' +
        '<text x="279" y="133" font-size="38" text-anchor="middle" fill="#ffd43b">=</text>' +
        '<text x="280" y="229" font-size="16" text-anchor="middle" fill="#dce9fc">Mesmo tipo · origem ainda desconhecida</text>')
    },
    {
      alt:"Dois cartões mostrando grupos sanguíneos diferentes, B negativo e A positivo.",
      html:svg("Vestígio B negativo comparado com amostra de referência A positivo.",
        '<rect x="45" y="48" width="205" height="143" rx="12" fill="#e8eef9"/><rect x="310" y="48" width="205" height="143" rx="12" fill="#e8eef9"/>' +
        '<text x="147" y="78" font-size="18" text-anchor="middle" fill="#172844">VESTÍGIO</text>' +
        '<text x="413" y="78" font-size="18" text-anchor="middle" fill="#172844">REFERÊNCIA</text>' +
        '<text x="147" y="149" font-size="54" text-anchor="middle" font-weight="700" fill="#bc1e33">B−</text>' +
        '<text x="413" y="149" font-size="54" text-anchor="middle" font-weight="700" fill="#bc1e33">A+</text>' +
        '<text x="279" y="133" font-size="38" text-anchor="middle" fill="#ffd43b">≠</text>' +
        '<text x="280" y="229" font-size="16" text-anchor="middle" fill="#dce9fc">Amostras hipotéticas tipadas corretamente</text>')
    },
    {
      alt:"Doador de hemácias O negativo apontando para receptor AB positivo.",
      html:svg("Transfusão hipotética de hemácias: doador O negativo para receptor AB positivo.",
        '<rect x="37" y="49" width="195" height="137" rx="12" fill="#e8eef9"/>' +
        '<rect x="329" y="49" width="195" height="137" rx="12" fill="#e8eef9"/>' +
        '<text x="134" y="78" font-size="17" text-anchor="middle" fill="#172844">DOADOR</text>' +
        '<text x="426" y="78" font-size="17" text-anchor="middle" fill="#172844">RECEPTOR</text>' +
        '<text x="134" y="149" font-size="48" text-anchor="middle" font-weight="700" fill="#bc1e33">O−</text>' +
        '<text x="426" y="149" font-size="48" text-anchor="middle" font-weight="700" fill="#bc1e33">AB+</text>' +
        '<path d="M239 115H314" fill="none" stroke="#ffd43b" stroke-width="8" stroke-linecap="round"/>' +
        '<path d="M304 100L323 115L304 130" fill="none" stroke="#ffd43b" stroke-width="8"/>' +
        '<text x="280" y="231" font-size="16" text-anchor="middle" fill="#dce9fc">Somente hemácias · modelo ABO/RhD</text>')
    },
    {
      alt:"Manchas alongadas numa foto esquemática com um ponto de interrogação indicando causa desconhecida.",
      html:svg("Três marcas alongadas numa superfície, acompanhadas de um ponto de interrogação sobre a origem.",
        '<rect x="53" y="37" width="328" height="169" rx="8" fill="#e6edf4"/>' +
        '<g fill="#be2037"><ellipse cx="142" cy="92" rx="57" ry="17" transform="rotate(-16 142 92)"/>' +
        '<ellipse cx="239" cy="145" rx="65" ry="17" transform="rotate(-12 239 145)"/>' +
        '<ellipse cx="302" cy="79" rx="34" ry="10" transform="rotate(-14 302 79)"/></g>' +
        '<circle cx="448" cy="114" r="45" fill="#193f8c" stroke="#ffd43b" stroke-width="3"/>' +
        '<text x="448" y="135" font-size="64" text-anchor="middle" font-weight="700" fill="#ffd43b">?</text>' +
        '<text x="280" y="230" font-size="17" text-anchor="middle" fill="#dce9fc">Observação não é identificação da causa</text>')
    },
    {
      alt:"Esquema de três etapas da cadeia de custódia; a documentação de coleta aparece incompleta.",
      html:svg("Fluxo de documentação: coleta sem registro, transporte e análise.",
        '<rect x="36" y="56" width="142" height="132" rx="11" fill="#a42a32"/>' +
        '<rect x="209" y="56" width="142" height="132" rx="11" fill="#1d559f"/>' +
        '<rect x="382" y="56" width="142" height="132" rx="11" fill="#1d559f"/>' +
        '<text x="107" y="97" font-size="17" text-anchor="middle" fill="white">COLETA</text><text x="107" y="154" font-size="46" font-weight="700" text-anchor="middle" fill="#ffd43b">?</text>' +
        '<text x="280" y="97" font-size="17" text-anchor="middle" fill="white">TRANSPORTE</text><text x="280" y="144" font-size="27" text-anchor="middle" fill="#fff">→</text>' +
        '<text x="453" y="97" font-size="17" text-anchor="middle" fill="white">ANÁLISE</text><text x="453" y="144" font-size="27" text-anchor="middle" fill="#fff">✓</text>' +
        '<text x="280" y="225" font-size="16" text-anchor="middle" fill="#dce9fc">Documentação incompleta: origem em dúvida</text>')
    },
    {
      alt:"Diagrama que confronta uma hipótese com três conjuntos de vestígios, um deles ainda não explicado.",
      html:svg("Uma hipótese conectada a três registros de evidência, sendo um incompatível ou não explicado.",
        '<rect x="50" y="76" width="142" height="105" rx="12" fill="#235bb0"/>' +
        '<text x="121" y="118" text-anchor="middle" font-size="21" fill="white">HIPÓTESE</text>' +
        '<text x="121" y="154" text-anchor="middle" font-size="35" fill="#ffd43b">?</text>' +
        '<path d="M194 126H278" stroke="#d4e5fa" stroke-width="4" stroke-linecap="round"/>' +
        '<path d="M278 72V176" stroke="#d4e5fa" stroke-width="3"/>' +
        '<g><rect x="301" y="43" width="205" height="50" rx="8" fill="#235a91"/>' +
        '<rect x="301" y="106" width="205" height="50" rx="8" fill="#235a91"/>' +
        '<rect x="301" y="169" width="205" height="50" rx="8" fill="#9e2431"/></g>' +
        '<g font-size="17" text-anchor="middle" fill="white"><text x="403" y="74">VESTÍGIO A  ✓</text>' +
        '<text x="403" y="138">VESTÍGIO B  ✓</text><text x="403" y="201">VESTÍGIO C  ?</text></g>' +
        '<text x="280" y="242" text-anchor="middle" font-size="16" fill="#dce9fc">Conferir todas as informações disponíveis</text>')
    }
  ]);
  var HINTS = Object.freeze([
    "Descreva o que você vê, sem supor como a marca foi produzida.",
    "Separe a característica que aparece na imagem de um cálculo ou reconstrução.",
    "Compare a área mais marcada com o traço que continua pela superfície.",
    "Um grupo sanguíneo é uma característica compartilhada por várias pessoas.",
    "As condições da comparação já informam se houve mistura e se a tipagem foi correta.",
    "O exercício trata de hemácias; a situação clínica exige verificações adicionais.",
    "Um mesmo formato pode aparecer em situações diferentes.",
    "Pense no percurso de uma amostra desde a coleta até a análise.",
    "Uma hipótese deve ser confrontada com todos os dados disponíveis."
  ]);
  var CHOICE_NOTES = Object.freeze([
    [
      "Essa opção descreve a forma e a separação das marcas, sem atribuir uma causa específica.",
      "Uma marca contínua exigiria ligação visível entre as áreas; o desenho mostra manchas separadas.",
      "Arrasto exigiria um rastro associado ao movimento sobre a superfície, que não aparece aqui.",
      "A imagem não oferece elementos suficientes para demonstrar uma direção de projeção."
    ],
    [
      "A velocidade não pode ser lida diretamente do formato nesta ilustração.",
      "Determinar a origem espacial exige informações e medições que a imagem não fornece.",
      "É possível registrar o alongamento das marcas sem fazer inferências sobre sua causa.",
      "A imagem não permite deduzir a posição de uma pessoa."
    ],
    [
      "Não há informações suficientes para contar as pessoas envolvidas.",
      "O rastro conectado à mancha torna pertinente investigar transferência por contato, sem afirmá-la como certeza.",
      "A imagem não possui informações que identifiquem quem produziu a marca.",
      "Uma marca não basta para reconstruir toda a sequência das ações."
    ],
    [
      "O tipo A+ é compartilhado por muitas pessoas; igualdade de grupo não identifica uma origem.",
      "A tipagem não demonstra que ocorreu contato físico entre pessoas ou objetos.",
      "Grupos iguais não excluem, por si, uma possível origem comum.",
      "A coincidência é compatível com a hipótese, mas não identifica a pessoa."
    ],
    [
      "Nas condições expressas, B− e A+ não correspondem a uma única tipagem de mesma origem.",
      "Grupos diferentes não confirmam uma única origem; apontam para divergência nesta comparação.",
      "ABO/RhD não identifica uma pessoa individualmente.",
      "A tipagem diferente não prova presença ou autoria em nenhum local."
    ],
    [
      "Hemácias O− não apresentam antígenos A, B ou RhD e são compatíveis no modelo básico ABO/RhD.",
      "As regras de plasma não são as mesmas usadas para hemácias.",
      "A compatibilidade básica de hemácias não substitui testes pré-transfusionais e avaliação clínica.",
      "A transfusão depende de verificações além do grupo ABO/RhD."
    ],
    [
      "O formato visível não identifica sozinho um objeto.",
      "Uma única fotografia não permite determinar o objeto causador sem outros exames e contexto.",
      "Formas alongadas podem decorrer de mais de um mecanismo.",
      "A forma não estabelece toda a sequência de eventos."
    ],
    [
      "A cor do formulário não substitui registros de identificação e coleta.",
      "A ordem dos nomes não demonstra a origem ou a integridade das amostras.",
      "Uma fotografia da embalagem não substitui a documentação da cadeia de custódia.",
      "Os registros ajudam a acompanhar a origem, o manuseio e a preservação de cada amostra."
    ],
    [
      "Reexaminar hipóteses e buscar dados adicionais é necessário quando existem vestígios sem explicação.",
      "Ignorar vestígios conflitantes compromete a avaliação da hipótese.",
      "Uma mancha isolada não constitui prova conclusiva de uma versão completa.",
      "A primeira versão não deve prevalecer apenas por ter sido apresentada antes."
    ]
  ]);
  function details(index) {
    if (!Number.isInteger(index) || index < 0 || index >= 9) return null;
    return {visual:VISUALS[index],hint:HINTS[index],choiceNotes:CHOICE_NOTES[index]};
  }
  var API = Object.freeze({VISUALS:VISUALS,HINTS:HINTS,CHOICE_NOTES:CHOICE_NOTES,details:details});
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  if (root) root.ArquivoPericiaVisuals = API;
}());
