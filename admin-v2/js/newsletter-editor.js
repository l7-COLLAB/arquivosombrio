"use strict";
/* Edições de newsletter: somente rascunhos e revisão; NÃO há mecanismo de envio.
   Não consultar e-mails individuais nem criar destinatários neste módulo. */
(function(){
 const project="https://iuhotznurbyujzbyhizf.supabase.co";
 const key="sb_publishable_bpAZ5EhYLIuVoE4Q97s_-A_XQwwRxUj";
 const client=window.supabase.createClient(project,key,{
  auth:{storageKey:"arquivo-sombrio-admin-auth-v2",persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}
 });
 const $=selector=>document.querySelector(selector);
 const allowed=new Set(["rascunho","revisao","aprovado","arquivado"]);
 let currentId=null,admin=null;
 const message=(id,value)=>{const node=document.getElementById(id);if(node)node.textContent=String(value||"");};
 const append=(parent,tag,value,css)=>{
  const node=document.createElement(tag);
  if(css)node.className=css;
  if(value!==undefined)node.textContent=String(value??"");
  parent.appendChild(node);return node;
 };
 function safeHttps(url){
  try{
   const parsed=new URL(url);
   return parsed.protocol==="https:"&&Boolean(parsed.hostname)?parsed.href:"";
  }catch{return "";}
 }
 function dataFromForm(){
  const fields=$("#edition-form").elements;
  const value=k=>String(fields.namedItem(k).value||"").trim();
  const item={
   title:value("title"),subject:value("subject"),preheader:value("preheader"),
   body_text:value("body_text"),cta_label:value("cta_label"),cta_url:value("cta_url"),
   status:value("status")
  };
  if(item.title.length<3||item.title.length>120||
     item.subject.length<5||item.subject.length>150||
     item.preheader.length>180||
     item.body_text.length<100||item.body_text.length>12000||
     item.cta_label.length>90||item.cta_url.length>500||
     !allowed.has(item.status))throw Error("Confira os limites dos campos editoriais.");
  if(Boolean(item.cta_label)!==Boolean(item.cta_url))throw Error("Preencha o texto e o endereço do link juntos.");
  if(item.cta_url){
   const checked=safeHttps(item.cta_url);
   if(!checked)throw Error("O link de leitura precisa usar HTTPS válido.");
   item.cta_url=checked;
  }
  return item;
 }
 function preview(){
  const panel=$("#edition-preview-output");
  panel.replaceChildren();
  const f=$("#edition-form").elements;
  const get=k=>String(f.namedItem(k).value||"").trim();
  append(panel,"strong",get("title")||"Título da edição");
  append(panel,"p","Assunto: "+(get("subject")||"Não definido"),"subject");
  if(get("preheader"))append(panel,"p",get("preheader"),"subject");
  append(panel,"div",get("body_text")||"O texto aparecerá aqui, sem enviar qualquer e-mail.","body");
  const label=get("cta_label"),link=safeHttps(get("cta_url"));
  if(label&&link){
   const p=append(panel,"p");
   const a=append(p,"a",label);a.href=link;a.target="_blank";a.rel="noopener noreferrer";
  }
  append(panel,"div","Esta é somente uma prévia interna. Não corresponde a uma mensagem enviada. O cancelamento deverá constar do template final quando o envio for integrado.","footer");
 }
 function setForm(item){
  currentId=item?.id||null;
  const form=$("#edition-form");
  form.reset();
  const names=["title","subject","preheader","body_text","cta_label","cta_url","status"];
  if(item)for(const name of names)form.elements.namedItem(name).value=item[name]||"";
  $("#editor-heading").textContent=currentId?"Editar edição":"Editor de edição";
  message("edition-feedback",currentId?"Edição carregada. Nenhuma mensagem foi enviada.":"Nova edição. Use Salvar para registrar.");
  preview();
  if(currentId)$("#editor-heading").scrollIntoView({behavior:"smooth",block:"start"});
 }
 async function metrics(){
  const mapping=[["confirmado","sub-confirmed"],["pendente","sub-pending"],["cancelado","sub-cancelled"]];
  const results=await Promise.all(mapping.map(async([status,id])=>{
   // HEAD-only protected count: never fetch a subscriber email or verification token.
   const {count,error}=await client.from("editorial_newsletter_subscribers")
    .select("id",{count:"exact",head:true}).eq("status",status);
   return {id,value:error||!Number.isInteger(count)?"—":String(count),error};
  }));
  for(const x of results)message(x.id,x.value);
  if(results.some(x=>x.error))message("page-status","Acesso administrativo validado, mas nem todas as contagens puderam ser consultadas.");
 }
 async function load(){
  if(!admin)return;
  message("page-status","Consultando edições e indicadores privados…");
  const {data,error}=await client.from("editorial_newsletter_editions")
   .select("id,title,subject,preheader,body_text,cta_label,cta_url,status,created_at,updated_at")
   .order("updated_at",{ascending:false}).limit(100);
  if(error){
   message("page-status","Falha ao consultar as edições: "+(error.message||"serviço indisponível"));
   return;
  }
  const list=$("#edition-list");list.replaceChildren();
  const rows=Array.isArray(data)?data:[];
  if(!rows.length)append(list,"p","Nenhuma edição foi criada. Use o editor ao lado.");
  for(const item of rows){
   const box=append(list,"article",undefined,"item");
   const summary=append(box,"div");
   append(summary,"h3",item.title);
   const updated=item.updated_at?new Date(item.updated_at):null;
   const date=updated&&Number.isFinite(updated.getTime())?updated.toLocaleString("pt-BR"):"data não informada";
   append(summary,"small",item.status.replaceAll("_"," ")+" · Revisão "+date);
   const button=append(box,"button","Editar","secondary");button.type="button";
   button.addEventListener("click",()=>setForm(item));
  }
  await metrics();
  if(!$("#page-status").textContent.includes("não")&&!$("#page-status").textContent.includes("Acesso"))
   message("page-status","Acesso administrativo validado. "+rows.length+" edições carregadas; nenhuma foi enviada.");
 }
 async function save(event){
  event.preventDefault();
  if(!admin||!$("#edition-form").reportValidity())return;
  let data;
  try{data=dataFromForm()}catch(e){message("edition-feedback",e.message);return;}
  const button=$("#edition-save");
  if(button.disabled)return;
  button.disabled=true;message("edition-feedback","Registrando edição no Supabase…");
  try{
   let q;
   if(currentId){
    q=client.from("editorial_newsletter_editions").update({...data,updated_at:new Date().toISOString()}).eq("id",currentId).select("id").single();
   }else{
    q=client.from("editorial_newsletter_editions").insert(data).select("id").single();
   }
   const {data:result,error}=await q;
   if(error||!result?.id)throw Error(error?.message||"O servidor não confirmou a gravação.");
   currentId=result.id;
   message("edition-feedback","Edição gravada com sucesso. Nenhum e-mail foi enviado.");
   await load();preview();
  }catch(e){
   message("edition-feedback","Não foi possível salvar. O conteúdo permanece no formulário. "+(e.message||""));
  }finally{button.disabled=false;}
 }
 async function init(){
  preview();
  $("#edition-form").addEventListener("submit",save);
  $("#edition-preview").addEventListener("click",preview);
  $("#edition-new").addEventListener("click",()=>setForm(null));
  $("#refresh-editions").addEventListener("click",()=>{void load();});
  try{
   const {data,error}=await client.auth.getUser();
   if(error||data?.user?.app_metadata?.role!=="admin"){
    message("page-status","Acesso restrito. Entre na Central Administrativa V2 para validar sua sessão.");
    return;
   }
   admin=data.user;
   $("#edition-fields").disabled=false;
   $("#refresh-editions").disabled=false;
   await load();
  }catch(e){message("page-status","Não foi possível validar a sessão administrativa.");}
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else void init();
})();
