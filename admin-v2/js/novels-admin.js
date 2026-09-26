"use strict";
const sb=window.supabase.createClient("https://iuhotznurbyujzbyhizf.supabase.co","sb_publishable_bpAZ5EhYLIuVoE4Q97s_-A_XQwwRxUj",{auth:{storageKey:"arquivo-sombrio-admin-auth-v2",persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
const $=s=>document.querySelector(s);
let works=[],chapters=[],current=null;
const escapeHtml=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const status=s=>{$("#novel-feedback").textContent=s||""};
function backupChapter(c){try{localStorage.setItem("arquivo-sombrio-chapter-backup:"+c.id,JSON.stringify({...c,backedUpAt:new Date().toISOString()}))}catch(e){console.warn("Backup local indisponível",e)}}

let draftUserId=null,draftTimer=null,draftKey=null;
const draftPrefix="arquivo-sombrio-novel-draft-v1:";
const draftMessage=s=>{$("#draft-state").textContent=s||""};
function keyForDraft(novelId,chapterId){return draftPrefix+draftUserId+":"+novelId+":"+(chapterId||"novo")}
function saveDraftNow(){if(!draftKey||$("#chapter-editor").hidden)return;const f=$("#chapter-form");try{const data={numero:f.elements.numero.value,titulo:f.elements.titulo.value,conteudo:f.elements.conteudo.value,status_publicacao:f.elements.status_publicacao.value,agendado_para:f.elements.agendado_para.value,savedAt:new Date().toISOString()};localStorage.setItem(draftKey,JSON.stringify(data));$("#restore-draft").hidden=false;$("#discard-draft").hidden=false;draftMessage("Rascunho local salvo neste navegador às "+new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}))}catch(e){draftMessage("Não foi possível salvar localmente. Use Salvar capítulo.")}}
function stopDraft(){clearTimeout(draftTimer);draftTimer=null;draftKey=null}
function prepareDraft(novelId,chapterId){stopDraft();draftKey=keyForDraft(novelId,chapterId);draftMessage("Salvamento local automático ativado neste dispositivo.");let stored=null;try{stored=JSON.parse(localStorage.getItem(draftKey)||"null")}catch(e){draftMessage("Não foi possível ler o rascunho local.")}const hasDraft=!!stored;$("#restore-draft").hidden=!hasDraft;$("#discard-draft").hidden=!hasDraft;$("#restore-draft").onclick=()=>{try{stored=JSON.parse(localStorage.getItem(draftKey)||"null")}catch(e){}if(!stored){draftMessage("Nenhum rascunho local encontrado.");return}const f=$("#chapter-form");for(const k of ["numero","titulo","conteudo","status_publicacao","agendado_para"])if(stored[k]!=null)f.elements[k].value=stored[k];const scheduled=f.elements.status_publicacao.value==="agendado";$("#chapter-schedule-wrap").hidden=!scheduled;$("#chapter-schedule-note").hidden=!scheduled;draftMessage("Rascunho recuperado. Confira antes de salvar.");$("#restore-draft").hidden=true};$("#discard-draft").onclick=()=>{try{localStorage.removeItem(draftKey)}catch(e){}stored=null;$("#restore-draft").hidden=true;$("#discard-draft").hidden=true;draftMessage("Rascunho local descartado.")}}
function scheduleDraft(){clearTimeout(draftTimer);draftTimer=setTimeout(saveDraftNow,1200)}

async function uploadCover(file,slug){if(!file)return null;if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>8388608)throw Error("Use JPEG, PNG ou WebP de até 8 MB.");const ext=file.type==="image/png"?"png":file.type==="image/webp"?"webp":"jpg";const path=slug+"/"+Date.now()+"."+ext;const {error}=await sb.storage.from("novel-capas").upload(path,file,{upsert:false});if(error)throw error;return sb.storage.from("novel-capas").getPublicUrl(path).data.publicUrl}
async function load(){status("");const {data,error}=await sb.from("novels").select("*").order("created_at",{ascending:false});if(error){status("Erro ao consultar obras: "+error.message);$("#admin-novel-list").textContent="Não foi possível carregar as obras.";return}works=data||[];$("#admin-novel-list").innerHTML=works.filter(n=>[n.titulo,n.autor_nome].join(" ").toLocaleLowerCase("pt-BR").includes(($("#novel-search")?.value||"").toLocaleLowerCase("pt-BR"))).map(n=>'<article class="admin-row" style="display:flex;gap:15px;align-items:center;flex-wrap:wrap">'+(n.imagem_capa?'<img src="'+escapeHtml(n.imagem_capa)+'" alt="" style="width:64px;aspect-ratio:2/3;object-fit:cover">':'<div style="width:64px;aspect-ratio:2/3;border:1px solid #52443a"></div>')+'<div style="flex:1;min-width:180px"><strong>'+escapeHtml(n.titulo)+'</strong><br><small>'+escapeHtml(n.autor_nome)+' · '+escapeHtml(n.status_publicacao)+'</small></div><button type="button" data-action="edit" data-id="'+n.id+'">Editar</button><button type="button" data-action="chapters" data-id="'+n.id+'">Capítulos</button><button type="button" data-action="cover" data-id="'+n.id+'">Trocar capa</button></article>').join("")||"Nenhuma obra cadastrada."; }
async function showChapters(id){current=works.find(w=>w.id===id);if(!current)return;$("#chapter-list-section").hidden=false;const {data,error}=await sb.from("novel_capitulos").select("id,numero,titulo,status_publicacao,conteudo,agendado_para").eq("novel_id",id).order("numero");if(error){$("#chapter-list").textContent="Erro: "+error.message;return}chapters=data||[];$("#chapter-list").innerHTML=chapters.filter(c=>!$("#chapter-status-filter").value||c.status_publicacao===$("#chapter-status-filter").value).map(c=>'<div class="admin-row"><strong>Capítulo '+c.numero+': '+escapeHtml(c.titulo)+'</strong> · '+escapeHtml(c.status_publicacao)+' <button type="button" data-chapter="'+c.id+'">Editar capítulo</button> <button type="button" data-archive="'+c.id+'">'+(c.status_publicacao==="arquivado"?"Restaurar":"Arquivar")+'</button></div>').join("")||"Nenhum capítulo.";$("#chapter-list").innerHTML+='<button type="button" id="new-chapter" class="novel-button">+ Novo capítulo</button>';$("#new-chapter").onclick=()=>{ $("#chapter-form").reset();$("#chapter-form").elements.novel_id.value=id;$("#chapter-editor-title").textContent="Novo capítulo";$("#chapter-schedule-wrap").hidden=true;$("#chapter-schedule-note").hidden=true;$("#chapter-editor").hidden=false;prepareDraft(id,null);$("#chapter-editor").scrollIntoView({behavior:"smooth"})};$("#chapter-list-section").scrollIntoView({behavior:"smooth"});}
document.addEventListener("DOMContentLoaded",async()=>{
const {data:{user},error:authError}=await sb.auth.getUser();if(authError||user?.app_metadata?.role!=="admin"){status("Sessão administrativa indisponível. Retorne à Central Administrativa e valide seu acesso.");$("#novel-form").querySelector("button").disabled=true;return}
draftUserId=user.id;
$("#chapter-form").addEventListener("input",scheduleDraft);
$("#chapter-form").addEventListener("change",scheduleDraft);
$("#save-draft-local").onclick=()=>{if(!draftKey){draftMessage("Abra um capítulo antes de salvar.");return}saveDraftNow()};
window.addEventListener("pagehide",()=>{if(draftKey)saveDraftNow()});
$("#novel-search").oninput=()=>{const q=$("#novel-search").value.toLocaleLowerCase("pt-BR");$("#admin-novel-list").querySelectorAll("article").forEach(el=>{const w=works.find(x=>x.id===el.querySelector("[data-id]")?.dataset.id);el.hidden=!!w&&![w.titulo,w.autor_nome].join(" ").toLocaleLowerCase("pt-BR").includes(q)})};
$("#chapter-status-filter").onchange=()=>{if(current)showChapters(current.id)};
$("#close-work-editor").onclick=()=>{$("#work-editor").hidden=true};
$("#close-chapter-editor").onclick=()=>{if(draftKey)saveDraftNow();$("#chapter-editor").hidden=true;stopDraft()};
$("#chapter-form").elements.status_publicacao.onchange=e=>{const show=e.target.value==="agendado";$("#chapter-schedule-wrap").hidden=!show;$("#chapter-schedule-note").hidden=!show};
$("#novel-cover-file").onchange=e=>{const f=e.target.files?.[0];const p=$("#novel-cover-preview");if(!f){p.hidden=true;return}p.src=URL.createObjectURL(f);p.hidden=false};
$("#admin-novel-list").onclick=async e=>{const b=e.target.closest("button[data-action]");if(!b)return;const w=works.find(n=>n.id===b.dataset.id);if(!w)return;if(b.dataset.action==="edit"){const f=$("#work-form");for(const key of ["id","titulo","subtitulo","autor_nome","sinopse","status_publicacao","status_obra","classificacao_etaria","idioma","tags"])f.elements[key].value=w[key]||"";f.elements.generos.value=(w.generos||[]).join(", ");$("#work-editor").hidden=false;$("#work-editor").scrollIntoView({behavior:"smooth"})}else if(b.dataset.action==="chapters"){await showChapters(w.id)}else{const input=document.createElement("input");input.type="file";input.accept="image/jpeg,image/png,image/webp";input.onchange=async()=>{if(!input.files?.[0])return;b.disabled=true;try{const url=await uploadCover(input.files[0],w.slug);const {error}=await sb.from("novels").update({imagem_capa:url}).eq("id",w.id);if(error)throw error;await load();status("Capa atualizada.")}catch(err){status("Falha ao enviar capa: "+err.message)}finally{b.disabled=false}};input.click()}};
$("#chapter-list").onclick=async e=>{const archive=e.target.closest("button[data-archive]");if(archive){const ch=chapters.find(x=>x.id===archive.dataset.archive);if(!ch)return;const restoring=ch.status_publicacao==="arquivado";if(!restoring&&!confirm("Arquivar o capítulo "+ch.numero+"? Ele sairá da publicação, mas poderá ser restaurado."))return;backupChapter(ch);archive.disabled=true;const {error}=await sb.from("novel_capitulos").update({status_publicacao:restoring?"rascunho":"arquivado",agendado_para:null}).eq("id",ch.id);if(error){status("Não foi possível alterar o capítulo: "+error.message);archive.disabled=false;return}await showChapters(current.id);status(restoring?"Capítulo restaurado como rascunho.":"Capítulo arquivado. É possível restaurá-lo.");return}const b=e.target.closest("button[data-chapter]");if(!b)return;const c=chapters.find(x=>x.id===b.dataset.chapter);if(!c)return;const f=$("#chapter-form");for(const k of ["id","numero","titulo","conteudo","status_publicacao"])f.elements[k].value=c[k]??"";f.elements.novel_id.value=current.id;f.elements.agendado_para.value=c.agendado_para?new Date(new Date(c.agendado_para).getTime()-new Date(c.agendado_para).getTimezoneOffset()*60000).toISOString().slice(0,16):"";$("#chapter-editor-title").textContent="Editar capítulo";$("#chapter-schedule-wrap").hidden=c.status_publicacao!=="agendado";$("#chapter-schedule-note").hidden=c.status_publicacao!=="agendado";$("#chapter-editor").hidden=false;prepareDraft(current.id,c.id);$("#chapter-editor").scrollIntoView({behavior:"smooth"})};
$("#work-form").onsubmit=async e=>{e.preventDefault();const f=e.currentTarget,row=Object.fromEntries(new FormData(f));const id=row.id;delete row.id;row.generos=row.generos.split(",").map(s=>s.trim()).filter(Boolean);row.tags=(row.tags||"").split(",").map(s=>s.trim()).filter(Boolean);const {error}=await sb.from("novels").update(row).eq("id",id);if(error){status(error.message);return}$("#work-editor").hidden=true;await load();status("Obra atualizada.")};
$("#novel-form").onsubmit=async e=>{e.preventDefault();const f=e.currentTarget,row=Object.fromEntries(new FormData(f)),file=$("#novel-cover-file").files?.[0];delete row.capa_arquivo;row.generos=row.generos.split(",").map(s=>s.trim()).filter(Boolean);row.tags=(row.tags||"").split(",").map(s=>s.trim()).filter(Boolean);if(row.status_publicacao==="publicado")row.publicado_em=new Date().toISOString();try{row.imagem_capa=await uploadCover(file,row.slug);const {error}=await sb.from("novels").insert(row);if(error)throw error;f.reset();$("#novel-cover-preview").hidden=true;await load();status("Obra cadastrada.")}catch(err){status("Falha ao salvar: "+err.message)}};
$("#chapter-form").onsubmit=async e=>{e.preventDefault();const f=e.currentTarget,row=Object.fromEntries(new FormData(f)),id=row.id;delete row.id;row.numero=Number(row.numero);if(row.status_publicacao==="agendado"){if(!row.agendado_para){status("Informe a data e o horário do agendamento.");return}row.agendado_para=new Date(row.agendado_para).toISOString()}else row.agendado_para=null;row.palavras=row.conteudo.trim().split(/\s+/).filter(Boolean).length;if(row.status_publicacao==="publicado")row.publicado_em=new Date().toISOString();if(id){const previous=chapters.find(c=>c.id===id);if(previous&&previous.status_publicacao==="publicado"&&!window.confirm("Este capítulo está publicado. Salvar substituirá o registro atual; se mantiver como rascunho ou agendado, a versão publicada deixará de aparecer até nova publicação. Continuar?"))return;if(previous)backupChapter(previous)}const query=id?sb.from("novel_capitulos").update(row).eq("id",id):sb.from("novel_capitulos").insert(row);const {error}=await query;if(error){status("Erro no capítulo: "+error.message);return}clearTimeout(draftTimer);if(draftKey){try{localStorage.removeItem(draftKey)}catch(e){}}stopDraft();$("#chapter-editor").hidden=true;await showChapters(row.novel_id);status("Capítulo salvo.")};
await load();
const liteMode=new URLSearchParams(location.search).get("lite");
let liteTransfer=null;
try{liteTransfer=JSON.parse(localStorage.getItem("arquivo-sombrio-lite-v2-transfer:"+user.id)||"null")}catch(e){}
if(liteTransfer&&liteTransfer.owner===user.id&&liteTransfer.kind===liteMode&&liteMode==="book"){
 const p=liteTransfer.payload||{},form=$("#novel-form"),details=$("#novel-create details");
 details.open=true;
 form.elements.titulo.value=p.titulo||"";
 form.elements.autor_nome.value=p.autor_nome||p.autor||"";
 form.elements.subtitulo.value=p.subtitulo||"";
 form.elements.status_obra.value=p.status_obra||"";
 form.elements.classificacao_etaria.value=p.classificacao_etaria||"";
 form.elements.idioma.value=p.idioma||"";
 form.elements.tags.value=Array.isArray(p.tags)?p.tags.join(", "):String(p.tags||"");
 form.elements.imagem_capa.value=p.imagem_capa||p.capa||"";
 var liteSlug=String(p.titulo||"").normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,150);
 if(p._source&&p._source.snapshot&&p._source.snapshot.id&&liteTransfer.staging_id)liteSlug=liteSlug.slice(0,130)+"-lite-"+String(liteTransfer.staging_id).replace(/-/g,"").slice(0,12);
 form.elements.slug.value=liteSlug;
 form.elements.generos.value=Array.isArray(p.generos)?p.generos.join(", "):String(p.generos||p.tags||"");
 form.elements.sinopse.value=p.sinopse||p.resumo||"";
 form.elements.status_publicacao.value="rascunho";
 status("Rascunho Lite carregado no formulário do V2. Nada foi gravado. Confira os campos e pressione Salvar obra para criar o rascunho.");
}
if(liteTransfer&&liteTransfer.owner===user.id&&liteTransfer.kind===liteMode&&liteMode==="chapter"){
 if(!liteTransfer.novel_id){status("Este capítulo ainda não está associado a uma obra existente no V2. O rascunho Lite continua salvo.");}
 else{
  await showChapters(liteTransfer.novel_id);
  const f=$("#chapter-form"),p=liteTransfer.payload||{};
  if(liteTransfer.chapter_id){const btn=$("#chapter-list").querySelector('[data-chapter="'+CSS.escape(String(liteTransfer.chapter_id))+'"]');if(!btn){status("O capítulo de origem não foi encontrado no V2. O rascunho Lite continua salvo.");return;}btn.click();}
  else $("#new-chapter")?.click();
  f.elements.novel_id.value=liteTransfer.novel_id;
  f.elements.numero.value=p.numero||"";
  f.elements.titulo.value=p.titulo||"";
  f.elements.conteudo.value=p.conteudo||"";
  f.elements.status_publicacao.value="rascunho";
  f.elements.agendado_para.value="";
  $("#chapter-schedule-wrap").hidden=true;$("#chapter-schedule-note").hidden=true;
  if(draftKey)saveDraftNow();
  status("Rascunho Lite carregado no editor do V2. Nada foi gravado. Confira o capítulo e pressione Salvar capítulo para continuar.");
 }
}
});