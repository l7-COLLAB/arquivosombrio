"use strict";

(() => {
const norm=v=>String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
const lista=v=>Array.isArray(v)?v.map(norm):(v?[norm(v)]:[]);

function dadosFiltro(){
    try{
        if(typeof obterTodosCasos==="function"){
            const d=obterTodosCasos();
            if(Array.isArray(d))return d;
        }
    }catch(e){console.warn(e);}
    return typeof casosArquivo!=="undefined"&&Array.isArray(casosArquivo)?casosArquivo:[];
}

function corresponde(c,f){
    const titulo=norm(c.titulo),resumo=norm(c.resumo),local=norm(c.local),categoria=norm(c.categoria),tipo=norm(c.tipoArquivo),status=norm(c.statusFiltro||c.status),pais=norm(c.pais),tipos=lista(c.tipos),autor=lista(c.perfilAutor),familia=lista(c.relacaoFamiliar);
    if(f.busca&&![titulo,resumo,local,categoria,pais,...tipos,...autor,...familia].join(" ").includes(f.busca))return false;
    if(f.rapido&&f.rapido!=="todos"&&![status,categoria,tipo,...tipos,...autor,...familia].includes(f.rapido))return false;
    if(f.status&&status!==f.status)return false;
    if(f.crime&&!tipos.includes(f.crime)&&!familia.includes(f.crime))return false;
    if(f.autor&&!autor.includes(f.autor))return false;
    if(f.pais&&pais!==f.pais)return false;
    return true;
}

function render(casos){
    const grid=document.getElementById("grid-casos");
    if(!grid)return;
    if(typeof criarCardCaso==="function"){
        grid.innerHTML="";
        if(!casos.length){
            grid.innerHTML='<div class="archive-no-results"><i class="fa-solid fa-folder-open"></i><strong>Nenhum dossiê encontrado</strong><p>Tente alterar os filtros ou pesquisar outro termo.</p></div>';
        }else{
            casos.forEach(c=>{
                const card=criarCardCaso(c);
                typeof card==="string"?grid.insertAdjacentHTML("beforeend",card):card instanceof HTMLElement&&grid.appendChild(card);
            });
        }
    }else{
        const ids=new Set(casos.map(c=>String(c.id)));
        grid.querySelectorAll("[data-id]").forEach(el=>el.hidden=!ids.has(String(el.dataset.id)));
    }
    const n=document.getElementById("contador-casos"),t=document.getElementById("contador-texto");
    if(n)n.textContent=casos.length;
    if(t)t.textContent=casos.length===1?"dossiê encontrado":"dossiês encontrados";
}

function aplicarFiltros(){
    if(!document.getElementById("grid-casos"))return;
    const f={
        busca:norm(document.getElementById("busca-casos")?.value),
        rapido:norm(document.querySelector(".filter-chip.active")?.dataset.filtro||"todos"),
        status:norm(document.getElementById("filtro-status")?.value),
        crime:norm(document.getElementById("filtro-crime")?.value),
        autor:norm(document.getElementById("filtro-autor")?.value),
        pais:norm(document.getElementById("filtro-pais")?.value)
    };
    let r=dadosFiltro().filter(c=>corresponde(c,f));
    const o=document.getElementById("ordenar-casos")?.value||"padrao";
    if(o==="az")r.sort((a,b)=>String(a.titulo).localeCompare(String(b.titulo),"pt-BR"));
    if(o==="za")r.sort((a,b)=>String(b.titulo).localeCompare(String(a.titulo),"pt-BR"));
    if(o==="recentes")r.sort((a,b)=>Number(b.ano||0)-Number(a.ano||0));
    if(o==="antigos")r.sort((a,b)=>Number(a.ano||0)-Number(b.ano||0));
    render(r);
}

function inicializarFiltrosArquivo(){
    const busca=document.getElementById("busca-casos");
    if(!busca)return;
    busca.addEventListener("input",aplicarFiltros);
    document.getElementById("limpar-busca")?.addEventListener("click",()=>{busca.value="";aplicarFiltros();busca.focus();});
    document.querySelectorAll(".filter-chip").forEach(ch=>ch.addEventListener("click",()=>{document.querySelectorAll(".filter-chip").forEach(x=>x.classList.remove("active"));ch.classList.add("active");aplicarFiltros();}));
    ["filtro-status","filtro-crime","filtro-autor","filtro-pais","ordenar-casos"].forEach(id=>document.getElementById(id)?.addEventListener("change",aplicarFiltros));
    const abrir=document.getElementById("abrir-filtros-avancados"),painel=document.getElementById("filtros-avancados");
    abrir?.addEventListener("click",()=>{if(painel)painel.hidden=!painel.hidden;});
    document.getElementById("resetar-filtros")?.addEventListener("click",()=>{
        busca.value="";
        ["filtro-status","filtro-crime","filtro-autor","filtro-pais"].forEach(id=>{const e=document.getElementById(id);if(e)e.value="";});
        const ord=document.getElementById("ordenar-casos");
        if(ord)ord.value="padrao";
        document.querySelectorAll(".filter-chip").forEach(x=>x.classList.toggle("active",x.dataset.filtro==="todos"));
        aplicarFiltros();
    });
    aplicarFiltros();
}

function abrirModalAdminImediatamente(){
    const modal=document.getElementById("modal-admin");
    if(!modal)return false;
    modal.classList.add("active");
    modal.removeAttribute("hidden");
    modal.setAttribute("aria-hidden","false");
    modal.style.setProperty("display","flex","important");
    modal.style.setProperty("visibility","visible","important");
    modal.style.setProperty("opacity","1","important");
    modal.style.setProperty("pointer-events","auto","important");
    modal.style.setProperty("z-index","2147483647","important");
    document.body.classList.add("modal-open");
    return true;
}

async function tratarAcessoAdmin(evento){
    const alvo=evento.target?.closest?.("#btn-open-admin,#mobile-btn-admin,.sidebar-admin-link");
    if(!alvo)return;

    evento.preventDefault();
    evento.stopImmediatePropagation();

    try{
        if(typeof obterSessaoAdmin==="function"&&typeof abrirPainelAdmin==="function"){
            const sessao=await obterSessaoAdmin();
            if(sessao){await abrirPainelAdmin();return;}
        }
    }catch(erro){console.warn("Falha não bloqueante ao verificar a sessão administrativa.",erro);}

    abrirModalAdminImediatamente();
}

async function autenticarAdminDireto(formulario){
    const email=document.getElementById("admin-email")?.value?.trim();
    const senha=document.getElementById("admin-pass")?.value||"";
    const mensagem=document.getElementById("admin-login-erro");
    const botao=formulario.querySelector('button[type="submit"]');
    const original=botao?.innerHTML;

    const mostrar=texto=>{
        if(!mensagem)return;
        mensagem.textContent=texto;
        mensagem.classList.add("visible");
    };

    if(!email||!senha){mostrar("Preencha o e-mail e a senha.");return;}

    if(botao){
        botao.disabled=true;
        botao.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Verificando...';
    }
    if(mensagem){mensagem.textContent="";mensagem.classList.remove("visible");}

    try{
        if(typeof obterClienteSupabase!=="function")throw new Error("Cliente do Supabase indisponível.");
        const supabaseClient=await obterClienteSupabase();

        // O login administrativo não deve ficar indefinidamente bloqueado
        // esperando o widget visual do Turnstile. O Supabase continua sendo
        // responsável por validar e criar a sessão; se o projeto exigir
        // CAPTCHA, a resposta real será exibida ao administrador.
        const {data,error}=await Promise.race([
            supabaseClient.auth.signInWithPassword({email,password:senha}),
            new Promise((_,reject)=>setTimeout(()=>reject(new Error("O servidor demorou demais para responder. Tente novamente.")),15000))
        ]);

        if(error)throw error;
        if(!data?.session?.user)throw new Error("Não foi possível iniciar a sessão administrativa.");

        const role=data.session.user.app_metadata?.role;
        if(role!=="admin"){
            await supabaseClient.auth.signOut();
            throw new Error("A conta foi autenticada, mas não possui permissão administrativa.");
        }

        formulario.reset();
        if(mensagem){mensagem.textContent="";mensagem.classList.remove("visible");}
        if(typeof fecharModalAdmin==="function")fecharModalAdmin();
        if(typeof abrirPainelAdmin==="function")await abrirPainelAdmin();
    }catch(erro){
        console.error("Falha no login administrativo.",erro);
        const texto=String(erro?.message||"");
        if(/captcha|turnstile|challenge/i.test(texto)){
            mostrar("A autenticação chegou ao Supabase, mas a proteção CAPTCHA está bloqueando o login. Verifique a configuração do CAPTCHA no Supabase.");
        }else if(/invalid login credentials/i.test(texto)){
            mostrar("E-mail ou senha incorretos para esta conta do Arquivo Sombrio.");
        }else{
            mostrar(texto||"Não foi possível acessar a área administrativa.");
        }
    }finally{
        if(botao){botao.disabled=false;if(original!==undefined)botao.innerHTML=original;}
    }
}

function instalarAcessoAdminIndependente(){
    if(window.__arquivoSombrioAdminClickReady)return;
    window.__arquivoSombrioAdminClickReady=true;

    document.addEventListener("click",tratarAcessoAdmin,true);

    document.addEventListener("submit",evento=>{
        const formulario=evento.target;
        if(formulario?.id!=="form-admin-login")return;
        evento.preventDefault();
        evento.stopImmediatePropagation();
        autenticarAdminDireto(formulario);
    },true);

    document.addEventListener("click",evento=>{
        const fechar=evento.target?.closest?.("#close-modal");
        if(!fechar)return;
        const modal=document.getElementById("modal-admin");
        if(!modal)return;
        evento.preventDefault();
        evento.stopImmediatePropagation();
        modal.classList.remove("active");
        modal.style.removeProperty("display");
        modal.style.removeProperty("visibility");
        modal.style.removeProperty("opacity");
        modal.style.removeProperty("pointer-events");
        document.body.classList.remove("modal-open");
    },true);
}

function carregarModulosLiterariosAdmin(){
    if(window.__arquivoSombrioLiterarioLoaderReady)return;
    window.__arquivoSombrioLiterarioLoaderReady=true;
    const existente=document.querySelector('script[data-admin-literary-core="true"]');
    if(existente)return;
    const script=document.createElement("script");
    script.src=`js/admin-core-tabs.js?v=20260915-3`;
    script.defer=true;
    script.dataset.adminLiteraryCore="true";
    script.addEventListener("error",()=>{console.warn("Não foi possível carregar os módulos de Lendas e Creepypastas da área administrativa.");window.__arquivoSombrioLiterarioLoaderReady=false;},{once:true});
    document.head.appendChild(script);
}

function atualizarServiceWorkerProjeto(){
    if(!("serviceWorker" in navigator))return;
    if(window.__arquivoSombrioSwUpdateReady)return;
    window.__arquivoSombrioSwUpdateReady=true;
    const swUrl=new URL("sw.js",window.location.href);
    navigator.serviceWorker.register(swUrl.href).then(registro=>registro.update()).catch(erro=>{console.warn("Não foi possível atualizar o Service Worker do Arquivo Sombrio.",erro);window.__arquivoSombrioSwUpdateReady=false;});
}

function inicializarComplementosArquivo(){
    instalarAcessoAdminIndependente();
    carregarModulosLiterariosAdmin();
    atualizarServiceWorkerProjeto();
    inicializarFiltrosArquivo();
}

instalarAcessoAdminIndependente();
carregarModulosLiterariosAdmin();
atualizarServiceWorkerProjeto();
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",inicializarComplementosArquivo,{once:true});
else inicializarComplementosArquivo();
})();