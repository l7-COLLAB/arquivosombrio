"use strict";
/* Etapa 9: preparação administrativa. Sem operação de disparo de e-mail. */
(function(){
 const url="https://iuhotznurbyujzbyhizf.supabase.co";
 const key="sb_publishable_bpAZ5EhYLIuVoE4Q97s_-A_XQwwRxUj";
 const sb=window.supabase.createClient(url,key,{auth:{
  storageKey:"arquivo-sombrio-admin-auth-v2",persistSession:true,
  autoRefreshToken:true,detectSessionInUrl:false
 }});
 const el=id=>document.getElementById(id);
 let busy=false;
 async function api(kind,fields={}){
  const {data:{user},error:e}=await sb.auth.getUser();
  if(e||user?.app_metadata?.role!=="admin")throw Error("Acesso administrativo necessário.");
  const {data:{session},error:sessionError}=await sb.auth.getSession();
  if(sessionError||!session?.access_token)throw Error("Sessão expirada.");
  const res=await fetch(url+"/functions/v1/newsletter-distribution",{
   method:"POST",headers:{"Content-Type":"application/json","apikey":key,
    "Authorization":"Bearer "+session.access_token},
   body:JSON.stringify({kind,...fields})
  });
  const data=await res.json().catch(()=>({}));
  if(!res.ok||data.ok!==true)throw Error(data.error||"Falha de conexão.");
  return data;
 }
 function number(value){
  return Number.isSafeInteger(value)?value.toLocaleString("pt-BR"):"—";
 }
 async function refresh(){
  const button=el("newsletter-queue-refresh"),prepare=el("newsletter-queue-prepare");
  button.disabled=true;prepare.disabled=true;
  el("newsletter-queue-message").textContent="Consultando fila administrativa…";
  try{
   const data=await api("admin_status");
   const opts=el("newsletter-queue-edition");const previous=opts.value;
   opts.replaceChildren();
   const editions=Array.isArray(data.editions)?data.editions:[];
   for(const edition of editions){
    const option=document.createElement("option");
    option.value=String(edition.id);
    option.textContent=String(edition.title||"Edição aprovada");
    opts.appendChild(option);
   }
   if(editions.some(e=>e.id===previous))opts.value=previous;
   el("newsletter-queue-prepared").textContent=number(data.counts?.preparado);
   el("newsletter-queue-accepted").textContent=number((data.counts?.aceito||0)+(data.counts?.entregue||0));
   el("newsletter-queue-cancelled").textContent=number(data.counts?.cancelado);
   el("newsletter-queue-message").textContent=editions.length
    ? "Fila pronta para preparo. Disparos reais seguem desativados."
    : "Nenhuma edição aprovada. Conclua a revisão editorial antes de preparar.";
   prepare.disabled=!editions.length||data.dispatch_enabled!==false;
  }catch(e){
   el("newsletter-queue-message").textContent="Não foi possível consultar a fila: "+(e.message||"erro");
  }finally{button.disabled=false;}
 }
 async function prepare(){
  if(busy)return;
  const id=el("newsletter-queue-edition").value;
  if(!id)return;
  // Confirmação explícita, mas nunca envio. A lista é somente um snapshot.
  if(!window.confirm("Preparar a fila desta edição com inscritos confirmados? Não será enviado nenhum e-mail. Após preparar, o conteúdo desta edição não poderá mais ser editado."))return;
  busy=true;el("newsletter-queue-prepare").disabled=true;
  el("newsletter-queue-message").textContent="Preparando destinatários confirmados…";
  try{
   const data=await api("prepare_edition",{edition_id:id});
   el("newsletter-queue-message").textContent=
    "Fila preparada: "+number(data.prepared)+" registros pendentes, "+number(data.created)+
    " novos. Nenhum e-mail foi enviado.";
   await refresh();
  }catch(e){el("newsletter-queue-message").textContent="Falha no preparo: "+(e.message||"erro");}
  finally{busy=false;}
 }
 async function init(){
  if(!el("newsletter-queue-refresh"))return;
  el("newsletter-queue-refresh").addEventListener("click",()=>{void refresh();});
  el("newsletter-queue-prepare").addEventListener("click",()=>{void prepare();});
  await refresh();
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>{void init();},{once:true});
 else void init();
})();
