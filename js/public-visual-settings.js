(function(){
'use strict';
const endpoint='https://iuhotznurbyujzbyhizf.supabase.co/rest/v1/visual_site_versions?select=id,settings&order=id.desc&limit=1';
const key='sb_publishable_bpAZ5EhYLIuVoE4Q97s_-A_XQwwRxUj';
const selectors=new Set(['body','.main-header','.hero','.hero-title','.section-title','.category-title','.container','.card','.btn','.main-footer']);
function allowedSelector(s){return selectors.has(s)||(typeof s==='string'&&s.length<=380&&/^body(?: > [a-z][a-z0-9-]*:nth-of-type\([1-9][0-9]{0,3}\)){1,12}$/i.test(s));}
const fonts=new Set(['Georgia, serif','Verdana, sans-serif','Arial, sans-serif',"'Times New Roman', serif","'Courier New', monospace","'Cinzel', serif","'Libre Baskerville', serif"]);
const color=v=>/^#[0-9a-f]{6}$/i.test(v||'')?v:null;
const px=(v,min,max)=>{let n=Number(v);return Number.isFinite(n)&&n>=min&&n<=max? n+'px':null};
function rule(v){if(!v||typeof v!=='object'||Array.isArray(v))return'';const p=[];
if(fonts.has(v.font))p.push('font-family:'+v.font);
let size=px(v.size,10,72);if(size)p.push('font-size:'+size);
let tc=color(v.textColor);if(tc)p.push('color:'+tc);
let bg=color(v.bg);if(bg)p.push('background-color:'+bg);
let width=px(v.width,200,1600);if(width)p.push('max-width:'+width);
let padding=px(v.padding,0,100);if(padding)p.push('padding:'+padding);
let margin=px(v.margin,0,100);if(margin)p.push('margin:'+margin+' auto');
let radius=px(v.radius,0,45);if(radius)p.push('border-radius:'+radius);
if(['left','center','right'].includes(v.align))p.push('text-align:'+v.align);
return p.map(x=>x+' !important').join(';');
}
function css(settings){if(!settings||typeof settings!=='object'||Array.isArray(settings))return'';
const basename=location.pathname.split('/').pop()||'index.html';
return Object.entries(settings).filter(([key])=>key.startsWith(basename+'|')).map(([key,v])=>{
const selector=key.slice(basename.length+1);if(!allowedSelector(selector))return'';
const props=rule(v);return props?selector+'{'+props+'}':'';
}).join('\n');
}

function advanced(settings){
 const v=settings.__studio_v2;
 if(!v||typeof v!=='object')return;
 const basename=location.pathname.split('/').pop()||'index.html';
 const entries=v.pages?.[basename]||{};
 let rules='',mobile='',desktop='';
 for(const [selector,r] of Object.entries(entries)){
  if(!allowedSelector(selector)||!r||typeof r!=='object')continue;
  if(Number.isInteger(r.order)&&r.order>=-30&&r.order<=30)rules+=selector+'{order:'+r.order+' !important}';
  if(Number.isInteger(r.mobileSize)&&r.mobileSize>=10&&r.mobileSize<=60)mobile+=selector+'{font-size:'+r.mobileSize+'px !important}';
  if(Number.isInteger(r.desktopSize)&&r.desktopSize>=10&&r.desktopSize<=90)desktop+=selector+'{font-size:'+r.desktopSize+'px !important}';
  if(typeof r.image==='string'&&r.image.startsWith('/')&&/\\.(png|jpe?g|webp|avif|gif)(?:$|\\?)/i.test(r.image)){
   const img=document.querySelector(selector);
   if(img?.tagName==='IMG'){img.src=r.image;if(['cover','contain','fill'].includes(r.fit))img.style.objectFit=r.fit}
  }
 }
 const colors=v.global||{};
 const palette={accent:colors.accent,foreground:colors.foreground,background:colors.background};
 const tokens=Object.entries(palette).filter(([,x])=>color(x)).map(([k,val])=>'--studio-'+k+':'+val+';').join('');
 const el=document.createElement('style');el.id='arquivo-public-visual-advanced';
 el.textContent=':root{'+tokens+'}'+rules+'@media(max-width:767px){'+mobile+'}@media(min-width:768px){'+desktop+'}';
 document.head.appendChild(el);
}

fetch(endpoint,{headers:{apikey:key},cache:'no-store'}).then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()}).then(rows=>{
if(!Array.isArray(rows)||!rows[0])return;
const style=document.createElement('style');style.id='arquivo-public-visual-settings';style.textContent=css(rows[0].settings);document.head.appendChild(style);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>advanced(rows[0].settings),{once:true});else advanced(rows[0].settings);
}).catch(e=>console.warn('Não foi possível carregar aparência publicada:',e.message));
})();