"use strict";

/* Pesquisa e filtros dos dossiês */
const norm=v=>String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
const lista=v=>Array.isArray(v)?v.map(norm):(v?[norm(v)]:[]);
function dadosFiltro(){try{if(typeof obterTodosCasos==="function"){const d=obterTodosCasos();if(Array.isArray(d))return d;}}catch(e){console.warn(e);}return typeof casosArquivo!=="undefined"&&Array.isArray(casosArquivo)?casosArquivo:[];}
function corresponde(c,f){const titulo=norm(c.titulo),resumo=norm(c.resumo),local=norm(c.local),categoria=norm(c.categoria),tipo=norm(c.tipoArquivo),status=norm(c.statusFiltro||c.status),pais=norm(c.pais),tipos=lista(c.tipos),autor=lista(c.perfilAutor),familia=lista(c.relacaoFamiliar);if(f.busca&&![titulo,resumo,local,categoria,pais,...tipos,...autor,...familia].join(" ").includes(f.busca))return false;if(f.rapido&&f.rapido!=="todos"&&![status,categoria,tipo,...tipos,...autor,...familia].includes(f.rapido))return false;if(f.status&&status!==f.status)return false;if(f.crime&&!tipos.includes(f.crime)&&!familia.includes(f.crime))return false;if(f.autor&&!autor.includes(f.autor))return false;if(f.pais&&pais!==f.pais)return false;return true;}
function render(casos){const grid=document.getElementById("grid-casos");if(!grid)return;if(typeof criarCardCaso==="function"){grid.innerHTML="";if(!casos.length)grid.innerHTML='<div class="archive-no-results"><i class="fa-solid fa-folder-open"></i><strong>Nenhum dossiê encontrado</strong><p>Tente alterar os filtros ou pesquisar outro termo.</p></div>';else casos.forEach(c=>{const card=criarCardCaso(c);typeof card==="string"?grid.insertAdjacentHTML("beforeend",card):card instanceof HTMLElement&&grid.appendChild(card);});}else{const ids=new Set(casos.map(c=>String(c.id)));grid.querySelectorAll("[data-id]").forEach(el=>el.hidden=!ids.has(String(el.dataset.id)));}const n=document.getElementById("contador-casos"),t=document.getElementById("contador-texto");if(n)n.textContent=casos.length;if(t)t.textContent=casos.length===1?"dossiê encontrado":"dossiês encontrados";}
function aplicarFiltros(){if(!document.getElementById("grid-casos"))return;const f={busca:norm(document.getElementById("busca-casos")?.value),rapido:norm(document.querySelector(".filter-chip.active")?.dataset.filtro||"todos"),status:norm(document.getElementById("filtro-status")?.value),crime:norm(document.getElementById("filtro-crime")?.value),autor:norm(document.getElementById("filtro-autor")?.value),pais:norm(document.getElementById("filtro-pais")?.value)};let r=dadosFiltro().filter(c=>corresponde(c,f));const o=document.getElementById("ordenar-casos")?.value||"padrao";if(o==="az")r.sort((a,b)=>String(a.titulo).localeCompare(String(b.titulo),"pt-BR"));if(o==="za")r.sort((a,b)=>String(b.titulo).localeCompare(String(a.titulo),"pt-BR"));if(o==="recentes")r.sort((a,b)=>Number(b.ano||0)-Number(a.ano||0));if(o==="antigos")r.sort((a,b)=>Number(a.ano||0)-Number(b.ano||0));render(r);}
function inicializarFiltrosArquivo(){const busca=document.getElementById("busca-casos");if(!busca)return;busca.addEventListener("input",aplicarFiltros);document.getElementById("limpar-busca")?.addEventListener("click",()=>{busca.value="";aplicarFiltros();busca.focus();});document.querySelectorAll(".filter-chip").forEach(ch=>ch.addEventListener("click",()=>{document.querySelectorAll(".filter-chip").forEach(x=>x.classList.remove("active"));ch.classList.add("active");aplicarFiltros();}));["filtro-status","filtro-crime","filtro-autor","filtro-pais","ordenar-casos"].forEach(id=>document.getElementById(id)?.addEventListener("change",aplicarFiltros));const abrir=document.getElementById("abrir-filtros-avancados"),painel=document.getElementById("filtros-avancados");abrir?.addEventListener("click",()=>{if(painel)painel.hidden=!painel.hidden;});document.getElementById("resetar-filtros")?.addEventListener("click",()=>{busca.value="";["filtro-status","filtro-crime","filtro-autor","filtro-pais"].forEach(id=>{const e=document.getElementById(id);if(e)e.value="";});const ord=document.getElementById("ordenar-casos");if(ord)ord.value="padrao";document.querySelectorAll(".filter-chip").forEach(x=>x.classList.toggle("active",x.dataset.filtro==="todos"));aplicarFiltros();});aplicarFiltros();}

function carregarModulo(src,onload){const base=src.split("?")[0];document.querySelectorAll(`script[src^="${base}"]`).forEach(s=>s.remove());const s=document.createElement("script");s.src=src;s.async=true;if(onload)s.addEventListener("load",onload,{once:true});document.head.appendChild(s);}
function carregarCss(href){if(document.querySelector(`link[href^="${href.split("?")[0]}"]`))return;const l=document.createElement("link");l.rel="stylesheet";l.href=href;document.head.appendChild(l);}

/*
 * Central Administrativa: não criar abas provisórias com o mesmo data-admin-tab.
 * Isso bloqueava ensureShell() do admin-literario.js: ele encontrava a aba provisória,
 * entendia que Lendas/Creepypastas já existiam e nunca criava/bindava as abas reais.
 */
function limparAbasLiterariasProvisorias(){
 document.querySelectorAll(".admin-literary-bridge-tab").forEach(el=>el.remove());
}
function carregarAdminLiterario(){
 limparAbasLiterariasProvisorias();
 carregarModulo(`js/admin-literario.js?v=20260915-2330-${Date.now()}`,()=>{
  limparAbasLiterariasProvisorias();
  /* O próprio módulo possui MutationObserver e ensureShell(); ao carregar com a
     Central já aberta ele insere as abas reais, ações e seções imediatamente. */
 });
}

document.addEventListener("DOMContentLoaded",()=>{
 inicializarFiltrosArquivo();
 carregarAdminLiterario();
 if(document.body.classList.contains("home-page")){
  carregarCss("css/home-literario.css?v=20260915-1");
  carregarModulo("js/home-lendas-creepypastas.js?v=20260915-1");
 }
});
