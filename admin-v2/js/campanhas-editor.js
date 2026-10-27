(async function(){'use strict';
const $=id=>document.getElementById(id),status=$('status');let data=null;let adminClient=null;let previewMode='detail',mobileMode=false,localPreviewUrl=null;
function say(message,err){status.textContent=message;status.style.color=err?'#ffc2b8':'#c0dec3'}
function make(tag,attrs={},text=''){const el=document.createElement(tag);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));if(text)el.textContent=text;return el}
function option(value,text){return make('option',{value},text)}
function validate(){if(!data||!Array.isArray(data.campaigns))throw Error('Manifesto ausente.');const slugs=new Set();for(const c of data.campaigns){if(!/^[a-z0-9-]+$/.test(c.slug))throw Error('Slug inválido.');if(slugs.has(c.slug))throw Error('Slug duplicado.');slugs.add(c.slug);if(!/^\d{4}-\d{2}-\d{2}$/.test(c.start)||!/^\d{4}-\d{2}-\d{2}$/.test(c.end)||c.start>c.end)throw Error('Datas inválidas.');if(!Array.isArray(c.days))throw Error('Lista de arquivos inválida.');for(const d of c.days){if(d.date<c.start||d.date>c.end)throw Error('Dia fora da campanha.');if(d.published&&!/^\/(?!\/)[a-zA-Z0-9_./-]+(?:\?[a-zA-Z0-9_=&%.-]+)?$/.test(d.url||''))throw Error('Arquivo publicado sem URL local válida: '+d.title);if(d.url&&(d.url.includes('..')||d.url.includes('//')))throw Error('Caminho inseguro: '+d.title);}}return true;}
function readForm(){const c=data.campaigns[Number($('campaign').value)];c.title=$('name').value.trim();c.subtitle=$('subtitle').value.trim();c.introduction=$('introduction').value.trim();c.start=$('begin').value;c.end=$('finish').value;c.status=$('state').value;c.theme=$('theme').value;c.heroImage=$('hero-image').value.trim()||null;c.cardImage=$('card-image').value.trim()||null;c.overlay=Number($('overlay').value);c.heroPosition=Number($('hero-position').value);c.titleFont=$('font-family').value;c.accent=$('accent-color').value;for(let i=0;i<c.days.length;i++){const row=$('days').querySelector('[data-index="'+i+'"]');c.days[i].title=row.querySelector('[data-field=title]').value.trim();c.days[i].date=row.querySelector('[data-field=date]').value;c.days[i].url=row.querySelector('[data-field=url]').value.trim()||null;c.days[i].published=row.querySelector('[data-field=published]').checked;}if(!c.title)throw Error('Informe o título.');for(const img of [c.heroImage,c.cardImage])if(img&&!(/^\/(?!\/)[a-zA-Z0-9_./-]+\.(?:webp|png|jpe?g)$/.test(img)||/^https:\/\/iuhotznurbyujzbyhizf\.supabase\.co\/storage\/v1\/object\/public\/campaign-images\/[a-zA-Z0-9_./-]+\.(?:webp|png|jpe?g)$/.test(img))||img&&img.includes('..'))throw Error('Use um caminho local válido de imagem WebP, PNG ou JPG.');validate();}
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
 data.campaigns.forEach((c,i)=>{$('campaign').appendChild(option(String(i),c.title));if(!$('theme').querySelector('option[value="'+c.theme+'"]'))$('theme').appendChild(option(c.theme,c.title+' · tema próprio'));});$('campaign').addEventListener('change',()=>{if(localPreviewUrl)URL.revokeObjectURL(localPreviewUrl);localPreviewUrl=null;$('local-image').value='';render();});render();$('editor').hidden=false;say('Sessão validada. Editor local disponível; nenhuma mudança foi publicada.');
 function preview(){try{readForm();const c=data.campaigns[Number($('campaign').value)],target=$('campaign-preview');target.className=(mobileMode?'mobile-mode ':'')+'season-theme-'+c.theme;target.replaceChildren();const hero=make('div',{'class':'v2-campaign-hero'}),copy=make('div',{'class':'v2-campaign-copy'});const image=localPreviewUrl||c.heroImage||'/assets/especiais/banner-'+c.theme+'.svg';const safe=image.startsWith('blob:')||/^\/(?!\/)[a-zA-Z0-9_./-]+$/.test(image)||/^https:\/\/iuhotznurbyujzbyhizf\.supabase\.co\/storage\/v1\/object\/public\/campaign-images\/[a-zA-Z0-9_./-]+$/.test(image);hero.style.backgroundImage='linear-gradient(90deg,rgba(6,5,6,'+Number(c.overlay??55)/100+'),rgba(6,5,6,.15)),url("'+(safe?image:'/assets/especiais/banner-halloween.svg')+'")';hero.style.backgroundPosition='center,'+Number(c.heroPosition??65)+'% center';hero.style.borderColor=c.accent||'#de8c47';const heading=make('h2',{},c.title),sub=make('p',{},c.subtitle),kicker=make('div',{'class':'v2-campaign-sub'},c.label||'ARQUIVO ESPECIAL');heading.style.fontFamily=JSON.stringify(c.titleFont||'Cinzel')+',Georgia,serif';copy.append(kicker,heading,sub,make('p',{},'Início: '+c.start+' · Fim: '+c.end+' · '+c.status));if(previewMode==='detail'){copy.appendChild(make('p',{},'Próximos arquivos: '+c.days.length+' · Prévia sem publicação'));}else{copy.appendChild(make('p',{},'Explorar especial · Prévia do destaque da home'));}hero.appendChild(copy);target.appendChild(hero);say('Prévia atualizada — nenhuma alteração foi publicada.');}catch(e){say(e.message,true)}}
 $('preview').addEventListener('click',preview);
 $('preview-home').addEventListener('click',()=>{previewMode='home';preview()});
 $('preview-detail').addEventListener('click',()=>{previewMode='detail';preview()});
 $('preview-mobile').addEventListener('click',()=>{mobileMode=!mobileMode;preview()});
 $('local-image').addEventListener('change',e=>{const file=e.target.files?.[0];if(localPreviewUrl)URL.revokeObjectURL(localPreviewUrl);localPreviewUrl=null;if(file){if(!['image/webp','image/png','image/jpeg'].includes(file.type)||file.size>6*1024*1024){say('A imagem deve ser JPG, PNG ou WebP e ter até 6 MB.',true);return;}localPreviewUrl=URL.createObjectURL(file)}preview()});
 async function uploadMedia(destination){try{const file=$('local-image').files?.[0];if(!file)throw Error('Selecione uma imagem antes de enviar.');if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>6291456)throw Error('Aceitos JPG, PNG ou WebP com até 6 MB.');readForm();const auth=await adminClient.auth.getUser();if(auth.error||!auth.data?.user)throw Error('Sessão administrativa expirada.');const c=data.campaigns[Number($('campaign').value)];const suffix=file.type==='image/webp'?'webp':file.type==='image/png'?'png':'jpg';const filename=c.slug+'/'+Date.now().toString(36)+'-'+(destination==='hero'?'hero':'card')+'.'+suffix;const result=await adminClient.storage.from('campaign-images').upload(filename,file,{contentType:file.type,upsert:false,cacheControl:'3600'});if(result.error)throw result.error;const publicUrl=adminClient.storage.from('campaign-images').getPublicUrl(filename).data.publicUrl;if(destination==='hero')$('hero-image').value=publicUrl;else $('card-image').value=publicUrl;preview();say('Imagem enviada com sucesso. Salve o rascunho ou publique a campanha para aplicar.')}catch(e){say('Upload não realizado: '+e.message,true)}}

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
   const path=c.slug+'/capa-'+c.theme+'-'+Date.now().toString(36)+'.'+ext;
   const uploaded=await adminClient.storage.from('campaign-images').upload(path,file,{contentType:file.type,upsert:false,cacheControl:'3600'});
   if(uploaded.error)throw uploaded.error;
   const image=adminClient.storage.from('campaign-images').getPublicUrl(path).data.publicUrl;
   const copy={...c,cardImage:image};
   const savedRow=await adminClient.from('editorial_campaigns').upsert({id:c.id,payload:copy,updated_by:auth.data.user.id,updated_at:new Date().toISOString()},{onConflict:'id'});
   if(savedRow.error)throw savedRow.error;
   // Publica apenas a nova capa: preserva a programação e demais dados editoriais.
   const existing=await adminClient.from('published_campaigns').select('payload,publish_at').eq('id',c.id).maybeSingle();
   if(existing.error)throw existing.error;
   const publicPayload=existing.data?.payload&&typeof existing.data.payload==='object'?{...existing.data.payload,cardImage:image}:{...c,cardImage:image};
   const updated=await adminClient.from('published_campaigns').upsert({
    id:c.id,payload:publicPayload,updated_by:auth.data.user.id,
    updated_at:new Date().toISOString(),publish_at:existing.data?.publish_at||new Date().toISOString()
   },{onConflict:'id'});
   if(updated.error)throw updated.error;
   Object.assign(c,copy);saved++;
   // Sincronização opcional com GitHub via função segura (sem token no navegador).
   try{
    const synced=await adminClient.functions.invoke('campaign-cover-github-sync',{body:{theme:c.theme,storagePath:path}});
    if(synced.error||!synced.data?.ok)throw Error(synced.data?.error||synced.error?.message||'GitHub indisponível');
    report.textContent='Capas salvas: '+saved+' de '+matched.length+'. GitHub: '+synced.data.path;
   }catch(gitError){failures.push(file.name+': imagem salva na V2, mas NÃO enviada ao GitHub ('+gitError.message+')');}

  }catch(e){failures.push(file.name+': '+e.message)}
 }
 render();report.textContent='Importação finalizada: '+saved+' capa(s) no Supabase. Verifique abaixo as pendências de sincronização com o GitHub.'+(failures.length?' Pendências: '+failures.join('; '):'');
 }catch(e){report.textContent='Importação não concluída: '+e.message}finally{button.disabled=false}
 });
 $('upload-hero').addEventListener('click',()=>uploadMedia('hero'));
 $('upload-card').addEventListener('click',()=>uploadMedia('card'));
 function dateToIso(value){if(!/^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}$/.test(value))throw Error('Informe data e hora válidas.');const milliseconds=new Date(value+':00-03:00').getTime();if(!Number.isFinite(milliseconds))throw Error('Data inválida.');return new Date(milliseconds).toISOString()}
 $('publish-db').addEventListener('click',async()=>{try{readForm();const c=data.campaigns[Number($('campaign').value)];if(c.status==='draft')throw Error('Altere o estado de rascunho antes de publicar.');const auth=await adminClient.auth.getUser();if(auth.error||!auth.data?.user)throw Error('Sessão expirada.');const scheduled=$('publish-at').value;const at=scheduled?dateToIso(scheduled):new Date().toISOString();if(!confirm('Publicar a campanha '+c.title+(scheduled?' no horário agendado':' agora')+'?'))return;const result=await adminClient.from('published_campaigns').upsert({id:c.id,payload:c,updated_by:auth.data.user.id,updated_at:new Date().toISOString(),publish_at:at},{onConflict:'id'});if(result.error)throw result.error;say('Publicação configurada. Horário UTC: '+at+'. O site só exibe após o horário agendado.')}catch(e){say('Publicação não realizada: '+e.message,true)}});
 $('unpublish-db').addEventListener('click',async()=>{try{const c=data.campaigns[Number($('campaign').value)];const auth=await adminClient.auth.getUser();if(auth.error||!auth.data?.user)throw Error('Sessão expirada.');if(!confirm('Retirar do ar a versão personalizada de '+c.title+'? O manifesto padrão poderá continuar exibindo a campanha.'))return;const result=await adminClient.from('published_campaigns').update({publish_at:'2099-01-01T00:00:00Z',updated_at:new Date().toISOString(),updated_by:auth.data.user.id}).eq('id',c.id);if(result.error)throw result.error;say('Versão personalizada desativada; o manifesto estático continua independente.')}catch(e){say('Não foi possível desativar: '+e.message,true)}});
 $('clear-image').addEventListener('click',()=>{if(localPreviewUrl)URL.revokeObjectURL(localPreviewUrl);localPreviewUrl=null;$('local-image').value='';preview()});
 $('add-day').addEventListener('click',()=>{try{readForm();const c=data.campaigns[Number($('campaign').value)];c.days.push({date:c.start,title:'Novo arquivo',url:null,published:false});render();preview()}catch(e){say(e.message,true)}});
 $('save-db').addEventListener('click',async()=>{try{readForm();const c=data.campaigns[Number($('campaign').value)];const {data:auth,error:authErr}=await adminClient.auth.getUser();if(authErr||!auth?.user)throw Error('Sessão expirada. Entre novamente.');const result=await adminClient.from('editorial_campaigns').upsert({id:c.id,payload:c,updated_by:auth.user.id,updated_at:new Date().toISOString()},{onConflict:'id'}).select('id').single();if(result.error)throw result.error;say('Campanha salva no banco administrativo. Ainda não está publicada no site.');}catch(e){say('Falha ao salvar: '+e.message,true)}});
 $('reload-db').addEventListener('click',async()=>{try{const result=await adminClient.from('editorial_campaigns').select('id,payload');if(result.error)throw result.error;for(const row of result.data||[]){const i=data.campaigns.findIndex(c=>c.id===row.id);if(i>=0)data.campaigns[i]=row.payload;}validate();render();say('Dados administrativos recarregados.');}catch(e){say('Falha ao recarregar: '+e.message,true)}});
 $('validate').addEventListener('click',()=>{try{readForm();say('Manifesto válido. Publicação não realizada.')}catch(e){say(e.message,true)}});
 $('export').addEventListener('click',()=>{try{readForm();const blob=new Blob([JSON.stringify(data,null,2)+'\n'],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='especiais.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);say('Manifesto exportado. Envie-o para revisão no GitHub antes de publicar.')}catch(e){say(e.message,true)}});
}catch(e){say('Não foi possível abrir o editor: '+e.message,true)}
})();