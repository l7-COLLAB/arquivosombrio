(function(){
'use strict';
const $=id=>document.getElementById(id);
const sections=Array.from(document.querySelectorAll('aside > section'));
const advanced=$('advanced-tools');
if(!advanced||sections.length<5)return;
const aside=document.querySelector('main > aside');
const panel=document.createElement('div');panel.id='simple-panel';
const head=document.createElement('div');head.id='simple-controls';
head.innerHTML='<div class="simple-heading"><strong>Mudar aparência</strong><span id="simpleState">Não publicado</span></div><div class="simple-actions"><button type="button" id="simpleBack">Sair</button><button type="button" id="simpleUndo">↶ Desfazer</button><button type="button" id="simpleRedo">↷ Refazer</button><button type="button" id="simpleSave">Guardar mudanças</button><button type="button" id="simplePublish">Aplicar no site</button></div><label for="simpleFind">O que você quer mudar?</label><input id="simpleFind" type="search" placeholder="Procure um texto, botão ou imagem..."><div id="simpleResults" role="listbox" aria-label="Elementos encontrados"></div><nav class="simple-tabs" aria-label="Ferramentas de edição"><button data-panel="find" class="active">1. Escolher</button><button data-panel="edit">2. Mudar</button><button data-panel="images">Fotos</button><button data-panel="layout">Posição</button><button data-panel="theme">Aparência</button><button data-panel="history">Voltar atrás</button></nav>';
aside.insertBefore(head,aside.firstChild);
sections.forEach(s=>panel.appendChild(s));
panel.appendChild(advanced);aside.insertBefore(panel,aside.children[1]);
const original={find:sections[0],edit:sections[1],layout:sections[2],history:sections[3],publish:sections[4]};
const groups={
find:[original.find],edit:[original.edit,original.layout],
images:[advanced],layout:[advanced],theme:[original.edit,advanced],
history:[original.history,original.publish]
};
const headings={images:['Imagens'],layout:['Camadas','Posição e ordem','Biblioteca'],theme:['Identidade visual global'],find:[],edit:[],history:[]};
let tab='find',savedLocal=null;
try{savedLocal=localStorage.getItem('arquivo-visual-v2-draft-1')}catch(_){}
function show(t){tab=t;document.querySelectorAll('.simple-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.panel===t));sections.forEach(s=>s.hidden=!groups[t].includes(s));advanced.hidden=!['images','layout','theme'].includes(t);
 advanced.querySelectorAll('h2').forEach(h=>{const enabled=(headings[t]||[]).some(x=>h.textContent.includes(x));h.hidden=!enabled;let n=h.nextElementSibling;while(n&&n.tagName!=='H2'){n.hidden=!enabled;n=n.nextElementSibling}});
 $('simpleResults').hidden=t!=='find';$('simpleFind').hidden=t!=='find';document.querySelector('label[for="simpleFind"]').hidden=t!=='find';
 if(t==='find')search();
}
function search(){
 const d=$('preview').contentDocument, q=$('simpleFind').value.trim().toLocaleLowerCase('pt-BR'),out=$('simpleResults');out.replaceChildren();
 if(!d?.body){out.textContent='Carregando a página...';return}
 const nodes=Array.from(d.querySelectorAll('header,nav,main,section,article,footer,h1,h2,h3,h4,p,img,button,a,.card')).filter(el=>{
 const r=el.getBoundingClientRect();return r.width>0&&r.height>0
 }).slice(0,300);
 const matched=nodes.map(el=>({el,name:(el.getAttribute('aria-label')||el.getAttribute('alt')||el.textContent||'').trim().replace(/\\s+/g,' ').slice(0,75)})).filter(x=>!q||(x.name+' '+x.el.tagName).toLocaleLowerCase('pt-BR').includes(q)).slice(0,35);
 if(!matched.length){out.textContent='Nenhum elemento encontrado nesta página.';return}
 matched.forEach(({el,name})=>{const b=document.createElement('button');b.type='button';b.setAttribute('role','option');b.textContent=(el.tagName==='IMG'?'Foto':['H1','H2','H3','H4'].includes(el.tagName)?'Título':el.tagName==='BUTTON'?'Botão':el.tagName==='A'?'Link':el.tagName==='P'?'Texto':['SECTION','ARTICLE','MAIN'].includes(el.tagName)?'Parte da página':'Item')+' · '+(name||'Sem nome');b.onclick=()=>{el.scrollIntoView({block:'center',behavior:'smooth'});window.VisualStudioAPI?.selectElement(el);show('edit')};out.appendChild(b)});
}
function current(){try{return localStorage.getItem('arquivo-visual-v2-draft-1')}catch(_){return null}}
function save(){document.getElementById('save')?.click();savedLocal=current();$('simpleState').textContent='Mudanças guardadas neste aparelho';}
function mark(){ $('simpleState').textContent='Ainda não publicado';}
document.querySelectorAll('.simple-tabs button').forEach(b=>b.onclick=()=>show(b.dataset.panel));
$('simpleFind').addEventListener('input',search);
$('simpleBack').onclick=()=>{if($('simpleState').textContent==='Ainda não publicado'&&!confirm('Sair do editor? Guarde suas mudanças antes de sair.'))return;location.href='./index.html'};
$('simpleUndo').onclick=()=>{if($('studioUndo'))$('studioUndo').click();mark()};
$('simpleRedo').onclick=()=>{if($('studioRedo'))$('studioRedo').click();mark()};
$('simpleSave').onclick=save;
$('simplePublish').onclick=()=>{save();if(confirm('Mudanças guardadas. Quer mostrar essas mudanças para todos no site?'))$('publish')?.click()};
document.getElementById('publish')?.addEventListener('click',()=>{$('simpleState').textContent='Confira abaixo se a publicação deu certo'});
$('preview').addEventListener('load',()=>setTimeout(search,600));
window.addEventListener('visual-selected',()=>{if(tab==='find')show('edit')});
document.querySelectorAll('input,select').forEach(el=>{if(el.id!=='simpleFind')el.addEventListener('input',mark)});
const css=document.createElement('style');
css.textContent=`aside{background:#120e0c!important;max-height:calc(100dvh - 65px);padding:14px!important}#simple-controls{position:relative;background:#17110e;padding:10px;border:1px solid #50362c;border-radius:8px;margin-bottom:14px}#simple-panel section{border:1px solid #4c372d;border-radius:8px;padding:14px;background:#19120f;margin:0 0 12px}#simple-panel section[hidden],#advanced-tools[hidden],#advanced-tools [hidden]{display:none!important}.simple-heading{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px}.simple-heading strong{font:700 21px Georgia,serif}.simple-heading span{font-size:11px;color:#c6ad92}.simple-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-bottom:12px}.simple-actions button{font-size:12px;padding:10px 5px}.simple-actions #simpleSave{background:#50402d}.simple-actions #simplePublish{background:#842b29;grid-column:span 2;border-color:#b64d43;font-weight:bold}.simple-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;margin-top:12px}.simple-tabs button{padding:10px 4px;font-size:11px}.simple-tabs button.active{background:#713329;color:#fff;border-color:#c7906e}#simpleResults{max-height:230px;overflow:auto;display:grid;gap:4px;margin:8px 0}#simpleResults[hidden]{display:none}#simpleResults button{font-size:11px;text-align:left;padding:9px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#advanced-tools{display:block!important}#advanced-tools[hidden]{display:none!important}#advanced-tools>h2{color:#dfc3a4}#status{font-size:12px}#simple-panel>section:first-child h2{font-size:15px}@media(min-width:850px){main{grid-template-columns:355px minmax(0,1fr)}.frame-wrap{height:calc(100dvh - 140px)}}`;
document.head.appendChild(css);
show('find');
})();