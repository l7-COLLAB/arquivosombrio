"use strict";
/* Etapa 11: indicadores agregados privados e simulação read-only. */
(function(){
 const endpoint="https://iuhotznurbyujzbyhizf.supabase.co/functions/v1/newsletter-monitor";
 const key="sb_publishable_bpAZ5EhYLIuVoE4Q97s_-A_XQwwRxUj";
 const client=window.supabase.createClient("https://iuhotznurbyujzbyhizf.supabase.co",key,{
  auth:{storageKey:"arquivo-sombrio-admin-auth-v2",persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}
 });
 const $=id=>document.getElementById(id);
 const fmt=value=>Number.isSafeInteger(value)?value.toLocaleString("pt-BR"):"—";
 const append=(parent,text)=>{
  const li=document.createElement("li");
  li.textContent=text;parent.appendChild(li);
 };
 let inFlight=false;
 async function api(kind,extra={}){
  // Do not trust cached claims alone, always verify user server-side.
  const {data:{user},error:authError}=await client.auth.getUser();
  if(authError||user?.app_metadata?.role!=="admin")throw Error("Acesso exclusivo à administração.");
  const {data:{session},error:sessionError}=await client.auth.getSession();
  if(sessionError||!session?.access_token)throw Error("Sessão expirada. Faça login novamente na V2.");
  const response=await fetch(endpoint,{
   method:"POST",headers:{"Content-Type":"application/json",
    "apikey":key,"Authorization":"Bearer "+session.access_token},
   body:JSON.stringify({kind,...extra})
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok||data.ok!==true)throw Error(data.error||"Consulta não concluída.");
  return data;
 }
 const checkLabels=[
  ["provider_key_present","Chave de API de envio presente"],
  ["sender_domain_declared_matches","Domínio remetente declarado coincide com o e-mail"],
  ["webhook_secret_present","Segredo de webhook configurado"],
  ["unsubscribe_secret_present","Segredo de descadastro presente"],
  ["registration_flag","Cadastro por e-mail liberado"],
  ["dispatch_flag","Liberação explícita do disparo"]
 ];
 async function overview(){
  if(inFlight)return;
  inFlight=true;$("newsletter-monitor-refresh").disabled=true;
  $("newsletter-monitor-status").textContent="Consultando indicadores privados…";
  try{
   const data=await api("overview");
   const snapshot=data.snapshot||{};
   const delivery=snapshot.delivery||{},activity=snapshot.activity||{};
   const subscribers=snapshot.subscribers||{},attention=snapshot.attention||{};
   const fields=[
    ["newsletter-monitor-subscribers",subscribers.confirmed],
    ["newsletter-monitor-attempts",activity.attempts_24h],
    ["newsletter-monitor-remaining",activity.remaining_daily_quota],
    ["newsletter-monitor-prepared",delivery.prepared],
    ["newsletter-monitor-delivered",delivery.delivered],
    ["newsletter-monitor-uncertain",delivery.uncertain]
   ];
   for(const [id,value] of fields)$(id).textContent=fmt(value);
   const checks=$("newsletter-monitor-checks");
   checks.replaceChildren();
   const configuration=data.configuration||{};
   for(const [k,label] of checkLabels)append(checks,(configuration[k]===true?"✓ ":"○ ")+label);
   append(checks,"A declaração do domínio não substitui a verificação real na Resend.");
   const warnings=$("newsletter-monitor-warnings");warnings.replaceChildren();
   const alertLabels=[
    ["stalled_15m","Envios em processamento há mais de 15 minutos"],
    ["accepted_over_48h","Aceitos sem confirmação de entrega há mais de 48 horas"],
    ["uncertain","Resultados incertos que exigem reconciliação manual"],
    ["failed","Envios com falha registrada"],
    ["bounced","Bounces registrados"],
    ["complained","Reclamações registradas"]
   ];
   let found=0;
   for(const [key,label] of alertLabels){
    if(Number(attention[key])>0){append(warnings,label+": "+fmt(attention[key]));found++;}
   }
   if(!found)append(warnings,"Nenhuma ocorrência dessas categorias registrada até a consulta.");
   const time=snapshot.generated_at?new Date(snapshot.generated_at):null;
   const recorded=time&&Number.isFinite(time.getTime())
    ?time.toLocaleString("pt-BR"):"horário indisponível";
   $("newsletter-monitor-status").textContent="Indicadores consultados em "+recorded+
    ". A consulta não envia e-mails nem altera a fila.";
  }catch(e){$("newsletter-monitor-status").textContent="Monitor indisponível: "+(e.message||"erro");}
  finally{inFlight=false;$("newsletter-monitor-refresh").disabled=false;}
 }
 async function simulate(){
  const id=$("newsletter-queue-edition")?.value;
  if(!id){$("newsletter-monitor-simulation").textContent="Escolha primeiro uma edição aprovada na área da fila.";return;}
  const button=$("newsletter-monitor-simulate");
  button.disabled=true;
  $("newsletter-monitor-simulation").textContent="Simulando os limites atuais, sem reservar destinatários…";
  try{
   const data=await api("simulate",{edition_id:id});
   const sim=data.simulation||{};
   $("newsletter-monitor-simulation").textContent=
    "Prévia, sem envio: "+fmt(sim.eligible_now)+" elegíveis agora; até "+
    fmt(sim.would_claim)+" seriam reservados no próximo lote. "+fmt(sim.not_confirmed)+
    " não confirmados e "+fmt(sim.cooldown)+" em intervalo de frequência. "+
    "Cota disponível: "+fmt(sim.daily_quota_remaining)+". Nenhum registro foi alterado.";
  }catch(e){$("newsletter-monitor-simulation").textContent="Simulação indisponível: "+(e.message||"erro");}
  finally{button.disabled=false;}
 }
 function init(){
  if(!$("newsletter-monitor-refresh"))return;
  $("newsletter-monitor-refresh").addEventListener("click",()=>{void overview();});
  $("newsletter-monitor-simulate").addEventListener("click",()=>{void simulate();});
  void overview();
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
 else init();
})();
