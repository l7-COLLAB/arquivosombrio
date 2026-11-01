/* Arquivo Sombrio — consent-led public editorial forms.
   Never claim that an e-mail or original was received without server confirmation.
   No manuscript or e-mail stored in localStorage. */
(function(){
"use strict";
const ENDPOINT="https://iuhotznurbyujzbyhizf.supabase.co/functions/v1/editorial-participation";
const KEY="sb_publishable_bpAZ5EhYLIuVoE4Q97s_-A_XQwwRxUj";
function show(id,message,error){
 const el=document.getElementById(id);
 if(el){el.textContent=message;el.classList.toggle("error",Boolean(error));}
}
async function post(payload){
 const res=await fetch(ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json","apikey":KEY},body:JSON.stringify(payload)});
 const data=await res.json().catch(()=>({}));
 if(!res.ok||data.ok!==true)throw Error(data.error||"Não foi possível confirmar o envio.");
 return data;
}
function formPayload(form,kind){
 const inputs=form.elements;
 if(kind==="fiction"){
  const manuscript_excerpt=inputs.namedItem("manuscript_excerpt").value.trim();
  const synopsis=inputs.namedItem("synopsis").value.trim();
  if(manuscript_excerpt.length<500||manuscript_excerpt.length>18000||synopsis.length<80||synopsis.length>2000)
   throw Error("O trecho precisa ter 500 a 18.000 caracteres e a sinopse, 80 a 2.000.");
  return {kind,pen_name:inputs.namedItem("pen_name").value.trim(),
   contact_email:inputs.namedItem("contact_email").value.trim(),
   title:inputs.namedItem("title").value.trim(),genre:inputs.namedItem("genre").value,
   synopsis,manuscript_excerpt,
   rights_declaration:inputs.namedItem("rights_declaration").checked,
   adult_declaration:inputs.namedItem("adult_declaration").checked,
   consent_review:inputs.namedItem("consent_review").checked,
   website:inputs.namedItem("website").value};
 }
 return {kind:"newsletter_subscribe",email:inputs.namedItem("email").value.trim(),
  consent:inputs.namedItem("consent").checked,website:inputs.namedItem("website").value};
}
function bindForm(id,kind,status){
 const form=document.getElementById(id);
 if(!form)return;
 form.addEventListener("submit",async event=>{
  event.preventDefault();
  if(form.dataset.submitting==="yes"||!form.reportValidity())return;
  let payload;
  try{payload=formPayload(form,kind)}catch(e){show(status,e.message,true);return}
  form.dataset.submitting="yes";
  const button=form.querySelector('[type="submit"]');
  button.disabled=true;show(status,"Confirmando o envio com o servidor…",false);
  try{
   const result=await post(payload);
   if(kind==="fiction"){
    show(status,result.duplicate?
      "Este original já estava registrado na fila de avaliação. Não enviamos uma segunda cópia.":
      "Original recebido para avaliação editorial privada. O envio não garante publicação.",false);
   }else{
    show(status,"Solicitação processada. Se a inscrição ainda precisa de confirmação, verifique a mensagem enviada para seu e-mail.",false);
   }
   form.reset();
  }catch(e){
   show(status,(e instanceof TypeError?
      "Não foi possível verificar a resposta. O texto continua no formulário; antes de reenviar, confira se ele já chegou. ":
      "")+(e.message||"Envio indisponível."),true);
  }finally{form.dataset.submitting="no";button.disabled=false}
 });
}
function init(){
 bindForm("fiction-form","fiction","fiction-feedback");
 bindForm("newsletter-form","newsletter_subscribe","newsletter-feedback");
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
else init();
})();
