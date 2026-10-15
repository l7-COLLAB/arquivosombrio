(function(){
'use strict';
const KEY='arquivo-visual-v2-draft-1';
const ids=['font','size','textColor','bg','width','padding','margin','radius','align'];
const $=id=>document.getElementById(id);
const safePages=new Set(['index.html','garimpo.html','pericia.html','lendas.html','creepypastas.html','novels.html','caso.html']);
const controls=Object.fromEntries(ids.map(id=>[id,$(id)]));
let selected=null,editEnabled=true,frameDoc=null;
let draft={};try{draft=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(_){draft={}}
const status=msg=>$('status').textContent=msg;
const page=()=>$('page').value,target=()=>{if($('applyScope')?.value==='category'){const group=window.AdvancedStudio?.groupSelector(selected?.element);if(group)return group}return selected?.selector||$('target').value},key=()=>page()+'|'+target();
const htmlEscape=s=>String(s).replace(/[^a-z0-9_-]/gi,'');
function defaultValues(){return{font:'',size:'18',textColor:'#e9dfd1',bg:'#16110f',width:'1100',padding:'16',margin:'0',radius:'0',align:''}}
function properties(v){const p={};if(v.font)p['font-family']=v.font;if(v.size)p['font-size']=v.size+'px';if(v.textColor)p.color=v.textColor;if(v.bg)p['background-color']=v.bg;if(v.width)p['max-width']=v.width+'px';if(v.padding)p.padding=v.padding+'px';if(v.margin)p.margin=v.margin+'px auto';if(v.radius)p['border-radius']=v.radius+'px';if(v.align)p['text-align']=v.align;return p}
function buildCSS(which){return Object.entries(validatedSettings(draft)).filter(([k])=>!which||k.startsWith(which+'|')).map(([k,v])=>{const selector=k.slice(k.indexOf('|')+1),props=Object.entries(properties(v)),textProps=props.filter(([name])=>['font-family','font-size','color'].includes(name)),cardScope=v.scope==='cards',rootProps=cardScope?props.filter(([name])=>!['font-family','font-size','color'].includes(name)):props,root=rootProps.map(([name,value])=>name+': '+value+' !important;').join(' '),inner=cardScope?textProps.map(([name,value])=>name+': '+value+' !important;').join(' '):'';return [root?selector+' { '+root+' }':'',inner?selector+' * { '+inner+' }':''].filter(Boolean).join(' ')}).filter(Boolean).join('\n')}
function refresh(){const f=$('preview');try{const d=f.contentDocument;if(!d)return;let el=d.getElementById('arquivo-v2-visual-preview');if(!el){el=d.createElement('style');el.id='arquivo-v2-visual-preview';d.head.appendChild(el)}el.textContent=buildCSS(page());if(selected?.element?.isConnected)selected.element.style.outline='2px dashed #e0a868';}catch(e){status('Prévia indisponível neste navegador: '+e.message)}}
function load(){const v=draft[key()]||{};ids.forEach(id=>{controls[id].value=v[id]??defaultValues()[id]});labels();refresh()}
function labels(){['size','width','padding','margin','radius'].forEach(id=>$(id+'Value').textContent=controls[id].value+'px')}
function set(id){const scope=$('applyScope')?.value||'selected',group=scope==='category'?window.AdvancedStudio?.groupSelector(selected?.element):null;if(scope==='category'&&!group){status('Selecione um card dentro da categoria para aplicar o padrão a todos os cards deste grupo.');return}window.dispatchEvent(new CustomEvent('visual-before-change'));const k=page()+'|'+(group||target());draft[k]={...(draft[k]||{}),...(scope==='category'?{scope:'cards'}:{}),[id]:controls[id].value};labels();refresh();status(scope==='category'?'Padrão aplicado na prévia a todos os cards deste grupo. Guarde para manter.':'Alteração aplicada na prévia. Guarde ou publique quando estiver satisfeita.')}
function save(){try{localStorage.setItem(KEY,JSON.stringify(draft));status('Rascunho salvo somente neste navegador.')}catch(e){status('Falha ao salvar: '+e.message)}}
function openPage(){const p=page();if(!safePages.has(p))return; $('preview').src='../'+encodeURIComponent(p);status('Abrindo a página para pré-visualização.')}
$('preview').addEventListener('load',()=>{selected=null;attachSelection();refresh()});$('page').addEventListener('change',()=>{selected=null;openPage();load()});$('target').addEventListener('change',()=>{clearSelection();load()});
$('applyScope')?.addEventListener('change',()=>{load();if($('applyScope').value==='category'&&!selected)status('Selecione um card na prévia para definir o padrão da categoria.')});
ids.forEach(id=>controls[id].addEventListener('input',()=>set(id)));
$('save').addEventListener('click',save);
$('reset').addEventListener('click',()=>{delete draft[key()];load();save()});
$('clear').addEventListener('click',()=>{if(!confirm('Apagar todos os rascunhos visuais deste navegador?'))return;draft={};localStorage.removeItem(KEY);load();status('Rascunhos apagados.')});
$('export').addEventListener('click',()=>{const css=buildCSS();const blob=new Blob([css],{type:'text/css'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='arquivo-sombrio-ajustes-visuais.css';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status('CSS exportado. A publicação requer revisão e integração ao site.')});
document.querySelectorAll('[data-device]').forEach(b=>b.addEventListener('click',()=>{$('frameWrap').style.width=b.dataset.device==='mobile'?'390px':'100%'}));


function allowedSelector(sel,legacy){
 if(legacy.has(sel))return true;
 if(typeof sel!=='string'||sel.length>380)return false;
 return /^body(?: > [a-z][a-z0-9-]*:nth-of-type\([1-9][0-9]{0,3}\)){1,12}(?: > [a-z][a-z0-9-]*(?:\.[a-z0-9_-]+){0,8})?$/i.test(sel);
}
function nodeSelector(el){
 const steps=[];
 for(let n=el;n&&n.tagName&&n.tagName.toLowerCase()!=='body'&&steps.length<12;n=n.parentElement){
  const tag=n.tagName.toLowerCase();
  if(!/^[a-z][a-z0-9-]*$/.test(tag))return null;
  let index=1;for(let prev=n.previousElementSibling;prev;prev=prev.previousElementSibling)if(prev.tagName===n.tagName)index++;
  if(index>9999)return null;
  steps.unshift(tag+':nth-of-type('+index+')');
 }
 return steps.length&&steps.length<=12?'body > '+steps.join(' > '):null;
}
function clearSelection(){
 if(selected?.element?.isConnected)selected.element.style.outline='';
 selected=null;$('selectedElement').textContent='Clique em qualquer elemento da prévia para selecioná-lo.';
}
function selectElement(el){
 if(!el||el===frameDoc?.body||el===frameDoc?.documentElement)return;
 const selector=nodeSelector(el);if(!selector){status('Esta área é muito profunda para edição direta. Selecione uma caixa externa.');return}
 clearSelection();selected={element:el,selector};
 $('selectedElement').textContent='Selecionado: '+el.tagName.toLowerCase()+(el.id?' #'+el.id:'')+' — '+(el.innerText||el.getAttribute('alt')||'').trim().slice(0,75);
 el.style.outline='2px dashed #e0a868';load();window.dispatchEvent(new CustomEvent('visual-selected',{detail:{selector,element:el}}));
}
function attachSelection(){
 try{
 const doc=$('preview').contentDocument;if(!doc||doc===frameDoc)return;
 frameDoc=doc;doc.addEventListener('click',event=>{
  if(!editEnabled)return;
  const el=event.target.closest('body *');if(!el)return;
  event.preventDefault();event.stopImmediatePropagation();selectElement(el);
 },true);
 doc.addEventListener('mouseover',event=>{
  if(!editEnabled||selected)return;
  const el=event.target;if(el?.style)el.style.cursor='crosshair';
 },true);
 }catch(e){status('Seleção direta indisponível nesta página: '+e.message)}
}
$('editMode').addEventListener('click',()=>{
 editEnabled=!editEnabled;$('editMode').setAttribute('aria-pressed',String(editEnabled));
 $('editMode').textContent=editEnabled?'Selecionar elementos: ligado':'Navegar pela página: ligado';
 if(!editEnabled)clearSelection();
});
$('selectParent').addEventListener('click',()=>{
 const parent=selected?.element?.parentElement;if(parent&&parent!==frameDoc?.body)selectElement(parent);
});

const publishedVersions=new Map();
async function client(){
 const c=typeof obterClienteAdminIsolado==='function'?obterClienteAdminIsolado():null;
 if(!c)throw new Error('Sessão administrativa indisponível');
 const s=await obterSessaoAdminIsolada();if(!s?.user?.id)throw new Error('Faça login novamente');
 return {c,user:s.user};
}
function validatedSettings(settings){
 const out={};
 const pages=new Set(Array.from($('page').options).map(o=>o.value));
 const selectors=new Set(Array.from($('target').options).map(o=>o.value));
 const fonts=new Set(Array.from($('font').options).map(o=>o.value));
 for(const [k,v] of Object.entries(settings||{})){
  const parts=k.split('|');
  if(parts.length!==2||!pages.has(parts[0])||!allowedSelector(parts[1],selectors)||!v||typeof v!=='object')continue;
  const p={};
  if(fonts.has(v.font))p.font=v.font;
  if(v.scope==='cards')p.scope='cards';
  for(const [field,min,max] of [['size',10,72],['width',200,1600],['padding',0,100],['margin',0,100],['radius',0,45]]){
   const n=Number(v[field]);if(Number.isFinite(n)&&n>=min&&n<=max)p[field]=String(n);
  }
  for(const field of ['textColor','bg'])if(/^#[0-9a-f]{6}$/i.test(v[field]||''))p[field]=v[field];
  if(['left','center','right',''].includes(v.align))p.align=v.align;
  out[k]=p;
 }
 return out;
}
async function versions(){
 try{
  const {c}=await client();
  const {data,error}=await c.from('visual_site_versions').select('id,created_at,note,settings').order('id',{ascending:false}).limit(30);
  if(error)throw error;
  publishedVersions.clear();
  const sel=$('versions');sel.textContent='';
  if(!data?.length){const o=new Option('Nenhuma versão publicada','');sel.add(o);}
  else for(const v of data){publishedVersions.set(String(v.id),v);sel.add(new Option('#'+v.id+' · '+new Date(v.created_at).toLocaleString('pt-BR')+' · '+(v.note||'Sem descrição'),String(v.id)));}
  status('Histórico atualizado: '+(data?.length||0)+' versões.');
 }catch(e){status('Não foi possível ler versões. Verifique se a migração foi aplicada: '+e.message)}
}
async function insertVersion(settings,note){
 const {c,user}=await client();
 const clean=validatedSettings(settings);
 if(window.AdvancedStudio)clean.__studio_v2=window.AdvancedStudio.export();
 if(JSON.stringify(clean).length>90000)throw Error('Personalização excede o limite permitido.');
 const {error}=await c.from('visual_site_versions').insert({author_id:user.id,note,settings:clean});
 if(error)throw error;
}
$('publish').addEventListener('click',async()=>{
 if(!confirm('Publicar estes ajustes para todos os visitantes do site?'))return;
 const btn=$('publish');btn.disabled=true;
 try{
  await insertVersion(draft,$('versionNote').value.trim()||'Atualização visual pela V2');
  save();await versions();status('Nova versão publicada no banco. O site passa a carregar os ajustes após o deploy do código público.');
 }catch(e){status('Falha ao publicar: '+e.message)}
 finally{btn.disabled=false}
});
$('reloadVersions').addEventListener('click',versions);
$('restore').addEventListener('click',async()=>{
 const v=publishedVersions.get($('versions').value);
 if(!v){status('Selecione uma versão.');return}
 if(!confirm('Restaurar o visual da versão #'+v.id+' para todos os visitantes?'))return;
 const btn=$('restore');btn.disabled=true;
 try{
  await insertVersion(v.settings,'Restauração da versão #'+v.id);
  draft=validatedSettings(v.settings);if(window.AdvancedStudio)window.AdvancedStudio.import(v.settings?.__studio_v2||{});save();load();await versions();
  status('Versão #'+v.id+' restaurada por nova publicação.');
 }catch(e){status('Falha ao restaurar: '+e.message)}
 finally{btn.disabled=false}
});
window.VisualStudioAPI={getClient:client,getDraft:()=>structuredClone(draft),replaceDraft:d=>{draft=validatedSettings(d);load();refresh();},getPage:page,getSelected:()=>selected,getDoc:()=>$('preview').contentDocument,refresh,save,load,selectElement,openPage,validate:validatedSettings,notify:status};
versions();

load();openPage();
})();