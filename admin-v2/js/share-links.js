(function(){
"use strict";
const categories=[
 {table:"Casos",key:"dossie",label:"Dossiê",page:"caso.html",date:"published_at"},
 {table:"pericias",key:"pericia",label:"Perícia",page:"pericia.html",date:"publicado_em"},
 {table:"casos_diarios",key:"garimpo",label:"Garimpo",page:"garimpo.html",date:"publicado_em"},
 {table:"creepypastas",key:"creepypasta",label:"Creepypasta",page:"creepypastas.html",date:"publicado_em"},
 {table:"lendas",key:"lenda",label:"Lenda",page:"lendas.html",date:"publicado_em"},
 {table:"novels",key:"novel",label:"Biblioteca (novels)",page:"novel.html",date:"publicado_em"}
];
const normalize=v=>String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("pt-BR");
window.mountArquivoShareLinks=function(root,client){
 if(!root)return;
 root.innerHTML='<h3>Links para divulgação</h3><p>Conteúdos publicados, atualizados automaticamente. Busque pelo nome ou filtre por categoria.</p><div class="share-link-filters"><label>Nome<input type="search" data-share-search placeholder="Buscar arquivo ou livro"></label><label>Categoria<select data-share-category><option value="">Todas as categorias</option></select></label><label>Ordenar<select data-share-sort><option value="recent">Recentes</option><option value="az">A–Z</option><option value="za">Z–A</option></select></label><label>Acompanhamento<select data-share-tracking><option value="">Todos</option><option value="ativo">Em acompanhamento</option><option value="encerrado">Encerrados</option></select></label><label>Formato<select data-share-medium><option value="">Link direto</option><option value="stories">Stories</option><option value="reels">Reels</option><option value="carousel">Carrossel</option><option value="bio">Bio</option><option value="post">Publicação</option></select></label></div><div class="share-link-actions"><button type="button" data-share-refresh>Atualizar lista</button><span data-share-state role="status" aria-live="polite"></span></div><div class="share-link-list" data-share-list></div>';
 const find=s=>root.querySelector(s),list=find('[data-share-list]'),status=find('[data-share-state]'),search=find('[data-share-search]'),category=find('[data-share-category]'),sort=find('[data-share-sort]'),medium=find('[data-share-medium]'),refresh=find('[data-share-refresh]');
 categories.forEach(c=>{const o=document.createElement('option');o.value=c.key;o.textContent=c.label;category.append(o);});
 let records=[],busy=false;
 function link(record){const url=new URL(record.page,'https://arquivosombrio.net.br/');url.searchParams.set(record.key==='novel'?'obra':'id',record.key==='novel'?record.slug:record.id);if(record.key==='pericia')url.hash='forense';if(medium.value){url.searchParams.set('utm_source','instagram');url.searchParams.set('utm_medium',medium.value);url.searchParams.set('utm_campaign','arquivo_sombrio');}return url.href;}
 function draw(){
  const query=normalize(search.value),filtered=records.filter(r=>(!category.value||category.value===r.key)&&normalize(r.titulo).includes(query)&&(!find('[data-share-tracking]').value||r.acompanhamento_status===find('[data-share-tracking]').value));
  filtered.sort((a,b)=>sort.value==='recent'?(b.timestamp-a.timestamp)||a.titulo.localeCompare(b.titulo,'pt-BR'):a.titulo.localeCompare(b.titulo,'pt-BR',{sensitivity:'base'})*(sort.value==='za'?-1:1));
  list.replaceChildren();
  for(const record of filtered){
   const row=document.createElement('article'),head=document.createElement('div'),title=document.createElement('strong'),meta=document.createElement('small'),actions=document.createElement('div'),input=document.createElement('input'),copy=document.createElement('button'),open=document.createElement('a');
   title.textContent=record.titulo;meta.textContent=(record.acompanhamento_status==='ativo'?'EM ACOMPANHAMENTO · ':'')+record.label+(record.published?' · '+new Date(record.published).toLocaleDateString('pt-BR'):'');head.append(title,meta);
   input.type='text';input.readOnly=true;input.value=link(record);input.setAttribute('aria-label','Link de '+record.titulo);copy.type='button';copy.textContent='Copiar link';open.textContent='Abrir';open.href=input.value;open.target='_blank';open.rel='noopener';
   copy.onclick=async()=>{try{await navigator.clipboard.writeText(input.value);status.textContent='Link copiado: '+record.titulo;}catch(_){input.focus();input.select();status.textContent='Selecione e copie o link exibido.';}};
   actions.className='share-link-row-actions';actions.append(input,copy,open);row.append(head,actions);list.append(row);
  }
  if(!filtered.length){const message=document.createElement('p');message.textContent='Nenhum conteúdo publicado corresponde aos filtros.';list.append(message);}
  status.textContent=filtered.length+' de '+records.length+' conteúdos publicados.';
 }
 async function load(){
  if(busy)return;busy=true;refresh.disabled=true;status.textContent='Consultando conteúdos publicados...';
  try{
   const results=await Promise.all(categories.map(async c=>{
    let rows=[],offset=0;
    while(true){const fields='id,titulo,created_at,'+c.date+(c.key==='novel'?',slug':'')+(['dossie','garimpo'].includes(c.key)?',acompanhamento_status':'');const q=await client.from(c.table).select(fields).eq('status_publicacao','publicado').order('id',{ascending:true}).range(offset,offset+499);if(q.error)throw Error(c.label+': '+q.error.message);rows=rows.concat(q.data||[]);if((q.data||[]).length<500)break;offset+=500;}
    return rows.filter(r=>c.key!=='novel'||r.slug).map(r=>({...r,...c,published:r[c.date]||null,timestamp:Date.parse(r[c.date]||r.created_at)||0}));
   }));
   if(!root.isConnected)return;records=results.flat();draw();
  }catch(e){status.textContent='Não foi possível atualizar a lista: '+e.message;}
  finally{busy=false;refresh.disabled=false;}
 }
 find("[data-share-tracking]").onchange=draw;search.oninput=draw;category.onchange=draw;sort.onchange=draw;medium.onchange=draw;refresh.onclick=load;
 const timer=setInterval(()=>{if(!root.isConnected){clearInterval(timer);return;}if(!document.hidden)load();},60000);
 load();
};
})();
