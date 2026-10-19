/* Pesquisa pública unificada — somente metadados de registros publicados.
   Nenhuma autenticação, escrita, perfil, rastreamento ou acesso a rascunhos. */
(function(){
"use strict";
const url="https://iuhotznurbyujzbyhizf.supabase.co";
const key="sb_publishable_bpAZ5EhYLIuVoE4Q97s_-A_XQwwRxUj";
const sources=[
 {id:"dossies",name:"Dossiês",table:"Casos",columns:"id,titulo,resumo,categoria,slug,created_at,status_publicacao",path:"caso.html",date:"created_at"},
 {id:"garimpo",name:"Garimpo Sombrio",table:"casos_diarios",columns:"id,titulo,resumo,categoria,created_at,status_publicacao",path:"garimpo.html",date:"created_at"},
 {id:"pericia",name:"Perícia Forense",table:"pericias",columns:"id,titulo,resumo,categoria,created_at,status_publicacao",path:"pericia.html",date:"created_at",hash:"#forense"},
 {id:"lendas",name:"Lendas",table:"lendas",columns:"id,titulo,resumo,categoria,origem,created_at,status_publicacao",path:"lendas.html",date:"created_at"},
 {id:"creepypastas",name:"Creepypastas",table:"creepypastas",columns:"id,titulo,resumo,categoria,origem,created_at,status_publicacao",path:"creepypastas.html",date:"created_at"}
];
const $=id=>document.getElementById(id);
const normalize=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
const state={loaded:false,rows:[],errors:[],category:"all",order:"relevance"};
const HISTORY_ENABLED="as_search_history_enabled_v1";
const HISTORY_KEY="as_search_history_v1";
function storageGet(k){try{return localStorage.getItem(k);}catch(e){return null;}}
function storageSet(k,v){try{localStorage.setItem(k,v);return true;}catch(e){return false;}}
function storageRemove(k){try{localStorage.removeItem(k);}catch(e){}}
function historyEnabled(){return storageGet(HISTORY_ENABLED)==="yes";}
function recentTerms(){
 if(!historyEnabled())return [];
 try{const data=JSON.parse(storageGet(HISTORY_KEY)||"[]");return Array.isArray(data)?data.filter(x=>typeof x==="string"&&x.length<=120).slice(0,6):[];}catch(e){return [];}
}
function renderHistory(){
 const enabled=historyEnabled();
 $("as-search-save-history").checked=enabled;
 $("as-search-history-content").hidden=!enabled;
 const holder=$("as-search-history-items");holder.replaceChildren();
 if(!enabled)return;
 recentTerms().forEach(term=>{
  const b=make("button","as-search-term",term);b.type="button";
  b.addEventListener("click",()=>applyTerm(term));
  holder.append(b);
 });
 if(!holder.children.length)holder.append(make("p","as-search-history-empty","Nenhuma pesquisa guardada."));
}
function remember(q){
 if(!historyEnabled()||!q)return;
 const updated=[q,...recentTerms().filter(x=>normalize(x)!==normalize(q))].slice(0,6);
 storageSet(HISTORY_KEY,JSON.stringify(updated));renderHistory();
}
function applyTerm(q){
 $("as-search-input").value=q;updateURL(q);remember(q);render();renderSuggestions();
 $("as-search-input").focus();
}
function renderSuggestions(){
 const holder=$("as-search-suggestion-items"),box=$("as-search-suggestions");
 holder.replaceChildren();
 const q=normalize($("as-search-input").value);
 if(!state.loaded||q.length<2){box.hidden=true;return;}
 const names=new Set();
 state.rows.forEach(item=>{
  if(names.size>=6)return;
  if(normalize(item.titulo).includes(q))names.add(String(item.titulo).slice(0,120));
 });
 box.hidden=!names.size;
 names.forEach(term=>{
  const b=make("button","as-search-term",term);b.type="button";
  b.addEventListener("click",()=>applyTerm(term));
  holder.append(b);
 });
}
function sorter(a,b,terms){
 const date=(x)=>{const n=Date.parse(x.created_at||"");return Number.isFinite(n)?n:0;};
 switch(state.order){
  case "recent":return date(b)-date(a)||String(a.titulo).localeCompare(String(b.titulo),"pt-BR");
  case "oldest":return date(a)-date(b)||String(a.titulo).localeCompare(String(b.titulo),"pt-BR");
  case "az":return String(a.titulo).localeCompare(String(b.titulo),"pt-BR");
  case "za":return String(b.titulo).localeCompare(String(a.titulo),"pt-BR");
  default:return rank(b,terms)-rank(a,terms)||date(b)-date(a);
 }
}
function hit(item,terms){
 if(!terms.length)return true;
 const hay=normalize([item.titulo,item.resumo,item.categoria,item.origem].join(" "));
 return terms.every(t=>hay.includes(t));
}
function rank(item,terms){
 const title=normalize(item.titulo),category=normalize(item.categoria),summary=normalize(item.resumo);
 return terms.reduce((n,t)=>n+(title.includes(t)?4:0)+(category.includes(t)?2:0)+(summary.includes(t)?1:0),0);
}
async function read(source){
 const params=new URLSearchParams();
 params.set("select",source.columns);
 params.set("status_publicacao","eq.publicado");
 params.set("order",source.date+".desc");
 params.set("limit","500");
 const response=await fetch(url+"/rest/v1/"+encodeURIComponent(source.table)+"?"+params.toString(),{
  headers:{"apikey":key,"Authorization":"Bearer "+key,"Accept":"application/json"}
 });
 if(!response.ok)throw Error("Falha na consulta: "+source.name);
 const items=await response.json();
 if(!Array.isArray(items))throw Error("Resposta inválida: "+source.name);
 return items.filter(item=>item&&item.id&&item.titulo&&item.status_publicacao==="publicado").map(item=>Object.assign({},item,{_source:source}));
}
function make(tag,className,textValue){
 const el=document.createElement(tag);
 if(className)el.className=className;
 if(textValue!==undefined)el.textContent=String(textValue);
 return el;
}
function card(item){
 const src=item._source;
 const a=make("a","as-result-card");
 a.href=src.path+"?id="+encodeURIComponent(String(item.id))+(src.hash||"");
 a.append(make("span","as-result-category",item.categoria||src.name));
 a.append(make("h4","as-result-title",item.titulo));
 if(item.resumo)a.append(make("p","as-result-summary",item.resumo));
 const foot=make("span","as-result-action","Consultar arquivo →");
 a.append(foot);
 return a;
}
function updateURL(q){
 try{const u=new URL(location.href);if(q)u.searchParams.set("q",q);else u.searchParams.delete("q");history.replaceState(null,"",u.pathname+u.search+u.hash);}catch(e){}
}
function render(){
 const q=$("as-search-input").value.trim().slice(0,120);
 const terms=normalize(q).split(/\s+/).filter(Boolean);
 const result=state.rows.filter(x=>(state.category==="all"||x._source.id===state.category)&&hit(x,terms))
 .sort((a,b)=>sorter(a,b,terms));
 const holder=$("as-search-sections");holder.replaceChildren();
 $("as-results-count").textContent=result.length+" registro"+(result.length===1?"":"s")+" encontrado"+(result.length===1?"":"s");
 const message=$("as-search-message");
 const incomplete=state.errors.length>0;
 if(!result.length){
  message.hidden=false;
  message.textContent=state.errors.length===sources.length
   ?"Não foi possível consultar o acervo agora. Tente novamente mais tarde."
   :incomplete
    ?"Nenhum resultado nas editorias disponíveis. A consulta está incompleta porque algumas editorias não responderam."
    :"Nenhum registro corresponde à pesquisa. Tente outro nome ou escolha outra editoria.";
 }else {
  message.hidden=!incomplete;
  if(incomplete)message.textContent="Pesquisa parcial: algumas editorias não responderam. Os resultados exibidos são apenas das editorias disponíveis.";
 }
 if(incomplete){
  const retry=make("button","as-search-retry","Tentar novamente as editorias indisponíveis");
  retry.type="button";
  retry.addEventListener("click",retryFailedSources);
  message.append(document.createTextNode(" "),retry);
 }
 const relevant=sources.filter(src=>state.category==="all"||src.id===state.category);
 for(const src of relevant){
  const matches=result.filter(item=>item._source.id===src.id);
  if(!matches.length)continue;
  const section=make("section","as-result-section");
  section.setAttribute("aria-label",src.name);
  const header=make("div","as-result-section-header");
  header.append(make("h3","",src.name),make("span","",matches.length+" registro"+(matches.length===1?"":"s")));
  const grid=make("div","as-result-grid");
  matches.slice(0,12).forEach(x=>grid.append(card(x)));
  section.append(header,grid);
  if(matches.length>12){
   const more=make("button","as-result-more","Mostrar mais "+src.name);
   more.type="button";
   let shown=12;
   more.addEventListener("click",()=>{
    const next=matches.slice(shown,shown+12);
    next.forEach(x=>grid.append(card(x)));
    shown+=next.length;
    if(shown>=matches.length)more.remove();
   });
   section.append(more);
  }
  holder.append(section);
 }
}
async function retryFailedSources(){
 const failed=sources.filter(src=>state.errors.includes(src.id));
 if(!failed.length)return;
 const message=$("as-search-message");
 message.hidden=false;
 message.textContent="Tentando consultar as editorias indisponíveis...";
 const results=await Promise.allSettled(failed.map(read));
 const recovered=new Set();
 results.forEach((result,i)=>{
  if(result.status==="fulfilled"){state.rows.push(...result.value);recovered.add(failed[i].id);}
 });
 state.errors=state.errors.filter(id=>!recovered.has(id));
 render();renderSuggestions();
}
function setCategory(value){
 state.category=sources.some(x=>x.id===value)?value:"all";
 document.querySelectorAll("[data-as-search-category]").forEach(button=>{
  const current=button.dataset.asSearchCategory===state.category;
  button.setAttribute("aria-pressed",String(current));
 });
 render();
}
async function init(){
 const params=new URLSearchParams(location.search);
 const initial=(params.get("q")||"").slice(0,120);
 $("as-search-input").value=initial;
 $("as-search-order").addEventListener("change",e=>{state.order=e.target.value;render();});
 $("as-search-save-history").addEventListener("change",e=>{
  if(e.target.checked){if(!storageSet(HISTORY_ENABLED,"yes")){e.target.checked=false;return;}}
  else{storageRemove(HISTORY_ENABLED);storageRemove(HISTORY_KEY);}
  renderHistory();
 });
 $("as-search-clear-history").addEventListener("click",()=>{storageRemove(HISTORY_KEY);renderHistory();});
 renderHistory();
 document.querySelectorAll("[data-as-search-category]").forEach(button=>button.addEventListener("click",()=>setCategory(button.dataset.asSearchCategory)));
 $("as-search-form").addEventListener("submit",ev=>{ev.preventDefault();const term=$("as-search-input").value.trim();updateURL(term);remember(term);render();renderSuggestions();});
 let timer=0;
 $("as-search-input").addEventListener("input",()=>{clearTimeout(timer);timer=setTimeout(()=>{updateURL($("as-search-input").value.trim());render();renderSuggestions();},180);});
 const results=await Promise.allSettled(sources.map(read));
 results.forEach((result,i)=>{if(result.status==="fulfilled")state.rows.push(...result.value);else state.errors.push(sources[i].id);});
 state.loaded=true;
 render();
 renderSuggestions();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
