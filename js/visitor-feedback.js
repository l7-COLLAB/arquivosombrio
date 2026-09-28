/* Arquivo Sombrio: links de participação no rodapé, sem botões flutuantes. */
(function(){
"use strict";
function init(){
var existing=document.getElementById("as-reader-support-links");
var footer=document.querySelector("footer.main-footer")||Array.prototype.find.call(document.querySelectorAll("footer"),function(node){return !node.closest(".as-reader-invite")&&!node.closest(".case-main-content")&&!node.closest(".daily-reader")&&!node.closest("#literary-detail");});
if(existing){if(existing.closest(".as-reader-invite")||existing.parentElement!==footer&&footer){footer.appendChild(existing);}else if(!footer&&existing.parentElement!==document.body){document.body.appendChild(existing);}return;}
var box=document.createElement("nav");box.id="as-reader-support-links";box.setAttribute("aria-label","Suporte e acessibilidade");
var css=document.createElement("style");
css.textContent="#as-reader-support-links{box-sizing:border-box;display:flex;justify-content:center;align-items:center;flex-wrap:wrap;gap:9px 17px;width:100%;margin:0 auto;padding:20px 12px;background:#12110f;border-top:1px solid rgba(177,145,92,.25);font:12px/1.5 Arial,sans-serif}#as-reader-support-links a{color:#d8c9ad!important;text-decoration:none!important;border-bottom:1px solid rgba(177,145,92,.48);padding:4px 0}#as-reader-support-links a:hover,#as-reader-support-links a:focus-visible{color:#fff!important;border-color:#e5c99c;outline-offset:3px}@media(max-width:600px){#as-reader-support-links{gap:6px 14px;padding:15px 9px;font-size:12px}}";
document.head.appendChild(css);
function source(){try{var u=new URL(location.href),id=u.searchParams.get("id");u.search="";u.hash="";if(id)u.searchParams.set("id",id);return u.href.slice(0,800)}catch(e){return location.origin+"/"}}
[["Enviar feedback","/contato.html?tipo=feedback&origem="+encodeURIComponent(source())],["Relatar problema","/contato.html?tipo=problem&origem="+encodeURIComponent(source())],["Versão Lite","/lite-preview/index.html"]].forEach(function(item){
var a=document.createElement("a");a.href=item[1];a.textContent=item[0];box.appendChild(a);
});
if(footer){footer.appendChild(box)}else{document.body.appendChild(box)}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();