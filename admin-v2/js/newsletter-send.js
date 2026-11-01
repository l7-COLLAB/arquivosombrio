"use strict";
/* Etapa 10: disparo MANUAL sob liberação do servidor. Não ativa segredos. */
(function(){
 const endpoint="https://iuhotznurbyujzbyhizf.supabase.co/functions/v1/newsletter-dispatch";
 const pub="sb_publishable_bpAZ5EhYLIuVoE4Q97s_-A_XQwwRxUj";
 const sb=window.supabase.createClient("https://iuhotznurbyujzbyhizf.supabase.co",pub,{
  auth:{storageKey:"arquivo-sombrio-admin-auth-v2",persistSession:true,
   autoRefreshToken:true,detectSessionInUrl:false}
 });
 const node=id=>document.getElementById(id);
 let enabled=false,busy=false;
 async function api(kind,data={}){
  const {data:{user},error:e}=await sb.auth.getUser();
  if(e||user?.app_metadata?.role!=="admin")throw Error("Sessão administrativa necessária.");
  const {data:{session},error:authError}=await sb.auth.getSession();
  if(authError||!session?.access_token)throw Error("Entre novamente na Central V2.");
  const response=await fetch(endpoint,{
   method:"POST",
   headers:{"Content-Type":"application/json","apikey":pub,
    "Authorization":"Bearer "+session.access_token},
   body:JSON.stringify({kind,...data})
  });
  const body=await response.json().catch(()=>({}));
  if(!response.ok||body.ok!==true)throw Error(body.error||"Não foi possível consultar o serviço.");
  return body;
 }
 function updateButton(){
  const id=node("newsletter-queue-edition")?.value;
  node("newsletter-send-now").disabled=!enabled||busy||!id;
 }
 async function status(){
  enabled=false;updateButton();
  node("newsletter-send-status").textContent="Verificando liberação administrativa do envio…";
  try{
   const result=await api("status");
   enabled=result.dispatch_enabled===true;
   node("newsletter-send-status").textContent=enabled
    ? "Envio manual habilitado: até 5 mensagens por ação, 50 em 24 horas e intervalo de 7 dias por leitor. Revise antes de confirmar."
    : "Envio real bloqueado no servidor. A fila pode ser preparada, mas não serão enviados e-mails.";
  }catch(e){node("newsletter-send-status").textContent="Envio indisponível: "+(e.message||"erro");}
  updateButton();
 }
 async function send(){
  if(busy||!enabled)return;
  const editionId=node("newsletter-queue-edition")?.value;
  if(!editionId)return;
  const confirm=window.prompt(
   "Esta ação pode ENVIAR até 5 e-mails reais para leitores inscritos. Digite ENVIAR para confirmar:"
  );
  if(confirm!=="ENVIAR")return;
  busy=true;updateButton();node("newsletter-send-status").textContent="Executando lote limitado…";
  try{
   const result=await api("send_batch",{edition_id:editionId,confirmation:"ENVIAR"});
   const r=result.results||{};
   node("newsletter-send-status").textContent=
    "Lote processado: "+String(result.claimed||0)+
    ". Aceitos pelo provedor: "+String(r.aceito||0)+
    "; incertos: "+String(r.incerto||0)+
    "; falharam: "+String(r.falhou||0)+
    "; cancelados: "+String(r.cancelado||0)+
    ". Aceito não significa entregue.";
   // Recarrega os indicadores privados da fila pelo botão existente.
   node("newsletter-queue-refresh")?.click();
  }catch(e){node("newsletter-send-status").textContent="Envio não confirmado: "+(e.message||"erro");}
  finally{busy=false;updateButton();}
 }
 function init(){
  if(!node("newsletter-send-now"))return;
  node("newsletter-send-check").addEventListener("click",()=>{void status();});
  node("newsletter-send-now").addEventListener("click",()=>{void send();});
  node("newsletter-queue-edition")?.addEventListener("change",updateButton);
  void status();
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
 else init();
})();
