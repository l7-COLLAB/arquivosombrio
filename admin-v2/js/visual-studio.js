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
load();openPage();
})();