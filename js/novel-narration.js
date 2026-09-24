"use strict";
(() => {
 const api="https://iuhotznurbyujzbyhizf.supabase.co/functions/v1/novel-narration";
 const key="sb_publishable_bpAZ5EhYLIuVoE4Q97s_-A_XQwwRxUj";
 const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 const cap=new URLSearchParams(location.search).get("capitulo");
 if(!cap)return;
 let audio=null,alignment=[],active=null,chapterId=null,playing=false;
 const fmt=n=>Number.isFinite(n)?Math.floor(n/60)+":"+String(Math.floor(n%60)).padStart(2,"0"):"0:00";
 async function request(action){
  const {data:{session}}=await window.supabase.createClient("https://iuhotznurbyujzbyhizf.supabase.co",key).auth.getSession();
  if(!session?.access_token)throw new Error("LOGIN_REQUIRED");
  const response=await fetch(api,{method:"POST",headers:{"Content-Type":"application/json","apikey":key,"Authorization":"Bearer "+session.access_token},body:JSON.stringify({capitulo_id:chapterId,action})});
  const result=await response.json();if(!response.ok)throw new Error(result.code||result.error||"Áudio indisponível");return result;
 }
 const setActive=element=>{if(active===element)return;active?.classList.remove("novel-audio-reading");active=element;active?.classList.add("novel-audio-reading")};
 function setupAlignment(){
  // Never estimate spoken position. Highlight only when verified timing data exists.
  const paras=[...document.querySelectorAll("#reader-body p")];
  const safe=alignment.filter(x=>Number.isFinite(x.start)&&Number.isFinite(x.end)&&Number.isInteger(x.paragraph)&&x.paragraph>=0&&x.paragraph<paras.length);
  return time=>{const segment=safe.find(x=>time>=x.start&&time<x.end);setActive(segment?paras[segment.paragraph]:null)};
 }
 async function mount(){
  const settings=document.querySelector(".reader-settings"),body=document.querySelector("#reader-body"),immersive=document.querySelector("#reader-immersive");
  if(!settings||!body||!immersive)return false;
  const client=window.supabase.createClient("https://iuhotznurbyujzbyhizf.supabase.co",key);
  const novelSlug=new URLSearchParams(location.search).get("obra");
  const {data:n}=await client.from("novels").select("id").eq("slug",novelSlug).eq("status_publicacao","publicado").maybeSingle();
  if(!n)return true;
  const {data:c}=await client.from("novel_capitulos").select("id").eq("novel_id",n.id).eq("numero",Number(cap)).eq("status_publicacao","publicado").maybeSingle();
  if(!c)return true;chapterId=c.id;
  const {data:{session}}=await client.auth.getSession();
  if(!session)return true;
  let status;try{status=await request("status")}catch{return true}
  if(!status.available)return true;
  const panel=document.createElement("section");panel.className="novel-audio-panel";panel.setAttribute("aria-label","Narração do capítulo");
  panel.innerHTML='<span class="novel-audio-label">NARRAÇÃO DO CAPÍTULO</span><button type="button" class="novel-audio-toggle" aria-label="Reproduzir narração">▶ Ouvir</button><input type="range" min="0" max="1000" value="0" aria-label="Posição do áudio" class="novel-audio-seek"><span class="novel-audio-time">0:00</span>';
  settings.insertAdjacentElement("afterend",panel);
  const mini=document.createElement("button");mini.type="button";mini.className="novel-audio-mini";mini.hidden=true;mini.setAttribute("aria-label","Pausar narração");mini.textContent="Ⅱ";
  document.querySelector(".reader-floating")?.append(mini);
  const toggle=panel.querySelector(".novel-audio-toggle"),seek=panel.querySelector(".novel-audio-seek"),time=panel.querySelector(".novel-audio-time");
  const saveKey="novel-audio-pos-"+chapterId;
  const sync=()=>{const on=audio&&!audio.paused;playing=!!on;toggle.textContent=on?"Ⅱ Pausar":"▶ Ouvir";toggle.setAttribute("aria-label",on?"Pausar narração":"Reproduzir narração");mini.textContent=on?"Ⅱ":"▶";mini.setAttribute("aria-label",on?"Pausar narração":"Retomar narração")};
  let highlight=()=>{};
  async function play(){
   if(!audio){
    toggle.disabled=true;toggle.textContent="Carregando...";
    try{
     const result=await request("url");if(!result.available)throw new Error("Narração indisponível");
     alignment=Array.isArray(result.alignment)?result.alignment:[];highlight=setupAlignment();
     audio=new Audio(result.url);audio.preload="metadata";
     audio.addEventListener("loadedmetadata",()=>{const pos=Number(localStorage.getItem(saveKey)||0);if(pos>0&&pos<audio.duration-5)audio.currentTime=pos});
     audio.addEventListener("timeupdate",()=>{if(audio.duration){seek.value=String(Math.round(audio.currentTime/audio.duration*1000));time.textContent=fmt(audio.currentTime)+" / "+fmt(audio.duration);highlight(audio.currentTime);if(Math.floor(audio.currentTime)%4===0)try{localStorage.setItem(saveKey,String(audio.currentTime))}catch{}}});
     audio.addEventListener("pause",sync);audio.addEventListener("play",sync);
     audio.addEventListener("ended",()=>{try{localStorage.removeItem(saveKey)}catch{}setActive(null);sync()});
     audio.addEventListener("error",()=>{toggle.textContent="Áudio indisponível";setActive(null)});
    }catch(e){toggle.textContent=e.message==="LOGIN_REQUIRED"?"Entre na conta para ouvir":"Áudio indisponível";return}
    finally{toggle.disabled=false}
   }
   try{await audio.play()}catch{toggle.textContent="Não foi possível reproduzir"}
   sync();
  }
  const act=()=>audio&&!audio.paused?audio.pause():play();
  toggle.onclick=act;mini.onclick=act;
  seek.oninput=()=>{if(audio?.duration)audio.currentTime=Number(seek.value)/1000*audio.duration};
  const mode=()=>{const immersive=document.body.classList.contains("reader-immersive");panel.classList.toggle("novel-audio-collapsed",immersive);mini.hidden=!immersive||!audio;};
  immersive.addEventListener("click",()=>requestAnimationFrame(mode));mode();
  document.addEventListener("visibilitychange",()=>{if(document.hidden&&audio)try{localStorage.setItem(saveKey,String(audio.currentTime))}catch{}});
  return true;
 }
 document.addEventListener("DOMContentLoaded",async()=>{for(let i=0;i<40;i++){if(await mount())return;await sleep(250)}});
})();
