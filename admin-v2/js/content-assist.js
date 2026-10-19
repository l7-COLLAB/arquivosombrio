/* Fase 7 — ferramentas de leitura do editor, sem persistência ou operações de escrita. */
(function(){
"use strict";
function init(){
 const hub=document.querySelector(".admin-hub-shell");
 const panel=hub&&hub.querySelector('[data-admin-hub-panel="content"]');
 if(!panel||panel.dataset.contentToolsReady==="1")return false;
 const search=panel.querySelector("#admin-content-search");
 const order=panel.querySelector("#admin-content-order");
 const tabs=panel.querySelector(".admin-content-tabs");
 if(!search||!order||!tabs)return false;
 panel.dataset.contentToolsReady="1";
 const bar=document.createElement("section");
 bar.className="admin-v2-content-assist";
 bar.setAttribute("aria-label","Orientação do editor");
 const heading=document.createElement("div");
 heading.className="admin-v2-content-assist-heading";
 const h=document.createElement("strong");h.textContent="Encontre o arquivo que deseja editar";
 const p=document.createElement("p");p.textContent="Escolha a categoria, pesquise pelo título e confira o estado indicado no registro antes de editar.";
 heading.append(h,p);
 const action=document.createElement("div");action.className="admin-v2-content-assist-actions";
 const focusBtn=document.createElement("button");focusBtn.type="button";focusBtn.textContent="Pesquisar arquivo";
 const resetBtn=document.createElement("button");resetBtn.type="button";resetBtn.textContent="Limpar pesquisa e filtros";
 resetBtn.className="admin-v2-assist-reset";
 focusBtn.addEventListener("click",function(){search.focus();search.scrollIntoView({block:"center",behavior:"auto"});});
 resetBtn.addEventListener("click",function(){
   search.value="";
   search.dispatchEvent(new Event("input",{bubbles:true}));
   if(order.value!=="recentes"){order.value="recentes";order.dispatchEvent(new Event("change",{bubbles:true}));}
   const tracking=panel.querySelector("#admin-content-tracking");
   if(tracking&&tracking.value!==""){tracking.value="";tracking.dispatchEvent(new Event("change",{bubbles:true}));}
   schedule();
 });
 action.append(focusBtn,resetBtn);
 const report=document.createElement("p");report.className="admin-v2-content-count";report.setAttribute("role","status");report.setAttribute("aria-live","polite");
 const note=document.createElement("p");note.className="admin-v2-content-state-help";
 note.textContent="Rascunho: ainda não publicado. Agendado: publicação programada. Confirme sempre o estado efetivo no editor; a ausência de etiqueta não comprova publicação.";
 bar.append(heading,action,report,note);
 tabs.parentNode.insertBefore(bar,tabs);
 let pending=false;
 function update(){
  pending=false;
  const section=Array.from(panel.querySelectorAll("[data-admin-section]")).find(function(node){return !node.hidden;});
  if(!section){report.textContent="Escolha uma categoria para consultar os arquivos.";return;}
  const list=section.querySelector(".admin-list");
  const items=list?Array.from(list.querySelectorAll(".admin-item")):[];
  const visible=items.filter(function(item){return !item.hidden;});
  const draft=visible.filter(function(item){return /\bRASCUNHO\b/i.test(item.querySelector("small")?.textContent||"");}).length;
  const scheduled=visible.filter(function(item){return /\bAGENDADO\b/i.test(item.querySelector("small")?.textContent||"");}).length;
  const details=[];
  if(draft)details.push(draft+" rascunho"+(draft===1?"":"s"));
  if(scheduled)details.push(scheduled+" agendado"+(scheduled===1?"":"s"));
  report.textContent=visible.length+" de "+items.length+" arquivos exibidos"+(details.length?" · "+details.join(" · "):"")+".";
 }
 function schedule(){
  if(pending)return;
  pending=true;
  window.setTimeout(update,0);
 }
 panel.addEventListener("input",function(e){if(e.target===search)schedule();});
 panel.addEventListener("change",function(e){if(e.target===order||e.target.id==="admin-content-tracking")schedule();});
 tabs.addEventListener("click",schedule);
 const tracking=panel.querySelector("#admin-content-tracking");
 if(tracking)tracking.addEventListener("change",schedule);
 schedule();
 return true;
}
window.ArquivoAdminContentAssist={init:init};
})();
