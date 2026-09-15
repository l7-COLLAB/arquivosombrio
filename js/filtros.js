"use strict";

/* Pesquisa e filtros dos dossiês */
const norm=v=>String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
const lista=v=>Array.isArray(v)?v.map(norm):(v?[norm(v)]:[]);
function dadosFiltro(){try{if(typeof obterTodosCasos==="function"){const d=obterTodosCasos();if(Array.isArray(d))return d;}}catch(e){console.warn(e);}return typeof casosArquivo!=="undefined"&&Array.isArray(casosArquivo)?casosArquivo:[];}
function corresponde(c,f){const titulo=norm(c.titulo),resumo=norm(c.resumo),local=norm(c.local),categoria=norm(c.categoria),tipo=norm(c.tipoArquivo),status=norm(c.statusFiltro||c.status),pais=norm(c.pais),tipos=lista(c.tipos),autor=lista(c.perfilAutor),familia=lista(c.relacaoFamiliar);if(f.busca&&![titulo,resumo,local,categoria,pais,...tipos,...autor,...familia].join(" ").includes(f.busca))return false;if(f.rapido&&f.rapido!=="todos"&&![status,categoria,tipo,...tipos,...autor,...familia].includes(f.rapido))return false;if(f.status&&status!==f.status)return false;if(f.crime&&!tipos.includes(f.crime)&&!familia.includes(f.crime))return false;if(f.autor&&!autor.includes(f.autor))return false;if(f.pais&&pais!==f.pais)return false;return true;}
function render(casos){const grid=document.getElementById("grid-casos");if(!grid)return;if(typeof criarCardCaso==="function"){grid.innerHTML="";if(!casos.length)grid.innerHTML='<div class="archive-no-results"><i class="fa-solid fa-folder-open"></i><strong>Nenhum dossiê encontrado</strong><p>Tente alterar os filtros ou pesquisar outro termo.</p></div>';else casos.forEach(c=>{const card=criarCardCaso(c);typeof card==="string"?grid.insertAdjacentHTML("beforeend",card):card instanceof HTMLElement&&grid.appendChild(card);});}else{const ids=new Set(casos.map(c=>String(c.id)));grid.querySelectorAll("[data-id]").forEach(el=>el.hidden=!ids.has(String(el.dataset.id)));}const n=document.getElementById("contador-casos"),t=document.getElementById("contador-texto");if(n)n.textContent=casos.length;if(t)t.textContent=casos.length===1?"dossiê encontrado":"dossiês encontrados";}
function aplicarFiltros(){if(!document.getElementById("grid-casos"))return;const f={busca:norm(document.getElementById("busca-casos")?.value),rapido:norm(document.querySelector(".filter-chip.active")?.dataset.filtro||"todos"),status:norm(document.getElementById("filtro-status")?.value),crime:norm(document.getElementById("filtro-crime")?.value),autor:norm(document.getElementById("filtro-autor")?.value),pais:norm(document.getElementById("filtro-pais")?.value)};let r=dadosFiltro().filter(c=>corresponde(c,f));const o=document.getElementById("ordenar-casos")?.value||"padrao";if(o==="az")r.sort((a,b)=>String(a.titulo).localeCompare(String(b.titulo),"pt-BR"));if(o==="za")r.sort((a,b)=>String(b.titulo).localeCompare(String(a.titulo),"pt-BR"));if(o==="recentes")r.sort((a,b)=>Number(b.ano||0)-Number(a.ano||0));if(o==="antigos")r.sort((a,b)=>Number(a.ano||0)-Number(b.ano||0));render(r);}
function inicializarFiltrosArquivo(){const busca=document.getElementById("busca-casos");if(!busca)return;busca.addEventListener("input",aplicarFiltros);document.getElementById("limpar-busca")?.addEventListener("click",()=>{busca.value="";aplicarFiltros();busca.focus();});document.querySelectorAll(".filter-chip").forEach(ch=>ch.addEventListener("click",()=>{document.querySelectorAll(".filter-chip").forEach(x=>x.classList.remove("active"));ch.classList.add("active");aplicarFiltros();}));["filtro-status","filtro-crime","filtro-autor","filtro-pais","ordenar-casos"].forEach(id=>document.getElementById(id)?.addEventListener("change",aplicarFiltros));const abrir=document.getElementById("abrir-filtros-avancados"),painel=document.getElementById("filtros-avancados");abrir?.addEventListener("click",()=>{if(painel)painel.hidden=!painel.hidden;});document.getElementById("resetar-filtros")?.addEventListener("click",()=>{busca.value="";["filtro-status","filtro-crime","filtro-autor","filtro-pais"].forEach(id=>{const e=document.getElementById(id);if(e)e.value="";});const ord=document.getElementById("ordenar-casos");if(ord)ord.value="padrao";document.querySelectorAll(".filter-chip").forEach(x=>x.classList.toggle("active",x.dataset.filtro==="todos"));aplicarFiltros();});aplicarFiltros();}

