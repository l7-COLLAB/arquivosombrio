(()=>{'use strict';
const caseId=new URLSearchParams(location.search).get('id');
if(!(location.pathname.includes('/7-noites-de-horror-real/arquivo/')||(location.pathname.endsWith('/garimpo.html')&&['53','54'].includes(caseId))))return;
const dates=['25','26','27','28','29','30','31'];let night=caseId==='54'?'02':'01',date=caseId==='54'?'26':'25';
document.body.classList.add('as-halloween-reader');
document.body.dataset.halloweenNight=night;
const setSpecial=()=>{
 const reader=document.querySelector('#daily-case-detail .daily-reader');
 if(!reader)return;
 const titleText=(reader.querySelector(':scope>header h1')?.textContent||'').toLowerCase();
 const titles=['ronald o','martha moxley','chelsea bruck','shauna howe','duplo homicídio de napa','assassinatos de pasadena','luis andrés colmenares'];
 const index=titles.findIndex(s=>titleText.normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').includes(s.normalize('NFD').replace(/[\\u0300-\\u036f]/g,'')));
 if(index<0)return;
 night=String(index+1).padStart(2,'0');date=dates[index];document.body.dataset.halloweenNight=night;
 reader.querySelectorAll('.daily-reader-timeline li').forEach(li=>{
  if(li.dataset.formatted==='1')return;
  const p=li.querySelector('p');if(!p)return;
  const match=p.textContent.trim().match(/^([^:]{4,30}):\s*(.+)$/s);
  if(!match)return;
  const t=document.createElement('time');t.textContent=match[1];p.textContent=match[2];li.prepend(t);li.dataset.formatted='1';
 });
 const back=document.querySelector('#daily-case-detail>.archive-back');
 if(back){back.href='/especiais/7-noites-de-horror-real/';back.textContent='← Voltar ao Especial';}
 const small=reader.querySelector(':scope>header small');
 if(small)small.textContent='7 NOITES DE HORROR REAL · NOITE '+night+' · '+date+'/10/2026';
 const title=reader.querySelector(':scope>header h1');
 if(title)document.title=title.textContent.trim()+' | 7 Noites de Horror Real · Arquivo Sombrio';
};
const root=document.getElementById('daily-case-detail');
if(root){new MutationObserver(setSpecial).observe(root,{childList:true,subtree:false});setSpecial()}
})();