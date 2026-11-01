(async function(){'use strict';
const $=id=>document.getElementById(id),status=$('status');let data=null;let adminClient=null;let previewMode='detail',mobileMode=false,localPreviewUrl=null;
function say(message,err){status.textContent=message;status.style.color=err?'#ffc2b8':'#c0dec3'}
function make(tag,attrs={},text=''){const el=document.createElement(tag);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));if(text)el.textContent=text;return el}
function option(value,text){return make('option',{value},text)}
function validate(){if(!data||!Array.isArray(data.campaigns))throw Error('Manifesto ausente.');const slugs=new Set();for(const c of data.campaigns){if(!/^[a-z0-9-]+$/.test(c.slug))throw Error('Slug inválido.');if(slugs.has(c.slug))throw Error('Slug duplicado.');slugs.add(c.slug);if(!/^\d{4}-\d{2}-\d{2}$/.test(c.start)||!/^\d{4}-\d{2}-\d{2}$/.test(c.end)||c.start>c.end)throw Error('Datas inválidas.');if(!Array.isArray(c.days))throw Error('Lista de arquivos inválida.');for(const d of c.days){if(d.date<c.start||d.date>c.end)throw Error('Dia fora da campanha.');if(d.published&&!/^\/(?!\/)[a-zA-Z0-9_./-]+(?:\?[a-zA-Z0-9_=&%.-]+)?$/.test(d.url||''))throw Error('Arquivo publicado sem URL local válida: '+d.title);if(d.url&&(d.url.includes('..')||d.url.includes('//')))throw Error('Caminho inseguro: '+d.title);}}return true;}
function readForm(){const c=data.campaigns[Number($('campaign').value)];c.title=$('name').value.trim();c.subtitle=$('subtitle').value.trim();c.introduction=$('introduction').value.trim();c.start=$('begin').value;c.end=$('finish').value;c.status=$('state').value;c.theme=$('theme').value;c.heroImage=$('hero-image').value.trim()||null;c.cardImage=$('card-image').value.trim()||null;c.overlay=Number($('overlay').value);c.heroPosition=Number($('hero-position').value);c.titleFont=$('font-family').value;c.accent=$('accent-color').value;for(let i=0;i<c.days.length;i++){const row=$('days').querySelector('[data-index="'+i+'"]');c.days[i].title=row.querySelector('[data-field=title]').value.trim();c.days[i].date=row.querySelector('[data-field=date]').value;c.days[i].url=row.querySelector('[data-field=url]').value.trim()||null;c.days[i].published=row.querySelector('[data-field=published]').checked;}if(!c.title)throw Error('Informe o título.');for(const img of [c.heroImage,c.cardImage])if(img&&!/^staging:[a-z0-9-]+\/[a-z0-9-]+\.(webp|png|jpg)$/i.test(img)&&!(/^\/(?!\/)[a-zA-Z0-9_./-]+\.(?:webp|png|jpe?g)$/.test(img)||/^https:\/\/iuhotznurbyujzbyhizf\.supabase\.co\/storage\/v1\/object\/public\/campaign-images\/[a-zA-Z0-9_./-]+\.(?:webp|png|jpe?g)$/.test(img))||img&&img.includes('..'))throw Error('Use um caminho local válido de imagem WebP, PNG ou JPG.');validate();}
function field(row,label,type,value,attr){const lbl=make('label',{},label),input=make('input',{type,'data-field':attr});if(type==='checkbox')input.checked=!!value;else input.value=value||'';lbl.appendChild(input);row.appendChild(lbl);}
async function resolveCampaignCase(day){
 const linked=Number(day.caseId || String(day.url||'').match(/[?&]id=(\d+)/)?.[1]);
 if(Number.isSafeInteger(linked)&&linked>0)return linked;
 const normalized=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 const result=await adminClient.from('casos_diarios').select('id,titulo,categoria');
 if(result.error)throw result.error;
 const title=normalized(day.title);
 if(!title)throw Error('Informe o título do arquivo.');
 const matches=(result.data||[]).filter(row=>normalized(row.titulo)===title||normalized(row.titulo).startsWith(title+' '));
 if(matches.length!==1)throw Error(matches.length?'Mais de um arquivo corresponde ao título. Informe o vínculo pelo ID.':'Arquivo ainda não cadastrado. Acesse Conteúdos e edição → Especiais → Novo Arquivo Especial.');
 return Number(matches[0].id);
}
function render(){const c=data.campaigns[Number($('campaign').value)];$('name').value=c.title;$('subtitle').value=c.subtitle;$('introduction').value=c.introduction||'';$('begin').value=c.start;$('finish').value=c.end;$('state').value=c.status;$('theme').value=c.theme||'halloween';$('hero-image').value=c.heroImage||'';$('card-image').value=c.cardImage||'';$('overlay').value=c.overlay??55;$('hero-position').value=c.heroPosition??65;$('font-family').value=c.titleFont||'Cinzel';$('accent-color').value=/^#[0-9a-f]{6}$/i.test(c.accent||'')?c.accent:'#de8c47';const host=$('days');host.replaceChildren();c.days.forEach((d,i)=>{const row=make('div',{'class':'day','data-index':String(i)});row.appendChild(make('strong',{},'Arquivo '+(i+1)));const remove=make('button',{type:'button','data-remove-day':String(i)},'Remover arquivo');remove.addEventListener('click',()=>{try{readForm();c.days.splice(i,1);render();preview()}catch(e){say(e.message,true)}});row.appendChild(remove);const editBtn=make('button',{type:'button','data-case-edit':String(i)},'Editar arquivo completo');editBtn.addEventListener('click',async()=>{editBtn.disabled=true;try{const id=await resolveCampaignCase(d);location.href='./index.html?section=especiais&editEspecial='+encodeURIComponent(id)}catch(e){say(e.message,true)}finally{editBtn.disabled=false}});row.appendChild(editBtn);if(c.theme==='halloween'){const previewBtn=make('button',{type:'button','data-case-preview':String(i)},'Visualizar dossiê');previewBtn.addEventListener('click',async()=>{let panel=row.querySelector('.case-editor-preview');if(panel){panel.remove();return;}panel=make('div',{'class':'case-editor-preview','role':'region','aria-label':'Prévia administrativa do dossiê'});panel.textContent='Carregando conteúdo no acesso administrativo…';row.appendChild(panel);try{const id=await resolveCampaignCase(d);const {data:caseData,error}=await adminClient.from('casos_diarios').select('id,titulo,resumo,conteudo,cronologia,status_publicacao').eq('id',id).maybeSingle();if(error)throw error;if(!caseData){panel.textContent='Dossiê não encontrado ou sem permissão de leitura administrativa.';return;}panel.replaceChildren();panel.appendChild(make('h3',{},caseData.titulo||d.title));panel.appendChild(make('p',{},'Registro '+id+' · '+(caseData.status_publicacao||'sem status')+' · Prévia administrativa, sem publicação'));for(const [heading,value] of [['Resumo',caseData.resumo],['Narrativa completa',caseData.conteudo],['Cronologia',caseData.cronologia]]){panel.appendChild(make('h4',{},heading));const body=make('div',{'class':'case-editor-text'});body.textContent=value||'Ainda não preenchido';panel.appendChild(body);}const back=make('a',{href:'./index.html?section=especiais&editEspecial='+encodeURIComponent(id)},'Editar texto, capa, imagens e fontes');panel.appendChild(back);}catch(err){panel.textContent='Não foi possível consultar o rascunho: '+(err&&err.message||'erro de acesso');}});row.appendChild(previewBtn);}field(row,'Título','text',d.title,'title');field(row,'Data','date',d.date,'date');field(row,'URL pública local (ex.: /caso.html?id=...)','text',d.url,'url');field(row,'Publicado e validado','checkbox',d.published,'published');host.appendChild(row)})}
try{
 if(typeof obterSessaoAdminIsolada!=='function')throw Error('Módulo de autenticação indisponível.');
 const session=await obterSessaoAdminIsolada(),stamp=Number(sessionStorage.getItem('arquivo-admin-verified-at')||0),user=sessionStorage.getItem('arquivo-admin-verified-user')||'';
 if(!session||!stamp||Date.now()-stamp>30*60*1000||user!==String(session.user.id)){location.replace('../admin.html?session=verificacao&next=adm');return;}
 adminClient=obterClienteAdminIsolado();
 const response=await fetch('/data/especiais.json',{cache:'no-store'});if(!response.ok)throw Error('Não foi possível carregar o manifesto.');data=await response.json();validate();
 const saved=await adminClient.from('editorial_campaigns').select('id,payload');
 if(saved.error)throw saved.error;
 for(const row of saved.data||[]){const i=data.campaigns.findIndex(c=>c.id===row.id);if(i>=0&&row.payload&&typeof row.payload==='object')data.campaigns[i]=row.payload;}
 validate();

 function campaignDiagnosticTime(value){
  if(!value)return '—';
  const d=new Date(value);
  return Number.isFinite(d.getTime())?new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(d):'—';
 }
 async function loadCampaignDiagnostics(){
  const button=$('cover-diagnostics-refresh'),state=$('cover-diagnostics-status');
  if(!button||button.disabled)return;
  button.disabled=true;state.textContent='Consultando publicações e tentativas…';
  try{
   const result=await adminClient.rpc('admin_v2_campaign_cover_diagnostics');
   if(result.error)throw result.error;
   const report=result.data;
   if(!report||!report.summary||!Array.isArray(report.items))throw Error('Resposta administrativa inválida.');
   const total=report.summary;
   $('cover-diagnostics-summary').textContent=[
    'Campanhas registradas: '+Number(total.total||0),
    'Agendadas: '+Number(total.scheduled||0),
    'Capas privadas futuras: '+Number(total.private_scheduled||0),
    'Capas vencidas pendentes: '+Number(total.due_pending||0),
    'Em recuperação: '+Number(total.retrying||0),
    'Rascunhos com capa privada: '+Number(total.draft_private||0)
   ].join(' · ');
   const job=report.job;
   $('cover-diagnostics-cron').textContent=job
    ?'Agendador: '+(job.active?'ativo':'inativo')+' ('+(job.schedule||'frequência não identificada')+'). Última execução registrada: '+campaignDiagnosticTime(job.last_run_at)+' · Estado do cron: '+(job.last_run_status||'sem dados')+'.'
    :'Agendador de capas não encontrado. Confirme a configuração no Supabase.';
   const items=$('cover-diagnostics-items');
   items.replaceChildren();
   const states={retry:'Falha · aguardando nova tentativa',due:'Pendente de liberação',scheduled_private:'Agendada · capa protegida',scheduled:'Agendada'};
   if(!report.items.length){
    const tr=make('tr');const td=make('td',{colspan:'4'},'Nenhuma campanha futura ou com capa pendente neste momento.');
    tr.appendChild(td);items.appendChild(tr);
   }
   for(const entry of report.items){
    const tr=make('tr');
    const details=[];
    if(entry.hero_private)details.push('Hero privado');
    if(entry.card_private)details.push('Card privado');
    if(Number(entry.failures)>0)details.push('Falhas: '+Number(entry.failures));
    if(entry.error_code)details.push('Código: '+String(entry.error_code));
    if(entry.retry_at)details.push('Nova tentativa: '+campaignDiagnosticTime(entry.retry_at));
    for(const value of [entry.title||entry.id||'Campanha sem título',campaignDiagnosticTime(entry.publish_at),states[entry.state]||'Estado não identificado',details.join(' · ')||'Sem pendências de capa']){
     tr.appendChild(make('td',{},String(value)));
    }
    items.appendChild(tr);
   }
   state.style.color='#c0dec3';state.textContent='Diagnóstico atualizado em '+campaignDiagnosticTime(report.generated_at)+'. Dados restritos à administração.';
  }catch(err){
   state.textContent='Não foi possível consultar o diagnóstico: '+(err?.message||'erro não identificado');
   state.style.color='#ffc2b8';
  }finally{button.disabled=false}
 }
 $('cover-diagnostics-refresh').addEventListener('click',loadCampaignDiagnostics);

 data.campaigns.forEach((c,i)=>{$('campaign').appendChild(option(String(i),c.title));if(!$('theme').querySelector('option[value="'+c.theme+'"]'))$('theme').appendChild(option(c.theme,c.title+' · tema próprio'));});$('campaign').addEventListener('change',()=>{if(localPreviewUrl)URL.revokeObjectURL(localPreviewUrl);localPreviewUrl=null;$('local-image').value='';render();});render();$('editor').hidden=false;say('Sessão validada. Editor local disponível; nenhuma mudança foi publicada.');void loadCampaignDiagnostics();
 let previewSequence=0;
 async function resolvePreviewImage(ref,slug){
  const image=String(ref||'');
  if(!image)return '';
  if(/^staging:[a-z0-9-]+\/[a-z0-9-]+\.(?:webp|png|jpg)$/.test(image)){
   const path=image.slice('staging:'.length);
   if(!path.startsWith(slug+'/'))throw Error('A capa privada não corresponde à campanha selecionada.');
   const signed=await adminClient.storage.from('campaign-covers-staging').createSignedUrl(path,300);
   if(signed.error||!signed.data?.signedUrl)throw Error('Não foi possível gerar a prévia autenticada da capa.');
   const url=new URL(signed.data.signedUrl);
   if(url.origin!=='https://iuhotznurbyujzbyhizf.supabase.co'||url.pathname!=='/storage/v1/object/sign/campaign-covers-staging/'+path||!url.searchParams.has('token'))throw Error('Endereço da prévia privada inválido.');
   return url.href.replace(/"/g,'%22');
  }
  if(/^\/(?!\/)[a-zA-Z0-9_./-]+$/.test(image)||/^https:\/\/iuhotznurbyujzbyhizf\.supabase\.co\/storage\/v1\/object\/public\/campaign-images\/[a-zA-Z0-9_./-]+$/.test(image))return image;
  return '';
 }
 async function preview(){
  const sequence=++previewSequence;
  try{
   readForm();
   const c=data.campaigns[Number($('campaign').value)],target=$('campaign-preview');
   const heroRef=localPreviewUrl||c.heroImage||'/assets/especiais/banner-'+c.theme+'.svg';
   const [heroImage,cardImage]=await Promise.all([
    localPreviewUrl?Promise.resolve(localPreviewUrl):resolvePreviewImage(heroRef,c.slug),
    resolvePreviewImage(c.cardImage,c.slug)
   ]);
   if(sequence!==previewSequence)return;
   target.className=(mobileMode?'mobile-mode ':'')+'season-theme-'+c.theme;
   target.replaceChildren();
   const hero=make('div',{'class':'v2-campaign-hero'}),copy=make('div',{'class':'v2-campaign-copy'});
   const safeHero=heroImage||'/assets/especiais/banner-halloween.svg';
   hero.style.backgroundImage='linear-gradient(90deg,rgba(6,5,6,'+Number(c.overlay??55)/100+'),rgba(6,5,6,.15)),url("'+safeHero+'")';
   hero.style.backgroundPosition='center,'+Number(c.heroPosition??65)+'% center';
   hero.style.borderColor=c.accent||'#de8c47';
   const heading=make('h2',{},c.title),sub=make('p',{},c.subtitle),kicker=make('div',{'class':'v2-campaign-sub'},c.label||'ARQUIVO ESPECIAL');
   heading.style.fontFamily=JSON.stringify(c.titleFont||'Cinzel')+',Georgia,serif';
   copy.append(kicker,heading,sub,make('p',{},'Início: '+c.start+' · Fim: '+c.end+' · '+c.status));
   copy.appendChild(make('p',{},previewMode==='detail'?'Próximos arquivos: '+c.days.length+' · Prévia sem publicação':'Explorar especial · Prévia do destaque da home'));
   hero.appendChild(copy);target.appendChild(hero);
   if(c.cardImage){
    const wrap=make('div',{'class':'v2-campaign-cover-preview'});
    wrap.style.cssText='display:flex;align-items:center;gap:12px;margin-top:16px;flex-wrap:wrap';
    wrap.appendChild(make('span',{},'Capa do card · prévia administrativa'));
    if(cardImage){
     const img=make('img',{alt:'Prévia da capa do card'});
     img.src=cardImage;
     img.style.cssText='width:116px;max-height:160px;object-fit:cover;border-radius:6px';
     wrap.appendChild(img);
    }else wrap.appendChild(make('span',{},'Imagem não disponível para prévia'));
    target.appendChild(wrap);
   }
   say('Prévia atualizada — nenhuma alteração foi publicada.');
  }catch(e){if(sequence===previewSequence)say('Falha na prévia: '+e.message,true)}
 }
 $('preview').addEventListener('click',preview);
 $('preview-home').addEventListener('click',()=>{previewMode='home';preview()});
 $('preview-detail').addEventListener('click',()=>{previewMode='detail';preview()});
 $('preview-mobile').addEventListener('click',()=>{mobileMode=!mobileMode;preview()});
 $('local-image').addEventListener('change',e=>{const file=e.target.files?.[0];if(localPreviewUrl)URL.revokeObjectURL(localPreviewUrl);localPreviewUrl=null;if(file){if(!['image/webp','image/png','image/jpeg'].includes(file.type)||file.size>6*1024*1024){say('A imagem deve ser JPG, PNG ou WebP e ter até 6 MB.',true);return;}localPreviewUrl=URL.createObjectURL(file)}preview()});
 async function uploadMedia(destination){try{const file=$('local-image').files?.[0];if(!file)throw Error('Selecione uma imagem antes de enviar.');if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>6291456)throw Error('Aceitos JPG, PNG ou WebP com até 6 MB.');readForm();const auth=await adminClient.auth.getUser();if(auth.error||!auth.data?.user)throw Error('Sessão administrativa expirada.');const c=data.campaigns[Number($('campaign').value)];const suffix=file.type==='image/webp'?'webp':file.type==='image/png'?'png':'jpg';const filename=c.slug+'/'+Date.now().toString(36)+'-'+(destination==='hero'?'hero':'card')+'.'+suffix;const result=await adminClient.storage.from('campaign-covers-staging').upload(filename,file,{contentType:file.type,upsert:false,cacheControl:'3600'});if(result.error)throw result.error;const ref='staging:'+filename;if(destination==='hero')$('hero-image').value=ref;else $('card-image').value=ref;if(localPreviewUrl)URL.revokeObjectURL(localPreviewUrl);localPreviewUrl=null;$('local-image').value='';preview();say('Imagem salva no armazenamento privado. A publicação desta capa ficará bloqueada até a promoção segura.')}catch(e){say('Upload não realizado: '+e.message,true)}}

 $('bulk-upload').addEventListener('click',async()=>{
 const report=$('bulk-report'),files=[...$('bulk-images').files||[]];if(!files.length){report.textContent='Selecione as capas extraídas do ZIP.';return}
 const button=$('bulk-upload');button.disabled=true;let saved=0;const failures=[];
 try{
 const auth=await adminClient.auth.getUser();if(auth.error||!auth.data?.user)throw Error('Sessão administrativa expirada.');
 const known=new Map(data.campaigns.map(c=>[c.theme,c]));
 const matched=[];
 for(const file of files){
  const name=file.name.toLowerCase(),m=name.match(/^capa-([a-z0-9-]+)\.(webp|png|jpe?g)$/);
  if(!m||!known.has(m[1])){failures.push(file.name+': nome sem campanha correspondente');continue}
  if(!['image/webp','image/jpeg','image/png'].includes(file.type)||file.size>6291456){failures.push(file.name+': formato ou tamanho inválido');continue}
  matched.push({file,c:known.get(m[1]),ext:m[2]==='jpeg'?'jpg':m[2]});
 }
 if(matched.length===0)throw Error('Nenhuma capa reconhecida. Extraia primeiro a pasta assets/especiais do ZIP.');
 if(!confirm('Importar '+matched.length+' capas para o Storage e salvar seus rascunhos? As capas serão aplicadas ao catálogo público, respeitando as datas e o estado dos arquivos.'))return;
 for(const {file,c,ext} of matched){
  try{
   const releaseCheck=await adminClient.from('published_campaigns').select('publish_at').eq('id',c.id).maybeSingle();if(releaseCheck.error)throw releaseCheck.error;if(!releaseCheck.data||Date.parse(releaseCheck.data.publish_at)>Date.now())throw Error('Campanha não publicada: use Enviar imagem para card, que armazena a capa privadamente.');
   const path=c.slug+'/capa-'+c.theme+'-'+Date.now().toString(36)+'.'+ext;
   const uploaded=await adminClient.storage.from('campaign-images').upload(path,file,{contentType:file.type,upsert:false,cacheControl:'3600'});
   if(uploaded.error)throw uploaded.error;
   const image=adminClient.storage.from('campaign-images').getPublicUrl(path).data.publicUrl;
   const copy={...c,cardImage:image};
   const savedRow=await adminClient.from('editorial_campaigns').upsert({id:c.id,payload:copy,updated_by:auth.data.user.id,updated_at:new Date().toISOString()},{onConflict:'id'});
   if(savedRow.error)throw savedRow.error;
   // Atualiza o catálogo público apenas se a campanha já estiver efetivamente liberada.
   const existing=await adminClient.from('published_campaigns').select('payload,publish_at').eq('id',c.id).maybeSingle();
   if(existing.error)throw existing.error;
   const releaseTime=existing.data?.publish_at?new Date(existing.data.publish_at).getTime():NaN;
   const canUpdatePublic=existing.data&&Number.isFinite(releaseTime)&&releaseTime<=Date.now();
   if(canUpdatePublic){
    const publicPayload={...existing.data.payload,cardImage:image};
    const updated=await adminClient.from('published_campaigns').update({
     payload:publicPayload,updated_by:auth.data.user.id,updated_at:new Date().toISOString()
    }).eq('id',c.id);
    if(updated.error)throw updated.error;
   }
   Object.assign(c,copy);saved++;
   // Nunca sincronizar uma capa de campanha ainda não liberada ao GitHub público.
   if(canUpdatePublic){
    try{
     const synced=await adminClient.functions.invoke('campaign-cover-github-sync',{body:{theme:c.theme,storagePath:path}});
     if(synced.error||!synced.data?.ok)throw Error(synced.data?.error||synced.error?.message||'GitHub indisponível');
     report.textContent='Capas salvas: '+saved+' de '+matched.length+'. GitHub: '+synced.data.path;
    }catch(gitError){failures.push(file.name+': imagem salva na V2, mas NÃO enviada ao GitHub ('+gitError.message+')');}
   }else{
    report.textContent='Capa salva apenas no rascunho. Sincronização pública adiada até a publicação.';
   }

  }catch(e){failures.push(file.name+': '+e.message)}
 }
 render();report.textContent='Importação finalizada: '+saved+' capa(s) no Supabase. Verifique abaixo as pendências de sincronização com o GitHub.'+(failures.length?' Pendências: '+failures.join('; '):'');
 }catch(e){report.textContent='Importação não concluída: '+e.message}finally{button.disabled=false}
 });
 $('upload-hero').addEventListener('click',()=>uploadMedia('hero'));
 $('upload-card').addEventListener('click',()=>uploadMedia('card'));
 function dateToIso(value){if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))throw Error('Informe data e hora válidas.');const milliseconds=new Date(value+':00-03:00').getTime();if(!Number.isFinite(milliseconds))throw Error('Data inválida.');return new Date(milliseconds).toISOString()}
 $('publish-db').addEventListener('click',async()=>{try{readForm();const c=data.campaigns[Number($('campaign').value)];if(c.status==='draft')throw Error('Altere o estado de rascunho antes de publicar.');const auth=await adminClient.auth.getUser();if(auth.error||!auth.data?.user)throw Error('Sessão expirada.');const scheduled=$('publish-at').value;const at=scheduled?dateToIso(scheduled):new Date().toISOString();if(!confirm('Publicar a campanha '+c.title+(scheduled?' no horário agendado':' agora')+'?'))return;const result=await adminClient.from('published_campaigns').upsert({id:c.id,payload:c,updated_by:auth.data.user.id,updated_at:new Date().toISOString(),publish_at:at},{onConflict:'id'});if(result.error)throw result.error;if(Date.parse(at)<=Date.now()&&[c.heroImage,c.cardImage].some(x=>String(x||'').startsWith('staging:'))){const promoted=await adminClient.functions.invoke('promote-campaign-covers',{body:{id:c.id}});if(promoted.error||!promoted.data?.ok)throw Error('Agendamento salvo, mas a promoção da capa não foi concluída. Verifique a publicação antes de divulgar.');const fresh=await adminClient.from('published_campaigns').select('payload').eq('id',c.id).maybeSingle();if(!fresh.error&&fresh.data?.payload){c.heroImage=fresh.data.payload.heroImage||null;c.cardImage=fresh.data.payload.cardImage||null;render();}say('Campanha publicada e capa privada promovida com sucesso.')}else say('Publicação configurada para '+at+'. Capas privadas agendadas aguardam processamento automático.');void loadCampaignDiagnostics()}catch(e){say('Publicação não realizada: '+e.message,true)}});
 $('unpublish-db').addEventListener('click',async()=>{try{const c=data.campaigns[Number($('campaign').value)];const auth=await adminClient.auth.getUser();if(auth.error||!auth.data?.user)throw Error('Sessão expirada.');if(!confirm('Retirar do ar a versão personalizada de '+c.title+'? O manifesto padrão poderá continuar exibindo a campanha.'))return;const result=await adminClient.from('published_campaigns').update({publish_at:'2099-01-01T00:00:00Z',updated_at:new Date().toISOString(),updated_by:auth.data.user.id}).eq('id',c.id);if(result.error)throw result.error;say('Versão personalizada desativada; o manifesto estático continua independente.');void loadCampaignDiagnostics();}catch(e){say('Não foi possível desativar: '+e.message,true)}});
 $('clear-image').addEventListener('click',()=>{if(localPreviewUrl)URL.revokeObjectURL(localPreviewUrl);localPreviewUrl=null;$('local-image').value='';preview()});
 $('add-day').addEventListener('click',()=>{try{readForm();const c=data.campaigns[Number($('campaign').value)];c.days.push({date:c.start,title:'Novo arquivo',url:null,published:false});render();preview()}catch(e){say(e.message,true)}});
 $('save-db').addEventListener('click',async()=>{try{readForm();const c=data.campaigns[Number($('campaign').value)];const {data:auth,error:authErr}=await adminClient.auth.getUser();if(authErr||!auth?.user)throw Error('Sessão expirada. Entre novamente.');const result=await adminClient.from('editorial_campaigns').upsert({id:c.id,payload:c,updated_by:auth.user.id,updated_at:new Date().toISOString()},{onConflict:'id'}).select('id').single();if(result.error)throw result.error;say('Campanha salva no banco administrativo. Ainda não está publicada no site.');}catch(e){say('Falha ao salvar: '+e.message,true)}});
 $('reload-db').addEventListener('click',async()=>{try{const result=await adminClient.from('editorial_campaigns').select('id,payload');if(result.error)throw result.error;for(const row of result.data||[]){const i=data.campaigns.findIndex(c=>c.id===row.id);if(i>=0)data.campaigns[i]=row.payload;}validate();render();say('Dados administrativos recarregados.');}catch(e){say('Falha ao recarregar: '+e.message,true)}});
 $('validate').addEventListener('click',()=>{try{readForm();say('Manifesto válido. Publicação não realizada.')}catch(e){say(e.message,true)}});
 $('export').addEventListener('click',()=>{try{readForm();const blob=new Blob([JSON.stringify(data,null,2)+'\n'],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='especiais.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);say('Manifesto exportado. Envie-o para revisão no GitHub antes de publicar.')}catch(e){say(e.message,true)}});
}catch(e){say('Não foi possível abrir o editor: '+e.message,true)}
})();