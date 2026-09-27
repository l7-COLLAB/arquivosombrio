/* Convite contextual e não intrusivo: cadastro opcional após a leitura. */
(function () {
 "use strict";
 var style=document.createElement("style");
 style.textContent='.as-reader-invite{box-sizing:border-box;max-width:880px;margin:38px auto 28px;padding:26px 23px;background:#171512;border:1px solid #857354;border-radius:7px;color:#e2d5c2;font:normal 15px/1.65 Arial,sans-serif;box-shadow:0 7px 20px rgba(0,0,0,.14)}.as-reader-invite small{color:#c4a375;font-size:11px;letter-spacing:.13em}.as-reader-invite h2{margin:8px 0 9px!important;color:#eadbc0!important;font:600 clamp(23px,4vw,31px)/1.2 Georgia,serif!important}.as-reader-invite p{margin:0 0 17px;color:#d3c6b4;line-height:1.65}.as-reader-invite a{display:inline-block;padding:11px 17px;background:#d2bc94!important;border-radius:3px;color:#211a12!important;text-decoration:none!important;font-weight:700;font-size:13px}.as-reader-invite footer{font-size:12px;color:#afa392;margin-top:12px}.as-reader-invite a:focus-visible{outline:3px solid #fff;outline-offset:3px}';
 document.head.appendChild(style);
 function destination(){
   var p=location.pathname.toLowerCase();
   if(p.indexOf("caso.html")>=0||p.indexOf("/dossies/")>=0)return document.querySelector(".case-main-content");
   if(p.indexOf("garimpo.html")>=0)return document.querySelector("#daily-case-detail:not([hidden]) .daily-reader");
   if(p.indexOf("lendas.html")>=0||p.indexOf("creepypastas.html")>=0)return document.querySelector("#literary-detail:not([hidden])");
   return null;
 }
 function show(){
  var target=destination();if(!target||target.querySelector(".as-reader-invite"))return;
  var e=document.createElement("aside");e.className="as-reader-invite";
  e.setAttribute("aria-label","Seu arquivo pessoal");
  e.innerHTML='<small>MEU ARQUIVO · GRATUITO</small><h2>Continue sua investigação quando quiser.</h2><p>Salve os casos que despertaram seu interesse e mantenha suas leituras e observações organizadas em um só lugar. O cadastro é opcional: você pode continuar lendo sem uma conta.</p><a href="/index.html?cadastro=1#forum-auth-area">Criar meu arquivo gratuito</a><footer>Você não precisa criar uma conta para acessar este conteúdo.</footer>';
  target.appendChild(e);
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",show);else show();
 var timer;new MutationObserver(function(){clearTimeout(timer);timer=setTimeout(show,250)}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:["hidden"]});
})();