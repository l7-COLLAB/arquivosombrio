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
var choice=get(localStorage,consentKey),sid=get(sessionStorage,sessionKey);
if(!sid){sid=id();set(sessionStorage,sessionKey,sid)}
var pid=id(),active=0,sent=-1,scroll=0,registered=false,last=Date.now(),sending=false,running=false;
function info(){
 var name=location.pathname.split("/").pop()||"index.html",q=new URLSearchParams(location.search);
 var types={"index.html":"inicio","dossies.html":"dossies","garimpo.html":"garimpo","pericia.html":"pericia","lendas.html":"lendas","creepypastas.html":"creepypastas","novels.html":"novels","novel.html":"novels","livros.html":"biblioteca"};
 var nested=location.pathname.indexOf("/dossies/")>=0;var type=nested||name==="caso.html"?"dossies":(types[name]||"outros"),cid=q.get("id")||(nested?name.replace(/\.html$/,""):(name==="novel.html"?(q.get("obra")||"catalogo")+(q.has("capitulo")?":capitulo-"+q.get("capitulo"):""):"catalogo"));
 var title=document.querySelector("#literary-detail h1,#daily-case-detail h1,#grid-forense h1,#novel-reader h1,#novel-detail h1,h1");
 title=(title&&title.textContent||document.title||"Arquivo Sombrio").replace(/\s+/g," ").trim().slice(0,160);
 return {content_type:type,content_id:String(cid).slice(0,120),content_title:title||"Arquivo Sombrio"};
}
function percent(){var d=document.documentElement,n=d.scrollHeight-innerHeight;return n<=0?100:Math.min(100,Math.max(0,Math.round(scrollY/n*100)))}
function touch(){last=Date.now();scroll=Math.max(scroll,percent())}
["scroll","click","touchstart","keydown"].forEach(function(t){addEventListener(t,touch,{passive:true})});
function measure(){
 if(!running||sending||sent===active)return;
 var c=info(),record={page_instance:pid,session_id:sid,content_type:c.content_type,content_id:c.content_id,content_title:c.content_title,active_seconds:Math.min(1800,active),scroll_percent:Math.max(scroll,percent()),registered:registered};
 sending=true;
 try{fetch(endpoint,{method:"POST",mode:"cors",keepalive:true,headers:{"Content-Type":"application/json"},body:JSON.stringify(record)}).then(function(r){if(r.ok)sent=active}).catch(function(){}).then(function(){sending=false})}catch(e){sending=false}
}
function isRegistered(){try{if(window.supabase&&window.supabase.createClient){window.supabase.createClient("https://iuhotznurbyujzbyhizf.supabase.co",key).auth.getSession().then(function(x){registered=!!(x.data&&x.data.session&&x.data.session.user&&!x.data.session.user.is_anonymous)})}}catch(e){}}
function start(){if(running)return;running=true;last=Date.now();isRegistered();setTimeout(measure,5000);setInterval(function(){if(document.visibilityState==="visible"&&Date.now()-last<120000&&active<1800)active++;if(active>0&&active%20===0)measure()},1000)}
addEventListener("pagehide",measure);
document.addEventListener("visibilitychange",function(){if(document.hidden)measure();else touch()});
function banner(){
 var b=document.createElement("div");b.id="arquivo-analytics-consent";b.style.cssText="position:fixed;z-index:2147483000;bottom:12px;left:12px;right:12px;max-width:540px;margin:auto;padding:15px;background:#171512;color:#e5d9c4;border:1px solid #8b785d;border-radius:8px;box-shadow:0 6px 28px #0009;font:14px/1.5 Arial,sans-serif";
 b.innerHTML='<strong style="display:block;color:#e9d6b6">Privacidade do Arquivo</strong><p style="margin:6px 0">Podemos medir quais arquivos são lidos e o tempo aproximado de leitura sem identificar você? A escolha é opcional. <a href="/privacidade.html" style="color:#e9d6b6">Saiba mais</a>.</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" data-opt="yes" style="padding:8px 12px;background:#d6c3a5;color:#171512;border:0;border-radius:4px">Permitir métricas</button><button type="button" data-opt="no" style="padding:8px 12px;background:transparent;color:#e5d9c4;border:1px solid #887b69;border-radius:4px">Recusar</button></div>';
 b.onclick=function(e){var v=e.target.getAttribute("data-opt");if(!v)return;choice=v;set(localStorage,consentKey,v);b.remove();if(v==="yes")start()};
 document.body.appendChild(b);
}
if(choice==="yes")start();else if(choice!=="no"){if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",banner);else banner()}
window.ArquivoMetricas={alterarPreferencia:function(){try{localStorage.removeItem(consentKey)}catch(e){}location.reload()}};
})();