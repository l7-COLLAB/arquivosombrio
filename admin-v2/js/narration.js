(function(){
"use strict";

const STATUS_LABELS={nao_gravado:"NÃO GRAVADO",gravado:"GRAVADO",desatualizado:"DESATUALIZADO"};
const STATUS_ICONS={nao_gravado:"fa-circle",gravado:"fa-circle-check",desatualizado:"fa-triangle-exclamation"};

function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function client(){return window.obterClienteAdminIsolado?.()||window.arquivoAdminSupabaseClient||null;}
async function session(){return await window.obterSessaoAdminIsolada?.();}

function textFromValue(v){
  if(v==null)return"";
  if(typeof v==="string"||typeof v==="number")return String(v).trim();
  if(Array.isArray(v))return v.map(textFromValue).filter(Boolean).join("\n\n");
  if(typeof v==="object"){
    const preferred=["texto","titulo","descricao","data","ano","periodo","conteudo","nome","classificacao","explicacao"];
    const vals=[];
    preferred.forEach(k=>{if(v[k]!=null){const t=textFromValue(v[k]);if(t&&!vals.includes(t))vals.push(t);}});
    if(vals.length)return vals.join(" — ");
    return Object.values(v).map(textFromValue).filter(Boolean).join(" ");
  }
  return"";
}

function sourceBlocks(d){
  const out=[];
  if(String(d.resumo||"").trim())out.push({key:"resumo",type:"resumo",label:"Resumo / abertura",text:String(d.resumo).trim()});
  const blocks=Array.isArray(d.conteudo_blocos)?d.conteudo_blocos:[];
  if(blocks.length){
    blocks.forEach((b,i)=>{
      const type=String(b?.tipo||"paragrafo");
      if(["imagem","documento","video"].includes(type))return;
      let txt="";
      if(type==="subtitulo"||type==="paragrafo")txt=textFromValue(b?.dados?.texto||b?.texto||b?.dados);
      else txt=textFromValue(b?.dados?.itens||b?.dados?.texto||b?.dados||b);
      if(!txt.trim())return;
      const labels={subtitulo:"Subtítulo",paragrafo:"Narrativa",cronologia:"Cronologia",evidencias:"Evidências",hipoteses:"Hipóteses e controvérsias",situacao_oficial:"Situação oficial",fontes:"Fontes"};
      out.push({key:"bloco:"+(b?.id||i),type,label:labels[type]||type,text:txt.trim()});
    });
  }else if(String(d.historia||"").trim()){
    String(d.historia).split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean).forEach((txt,i)=>{
      const sub=txt.startsWith("## ");
      out.push({key:"historia:"+i,type:sub?"subtitulo":"paragrafo",label:sub?"Subtítulo":"Narrativa",text:sub?txt.replace(/^##\s+/,""):txt});
    });
  }
  if(Array.isArray(d.evidencias)&&d.evidencias.length&&!blocks.some(b=>b?.tipo==="evidencias")){
    out.push({key:"evidencias",type:"evidencias",label:"Evidências",text:textFromValue(d.evidencias)});
  }
  if(Array.isArray(d.teorias)&&d.teorias.length&&!blocks.some(b=>b?.tipo==="hipoteses")){
    out.push({key:"teorias",type:"hipoteses",label:"Hipóteses e controvérsias",text:textFromValue(d.teorias)});
  }
  return out.map((x,i)=>({...x,order:i+1}));
}

async function getProject(dossierId){
  const c=client(); if(!c)throw Error("Supabase indisponível.");
  const {data,error}=await c.from("narration_projects").select("*").eq("dossier_id",dossierId).maybeSingle();
  if(error)throw error; return data||null;
}

async function syncProject(dossier){
  const c=client(),s=await session(); if(!c||!s?.user)throw Error("Sessão administrativa inválida.");
  let project=await getProject(dossier.id);
  if(!project){
    const ins=await c.from("narration_projects").insert({
      dossier_id:dossier.id,narrator_id:s.user.id,status:"preparacao",source_updated_at:dossier.updated_at||null
    }).select().single();
    if(ins.error)throw ins.error; project=ins.data;
  }else{
    const up=await c.from("narration_projects").update({
      narrator_id:project.narrator_id||s.user.id,source_updated_at:dossier.updated_at||null,updated_at:new Date().toISOString()
    }).eq("id",project.id).select().single();
    if(up.error)throw up.error; project=up.data;
  }

  const source=sourceBlocks(dossier);
  const ex=await c.from("narration_blocks").select("*").eq("project_id",project.id);
  if(ex.error)throw ex.error;
  const existing=new Map((ex.data||[]).map(x=>[x.block_key,x]));
  const activeKeys=new Set(source.map(x=>x.key));

  const payload=source.map(b=>{
    const old=existing.get(b.key);
    const changed=old&&String(old.source_text||"")!==b.text;
    return {
      project_id:project.id,
      block_key:b.key,
      sort_order:b.order,
      source_type:b.type,
      source_label:b.label,
      source_text:b.text,
      narration_text:old?.narration_text?.trim()?old.narration_text:b.text,
      status:changed&&old?.audio_path?"desatualizado":old?.status||"nao_gravado",
      audio_path:old?.audio_path||null,
      audio_mime:old?.audio_mime||null,
      audio_duration_seconds:old?.audio_duration_seconds||null,
      recorded_at:old?.recorded_at||null,
      recorded_by:old?.recorded_by||null,
      updated_at:new Date().toISOString()
    };
  });
  if(payload.length){
    const up=await c.from("narration_blocks").upsert(payload,{onConflict:"project_id,block_key"});
    if(up.error)throw up.error;
  }

  for(const old of (ex.data||[])){
    if(activeKeys.has(old.block_key))continue;
    if(old.audio_path){
      await c.from("narration_blocks").update({
        status:"desatualizado",
        source_label:"Trecho removido do dossiê",
        updated_at:new Date().toISOString()
      }).eq("id",old.id);
    }else{
      await c.from("narration_blocks").delete().eq("id",old.id);
    }
  }
  return project;
}

async function loadBlocks(projectId){
  const c=client();
  const {data,error}=await c.from("narration_blocks").select("*").eq("project_id",projectId).order("sort_order",{ascending:true});
  if(error)throw error; return data||[];
}

async function loadPronunciations(){
  const c=client();
  const {data,error}=await c.from("narration_pronunciations").select("*").order("term",{ascending:true});
  if(error)throw error; return data||[];
}

function statusBadge(b){
  return '<span class="narration-status narration-status--'+esc(b.status)+'"><i class="fa-solid '+(STATUS_ICONS[b.status]||"fa-circle")+'"></i> '+esc(STATUS_LABELS[b.status]||b.status)+'</span>';
}

function blockCard(b){
  return '<article class="narration-block" data-narration-block="'+esc(b.id)+'">'+
    '<header><div><span>BLOCO '+String(b.sort_order).padStart(2,"0")+'</span><h3>'+esc(b.source_label||b.source_type||"Trecho")+'</h3></div>'+statusBadge(b)+'</header>'+
    '<details class="narration-source"><summary>Ver texto original do dossiê</summary><p>'+esc(b.source_text).replace(/\n/g,"<br>")+'</p></details>'+
    '<label>Texto para narração<textarea rows="6" data-narration-text>'+esc(b.narration_text||b.source_text||"")+'</textarea><small>Este texto é só para a leitura em voz alta. Alterações aqui não mudam o dossiê público.</small></label>'+
    '<div class="narration-block-actions"><button type="button" data-save-narration-text><i class="fa-regular fa-floppy-disk"></i> Salvar texto falado</button><button type="button" disabled title="Será ativado na próxima etapa"><i class="fa-solid fa-microphone"></i> Gravar bloco</button></div>'+
  '</article>';
}

function projectSummary(blocks){
  const counts={nao_gravado:0,gravado:0,desatualizado:0};
  blocks.forEach(b=>counts[b.status]=(counts[b.status]||0)+1);
  return '<div class="narration-summary">'+
    '<div><strong>'+blocks.length+'</strong><span>blocos</span></div>'+
    '<div><strong>'+counts.nao_gravado+'</strong><span>não gravados</span></div>'+
    '<div><strong>'+counts.gravado+'</strong><span>gravados</span></div>'+
    '<div><strong>'+counts.desatualizado+'</strong><span>desatualizados</span></div>'+
  '</div>';
}

function pronunciationHTML(items){
  return '<section class="narration-pronunciation"><header><div><span>DICIONÁRIO DE VOZ</span><h3>Pronúncias especiais</h3><p>Cadastre nomes e termos difíceis para consultar durante a gravação.</p></div><button type="button" data-add-pronunciation><i class="fa-solid fa-plus"></i> Adicionar</button></header>'+
  '<div data-pronunciation-list>'+(items.length?items.map(x=>'<div class="narration-pronunciation-row" data-pronunciation-id="'+esc(x.id)+'"><input data-term value="'+esc(x.term)+'" aria-label="Termo"><span>→</span><input data-pronunciation value="'+esc(x.pronunciation)+'" aria-label="Pronúncia"><button type="button" data-save-pronunciation>Salvar</button><button type="button" class="danger" data-delete-pronunciation>×</button></div>').join(""):'<p class="narration-empty-pronunciation">Nenhuma pronúncia cadastrada.</p>')+'</div></section>';
}

async function wirePronunciations(panel){
  panel.querySelector("[data-add-pronunciation]")?.addEventListener("click",()=>{
    const list=panel.querySelector("[data-pronunciation-list]");
    list.querySelector(".narration-empty-pronunciation")?.remove();
    const row=document.createElement("div");
    row.className="narration-pronunciation-row";
    row.innerHTML='<input data-term placeholder="Ex.: DeAngelo" aria-label="Termo"><span>→</span><input data-pronunciation placeholder="Ex.: di Ânjelo" aria-label="Pronúncia"><button type="button" data-save-pronunciation>Salvar</button><button type="button" class="danger" data-delete-pronunciation>×</button>';
    list.prepend(row); wirePronunciationRow(row);
  });
  panel.querySelectorAll(".narration-pronunciation-row").forEach(wirePronunciationRow);
}

function wirePronunciationRow(row){
  row.querySelector("[data-save-pronunciation]")?.addEventListener("click",async()=>{
    const c=client(),s=await session(),term=row.querySelector("[data-term]").value.trim(),pron=row.querySelector("[data-pronunciation]").value.trim();
    if(!term||!pron)return alert("Informe o termo e a pronúncia.");
    const id=row.dataset.pronunciationId;
    const q=id
      ? await c.from("narration_pronunciations").update({term,pronunciation:pron,updated_at:new Date().toISOString()}).eq("id",id).select().single()
      : await c.from("narration_pronunciations").insert({term,pronunciation:pron,created_by:s?.user?.id||null}).select().single();
    if(q.error)return alert(q.error.message);
    row.dataset.pronunciationId=q.data.id; alert("Pronúncia salva.");
  });
  row.querySelector("[data-delete-pronunciation]")?.addEventListener("click",async()=>{
    const id=row.dataset.pronunciationId;
    if(id&&!confirm("Excluir esta pronúncia?"))return;
    if(id){const r=await client().from("narration_pronunciations").delete().eq("id",id);if(r.error)return alert(r.error.message);}
    row.remove();
  });
}

async function openProject(panel,dossier){
  panel.querySelector("[data-narration-workspace]").innerHTML='<div class="admin-hub-loading"><i class="fa-solid fa-spinner fa-spin"></i><span>Preparando blocos do dossiê...</span></div>';
  try{
    const project=await syncProject(dossier);
    const [blocks,pron]=await Promise.all([loadBlocks(project.id),loadPronunciations()]);
    const box=panel.querySelector("[data-narration-workspace]");
    box.innerHTML='<section class="narration-project-head"><div><span>NARRAÇÃO DO ARQUIVO</span><h2>'+esc(dossier.titulo||"Dossiê")+'</h2><p>Texto sincronizado com o dossiê. Você pode adaptar cada trecho para a fala sem alterar a publicação escrita.</p></div><button type="button" data-resync-narration><i class="fa-solid fa-rotate"></i> Sincronizar texto</button></section>'+
      projectSummary(blocks)+
      '<div class="narration-layout"><section class="narration-block-list"><div class="narration-section-title"><span>ROTEIRO</span><h3>Blocos de narração</h3></div>'+blocks.map(blockCard).join("")+'</section>'+pronunciationHTML(pron)+'</div>';
    box.querySelector("[data-resync-narration]").onclick=()=>openProject(panel,dossier);
    box.querySelectorAll("[data-save-narration-text]").forEach(btn=>btn.onclick=async()=>{
      const card=btn.closest("[data-narration-block]"),id=card.dataset.narrationBlock,text=card.querySelector("[data-narration-text]").value.trim();
      btn.disabled=true;
      try{const r=await client().from("narration_blocks").update({narration_text:text,updated_at:new Date().toISOString()}).eq("id",id);if(r.error)throw r.error;btn.innerHTML='<i class="fa-solid fa-check"></i> Salvo';setTimeout(()=>btn.innerHTML='<i class="fa-regular fa-floppy-disk"></i> Salvar texto falado',1300);}
      catch(e){alert(e.message||"Não foi possível salvar o texto.");}
      finally{btn.disabled=false;}
    });
    wirePronunciations(box);
  }catch(e){
    panel.querySelector("[data-narration-workspace]").innerHTML='<div class="admin-hub-error"><i class="fa-solid fa-triangle-exclamation"></i><p>'+esc(e.message||"Não foi possível preparar a narração.")+'</p></div>';
  }
}

async function render(panel){
  const c=client(); if(!c)throw Error("Supabase indisponível.");
  const r=await c.from("Casos").select("id,titulo,categoria,status_publicacao,resumo,historia,conteudo_blocos,evidencias,teorias,updated_at").order("titulo",{ascending:true});
  if(r.error)throw r.error;
  const dossiers=r.data||[];
  const projects=await c.from("narration_projects").select("dossier_id,status");
  if(projects.error)throw projects.error;
  const projectMap=new Map((projects.data||[]).map(x=>[String(x.dossier_id),x]));

  panel.innerHTML='<div class="admin-hub-section-heading"><div><span>ÁUDIO DOCUMENTAL</span><h2>Narração do Arquivo</h2><p>Prepare o roteiro falado dos dossiês e acompanhe o que ainda precisa ser gravado.</p></div></div>'+
    '<section class="narration-picker"><label>Selecionar dossiê<select data-narration-dossier><option value="">Escolha um dossiê</option>'+dossiers.map(d=>'<option value="'+d.id+'">'+esc(d.titulo)+(projectMap.has(String(d.id))?' · projeto criado':'')+'</option>').join("")+'</select></label><button type="button" data-open-narration disabled><i class="fa-solid fa-microphone-lines"></i> Preparar narração</button></section>'+
    '<div class="narration-notice"><i class="fa-solid fa-headphones"></i><div><strong>Etapa atual</strong><p>Roteiro, sincronização, texto falado, estados de gravação e dicionário de pronúncias. A gravação pelo navegador entra na próxima etapa.</p></div></div>'+
    '<div data-narration-workspace><div class="admin-hub-empty"><i class="fa-solid fa-microphone-lines"></i><p>Selecione um dossiê para iniciar ou continuar a preparação da narração.</p></div></div>';

  const select=panel.querySelector("[data-narration-dossier]"),button=panel.querySelector("[data-open-narration]");
  select.onchange=()=>button.disabled=!select.value;
  button.onclick=()=>{const d=dossiers.find(x=>String(x.id)===String(select.value));if(d)openProject(panel,d);};
  const activeProjects=(projects.data||[]).filter(x=>x.status!=="arquivada").length;
  const badge=document.querySelector('[data-admin-hub-count="narration"]');if(badge)badge.textContent=activeProjects?String(activeProjects):"";
}

window.ArquivoNarracao={render};
})();