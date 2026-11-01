"use strict";
/* Etapa 12: consultar verificações reais na Resend. Sem escrita ou envio. */
(function(){
 const endpoint="https://iuhotznurbyujzbyhizf.supabase.co/functions/v1/newsletter-activation";
 const pub="sb_publishable_bpAZ5EhYLIuVoE4Q97s_-A_XQwwRxUj";
 const client=window.supabase.createClient("https://iuhotznurbyujzbyhizf.supabase.co",pub,{
  auth:{storageKey:"arquivo-sombrio-admin-auth-v2",persistSession:true,
   autoRefreshToken:true,detectSessionInUrl:false}
 });
 const el=id=>document.getElementById(id);
 const labels=[
  ["delivery_api_key_present","Chave de envio presente"],
  ["sender_domain_matches","Domínio declarado coincide com o remetente"],
  ["unsubscribe_secret_present","Chave privada de descadastro presente"],
  ["webhook_secret_present","Chave privada do webhook presente"],
  ["registration_enabled","Confirmação de inscrições habilitada"],
  ["dispatch_enabled","Envio manual explicitamente habilitado"],
  ["pilot_only","Modo de teste com apenas um destinatário ativo"],
  ["pilot_recipient_configured","Endereço piloto configurado no servidor"]
 ];
 const resultLabels=[
  ["domain_sending_verified","Resend confirmou o domínio e permissão de envio"],
  ["webhook_enabled","Resend confirmou webhook ativo para a função correta"],
  ["webhook_required_events_present","Webhook recebe entrega, bounce e reclamação"]
 ];
 let busy=false;
 function item(container,message){
  const li=document.createElement("li");li.textContent=message;container.appendChild(li);
 }
 function symbol(ok){return ok?"✓ ":"○ ";}
 async function preflight(){
  if(busy)return;busy=true;el("newsletter-activation-refresh").disabled=true;
  el("newsletter-activation-result").textContent="Consultando provedor e verificando sessão administrativa…";
  try{
   const {data:{user},error:authError}=await client.auth.getUser();
   if(authError||user?.app_metadata?.role!=="admin")throw Error("Acesso administrativo necessário.");
   const {data:{session}}=await client.auth.getSession();
   if(!session?.access_token)throw Error("Sessão expirada.");
   const response=await fetch(endpoint,{
    method:"POST",headers:{"Content-Type":"application/json","apikey":pub,
     "Authorization":"Bearer "+session.access_token},body:JSON.stringify({kind:"preflight"})
   });
   const body=await response.json().catch(()=>({}));
   if(!response.ok||body.ok!==true)throw Error(body.error||"Serviço indisponível.");
   const checkList=el("newsletter-activation-checks");checkList.replaceChildren();
   for(const [key,label] of labels)item(checkList,symbol(body.flags?.[key]===true)+label);
   const providerList=el("newsletter-activation-provider");providerList.replaceChildren();
   for(const [key,label] of resultLabels)item(providerList,symbol(body.provider?.[key]===true)+label);
   const a=body.provider||{};
   if(a.domain_lookup!=="read")item(providerList,"Consulta de domínios na Resend: "+String(a.domain_lookup||"indisponível"));
   if(a.webhook_lookup!=="read")item(providerList,"Consulta de webhooks na Resend: "+String(a.webhook_lookup||"indisponível"));
   el("newsletter-activation-result").textContent=body.pilot_ready
    ?"Pré-requisitos técnicos do piloto confirmados pela Resend. Ainda falta executar e conferir uma entrega real supervisionada."
    :"Piloto bloqueado ou sem comprovação completa na Resend. Nenhuma mensagem foi enviada.";
  }catch(e){el("newsletter-activation-result").textContent="Falha no diagnóstico: "+(e.message||"erro");}
  finally{busy=false;el("newsletter-activation-refresh").disabled=false;}
 }
 function init(){
  if(!el("newsletter-activation-refresh"))return;
  el("newsletter-activation-refresh").addEventListener("click",()=>{void preflight();});
  void preflight();
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
 else init();
})();
