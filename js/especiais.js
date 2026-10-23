/* Campanhas sazonais — infraestrutura pública, sem credenciais. */
(function(){
'use strict';
const TZ='America/Sao_Paulo';
let events=[];
function today(){const parts=new Intl.DateTimeFormat('en-US',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const get=t=>parts.find(p=>p.type===t).value;return get('year')+'-'+get('month')+'-'+get('day');}
function escapeHTML(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function linkOf(c){return c && c.published===true && typeof c.url==='string' && /^\/(?!\/)[\w\-/.]+(?:\?[\w=&%.-]+)?$/.test(c.url) && !c.url.includes('..') ? c.url:null;}
function activeAt(date){return events.find(e=>date>=e.start&&date<=e.end)||null;}
function cards(e, date){return e.days.map((d,i)=>{const url=d.date<=date?linkOf(d):null;const past=d.date<date;const current=d.date===date;const text=current?'ARQUIVO DO DIA':past?'DATA ANTERIOR':'EM BREVE';return '<li class="season-day '+(current?'is-today':'')+'"><span>NOITE '+(i+1)+'</span><strong>'+escapeHTML(d.date.slice(8))+'/10</strong><small>'+text+'</small>'+(url?'<a href="'+escapeHTML(url)+'">Ler arquivo</a>':'<span class="season-locked">'+(current?'Em preparação':'Aguardando publicação')+'</span>')+'</li>';}).join('');}
function section(e,date){const idx=e.days.findIndex(d=>d.date===date);const d=e.days[idx]||e.days[0];const url=d.date<=date?linkOf(d):null;return '<div class="container"><div class="season-head"><div class="season-overline">🎃 '+escapeHTML(e.label)+'</div><h2 id="season-home-title">'+escapeHTML(e.title)+'</h2><p>'+escapeHTML(e.subtitle)+'</p><div class="season-counter">NOITE '+(idx+1)+' DE '+e.days.length+'</div></div><div class="season-feature"><div class="season-art" role="img" aria-label="Ilustração temática de Halloween com lua e abóbora"><span aria-hidden="true">☾</span><span aria-hidden="true">🎃</span></div><div class="season-copy"><small>ARQUIVO DO DIA · '+escapeHTML(d.date.split('-').reverse().join('/'))+'</small><h3>'+escapeHTML(d.title)+'</h3><p>'+ (url?'Arquivo disponível para leitura.':'Esta pauta está em preparação e ainda não foi publicada.') +'</p><div class="season-actions">'+(url?'<a class="season-button" href="'+escapeHTML(url)+'">Ler arquivo</a>':'')+'<a class="season-secondary" href="/especiais/">Ver especial completo ↗</a></div></div></div><ol class="season-days">'+cards(e,date)+'</ol></div>';}
function mount(){
 const date=today(); const e=activeAt(date); const host=document.getElementById('home-main-feature');
 if(!e||!host||document.getElementById('season-home'))return;
 const s=document.createElement('section');s.id='season-home';s.className='season-home season-'+e.theme;
 s.setAttribute('aria-labelledby','season-home-title');s.innerHTML=section(e,date);
 host.parentNode.insertBefore(s,host);host.hidden=true;host.style.display='none';
}
function detail(){
 const root=document.getElementById('season-detail');if(!root)return;
 const e=events[0];if(!e)return;const date=today();const collection=cards(e,date);
 root.innerHTML='<div class="season-head"><div class="season-overline">🎃 ESPECIAL HALLOWEEN 2026</div><h1>'+escapeHTML(e.title)+'</h1><p>De 25 a 31 de outubro. Crimes e investigações com ligação documentada ao Halloween, apresentados com rigor editorial.</p></div><p class="season-disclaimer">Programação editorial sujeita a revisão. Os casos só recebem links quando os respectivos arquivos estiverem efetivamente publicados. Nem todos ocorreram em 31 de outubro nem são classificados como massacres.</p><ol class="season-days season-days-detail">'+collection+'</ol><p class="season-disclaimer">Para consultar outros conteúdos, acesse <a href="/dossies.html">Dossiês</a> e <a href="/garimpo.html">Garimpo Sombrio</a>.</p>';
}
async function start(){try{const response=await fetch('/data/especiais.json',{cache:'no-store'});if(!response.ok)throw new Error('Manifesto indisponível');const manifest=await response.json();if(!manifest||!Array.isArray(manifest.campaigns))throw new Error('Manifesto inválido');events=manifest.campaigns.filter(e=>e&&['scheduled','active','completed'].includes(e.status)&&/^\d{4}-\d{2}-\d{2}$/.test(e.start)&&/^\d{4}-\d{2}-\d{2}$/.test(e.end)&&Array.isArray(e.days));mount();detail();}catch(error){console.warn('Campanhas não exibidas:',error.message);/* preserva o destaque original */}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
