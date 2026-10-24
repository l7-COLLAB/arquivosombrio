const status=document.getElementById("status"),root=document.getElementById("items");
function fail(message){status.textContent=message;root.replaceChildren();}
function field(node,label,value){const p=document.createElement("p");const b=document.createElement("strong");b.textContent=label+": ";p.append(b,document.createTextNode(String(value??"")));node.append(p);}
async function start(){
 try{
  const session=await obterSessaoAdminIsolada();
  const at=Number(sessionStorage.getItem("arquivo-admin-verified-at")||0);
  const id=sessionStorage.getItem("arquivo-admin-verified-user")||"";
  if(!session||id!==String(session.user.id)||!(at>0&&Date.now()-at<1800000)){
   location.replace("../admin.html?session=verificacao&next=adm");return;
  }
  const client=obterClienteAdminIsolado();
  const {data,error}=await client.functions.invoke("editorial-candidates",{method:"GET"});
  if(error)throw new Error("Acesso indisponível ou não autorizado. Confirme a implantação do endpoint.");
  if(!data?.read_only||data.publication_allowed!==false||!Array.isArray(data.items))throw new Error("Resposta editorial inválida.");
  root.replaceChildren();
  for(const item of data.items){
   const box=document.createElement("article"),heading=document.createElement("h2");
   heading.textContent="Caso "+String(item.id_caso)+" · evento "+String(item.indice);box.append(heading);
   field(box,"Original",item.original);field(box,"Candidata",item.proposta);
   const link=document.createElement("a");link.textContent="Consultar fonte";link.href=item.fonte;link.target="_blank";link.rel="noopener noreferrer";
   if(!/^https:\/\//.test(link.href))throw new Error("Fonte inválida");box.append(link);root.append(box);
  }
  status.textContent="Consulta somente leitura. Nenhuma decisão foi aprovada.";
 }catch(e){fail(e?.message||"Consulta indisponível");}
}
start();
