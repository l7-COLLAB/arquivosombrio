(function(){
"use strict";
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=t=>{if(!Number.isFinite(Number(t)))return "—";const n=Math.floor(Number(t));return (n>=3600?Math.floor(n/3600)+":":"")+String(Math.floor(n%3600/60)).padStart(n>=3600?2:1,"0")+":"+String(n%60).padStart(2,"0");};
async function durationOf(file){
 return new Promise(resolve=>{
  const player=document.createElement("audio"),url=URL.createObjectURL(file);
  let done=false;const finish=n=>{if(done)return;done=true;URL.revokeObjectURL(url);player.removeAttribute("src");player.load();resolve(n)};
  player.preload="metadata";
  player.onloadedmetadata=()=>finish(Number.isFinite(player.duration)?player.duration:null);
  player.onerror=()=>finish(null);player.src=url;
 });
}
async function mount({target,dossier,project,client}){
 if(!target||!project?.id||!client)return;
 const api=async(action,values={})=>{
  const {data,error}=await client.functions.invoke("human-narration-studio",{body:{action,project_id:project.id,...values}});
  if(error){let detail=data?.error;try{detail=(await error.context?.json?.())?.error||detail;}catch(_){}throw Error(detail||error.message);}
  if(data?.error)throw Error(data.error);
  return data;
 };
 let current=null,operation=false;
 target.className="human-voice-studio";
 target.innerHTML=`
 <style>
 .human-voice-studio{border:1px solid #796044;border-radius:10px;margin:0 0 24px;padding:clamp(12px,2vw,24px);background:#17120f;color:#eee2d2}
 .human-voice-studio *{box-sizing:border-box}
 .human-voice-studio h3,.human-voice-studio h4{margin:0 0 7px;color:#f0d1a7}
 .human-voice-studio p,.human-voice-studio small{color:#b7a898;line-height:1.6}
 .human-voice-studio .hv-heading{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap}
 .human-voice-studio .hv-badge{font-size:11px;color:#eacb95;border:1px solid #856a4b;padding:4px 9px;border-radius:20px}
 .human-voice-studio .hv-bar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:15px 0}
 .human-voice-studio input,.human-voice-studio textarea{width:100%;max-width:100%;background:#110e0b;border:1px solid #695640;color:#f2eadb;padding:9px;border-radius:5px}
 .human-voice-studio label{font-size:13px;display:grid;gap:5px;color:#d9c6aa}
 .human-voice-studio input[type=number]{width:90px}
 .human-voice-studio button{cursor:pointer;border:1px solid #8f704c;background:#302318;color:#efdfc9;padding:9px 12px;border-radius:5px;min-height:38px}
 .human-voice-studio button:hover:not(:disabled){background:#4a3524}
 .human-voice-studio button:disabled{opacity:.45;cursor:not-allowed}
 .human-voice-studio button.hv-primary{background:#866443;color:#fff9ee;border-color:#aa8860}
 .human-voice-studio button.hv-danger{border-color:#925858;color:#f2b0a7}
 .human-voice-studio .hv-part{margin:13px 0;padding:14px;border:1px solid #47382c;border-radius:7px}
 .human-voice-studio .hv-part-top{display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap}
 .human-voice-studio .hv-part-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:10px}
 .human-voice-studio .hv-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
 .human-voice-studio textarea{min-height:80px;resize:vertical}
 .human-voice-studio .hv-feedback{min-height:1.5rem}
 .human-voice-studio audio{display:block;width:100%;margin:10px 0}
 .human-voice-studio .hv-publish{padding:15px;border:1px solid #68523b;border-radius:6px;margin-top:16px}
 .human-voice-studio .hv-muted{color:#b7a898}
 @media(min-width:700px){.human-voice-studio .hv-part-grid{grid-template-columns:1fr 1.3fr}}
 </style>
 <div class="hv-heading"><div><small>GRAVAÇÃO COM SUA PRÓPRIA VOZ</small><h3>Estúdio de Narração Humana</h3>
 <p>Grave em partes, envie MP3s e publique tudo junto. O roteiro falado pode ser diferente do texto do artigo.</p></div>
 <span class="hv-badge" data-hv-state>Rascunho privado</span></div>
 <div class="hv-bar"><label>Quantidade planejada de partes<input type="number" min="1" max="60" data-hv-count value="1"></label>
 <button type="button" data-hv-count-save>Definir quantidade</button><span data-hv-progress class="hv-muted"></span></div>
 <div data-hv-list><p>Carregando partes...</p></div>
 <div class="hv-bar"><input type="text" data-hv-new-title placeholder="Ex.: Abertura e apresentação" maxlength="180" aria-label="Título da nova parte">
 <button type="button" data-hv-add>Adicionar parte</button></div>
 <div class="hv-publish"><h4>Publicação</h4><p data-hv-pubinfo>Este áudio ainda não está disponível ao público.</p>
 <div class="hv-actions"><button type="button" data-hv-publish class="hv-primary" disabled>Publicar narração completa</button>
 <button type="button" data-hv-unpublish class="hv-danger" hidden>Retirar narração humana do ar</button></div></div>
 <p class="hv-feedback" data-hv-feedback role="status" aria-live="polite"></p>
 <audio controls preload="none" data-hv-player hidden></audio>`;
 const $=sel=>target.querySelector(sel), feedback=$("[data-hv-feedback]"), player=$("[data-hv-player]");
 const inform=(text,error=false)=>{feedback.textContent=text;feedback.style.color=error?"#eab0a1":"#b9d5b8";};
 const busy=(state)=>{operation=state;target.querySelectorAll("button").forEach(btn=>btn.disabled=state||Boolean(btn.dataset.hvPublish!==undefined&&btn.dataset.hvBlocked==="true"));};
 async function refresh(){
  const loaded=await api("state");current=loaded;render();return loaded;
 }
 function render(){
  const list=$("[data-hv-list]"),parts=current.parts||[],ready=parts.filter(p=>p.status==="ready"&&p.audio_path).length;
  $("[data-hv-count]").value=current.expected_parts;
  $("[data-hv-progress]").textContent=ready+" de "+current.expected_parts+" partes aprovadas";
  $("[data-hv-state]").textContent=current.published?(current.published.stale?"Revisão necessária":"Publicado · edição privada"):"Rascunho privado";
  const info=$("[data-hv-pubinfo]");
  info.textContent=current.published
   ?(current.published.stale?"O texto do arquivo foi atualizado após a publicação do áudio. Ouça e publique novamente após conferir os fatos. O áudio humano ficará indisponível até essa revisão."
    :"Versão pública: "+current.published.parts_count+" partes · "+fmt(current.published.total_seconds)+". Alterações neste rascunho não modificam a versão publicada.")
   :"Nenhuma narração humana liberada. Outros motores de áudio, caso existentes, continuam independentes.";
  const publish=$("[data-hv-publish]");
  const canPublish=parts.length===Number(current.expected_parts)&&parts.length>0&&ready===parts.length;
  publish.disabled=!canPublish;
  publish.dataset.hvBlocked=String(!canPublish);
  publish.textContent=current.published?"Publicar nova versão completa":"Publicar narração completa";
  $("[data-hv-unpublish]").hidden=!current.published;
  list.replaceChildren();
  if(!parts.length){const p=document.createElement("p");p.textContent="Nenhuma parte criada. Defina quantas deseja e adicione a primeira.";list.appendChild(p);}
  parts.forEach((part,index)=>{
   const section=document.createElement("section");section.className="hv-part";section.dataset.partId=part.id;
   section.innerHTML=`
   <div class="hv-part-top"><h4>Parte ${index+1} <span class="hv-muted">· ${part.audio_path?fmt(part.duration_seconds):"sem MP3"}</span></h4>
   <small>${part.status==="ready"?"✓ Aprovada":part.audio_path?"MP3 recebido · aguardando aprovação":"Ainda não gravada"}</small></div>
   <div class="hv-part-grid">
   <label>Título da parte<input data-part-title value="${esc(part.title)}" maxlength="180"></label>
   <label>Roteiro ou lembretes de gravação<textarea data-part-script rows="3" placeholder="Escreva como deseja contar esta parte. Não altera o texto do site.">${esc(part.script_notes)}</textarea></label></div>
   <div class="hv-actions"><button type="button" data-part-save>Salvar texto</button>
   <button type="button" data-part-up ${index===0?"disabled":""} aria-label="Mover parte para cima">↑</button>
   <button type="button" data-part-down ${index===parts.length-1?"disabled":""} aria-label="Mover parte para baixo">↓</button>
   <label>Arquivo MP3<input type="file" data-part-file accept=".mp3,audio/mpeg" aria-label="Enviar áudio da parte ${index+1}"></label>
   <button type="button" data-part-upload>Enviar MP3</button>
   <button type="button" data-part-play ${!part.audio_path?"disabled":""}>Ouvir</button>
   <button type="button" data-part-approve ${!part.audio_path||part.status==="ready"?"disabled":""}>Aprovar parte</button>
   <button type="button" data-part-remove class="hv-danger">Excluir parte</button></div>`;
   list.appendChild(section);
   const task=async(fn)=>{if(operation)return;busy(true);try{await fn();await refresh();inform("Alterações salvas. A versão pública não foi modificada.");}catch(e){inform(e.message||String(e),true);}finally{busy(false)}};
   section.querySelector("[data-part-save]").onclick=()=>task(()=>api("edit",{part_id:part.id,title:section.querySelector("[data-part-title]").value,script_notes:section.querySelector("[data-part-script]").value}));
   section.querySelector("[data-part-up]").onclick=()=>task(()=>api("move",{part_id:part.id,direction:"up"}));
   section.querySelector("[data-part-down]").onclick=()=>task(()=>api("move",{part_id:part.id,direction:"down"}));
   section.querySelector("[data-part-remove]").onclick=()=>{
    if(!confirm("Excluir esta parte do rascunho? Versões já publicadas não serão alteradas."))return;
    task(()=>api("remove",{part_id:part.id}));
   };
   section.querySelector("[data-part-play]").onclick=async()=>{
    if(operation)return;try{
     const preview=await api("preview",{part_id:part.id});
     player.hidden=false;player.src=preview.url;await player.play();
     inform("Prévia privada da parte "+(index+1)+".");
    }catch(e){inform(e.message||"Falha ao reproduzir",true);}
   };
   section.querySelector("[data-part-approve]").onclick=()=>task(()=>api("approve_part",{part_id:part.id}));
   section.querySelector("[data-part-upload]").onclick=()=>task(async()=>{
    const file=section.querySelector("[data-part-file]").files?.[0];
    if(!file||!/\.mp3$/i.test(file.name))throw Error("Selecione um MP3 para esta parte.");
    if(file.size<1024||file.size>30*1024*1024)throw Error("Cada MP3 deve ter até 30 MB.");
    const duration=await durationOf(file);
    if(!duration||duration<=0)throw Error("Não foi possível reconhecer a duração. Verifique o arquivo MP3.");
    inform("Enviando parte "+(index+1)+" para o armazenamento privado...");
    const init=await api("init_upload",{part_id:part.id,size:file.size,duration_seconds:duration});
    let sent=false;
    try{const put=await fetch(init.upload_url,{method:"PUT",headers:{"Content-Type":"audio/mpeg"},body:file});sent=put.ok;}
    catch(_){}
    if(!sent){
     if(file.size>10*1024*1024)throw Error("Envio direto ao R2 indisponível. Use MP3 até 10 MB ou revise a configuração de CORS.");
     inform("Usando envio alternativo seguro...");
     const bytes=new Uint8Array(await file.arrayBuffer());let binary="";
     for(let offset=0;offset<bytes.length;offset+=8192)binary+=String.fromCharCode(...bytes.subarray(offset,offset+8192));
     await api("proxy_upload",{part_id:part.id,upload_id:init.upload_id,base64:btoa(binary)});
    }
    await api("finish_upload",{part_id:part.id,upload_id:init.upload_id});
    inform("MP3 recebido. Ouça e clique em Aprovar parte.");
   });
  });
 }
 $("[data-hv-count-save]").onclick=async()=>{
  if(operation)return;busy(true);try{const n=Number($("[data-hv-count]").value);await api("set_count",{expected_parts:n});await refresh();inform("Planejamento atualizado.");}catch(e){inform(e.message||String(e),true)}finally{busy(false)}
 };
 $("[data-hv-add]").onclick=async()=>{
  if(operation)return;busy(true);try{
   await api("add",{title:$("[data-hv-new-title]").value});$("[data-hv-new-title]").value="";
   await refresh();inform("Parte criada como rascunho.");
  }catch(e){inform(e.message||String(e),true)}finally{busy(false)}
 };
 $("[data-hv-publish]").onclick=async()=>{
  if(operation||!current)return;
  if(!confirm("Publicar agora todas as "+current.expected_parts+" partes aprovadas? Elas ficarão disponíveis para leitores autenticados."))return;
  busy(true);try{await api("publish");await refresh();inform("Versão de narração humana publicada no banco. Confirme o deploy da função pública antes de considerar a liberação no site.");}
  catch(e){inform(e.message||String(e),true)}finally{busy(false)}
 };
 $("[data-hv-unpublish]").onclick=async()=>{
  if(operation||!confirm("Retirar a versão humana do ar? Outros áudios aprovados poderão continuar disponíveis."))return;
  busy(true);try{await api("unpublish");await refresh();inform("Narração humana retirada do ar. Outras fontes de áudio foram preservadas.");}
  catch(e){inform(e.message||String(e),true)}finally{busy(false)}
 };
 try{await refresh();inform("Seu espaço de gravação foi carregado. Nenhuma parte é publicada automaticamente.");}
 catch(e){inform("Não foi possível carregar o Estúdio de Narração Humana: "+(e.message||e),true)}
}
window.ArquivoHumanVoiceStudio={mount};
})();