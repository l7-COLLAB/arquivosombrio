/* Arquivo Sombrio: avisos editoriais informativos para registros publicados. */
(()=>{"use strict";
const root="https://iuhotznurbyujzbyhizf.supabase.co";
const key="sb_publishable_bpAZ5EhYLIuVoE4Q97s_-A_XQwwRxUj";
const routes={"caso.html":"Casos","garimpo.html":"casos_diarios","pericia.html":"pericias","lendas.html":"lendas","creepypastas.html":"creepypastas"};
const levelNames={leve:"Leve",moderado:"Moderado",pesado:"Pesado",restrito:"Restrito"};
const warningNames={violencia:"Violência",violencia_grafica:"Descrições ou imagens gráficas",violencia_sexual:"Violência sexual",violencia_infantil:"Violência contra crianças",suicidio:"Suicídio ou automutilação",abuso_psicologico:"Abuso psicológico",morte:"Morte e luto"};
const page=location.pathname.split("/").pop().toLowerCase(),table=routes[page];
const id=new URLSearchParams(location.search).get("id");
if(!table||!id||!/^[0-9]{1,16}$/.test(id))return;
const insertTarget=()=>page==="caso.html"?document.querySelector(".case-main-content"):page==="garimpo.html"?document.querySelector(".garimpo-main"):page==="pericia.html"?document.querySelector("main"):document.getElementById("literary-detail");
const parentOf=el=>el?.parentElement||null;
async function show(){
try{
const url=new URL(root+"/rest/v1/"+encodeURIComponent(table));
url.searchParams.set("select","id,intensidade_conteudo,avisos_conteudo");
url.searchParams.set("id","eq."+id);
url.searchParams.set("status_publicacao","eq.publicado");
url.searchParams.set("limit","1");
const response=await fetch(url.toString(),{headers:{apikey:key,Authorization:"Bearer "+key,Accept:"application/json"}});
if(!response.ok)return;
const data=await response.json(),item=Array.isArray(data)?data[0]:null;if(!item)return;
const level=levelNames[String(item.intensidade_conteudo||"").toLowerCase()];
const warnings=Array.isArray(item.avisos_conteudo)?item.avisos_conteudo.filter(x=>Object.prototype.hasOwnProperty.call(warningNames,x)):[]; 
if(!level&&!warnings.length)return;
const target=insertTarget();if(!target)return;
if(target.querySelector(".as-reader-sensitivity")||parentOf(target)?.querySelector(".as-reader-sensitivity"))return;
const panel=document.createElement("aside");
panel.className="as-reader-sensitivity";
panel.setAttribute("aria-label","Avisos editoriais sobre o conteúdo");
const heading=document.createElement("strong");heading.textContent="Avisos de conteúdo";panel.append(heading);
if(level){const p=document.createElement("p");p.textContent="Intensidade editorial: "+level;panel.append(p);}
if(warnings.length){const p=document.createElement("p");p.textContent="Temas sensíveis: "+warnings.map(x=>warningNames[x]).join(", ")+ ".";panel.append(p);}
const note=document.createElement("small");note.textContent="Classificação editorial informativa. Não substitui a leitura crítica do arquivo.";panel.append(note);
if(page==="lendas.html"||page==="creepypastas.html"){
  // O detalhe é preenchido assincronamente pelo leitor literário.
  const obs=new MutationObserver(()=>{if(target.hidden||!target.querySelector(".archive-literary-title"))return;obs.disconnect();if(!target.querySelector(".as-reader-sensitivity"))target.querySelector(".archive-literary-title")?.after(panel);});
  if(target.querySelector(".archive-literary-title")&&!target.hidden)target.querySelector(".archive-literary-title").after(panel);
  else{obs.observe(target,{childList:true,subtree:true});setTimeout(()=>obs.disconnect(),12000);}
}else target.prepend(panel);
}catch(error){console.warn("Avisos editoriais indisponíveis.",error);}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",show,{once:true});else show();
})();