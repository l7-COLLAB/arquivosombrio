/* Curadoria do Atlas: autenticação real + RLS no banco; salvar nunca publica. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const PROJECT = 'https://iuhotznurbyujzbyhizf.supabase.co';
  const KEY = 'sb_publishable_bpAZ5EhYLIuVoE4Q97s_-A_XQwwRxUj';
  const fields = ['country','state-region','city','neighborhood','event-year','precision','reference','latitude','longitude','review-note'];
  const db = window.supabase?.createClient(PROJECT,KEY,{auth:{
    storageKey:'arquivo-sombrio-admin-auth-v2',persistSession:true,autoRefreshToken:true,detectSessionInUrl:false
  }});
  let articles = [];
  let locations = [];
  let selectedId = null;
  let dirty = false;
  let loading = false;
  let geocodeResults = [];
  let lastGeocode = 0;
  const collator = new Intl.Collator('pt-BR',{sensitivity:'base'});
  const status = message => { $('status').textContent = String(message || ''); };
  const norm = value => String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLocaleLowerCase('pt-BR');
  const text = (tag, value, name) => {
    const el = document.createElement(tag);
    if (value != null) el.textContent = String(value);
    if (name) el.className = name;
    return el;
  };
  const source = article => article.kind + ':' + article.id;
  const label = article => (article.kind === 'dossie' ? 'DOSSIÊ' : 'GARIMPO') + ' #' + article.id;
  const yearOf = article => {
    const years=String(article.date||'').match(/(?<!\d)(?:1[5-9]\d{2}|20\d{2})(?!\d)/g);
    return years?.length ? Math.min(...years.map(Number)) : '';
  };
  const articleBy = (kind, id) => articles.find(a => a.kind === kind && a.id === Number(id));
  const currentArticle = () => articleBy($('source-type').value,$('source-id').value);
  function isCurrentDirty() { return dirty; }
  function confirmNavigation() {
    return !isCurrentDirty() || window.confirm('Há dados não salvos nesta ficha. Descartar as alterações?');
  }
  function appendOption(select, value, content) {
    const option = document.createElement('option');
    option.value = String(value);
    option.textContent = String(content);
    select.append(option);
  }
  function sourceOptions(value='') {
    const select=$('source-id');
    const type=$('source-type').value;
    select.replaceChildren();
    appendOption(select,'','Selecione um registro');
    articles.filter(a=>a.kind===type)
      .sort((a,b)=>collator.compare(a.title,b.title))
      .forEach(article=>appendOption(select,article.id,article.title+' · '+(article.status === 'publicado'?'publicado':'não publicado')));
    select.value=String(value||'');
    updateOriginalPlace();
  }
  function updateOriginalPlace() {
    const article=currentArticle();
    $('original-place').textContent = article ?
      'Campo original do artigo: '+(article.place||'não preenchido')+' · Período: '+(article.date||'não informado')+
      ' · Publicação: '+article.status : 'Selecione um artigo para consultar o local registrado no acervo.';
  }
  function setField(id,value) { $(id).value=value==null?'':String(value); }
  function clearForm() {
    selectedId=null;
    $('location-form').reset();
    $('source-type').value='dossie';
    sourceOptions();
    fields.forEach(id => {
      if (!['precision'].includes(id)) setField(id,'');
    });
    $('precision').value='city';
    $('form-title').textContent='Nova localização';
    $('geocode-results').hidden=true;
    geocodeResults=[];
    dirty=false;
    updateActions();
    updateMapLink();
  }
  function updateActions() {
    $('publish').disabled=!selectedId||dirty||loading||!locations.some(l=>l.id===selectedId&&!l.is_active);
    $('deactivate').disabled=!selectedId||dirty||loading||!locations.some(l=>l.id===selectedId&&l.is_active);
    $('save-draft').disabled=loading;
    $('new-entry').disabled=loading;
    $('save-note').textContent=dirty?
      'Alterações não salvas. Use “Salvar como pendente” antes de solicitar publicação.' :
      !selectedId?'Novo cadastro: salve como pendente e depois revise.' :
      locations.find(l=>l.id===selectedId)?.is_active?
        'Marcador ativo. Salvar qualquer alteração na localização o retira temporariamente do atlas, até uma nova revisão.' :
        'Marcador pendente ou desativado. Confira a documentação antes de ativá-lo.';
  }
  function pickArticle(kind,id) {
    if (!confirmNavigation()) return;
    clearForm();
    $('source-type').value=kind;
    sourceOptions(id);
    const a=currentArticle();
    if (a && yearOf(a)) setField('event-year',yearOf(a));
    setField('reference','Campo local e período do '+label(a));
    dirty=true;
    updateActions();
    $('form-title').textContent='Nova localização · '+label(a);
    $('source-id').focus();
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function pickLocation(row) {
    if (!confirmNavigation()) return;
    clearForm();
    selectedId=row.id;
    const kind=row.dossier_id?'dossie':'garimpo',id=row.dossier_id||row.daily_id;
    $('source-type').value=kind;
    sourceOptions(id);
    setField('country',row.country);
    setField('state-region',row.state_region);
    setField('city',row.city);
    setField('neighborhood',row.neighborhood);
    setField('event-year',row.event_year);
    setField('precision',row.location_precision);
    setField('latitude',row.latitude);
    setField('longitude',row.longitude);
    setField('reference',row.review_reference);
    setField('review-note',row.review_note);
    $('form-title').textContent='Editar localização #'+row.id;
    dirty=false;
    updateActions();
    updateMapLink();
    document.querySelector('.editor').scrollIntoView({behavior:'smooth',block:'start'});
  }
  function refreshLists() {
    const selected=$('record-filter').value;
    const statusFilter=$('status-filter').value;
    const results=$('location-list');
    results.replaceChildren();
    let found=0;
    locations.slice().sort((a,b)=>collator.compare(a.city,b.city)).forEach(row=>{
      const kind=row.dossier_id?'dossie':'garimpo',id=row.dossier_id||row.daily_id;
      const a=articleBy(kind,id);
      if (selected && ![a?.title,row.country,row.city,row.state_region].some(v=>norm(v).includes(norm(selected))))return;
      const state=row.is_active&&row.reviewed?'published':row.reviewed?'inactive':'pending';
      if(statusFilter!=='all'&&state!==statusFilter)return;
      found++;
      const button=text('button',null,'record-button '+state);
      button.type='button';
      button.setAttribute('aria-pressed',String(selectedId===row.id));
      button.append(text('span',state==='published'?'ATIVO':state==='inactive'?'DESATIVADO':'PENDENTE','state'));
      button.append(text('strong',a?.title||'Registro #'+id));
      button.append(text('small',row.city+' · '+row.country+' · '+row.event_year));
      button.addEventListener('click',()=>pickLocation(row));
      results.append(button);
    });
    if(!found)results.append(text('p','Nenhum registro nesta seleção.','empty'));
    const linked = new Set(locations.map(l=>l.dossier_id?'dossie:'+l.dossier_id:'garimpo:'+l.daily_id));
    const pending = articles.filter(a=>!linked.has(source(a))).sort((a,b)=>collator.compare(a.title,b.title));
    const unmapped = $('unmapped-list');
    unmapped.replaceChildren();
    pending.forEach(a=>{
      const button=text('button',null,'record-button pending');
      button.type='button';
      button.append(text('strong',a.title));
      button.append(text('small',label(a)+' · '+(a.place||'local não informado')));
      button.addEventListener('click',()=>pickArticle(a.kind,a.id));
      unmapped.append(button);
    });
    if(!pending.length)unmapped.append(text('p','Todos os registros têm pelo menos uma localidade cadastrada.','empty'));
    $('summary').textContent=locations.length+' locais cadastrados · '+
      locations.filter(l=>l.reviewed&&l.is_active).length+' ativados';
  }
  async function fetchAll() {
    if (!db) throw new Error('Biblioteca de autenticação não disponível.');
    const [d,g,l] = await Promise.all([
      db.from('Casos').select('id,titulo,local,ano,status_publicacao,categoria').order('id').limit(500),
      db.from('casos_diarios').select('id,titulo,local,data_caso,status_publicacao,categoria').order('id').limit(500),
      db.from('case_atlas_locations').select('id,dossier_id,daily_id,place_key,country,state_region,city,neighborhood,latitude,longitude,event_year,location_precision,reviewed,is_active,review_reference,review_note,reviewed_at,updated_at').order('id').limit(1000)
    ]);
    for(const result of [d,g,l])if(result.error)throw result.error;
    articles=[
      ...(d.data||[]).map(a=>({id:a.id,kind:'dossie',title:a.titulo,place:a.local,date:a.ano,status:a.status_publicacao})),
      ...(g.data||[]).map(a=>({id:a.id,kind:'garimpo',title:a.titulo,place:a.local,date:a.data_caso,status:a.status_publicacao}))
    ];
    locations=l.data||[];
    sourceOptions($('source-id').value);
    refreshLists();
  }
  function keyFor(item) {
    const pieces=[item.country,item.state_region,item.city,item.neighborhood].map(norm)
      .map(part=>part.replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')).filter(Boolean);
    return pieces.join('-').slice(0,200);
  }
  function payload() {
    const a=currentArticle();
    if(!a)throw new Error('Selecione um registro do acervo.');
    if(!$('location-form').reportValidity())throw new Error('Complete os campos obrigatórios.');
    const year=Number($('event-year').value),latitude=Number($('latitude').value),longitude=Number($('longitude').value);
    if(!Number.isInteger(year)||year<1000||year>new Date().getFullYear())throw new Error('Ano inicial deve ser histórico e não pode estar no futuro.');
    if(!Number.isFinite(latitude)||latitude<-90||latitude>90||!Number.isFinite(longitude)||longitude<-180||longitude>180)
      throw new Error('Coordenadas inválidas.');
    const record={
      dossier_id:a.kind==='dossie'?a.id:null,
      daily_id:a.kind==='garimpo'?a.id:null,
      country:$('country').value.trim(),
      state_region:$('state-region').value.trim()||null,
      city:$('city').value.trim(),
      neighborhood:$('neighborhood').value.trim()||null,
      latitude,longitude,event_year:year,
      location_precision:$('precision').value,
      review_reference:$('reference').value.trim(),
      review_note:$('review-note').value.trim()||null
    };
    if(record.review_reference.length<12)throw new Error('Descreva a fonte documental com ao menos 12 caracteres.');
    record.place_key=keyFor(record);
    if(record.place_key.length<3)throw new Error('Cidade ou país inválidos.');
    return record;
  }
  async function withBusy(fn) {
    if(loading)return;
    loading=true;updateActions();
    try { await fn(); }
    catch(error) { status('Não foi possível concluir: '+(error?.message||'erro inesperado')); }
    finally {loading=false;updateActions();}
  }
  async function saveDraft(event) {
    event.preventDefault();
    let record;
    try{record=payload();}catch(error){status(error.message);return;}
    if(selectedId && locations.find(l=>l.id===selectedId)?.is_active &&
      !window.confirm('Salvar irá retirar temporariamente este marcador do atlas até uma nova revisão. Continuar?'))return;
    await withBusy(async()=>{
      const now=new Date().toISOString();
      const value={...record,reviewed:false,is_active:false,reviewed_at:null,updated_at:now};
      const query=selectedId?
        db.from('case_atlas_locations').update(value).eq('id',selectedId):
        db.from('case_atlas_locations').insert(value);
      const {data,error}=await query.select('id').single();
      if(error)throw error;
      selectedId=data.id;
      dirty=false;
      await fetchAll();
      const updated=locations.find(l=>l.id===selectedId);
      if(updated)pickLocationSilently(updated);
      status('Localização salva como pendente. O atlas público não foi alterado por este cadastro.');
    });
  }
  function pickLocationSilently(row) {
    // Reidrata sem disparar confirmação de alterações perdidas.
    dirty=false;
    pickLocation(row);
  }
  async function publish() {
    if(!selectedId||dirty)return;
    const row=locations.find(l=>l.id===selectedId);
    if(!row)return;
    if(!row.review_reference||row.review_reference.trim().length<12)return status('Informe a base documental antes de aprovar.');
    const a=articleBy(row.dossier_id?'dossie':'garimpo',row.dossier_id||row.daily_id);
    const message='Conferiu cidade, ano, coordenadas aproximadas e fonte de '+(a?.title||'este registro')+
      '?\n\nO marcador será ativado na página pública quando o artigo estiver publicado e elegível.';
    if(!window.confirm(message))return;
    await withBusy(async()=>{
      const now=new Date().toISOString();
      const {error}=await db.from('case_atlas_locations')
        .update({reviewed:true,is_active:true,reviewed_at:now,updated_at:now}).eq('id',selectedId);
      if(error)throw error;
      await fetchAll();
      const updated=locations.find(l=>l.id===selectedId);
      if(updated)pickLocationSilently(updated);
      status('Revisão concluída. A localidade aparece no atlas se o artigo estiver publicado e elegível.');
    });
  }
  async function deactivate() {
    if(!selectedId||dirty)return;
    if(!window.confirm('Desativar este marcador no atlas? O artigo e o cadastro serão preservados.'))return;
    await withBusy(async()=>{
      const {error}=await db.from('case_atlas_locations')
        .update({is_active:false,updated_at:new Date().toISOString()}).eq('id',selectedId);
      if(error)throw error;
      await fetchAll();
      const updated=locations.find(l=>l.id===selectedId);
      if(updated)pickLocationSilently(updated);
      status('Marcador desativado sem excluir o registro original.');
    });
  }
  function updateMapLink() {
    const la=Number($('latitude').value),lo=Number($('longitude').value);
    const valid=$('latitude').value!==''&&$('longitude').value!==''&&
      Number.isFinite(la)&&Math.abs(la)<=90&&Number.isFinite(lo)&&Math.abs(lo)<=180;
    const link=$('open-map');
    link.href=valid?
      'https://www.openstreetmap.org/?mlat='+la+'&mlon='+lo+'#map=10/'+la+'/'+lo:
      'https://www.openstreetmap.org/';
    link.textContent=valid?'Conferir coordenadas no mapa':'Abrir OpenStreetMap';
  }
  async function geocode() {
    const city=$('city').value.trim(),country=$('country').value.trim();
    if(!city||!country)return status('Informe cidade e país antes de buscar coordenadas.');
    if(Date.now()-lastGeocode<1100)return status('Aguarde um instante antes de repetir a busca.');
    lastGeocode=Date.now();
    const button=$('geocode');
    button.disabled=true;
    $('geocode-results').hidden=true;
    status('Consultando localidades no OpenStreetMap...');
    try{
      const params=new URLSearchParams({format:'json',limit:'3',addressdetails:'1',q:[city,$('state-region').value.trim(),country].filter(Boolean).join(', ')});
      const res=await fetch('https://nominatim.openstreetmap.org/search?'+params,{headers:{Accept:'application/json','Accept-Language':'pt-BR'},credentials:'omit'});
      if(!res.ok)throw Error('Serviço geográfico indisponível ('+res.status+')');
      geocodeResults=(await res.json()).filter(x=>Number.isFinite(Number(x.lat))&&Number.isFinite(Number(x.lon)));
      if(!geocodeResults.length)throw Error('Nenhuma cidade localizada. Preencha coordenadas manualmente após conferência.');
      $('geocode-candidates').replaceChildren();
      geocodeResults.forEach((x,i)=>appendOption($('geocode-candidates'),i,x.display_name?.slice(0,250)||'Resultado '+(i+1)));
      $('geocode-results').hidden=false;
      status('Selecione a localidade correta. Nenhuma coordenada será aplicada sem sua confirmação.');
    }catch(error){status('Geocodificação: '+error.message);}
    finally{button.disabled=false;}
  }
  function useGeocode() {
    const value=geocodeResults[Number($('geocode-candidates').value)];
    if(!value)return;
    setField('latitude',Number(value.lat).toFixed(6));
    setField('longitude',Number(value.lon).toFixed(6));
    dirty=true;updateActions();updateMapLink();
    status('Coordenadas preenchidas. Confira o ponto no mapa e salve como pendente.');
  }
  function bind() {
    $('location-form').addEventListener('submit',saveDraft);
    $('publish').addEventListener('click',publish);
    $('deactivate').addEventListener('click',deactivate);
    $('new-entry').addEventListener('click',()=>{if(confirmNavigation())clearForm();});
    $('refresh').addEventListener('click',()=>withBusy(async()=>{await fetchAll();status('Catálogo atualizado.');}));
    $('record-filter').addEventListener('input',refreshLists);
    $('status-filter').addEventListener('change',refreshLists);
    $('source-type').addEventListener('change',()=>{sourceOptions();dirty=true;updateActions();});
    $('source-id').addEventListener('change',()=>{
      updateOriginalPlace();
      if(!selectedId){const a=currentArticle();if(a&&yearOf(a))setField('event-year',yearOf(a));if(a)setField('reference','Campo local e período do '+label(a));}
      dirty=true;updateActions();
    });
    fields.forEach(id=>$(id).addEventListener('input',()=>{
      dirty=true;updateActions();
      if(id==='latitude'||id==='longitude')updateMapLink();
      if(['city','country','state-region'].includes(id))$('geocode-results').hidden=true;
    }));
    $('precision').addEventListener('change',()=>{dirty=true;updateActions();});
    $('geocode').addEventListener('click',geocode);
    $('use-geocode').addEventListener('click',useGeocode);
    window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
  }
  async function init() {
    bind();
    if(!db){status('Falha ao carregar a biblioteca de autenticação.');$('restricted').hidden=false;return;}
    try {
      const {data,error}=await db.auth.getUser();
      if(error||data?.user?.app_metadata?.role!=='admin') {
        $('restricted').hidden=false;
        status('Sessão administrativa não validada.');return;
      }
      await fetchAll();
      $('workspace').hidden=false;
      clearForm();
      status('Catálogo carregado. Toda modificação exige autorização administrativa no banco.');
    }catch(error) {
      $('restricted').hidden=false;
      status('Não foi possível confirmar acesso aos dados privados: '+(error?.message||'erro'));
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();