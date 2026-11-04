/* Trilha de Perícia — quiz educativo. Sem cadastro, ranking externo ou envio de respostas. */
(function () {
  "use strict";

  var KEY = "arquivo-sombrio-pericia-trilha-v1";
  /* O índice das questões e as respostas anteriores permanecem inalterados. */
  var GUIDE_CHAPTERS = Object.freeze(["metodo","manchas","manchas","comparacao","comparacao","hemacias","hipoteses","custodia","hipoteses"]);
  function guideForQuestion(index) {
    return Number.isInteger(index) && index >= 0 && index < GUIDE_CHAPTERS.length
      ? "guia-pericia.html#" + GUIDE_CHAPTERS[index] : null;
  }
  var DIDACTIC = typeof document === "undefined" && typeof require === "function"
    ? require("./pericia-visuais.js")
    : (typeof window !== "undefined" ? window.ArquivoPericiaVisuals : null);
  var STAGES = Object.freeze([
    {title:"Observação", code:"01", subtitle:"Reconheça características visíveis", badge:"Selo de Observação"},
    {title:"Comparação", code:"02", subtitle:"Compare resultados ABO/RhD", badge:"Selo de Comparação"},
    {title:"Interpretação", code:"03", subtitle:"Avalie o alcance das conclusões", badge:"Selo de Interpretação"}
  ]);

  /* Questões autocontidas: não pressupõem exame real, nem identificam pessoas por grupo sanguíneo. */
  var QUESTIONS = Object.freeze([
    {
      stage:0, label:"Manchas isoladas", mark:"●  ●   ●", kind:"drops",
      context:"Ilustração: cinco marcas arredondadas e separadas sobre uma superfície lisa.",
      prompt:"Qual descrição inicial é a mais adequada?",
      choices:["Padrão visual de gotas isoladas","Marca contínua por contato","Trajeto de arrasto sobre a superfície","Projeção com direção comprovada"],
      correct:0,
      explanation:"As manchas são separadas e arredondadas, por isso a descrição visual mais adequada é a de gotas isoladas. O desenho não informa a altura de origem nem o que aconteceu na cena."
    },
    {
      stage:0, label:"Registro de observação", mark:"▬   ▰   ▬", kind:"ellipses",
      context:"Ilustração: três manchas alongadas em uma mesma superfície.",
      prompt:"O que pode ser registrado diretamente a partir da imagem?",
      choices:["A velocidade exata do material","O ponto de origem no espaço","O formato alongado das manchas","A posição de quem produziu as marcas"],
      correct:2,
      explanation:"O formato das manchas é uma característica observável. Velocidade, origem e posição exigem outros dados e uma análise apropriada."
    },
    {
      stage:0, label:"Marcas de contato", mark:"▰━━━━━━▰", kind:"contact",
      context:"Ilustração: há uma área marcada e um rastro contínuo ao lado.",
      prompt:"Qual possibilidade vale investigar primeiro?",
      choices:["O número exato de pessoas presentes","Transferência de material por contato","A identidade de quem tocou na superfície","A sequência completa das ações"],
      correct:1,
      explanation:"Uma marca contínua pode ser compatível com transferência por contato. O desenho não identifica quem ou o que fez a marca, nem estabelece a sequência dos acontecimentos."
    },
    {
      stage:1, label:"Amostras com o mesmo grupo", mark:"A+  =  A+", kind:"abo",
      context:"Exemplo hipotético: o vestígio e a amostra de referência são A+; as duas tipagens foram feitas corretamente.",
      prompt:"O que esse resultado permite dizer?",
      choices:["As duas amostras pertencem à mesma pessoa","O resultado comprova contato físico","O grupo sanguíneo exclui uma origem comum","O grupo é igual, mas não identifica a origem"],
      correct:3,
      explanation:"Grupos iguais não excluem uma origem comum, mas também não provam que o sangue veio da mesma pessoa. Muitas pessoas compartilham o mesmo grupo ABO/RhD."
    },
    {
      stage:1, label:"Amostras com grupos diferentes", mark:"B−  ≠  A+", kind:"abo",
      context:"Exemplo hipotético: o vestígio é B− e a referência é A+. Considere tipagens corretas e amostras sem mistura.",
      prompt:"Qual conclusão é adequada nessas condições?",
      choices:["A diferença contraria a hipótese de mesma origem","A diferença confirma uma única origem","A comparação permite identificar a pessoa","O resultado prova quem esteve no local"],
      correct:0,
      explanation:"Nessas condições, grupos diferentes contrariam a hipótese de que o sangue veio da mesma pessoa. Uma investigação real também precisa avaliar a qualidade da amostra e o contexto."
    },
    {
      stage:1, label:"Compatibilidade de hemácias", mark:"O−  →  AB+", kind:"abo",
      context:"Exercício separado de hemoterapia: doador O− e receptor AB+, considerando apenas as regras básicas ABO/RhD para hemácias.",
      prompt:"Qual é o resultado correto nesse modelo?",
      choices:["Não compatível pelo sistema ABO","Compatível também para plasma pela mesma regra","Compatível no modelo básico, mas exige testes clínicos","A tipagem já autoriza a transfusão"],
      correct:2,
      explanation:"Hemácias O− são compatíveis com receptores AB+ pelas regras básicas ABO/RhD. Uma transfusão real exige outros testes e avaliação profissional; o modelo não se aplica ao plasma."
    },
    {
      stage:2, label:"Conclusões sobre uma imagem", mark:"⇢   ▰  ▰", kind:"reason",
      context:"Uma pessoa vê manchas alongadas numa fotografia e afirma conhecer o objeto que as produziu.",
      prompt:"Como avaliar essa afirmação?",
      choices:["A fotografia revela a identidade do objeto","A foto isolada não permite identificar o objeto","O alongamento prova uma única causa","A forma define a sequência completa do evento"],
      correct:1,
      explanation:"Manchas alongadas podem admitir diferentes mecanismos. Para investigar a origem, seriam necessárias informações da cena e outros exames."
    },
    {
      stage:2, label:"Origem das amostras", mark:"A  ·  ?  ·  B", kind:"records",
      context:"Duas amostras têm o mesmo grupo ABO/RhD, mas não há registros suficientes sobre onde e como foram coletadas.",
      prompt:"Qual informação precisa ser esclarecida antes de interpretar a comparação?",
      choices:["A cor usada no formulário do laboratório","A ordem alfabética dos nomes das amostras","A aparência da embalagem em uma fotografia","Os registros de coleta, identificação e custódia"],
      correct:3,
      explanation:"A documentação de coleta, identificação e cadeia de custódia ajuda a avaliar se as amostras são as que se pretende comparar e se foram preservadas adequadamente."
    },
    {
      stage:2, label:"Hipóteses e outros exames", mark:"?  +  ?  =  análise", kind:"records",
      context:"Uma hipótese sobre uma cena não explica todos os vestígios observados.",
      prompt:"Qual é o próximo passo mais adequado?",
      choices:["Revisar a hipótese e buscar outras informações ou exames","Manter a hipótese sem considerar os vestígios","Tratar uma mancha isolada como prova conclusiva","Decidir pela versão apresentada primeiro"],
      correct:0,
      explanation:"Uma hipótese precisa ser confrontada com os vestígios e outras fontes. Resultados contraditórios devem ser examinados, não ignorados."
    }
  ]);

  function validateState(raw) {
    var empty = {index:0, answers:[]};
    if (!raw || !Number.isInteger(raw.index) || !Array.isArray(raw.answers)) return empty;
    var len = raw.answers.length;
    if (len > QUESTIONS.length || raw.index < 0 || raw.index > QUESTIONS.length) return empty;
    if (!(raw.index === len || (len > 0 && raw.index === len - 1))) return empty;
    if (raw.answers.some(function (choice) {return !Number.isInteger(choice) || choice < 0 || choice > 3;})) return empty;
    return {index:raw.index, answers:raw.answers.slice()};
  }

  function evaluate(index, choice) {
    if (!Number.isInteger(index) || index < 0 || index >= QUESTIONS.length) return null;
    var q = QUESTIONS[index];
    if (!Number.isInteger(choice) || choice < 0 || choice >= q.choices.length) return null;
    return {
      correct:choice === q.correct,
      title:choice === q.correct ? "Interpretação adequada" : "Vale revisar este ponto",
      detail:(choice === q.correct ? "" : "Neste exercício, a opção mais adequada é: " + q.choices[q.correct] + ". ") + q.explanation,
      reason:DIDACTIC ? DIDACTIC.CHOICE_NOTES[index][choice] : ""
    };
  }

  function progress(answers) {
    var length = Array.isArray(answers) ? Math.min(answers.length, QUESTIONS.length) : 0;
    var correct = 0;
    for (var i = 0; i < length; i++) {
      var answer = evaluate(i, answers[i]);
      if (answer && answer.correct) correct++;
    }
    return {done:length, correct:correct, points:correct * 10, badges:Math.floor(length / 3), completed:length === QUESTIONS.length};
  }

  /* A revisão usa as respostas originais; não altera pontos ou selos conquistados. */
  function reviewMistakes(answers) {
    if (!Array.isArray(answers)) return [];
    var mistakes = [];
    QUESTIONS.slice(0, Math.min(answers.length, QUESTIONS.length)).forEach(function(q, i) {
      var answer = evaluate(i, answers[i]);
      if (!answer || answer.correct) return;
      mistakes.push({
        index:i + 1, stage:q.stage, prompt:q.prompt,
        selected:q.choices[answers[i]], correct:q.choices[q.correct],
        explanation:q.explanation,
        reason:answer.reason
      });
    });
    return mistakes;
  }

  /* Links para artigos existentes no acervo: evitar rotas inventadas e conteúdo externo. */
  var READINGS = Object.freeze([
    {stage:0, title:"Análise de manchas de sangue", href:"pericia.html?id=5#forense", description:"O que os formatos das manchas permitem observar e quais são as limitações da análise."},
    {stage:1, title:"DNA de toque", href:"pericia.html?id=8#forense", description:"Por que um vestígio biológico nem sempre revela quem participou de uma ação."},
    {stage:2, title:"Reconhecimento de pessoas", href:"pericia.html?id=11#forense", description:"Como a interpretação das evidências pode falhar e por que a conclusão precisa ser contextualizada."}
  ]);
  function recommendedReadings(answers) {
    var misses = [0,0,0];
    reviewMistakes(answers).forEach(function(m) {misses[m.stage] += 1;});
    return READINGS.slice().sort(function(a,b) {
      return misses[b.stage] - misses[a.stage] || a.stage - b.stage;
    }).slice(0,2);
  }

  var API = Object.freeze({STAGES:STAGES, QUESTIONS:QUESTIONS, validateState:validateState, evaluate:evaluate, progress:progress, reviewMistakes:reviewMistakes, recommendedReadings:recommendedReadings, guideForQuestion:guideForQuestion});
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  if (typeof document === "undefined") return;

  function byId(id) {return document.getElementById(id);}
  function replaceText(id,value){byId(id).textContent = value;}
  function read() {
    try {return validateState(JSON.parse(localStorage.getItem(KEY)));} catch (_) {return validateState(null);}
  }
  function write(state) {
    try {localStorage.setItem(KEY, JSON.stringify(state));} catch (_) { /* Sem armazenamento: quiz continua funcional. */ }
  }
  function remove() {
    try {localStorage.removeItem(KEY);} catch (_) {}
  }
  function describeBadges(completed) {
    var badges = document.querySelectorAll("[data-quest-badge]");
    badges.forEach(function (badge, i) {
      var unlocked = completed > i;
      badge.classList.toggle("quest-badge-unlocked", unlocked);
      badge.setAttribute("aria-label", STAGES[i].badge + (unlocked ? " liberado" : " ainda não liberado"));
      badge.querySelector("small").textContent = unlocked ? "Concluído" : "A concluir";
    });
  }

  function init() {
    var root = byId("quest-app");
    if (!root) return;
    var state = read();
    var options = byId("quest-options");
    var check = byId("quest-answer");
    var next = byId("quest-next");
    var explanation = byId("quest-feedback");
    var finish = byId("quest-finish");
    var questionArea = byId("quest-question-card");
    var display = byId("quest-illustration");
    var saved = byId("quest-local-note");
    var hintButton = byId("quest-hint");
    var hintText = byId("quest-hint-text");
    var diagram = byId("quest-graphic");
    var reviewOpen = false;

    function renderReview(answers) {
      var mistakes = reviewMistakes(answers);
      var reviewToggle = byId("quest-review-toggle");
      var reviewPanel = byId("quest-review-panel");
      var list = byId("quest-review-list");
      list.replaceChildren();
      mistakes.forEach(function(m) {
        var item = document.createElement("li");
        var heading = document.createElement("strong");
        heading.textContent = "Questão " + m.index + " · " + STAGES[m.stage].title;
        var prompt = document.createElement("p");
        prompt.textContent = m.prompt;
        var chosen = document.createElement("p");
        chosen.textContent = "Sua resposta: " + m.selected;
        var correct = document.createElement("p");
        correct.textContent = "Resposta mais adequada: " + m.correct;
        var explanation = document.createElement("p");
        explanation.textContent = m.explanation;
        var reason = document.createElement("p");
        reason.textContent = "Sobre sua alternativa: " + m.reason;
        item.append(heading,prompt,chosen,correct,reason,explanation);
        list.appendChild(item);
      });
      reviewToggle.hidden = mistakes.length === 0;
      reviewToggle.textContent = "Revisar " + mistakes.length + (mistakes.length===1 ? " resposta" : " respostas");
      reviewToggle.setAttribute("aria-expanded", String(reviewOpen && mistakes.length > 0));
      reviewPanel.hidden = !reviewOpen || mistakes.length === 0;
      byId("quest-review-perfect").hidden = mistakes.length > 0;

      var readings = byId("quest-reading-list");
      readings.replaceChildren();
      recommendedReadings(answers).forEach(function(item) {
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.href = item.href;
        a.textContent = item.title;
        var caption = document.createElement("p");
        caption.textContent = item.description;
        li.append(a,caption);
        readings.appendChild(li);
      });
    }
    function reset() {
      if (state.answers.length && !window.confirm("Reiniciar a trilha? As respostas e os selos desta rodada serão apagados neste navegador.")) return;
      state = validateState(null);
      reviewOpen = false;
      remove();
      render();
      byId("quest-title").focus();
    }

    function render() {
      var stats = progress(state.answers);
      replaceText("quest-counter", stats.done + " / " + QUESTIONS.length + " respondidas");
      replaceText("quest-points", stats.points + " pontos");
      var bar = byId("quest-progress-bar");
      bar.setAttribute("aria-valuenow", String(stats.done));
      byId("quest-progress-fill").style.width = ((stats.done / QUESTIONS.length) * 100) + "%";
      describeBadges(stats.badges);
      saved.textContent = "O progresso fica salvo apenas neste navegador. Você pode reiniciar quando quiser.";

      if (state.index >= QUESTIONS.length) {
        questionArea.hidden = true;
        finish.hidden = false;
        replaceText("quest-stage-name", "Trilha concluída");
        replaceText("quest-final-score", stats.correct + " de " + QUESTIONS.length + " respostas corretas · " + stats.points + " pontos");
        replaceText("quest-final-note", stats.correct >= 7 ?
          "Você concluiu as três etapas. Confira os artigos para aprofundar os métodos estudados." :
          "Você concluiu as três etapas. Pode refazer o desafio e revisar as explicações das respostas.");
        byId("quest-perfect").hidden = stats.correct !== QUESTIONS.length;
        renderReview(state.answers);
        return;
      }

      finish.hidden = true;
      questionArea.hidden = false;
      var q = QUESTIONS[state.index];
      var stage = STAGES[q.stage];
      replaceText("quest-stage-name", "Etapa " + stage.code + " · " + stage.title);
      replaceText("quest-question-count", "QUESTÃO " + (state.index + 1) + " DE " + QUESTIONS.length);
      replaceText("quest-title", q.prompt);
      replaceText("quest-context", q.context);
      byId("quest-study-link").href = guideForQuestion(state.index);
      replaceText("quest-visual-title", q.label);
      display.dataset.kind = q.kind;
      // Apenas os nove SVGs estáticos produzidos no arquivo local de ilustrações.
      if (DIDACTIC) diagram.innerHTML = DIDACTIC.VISUALS[state.index].html;
      hintButton.hidden = state.answers.length > state.index;
      hintButton.setAttribute("aria-expanded", "false");
      hintButton.textContent = "Ver uma dica";
      hintText.hidden = true;
      hintText.textContent = DIDACTIC ? DIDACTIC.HINTS[state.index] : "Observe os dados fornecidos antes de escolher.";
      var answered = state.answers.length > state.index;
      options.replaceChildren();
      var legend = document.createElement("legend");
      legend.className = "visually-hidden";
      legend.textContent = "Escolha uma resposta";
      options.appendChild(legend);
      q.choices.forEach(function (choice, i) {
        var row = document.createElement("label");
        row.className = "quest-choice";
        var input = document.createElement("input");
        input.type = "radio";
        input.name = "quest-choice";
        input.value = String(i);
        input.disabled = answered;
        input.checked = answered && state.answers[state.index] === i;
        var text = document.createElement("span");
        text.textContent = choice;
        row.appendChild(input);
        row.appendChild(text);
        options.appendChild(row);
        if (answered && i === q.correct) row.classList.add("quest-choice-correct");
      });
      if (answered) {
        var outcome = evaluate(state.index,state.answers[state.index]);
        explanation.hidden = false;
        explanation.dataset.result = outcome.correct ? "correct" : "review";
        explanation.replaceChildren();
        var heading = document.createElement("strong");
        heading.textContent = outcome.title;
        var paragraph = document.createElement("p");
        paragraph.textContent = outcome.detail;
        explanation.append(heading, paragraph);
        if (outcome.reason) {
          var reason = document.createElement("p");
          reason.className = "quest-choice-reason";
          reason.textContent = "Por que sua alternativa foi avaliada assim: " + outcome.reason;
          explanation.appendChild(reason);
        }
        if (state.answers.length % 3 === 0 && state.answers.length === state.index + 1) {
          var milestone = document.createElement("p");
          milestone.className = "quest-milestone";
          milestone.textContent = STAGES[q.stage].badge + " liberado. Etapa " + STAGES[q.stage].code + " concluída.";
          explanation.appendChild(milestone);
        }
        check.hidden = true;
        next.hidden = false;
        next.textContent = state.index === QUESTIONS.length - 1 ? "Ver meus selos" :
          (state.index % 3 === 2 ? "Começar a próxima etapa" : "Próxima pergunta");
      } else {
        explanation.hidden = true;
        explanation.replaceChildren();
        check.hidden = false;
        next.hidden = true;
      }
    }

    hintButton.addEventListener("click",function() {
      if (state.answers.length > state.index || state.index >= QUESTIONS.length) return;
      var open = hintButton.getAttribute("aria-expanded") !== "true";
      hintButton.setAttribute("aria-expanded", String(open));
      hintButton.textContent = open ? "Ocultar dica" : "Ver uma dica";
      hintText.hidden = !open;
    });
    check.addEventListener("click",function(){
      if (state.index >= QUESTIONS.length || state.answers.length !== state.index) return;
      var selected = options.querySelector('input[name="quest-choice"]:checked');
      if (!selected) {
        explanation.hidden = false;
        explanation.dataset.result = "review";
        explanation.textContent = "Selecione uma alternativa antes de conferir.";
        var first = options.querySelector("input");
        if (first) first.focus();
        return;
      }
      var choice = Number(selected.value);
      if (!evaluate(state.index,choice)) return;
      state.answers.push(choice);
      write(state);
      render();
      explanation.focus();
    });
    next.addEventListener("click",function(){
      if (state.answers.length !== state.index + 1) return;
      state.index += 1;
      write(state);
      render();
      if (state.index >= QUESTIONS.length) finish.focus();
      else byId("quest-title").focus();
    });
    byId("quest-restart").addEventListener("click", reset);
    byId("quest-reset").addEventListener("click", reset);
    byId("quest-review-toggle").addEventListener("click", function() {
      reviewOpen = !reviewOpen;
      byId("quest-review-panel").hidden = !reviewOpen;
      byId("quest-review-toggle").setAttribute("aria-expanded", String(reviewOpen));
      if (reviewOpen) byId("quest-review-panel").focus();
    });
    byId("quest-copy").addEventListener("click",function(){
      var stats = progress(state.answers);
      if (!stats.completed) return;
      var result = "Concluí a Trilha de Perícia do Arquivo Sombrio: " + stats.correct + "/9 acertos e 3 selos educativos. " +
        "https://arquivosombrio.net.br/laboratorio-forense.html#trilha";
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        replaceText("quest-copy-status", "Não foi possível copiar automaticamente neste navegador.");
        return;
      }
      navigator.clipboard.writeText(result).then(function(){
        replaceText("quest-copy-status", "Resultado copiado. Você pode colá-lo em uma mensagem.");
      }).catch(function(){
        replaceText("quest-copy-status", "O navegador bloqueou a cópia automática.");
      });
    });
    render();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
}());
