(function(){
'use strict';
const KEY='arquivo-visual-v2-draft-1';
const ids=['font','size','textColor','bg','width','padding','margin','radius','align'];
const $=id=>document.getElementById(id);
const safePages=new Set(['index.html','garimpo.html','pericias.html','lendas.html','creepypastas.html','biblioteca.html','caso.html']);
const controls=Object.fromEntries(ids.map(id=>[id,$(id)]));
let draft={};try{draft=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(_){draft={}}
const status=msg=>$('status').textContent=msg;
const page=()=>$('page').value,target=()=>$('target').value, key=()=>page()+'|'+target();
const htmlEscape=s=>String(s).replace(/[^a-z0-9_-]/gi,'');
function defaultValues(){return{font:'',size:'18',textColor:'#e9dfd1',bg:'#16110f',width:'1100',padding:'16',margin:'0',radius:'0',align:''}}
function properties(v){const p={};if(v.font)p['font-family']=v.font;if(v.size)p['font-size']=v.size+'px';if(v.textColor)p.color=v.textColor;if(v.bg)p['background-color']=v.bg;if(v.width)p['max-width']=v.width+'px';if(v.padding)p.padding=v.padding+'px';if(v.margin)p.margin=v.margin+'px auto';if(v.radius)p['border-radius']=v.radius+'px';if(v.align)p['text-align']=v.align;return p}
function buildCSS(which){return Object.entries(draft).filter(([k])=>!which||k.startsWith(which+'|')).map(([k,v])=>{const [p,selector]=k.split('|');if(!safePages.has(p)||!Array.from($('target').options).some(x=>x.value===selector))return'';const declarations=Object.entries(properties(v)).map(([name,value])=>name+': '+value+' !important;').join(' ');return declarations?selector+' { '+declarations+' }':''}).filter(Boolean).join('\n')}
function refresh(){const f=$('preview');try{const d=f.contentDocument;if(!d)return;let el=d.getElementById('arquivo-v2-visual-preview');if(!el){el=d.createElement('style');el.id='arquivo-v2-visual-preview';d.head.appendChild(el)}el.textContent=buildCSS(page());}catch(e){status('Prévia indisponível neste navegador: '+e.message)}}
function load(){const v=draft[key()]||defaultValues();ids.forEach(id=>{controls[id].value=v[id]??defaultValues()[id]});labels();refresh()}
function labels(){['size','width','padding','margin','radius'].forEach(id=>$(id+'Value').textContent=controls[id].value+'px')}
function set(){draft[key()]=Object.fromEntries(ids.map(id=>[id,controls[id].value]));labels();refresh();status('Alterações na prévia; salve o rascunho para conservar neste navegador.')}
function save(){try{localStorage.setItem(KEY,JSON.stringify(draft));status('Rascunho salvo somente neste navegador.')}catch(e){status('Falha ao salvar: '+e.message)}}
function openPage(){const p=page();if(!safePages.has(p))return; $('preview').src='../'+encodeURIComponent(p);status('Abrindo a página para pré-visualização.')}
$('preview').addEventListener('load',refresh);$('page').addEventListener('change',()=>{openPage();load()});$('target').addEventListener('change',load);
ids.forEach(id=>controls[id].addEventListener('input',set));
$('save').addEventListener('click',save);
$('reset').addEventListener('click',()=>{delete draft[key()];load();save()});
$('clear').addEventListener('click',()=>{if(!confirm('Apagar todos os rascunhos visuais deste navegador?'))return;draft={};localStorage.removeItem(KEY);load();status('Rascunhos apagados.')});
$('export').addEventListener('click',()=>{const css=buildCSS();const blob=new Blob([css],{type:'text/css'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='arquivo-sombrio-ajustes-visuais.css';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status('CSS exportado. A publicação requer revisão e integração ao site.')});
document.querySelectorAll('[data-device]').forEach(b=>b.addEventListener('click',()=>{$('frameWrap').style.width=b.dataset.device==='mobile'?'390px':'100%'}));

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
  if(parts.length!==2||!pages.has(parts[0])||!selectors.has(parts[1])||!v||typeof v!=='object')continue;
  const p={};
  if(fonts.has(v.font))p.font=v.font;
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
  draft=validatedSettings(v.settings);save();load();await versions();
  status('Versão #'+v.id+' restaurada por nova publicação.');
 }catch(e){status('Falha ao restaurar: '+e.message)}
 finally{btn.disabled=false}
});
versions();

load();openPage();
})();