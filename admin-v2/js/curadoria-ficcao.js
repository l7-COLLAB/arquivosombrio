"use strict";
const project="https://iuhotznurbyujzbyhizf.supabase.co",key="sb_publishable_bpAZ5EhYLIuVoE4Q97s_-A_XQwwRxUj";
const db=window.supabase.createClient(project,key,{auth:{storageKey:"arquivo-sombrio-admin-auth-v2",persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
const $=s=>document.querySelector(s);
const statuses=["recebido","em_analise","solicitar_ajustes","aprovado_para_contato","recusado"];
let editor=null;
function status(message){$("#status").textContent=message||""}
function append(tag,parent,text,className){
 const node=document.createElement(tag);
 if(className)node.className=className;
 if(text!==undefined)node.textContent=String(text||"");
 parent.appendChild(node);return node;
}
function render(rows){
 const queue=$("#queue");queue.replaceChildren();
 if(!rows.length){append("p",queue,"Nenhum original recebido até o momento.","muted");return}
 for(const row of rows){
  const card=append("article",queue,undefined,"entry");
  append("h2",card,row.title);
  append("p",card,row.pen_name+" · "+row.genre,"meta");
  append("p",card,"Contato: "+row.contact_email+" · "+new Date(row.created_at).toLocaleString("pt-BR"),"meta");
  append("p",card,row.synopsis,"original");
  const details=append("details",card);
  append("summary",details,"Consultar trecho original");
  append("pre",details,row.manuscript_excerpt);
  const label=append("label",card,"Situação editorial");
  const select=append("select",label);
  for(const value of statuses){const option=append("option",select,value.replaceAll("_"," "));option.value=value}
  select.value=row.status;
  const notesLabel=append("label",card,"Anotações privadas da equipe");
  const textarea=append("textarea",notesLabel);
  textarea.value=row.editorial_notes||"";
  textarea.maxLength=6000;
  const msg=append("p",card,"","status");
  const save=append("button",card,"Salvar revisão");save.type="button";
  save.addEventListener("click",async()=>{
   if(!editor)return;
   save.disabled=true;msg.textContent="Salvando a revisão…";
   try{
    const {error}=await db.from("editorial_fiction_submissions").update({
     status:select.value,editorial_notes:textarea.value,reviewed_at:new Date().toISOString()
    }).eq("id",row.id);
    if(error)throw error;
    msg.textContent="Revisão registrada. A obra permanece privada.";
   }catch(e){msg.textContent="Não foi possível salvar: "+(e.message||"erro")}
   finally{save.disabled=false}
  });
 }
}
async function load(){
 if(!editor)return;
 status("Consultando a fila de ficção…");
 try{
  const {data,error}=await db.from("editorial_fiction_submissions")
   .select("id,pen_name,contact_email,title,genre,synopsis,manuscript_excerpt,status,editorial_notes,created_at")
   .order("created_at",{ascending:false}).limit(100);
  if(error)throw error;
  render(data||[]);
  status((data||[]).length+" originais carregados. Apenas a equipe administrativa pode acessar.");
 }catch(e){status("Não foi possível acessar a fila privada: "+(e.message||"erro"))}
}
document.addEventListener("DOMContentLoaded",async()=>{
 try{
  const {data,error}=await db.auth.getUser();
  if(error||data?.user?.app_metadata?.role!=="admin"){
   status("Acesso restrito à administração. Valide sua sessão na Central V2.");return;
  }
  editor=data.user;
  $("#reload").hidden=false;
  $("#reload").addEventListener("click",load);
  await load();
 }catch(e){status("Não foi possível validar a conta administrativa.")}
});
