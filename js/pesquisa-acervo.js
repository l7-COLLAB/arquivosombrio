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
const state={loaded:false,rows:[],errors:[],category:"all"};
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
 .sort((a,b)=>rank(b,terms)-rank(a,terms)||Date.parse(b.created_at||0)-Date.parse(a.created_at||0));
 const holder=$("as-search-sections");holder.replaceChildren();
 $("as-results-count").textContent=result.length+" registro"+(result.length===1?"":"s")+" encontrado"+(result.length===1?"":"s");
 const message=$("as-search-message");
 if(!result.length){
  message.hidden=false;
  message.textContent=state.errors.length===sources.length?"Não foi possível consultar o acervo agora. Tente novamente mais tarde.":"Nenhum registro corresponde à pesquisa. Tente outro nome ou escolha outra editoria.";
 }else {
  message.hidden=!state.errors.length;
  if(state.errors.length)message.textContent="Algumas editorias estão temporariamente indisponíveis; os demais resultados continuam acessíveis.";
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
 document.querySelectorAll("[data-as-search-category]").forEach(button=>button.addEventListener("click",()=>setCategory(button.dataset.asSearchCategory)));
 $("as-search-form").addEventListener("submit",ev=>{ev.preventDefault();updateURL($("as-search-input").value.trim());render();});
 let timer=0;
 $("as-search-input").addEventListener("input",()=>{clearTimeout(timer);timer=setTimeout(()=>{updateURL($("as-search-input").value.trim());render();},180);});
 const results=await Promise.allSettled(sources.map(read));
 results.forEach((result,i)=>{if(result.status==="fulfilled")state.rows.push(...result.value);else state.errors.push(sources[i].id);});
 state.loaded=true;
 render();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
