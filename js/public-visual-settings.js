(function(){
'use strict';
const endpoint='https://iuhotznurbyujzbyhizf.supabase.co/rest/v1/visual_site_versions?select=id,settings&order=id.desc&limit=1';
const key='sb_publishable_bpAZ5EhYLIuVoE4Q97s_-A_XQwwRxUj';
const selectors=new Set(['body','.main-header','.hero','.hero-title','.section-title','.category-title','.container','.card','.btn','.main-footer']);
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
const selector=key.slice(basename.length+1);if(!selectors.has(selector))return'';
const props=rule(v);return props?selector+'{'+props+'}':'';
}).join('\n');
}
fetch(endpoint,{headers:{apikey:key},cache:'no-store'}).then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()}).then(rows=>{
if(!Array.isArray(rows)||!rows[0])return;
const style=document.createElement('style');style.id='arquivo-public-visual-settings';style.textContent=css(rows[0].settings);document.head.appendChild(style);
}).catch(e=>console.warn('Não foi possível carregar aparência publicada:',e.message));
})();