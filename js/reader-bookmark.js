/* Etapa 13 | Marcador manual de leitura. Apenas no modo rolagem.
   Posição mantida localmente, sem conta, cookies ou transmissão ao servidor. */
(function(){
"use strict";
const prefix="arquivo_sombrio_marcador_dossie_v1:";
function key(id){return prefix+String(id).slice(0,180);}
function valid(data){return data&&Number.isFinite(data.ratio)&&data.ratio>=0&&data.ratio<=1&&Number.isFinite(data.savedAt)&&Date.now()-data.savedAt<90*24*60*60*1000;}
function get(id){
 try {const v=JSON.parse(localStorage.getItem(key(id)));return valid(v)?v:null;}catch(e){return null;}
}
function init(id){
 const bar=document.querySelector(".case-reader-toolbar");
 const article=document.querySelector(".case-main-content");
 if(!id||!bar||!article||bar.querySelector(".as-reader-bookmark"))return false;
 const box=document.createElement("div");box.className="as-reader-bookmark";
 const save=document.createElement("button");save.type="button";save.textContent="Guardar ponto";save.setAttribute("aria-label","Guardar posição de leitura neste dispositivo");
 const resume=document.createElement("button");resume.type="button";resume.textContent="Retomar leitura";resume.setAttribute("aria-label","Retomar posição de leitura guardada");
 const clear=document.createElement("button");clear.type="button";clear.textContent="Apagar marcação";clear.setAttribute("aria-label","Apagar posição de leitura guardada");
 const status=document.createElement("span");status.setAttribute("role","status");status.setAttribute("aria-live","polite");status.className="as-reader-bookmark-status";
 const controls=document.createElement("div");controls.className="as-reader-bookmark-actions";
 controls.append(save,resume,clear);box.append(controls,status);
 bar.append(box);
 const bookMode=()=>{const paging=bar.querySelector(".reader-page-navigation");return !!(paging&&!paging.hidden);};
 function refresh(){
  const stored=get(id);
  resume.disabled=!stored;
  clear.disabled=!stored;
  status.textContent=stored?"Marcação guardada neste dispositivo.":"Nenhum ponto guardado neste dispositivo.";
 }
 save.addEventListener("click",()=>{
  if(bookMode()){status.textContent="Para guardar o ponto, selecione o formato de rolagem.";return;}
  const max=Math.max(0,document.documentElement.scrollHeight-window.innerHeight);
  const ratio=max>0?Math.max(0,Math.min(1,window.scrollY/max)):0;
  try{
   localStorage.setItem(key(id),JSON.stringify({ratio,savedAt:Date.now()}));
   refresh();status.textContent="Ponto de leitura guardado.";
  }catch(e){status.textContent="O navegador não permitiu guardar a marcação.";}
 });
 resume.addEventListener("click",()=>{
  if(bookMode()){status.textContent="Para retomar, selecione o formato de rolagem.";return;}
  const v=get(id);if(!v){refresh();return;}
  const max=Math.max(0,document.documentElement.scrollHeight-window.innerHeight);
  window.scrollTo({top:Math.round(v.ratio*max),behavior:"auto"});
  status.textContent="Posição de leitura restaurada.";
 });
 clear.addEventListener("click",()=>{
  try{localStorage.removeItem(key(id));refresh();status.textContent="Marcação apagada deste dispositivo.";}
  catch(e){status.textContent="Não foi possível apagar a marcação.";}
 });
 refresh();
 return true;
}
window.ArquivoMarcadorLeitura=Object.freeze({init});
})();
