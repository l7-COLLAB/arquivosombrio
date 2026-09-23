(function(){
"use strict";
if(!window.ARQUIVO_ADMIN_V2_CLONE)return;
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(m){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]})}
function atualizarEstadoDossie(modal,dados){
 var form=modal&&modal.querySelector("#admin-content-form");
 if(!form||!form.querySelector("#admin-title"))return;
 var select=form.querySelector("#admin-publicacao");
 var submit=form.querySelector('button[type="submit"]');
 var acoes=submit&&submit.parentElement;
 if(!select||!submit||!acoes)return;
 var antigo=acoes.querySelector("[data-v2-dossier-preview]");if(antigo)antigo.remove();
 var badge=acoes.querySelector("[data-v2-dossier-state]");
 if(!badge){badge=document.createElement("small");badge.dataset.v2DossierState="";badge.className="v2-dossier-state";submit.before(badge)}
 function sync(){
   var state=select.value;
   badge.textContent=state==="publicado"?"PUBLICADO":state==="agendado"?"AGENDADO":"RASCUNHO";
   badge.dataset.state=state;
   submit.innerHTML='<i class="fa-regular fa-floppy-disk"></i> '+(state==="publicado"?"Salvar / publicar":state==="agendado"?"Salvar como agendado":"Salvar como rascunho");
 }
 select.addEventListener("change",sync);sync();
 if(dados&&dados.id!=null){
   var b=document.createElement("button");b.type="button";b.className="admin-secondary-button";b.dataset.v2DossierPreview="";
   b.innerHTML='<i class="fa-regular fa-eye"></i> Visualizar';
   b.addEventListener("click",function(){
     var slug=(form.querySelector("#admin-slug")?.value||dados.slug||"").trim();
     var alvo=slug?"../caso.html?slug="+encodeURIComponent(slug):"../caso.html?id="+encodeURIComponent(dados.id);
     window.open(alvo,"_blank","noopener");
   });
   submit.before(b);
 }
}
var original=window.abrirFormularioAdmin;
if(typeof original!=="function")return;
window.abrirFormularioAdmin=function(tipo,dados){
 var r=original.apply(this,arguments);
 if(tipo==="caso")setTimeout(function(){atualizarEstadoDossie(document.getElementById("admin-form-modal"),dados)},0);
 return r;
};
})();