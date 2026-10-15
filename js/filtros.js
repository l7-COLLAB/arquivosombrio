"use strict";

(() => {
const norm=v=>String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
const lista=v=>Array.isArray(v)?v.map(norm):(v?[norm(v)]:[]);

function dadosFiltro(){try{if(typeof obterTodosCasos==="function"){const d=obterTodosCasos();if(Array.isArray(d))return d;}}catch(e){console.warn(e);}return typeof casosArquivo!=="undefined"&&Array.isArray(casosArquivo)?casosArquivo:[];}
function corresponde(c,f){if(f.acompanhamento&&c.acompanhamento_status!==f.acompanhamento)return false;const titulo=norm(c.titulo),resumo=norm(c.resumo),local=norm(c.local),categoria=norm(c.categoria),tipo=norm(c.tipoArquivo),status=norm(c.statusFiltro||c.status),pais=norm(c.pais),tipos=lista(c.tipos),autor=lista(c.perfilAutor),familia=lista(c.relacaoFamiliar);if(f.busca&&![titulo,resumo,local,categoria,pais,...tipos,...autor,...familia].join(" ").includes(f.busca))return false;if(f.rapido&&f.rapido!=="todos"&&![status,categoria,tipo,...tipos,...autor,...familia].includes(f.rapido))return false;if(f.status&&status!==f.status)return false;if(f.crime&&!tipos.includes(f.crime)&&!familia.includes(f.crime))return false;if(f.autor&&!autor.includes(f.autor))return false;if(f.pais&&pais!==f.pais)return false;return true;}
function render(casos){const grid=document.getElementById("grid-casos");if(!grid)return;if(typeof criarCardCaso==="function"){grid.innerHTML="";if(!casos.length){grid.innerHTML='<div class="archive-no-results"><i class="fa-solid fa-folder-open"></i><strong>Nenhum dossiê encontrado</strong><p>Tente alterar os filtros ou pesquisar outro termo.</p></div>';}else{casos.forEach(c=>{const card=criarCardCaso(c);typeof card==="string"?grid.insertAdjacentHTML("beforeend",card):card instanceof HTMLElement&&grid.appendChild(card);});}}else{const ids=new Set(casos.map(c=>String(c.id)));grid.querySelectorAll("[data-id]").forEach(el=>el.hidden=!ids.has(String(el.dataset.id)));}const n=document.getElementById("contador-casos"),t=document.getElementById("contador-texto");if(n)n.textContent=casos.length;if(t)t.textContent=casos.length===1?"dossiê encontrado":"dossiês encontrados";}
function aplicarFiltros(){if(!document.getElementById("grid-casos"))return;const f={acompanhamento:document.getElementById("filtro-acompanhamento")?.value,busca:norm(document.getElementById("busca-casos")?.value),rapido:norm(document.querySelector(".filter-chip.active")?.dataset.filtro||"todos"),status:norm(document.getElementById("filtro-status")?.value),crime:norm(document.getElementById("filtro-crime")?.value),autor:norm(document.getElementById("filtro-autor")?.value),pais:norm(document.getElementById("filtro-pais")?.value)};let r=dadosFiltro().filter(c=>corresponde(c,f));const o=document.getElementById("ordenar-casos")?.value||"padrao";if(o==="az")r.sort((a,b)=>String(a.titulo).localeCompare(String(b.titulo),"pt-BR"));if(o==="za")r.sort((a,b)=>String(b.titulo).localeCompare(String(a.titulo),"pt-BR"));if(o==="recentes")r.sort((a,b)=>Number(b.ano||0)-Number(a.ano||0));if(o==="antigos")r.sort((a,b)=>Number(a.ano||0)-Number(b.ano||0));render(r);}
document.addEventListener("arquivo:casos-carregados",aplicarFiltros);
function inicializarFiltrosArquivo(){const busca=document.getElementById("busca-casos");if(!busca)return;const label=document.createElement("label");label.className="tracking-filter";label.innerHTML='<span>Acompanhamento</span> <select id="filtro-acompanhamento"><option value="">Todos</option><option value="ativo">Em acompanhamento</option><option value="encerrado">Encerrados</option></select>';busca.closest(".archive-search-panel")?.append(label);document.getElementById("filtro-acompanhamento")?.addEventListener("change",aplicarFiltros);busca.addEventListener("input",aplicarFiltros);document.getElementById("limpar-busca")?.addEventListener("click",()=>{busca.value="";aplicarFiltros();busca.focus();});document.querySelectorAll(".filter-chip").forEach(ch=>ch.addEventListener("click",()=>{document.querySelectorAll(".filter-chip").forEach(x=>x.classList.remove("active"));ch.classList.add("active");aplicarFiltros();}));["filtro-status","filtro-crime","filtro-autor","filtro-pais","ordenar-casos"].forEach(id=>document.getElementById(id)?.addEventListener("change",aplicarFiltros));const abrir=document.getElementById("abrir-filtros-avancados"),painel=document.getElementById("filtros-avancados");abrir?.addEventListener("click",()=>{if(painel)painel.hidden=!painel.hidden;});document.getElementById("resetar-filtros")?.addEventListener("click",()=>{busca.value="";["filtro-acompanhamento","filtro-status","filtro-crime","filtro-autor","filtro-pais"].forEach(id=>{const e=document.getElementById(id);if(e)e.value="";});const ord=document.getElementById("ordenar-casos");if(ord)ord.value="padrao";document.querySelectorAll(".filter-chip").forEach(x=>x.classList.toggle("active",x.dataset.filtro==="todos"));aplicarFiltros();});aplicarFiltros();}

async function tokenCaptcha(){if(typeof obterTokenTurnstile!=="function")throw new Error("A proteção anti-bot do site não está disponível.");const token=await obterTokenTurnstile();if(!token)throw new Error("A verificação de segurança não retornou um token válido.");return token;}
function mensagemAuth(erro){
    const t=String(erro?.message||""),code=String(erro?.code||"");
    if(code.startsWith("captcha_") && code!=="captcha_failed_server")return t;
    if(/invalid login credentials/i.test(t))return "E-mail ou senha incorretos.";
    if(code==="email_not_confirmed"||/email not confirmed/i.test(t))return "Confirme seu e-mail antes de entrar. Use Reenviar confirmação se precisar de outro link.";
    if(code==="over_email_send_rate_limit"||code==="over_request_rate_limit"||erro?.status===429)return "O limite de tentativas foi atingido. Aguarde alguns minutos antes de tentar novamente.";
    if(code==="email_address_not_authorized"||/email address not authorized|only send emails to/i.test(t))return "O envio de e-mails do site está restrito. A administração precisa configurar o serviço de e-mail para liberar o cadastro.";
    if(/error sending confirmation|error sending recovery|smtp/i.test(t))return "O serviço de e-mail não conseguiu enviar a mensagem. Tente mais tarde; se continuar, avise a administração do site.";
    if(code==="weak_password"||/password should|password.*least/i.test(t))return "Escolha uma senha mais forte, com pelo menos 8 caracteres, letras e números.";
    if(/captcha|turnstile|challenge/i.test(t))return "O servidor não aceitou a verificação de segurança. Tente novamente para fazer uma nova verificação.";
    if(/failed to fetch|network|load failed|fetch failed/i.test(t))return "Não foi possível conectar ao servidor. Confira sua conexão e tente novamente.";
    return t||"Não foi possível concluir a autenticação. Tente novamente.";
}

// Keep one request per form, including while a late server response is pending.
async function executarAuthNoFormulario(form, botao, mostrar, acao){
    if(form.dataset.authBusy==="true")return;
    form.dataset.authBusy="true";
    const controles=Array.from(form.querySelectorAll('button:not([aria-label="Fechar"])')).map(el=>[el,el.disabled]);
    controles.forEach(([el])=>{el.disabled=true;});
    const original=botao.textContent;
    let timer;
    try{
        botao.textContent="VERIFICANDO...";
        const client=await obterClienteSupabase();
        if(!form.isConnected)return;
        const captchaToken=await tokenCaptcha();
        if(!form.isConnected)return;
        botao.textContent="AGUARDE...";
        timer=setTimeout(()=>mostrar("O servidor está demorando. Aguarde a resposta antes de repetir. Se o cadastro for concluído, confira seu e-mail."),20000);
        await acao(client,captchaToken);
    }catch(erro){mostrar(mensagemAuth(erro));}
    finally{
        clearTimeout(timer);
        delete form.dataset.authBusy;
        controles.forEach(([el,disabled])=>{el.disabled=disabled;});
        botao.textContent=original;
    }
}

async function reenviarConfirmacaoPublica(form, campoEmail, mensagem, botao){
    const email=campoEmail.value.trim().toLowerCase();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){mensagem.textContent="Digite seu e-mail para reenviar a confirmação.";campoEmail.focus();return;}
    const restante=Number(form.dataset.resendAfter||0)-Date.now();
    if(restante>0){mensagem.textContent=`Aguarde ${Math.ceil(restante/1000)} segundos antes de pedir outro link.`;return;}
    await executarAuthNoFormulario(form,botao,t=>{mensagem.textContent=t;},async(client,captchaToken)=>{
        const {error}=await client.auth.resend({type:"signup",email,options:{captchaToken,emailRedirectTo:"https://arquivosombrio.net.br/index.html"}});
        if(error)throw error;
        form.dataset.resendAfter=String(Date.now()+60000);
        mensagem.textContent="Se houver um cadastro aguardando confirmação para este e-mail, enviaremos um novo link. Verifique a caixa de entrada e o spam. Aguarde pelo menos 1 minuto antes de solicitar outro.";
    });
}

function instalarReenvioConfirmacao(form, campoEmail, mensagem){
    const botao=document.createElement("button");
    botao.type="button";
    botao.dataset.resendConfirmation="true";
    botao.textContent="Reenviar confirmação de e-mail";
    botao.style.cssText="display:block;width:100%;margin-top:16px;padding:12px;border:1px solid #8e795e;background:transparent;color:#e6d2b4;font:14px/1.4 Arial,sans-serif;cursor:pointer";
    botao.addEventListener("click",()=>reenviarConfirmacaoPublica(form,campoEmail,mensagem,botao));
    form.appendChild(botao);
}

function fecharLoginSeguro(){document.getElementById("arquivo-login-seguro")?.remove();document.body.classList.remove("modal-open");}
function abrirLoginSeguro(){fecharLoginSeguro();const fundo=document.createElement("div");fundo.id="arquivo-login-seguro";fundo.setAttribute("role","dialog");fundo.setAttribute("aria-modal","true");fundo.style.cssText="position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,.86)";fundo.innerHTML=`<form id="arquivo-form-login-seguro" style="width:min(430px,100%);padding:24px;border:1px solid rgba(177,145,92,.45);background:#0d0b0a;color:#ddd;font-family:monospace"><div style="display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:20px"><strong style="letter-spacing:.12em">ENTRAR NO ARQUIVO</strong><button type="button" id="arquivo-fechar-login" aria-label="Fechar" style="border:0;background:transparent;color:#ddd;font-size:24px;cursor:pointer">×</button></div><label for="arquivo-login-email" style="display:block;margin:12px 0 6px">E-mail</label><input id="arquivo-login-email" type="email" inputmode="email" autocomplete="email" required style="box-sizing:border-box;width:100%;padding:12px;background:#171412;border:1px solid #55483a;color:#fff"><label for="arquivo-login-senha" style="display:block;margin:12px 0 6px">Senha</label><input id="arquivo-login-senha" type="password" autocomplete="current-password" required style="box-sizing:border-box;width:100%;padding:12px;background:#171412;border:1px solid #55483a;color:#fff"><div id="arquivo-login-mensagem" aria-live="polite" style="min-height:20px;margin:12px 0;color:#d8b9a1;font-size:12px"></div><button type="submit" style="width:100%;padding:13px;border:1px solid #8a2525;background:#651516;color:#fff;letter-spacing:.1em;cursor:pointer">ENTRAR</button><button type="button" id="arquivo-recuperar-senha" style="display:block;margin:14px auto 0;border:0;background:transparent;color:#d8b9a1;font-size:12px;text-decoration:underline;cursor:pointer">Esqueci minha senha</button></form>`;document.body.appendChild(fundo);document.body.classList.add("modal-open");document.getElementById("arquivo-fechar-login")?.addEventListener("click",fecharLoginSeguro);fundo.addEventListener("click",e=>{if(e.target===fundo)fecharLoginSeguro();});document.getElementById("arquivo-form-login-seguro")?.addEventListener("submit",entrarUsuarioSeguro);instalarReenvioConfirmacao(document.getElementById("arquivo-form-login-seguro"),document.getElementById("arquivo-login-email"),document.getElementById("arquivo-login-mensagem"));document.getElementById("arquivo-recuperar-senha")?.addEventListener("click",solicitarRecuperacaoSenhaPublica);document.getElementById("arquivo-login-email")?.focus();}
async function entrarUsuarioSeguro(evento){
    evento.preventDefault();
    const form=evento.currentTarget,email=form.querySelector("#arquivo-login-email").value.trim().toLowerCase(),senha=form.querySelector("#arquivo-login-senha").value,msg=form.querySelector("#arquivo-login-mensagem"),botao=form.querySelector('button[type="submit"]');
    if(!email||!senha){msg.textContent="Preencha o e-mail e a senha.";return;}
    await executarAuthNoFormulario(form,botao,t=>{msg.textContent=t;},async(client,captchaToken)=>{
        const {data,error}=await client.auth.signInWithPassword({email,password:senha,options:{captchaToken}});
        if(error)throw error;
        if(!data?.session?.user)throw new Error("Não foi possível iniciar a sessão.");
        fecharLoginSeguro();
        if(typeof atualizarInterfaceForum==="function")atualizarInterfaceForum(data.session);
        window.dispatchEvent(new CustomEvent("arquivo-auth-login",{detail:{user:data.session.user}}));
        window.location.assign("meu-arquivo.html");
    });
}
async function solicitarRecuperacaoSenhaPublica(){
    const form=document.getElementById("arquivo-form-login-seguro"),campo=form.querySelector("#arquivo-login-email"),email=campo.value.trim().toLowerCase(),msg=form.querySelector("#arquivo-login-mensagem"),botao=form.querySelector("#arquivo-recuperar-senha");
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){msg.textContent="Digite seu e-mail para receber o link de redefinição.";campo.focus();return;}
    await executarAuthNoFormulario(form,botao,t=>{msg.textContent=t;},async(client,captchaToken)=>{
        const redirectTo=new URL("redefinir-senha.html",window.location.href).href;
        const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo,captchaToken});
        if(error)throw error;
        msg.textContent="Se este e-mail estiver cadastrado, você receberá um link seguro. Verifique também a pasta de spam.";
    });
}

