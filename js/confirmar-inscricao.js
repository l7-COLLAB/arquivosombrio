(function(){
"use strict";
const url="https://iuhotznurbyujzbyhizf.supabase.co/functions/v1/editorial-participation";
const key="sb_publishable_bpAZ5EhYLIuVoE4Q97s_-A_XQwwRxUj";
function init(){
 const params=new URLSearchParams(location.hash.replace(/^#/,""));
 const token=params.get("token")||"";
 const result=document.getElementById("result");
 const confirm=document.getElementById("confirm"),cancel=document.getElementById("cancel");
 if(!/^[0-9a-f]{64}$/.test(token)){result.textContent="Link inválido. Solicite outro e-mail na página de participação.";confirm.disabled=true;cancel.disabled=true;return}
 if(params.get("action")==="cancel")confirm.hidden=true;
 async function act(kind){
  confirm.disabled=true;cancel.disabled=true;result.textContent="Verificando solicitação…";
  try{
   const res=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json",apikey:key},body:JSON.stringify({kind,token})});
   const json=await res.json().catch(()=>({}));
   if(!res.ok||json.ok!==true)throw Error(json.error||"Não foi possível confirmar.");
   result.textContent=kind==="newsletter_cancel"?
     "Inscrição cancelada. Você não receberá newsletters futuras.":
     "Inscrição confirmada. Obrigado por autorizar o recebimento de novidades.";
   location.hash="";
  }catch(e){result.textContent=e.message||"Serviço indisponível.";confirm.disabled=false;cancel.disabled=false}
 }
 confirm.addEventListener("click",()=>act("newsletter_confirm"));
 cancel.addEventListener("click",()=>act("newsletter_cancel"));
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
