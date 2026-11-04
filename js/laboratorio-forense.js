/* Arquivo Sombrio — laboratório didático; sem APIs, uploads ou dados pessoais. */
(function () {
  "use strict";

  var GROUPS = Object.freeze(["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"]);
  var SCENES = Object.freeze(["gotas", "contato", "direcionais"]);
  var CATEGORY = Object.freeze({
    gotas: "Deposição de gotas isoladas",
    contato: "Transferência por contato",
    direcionais: "Marcas com orientação aparente"
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
      return {status:"neutral",title:"Selecione dois grupos válidos.",detail:"Escolha a tipagem hipotética do vestígio e da referência."};
    }
    if (trace === reference) {
      return {status:"positive",title:"Grupos iguais: não há exclusão por ABO/RhD.",
        detail:"Este resultado não prova que as amostras vieram da mesma pessoa. Muitas pessoas compartilham esse grupo. Identificação de origem exige outros exames, contexto e cadeia de custódia."};
    }
    return {status:"negative",title:"Grupos diferentes nesta comparação simplificada.",
      detail:"Assumindo tipagens corretas, amostras não misturadas e condições usuais, a diferença contraria a hipótese de mesma origem. Um caso real exige verificar qualidade das amostras, tratamentos e outras explicações antes de concluir."};
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
      return {status:"neutral",title:"Selecione dois grupos válidos.",detail:"Escolha os grupos ABO/RhD do doador e receptor."};
    }
    if (compatible) {
      return {status:"positive",title:"Compatível pelas regras básicas ABO/RhD para hemácias.",
        detail:"Isso não autoriza uma transfusão. Provas de compatibilidade, outros antígenos e anticorpos, histórico clínico e avaliação profissional continuam necessários. Não vale para plasma."};
    }
    return {status:"negative",title:"Incompatível pelas regras básicas ABO/RhD para hemácias.",
      detail:"Os antígenos das hemácias do doador podem não ser aceitos pelo receptor neste modelo. Apenas serviços de hemoterapia podem avaliar compatibilidade clínica. A regra é diferente para plasma."};
  }

  function assessScene(scene, answer) {
    if (SCENES.indexOf(scene) === -1 || !CATEGORY[answer]) {
      return {status:"neutral",title:"Escolha uma hipótese.",detail:"Compare a forma e a distribuição das marcas antes de avaliar."};
    }
    var explanations = {
      gotas:"As marcas arredondadas e separadas foram desenhadas para ilustrar gotas isoladas em superfície relativamente lisa. Não permitem concluir altura de queda, origem biológica ou sequência dos fatos.",
      contato:"As áreas conectadas e o contorno repetido foram desenhados para ilustrar transferência de material por contato. Não identificam objeto, pessoa ou a ordem dos acontecimentos.",
      direcionais:"As formas alongadas com orientação semelhante foram desenhadas para destacar uma direção aparente. O mecanismo exato não pode ser estabelecido sem documentação da cena e análises adicionais."
    };
    if (scene === answer) {
      return {status:"positive",title:"Interpretação coerente com o desenho didático.",
        detail:explanations[scene] + " Na prática, podem existir explicações alternativas; uma imagem isolada não constitui laudo."};
    }
    return {status:"negative",title:"O desenho foi preparado para destacar outra característica.",
      detail:"Neste exercício, a opção-alvo é: " + CATEGORY[scene] + ". " + explanations[scene] + " Essa comparação não permite descartar categoricamente outras hipóteses em uma cena real."};
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
      caption:"Cinco gotas arredondadas e isoladas sobre uma superfície lisa simulada. Não há escala ou relação com um caso real.",
      image:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 330" role="img" aria-label="Ilustração fictícia de gotas arredondadas separadas sobre superfície clara"><rect width="600" height="330" fill="#ded1b7"/><path d="M0 72H600M0 167H600M0 270H600" stroke="#b4a58e" opacity=".43" stroke-width="2"/><circle cx="105" cy="85" r="22" fill="#903844"/><circle cx="225" cy="185" r="31" fill="#a64651"/><circle cx="365" cy="104" r="19" fill="#8e3947"/><circle cx="460" cy="227" r="25" fill="#9e3f49"/><circle cx="524" cy="94" r="10" fill="#9d4149"/></svg>'
    },
    contato: {
      caption:"Marcas conectadas de contato e arrasto esquemático. Não é impressão de mão real nem vestígio coletado.",
      image:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 330" role="img" aria-label="Ilustração fictícia de uma marca irregular por contato e um rastro contínuo"><rect width="600" height="330" fill="#ded1b7"/><path d="M85 128Q140 80 183 121Q224 91 254 142Q245 189 180 210Q140 234 89 194Q61 168 85 128Z" fill="#a54551" opacity=".85"/><path d="M197 149Q289 126 342 161T512 142" stroke="#993d49" stroke-width="28" stroke-linecap="round" fill="none" opacity=".70"/><path d="M207 185Q318 196 396 191T520 211" stroke="#aa4b54" stroke-width="10" stroke-linecap="round" fill="none" opacity=".62"/><path d="M80 252Q268 240 490 255" stroke="#b4a58e" stroke-width="2" opacity=".35" fill="none"/></svg>'
    },
    direcionais: {
      caption:"Elipses alongadas com orientação semelhante. O desenho não permite inferir velocidade, trajetória exata ou agente causador.",
      image:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 330" role="img" aria-label="Ilustração fictícia de manchas alongadas orientadas para a direita"><rect width="600" height="330" fill="#ded1b7"/><g fill="#983c4b"><ellipse cx="132" cy="100" rx="65" ry="15" transform="rotate(-15 132 100)"/><path d="M175 75L227 66L191 94Z"/><ellipse cx="310" cy="170" rx="76" ry="20" transform="rotate(-15 310 170)"/><path d="M367 143L423 137L384 163Z"/><ellipse cx="212" cy="254" rx="52" ry="13" transform="rotate(-15 212 254)"/><path d="M247 233L288 227L258 249Z"/><ellipse cx="490" cy="88" rx="29" ry="10" transform="rotate(-15 490 88)"/></g></svg>'
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
      sceneResult.textContent = "Escolha uma hipótese para revelar a análise e suas limitações.";
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
