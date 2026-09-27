/* Arquivo Sombrio — métricas opcionais de leitura, sem identificação pessoal. */
(function () {
"use strict";
if(location.pathname.indexOf("/admin")>=0)return;
var endpoint="https://iuhotznurbyujzbyhizf.supabase.co/functions/v1/reader-analytics";
var key="sb_publishable_bpAZ5EhYLIuVoE4Q97s_-A_XQwwRxUj";
var consentKey="arquivo_analytics_consent_v1",sessionKey="arquivo_analytics_session_v1";
function id(){if(crypto.randomUUID)return crypto.randomUUID();var b=new Uint8Array(16);crypto.getRandomValues(b);b[6]=b[6]&15|64;b[8]=b[8]&63|128;var v=Array.prototype.map.call(b,function(x){return("0"+x.toString(16)).slice(-2)}).join("");return v.slice(0,8)+"-"+v.slice(8,12)+"-"+v.slice(12,16)+"-"+v.slice(16,20)+"-"+v.slice(20);}
function get(store,k){try{return store.getItem(k)}catch(e){return null}}
function set(store,k,v){try{store.setItem(k,v)}catch(e){}}
var choice=get(localStorage,consentKey),sid=choice==="yes"?get(sessionStorage,sessionKey):null;
var pid=id(),active=0,sentSignature="",scroll=0,registered=false,last=Date.now(),sending=false,running=false,pending=false;
function info(){
 var name=location.pathname.split("/").pop()||"index.html",q=new URLSearchParams(location.search);
 var types={"index.html":"inicio","dossies.html":"dossies","garimpo.html":"garimpo","pericia.html":"pericia","lendas.html":"lendas","creepypastas.html":"creepypastas","novels.html":"novels","novel.html":"novels","livros.html":"biblioteca"};
 var nested=location.pathname.indexOf("/dossies/")>=0;var type=nested||name==="caso.html"?"dossies":(types[name]||"outros"),cid=q.get("id")||(nested?name.replace(/\.html$/,""):(name==="novel.html"?(q.get("obra")||"catalogo")+(q.has("capitulo")?":capitulo-"+q.get("capitulo"):""):"catalogo"));
 var title=document.querySelector("#literary-detail h1,#daily-case-detail h1,#grid-forense h1,#novel-reader h1,#novel-detail h1,h1");
 title=(title&&title.textContent||document.title||"Arquivo Sombrio").replace(/\s+/g," ").trim().slice(0,160);
 return {content_type:type,content_id:String(cid).slice(0,120),content_title:title||"Arquivo Sombrio"};
}
/* Somente categorias, guardadas após consentimento e durante a aba aberta. */
var attributionKey="arquivo_analytics_attribution_v1";
function attribution(){
 if(choice!=="yes")return {source:"direct",medium:"unspecified"};
 var saved=get(sessionStorage,attributionKey);
 if(saved){try{var parsed=JSON.parse(saved);if(parsed.source&&parsed.medium)return parsed;}catch(e){}}
 var source="direct",medium="unspecified";
 try{
  var q=new URLSearchParams(location.search),u=(q.get("utm_source")||"").toLowerCase(),m=(q.get("utm_medium")||"").toLowerCase(),ref=(document.referrer||"").toLowerCase();
  if(u==="instagram"||u==="ig"||ref.indexOf("instagram.")>=0)source="instagram";
  else if(u==="google"||ref.indexOf("google.")>=0)source="google";
  else if(u==="facebook"||u==="fb"||ref.indexOf("facebook.")>=0)source="facebook";
  else if(u==="whatsapp"||ref.indexOf("whatsapp.")>=0)source="whatsapp";
  else if(ref&&ref.indexOf(location.hostname)>=0)source="internal";
  else if(ref)source="other";
  if(source==="instagram"&&["reels","stories","carousel","bio","post"].indexOf(m)>=0)medium=m;
 }catch(e){}
 var result={source:source,medium:medium};
 set(sessionStorage,attributionKey,JSON.stringify(result));
 return result;
}
function percent(){var d=document.documentElement,n=d.scrollHeight-innerHeight;return n<=0?100:Math.min(100,Math.max(0,Math.round(scrollY/n*100)))}
function touch(){last=Date.now();scroll=Math.max(scroll,percent());}
["scroll","click","touchstart","keydown"].forEach(function(t){addEventListener(t,touch,{passive:true})});
function measure(finalAttempt){
 if(!running||!sid)return;
 var item=info(),depth=Math.max(scroll,percent());
 var record={page_instance:pid,session_id:sid,content_type:item.content_type,content_id:item.content_id,content_title:item.content_title,active_seconds:Math.min(1800,active),scroll_percent:depth,registered:registered,event_type:"read",traffic_source:attribution().source,traffic_medium:attribution().medium};
 /* Compare time, scroll depth, content and login state; not just elapsed seconds. */
 var signature=[active,depth,record.content_type,record.content_id,record.content_title,registered].join("|");
 if(signature===sentSignature)return;
 var body=JSON.stringify(record);
 if(finalAttempt&&navigator.sendBeacon){
    try{if(navigator.sendBeacon(endpoint,new Blob([body],{type:"text/plain;charset=UTF-8"}))){sentSignature=signature;return;}}catch(e){}
 }
 if(sending){pending=true;return;}
 sending=true;
 try{
   fetch(endpoint,{method:"POST",mode:"cors",keepalive:true,headers:{"Content-Type":"application/json"},body:body})
    .then(function(res){if(res.ok)sentSignature=signature;})
    .catch(function(){})
    .then(function(){sending=false;if(pending){pending=false;measure(false);}});
 }catch(e){sending=false;}
}
function isRegistered(){try{if(window.supabase&&window.supabase.createClient){window.supabase.createClient("https://iuhotznurbyujzbyhizf.supabase.co",key).auth.getSession().then(function(x){registered=!!(x.data&&x.data.session&&x.data.session.user&&!x.data.session.user.is_anonymous)})}}catch(e){}}
function start(){if(running)return;if(!sid){sid=id();set(sessionStorage,sessionKey,sid);}running=true;last=Date.now();isRegistered();setTimeout(isRegistered,3000);setTimeout(measure,5000);setInterval(function(){if(document.visibilityState==="visible"&&Date.now()-last<120000&&active<1800)active++;if(active>0&&active%20===0)measure(false)},1000)}
addEventListener("pagehide",function(){measure(true)});
document.addEventListener("visibilitychange",function(){if(document.hidden)measure(true);else touch()});
function banner(){
 var b=document.createElement("div");b.id="arquivo-analytics-consent";b.style.cssText="position:fixed;z-index:2147483000;bottom:12px;left:12px;right:12px;max-width:540px;margin:auto;padding:15px;background:#171512;color:#e5d9c4;border:1px solid #8b785d;border-radius:8px;box-shadow:0 6px 28px #0009;font:14px/1.5 Arial,sans-serif";
 b.innerHTML='<strong style="display:block;color:#e9d6b6">Privacidade do Arquivo</strong><p style="margin:6px 0">Podemos medir quais arquivos são lidos e o tempo aproximado de leitura sem identificar você? A escolha é opcional. <a href="/privacidade.html" style="color:#e9d6b6">Saiba mais</a>.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" data-opt="yes" style="padding:8px 12px;background:#d6c3a5;color:#171512;border:0;border-radius:4px">Permitir métricas</button><button type="button" data-opt="no" style="padding:8px 12px;background:transparent;color:#e5d9c4;border:1px solid #887b69;border-radius:4px">Recusar</button></div>';
 b.onclick=function(e){var v=e.target.getAttribute("data-opt");if(!v)return;choice=v;set(localStorage,consentKey,v);b.remove();if(v==="yes")start()};
 document.body.appendChild(b);
}
if(choice==="yes")start();else if(choice!=="no"){if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",banner);else banner()}
window.ArquivoMetricas={
 alterarPreferencia:function(){try{localStorage.removeItem(consentKey);sessionStorage.removeItem(sessionKey);sessionStorage.removeItem(attributionKey)}catch(e){}location.reload()},
 registrarInteresse:function(){
   if(choice!=="yes")return;
   var data=info();
   var record={page_instance:id(),session_id:sid,content_type:data.content_type,content_id:data.content_id,content_title:data.content_title,active_seconds:0,scroll_percent:0,registered:registered,event_type:"signup_intent",traffic_source:attribution().source,traffic_medium:attribution().medium};
   try {
     var body=JSON.stringify(record);
     if(navigator.sendBeacon){
       if(navigator.sendBeacon(endpoint,new Blob([body],{type:"text/plain"})))return;
     }
     fetch(endpoint,{method:"POST",mode:"cors",keepalive:true,headers:{"Content-Type":"application/json"},body:body}).catch(function(){});
   }catch(e){}
 }
};
})();