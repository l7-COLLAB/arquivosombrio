/* Arquivo Sombrio: atalhos de participação em páginas públicas. */
(function(){
"use strict";
if(document.getElementById("as-feedback-dock"))return;
function init(){
if(document.getElementById("as-feedback-dock"))return;
var css=document.createElement("style");
css.textContent="#as-feedback-dock{position:fixed;bottom:max(15px,env(safe-area-inset-bottom));right:12px;z-index:9900;display:flex;flex-direction:column;gap:7px;max-width:calc(100vw - 24px);font-family:Arial,sans-serif}#as-feedback-dock a{display:flex;align-items:center;justify-content:center;gap:8px;text-decoration:none!important;background:#171a1e;color:#e9dcc4!important;border:1px solid #aa946a;border-radius:5px;padding:10px 12px;font-size:12px;font-weight:600;box-shadow:0 3px 15px #0009;min-height:40px}#as-feedback-dock a:last-child{background:#2a1718;border-color:#a07468}#as-feedback-dock a:focus-visible{outline:3px solid #ead1a0;outline-offset:2px}@media(max-width:600px){#as-feedback-dock{bottom:max(12px,env(safe-area-inset-bottom));right:8px}#as-feedback-dock a{padding:9px 10px;font-size:11px}}";
document.head.appendChild(css);
var dock=document.createElement("nav");dock.id="as-feedback-dock";dock.setAttribute("aria-label","Participação do leitor");
[["feedback","✎","Enviar feedback"],["problem","!","Relatar problema"]].forEach(function(item){
var link=document.createElement("a");link.href="/contato.html?tipo="+item[0]+"&origem="+encodeURIComponent((function(){var u=new URL(location.href),id=u.searchParams.get("id");u.search="";u.hash="";if(id)u.searchParams.set("id",id);return u.href.slice(0,800)})());link.textContent=item[1]+"  "+item[2];dock.appendChild(link);
});
document.body.appendChild(dock);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();