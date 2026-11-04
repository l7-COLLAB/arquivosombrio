/* Meu Arquivo — conquistas educativas de Perícia, privadas por usuário. */
(function () {
  "use strict";
  function init() {
    var root=document.getElementById("conquistas-pericia");
    var sync=window.ArquivoPericiaProgresso;
    if(!root || !sync)return;
    var grid=document.getElementById("forensic-personal-grid");
    var status=document.getElementById("forensic-personal-status");
    var importButton=document.getElementById("forensic-import-local");
    var LABELS=Object.freeze([
      {code:"trilha",name:"Trilha de Perícia",url:"laboratorio-forense.html#trilha",icon:"◉",max:9},
      {code:"custodia",name:"Cadeia de Custódia",url:"pericia-custodia.html",icon:"▤",max:2},
      {code:"papiloscopia",name:"Papiloscopia",url:"pericia-papiloscopia.html",icon:"◎",max:2}
    ]);
    var BADGES=Object.freeze({
      trilha:["Observação","Comparação","Interpretação"],
      custodia:["Controle de Evidências"],papiloscopia:["Observação Papiloscópica"]
    });
    function text(tag,value,klass) {
      var node=document.createElement(tag);
      node.textContent=value;
      if(klass)node.className=klass;
      return node;
    }
    function number(id,value){document.getElementById(id).textContent=String(value);}
    function card(item,row) {
      var steps=Math.max(0,Math.min(item.max,Number(row?.best_steps)||0));
      var completed=Boolean(row?.ever_completed);
      var section=document.createElement("article");
      section.className="forensic-personal-card";
      var head=document.createElement("div");head.className="forensic-personal-card-head";
      var icon=text("span",item.icon,"forensic-personal-card-icon");icon.setAttribute("aria-hidden","true");
      var titles=document.createElement("div");
      titles.append(text("h3",item.name),text("small",completed?"Concluída":steps?"Em andamento":"Ainda não iniciada"));
      head.append(icon,titles);section.appendChild(head);
      var percent=Math.round(steps/item.max*100);
      var bar=document.createElement("div");bar.className="forensic-personal-progress";
      bar.setAttribute("role","progressbar");bar.setAttribute("aria-valuemin","0");
      bar.setAttribute("aria-valuemax",String(item.max));bar.setAttribute("aria-valuenow",String(steps));
      bar.setAttribute("aria-label","Progresso de "+item.name);
      var fill=document.createElement("span");fill.style.width=percent+"%";bar.appendChild(fill);
      section.append(bar,text("p",item.code==="trilha"?
        steps+" de 9 questões · melhor pontuação registrada: "+(Number(row?.best_score)||0)+"/90":
        steps+" de 2 etapas concluídas"));
      var medals=document.createElement("div");medals.className="forensic-personal-medals";
      BADGES[item.code].forEach(function(name,index){
        var unlocked=item.code==="trilha"?steps>=(index+1)*3:completed;
        var medal=text("span",(unlocked?"★ ":"○ ")+name,
          "forensic-personal-medal"+(unlocked?"":" forensic-personal-medal-muted"));
        medal.title=unlocked?"Selo educativo obtido":"Selo educativo ainda não obtido";
        medals.appendChild(medal);
      });section.appendChild(medals);
      var link=document.createElement("a");link.href=item.url;
      link.textContent=completed?"Revisar exercício":steps?"Continuar exercício":"Estudar e começar";
      section.appendChild(link);
      return section;
    }
    function render() {
      if(!sync.isAccountActive()){
        status.textContent="Entre na sua conta para consultar o histórico privado.";
        importButton.hidden=true;
        return;
      }
      var rows=sync.listRecords();
      var completed=0,inProgress=0,awards=0;
      var fragment=document.createDocumentFragment();
      LABELS.forEach(function(item,index){
        var row=rows[index];
        var steps=Math.max(0,Math.min(item.max,Number(row?.best_steps)||0));
        if(row?.ever_completed) completed++;
        else if(steps>0) inProgress++;
        awards+=item.code==="trilha"?Math.floor(steps/3):(row?.ever_completed?1:0);
        fragment.appendChild(card(item,row));
      });
      grid.replaceChildren(fragment);
      number("forensic-completed",completed);
      number("forensic-in-progress",inProgress);
      number("forensic-awards",awards);
      var guest=sync.guestStats();
      importButton.hidden=guest.length===0;
      var pending=sync.pendingCount();
      status.textContent=pending
        ?pending+" atividade(s) aguardando sincronização. Sua cópia neste navegador foi preservada."
        :"Progresso privado, vinculado à sua conta. "+awards+" de 5 selos educativos liberados.";
    }
    importButton.addEventListener("click",async function(){
      var available=sync.guestStats();
      if(!available.length){importButton.hidden=true;return;}
      if(!window.confirm("Importar o progresso deste navegador para a conta atual? Em um aparelho compartilhado, confira se esses resultados são seus. Após a importação, a cópia local será retirada."))return;
      importButton.disabled=true;
      status.textContent="Importando progresso local…";
      try{
        var result=await sync.importGuest();
        render();
        status.textContent=result.imported>0
          ?result.imported+" atividade(s) importada(s). Seus registros já existentes foram preservados quando mais avançados."
          :"Nenhuma atividade precisou ser importada; a conta já possui progresso igual ou superior.";
      }catch(error){
        console.warn("Importação de Perícia não concluída",error);
        status.textContent="Não foi possível importar. Seu progresso local não foi apagado; tente novamente.";
      }finally{importButton.disabled=false;}
    });
    window.addEventListener("arquivo-pericia-progresso",render);
    sync.connect(false).then(render).catch(function(){
      status.textContent="Não foi possível carregar seu progresso. Os demais setores continuam disponíveis.";
    });
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);
  else init();
}());
