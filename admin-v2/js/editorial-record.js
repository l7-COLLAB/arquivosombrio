"use strict";
(async function(){
var $=id=>document.getElementById(id),state=$("state"),client=null,selected="";
var say=(s,error)=>{state.textContent=s;state.className=error?"error":""};
try {
 var session=await obterSessaoAdminIsolada();
 var at=Number(sessionStorage.getItem("arquivo-admin-verified-at")||0);
 var user=sessionStorage.getItem("arquivo-admin-verified-user")||"";
 if(!session||String(session.user.id)!==user||Date.now()-at>1800000){
    location.replace("../admin.html?session=verificacao&next=adm");return;
 }
 client=obterClienteAdminIsolado();
 // Server verifies the admin JWT through RLS for both metadata tables.
 const r=await client.from("Casos").select("id,titulo,status_publicacao")
     .order("id",{ascending:false}).limit(500);
 if(r.error)throw r.error;
 r.data.forEach(item=>{
    const opt=document.createElement("option");
    opt.value=String(item.id);opt.textContent=item.titulo+" ("+item.status_publicacao+")";
    $("case").append(opt);
 });
 $("app").hidden=false;
 say("Selecione o dossiê que deseja editar.");
}catch(error){say("Não foi possível abrir o painel: "+(error.message||error),true);return;}
function clear(){
 $("responsible").value="";$("research").value="";$("review").value="";
 $("method").value="";$("description").value="";$("recent").replaceChildren();
 $("date").value=new Date().toLocaleDateString("en-CA");
}
async function load(){
 clear();selected=$("case").value;if(!selected)return;
 say("Consultando expediente...");
 const [identity,revisions]=await Promise.all([
 client.from("dossier_editorial_identity")
 .select("editorial_responsible,research_credit,review_credit,editorial_method").eq("dossier_id",selected).maybeSingle(),
 client.from("dossier_editorial_revisions")
 .select("revision_date,revision_type,description").eq("dossier_id",selected)
 .order("revision_date",{ascending:false}).limit(50)
 ]);
 if(selected!==$("case").value)return;
 if(identity.error||revisions.error){say("Consulta bloqueada: "+(identity.error||revisions.error).message,true);return;}
 const item=identity.data||{};
 $("responsible").value=item.editorial_responsible||"";
 $("research").value=item.research_credit||"";
 $("review").value=item.review_credit||"";
 $("method").value=item.editorial_method||"";
 (revisions.data||[]).forEach(v=>{
    const a=document.createElement("article"),time=document.createElement("time"),p=document.createElement("p");
    time.textContent=v.revision_date+" · "+v.revision_type;p.textContent=v.description;
    a.append(time,p);$("recent").append(a);
 });
 say("Dados carregados. Revisões são permanentes.");
}
$("case").addEventListener("change",load);
$("saveIdentity").addEventListener("click",async function(){
 if(!selected)return say("Selecione um dossiê.",true);
 const payload={dossier_id:Number(selected),editorial_responsible:$("responsible").value.trim()||null,
 research_credit:$("research").value.trim()||null,review_credit:$("review").value.trim()||null,
 editorial_method:$("method").value.trim()||null,updated_at:new Date().toISOString()};
 this.disabled=true;say("Salvando...");
 try{
   const r=await client.from("dossier_editorial_identity").upsert(payload,{onConflict:"dossier_id"});
   if(r.error)throw r.error;say("Expediente salvo.");
 }catch(e){say("Erro ao salvar: "+e.message,true);}
 finally{this.disabled=false;}
});
$("saveRevision").addEventListener("click",async function(){
 if(!selected)return say("Selecione um dossiê.",true);
 const description=$("description").value.trim(),date=$("date").value,kind=$("kind").value;
 if(!date||description.length<15||description.length>1000)return say("Informe a data real e descreva a alteração com 15 a 1000 caracteres.",true);
 if(date>new Date().toLocaleDateString("en-CA"))return say("A data não pode estar no futuro.",true);
 if(!confirm("Esta alteração já foi efetivamente realizada no conteúdo do dossiê? O registro será público e permanente."))return;
 this.disabled=true;say("Registrando...");
 try{
   const r=await client.from("dossier_editorial_revisions")
   .insert({dossier_id:Number(selected),revision_date:date,revision_type:kind,description});
   if(r.error)throw r.error;await load();say("Revisão registrada no histórico público.");
 }catch(e){say("Erro ao registrar: "+e.message,true);}
 finally{this.disabled=false;}
});
})();