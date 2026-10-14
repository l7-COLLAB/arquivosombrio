(function(){
'use strict';
const api=window.VisualStudioAPI;if(!api)return;
const $=id=>document.getElementById(id);
const area=document.getElementById('simple-controls');if(!area)return;
const box=document.createElement('section');box.id='workbench';
box.innerHTML='<h2>Meu trabalho</h2><div class="work-tabs"><button type="button" id="workDrafts">Meus rascunhos</button><button type="button" id="workChanges">Minhas mudanças</button><button type="button" id="workCheck">Conferir página</button></div><div id="workBody" aria-live="polite"></div>';
area.appendChild(box);
const style=document.createElement('style');style.textContent='#workbench{margin:0;padding:10px;border:1px solid #513b32;border-radius:8px}#workbench h2{font-size:15px;margin:0 0 8px}.work-tabs{display:flex;gap:5px}.work-tabs button{flex:1;font-size:11px;padding:9px 5px}.work-tabs button.active{background:#6b3326}.work-item{display:flex;gap:6px;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #49372c}.work-item span{font-size:12px;overflow-wrap:anywhere}.work-item button{width:auto;padding:7px;font-size:11px}.work-msg{font-size:12px;color:#d4b59d;margin:10px 0}';document.head.appendChild(style);
let active=null,currentId=null,items=[];
function create(tag,text){const el=document.createElement(tag);el.textContent=text;return el}
function renderTitle(text){const body=$('workBody');body.replaceChildren();body.appendChild(create('p',text)).className='work-msg';return body}
function button(text,fn){const b=create('button',text);b.type='button';b.onclick=fn;return b}
function tab(id){document.querySelectorAll('.work-tabs button').forEach(b=>b.classList.toggle('active',b.id===id))}
function payload(){return {...api.getDraft(),__studio_v2:window.AdvancedStudio?.export()||{}}}
async function db(){const {c,user}=await api.getClient();return{c,user}}
async function fetchDrafts(){tab('workDrafts');const body=renderTitle('Rascunhos guardados na sua conta.');try{
 const {c,user}=await db();const {data,error}=await c.from('visual_site_drafts').select('id,title,settings,updated_at').eq('author_id',user.id).order('updated_at',{ascending:false}).limit(30);if(error)throw error;items=data||[];
 const top=document.createElement('div');const input=document.createElement('input');input.placeholder='Nome do rascunho';input.maxLength=100;input.value='Ajustes do site';top.append(input,button('Guardar novo rascunho',async()=>{try{const title=input.value.trim();if(!title)throw Error('Dê um nome ao rascunho.');const {c,user}=await db();const {error}=await c.from('visual_site_drafts').insert({title,author_id:user.id,settings:payload()});if(error)throw error;await fetchDrafts();api.notify('Rascunho guardado na conta.')}catch(e){api.notify('Erro: '+e.message)}}));body.appendChild(top);
 for(const x of items){const row=document.createElement('div');row.className='work-item';row.appendChild(create('span',x.title+' · '+new Date(x.updated_at).toLocaleDateString('pt-BR')));row.appendChild(button('Abrir',()=>{if(!confirm('Abrir este rascunho? Guarde as mudanças atuais antes de substituir.'))return;const raw=x.settings||{};const basic={...raw};delete basic.__studio_v2;api.replaceDraft(basic);window.AdvancedStudio?.import(raw.__studio_v2||{});currentId=x.id;api.save();api.notify('Rascunho carregado.');}));row.appendChild(button('Apagar',async()=>{if(!confirm('Apagar este rascunho da conta?'))return;const {c,user}=await db();const {error}=await c.from('visual_site_drafts').delete().eq('id',x.id).eq('author_id',user.id);if(error)api.notify(error.message);else fetchDrafts()}));body.appendChild(row);}
 if(currentId)body.appendChild(button('Atualizar rascunho aberto',async()=>{const {c,user}=await db();const {error}=await c.from('visual_site_drafts').update({settings:payload(),updated_at:new Date().toISOString()}).eq('id',currentId).eq('author_id',user.id);if(error)api.notify(error.message);else api.notify('Rascunho atualizado na conta.')}));
}catch(e){body.appendChild(create('p','Não foi possível abrir os rascunhos: '+e.message))}}
function changes(){tab('workChanges');const d=payload(),body=renderTitle('Mudanças preparadas para a próxima publicação.');let count=0;for(const [key,val] of Object.entries(d)){if(key==='__studio_v2')continue;count++;const row=document.createElement('div');row.className='work-item';row.appendChild(create('span',key.split('|')[0]+' · '+key.split('|').slice(1).join('|')+' ('+Object.keys(val||{}).length+' ajustes)'));row.appendChild(button('Desfazer',()=>{const next=api.getDraft();delete next[key];api.replaceDraft(next);api.save();changes()}));body.appendChild(row)}
const adv=d.__studio_v2;if(adv&&Object.values(adv.pages||{}).some(x=>Object.keys(x).length))body.appendChild(create('p','Também existem ajustes de imagens, posições ou tamanhos por dispositivo.'));
if(!count)body.appendChild(create('p','Nenhuma mudança básica neste rascunho.'));}
function audit(){tab('workCheck');const body=renderTitle('Confira os pontos abaixo antes de publicar.');const doc=api.getDoc();if(!doc?.body){body.appendChild(create('p','Aguarde a página carregar.'));return}
const issues=[];const w=doc.documentElement.clientWidth;
doc.querySelectorAll('img').forEach(img=>{if(!img.alt?.trim())issues.push('Imagem sem descrição: '+(img.src||'').split('/').pop());if(img.complete&&img.naturalWidth===0)issues.push('Imagem não carregou: '+(img.src||'').split('/').pop())});
doc.querySelectorAll('body *').forEach(el=>{if(issues.length>=25)return;const rect=el.getBoundingClientRect();if(rect.width>0&&rect.right>w+10&&getComputedStyle(el).position!=='fixed')issues.push('Elemento ultrapassa a largura: '+el.tagName)});
body.appendChild(create('p',issues.length?issues.length+' pontos para revisar. Não publique antes de conferir.':'Nenhum problema encontrado nas verificações básicas. Isso não substitui a revisão visual.'));
issues.slice(0,25).forEach(msg=>body.appendChild(create('p',msg)).classList.add('work-msg'));
body.appendChild(button('Ver novamente',audit));}
$('workDrafts').onclick=fetchDrafts;$('workChanges').onclick=changes;$('workCheck').onclick=audit;
const pub=$('simplePublish');if(pub){pub.addEventListener('click',()=>{if(active==='check')return;},true)}
window.VisualWorkbench={fetchDrafts,changes,audit};fetchDrafts();
})();