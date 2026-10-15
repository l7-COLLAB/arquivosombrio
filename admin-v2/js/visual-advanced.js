(function(){
'use strict';
const api=window.VisualStudioAPI;if(!api)return;
const KEY='arquivo-visual-v2-advanced-1';
let state={global:{background:'#080706',foreground:'#e9dfd1',accent:'#a52b2c'},pages:{}};
try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved&&typeof saved==='object')state=sanitize(saved)}catch(_){}
let undo=[],redo=[],activeSelector='',activeElement=null,device='desktop';
const $=id=>document.getElementById(id);
function validSelector(s){return typeof s==='string'&&s.length<380&&/^(?:body(?: > [a-z][a-z0-9-]*:nth-of-type\([1-9][0-9]{0,3}\)){1,12}|#[a-z][a-z0-9_-]{0,63}(?: > [a-z][a-z0-9-]*:nth-of-type\([1-9][0-9]{0,3}\)){0,12})(?: > [a-z][a-z0-9-]*(?:\.[a-z0-9_-]+){0,8})?$/i.test(s)}
function safeUrl(u){try{const x=new URL(u,location.origin);return x.origin===location.origin&&/\.(png|jpe?g|webp|avif|gif)(?:$|\?)/i.test(x.pathname+x.search)?x.pathname+x.search:null}catch(_){return null}}
function sanitize(d){
 const v={global:{enabled:d?.global?.enabled===true},pages:{}};for(const k of ['background','foreground','accent'])if(/^#[0-9a-f]{6}$/i.test(d?.global?.[k]||''))v.global[k]=d.global[k];
 for(const [page,entries] of Object.entries(d?.pages||{})){
 if(!/^(index|garimpo|pericia|lendas|creepypastas|novels|caso)\.html$/.test(page)||!entries||typeof entries!=='object')continue;
 v.pages[page]={};
 for(const [selector,rule] of Object.entries(entries)){if(!validSelector(selector)||!rule||typeof rule!=='object')continue;
 const clean={};
 if(Number.isInteger(rule.order)&&rule.order>=-30&&rule.order<=30)clean.order=rule.order;
 if(Number.isInteger(rule.mobileSize)&&rule.mobileSize>=10&&rule.mobileSize<=60)clean.mobileSize=rule.mobileSize;
 if(Number.isInteger(rule.desktopSize)&&rule.desktopSize>=10&&rule.desktopSize<=90)clean.desktopSize=rule.desktopSize;
 if(rule.scope==='cards')clean.scope='cards';
 if(['cover','contain','fill'].includes(rule.fit))clean.fit=rule.fit;
 const url=safeUrl(rule.image||'');if(url)clean.image=url;
 if(Object.keys(clean).length)v.pages[page][selector]=clean;
 }
 }return v
}
function save(){state=sanitize(state);localStorage.setItem(KEY,JSON.stringify(state));refresh()}
function before(){undo.push(JSON.stringify({state,base:api.getDraft()}));if(undo.length>60)undo.shift();redo=[]}
function restore(snapshot){try{const v=JSON.parse(snapshot);state=sanitize(v.state);api.replaceDraft(v.base);save();updateSelected()}catch(e){api.notify('Não foi possível restaurar: '+e.message)}}
function undoAction(){if(!undo.length)return;redo.push(JSON.stringify({state,base:api.getDraft()}));restore(undo.pop())}
function redoAction(){if(!redo.length)return;undo.push(JSON.stringify({state,base:api.getDraft()}));restore(redo.pop())}
function current(){return (state.pages[api.getPage()]||{})[activeSelector]||{}}
function targetSelector(){if($('applyScope')?.value==='category'){const group=groupSelector(activeElement);if(group)return group;api.notify('Não identifiquei um grupo de cards reutilizável. Selecione o card da categoria na prévia.');return null}return activeSelector}
function modify(changes,groupable=true){const target=groupable?targetSelector():activeSelector;if(!target){if(!activeSelector)api.notify('Selecione um elemento da página.');return}before();state.pages[api.getPage()]??={};const old=state.pages[api.getPage()][target]||{};state.pages[api.getPage()][target]={...old,...changes,...(groupable&&$('applyScope')?.value==='category'?{scope:'cards'}:{})};save();updateSelected()}
function inject(){const css='#advanced-tools{border:1px solid #654b3a;padding:12px;margin-bottom:16px;background:#1b1512}#advanced-tools h2{margin:15px 0 8px}#studioLayers{max-height:220px;overflow:auto;background:#100d0b;border:1px solid #554136;padding:5px}#studioLayers button{display:block;width:100%;text-align:left;margin:2px 0;font-size:12px;padding:6px}#studioIssues{max-height:170px;overflow:auto;font-size:12px}#studioIssues li{margin-bottom:8px}#advanced-tools button{margin:3px 0}';
 const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);
 const box=document.createElement('section');box.id='advanced-tools';
 box.innerHTML='<h2>Ferramentas rápidas</h2><div class="inline"><button id="studioUndo">↶ Desfazer</button><button id="studioRedo">↷ Refazer</button></div><h2>Camadas da página</h2><p class="note">Clique em uma camada para selecioná-la.</p><div id="studioLayers"></div><button id="studioRefreshLayers">Atualizar camadas</button><h2>Posição e ordem</h2><p class="note">Altera a ordem visual em contêineres flexíveis ou em grade.</p><div class="inline"><button id="studioUp">↑ Anterior</button><button id="studioDown">↓ Próximo</button></div><h2>Imagens</h2><label for="studioImage">Endereço da imagem no próprio site</label><input id="studioImage" placeholder="/imagens/exemplo.webp"><label for="studioFit">Enquadramento</label><select id="studioFit"><option value="cover">Preencher</option><option value="contain">Mostrar inteira</option><option value="fill">Esticar</option></select><button id="studioApplyImage">Aplicar na imagem selecionada</button><p class="note">Por segurança, esta etapa aceita imagens já hospedadas no Arquivo Sombrio; envio de arquivos requer integração ao Storage.</p><h2>Visual responsivo</h2><label for="studioMobileSize">Tamanho da fonte no celular (px)</label><input id="studioMobileSize" type="number" min="10" max="60" placeholder="Original"><label for="studioDesktopSize">Tamanho da fonte no desktop (px)</label><input id="studioDesktopSize" type="number" min="10" max="90" placeholder="Original"><button id="studioApplyResponsive">Aplicar tamanhos</button><h2>Identidade visual global</h2><label for="studioAccent">Cor de destaque</label><input id="studioAccent" type="color"><label for="studioForeground">Cor principal dos textos</label><input id="studioForeground" type="color"><label for="studioBackground">Cor de fundo</label><input id="studioBackground" type="color"><button id="studioApplyTheme">Atualizar identidade</button><h2>Biblioteca de componentes</h2><select id="studioPreset"><option value="document">Cartão documental</option><option value="compact">Cartão compacto</option><option value="highlight">Destaque editorial</option></select><button id="studioApplyPreset">Aplicar estilo ao elemento</button><h2>Verificação visual</h2><button id="studioAudit">Analisar página</button><ul id="studioIssues"></ul>';
 $('page').closest('section').insertAdjacentElement('afterend',box);
 $('studioUndo').onclick=undoAction;$('studioRedo').onclick=redoAction;
 $('studioRefreshLayers').onclick=renderLayers;
 $('studioUp').onclick=()=>reorder(-1);$('studioDown').onclick=()=>reorder(1);
 $('studioApplyImage').onclick=()=>{if(activeElement?.tagName!=='IMG'){api.notify('Selecione uma imagem.');return}const image=safeUrl($('studioImage').value);if(!image){api.notify('Use uma URL de imagem do próprio domínio.');return}modify({image,fit:$('studioFit').value},false)};
 $('studioApplyResponsive').onclick=()=>{const m=Number($('studioMobileSize').value),d=Number($('studioDesktopSize').value);const ch={};if(m>=10&&m<=60)ch.mobileSize=m;if(d>=10&&d<=90)ch.desktopSize=d;if(!Object.keys(ch).length){api.notify('Informe um tamanho válido.');return}modify(ch)};
 for(const [id,k] of [['studioAccent','accent'],['studioForeground','foreground'],['studioBackground','background']])$(id).value=state.global[k]||'#808080';
 $('studioApplyTheme').onclick=()=>{before();state.global.enabled=true;for(const [id,k] of [['studioAccent','accent'],['studioForeground','foreground'],['studioBackground','background']])state.global[k]=$(id).value;save()};
 $('studioApplyPreset').onclick=()=>{const target=targetSelector();if(!target)return;const v=$('studioPreset').value;before();let d=api.getDraft();d[api.getPage()+'|'+target]={...(v==='document'?{bg:'#17110e',textColor:'#e9dfd1',padding:'24',radius:'0'}:v==='compact'?{bg:'#211915',padding:'10',radius:'4'}:{bg:'#311817',textColor:'#ffffff',padding:'32',radius:'6'}),...($('applyScope')?.value==='category'?{scope:'cards'}:{})};api.replaceDraft(d);api.refresh();api.notify($('applyScope')?.value==='category'?'Padrão do card aplicado ao grupo da categoria.':'Estilo aplicado ao elemento.')} ;
 $('studioAudit').onclick=audit;
 document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='z'&&!/input|textarea/i.test(e.target.tagName)){e.preventDefault();e.shiftKey?redoAction():undoAction()}});
}
function renderLayers(){
 const root=$('studioLayers');root.replaceChildren();
 const d=api.getDoc();if(!d?.body)return;
 const nodes=Array.from(d.querySelectorAll('header,main,section,article,nav,footer,h1,h2,h3,img,button,a')).slice(0,180);
 nodes.forEach(el=>{const b=document.createElement('button');b.type='button';b.draggable=true;b.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',String(nodes.indexOf(el)));});b.addEventListener('dragover',e=>e.preventDefault());b.addEventListener('drop',e=>{e.preventDefault();const from=nodes[Number(e.dataTransfer.getData('text/plain'))];reorderElements(from,el)});const name=(el.getAttribute('aria-label')||el.innerText||el.alt||'').trim().slice(0,42);b.textContent=el.tagName.toLowerCase()+' · '+name;b.onclick=()=>{el.scrollIntoView({block:'center'});api.selectElement(el)};root.appendChild(b)});
}
function updateSelected(){const r=current();$('studioImage').value=r.image||'';$('studioFit').value=r.fit||'cover';$('studioMobileSize').value=r.mobileSize||'';$('studioDesktopSize').value=r.desktopSize||''}
function selectorFor(el){
 const items=[];for(let n=el;n&&n.tagName&&n.tagName!=='BODY'&&items.length<12;n=n.parentElement){
  if(n.id&&/^[a-z][a-z0-9_-]{0,63}$/i.test(n.id))return '#'+n.id+(items.length?' > '+items.reverse().join(' > '):'');
  let count=1;for(let prev=n.previousElementSibling;prev;prev=prev.previousElementSibling)if(prev.tagName===n.tagName)count++;
  items.push(n.tagName.toLowerCase()+':nth-of-type('+count+')');
 }return items.length&&items.length<=12?'body > '+items.reverse().join(' > '):null;
}
function groupSelector(el){
 const body=api.getDoc()?.body;if(!el||!body)return null;let node=el,steps=0;
 while(node&&node!==body&&steps++<12){
  const parent=node.parentElement,tag=node.tagName.toLowerCase(),classes=Array.from(node.classList||[]).filter(x=>/^[a-z0-9_-]+$/i.test(x));
  const cardTokens=classes.filter(x=>/(?:^|[-_])(?:card|item|tile|entry|story|case|dossier|archive)(?:[-_](?:link|wrapper|container))?$/i.test(x));
  const cardLike=node.tagName==='ARTICLE'||cardTokens.length>0||(['A','DIV'].includes(node.tagName)&&!!node.querySelector('img')&&!!node.querySelector('h2,h3,p'));
  if(parent&&cardLike){
   const siblings=Array.from(parent.children).filter(other=>other.tagName===node.tagName&&(node.tagName==='ARTICLE'||cardTokens.some(x=>other.classList.contains(x))));
   const common=cardTokens.filter(x=>siblings.every(other=>other.classList.contains(x)));
   if(tag==='article'||common.length){const parentPath=selectorFor(parent),selector=parentPath+' > '+tag+common.sort().map(x=>'.'+x).join('');if(parentPath&&validSelector(selector))return selector;}
  }
  node=node.parentElement;
 }
 return null;
}
function reorderElements(first,second){
 if(!first||!second||first.parentElement!==second.parentElement||first===second)return;
 const parent=first.parentElement;
 const display=api.getDoc()?.defaultView?.getComputedStyle(parent)?.display||'';
 if(!/flex|grid/.test(display)){api.notify('Essa seção não pode ser reordenada sem alterar a estrutura do HTML.');return}
 const siblings=Array.from(parent.children);
 if(siblings.length>40){api.notify('Esta seção tem muitos elementos para reorganização segura.');return}
 const a=siblings.indexOf(first),b=siblings.indexOf(second);
 if(a<0||b<0)return;
 siblings.splice(a,1);siblings.splice(b,0,first);
 before();state.pages[api.getPage()]??={};
 siblings.forEach((el,index)=>{const selector=selectorFor(el);if(validSelector(selector))state.pages[api.getPage()][selector]={...(state.pages[api.getPage()][selector]||{}),order:index+1}});
 save();api.notify('Ordem visual atualizada na prévia. Salve ou publique para manter.');
}
function reorder(delta){if(!activeElement)return;const siblings=Array.from(activeElement.parentElement?.children||[]);const i=siblings.indexOf(activeElement);if(i<0||!siblings[i+delta])return;reorderElements(activeElement,siblings[i+delta])}
function advancedStyle(){
 const p=api.getPage();const d=api.getDoc();if(!d?.head)return;
 let normal='',mobile='',desktop='';
 for(const [sel,v] of Object.entries(state.pages[p]||{})){
 if(!validSelector(sel))continue;
 if(Number.isInteger(v.order))normal+=sel+'{order:'+v.order+' !important}';
 if(v.image)normal+=sel+'{object-fit:'+v.fit+' !important}';
 if(v.mobileSize)mobile+=(v.scope==='cards'?sel+' *':sel)+'{font-size:'+v.mobileSize+'px !important}';
 if(v.desktopSize)desktop+=(v.scope==='cards'?sel+' *':sel)+'{font-size:'+v.desktopSize+'px !important}';
 const el=d.querySelector(sel);if(el?.tagName==='IMG'&&v.image&&el.getAttribute('src')!==v.image)el.src=v.image;
 }
 let css=':root{--studio-accent:'+state.global.accent+';--studio-text:'+state.global.foreground+';--studio-bg:'+state.global.background+'}'+(state.global.enabled?'body{background-color:var(--studio-bg)!important;color:var(--studio-text)!important}a:focus-visible,button:focus-visible{outline-color:var(--studio-accent)!important}':'')+normal;
 css+='@media(max-width:767px){'+mobile+'}@media(min-width:768px){'+desktop+'}';
 let style=d.getElementById('arquivo-studio-advanced-preview');if(!style){style=d.createElement('style');style.id='arquivo-studio-advanced-preview';d.head.appendChild(style)}style.textContent=css;
}
function refresh(){advancedStyle()}
function audit(){const d=api.getDoc(), issues=[];if(!d?.body)return;
 const w=d.documentElement.clientWidth;
 d.querySelectorAll('body *').forEach(el=>{if(issues.length>=30)return;const r=el.getBoundingClientRect();if(r.width>0&&r.right>w+8)issues.push('Possível rolagem lateral: '+el.tagName.toLowerCase());if(el.tagName==='IMG'&&!el.alt)issues.push('Imagem sem descrição alternativa');if(el.matches('button,a')&&r.width>0&&r.height<24)issues.push('Área clicável pequena: '+el.tagName.toLowerCase())});
 const list=$('studioIssues');list.replaceChildren();(issues.length?issues:['Nenhum problema identificado nas verificações básicas.']).forEach(x=>{const li=document.createElement('li');li.textContent=x;list.appendChild(li)});}
window.addEventListener('visual-before-change',before);
window.addEventListener('visual-selected',e=>{activeSelector=e.detail.selector;activeElement=e.detail.element;updateSelected()});
$('preview').addEventListener('load',()=>{activeSelector='';activeElement=null;setTimeout(()=>{renderLayers();refresh()},700)});
const originalRefresh=api.refresh;api.refresh=function(){originalRefresh();refresh()};
window.AdvancedStudio={export:()=>sanitize(state),import:v=>{state=sanitize(v);save();renderLayers()},groupSelector};
inject();refresh();renderLayers();
})();