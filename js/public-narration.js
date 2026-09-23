"use strict";
(() => {
  const FN_URL="https://iuhotznurbyujzbyhizf.supabase.co/functions/v1/public-narration";
  const KEY="sb_publishable_bpAZ5EhYLIuVoE4Q97s_-A_XQwwRxUj";

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

  function findTarget(type){
    if(type==="dossie")return document.getElementById("caso-resumo");
    if(type==="garimpo")return document.querySelector(".daily-reader > header");
    if(type==="pericia")return document.querySelector(".forensic-detail > header");
    if(type==="lenda"||type==="creepypasta")return document.querySelector(".archive-literary-detail .archive-literary-meta")||document.querySelector(".archive-literary-detail .archive-literary-title");
    return null;
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
          <em>Voz Amazon Polly · Camila</em>
        </span>
        <span class="public-narration-action"><i class="fa-solid fa-play"></i></span>
      </button>
      <div class="public-narration-progress" hidden>
        <div><span data-narration-status>Preparando áudio...</span><span data-narration-count></span></div>
        <div class="public-narration-track"><i data-narration-track></i></div>
      </div>`;
    target.insertAdjacentElement("afterend",box);

    const button=box.querySelector(".public-narration-main");
    const action=box.querySelector(".public-narration-action i");
    const progress=box.querySelector(".public-narration-progress");
    const status=box.querySelector("[data-narration-status]");
    const count=box.querySelector("[data-narration-count]");
    const track=box.querySelector("[data-narration-track]");
    let chunks=null,index=0,audio=null,loading=false;

    function setState(state){
      box.dataset.state=state;
      action.className=state==="playing"?"fa-solid fa-pause":"fa-solid fa-play";
      const strong=box.querySelector(".public-narration-copy strong");
      if(strong)strong.textContent=state==="playing"?"Pausar narração":state==="paused"?"Continuar ouvindo":"Ouvir este arquivo";
    }

    function bindAudio(){
      if(!chunks?.length)return;
      if(audio){audio.pause();audio.src="";}
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
      const r=await fetch(FN_URL,{
        method:"POST",
        headers:{"Content-Type":"application/json",apikey:KEY,Authorization:"Bearer "+KEY},
        body:JSON.stringify({...ctx,...body})
      });
      const data=await r.json().catch(()=>({}));
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
      prefetching=getChunk(next).catch(()=>null).finally(()=>{prefetching=null;});
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

    button.addEventListener("click",async()=>{
      if(loading)return;
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
      }catch(e){
        setState("ready");
        progress.hidden=false;
        status.textContent=e?.message||"Não foi possível abrir a narração.";
        count.textContent="";
        console.error(e);
      }
    });
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