/* Arquivo Sombrio — laboratório didático; sem APIs, uploads ou dados pessoais. */
(function () {
  "use strict";

  var GROUPS = Object.freeze(["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"]);
  var SCENES = Object.freeze(["gotas", "contato", "direcionais"]);
  var CATEGORY = Object.freeze({
    gotas: "Gotas isoladas",
    contato: "Marcas por contato",
    direcionais: "Manchas com orientação semelhante"
  });

  function validGroup(value) { return GROUPS.indexOf(value) !== -1; }
  function abo(value) { return value.slice(0, -1); }
  function rh(value) { return value.slice(-1); }
  function antigens(value) {
    var g = abo(value);
    if (g === "AB") return ["A", "B"];
    if (g === "O") return [];
    return [g];
  }

  function compareForensic(trace, reference) {
    if (!validGroup(trace) || !validGroup(reference)) {
      return {status:"neutral",title:"Selecione os dois grupos sanguíneos.",detail:"Escolha o grupo do vestígio e o da amostra de referência."};
    }
    if (trace === reference) {
      return {status:"positive",title:"Os grupos sanguíneos coincidem.",
        detail:"Ter o mesmo grupo ABO/RhD não prova que o sangue veio da mesma pessoa. Esse grupo pode ser encontrado em muitas pessoas. Para investigar a origem de uma amostra, são necessários outros exames e informações sobre a coleta."};
    }
    return {status:"negative",title:"Os grupos sanguíneos são diferentes.",
      detail:"Se os exames estiverem corretos e as amostras não estiverem misturadas, essa diferença contraria a hipótese de que o sangue veio da mesma pessoa. Numa investigação real, a qualidade das amostras e as condições do exame precisam ser avaliadas."};
  }

  function redCellsCompatible(donor, recipient) {
    if (!validGroup(donor) || !validGroup(recipient)) return null;
    var donorAntigens = antigens(donor);
    var receptorAntigens = antigens(recipient);
    var aboMatch = donorAntigens.every(function (a) { return receptorAntigens.indexOf(a) !== -1; });
    var rhMatch = rh(donor) === "-" || rh(recipient) === "+";
    return aboMatch && rhMatch;
  }

  function compareTransfusion(donor, recipient) {
    var compatible = redCellsCompatible(donor, recipient);
    if (compatible === null) {
      return {status:"neutral",title:"Selecione os dois grupos sanguíneos.",detail:"Escolha o grupo sanguíneo do doador e o do receptor."};
    }
    if (compatible) {
      return {status:"positive",title:"Compatível no modelo básico de hemácias.",
        detail:"O resultado não autoriza uma transfusão. Antes de um procedimento real, a equipe de saúde precisa avaliar outros antígenos, anticorpos, histórico clínico e testes de compatibilidade. Esta regra não vale para plasma."};
    }
    return {status:"negative",title:"Incompatível no modelo básico de hemácias.",
      detail:"Pelas regras básicas ABO/RhD, essas hemácias não são compatíveis com o receptor. A avaliação clínica deve ser feita por profissionais de hemoterapia. Para plasma, as regras são diferentes."};
  }

  function assessScene(scene, answer) {
    if (SCENES.indexOf(scene) === -1 || !CATEGORY[answer]) {
      return {status:"neutral",title:"Escolha uma alternativa.",detail:"Marque a opção que melhor descreve as manchas."};
    }
    var explanations = {
      gotas:"As manchas são arredondadas e aparecem separadas. Esse formato pode ser compatível com gotas isoladas sobre uma superfície lisa. A imagem não permite determinar a altura de origem, identificar a fonte do material ou reconstruir os acontecimentos.",
      contato:"As marcas estão conectadas, como pode acontecer quando um material é transferido por contato. Só pelo desenho, não é possível identificar o objeto, a pessoa ou a ordem dos acontecimentos.",
      direcionais:"As manchas são alongadas e têm orientação semelhante. Essa característica pode ajudar a formular hipóteses, mas não basta para identificar o mecanismo que produziu as marcas."
    };
    if (scene === answer) {
      return {status:"positive",title:"Essa opção corresponde ao exemplo.",
        detail:explanations[scene] + " Na perícia real, a imagem precisa ser analisada junto com as informações da cena e outros exames."};
    }
    return {status:"negative",title:"Observe a característica principal deste exemplo.",
      detail:"A resposta esperada para este desenho é: " + CATEGORY[scene] + ". " + explanations[scene] + " Isso não permite descartar outras explicações em uma análise real."};
  }

  var api = Object.freeze({
    GROUPS:GROUPS, SCENES:SCENES,
    compareForensic:compareForensic, redCellsCompatible:redCellsCompatible,
    compareTransfusion:compareTransfusion, assessScene:assessScene
  });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof document === "undefined") return;

  var visuals = {
    gotas: {
      caption:"Cinco manchas arredondadas e separadas em uma superfície ilustrada. Não há escala nem relação com um caso real.",
      image:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 330" role="img" aria-label="Ilustração fictícia de gotas arredondadas separadas sobre superfície clara"><rect width="600" height="330" fill="#e7edf6"/><path d="M0 72H600M0 167H600M0 270H600" stroke="#b6c5d7" opacity=".43" stroke-width="2"/><circle cx="105" cy="85" r="22" fill="#b41529"/><circle cx="225" cy="185" r="31" fill="#cf2034"/><circle cx="365" cy="104" r="19" fill="#c51b30"/><circle cx="460" cy="227" r="25" fill="#c21c2d"/><circle cx="524" cy="94" r="10" fill="#d02638"/></svg>'
    },
    contato: {
      caption:"Manchas conectadas para ilustrar contato com uma superfície. Não é um vestígio real.",
      image:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 330" role="img" aria-label="Ilustração fictícia de uma marca irregular por contato e um rastro contínuo"><rect width="600" height="330" fill="#e7edf6"/><path d="M85 128Q140 80 183 121Q224 91 254 142Q245 189 180 210Q140 234 89 194Q61 168 85 128Z" fill="#c92135" opacity=".85"/><path d="M197 149Q289 126 342 161T512 142" stroke="#b51a2b" stroke-width="28" stroke-linecap="round" fill="none" opacity=".70"/><path d="M207 185Q318 196 396 191T520 211" stroke="#e02c41" stroke-width="10" stroke-linecap="round" fill="none" opacity=".62"/><path d="M80 252Q268 240 490 255" stroke="#b6c5d7" stroke-width="2" opacity=".35" fill="none"/></svg>'
    },
    direcionais: {
      caption:"Manchas alongadas na mesma orientação. A ilustração não permite calcular velocidade nem trajetória.",
      image:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 330" role="img" aria-label="Ilustração fictícia de manchas alongadas orientadas para a direita"><rect width="600" height="330" fill="#e7edf6"/><g fill="#c31d31"><ellipse cx="132" cy="100" rx="65" ry="15" transform="rotate(-15 132 100)"/><path d="M175 75L227 66L191 94Z"/><ellipse cx="310" cy="170" rx="76" ry="20" transform="rotate(-15 310 170)"/><path d="M367 143L423 137L384 163Z"/><ellipse cx="212" cy="254" rx="52" ry="13" transform="rotate(-15 212 254)"/><path d="M247 233L288 227L258 249Z"/><ellipse cx="490" cy="88" rx="29" ry="10" transform="rotate(-15 490 88)"/></g></svg>'
    }
  };

  function resultInto(target, value) {
    target.setAttribute("data-status", value.status);
    var strong = document.createElement("strong");
    var paragraph = document.createElement("p");
    strong.textContent = value.title;
    paragraph.textContent = value.detail;
    target.replaceChildren(strong, paragraph);
  }
  function selectedInterpretation() {
    var checked = document.querySelector('input[name="interpretacao"]:checked');
    return checked ? checked.value : "";
  }
  function ready() {
    var sceneSelect = document.getElementById("scene-select");
    if (!sceneSelect) return;
    var frame = document.getElementById("scene-frame");
    var caption = document.getElementById("scene-caption");
    var sceneResult = document.getElementById("scene-result");

    function showScene() {
      var scene = visuals[sceneSelect.value] || visuals.gotas;
      frame.innerHTML = scene.image; // Exclusivamente SVGs literais definidos no próprio arquivo.
      caption.textContent = scene.caption;
      document.querySelectorAll('input[name="interpretacao"]').forEach(function (radio) {radio.checked = false;});
      sceneResult.removeAttribute("data-status");
      sceneResult.textContent = "Marque uma alternativa para conferir a explicação.";
    }
    sceneSelect.addEventListener("change", showScene);
    document.getElementById("check-scene").addEventListener("click", function () {
      resultInto(sceneResult, assessScene(sceneSelect.value, selectedInterpretation()));
    });
    document.getElementById("next-scene").addEventListener("click", function () {
      sceneSelect.selectedIndex = (sceneSelect.selectedIndex + 1) % sceneSelect.options.length;
      showScene();
      sceneSelect.focus();
    });
    document.getElementById("check-trace").addEventListener("click", function () {
      resultInto(document.getElementById("trace-result"),
        compareForensic(document.getElementById("trace-type").value, document.getElementById("reference-type").value));
    });
    document.getElementById("check-donation").addEventListener("click", function () {
      resultInto(document.getElementById("donation-result"),
        compareTransfusion(document.getElementById("donor-type").value, document.getElementById("recipient-type").value));
    });
    showScene();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready);
  else ready();
}());
