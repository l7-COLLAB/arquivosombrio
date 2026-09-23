"use strict";
(() => {
  const FN_URL="https://iuhotznurbyujzbyhizf.supabase.co/functions/v1/public-narration";
  const KEY="sb_publishable_bpAZ5EhYLIuVoE4Q97s_-A_XQwwRxUj";
  const PENDING_KEY="arquivoSombrioPendingAudio";

  function getContext(){
    const id=new URLSearchParams(location.search).get("id");
    if(!id)return null;
    const p=location.pathname.toLowerCase();
    if(p.endsWith("caso.html"))return{type:"dossie",id};
    if(p.endsWith("garimpo.html"))return{type:"garimpo",id};
    if(p.endsWith("pericia.html"))return{type:"pericia",id};
    if(document.body.dataset.archiveType==="lendas")return{type:"lenda",id};
    if(document.body.dataset.archiveType==="creepypastas")return{type:"creepypasta",id};
    return null;
  }

  function contextKey(ctx){return ctx.type+":"+ctx.id}

  async function getClient(){
    if(typeof window.obterClienteSupabase==="function")return await window.obterClienteSupabase();
    throw new Error("A autenticação do Arquivo Sombrio não está disponível nesta página.");
  }

  async function getSession(){
    const c=await getClient();
    const {data,error}=await c.auth.getSession();
    if(error)throw error;
    return data?.session||null;
  }

  async function captchaToken(){
    if(typeof window.obterTokenTurnstile!=="function")return undefined;
    try{return await window.obterTokenTurnstile()}catch(_){return undefined}
  }

  function returnUrl(){
    const u=new URL(location.href);
    u.searchParams.set("ouvir","1");
    u.hash="";
    return u.toString();
  }

  function findTarget(type){
    if(type==="dossie")return document.querySelector(".case-reader-toolbar");
    if(type==="garimpo")return document.querySelector(".daily-reader > header");
    if(type==="pericia")return document.querySelector(".forensic-detail > header");
    if(type==="lenda"||type==="creepypasta")return document.querySelector(".archive-literary-detail .archive-literary-meta")||document.querySelector(".archive-literary-detail .archive-literary-title");
    return null;
  }

  function createAuthGate(ctx,onAuthenticated){
    let overlay=document.querySelector(".narration-auth-overlay");
    if(overlay)return overlay;

    overlay=document.createElement("div");
    overlay.className="narration-auth-overlay";
    overlay.hidden=true;
    overlay.innerHTML=`
      <div class="narration-auth-dialog" role="dialog" aria-modal="true" aria-labelledby="narration-auth-title">
        <button type="button" class="narration-auth-close" aria-label="Fechar"><i class="fa-solid fa-xmark"></i></button>
        <div class="narration-auth-mark"><i class="fa-solid fa-headphones"></i></div>
        <span class="narration-auth-kicker">ÁUDIO DOCUMENTAL</span>
        <h2 id="narration-auth-title">Entre para ouvir este arquivo</h2>
        <p class="narration-auth-intro">A leitura continua aberta para todos. A narração em áudio é um recurso gratuito para contas do Arquivo Sombrio.</p>

        <div class="narration-auth-tabs" role="tablist">
          <button type="button" class="active" data-auth-tab="login">Entrar</button>
          <button type="button" data-auth-tab="signup">Criar conta</button>
        </div>

        <form class="narration-auth-form" data-auth-form="login">
          <label>E-mail<input type="email" autocomplete="email" required data-login-email></label>
          <label>Senha<input type="password" autocomplete="current-password" required data-login-password></label>
          <button type="submit" class="narration-auth-primary">Entrar e ouvir</button>
        </form>

        <form class="narration-auth-form" data-auth-form="signup" hidden>
          <label>Nome ou codinome<input type="text" autocomplete="nickname" required maxlength="60" data-signup-name></label>
          <label>E-mail<input type="email" autocomplete="email" required data-signup-email></label>
          <label>Senha<input type="password" autocomplete="new-password" minlength="6" required data-signup-password></label>
          <label class="narration-auth-check"><input type="checkbox" required data-signup-age><span>Confirmo que tenho 18 anos ou mais.</span></label>
          <label class="narration-auth-check"><input type="checkbox" required data-signup-legal><span>Li e aceito os <a href="termos.html" target="_blank" rel="noopener">Termos</a>, a <a href="privacidade.html" target="_blank" rel="noopener">Privacidade</a> e as <a href="diretrizes.html" target="_blank" rel="noopener">Diretrizes</a>.</span></label>
          <button type="submit" class="narration-auth-primary">Criar conta e ouvir</button>
        </form>

        <p class="narration-auth-state" data-auth-state></p>
      </div>`;
    document.body.appendChild(overlay);

    const state=overlay.querySelector("[data-auth-state]");
    const forms=[...overlay.querySelectorAll("[data-auth-form]")];
    const tabs=[...overlay.querySelectorAll("[data-auth-tab]")];

    function showTab(name){
      tabs.forEach(b=>b.classList.toggle("active",b.dataset.authTab===name));
      forms.forEach(f=>f.hidden=f.dataset.authForm!==name);
      state.textContent="";
    }

    function close(){
      overlay.hidden=true;
      document.body.classList.remove("narration-auth-open");
    }

    function open(tab="login"){
      showTab(tab);
      overlay.hidden=false;
      document.body.classList.add("narration-auth-open");
      requestAnimationFrame(()=>overlay.querySelector('[data-auth-form="'+tab+'"] input')?.focus());
    }

    overlay.querySelector(".narration-auth-close").onclick=close;
    overlay.addEventListener("click",e=>{if(e.target===overlay)close()});
    document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!overlay.hidden)close()});
    tabs.forEach(b=>b.onclick=()=>showTab(b.dataset.authTab));

    overlay.querySelector('[data-auth-form="login"]').addEventListener("submit",async e=>{
      e.preventDefault();
      const form=e.currentTarget;
      const submit=form.querySelector('button[type="submit"]');
      submit.disabled=true;
      state.textContent="Verificando sua conta...";
      try{
        const c=await getClient();
        const token=await captchaToken();
        const args={
          email:form.querySelector("[data-login-email]").value.trim(),
          password:form.querySelector("[data-login-password]").value
        };
        if(token)args.options={captchaToken:token};
        const {data,error}=await c.auth.signInWithPassword(args);
        if(error)throw error;
        if(!data?.session)throw new Error("A sessão não foi iniciada.");
        localStorage.setItem(PENDING_KEY,contextKey(ctx));
        close();
        state.textContent="";
        await onAuthenticated();
      }catch(err){
        state.textContent=err?.message||"Não foi possível entrar na conta.";
      }finally{submit.disabled=false}
    });

    overlay.querySelector('[data-auth-form="signup"]').addEventListener("submit",async e=>{
      e.preventDefault();
      const form=e.currentTarget;
      const submit=form.querySelector('button[type="submit"]');
      submit.disabled=true;
      state.textContent="Criando sua conta...";
      try{
        const c=await getClient();
        const token=await captchaToken();
        const name=form.querySelector("[data-signup-name]").value.trim();
        const email=form.querySelector("[data-signup-email]").value.trim();
        const password=form.querySelector("[data-signup-password]").value;
        if(!form.querySelector("[data-signup-age]").checked||!form.querySelector("[data-signup-legal]").checked){
          throw new Error("Confirme a idade e os documentos legais para continuar.");
        }
        localStorage.setItem(PENDING_KEY,contextKey(ctx));
        const options={
          emailRedirectTo:returnUrl(),
          data:{
            display_name:name,
            age_18_confirmed:true,
            legal_acceptance:true,
            terms_version:"1.1",
            privacy_version:"1.2",
            guidelines_version:"1.0",
            legal_accepted_at:new Date().toISOString()
          }
        };
        if(token)options.captchaToken=token;
        const {data,error}=await c.auth.signUp({email,password,options});
        if(error)throw error;
        if(data?.session){
          close();
          await onAuthenticated();
        }else{
          state.textContent="Conta criada. Confirme o e-mail; o link trará você de volta para este arquivo e a narração será preparada automaticamente.";
        }
      }catch(err){
        state.textContent=err?.message||"Não foi possível criar sua conta.";
      }finally{submit.disabled=false}
    });

    overlay._open=open;
    overlay._close=close;
    return overlay;
  }

  function createPlayer(ctx,target){
    if(document.querySelector(".public-narration-player"))return;
    const box=document.createElement("div");
    box.className="public-narration-player";
    box.innerHTML=`
      <button type="button" class="public-narration-main" aria-label="Ouvir este arquivo">
        <span class="public-narration-icon"><i class="fa-solid fa-headphones"></i></span>
        <span class="public-narration-copy">
          <small>ÁUDIO DOCUMENTAL</small>
          <strong>Ouvir este arquivo</strong>
          <em>Disponível para contas do Arquivo Sombrio</em>
        </span>
        <span class="public-narration-action"><i class="fa-solid fa-play"></i></span>
      </button>
      <div class="public-narration-progress" hidden>
        <div><span data-narration-status>Preparando áudio...</span><span data-narration-count></span></div>
        <div class="public-narration-track"><i data-narration-track></i></div>
      </div>`;
    if(ctx.type==="dossie"&&target.classList?.contains("case-reader-toolbar")) target.appendChild(box); else target.insertAdjacentElement("afterend",box);

    const button=box.querySelector(".public-narration-main");
    const action=box.querySelector(".public-narration-action i");
    const progress=box.querySelector(".public-narration-progress");
    const status=box.querySelector("[data-narration-status]");
    const count=box.querySelector("[data-narration-count]");
    const track=box.querySelector("[data-narration-track]");
    let chunks=null,index=0,audio=null,loading=false;
    let resumeAfterAuth=false;

    function setState(stateName){
      box.dataset.state=stateName;
      action.className=stateName==="playing"?"fa-solid fa-pause":"fa-solid fa-play";
      const strong=box.querySelector(".public-narration-copy strong");
      if(strong)strong.textContent=stateName==="playing"?"Pausar narração":stateName==="paused"?"Continuar ouvindo":"Ouvir este arquivo";
    }

    function bindAudio(){
      if(!chunks?.length)return;
      if(audio){audio.pause();audio.src=""}
      const current=chunkCache.get(index);
      const url=typeof current==="string"?current:null;
      if(!url)return;
      audio=new Audio(url);
      audio.preload="auto";
      audio.addEventListener("play",prefetchNext);
      audio.addEventListener("timeupdate",()=>{
        if(!audio.duration||!Number.isFinite(audio.duration))return;
        track.style.width=Math.min(100,Math.max(0,(audio.currentTime/audio.duration)*100))+"%";
      });
      audio.addEventListener("ended",()=>{
        track.style.width="0%";
        if(index+1<chunks.length){
          index++;
          getChunk(index).then(url=>{
            chunks[index]={index,url};
            playCurrent();
            prefetchNext();
          }).catch(()=>{
            setState("ready");
            status.textContent="Não foi possível carregar o próximo trecho.";
          });
        }else{
          index=0;
          setState("ready");
          status.textContent="Narração concluída";
          count.textContent=chunks.length+" trechos";
        }
      });
      audio.addEventListener("error",()=>{
        setState("ready");
        status.textContent="Não foi possível reproduzir este trecho.";
      });
    }

    function playCurrent(){
      bindAudio();
      status.textContent="Reproduzindo";
      count.textContent="Trecho "+(index+1)+" de "+chunks.length;
      setState("playing");
      audio.play().catch(()=>{
        setState("ready");
        status.textContent="Toque novamente para iniciar o áudio.";
      });
    }

    let totalChunks=0;
    const chunkCache=new Map();
    let prefetching=null;

    async function callNarration(body){
      const session=await getSession();
      if(!session?.access_token){
        const err=new Error("Entre na sua conta para ouvir este arquivo.");
        err.code="LOGIN_REQUIRED";
        throw err;
      }
      const r=await fetch(FN_URL,{
        method:"POST",
        headers:{"Content-Type":"application/json",apikey:KEY,Authorization:"Bearer "+session.access_token},
        body:JSON.stringify({...ctx,...body})
      });
      const data=await r.json().catch(()=>({}));
      if(r.status===401){
        const err=new Error(data.error||"Entre na sua conta para ouvir este arquivo.");
        err.code="LOGIN_REQUIRED";
        throw err;
      }
      if(!r.ok)throw new Error(data.error||"Não foi possível preparar a narração.");
      return data;
    }

    async function getChunk(i){
      if(chunkCache.has(i))return chunkCache.get(i);
      const p=callNarration({action:"chunk",index:i}).then(data=>{
        if(!data?.url)throw new Error("Trecho de áudio indisponível.");
        chunkCache.set(i,data.url);
        return data.url;
      });
      chunkCache.set(i,p);
      const url=await p;
      chunkCache.set(i,url);
      return url;
    }

    function prefetchNext(){
      const next=index+1;
      if(next>=totalChunks||chunkCache.has(next))return;
      prefetching=getChunk(next).catch(()=>null).finally(()=>{prefetching=null});
    }

    async function prepare(){
      loading=true;
      button.disabled=true;
      progress.hidden=false;
      status.textContent="Preparando o primeiro trecho...";
      count.textContent="";
      try{
        const manifest=await callNarration({action:"manifest"});
        totalChunks=Number(manifest.total_chunks||0);
        if(!totalChunks)throw new Error("Nenhum trecho de áudio foi preparado.");
        await getChunk(0);
        chunks=Array.from({length:totalChunks},(_,i)=>({index:i,url:chunkCache.get(i)||null}));
        index=0;
        status.textContent="Áudio pronto";
        count.textContent=totalChunks+" trechos";
        prefetchNext();
      }finally{
        loading=false;
        button.disabled=false;
      }
    }

    async function startAudio(){
      try{
        if(!chunks)await prepare();
        if(audio&&!audio.paused){
          audio.pause();
          setState("paused");
          status.textContent="Narração pausada";
          return;
        }
        if(audio&&audio.paused&&audio.currentTime>0){
          setState("playing");
          status.textContent="Reproduzindo";
          count.textContent="Trecho "+(index+1)+" de "+chunks.length;
          await audio.play();
          return;
        }
        playCurrent();
        localStorage.removeItem(PENDING_KEY);
        const u=new URL(location.href);
        if(u.searchParams.get("ouvir")==="1"){
          u.searchParams.delete("ouvir");
          history.replaceState(null,"",u.toString());
        }
      }catch(e){
        if(e?.code==="LOGIN_REQUIRED"){
          resumeAfterAuth=true;
          localStorage.setItem(PENDING_KEY,contextKey(ctx));
          authGate._open("login");
          return;
        }
        setState("ready");
        progress.hidden=false;
        status.textContent=e?.message||"Não foi possível abrir a narração.";
        count.textContent="";
        console.error(e);
      }
    }

    const authGate=createAuthGate(ctx,async()=>{
      resumeAfterAuth=false;
      await startAudio();
    });

    button.addEventListener("click",async()=>{
      if(loading)return;
      const session=await getSession().catch(()=>null);
      if(!session?.user){
        resumeAfterAuth=true;
        localStorage.setItem(PENDING_KEY,contextKey(ctx));
        authGate._open("login");
        return;
      }
      await startAudio();
    });

    (async()=>{
      const pending=localStorage.getItem(PENDING_KEY)===contextKey(ctx);
      const requested=new URLSearchParams(location.search).get("ouvir")==="1";
      if(!pending&&!requested)return;
      const session=await getSession().catch(()=>null);
      if(session?.user){
        setTimeout(()=>startAudio(),350);
      }
    })();
  }

  function init(){
    const ctx=getContext();
    if(!ctx)return;
    let tries=0;
    const attempt=()=>{
      const target=findTarget(ctx.type);
      if(target){createPlayer(ctx,target);return true}
      return false;
    };
    if(attempt())return;
    const obs=new MutationObserver(()=>{
      if(attempt())obs.disconnect();
    });
    obs.observe(document.documentElement,{childList:true,subtree:true});
    const timer=setInterval(()=>{
      tries++;
      if(attempt()||tries>40){clearInterval(timer);obs.disconnect()}
    },250);
  }

  document.readyState==="loading"?document.addEventListener("DOMContentLoaded",init):init();
})();