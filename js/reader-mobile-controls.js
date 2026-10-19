/* Etapa 14 — controles compactos do leitor no celular.
 * Mantém botões e handlers originais no DOM; somente apresentação e acesso rápido ao sumário. */
(function(){
"use strict";
function init(){
 const bar=document.querySelector(".case-reader-toolbar");
 const actions=bar?.querySelector(".case-reader-actions");
 if(!bar||!actions||bar.dataset.mobileControlsReady==="1")return false;
 bar.dataset.mobileControlsReady="1";
 bar.classList.add("as-mobile-reader-ready");
 actions.id="as-mobile-reader-actions";
 const summary=document.createElement("button");
 summary.type="button";
 summary.className="case-reader-action as-mobile-summary";
 summary.setAttribute("aria-label","Ir ao sumário do dossiê");
 summary.innerHTML='<i class="fa-solid fa-list" aria-hidden="true"></i><small>Sumário</small>';
 summary.addEventListener("click",()=>{
  const nav=document.querySelector(".dossie-summary");
  if(!nav)return;
  const paging=bar.querySelector(".reader-page-navigation");
  if(paging&&!paging.hidden){
   const note=bar.querySelector(".as-mobile-reader-note");
   if(note)note.textContent="No modo livro, o sumário está na primeira página.";
   return;
  }
  nav.scrollIntoView({block:"start",behavior:"smooth"});
 });
 const more=document.createElement("button");
 more.type="button";
 more.className="case-reader-action as-mobile-more";
 more.setAttribute("aria-controls","as-mobile-reader-actions");
 more.setAttribute("aria-expanded","false");
 more.setAttribute("aria-label","Mostrar outras opções de leitura");
 more.innerHTML='<i class="fa-solid fa-ellipsis" aria-hidden="true"></i><small>Mais</small>';
 const note=document.createElement("span");
 note.className="as-mobile-reader-note";
 note.setAttribute("role","status");
 note.setAttribute("aria-live","polite");
 note.textContent="";
 more.addEventListener("click",()=>{
  const active=bar.classList.toggle("as-mobile-reader-expanded");
  more.setAttribute("aria-expanded",String(active));
  more.setAttribute("aria-label",active?"Ocultar outras opções de leitura":"Mostrar outras opções de leitura");
  more.querySelector("small").textContent=active?"Menos":"Mais";
  if(!active && actions.contains(document.activeElement) && document.activeElement!==more)more.focus();
 });
 actions.append(summary,more);
 bar.append(note);
 return true;
}
window.ArquivoLeitorMobile=Object.freeze({init});
})();
