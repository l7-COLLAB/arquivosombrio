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
      playback_source:old?.playback_source||"polly",
      audio_path:old?.audio_path||null,
      audio_mime:old?.audio_mime||null,
      audio_duration_seconds:old?.audio_duration_seconds||null,
      recorded_at:old?.recorded_at||null,
      recorded_by:old?.recorded_by||null,
      polly_audio_path:old?.polly_audio_path||null,
      polly_voice_id:old?.polly_voice_id||project.polly_voice_id||"Camila",
      polly_engine:old?.polly_engine||project.polly_engine||"standard",
      polly_text_hash:old?.polly_text_hash||null,
      polly_generated_at:old?.polly_generated_at||null,
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
  const humanAvailable=Boolean(b.audio_path);
  const pollyReady=Boolean(b.polly_audio_path&&b.polly_text_hash);
  return '<article class="narration-block" id="narration-block-'+esc(b.id)+'" data-narration-block="'+esc(b.id)+'">'+
    '<header><div><span>BLOCO '+String(b.sort_order).padStart(2,"0")+'</span><h3>'+esc(b.source_label||b.source_type||"Trecho")+'</h3></div>'+statusBadge(b)+'</header>'+
    '<div class="narration-voice-source">'+
      '<label>Voz usada no site<select data-playback-source>'+
        '<option value="polly" '+(b.playback_source!=="human"?"selected":"")+'>Amazon Polly · padrão</option>'+
        '<option value="human" '+(b.playback_source==="human"?"selected":"")+' '+(!humanAvailable?"disabled":"")+'>Minha voz'+(!humanAvailable?" · grave primeiro":"")+'</option>'+
      '</select></label>'+
      '<div class="narration-voice-source-state"><i class="fa-solid '+(b.playback_source==="human"?"fa-microphone":"fa-wave-square")+'"></i><span>'+(b.playback_source==="human"?"MINHA VOZ":"AMAZON POLLY")+'</span></div>'+
    '</div>'+
    '<details class="narration-source"><summary>Ver texto original do dossiê</summary><p>'+esc(b.source_text).replace(/\n/g,"<br>")+'</p></details>'+
    '<label>Texto para narração<textarea rows="6" data-narration-text>'+esc(b.narration_text||b.source_text||"")+'</textarea><small>Este texto é só para a leitura em voz alta. Alterações aqui não mudam o dossiê público.</small></label>'+
    '<section class="narration-polly-box">'+
      '<div><span>AMAZON POLLY</span><strong>'+esc(b.polly_voice_id||"Camila")+' · '+esc((b.polly_engine||"standard").toUpperCase())+'</strong><small>Ritmo 92% · pausas leves · us-east-2</small><small data-polly-state>'+(pollyReady?"Áudio pronto e armazenado":"Ainda não gerado ou precisa ser atualizado")+'</small></div>'+
      '<div class="narration-polly-actions"><button type="button" data-generate-polly><i class="fa-solid fa-wand-magic-sparkles"></i> '+(pollyReady?"Atualizar este bloco":"Gerar somente este bloco")+'</button><button type="button" data-preview-polly '+(!b.polly_audio_path?"disabled":"")+'><i class="fa-solid fa-play"></i> Ouvir</button></div>'+
    '</section>'+
    '<div class="narration-block-actions"><button type="button" data-save-narration-text><i class="fa-regular fa-floppy-disk"></i> Salvar texto falado</button><button type="button" disabled title="Será ativado na etapa de gravação humana"><i class="fa-solid fa-microphone"></i> Gravar minha voz</button></div>'+
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


async function setPlaybackSource(blockId,source){
  const c=client();
  const update=await c.from("narration_blocks").update({playback_source:source,updated_at:new Date().toISOString()}).eq("id",blockId);
  if(update.error)throw update.error;
}

async function invokePolly(blockId,force=false){
  const c=client();
  const {data,error}=await c.functions.invoke("narration-polly",{body:{block_id:blockId,force}});
  if(error)throw error;
  if(data?.error){
    const e=new Error(data.error);
    e.code=data.code;
    throw e;
  }
  return data;
}

function playAudio(url){
  if(!url)return;
  const audio=new Audio(url);
  audio.play().catch(()=>alert("O navegador não conseguiu iniciar o áudio."));
}

