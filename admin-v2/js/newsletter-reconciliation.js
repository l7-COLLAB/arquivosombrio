"use strict";
/* Etapa 13: reconciliação manual, nunca reenviar e-mails nem expor destinatários. */
(function(){
 const endpoint="https://iuhotznurbyujzbyhizf.supabase.co/functions/v1/newsletter-monitor";
 const pub="sb_publishable_bpAZ5EhYLIuVoE4Q97s_-A_XQwwRxUj";
 const client=window.supabase.createClient("https://iuhotznurbyujzbyhizf.supabase.co",pub,{
  auth:{storageKey:"arquivo-sombrio-admin-auth-v2",persistSession:true,
   autoRefreshToken:true,detectSessionInUrl:false}
 });
 const $=id=>document.getElementById(id);
 let busy=false;
 async function api(kind,extra={}){
  const {data:{user},error:authErr}=await client.auth.getUser();
  if(authErr||user?.app_metadata?.role!=="admin")throw Error("Autenticação administrativa obrigatória.");
  const {data:{session},error:sessionErr}=await client.auth.getSession();
  if(sessionErr||!session?.access_token)throw Error("Entre novamente na Central V2.");
  const response=await fetch(endpoint,{
   method:"POST",
   headers:{"Content-Type":"application/json","apikey":pub,
    "Authorization":"Bearer "+session.access_token},
   body:JSON.stringify({kind,...extra})
  });
  const body=await response.json().catch(()=>({}));
  if(!response.ok||body.ok!==true)throw Error(body.error||"Operação não concluída.");
  return body;
 }
 function appendText(parent,tag,txt){
  const el=document.createElement(tag);
  el.textContent=txt;parent.appendChild(el);return el;
 }
 async function reconcile(id){
  if(busy)return;
  const answer=window.prompt(
   "A Resend pode ter aceitado a mensagem. Esta ação só marca o resultado como INCERTO e NÃO reenvia. Digite MARCAR INCERTO para confirmar:"
  );
  if(answer!=="MARCAR INCERTO")return;
  busy=true;$("newsletter-incident-refresh").disabled=true;
  $("newsletter-incident-status").textContent="Registrando decisão administrativa…";
  try{
   await api("mark_stale",{delivery_id:id,confirmation:"MARCAR INCERTO"});
   $("newsletter-incident-status").textContent="Tentativa classificada como incerta. Não será reenviada automaticamente.";
   await refresh(true);
   $("newsletter-monitor-refresh")?.click();
  }catch(e){$("newsletter-incident-status").textContent="Não foi possível encerrar a tentativa: "+(e.message||"erro");}
  finally{busy=false;$("newsletter-incident-refresh").disabled=false;}
 }
 async function refresh(keepStatus=false){
  if(busy&&!keepStatus)return;
  const list=$("newsletter-incident-list");
  if(!keepStatus)$("newsletter-incident-status").textContent="Consultando incidentes privados…";
  list.replaceChildren();
  try{
   const data=await api("incidents");
   const rows=Array.isArray(data.incidents)?data.incidents:[];
   if(rows.length===0){
    appendText(list,"p","Nenhuma tentativa antiga ou incerta registrada.");
   }else{
    for(const item of rows){
     const div=document.createElement("div");div.className="item";
     const wrap=document.createElement("div");
     const id=typeof item.delivery_id==="string"?item.delivery_id:"";
     const allowed= /^[0-9a-f-]{36}$/i.test(id)&&item.can_mark_uncertain===true;
     appendText(wrap,"strong","Tentativa "+id.slice(0,8)+" · "+String(item.status||"desconhecido"));
     const age=Number(item.elapsed_minutes);
     appendText(wrap,"p","Início: "+(item.dispatch_started_at?
      new Date(item.dispatch_started_at).toLocaleString("pt-BR"):"não registrado")+
      (Number.isFinite(age)?" · "+age+" min":"")+
      (item.has_provider_id===true?" · ID Resend existente":" · sem ID Resend"));
     div.appendChild(wrap);
     if(allowed){
      const button=document.createElement("button");button.type="button";
      button.textContent="Marcar como incerto";
      button.addEventListener("click",()=>{void reconcile(id);});
      div.appendChild(button);
     }
     list.appendChild(div);
    }
   }
   if(!keepStatus)$("newsletter-incident-status").textContent=
    "Exibindo até 10 incidentes, sem endereços de e-mail. Nenhuma tentativa foi alterada.";
  }catch(e){
   $("newsletter-incident-status").textContent="Consulta de incidentes indisponível: "+(e.message||"erro");
  }
 }
 function init(){
  if(!$("newsletter-incident-refresh"))return;
  $("newsletter-incident-refresh").addEventListener("click",()=>{void refresh();});
  void refresh();
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
 else init();
})();