function instalarLoginSeguro(){if(window.__arquivoSombrioLoginSeguroReady)return;window.__arquivoSombrioLoginSeguroReady=true;document.addEventListener("click",evento=>{const alvo=evento.target?.closest?.("#forum-btn-login,#forum-inline-login");if(!alvo)return;evento.preventDefault();evento.stopImmediatePropagation();abrirLoginSeguro();},true);}

function abrirModalAdminImediatamente(){const modal=document.getElementById("modal-admin");if(!modal)return false;modal.classList.add("active");modal.removeAttribute("hidden");modal.setAttribute("aria-hidden","false");modal.style.setProperty("display","flex","important");modal.style.setProperty("visibility","visible","important");modal.style.setProperty("opacity","1","important");modal.style.setProperty("pointer-events","auto","important");modal.style.setProperty("z-index","2147483647","important");document.body.classList.add("modal-open");return true;}
async function tratarAcessoAdmin(evento){const alvo=evento.target?.closest?.("#btn-open-admin,#mobile-btn-admin,.sidebar-admin-link");if(!alvo)return;evento.preventDefault();evento.stopImmediatePropagation();abrirModalAdminImediatamente();try{if(typeof obterSessaoAdmin==="function"&&typeof abrirPainelAdmin==="function"){const sessao=await obterSessaoAdmin();if(sessao){await abrirPainelAdmin(sessao);}}}catch(erro){console.warn("Falha não bloqueante ao verificar a sessão administrativa.",erro);}}
async function autenticarAdminDireto(formulario){const email=document.getElementById("admin-email")?.value?.trim().toLowerCase(),senha=document.getElementById("admin-pass")?.value||"",mensagem=document.getElementById("admin-login-erro"),botao=formulario.querySelector('button[type="submit"]'),original=botao?.innerHTML;const mostrar=texto=>{if(!mensagem)return;mensagem.textContent=texto;mensagem.classList.add("visible");};if(!email||!senha){mostrar("Preencha o e-mail e a senha.");return;}if(botao){botao.disabled=true;botao.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Verificando...';}if(mensagem){mensagem.textContent="";mensagem.classList.remove("visible");}try{if(typeof obterClienteSupabase!=="function")throw new Error("Cliente do Supabase indisponível.");const supabaseClient=await obterClienteSupabase();const captchaToken=await tokenCaptcha();const {data,error}=await Promise.race([supabaseClient.auth.signInWithPassword({email,password:senha,options:{captchaToken}}),new Promise((_,reject)=>setTimeout(()=>reject(new Error("O servidor demorou demais para responder. Tente novamente.")),20000))]);if(error)throw error;if(!data?.session?.user)throw new Error("Não foi possível iniciar a sessão administrativa.");const role=data.session.user.app_metadata?.role;if(role!=="admin"){await supabaseClient.auth.signOut();throw new Error("A conta foi autenticada, mas não possui permissão administrativa.");}formulario.reset();if(mensagem){mensagem.textContent="";mensagem.classList.remove("visible");}if(typeof fecharModalAdmin==="function")fecharModalAdmin();if(typeof abrirPainelAdmin==="function")await abrirPainelAdmin(data.session);}catch(erro){console.error("Falha no login administrativo.",erro);mostrar(mensagemAuth(erro));}finally{if(botao){botao.disabled=false;if(original!==undefined)botao.innerHTML=original;}}}

function fecharCadastroSeguro(){document.getElementById("arquivo-cadastro-seguro")?.remove();document.body.classList.remove("modal-open");}
function abrirCadastroSeguro(){fecharCadastroSeguro();const fundo=document.createElement("div");fundo.id="arquivo-cadastro-seguro";fundo.setAttribute("role","dialog");fundo.setAttribute("aria-modal","true");fundo.style.cssText="position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,.86)";fundo.innerHTML=`<form id="arquivo-form-cadastro-seguro" style="width:min(430px,100%);max-height:90vh;overflow:auto;padding:24px;border:1px solid rgba(177,145,92,.45);background:#0d0b0a;color:#ddd;font-family:monospace"><div style="display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:20px"><strong style="letter-spacing:.12em">CRIAR CONTA</strong><button type="button" id="arquivo-fechar-cadastro" aria-label="Fechar" style="border:0;background:transparent;color:#ddd;font-size:24px;cursor:pointer">×</button></div><label for="arquivo-cadastro-nome" style="display:block;margin:12px 0 6px">Nome</label><input id="arquivo-cadastro-nome" name="name" type="text" autocomplete="name" required maxlength="80" style="box-sizing:border-box;width:100%;padding:12px;background:#171412;border:1px solid #55483a;color:#fff"><label for="arquivo-cadastro-email" style="display:block;margin:12px 0 6px">E-mail</label><input id="arquivo-cadastro-email" name="email" type="email" inputmode="email" autocomplete="email" required style="box-sizing:border-box;width:100%;padding:12px;background:#171412;border:1px solid #55483a;color:#fff"><label for="arquivo-cadastro-senha" style="display:block;margin:12px 0 6px">Senha</label><input id="arquivo-cadastro-senha" placeholder="Pelo menos 8 caracteres" type="password" autocomplete="new-password" required minlength="8" style="box-sizing:border-box;width:100%;padding:12px;background:#171412;border:1px solid #55483a;color:#fff"><label for="arquivo-cadastro-confirmar" style="display:block;margin:12px 0 6px">Confirmar senha</label><input id="arquivo-cadastro-confirmar" type="password" autocomplete="new-password" required minlength="8" style="box-sizing:border-box;width:100%;padding:12px;background:#171412;border:1px solid #55483a;color:#fff"><label style="display:flex;gap:9px;align-items:flex-start;margin:16px 0;font-size:12px;line-height:1.5"><input id="arquivo-cadastro-politicas" type="checkbox" required><span>Declaro ter 18 anos ou mais e aceito os <a href="/termos.html" target="_blank" rel="noopener" style="color:#e6d2b4">Termos de Uso</a>, a <a href="/privacidade.html" target="_blank" rel="noopener" style="color:#e6d2b4">Política de Privacidade</a> e as <a href="/diretrizes.html" target="_blank" rel="noopener" style="color:#e6d2b4">Diretrizes da Comunidade</a>.</span></label><div id="arquivo-cadastro-mensagem" aria-live="polite" style="min-height:20px;margin:10px 0;color:#d8b9a1;font-size:12px"></div><button type="submit" style="width:100%;padding:13px;border:1px solid #8a2525;background:#651516;color:#fff;letter-spacing:.1em;cursor:pointer">CRIAR CONTA</button></form>`;document.body.appendChild(fundo);document.body.classList.add("modal-open");document.getElementById("arquivo-fechar-cadastro")?.addEventListener("click",fecharCadastroSeguro);fundo.addEventListener("click",e=>{if(e.target===fundo)fecharCadastroSeguro();});document.getElementById("arquivo-form-cadastro-seguro")?.addEventListener("submit",cadastrarUsuarioSeguro);instalarReenvioConfirmacao(document.getElementById("arquivo-form-cadastro-seguro"),document.getElementById("arquivo-cadastro-email"),document.getElementById("arquivo-cadastro-mensagem"));document.getElementById("arquivo-cadastro-nome")?.focus();}
async function cadastrarUsuarioSeguro(evento){
    evento.preventDefault();
    const form=evento.currentTarget;
    if(form.dataset.authBusy==="true"||form.dataset.signupComplete==="true")return;
    const nome=form.querySelector("#arquivo-cadastro-nome").value.trim(),email=form.querySelector("#arquivo-cadastro-email").value.trim().toLowerCase(),senha=form.querySelector("#arquivo-cadastro-senha").value,confirmar=form.querySelector("#arquivo-cadastro-confirmar").value;
    const mensagem=form.querySelector("#arquivo-cadastro-mensagem"),botao=form.querySelector('button[type="submit"]');
    const mostrar=texto=>{mensagem.textContent=texto;};
    if(!nome||!email||!senha||!confirmar){mostrar("Preencha todos os campos.");return;}
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){mostrar("Digite um endereço de e-mail válido.");return;}
    if(senha.length<8){mostrar("A senha deve ter pelo menos 8 caracteres.");return;}
    if(senha!==confirmar){mostrar("As senhas não coincidem.");return;}
    if(!form.querySelector("#arquivo-cadastro-politicas").checked){mostrar("Confirme a idade e a aceitação dos termos e políticas para criar a conta.");return;}
    mostrar("Conclua a verificação de segurança para criar a conta.");
    await executarAuthNoFormulario(form,botao,mostrar,async(client,captchaToken)=>{
        const {data,error}=await client.auth.signUp({email,password:senha,options:{captchaToken,emailRedirectTo:"https://arquivosombrio.net.br/index.html",data:{display_name:nome,nome,age_18_confirmed:true,legal_acceptance:true,terms_version:"1.1",privacy_version:"1.2",guidelines_version:"1.0",legal_accepted_at:new Date().toISOString()}}});
        if(error)throw error;
        if(!data?.user)throw new Error("O servidor não confirmou o cadastro. Confira seu e-mail antes de tentar novamente.");
        if(data.session){
            mostrar("Conta criada. Você já está conectado.");
            if(typeof atualizarInterfaceForum==="function")atualizarInterfaceForum(data.session);
        }else{
            // Auth can intentionally mask an already registered address.
            mostrar("Solicitação recebida. Se o e-mail ainda precisar de confirmação, confira sua caixa de entrada e o spam. Se você já possui uma conta confirmada, use Entrar. Caso o link não chegue, use Reenviar confirmação abaixo.");
        }
        form.dataset.signupComplete="true";
        form.dataset.resendAfter=String(Date.now()+60000);
        form.querySelector("#arquivo-cadastro-senha").value="";
        form.querySelector("#arquivo-cadastro-confirmar").value="";
        form.querySelector("#arquivo-cadastro-email").readOnly=true;
        // Leave the confirmation message and resend action visible.
        form.querySelectorAll('input:not([type="email"]),button[type="submit"]').forEach(el=>el.hidden=true);
        form.querySelectorAll('label').forEach(el=>el.hidden=true);
        const entrar=document.createElement("button");
        entrar.type="button";
        entrar.textContent="Ir para Entrar";
        entrar.style.cssText="width:100%;margin-top:12px;padding:12px;background:#651516;color:#fff;border:1px solid #8a2525;cursor:pointer";
        entrar.addEventListener("click",()=>{fecharCadastroSeguro();abrirLoginSeguro();document.getElementById("arquivo-login-email").value=email;});
        form.appendChild(entrar);
    });
    if(form.dataset.signupComplete==="true")botao.disabled=true;
}

function instalarCadastroSeguro(){if(window.__arquivoSombrioCadastroSeguroReady)return;window.__arquivoSombrioCadastroSeguroReady=true;document.addEventListener("click",evento=>{const alvo=evento.target?.closest?.("#forum-btn-signup,#forum-inline-signup");if(!alvo)return;evento.preventDefault();evento.stopImmediatePropagation();abrirCadastroSeguro();},true);}
function instalarAcessoAdminIndependente(){if(window.__arquivoSombrioAdminClickReady)return;window.__arquivoSombrioAdminClickReady=true;document.addEventListener("click",tratarAcessoAdmin,true);}
function carregarModulosLiterariosAdmin(){if(window.__arquivoSombrioLiterarioLoaderReady)return;window.__arquivoSombrioLiterarioLoaderReady=true;const existente=document.querySelector('script[data-admin-literary-core="true"]');if(existente)return;const script=document.createElement("script");script.src=`js/admin-core-tabs.js?v=20260915-3`;script.defer=true;script.dataset.adminLiteraryCore="true";script.addEventListener("error",()=>{console.warn("Não foi possível carregar os módulos de Lendas e Creepypastas da área administrativa.");window.__arquivoSombrioLiterarioLoaderReady=false;},{once:true});document.head.appendChild(script);}
function atualizarServiceWorkerProjeto(){if(!("serviceWorker" in navigator))return;if(window.__arquivoSombrioSwUpdateReady)return;window.__arquivoSombrioSwUpdateReady=true;const swUrl=new URL("sw.js",window.location.href);navigator.serviceWorker.register(swUrl.href).then(registro=>registro.update()).catch(erro=>{console.warn("Não foi possível atualizar o Service Worker do Arquivo Sombrio.",erro);window.__arquivoSombrioSwUpdateReady=false;});}
function inicializarComplementosArquivo(){instalarCadastroSeguro();instalarLoginSeguro();instalarAcessoAdminIndependente();carregarModulosLiterariosAdmin();atualizarServiceWorkerProjeto();inicializarFiltrosArquivo();if(new URLSearchParams(window.location.search).get("login")==="1"){abrirLoginSeguro();const url=new URL(window.location.href);url.searchParams.delete("login");window.history.replaceState({},document.title,url.pathname+url.search+url.hash);}}
instalarCadastroSeguro();instalarLoginSeguro();instalarAcessoAdminIndependente();carregarModulosLiterariosAdmin();atualizarServiceWorkerProjeto();if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",inicializarComplementosArquivo,{once:true});else inicializarComplementosArquivo();
})();

/* Biblioteca: controle compacto para abrir e fechar a sinopse. */
document.addEventListener("DOMContentLoaded", () => {
    const gridLivros = document.getElementById("grid-livros");
    if (!gridLivros) return;

    const prepararSinopses = () => {
        gridLivros.querySelectorAll(".book-card").forEach(card => {
            if (card.dataset.sinopsePronta === "true") return;
            const sinopse = card.querySelector(".book-description");
            if (!sinopse) return;

            const botao = document.createElement("button");
            botao.type = "button";
            botao.className = "book-synopsis-toggle";
            botao.setAttribute("aria-expanded", "false");
            botao.innerHTML = '<span>ver mais</span><i class="fa-solid fa-chevron-down" aria-hidden="true"></i>';
            sinopse.before(botao);
            card.dataset.sinopsePronta = "true";

            botao.addEventListener("click", () => {
                const aberta = card.classList.toggle("synopsis-open");
                botao.setAttribute("aria-expanded", String(aberta));
                botao.querySelector("span").textContent = aberta ? "ver menos" : "ver mais";
            });
        });
    };

    prepararSinopses();
    new MutationObserver(prepararSinopses).observe(gridLivros, {
        childList: true,
        subtree: true
    });
});
