(async function(){"use strict";
const $=id=>document.getElementById(id), status=$("status"),app=$("app");
const types=new Set(["Casos","casos_diarios","pericias","lendas","creepypastas"]);
const labels=["violencia","violencia_grafica","violencia_sexual","violencia_infantil","suicidio","abuso_psicologico","morte"];
const levels=new Set(["","leve","moderado","pesado","restrito"]);
let client=null,records=[];
function message(t){status.textContent=t;}
function selected(){return records.find(r=>String(r.id)===$("item").value);}
function updateForm(){const row=selected();$("level").value=row?.intensidade_conteudo||"";const warnings=Array.isArray(row?.avisos_conteudo)?row.avisos_conteudo:[];$("warnings").querySelectorAll('input[type="checkbox"]').forEach(i=>i.checked=warnings.includes(i.value));$("save").disabled=!row;}
async function load(){
 const table=$("category").value;if(!types.has(table))return;
 $("item").replaceChildren(new Option("Consultando arquivos...",""));records=[];$("save").disabled=true;
 const result=await client.from(table).select("id,titulo,status_publicacao,intensidade_conteudo,avisos_conteudo").order("id",{ascending:false}).limit(500);
 if(result.error){message("Erro ao carregar: "+result.error.message);return;}
 records=result.data||[];
 $("item").replaceChildren(new Option("Selecione um arquivo",""));
 for(const row of records){$("item").add(new Option((row.titulo||"Sem título")+" — "+(row.status_publicacao||"sem status")+" (#"+row.id+")",String(row.id)));}
 updateForm();message(records.length+" arquivo(s) disponíveis nesta editoria.");
}
try{
 const session=await obterSessaoAdminIsolada();
 const at=Number(sessionStorage.getItem("arquivo-admin-verified-at")||0);
 const user=sessionStorage.getItem("arquivo-admin-verified-user")||"";
 if(!session||user!==String(session.user.id)||Date.now()-at>1800000){location.replace("../admin.html?session=verificacao&next=adm");return;}
 client=obterClienteAdminIsolado();app.hidden=false;
 $("category").addEventListener("change",load);$("item").addEventListener("change",updateForm);
 $("save").addEventListener("click",async()=>{
 const table=$("category").value,row=selected(),level=$("level").value;
 if(!types.has(table)||!row||!levels.has(level))return;
 const warnings=[...$("warnings").querySelectorAll("input:checked")].map(i=>i.value).filter(x=>labels.includes(x));
 const btn=$("save");btn.disabled=true;message("Salvando...");
 try{
  const payload={intensidade_conteudo:level||null,avisos_conteudo:warnings};
  const res=await client.from(table).update(payload).eq("id",row.id).select("id,intensidade_conteudo,avisos_conteudo").single();
  if(res.error)throw res.error;
  if(res.data?.id!==row.id||res.data?.intensidade_conteudo!==payload.intensidade_conteudo)throw Error("A classificação não pôde ser confirmada.");
  row.intensidade_conteudo=res.data.intensidade_conteudo;row.avisos_conteudo=res.data.avisos_conteudo;message("Classificação salva e confirmada. A publicação não foi alterada.");
 }catch(e){message("Falha ao salvar: "+(e.message||"erro desconhecido"));}
 finally{btn.disabled=false;}
 });
 await load();
}catch(e){message("Acesso administrativo indisponível. Entre novamente na Administração V2.");}
})();