/* =========================================================
   ACESSO ADMINISTRATIVO RESILIENTE
   =========================================================
   O script principal historicamente consulta o Supabase antes de exibir o
   modal. Se essa consulta atrasar, o botão parece não responder. Este fallback
   garante resposta visual imediata e também mantém o acesso funcionando caso
   outra inicialização do script principal falhe antes de inicializarAdmin().
   ========================================================= */
function instalarFallbackAcessoAdmin(){
    const seletores=["#btn-open-admin","#mobile-btn-admin",".sidebar-admin-link"];
    document.querySelectorAll(seletores.join(",")).forEach(botao=>{
        if(botao.dataset.adminFallbackReady==="true")return;
        botao.dataset.adminFallbackReady="true";
        botao.addEventListener("click",evento=>{
            if(botao.matches("#mobile-btn-admin,.sidebar-admin-link"))evento.preventDefault();
            const modal=document.getElementById("modal-admin");
            if(modal)modal.classList.add("active");

            /*
             * A checagem de sessão acontece em paralelo. Não bloqueamos a
             * abertura do modal esperando rede, SDK ou Supabase.
             */
            if(typeof obterSessaoAdmin==="function"){
                Promise.resolve(obterSessaoAdmin())
                    .then(sessao=>{
                        if(sessao&&typeof abrirPainelAdmin==="function"){
                            return abrirPainelAdmin();
                        }
                    })
                    .catch(erro=>console.warn("Falha não bloqueante ao verificar sessão administrativa.",erro));
            }
        },{capture:true});
    });
}

/* =========================================================
   MÓDULOS LITERÁRIOS DA ÁREA ADMINISTRATIVA
   Lendas + Creepypastas
   ========================================================= */
function carregarModulo(src,onload){
    const base=src.split("?")[0];
    const existente=[...document.querySelectorAll(`script[src^="${base}"]`)][0];
    if(existente){
        if(onload){
            if(existente.dataset.loaded==="true") onload();
            else existente.addEventListener("load",onload,{once:true});
        }
        return existente;
    }
    const s=document.createElement("script");
    s.src=src;
    s.async=false;
    s.addEventListener("load",()=>{s.dataset.loaded="true";},{once:true});
    if(onload)s.addEventListener("load",onload,{once:true});
    s.addEventListener("error",()=>console.error(`Falha ao carregar ${base}`),{once:true});
    document.head.appendChild(s);
    return s;
}
function carregarCss(href){const base=href.split("?")[0];if(document.querySelector(`link[href^="${base}"]`))return;const l=document.createElement("link");l.rel="stylesheet";l.href=href;document.head.appendChild(l);}

let administracaoLiterariaIniciada=false;
let observadorAdminLiterario=null;

function garantirAdministracaoLiteraria(){
    if(typeof window.garantirModulosLiterariosAdmin==="function"){
        window.garantirModulosLiterariosAdmin();
    }
}

function carregarAdministracaoLiteraria(){
    if(administracaoLiterariaIniciada){
        garantirAdministracaoLiteraria();
        return;
    }
    administracaoLiterariaIniciada=true;
    const versao="20260915-0924";

    /*
     * O editor real é carregado primeiro. Assim, quando o painel administrativo
     * surgir após o login, os botões LENDAS e CREEPYPASTAS já recebem diretamente
     * as ações de listar, criar, editar, publicar, despublicar e excluir.
     * admin-core-tabs funciona como garantia/fallback caso o painel seja montado
     * depois do carregamento inicial.
     */
    carregarModulo(`js/admin-literario.js?v=${versao}`,()=>{
        carregarModulo(`js/admin-core-tabs.js?v=${versao}`,()=>{
            garantirAdministracaoLiteraria();
        });
    });

    if(!observadorAdminLiterario){
        observadorAdminLiterario=new MutationObserver(()=>{
            instalarFallbackAcessoAdmin();
            if(document.querySelector("#admin-manager .admin-manager")){
                garantirAdministracaoLiteraria();
            }
        });
        observadorAdminLiterario.observe(document.documentElement,{childList:true,subtree:true});
    }
}

function inicializarComplementosArquivo(){
    instalarFallbackAcessoAdmin();
    inicializarFiltrosArquivo();
    carregarAdministracaoLiteraria();
    if(document.body.classList.contains("home-page")){
        carregarCss("css/home-literario.css?v=20260915-4");
        carregarModulo("js/home-lendas-creepypastas.js?v=20260915-4");
    }
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",inicializarComplementosArquivo,{once:true});else inicializarComplementosArquivo();