async function openProject(panel,dossier){
  panel.querySelector("[data-narration-workspace]").innerHTML='<div class="admin-hub-loading"><i class="fa-solid fa-spinner fa-spin"></i><span>Preparando blocos do dossiê...</span></div>';
  try{
    const project=await syncProject(dossier);
    const [blocks,pron]=await Promise.all([loadBlocks(project.id),loadPronunciations()]);
    const box=panel.querySelector("[data-narration-workspace]");
    box.innerHTML='<section class="narration-project-head"><div><span>NARRAÇÃO DO ARQUIVO</span><h2>'+esc(dossier.titulo||"Dossiê")+'</h2><p>Amazon Polly é a voz padrão. Sua gravação humana só substitui o Polly nos blocos em que você selecionar “Minha voz”.</p></div><div class="narration-project-actions"><button type="button" data-resync-narration><i class="fa-solid fa-rotate"></i> Sincronizar texto</button></div></section>'+
      projectSummary(blocks)+
      '<section class="narration-test-block"><div><span>TESTE INDIVIDUAL</span><strong>Escolha um bloco para gerar com Polly</strong><small>Use um bloco curto primeiro. Assim você testa a voz sem gerar o dossiê inteiro.</small></div><div><select data-test-block>'+blocks.map(b=>'<option value="'+esc(b.id)+'">Bloco '+String(b.sort_order).padStart(2,"0")+' · '+esc(b.source_label||b.source_type||"Trecho")+'</option>').join("")+'</select><button type="button" data-go-test-block><i class="fa-solid fa-arrow-down"></i> Ir ao bloco</button></div></section>'+
      '<div class="narration-layout"><section class="narration-block-list"><div class="narration-section-title"><span>ROTEIRO</span><h3>Blocos de narração</h3></div>'+blocks.map(blockCard).join("")+'</section>'+pronunciationHTML(pron)+'</div>';
    box.querySelector("[data-resync-narration]").onclick=()=>openProject(panel,dossier);
    box.querySelectorAll("[data-save-narration-text]").forEach(btn=>btn.onclick=async()=>{
      const card=btn.closest("[data-narration-block]"),id=card.dataset.narrationBlock,text=card.querySelector("[data-narration-text]").value.trim();
      btn.disabled=true;
      try{
        const r=await client().from("narration_blocks").update({narration_text:text,polly_text_hash:null,updated_at:new Date().toISOString()}).eq("id",id);
        if(r.error)throw r.error;
        card.querySelector("[data-polly-state]").textContent="Texto alterado · atualize o áudio Polly";
        btn.innerHTML='<i class="fa-solid fa-check"></i> Salvo';
        setTimeout(()=>btn.innerHTML='<i class="fa-regular fa-floppy-disk"></i> Salvar texto falado',1300);
      }catch(e){alert(e.message||"Não foi possível salvar o texto.");}
      finally{btn.disabled=false;}
    });

    box.querySelectorAll("[data-playback-source]").forEach(select=>select.onchange=async()=>{
      const card=select.closest("[data-narration-block]"),id=card.dataset.narrationBlock;
      if(select.value==="human"&&select.options[select.selectedIndex]?.disabled){select.value="polly";return;}
      select.disabled=true;
      try{
        await setPlaybackSource(id,select.value);
        const stateEl=card.querySelector(".narration-voice-source-state");
        stateEl.innerHTML=select.value==="human"
          ? '<i class="fa-solid fa-microphone"></i><span>MINHA VOZ</span>'
          : '<i class="fa-solid fa-wave-square"></i><span>AMAZON POLLY</span>';
      }catch(e){alert(e.message||"Não foi possível alterar a voz.");}
      finally{select.disabled=false;}
    });

    box.querySelectorAll("[data-generate-polly]").forEach(btn=>btn.onclick=async()=>{
      const card=btn.closest("[data-narration-block]"),id=card.dataset.narrationBlock,stateEl=card.querySelector("[data-polly-state]"),preview=card.querySelector("[data-preview-polly]");
      btn.disabled=true;stateEl.textContent="Gerando áudio no Amazon Polly...";
      try{
        const data=await invokePolly(id,true);
        stateEl.textContent="Áudio pronto · "+(data.cached?"cache":"gerado agora");
        preview.disabled=false;
        preview.dataset.audioUrl=data.audio_url||"";
        btn.innerHTML='<i class="fa-solid fa-rotate"></i> Atualizar Polly';
      }catch(e){
        if(e.code==="AWS_CREDENTIALS_MISSING")alert("As credenciais da AWS ainda não estão disponíveis para a função.");
        else alert("Não foi possível gerar este bloco com o Amazon Polly. O erro técnico foi registrado no Supabase.");
        stateEl.textContent="Falha ao gerar este bloco";
      }finally{btn.disabled=false;}
    });

    box.querySelectorAll("[data-preview-polly]").forEach(btn=>btn.onclick=async()=>{
      const card=btn.closest("[data-narration-block]"),id=card.dataset.narrationBlock;
      btn.disabled=true;
      try{
        let url=btn.dataset.audioUrl||"";
        if(!url){const data=await invokePolly(id,false);url=data.audio_url||"";btn.dataset.audioUrl=url;}
        playAudio(url);
      }catch(e){alert(e.message||"Não foi possível carregar o áudio Polly.");}
      finally{btn.disabled=false;}
    });

    const testSelect=box.querySelector("[data-test-block]");
    box.querySelector("[data-go-test-block]")?.addEventListener("click",()=>{
      const id=testSelect?.value;
      if(!id)return;
      const card=box.querySelector('[data-narration-block="'+id+'"]');
      card?.scrollIntoView({behavior:"smooth",block:"start"});
      card?.classList.add("is-test-target");
      setTimeout(()=>card?.classList.remove("is-test-target"),1800);
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