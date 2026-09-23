(function(){
"use strict";
if(!window.ARQUIVO_ADMIN_V2_CLONE)return;
function aprimorar(dados){
 var modal=document.getElementById("admin-daily-case-modal"),form=modal&&modal.querySelector("#daily-case-form");
 if(!form)return;
 var select=form.querySelector("#daily-publication-status"),submit=form.querySelector('button[type="submit"]');
 if(!select||!submit)return;
 var badge=form.querySelector("[data-v2-garimpo-state]");
 if(!badge){badge=document.createElement("small");badge.dataset.v2GarimpoState="";badge.className="v2-dossier-state v2-garimpo-state";submit.before(badge)}
 function sync(){var state=select.value;badge.textContent=state==="publicado"?"PUBLICADO":state==="agendado"?"AGENDADO":"RASCUNHO";badge.dataset.state=state;submit.innerHTML='<i class="fa-regular fa-floppy-disk"></i> '+(state==="publicado"?"Salvar / publicar":state==="agendado"?"Salvar como agendado":"Salvar como rascunho")}
 select.addEventListener("change",sync);sync();
 if(dados&&dados.id!=null&&!form.querySelector("[data-v2-garimpo-preview]")){
   var b=document.createElement("button");b.type="button";b.className="admin-secondary-button";b.dataset.v2GarimpoPreview="";
   b.innerHTML='<i class="fa-regular fa-eye"></i> Visualizar';
   b.addEventListener("click",function(){window.open("../garimpo.html?id="+encodeURIComponent(dados.id),"_blank","noopener")});
   submit.before(b);
 }
}
var original=window.abrirFormularioCasoDiario;
if(typeof original!=="function")return;
window.abrirFormularioCasoDiario=function(dados){var r=original.apply(this,arguments);setTimeout(function(){aprimorar(dados)},0);return r};
})();