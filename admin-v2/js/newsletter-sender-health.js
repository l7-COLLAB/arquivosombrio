"use strict";
/* Diagnóstico exclusivamente administrativo: não lê e-mails de assinantes,
   não aceita credenciais em formulários e não envia mensagens. */
(function(){
 const url="https://iuhotznurbyujzbyhizf.supabase.co";
 const publicKey="sb_publishable_bpAZ5EhYLIuVoE4Q97s_-A_XQwwRxUj";
 const sb=window.supabase.createClient(url,publicKey,{
  auth:{storageKey:"arquivo-sombrio-admin-auth-v2",persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}
 });
 const $=id=>document.getElementById(id);
 const statuses={
  nao_configurado:"A Resend ainda não tem domínio e credenciais disponíveis para verificação.",
  sem_permissao:"A chave atual não autoriza consultar os domínios. Isso não comprova falha de envio; confirme a verificação manualmente na Resend.",
  indisponivel:"A Resend não respondeu à consulta. Tente novamente ou verifique diretamente no provedor.",
  dominio_nao_encontrado:"O domínio remetente não consta entre os domínios da conta Resend consultada.",
  nao_determinado:"Há outros domínios não listados nesta consulta; confira diretamente no painel Resend.",
  pendente:"O domínio está listado, mas a verificação de envio ainda não está concluída.",
  verificado:"O domínio está verificado com a capacidade de envio habilitada."
 };
 const append=(list,text)=>{
  const item=document.createElement("li");
  item.textContent=text;list.appendChild(item);
 };
 let busy=false;
 async function check(){
  const button=$("check-sender"),state=$("sender-health"),list=$("sender-checks");
  if(busy)return;
  busy=true;button.disabled=true;
  state.textContent="Consultando configuração administrativa…";
  list.replaceChildren();
  try{
   // Freshly validate identity, not merely a local cached role claim.
   const {data:{user},error:userError}=await sb.auth.getUser();
   if(userError||user?.app_metadata?.role!=="admin"){
    state.textContent="Acesso restrito à administração da V2.";
    return;
   }
   const {data:{session},error:sessionError}=await sb.auth.getSession();
   if(sessionError||!session?.access_token){
    state.textContent="Sessão administrativa expirada. Reentre na Central V2.";
    return;
   }
   const response=await fetch(url+"/functions/v1/editorial-participation",{
    method:"POST",headers:{"Content-Type":"application/json","apikey":publicKey,
     "Authorization":"Bearer "+session.access_token},
    body:JSON.stringify({kind:"newsletter_admin_diagnostics"})
   });
   const details=await response.json().catch(()=>({}));
   if(!response.ok||details.ok!==true)throw Error(details.error||"Não foi possível consultar.");
   const checks=[
    ["Chave do provedor configurada",details.api_key_present===true],
    ["Endereço de remetente válido",details.sender_configured===true],
    ["Liberação explícita habilitada",details.activation_flag===true]
   ];
   for(const [label,valid] of checks)append(list,(valid?"✓ ":"○ ")+label);
   if(details.sender_domain){
    append(list,"Domínio remetente: "+String(details.sender_domain));
   }
   const p=details.provider?.state;
   append(list,statuses[p]||"Status de domínio não determinado.");
   state.textContent=details.available===true
     ? "Integração habilitada no ambiente. Confirme o recebimento real antes de anunciar a newsletter."
     : "Inscrições por e-mail bloqueadas. A configuração do remetente está pendente.";
  }catch(err){
   state.textContent="Não foi possível concluir o diagnóstico: "+(err?.message||"erro de rede");
  }finally{busy=false;button.disabled=false;}
 }
 function init(){
  const button=$("check-sender");
  if(!button)return;
  button.addEventListener("click",check);
  // Initial check requires an authenticated admin; guests see no configuration.
  void check();
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();