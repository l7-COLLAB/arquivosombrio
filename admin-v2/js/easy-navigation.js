/* Etapa 6 | Navegação rápida no Admin V2.
 * Executado somente depois de autenticação e montagem do painel.
 * Não intercepta ações de salvar, rascunho, publicar ou exclusão. */
(function () {
  "use strict";
  function init() {
    var hub = document.querySelector(".admin-hub-shell");
    if (!hub || hub.dataset.easyNavReady === "1") return false;
    var side = hub.querySelector(".admin-hub-sidebar");
    var nav = side && side.querySelector('nav[aria-label="Menu administrativo"]');
    if (!nav) return false;
    hub.dataset.easyNavReady = "1";

    var panel = document.createElement("div");
    panel.className = "admin-v2-easy-find";
    var label = document.createElement("label");
    label.htmlFor = "admin-v2-find-menu";
    label.textContent = "Encontrar uma função";
    var input = document.createElement("input");
    input.id = "admin-v2-find-menu";
    input.type = "search";
    input.placeholder = "Ex.: dossiês, rascunhos, áudio...";
    input.autocomplete = "off";
    input.setAttribute("aria-controls", "admin-v2-find-results");
    var helper = document.createElement("p");
    helper.className = "admin-v2-find-hint";
    helper.id = "admin-v2-find-results";
    helper.setAttribute("role", "status");
    helper.setAttribute("aria-live", "polite");
    helper.textContent = "Pesquise pelo nome ou pela finalidade da função.";
    panel.append(label, input, helper);
    nav.parentNode.insertBefore(panel, nav);

    var extraTerms = {
      overview:"início geral resumo painel cadastros",
      intelligence:"estatísticas métricas informações",
      content:"dossiês casos editar conteúdo salvar publicar cadastro arquivos",
      liteDrafts:"rascunho iPad revisar pendentes",
      schedule:"agendar agendamento publicar data programação",
      feature:"home destaque principal capa",
      narration:"áudio kokoro voz narração",
      voiceStudio:"mp3 arquivo voz gravar gerar voz",
      community:"fórum mensagens comunidade",
      users:"pessoas contas usuários",
      requests:"pedidos sugestões solicitações",
      activity:"histórico alterações revisões auditoria"
    };
    function normalize(v) {
      return String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    }
    function items() {
      return Array.from(nav.querySelectorAll('button[data-admin-hub-view],.admin-hub-visual-link,.admin-v2-extra-nav a,.admin-v2-extra-nav button'));
    }
    function update() {
      var q = normalize(input.value), shown = 0, nodes = items();
      nodes.forEach(function(node) {
        var key = node.getAttribute("data-admin-hub-view") || "";
        var haystack = normalize(node.textContent + " " + (extraTerms[key] || ""));
        var match = !q || q.split(/\s+/).every(function(word) {return haystack.includes(word);});
        node.hidden = !match;
        if (match) shown++;
      });
      helper.textContent = q
        ? (shown ? shown + (shown === 1 ? " função encontrada." : " funções encontradas.") : "Nenhuma função encontrada. Tente outra palavra.")
        : "Pesquise pelo nome ou pela finalidade da função.";
      var extra = nav.querySelector(".admin-v2-extra-nav");
      if (extra) extra.hidden = q !== "" && !Array.from(extra.querySelectorAll("a,button")).some(function(el){return !el.hidden;});
    }
    input.addEventListener("input", update);
    input.addEventListener("keydown", function(ev) {
      if (ev.key === "Escape") {
        input.value = "";
        update();
        input.blur();
      }
      if (ev.key === "Enter") {
        var visible = items().filter(function(el) {return !el.hidden && !(el.closest(".admin-v2-extra-nav") && el.closest(".admin-v2-extra-nav").hidden);});
        if (visible.length === 1) {
          ev.preventDefault();
          visible[0].click();
        }
      }
    });

    var contentBtn = nav.querySelector('button[data-admin-hub-view="content"]');
    if (contentBtn) {
      var guide = document.createElement("div");
      guide.className = "admin-v2-workflow-guide";
      var heading = document.createElement("strong");
      heading.textContent = "Fluxo de edição";
      var desc = document.createElement("p");
      desc.textContent = "Abra Conteúdos e edição para localizar um arquivo. Salvar, manter rascunho, agendar e publicar são ações diferentes: confira o estado exibido no editor antes de confirmar.";
      guide.append(heading, desc);
      var target = hub.querySelector('[data-admin-hub-panel="content"]');
      if (target) target.insertBefore(guide, target.firstChild);
    }
    return true;
  }
  window.ArquivoAdminEasyNav = {init:init};
})();
