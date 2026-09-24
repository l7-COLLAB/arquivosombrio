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
  const type=String(d.__contentType||"dossie");
  const out=[];
  const push=(key,sourceType,label,value)=>{
    const text=textFromValue(value).trim();
    if(text)out.push({key,type:sourceType,label,text});
  };
  const pushParagraphs=(prefix,label,value)=>{
    const text=String(value||"").trim();
    if(!text)return;
    text.split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean).forEach((txt,i)=>{
      const sub=txt.startsWith("## ");
      out.push({key:prefix+":"+i,type:sub?"subtitulo":"paragrafo",label:sub?"Subtítulo":label,text:sub?txt.replace(/^##\s+/,""):txt});
    });
  };
  const blocks=Array.isArray(d.conteudo_blocos)?d.conteudo_blocos:[];

  push("titulo","titulo","Título",d.titulo);

  if(type!=="garimpo")push("resumo","resumo","Resumo / abertura",d.resumo);

  if(type==="dossie"){
    if(blocks.length){
      blocks.forEach((b,i)=>{
        const bt=String(b?.tipo||"paragrafo");
        if(["imagem","documento","video","fontes"].includes(bt))return;
        let txt="";
        if(bt==="subtitulo"||bt==="paragrafo")txt=textFromValue(b?.dados?.texto||b?.texto||b?.dados);
        else txt=textFromValue(b?.dados?.itens||b?.dados?.texto||b?.dados||b);
        if(!txt.trim())return;
        const labels={subtitulo:"Subtítulo",paragrafo:"Narrativa",cronologia:"Cronologia",evidencias:"Evidências",hipoteses:"Hipóteses e controvérsias",situacao_oficial:"Situação oficial"};
        out.push({key:"bloco:"+(b?.id||i),type:bt,label:labels[bt]||bt,text:txt.trim()});
      });
    }else{
      pushParagraphs("historia","Narrativa",d.historia);
    }
    if(!blocks.some(b=>b?.tipo==="evidencias"))push("evidencias","evidencias","Evidências",d.evidencias);
    if(!blocks.some(b=>b?.tipo==="hipoteses"))push("teorias","hipoteses","Hipóteses e controvérsias",d.teorias);
  }

  if(type==="garimpo"){
    pushParagraphs("conteudo","Narrativa",d.conteudo);
    push("cronologia","cronologia","Cronologia",d.cronologia);
    push("evidencias","evidencias","Evidências",d.evidencias);
    push("hipoteses","hipoteses","Hipóteses e controvérsias",d.hipoteses);
    push("situacao","situacao_oficial","Situação oficial",d.situacao_oficial);
  }

  if(type==="pericia"){
    push("introducao","introducao","Introdução",d.introducao);
    push("tecnica","tecnica","Técnica / como funciona",d.como_funciona);
    push("historia_tecnica","historia_tecnica","História da técnica",d.historia_tecnica);
    push("aplicacao","aplicacao","Aplicações e casos reais",d.aplicacao_casos_reais);
    push("limitacoes","limitacoes","Limitações e controvérsias",d.limitacoes_controversias);
    push("curiosidades","curiosidades","Curiosidades",d.curiosidades);
    push("casos_relacionados","casos_relacionados","Casos relacionados",d.casos_relacionados);
  }

  if(type==="lenda"){
    push("introducao","introducao","Introdução",d.introducao);
    if(blocks.length){
      blocks.forEach((b,i)=>{
        const bt=String(b?.tipo||"paragrafo");
        if(["imagem","documento","video","fontes"].includes(bt))return;
        const txt=textFromValue(b?.dados?.texto||b?.dados?.itens||b?.texto||b?.dados);
        if(txt.trim())out.push({key:"bloco:"+(b?.id||i),type:bt,label:bt==="subtitulo"?"Subtítulo":"Narrativa",text:txt.trim()});
      });
    }else pushParagraphs("conteudo","Narrativa",d.conteudo);
    push("contexto","contexto","Contexto histórico",d.contexto_historico);
    push("versoes","versoes","Versões",d.versoes||d.versoes_itens);
    push("elementos_reais","elementos_reais","Elementos reais",d.elementos_reais);
    push("afirmacoes","afirmacoes","Afirmações",d.afirmacoes_blocos);
    push("documentado","documentado","O que é documentado",d.documentado_blocos);
    push("origem","origem","Origem e evolução",d.origem_evolucao_blocos);
    push("hipoteses","hipoteses","Hipóteses",d.hipoteses);
    push("cronologia","cronologia","Cronologia",d.cronologia);
    push("conclusao","conclusao","Conclusão do arquivo",d.conclusao_arquivo);
  }

  if(type==="creepypasta"){
    push("introducao","introducao","Introdução",d.introducao);
    if(blocks.length){
      blocks.forEach((b,i)=>{
        const bt=String(b?.tipo||"paragrafo");
        if(["imagem","documento","video","fontes"].includes(bt))return;
        const txt=textFromValue(b?.dados?.texto||b?.dados?.itens||b?.texto||b?.dados);
        if(txt.trim())out.push({key:"bloco:"+(b?.id||i),type:bt,label:bt==="subtitulo"?"Subtítulo":"Narrativa",text:txt.trim()});
      });
    }else pushParagraphs("conteudo","Narrativa",d.conteudo);
    push("bastidores","bastidores","Bastidores",d.bastidores_blocos);
    push("realidade_ficcao","realidade_ficcao","Realidade ou ficção",d.realidade_ficcao);
    push("nota_editorial","nota_editorial","Nota editorial",d.nota_editorial);
  }

  return out.map((x,i)=>({...x,order:i+1}));
}

async function getProject(contentType,contentId){
  const c=client();
  if(!c)throw Error("Supabase indisponível.");
  const {data,error}=await c.from("narration_projects")
    .select("*")
    .eq("content_type",contentType)
    .eq("content_id",contentId)
    .maybeSingle();
  if(error)throw error;
  return data||null;
}

async function adaptarBlocosPollyAutomaticamente(projectId){
  const c=client();
  const q=await c.from("narration_blocks")
    .select("id,polly_text,polly_text_mode,polly_text_source_hash,narration_text,source_text")
    .eq("project_id",projectId)
    .order("sort_order",{ascending:true});
  if(q.error)throw q.error;

  const pendentes=(q.data||[]).filter(b=>{
    if(b.polly_text_mode==="manual")return false;
    const texto=String(b.narration_text||b.source_text||"").trim();
    if(!texto)return false;
    return true;
  });

  const tamanhoLote=4;
  for(let i=0;i<pendentes.length;i+=tamanhoLote){
    const lote=pendentes.slice(i,i+tamanhoLote);
    await Promise.allSettled(
      lote.map(b=>invokePolly(b.id,false,"regenerate_polly_text"))
    );
  }
}

async function syncProject(dossier){
  const c=client(),s=await session(); if(!c||!s?.user)throw Error("Sessão administrativa inválida.");
  const contentType=String(dossier.__contentType||"dossie");
  let project=await getProject(contentType,dossier.id);
  if(!project){
    const ins=await c.from("narration_projects").insert({
      dossier_id:contentType==="dossie"?dossier.id:null,
      content_type:contentType,
      content_id:dossier.id,
      narrator_id:s.user.id,
      status:"preparacao",
      source_updated_at:dossier.updated_at||dossier.publicado_em||dossier.created_at||null
    }).select().single();
    if(ins.error)throw ins.error; project=ins.data;
  }else{
    const up=await c.from("narration_projects").update({
      narrator_id:project.narrator_id||s.user.id,source_updated_at:dossier.updated_at||dossier.publicado_em||dossier.created_at||null,updated_at:new Date().toISOString()
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
    const changed=Boolean(old&&String(old.source_text||"")!==b.text);
    const oldNarration=String(old?.narration_text||"").trim();
    const oldSource=String(old?.source_text||"").trim();
    const narrationWasAutomatic=!oldNarration||oldNarration===oldSource;
    const nextNarration=changed&&narrationWasAutomatic?b.text:(oldNarration||b.text);
    const invalidatePolly=changed || nextNarration!==oldNarration;
    const autoPolly=(old?.polly_text_mode||"auto")!=="manual";

    return {
      project_id:project.id,
      block_key:b.key,
      sort_order:b.order,
      source_type:b.type,
      source_label:b.label,
      source_text:b.text,
      narration_text:nextNarration,
      status:changed?"desatualizado":old?.status||"nao_gravado",
      playback_source:old?.playback_source||"polly",
      audio_path:old?.audio_path||null,
      audio_mime:old?.audio_mime||null,
      audio_duration_seconds:old?.audio_duration_seconds||null,
      recorded_at:old?.recorded_at||null,
      recorded_by:old?.recorded_by||null,
      polly_text:invalidatePolly&&autoPolly?null:(old?.polly_text||null),
      polly_text_mode:old?.polly_text_mode||"auto",
      polly_text_source_hash:invalidatePolly&&autoPolly?null:(old?.polly_text_source_hash||null),
      polly_text_generated_at:invalidatePolly&&autoPolly?null:(old?.polly_text_generated_at||null),
      polly_audio_path:invalidatePolly?null:(old?.polly_audio_path||null),
      polly_voice_id:old?.polly_voice_id||project.polly_voice_id||"Camila",
      polly_engine:old?.polly_engine||project.polly_engine||"standard",
      polly_text_hash:invalidatePolly?null:(old?.polly_text_hash||null),
      polly_generated_at:invalidatePolly?null:(old?.polly_generated_at||null),
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
  try{
    await adaptarBlocosPollyAutomaticamente(project.id);
  }catch(erro){
    console.warn("Não foi possível concluir toda a adaptação automática para Polly.",erro);
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
    '<details class="narration-source"><summary>Ver texto original do arquivo</summary><p>'+esc(b.source_text).replace(/\n/g,"<br>")+'</p></details>'+
    '<label>Texto para narração<textarea rows="6" data-narration-text>'+esc(b.narration_text||b.source_text||"")+'</textarea><small>Este texto é só para a leitura em voz alta. Alterações aqui não mudam o arquivo público.</small></label>'+
    '<section class="narration-polly-text-box">'+
      '<div class="narration-polly-text-head"><div><span>VERSÃO PARA POLLY</span><strong>'+(b.polly_text_mode==="manual"?"Edição manual":"Gerada automaticamente")+'</strong><small data-polly-text-state>'+(b.polly_text?"Pronta para revisão":"Ainda não gerada")+'</small></div><button type="button" data-regenerate-polly-text><i class="fa-solid fa-wand-magic-sparkles"></i> Recalcular adaptação</button></div>'+
      '<textarea rows="6" data-polly-text placeholder="A adaptação automática será criada pelo sistema.">'+esc(b.polly_text||"")+'</textarea>'+
      '<div class="narration-auto-pronunciations" data-auto-pronunciations><span>Tratamentos automáticos</span><small>Ainda não analisado</small></div>'+
      '<div class="narration-polly-text-actions"><button type="button" data-save-polly-text><i class="fa-regular fa-floppy-disk"></i> Salvar edição manual</button><small>Esta caixa não altera o texto público nem o texto para narração.</small></div>'+
    '</section>'+
    '<section class="narration-polly-box">'+
      '<div><span>AMAZON POLLY</span><strong>'+esc(b.polly_voice_id||"Camila")+' · '+esc((b.polly_engine||"standard").toUpperCase())+'</strong><small>Ritmo 92% · pausas leves · us-east-2</small><small data-polly-state>'+(pollyReady?"Áudio pronto e armazenado":"Ainda não gerado ou precisa ser atualizado")+'</small></div>'+
      '<div class="narration-polly-actions"><button type="button" data-generate-polly><i class="fa-solid fa-wand-magic-sparkles"></i> '+(pollyReady?"Atualizar este bloco":"Gerar somente este bloco")+'</button><button type="button" data-preview-polly '+(!b.polly_audio_path?"disabled":"")+'><i class="fa-solid fa-play"></i> Ouvir</button></div>'+
    '</section>'+
    '<div class="narration-block-actions"><button type="button" data-save-narration-text><i class="fa-regular fa-floppy-disk"></i> Salvar texto falado</button><button type="button" disabled title="Será ativado na etapa de gravação humana"><i class="fa-solid fa-microphone"></i> Gravar minha voz</button></div>'+
  '</article>';
}

async function loadKokoroScripts(projectId){
 const r=await client().from("arquivo_voz_scripts").select("*").eq("project_id",projectId);
 if(r.error)throw r.error;
 return new Map((r.data||[]).map(x=>[String(x.block_id),x]));
}
function kokoroScriptPanel(b,saved){
 const stale=saved&&saved.source_snapshot!==String(b.narration_text||b.source_text||"").trim();
 return '<section class="narration-polly-text-box" data-kokoro-script>'+
 '<div class="narration-polly-text-head"><div><span>ROTEIRO KOKORO · TESTES</span><strong>Adaptação editorial manual</strong><small data-kokoro-status>'+
 (stale?'Texto original alterado: revise o roteiro':saved?'Roteiro salvo separadamente':'Cole o texto adaptado para narração')+
 '</small></div></div>'+
 '<details class="narration-source"><summary>Texto original</summary><p>'+esc(b.narration_text||b.source_text||"")+'</p></details>'+
 '<textarea rows="7" data-kokoro-text placeholder="Cole a versão adaptada para a voz pf_dora...">'+esc(saved?.script_text||"")+'</textarea>'+
 '<div class="narration-polly-text-actions"><button type="button" data-save-kokoro-script>Salvar roteiro Kokoro</button><small>Não modifica o texto público ou Polly; não publica áudio.</small></div></section>';
}
function projectSummary(blocks){
  const adaptationReady=blocks.filter(b=>b.polly_text_mode==="manual"||Boolean(b.polly_text&&b.polly_text_source_hash)).length;
  const audioReady=blocks.filter(b=>Boolean(b.polly_audio_path&&b.polly_text_hash)).length;
  const needsUpdate=blocks.filter(b=>b.status==="desatualizado"||!(b.polly_text_mode==="manual"||Boolean(b.polly_text&&b.polly_text_source_hash))).length;
  const complete=blocks.length>0&&audioReady===blocks.length;
  return '<div class="narration-summary narration-summary--operational">'+
    '<div><strong>'+blocks.length+'</strong><span>blocos</span></div>'+
    '<div><strong>'+adaptationReady+'</strong><span>adaptações prontas</span></div>'+
    '<div><strong>'+audioReady+'</strong><span>áudios prontos</span></div>'+
    '<div><strong>'+needsUpdate+'</strong><span>precisam atualizar</span></div>'+
    '<div class="narration-project-health '+(complete?"is-ready":"is-pending")+'"><strong>'+(complete?"ÁUDIO COMPLETO":"EM PREPARAÇÃO")+'</strong><span>'+(complete?"todos os blocos atualizados":"há blocos pendentes")+'</span></div>'+
  '</div>';
}

function pronunciationHTML(items,dossier){
  const contentType=String(dossier?.__contentType||"dossie");
  const contentId=String(dossier?.id||"");
  const rowHtml=x=>'<div class="narration-pronunciation-row" data-pronunciation-id="'+esc(x.id)+'" data-content-type="'+esc(contentType)+'" data-content-id="'+esc(contentId)+'">'+
    '<input data-term value="'+esc(x.term)+'" aria-label="Termo"><span>→</span>'+
    '<input data-pronunciation value="'+esc(x.pronunciation)+'" aria-label="Pronúncia">'+
    '<select data-scope aria-label="Escopo">'+
      '<option value="global" '+(x.scope_type==="global"?"selected":"")+'>Global</option>'+
      '<option value="content_type" '+(x.scope_type==="content_type"?"selected":"")+'>Só '+esc(contentType)+'</option>'+
      '<option value="content" '+(x.scope_type==="content"?"selected":"")+'>Só este arquivo</option>'+
    '</select>'+
    '<button type="button" data-save-pronunciation>Salvar</button><button type="button" class="danger" data-delete-pronunciation>×</button></div>';
  return '<section class="narration-pronunciation"><header><div><span>DICIONÁRIO DE VOZ</span><h3>Pronúncias especiais</h3><p>Prioridade: regra deste arquivo → regra do tipo → regra global.</p></div><button type="button" data-add-pronunciation><i class="fa-solid fa-plus"></i> Adicionar</button></header>'+
  '<div data-pronunciation-list>'+(items.length?items.map(rowHtml).join(""):'<p class="narration-empty-pronunciation">Nenhuma pronúncia cadastrada.</p>')+'</div></section>';
}

async function wirePronunciations(panel,dossier){
  panel.querySelector("[data-add-pronunciation]")?.addEventListener("click",()=>{
    const list=panel.querySelector("[data-pronunciation-list]");
    list.querySelector(".narration-empty-pronunciation")?.remove();
    const row=document.createElement("div");
    row.className="narration-pronunciation-row";
    row.dataset.contentType=String(dossier?.__contentType||"dossie");
    row.dataset.contentId=String(dossier?.id||"");
    row.innerHTML='<input data-term placeholder="Ex.: DeAngelo" aria-label="Termo"><span>→</span><input data-pronunciation placeholder="Ex.: di Ânjelo" aria-label="Pronúncia"><select data-scope><option value="content">Só este arquivo</option><option value="content_type">Só este tipo</option><option value="global">Global</option></select><button type="button" data-save-pronunciation>Salvar</button><button type="button" class="danger" data-delete-pronunciation>×</button>';
    list.prepend(row); wirePronunciationRow(row);
  });
  panel.querySelectorAll(".narration-pronunciation-row").forEach(wirePronunciationRow);
}

function wirePronunciationRow(row){
  row.querySelector("[data-save-pronunciation]")?.addEventListener("click",async()=>{
    const c=client(),s=await session(),term=row.querySelector("[data-term]").value.trim(),pron=row.querySelector("[data-pronunciation]").value.trim();
    const scope=row.querySelector("[data-scope]")?.value||"global";
    const contentType=row.dataset.contentType||null;
    const contentId=Number(row.dataset.contentId||0)||null;
    if(!term||!pron)return alert("Informe o termo e a pronúncia.");
    const payload={
      term,pronunciation:pron,scope_type:scope,
      content_type:scope==="global"?null:contentType,
      content_id:scope==="content"?contentId:null,
      priority:scope==="content"?30:scope==="content_type"?20:10,
      updated_at:new Date().toISOString()
    };
    const id=row.dataset.pronunciationId;
    const q=id
      ? await c.from("narration_pronunciations").update(payload).eq("id",id).select().single()
      : await c.from("narration_pronunciations").insert({...payload,created_by:s?.user?.id||null}).select().single();
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

async function invokePolly(blockId,force=false,action="synthesize"){
  const c=client();
  const {data,error}=await c.functions.invoke("narration-polly",{body:{block_id:blockId,force,action}});
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
    let scripts=new Map(),scriptsReady=true;
    try{scripts=await loadKokoroScripts(project.id);}catch(e){scriptsReady=false;console.warn('Kokoro scripts unavailable',e);}
    const box=panel.querySelector("[data-narration-workspace]");
    box.innerHTML='<section class="narration-project-head"><div><span>NARRAÇÃO DO ARQUIVO</span><h2>'+esc(dossier.titulo||"Dossiê")+'</h2><p>Amazon Polly é a voz padrão. Sua gravação humana só substitui o Polly nos blocos em que você selecionar “Minha voz”.</p></div><div class="narration-project-actions"><button type="button" data-resync-narration><i class="fa-solid fa-rotate"></i> Sincronizar texto</button></div></section>'+
      projectSummary(blocks)+
      '<section class="narration-test-block"><div><span>TESTE INDIVIDUAL</span><strong>Escolha um bloco para gerar com Polly</strong><small>Use um bloco curto primeiro. Assim você testa a voz sem gerar o dossiê inteiro.</small></div><div><select data-test-block>'+blocks.map(b=>'<option value="'+esc(b.id)+'">Bloco '+String(b.sort_order).padStart(2,"0")+' · '+esc(b.source_label||b.source_type||"Trecho")+'</option>').join("")+'</select><button type="button" data-go-test-block><i class="fa-solid fa-arrow-down"></i> Ir ao bloco</button></div></section>'+
      '<div class="narration-layout"><section class="narration-block-list"><div class="narration-section-title"><span>ROTEIRO</span><h3>Blocos de narração</h3></div>'+blocks.map(b=>blockCard(b)+(scriptsReady?kokoroScriptPanel(b,scripts.get(String(b.id))):"")).join("")+'</section>'+pronunciationHTML(pron,dossier)+'</div>';
    box.querySelector("[data-resync-narration]").onclick=()=>openProject(panel,dossier);
    if(!scriptsReady)box.insertAdjacentHTML("afterbegin",'<p class="narration-notice">Roteiros Kokoro indisponíveis: aplique a migração de testes.</p>');
    box.querySelectorAll("[data-save-kokoro-script]").forEach(btn=>btn.onclick=async()=>{
      const card=btn.closest("[data-narration-block]"),id=card.dataset.narrationBlock;
      const text=card.querySelector("[data-kokoro-text]").value.trim();
      const original=card.querySelector("[data-narration-text]").value.trim();
      if(!text)return alert("Cole o roteiro adaptado antes de salvar.");
      btn.disabled=true;
      try{
        const r=await client().from("arquivo_voz_scripts").upsert({
          project_id:project.id,block_id:id,source_snapshot:original,script_text:text,
          status:"draft",updated_at:new Date().toISOString()
        },{onConflict:"block_id"});
        if(r.error)throw r.error;
        card.querySelector("[data-kokoro-status]").textContent="Roteiro salvo · aguardando revisão";
      }catch(e){alert("Falha ao salvar roteiro: "+(e.message||e));}
      finally{btn.disabled=false;}
    });

    box.querySelectorAll("[data-save-narration-text]").forEach(btn=>btn.onclick=async()=>{
      const card=btn.closest("[data-narration-block]"),id=card.dataset.narrationBlock,text=card.querySelector("[data-narration-text]").value.trim();
      btn.disabled=true;
      try{
        const r=await client().from("narration_blocks").update({narration_text:text,polly_text_source_hash:null,polly_text_hash:null,updated_at:new Date().toISOString()}).eq("id",id);
        if(r.error)throw r.error;

        const mode=card.querySelector(".narration-polly-text-head strong")?.textContent||"";
        const tstate=card.querySelector("[data-polly-text-state]");
        if(mode!=="Edição manual"){
          if(tstate)tstate.textContent="Adaptando automaticamente...";
          const data=await invokePolly(id,false,"regenerate_polly_text");
          const ta=card.querySelector("[data-polly-text]");
          if(ta)ta.value=data.polly_text||"";
          if(tstate)tstate.textContent="Gerada automaticamente";
          const auto=card.querySelector("[data-auto-pronunciations]");
          if(auto){
            const treatments=Array.isArray(data.treatments)?data.treatments:[];
            auto.innerHTML='<span>Tratamentos automáticos</span>'+(treatments.length?'<div>'+treatments.map(t=>'<em>'+esc(t)+'</em>').join("")+'</div>':'<small>Nenhuma adaptação adicional foi necessária neste bloco.</small>');
          }
          card.querySelector("[data-polly-state]").textContent="Texto e adaptação atualizados · gere o áudio novamente";
        }else{
          card.querySelector("[data-polly-state]").textContent="Texto alterado · versão Polly manual preservada";
          if(tstate)tstate.textContent="Edição manual preservada";
        }

        btn.innerHTML='<i class="fa-solid fa-check"></i> Salvo';
        setTimeout(()=>btn.innerHTML='<i class="fa-regular fa-floppy-disk"></i> Salvar texto falado',1300);
      }catch(e){alert(e.message||"Não foi possível salvar o texto.");}
      finally{btn.disabled=false;}
    });

    box.querySelectorAll("[data-regenerate-polly-text]").forEach(btn=>btn.onclick=async()=>{
      const card=btn.closest("[data-narration-block]"),id=card.dataset.narrationBlock,ta=card.querySelector("[data-polly-text]"),state=card.querySelector("[data-polly-text-state]");
      btn.disabled=true;
      if(state)state.textContent="Gerando adaptação automática...";
      try{
        const data=await invokePolly(id,false,"regenerate_polly_text");
        if(ta)ta.value=data.polly_text||"";
        if(state)state.textContent="Gerada automaticamente";
        const auto=card.querySelector("[data-auto-pronunciations]");
        if(auto){
          const treatments=Array.isArray(data.treatments)?data.treatments:[];
          auto.innerHTML='<span>Tratamentos automáticos</span>'+(treatments.length?'<div>'+treatments.map(t=>'<em>'+esc(t)+'</em>').join("")+'</div>':'<small>Nenhuma adaptação adicional foi necessária neste bloco.</small>');
        }
        card.querySelector("[data-polly-state]").textContent="Adaptação atualizada · gere o áudio novamente";
      }catch(e){
        if(state)state.textContent="Falha ao gerar adaptação";
        alert(e.message||"Não foi possível gerar a versão para Polly.");
      }finally{btn.disabled=false;}
    });

    box.querySelectorAll("[data-save-polly-text]").forEach(btn=>btn.onclick=async()=>{
      const card=btn.closest("[data-narration-block]"),id=card.dataset.narrationBlock,ta=card.querySelector("[data-polly-text]"),state=card.querySelector("[data-polly-text-state]");
      const text=ta?.value.trim()||"";
      if(!text)return alert("A versão para Polly não pode ficar vazia.");
      btn.disabled=true;
      try{
        const r=await client().from("narration_blocks").update({
          polly_text:text,
          polly_text_mode:"manual",
          polly_text_hash:null,
          polly_text_generated_at:new Date().toISOString(),
          updated_at:new Date().toISOString()
        }).eq("id",id);
        if(r.error)throw r.error;
        if(state)state.textContent="Edição manual salva";
        card.querySelector("[data-polly-state]").textContent="Versão para Polly alterada · gere o áudio novamente";
        btn.innerHTML='<i class="fa-solid fa-check"></i> Salvo';
        setTimeout(()=>btn.innerHTML='<i class="fa-regular fa-floppy-disk"></i> Salvar edição manual',1300);
      }catch(e){alert(e.message||"Não foi possível salvar a versão para Polly.");}
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
        if(data.polly_text){
          const ta=card.querySelector("[data-polly-text]");
          if(ta)ta.value=data.polly_text;
          const tstate=card.querySelector("[data-polly-text-state]");
          if(tstate)tstate.textContent="Adaptação sincronizada automaticamente";
        }
        const auto=card.querySelector("[data-auto-pronunciations]");
        if(auto){
          const terms=Array.isArray(data.foreign_terms)?data.foreign_terms:[];
          auto.innerHTML='<span>Tratamentos automáticos</span>'+(terms.length?'<div>'+terms.map(t=>'<em>'+esc(t)+' · leitura en-US</em>').join("")+'</div>':'<small>Nenhum termo estrangeiro detectado neste bloco.</small>');
        }
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

    wirePronunciations(box,dossier);
  }catch(e){
    panel.querySelector("[data-narration-workspace]").innerHTML='<div class="admin-hub-error"><i class="fa-solid fa-triangle-exclamation"></i><p>'+esc(e.message||"Não foi possível preparar a narração.")+'</p></div>';
  }
}

async function render(panel){
  const c=client(); if(!c)throw Error("Supabase indisponível.");

  const consultas=await Promise.all([
    c.from("Casos").select("*").order("titulo",{ascending:true}),
    c.from("casos_diarios").select("*").order("titulo",{ascending:true}),
    c.from("pericias").select("*").order("titulo",{ascending:true}),
    c.from("lendas").select("*").order("titulo",{ascending:true}),
    c.from("creepypastas").select("*").order("titulo",{ascending:true})
  ]);
  const erro=consultas.find(x=>x.error)?.error;
  if(erro)throw erro;

  const tipos=[
    ["dossie","Dossiê",consultas[0].data||[]],
    ["garimpo","Garimpo Sombrio",consultas[1].data||[]],
    ["pericia","Perícia",consultas[2].data||[]],
    ["lenda","Lenda",consultas[3].data||[]],
    ["creepypasta","Creepypasta",consultas[4].data||[]]
  ];
  const items=tipos.flatMap(([type,label,rows])=>rows.map(d=>({...d,__contentType:type,__contentLabel:label})));

  const projects=await c.from("narration_projects").select("content_type,content_id,status");
  if(projects.error)throw projects.error;
  const projectMap=new Map((projects.data||[]).map(x=>[String(x.content_type)+":"+String(x.content_id),x]));

  panel.innerHTML='<div class="admin-hub-section-heading"><div><span>ÁUDIO DOCUMENTAL</span><h2>Narração do Arquivo</h2><p>Prepare e revise a narração de Dossiês, Garimpo, Perícias, Lendas e Creepypastas. A adaptação para Polly é criada automaticamente.</p></div></div>'+
    '<section class="narration-picker"><label>Tipo de arquivo<select data-narration-type><option value="dossie">Dossiês</option><option value="garimpo">Garimpo Sombrio</option><option value="pericia">Perícias</option><option value="lenda">Lendas</option><option value="creepypasta">Creepypastas</option></select></label><label>Selecionar arquivo<select data-narration-dossier></select></label><button type="button" data-open-narration disabled><i class="fa-solid fa-microphone-lines"></i> Preparar narração</button></section>'+
    '<div class="narration-notice"><i class="fa-solid fa-headphones"></i><div><strong>Adaptação automática</strong><p>Ao preparar ou sincronizar um arquivo, a versão para Polly é criada automaticamente. Edições manuais continuam protegidas.</p></div></div>'+
    '<div data-narration-workspace><div class="admin-hub-empty"><i class="fa-solid fa-microphone-lines"></i><p>Selecione um arquivo para iniciar ou continuar a preparação da narração.</p></div></div>';

  const typeSelect=panel.querySelector("[data-narration-type]");
  const select=panel.querySelector("[data-narration-dossier]");
  const button=panel.querySelector("[data-open-narration]");

  const fill=()=>{
    const type=typeSelect.value;
    const subset=items.filter(x=>x.__contentType===type);
    select.innerHTML='<option value="">Escolha um arquivo</option>'+subset.map(d=>{
      const key=type+":"+String(d.id);
      return '<option value="'+d.id+'">'+esc(d.titulo||("Arquivo "+d.id))+(projectMap.has(key)?' · projeto criado':'')+'</option>';
    }).join("");
    button.disabled=true;
  };
  typeSelect.onchange=fill;
  select.onchange=()=>button.disabled=!select.value;
  button.onclick=()=>{
    const d=items.find(x=>x.__contentType===typeSelect.value&&String(x.id)===String(select.value));
    if(d)openProject(panel,d);
  };
  fill();

  const activeProjects=(projects.data||[]).filter(x=>x.status!=="arquivada").length;
  const badge=document.querySelector('[data-admin-hub-count="narration"]');
  if(badge)badge.textContent=activeProjects?String(activeProjects):"";
}

window.ArquivoNarracao={render};
})();