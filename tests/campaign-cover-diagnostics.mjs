import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const read=name=>fs.readFileSync(new URL(name,root),'utf8');
const js=read('admin-v2/js/campanhas-editor.js');
const html=read('admin-v2/campanhas.html');
const start=js.indexOf(' function campaignDiagnosticTime(');
const end=js.indexOf(' data.campaigns.forEach(',start);
assert(start>0 && end>start,'diagnostic code must be present');
const block=js.slice(start,end);

class Element{
 constructor(name='div'){this.name=name;this.children=[];this.textContent='';this.disabled=false;this.style={};this.handlers={};this.attrs={}}
 setAttribute(name,value){this.attrs[name]=value}
 appendChild(child){this.children.push(child);return child}
 replaceChildren(...children){this.children=[...children]}
 addEventListener(name,callback){this.handlers[name]=callback}
}
function fixture(response,error=null){
 const elements=new Map();
 const $=id=>{if(!elements.has(id))elements.set(id,new Element(id));return elements.get(id)};
 const context={
  $,
  adminClient:{rpc:async name=>{
   assert.equal(name,'admin_v2_campaign_cover_diagnostics');
   return {data:response,error};
  }},
  make:(tag,attrs={},value='')=>{
   const el=new Element(tag);el.textContent=value;
   for(const [key,v] of Object.entries(attrs))el.setAttribute(key,v);
   return el;
  },
  Date,Intl,Number,String
 };
 vm.runInNewContext(block,context);
 return {elements,$};
}
test('only authenticated editor container has the diagnostics area',()=>{
 assert.match(html, /<div id="editor" hidden>[\s\S]*id="cover-diagnostics"/);
 assert.match(html, /id="cover-diagnostics-refresh"/);
 assert.match(html, /id="cover-diagnostics-items"/);
 assert.match(html, /campanhas-editor\.js\?v=18-campaign-diagnostics-20261101/);
});
test('diagnostic renders dates, pending covers and retry safely',async()=>{
 const response={
  generated_at:'2026-11-01T14:00:00Z',
  summary:{total:3,scheduled:2,private_scheduled:1,due_pending:1,retrying:1,draft_private:1},
  job:{active:true,schedule:'* * * * *',last_run_status:'succeeded',last_run_at:'2026-11-01T13:59:00Z'},
  items:[{id:'a',title:'<img src=x onerror=alert(1)>',publish_at:'2026-11-01T16:00:00Z',
   state:'retry',hero_private:true,card_private:false,failures:2,
   error_code:'missing_private_file',retry_at:'2026-11-01T16:05:00Z'}]
 };
 const {$}=fixture(response);
 await $('cover-diagnostics-refresh').handlers.click();
 assert.match($('cover-diagnostics-summary').textContent,/Capas vencidas pendentes: 1/);
 assert.match($('cover-diagnostics-cron').textContent,/Agendador: ativo/);
 assert.match($('cover-diagnostics-status').textContent,/Dados restritos à administração/);
 const row=$('cover-diagnostics-items').children[0];
 assert.equal(row.children.length,4);
 assert.equal(row.children[0].textContent,'<img src=x onerror=alert(1)>');
 assert.match(row.children[3].textContent,/Falhas: 2/);
 assert.match(row.children[3].textContent,/missing_private_file/);
 assert.equal($('cover-diagnostics-refresh').disabled,false);
 assert(!block.includes('.innerHTML'));
});
test('empty diagnostics is handled without inventing pending campaigns',async()=>{
 const {$}=fixture({generated_at:'2026-11-01T14:00:00Z',summary:{total:0,scheduled:0,draft_private:0},job:null,items:[]});
 await $('cover-diagnostics-refresh').handlers.click();
 assert.match($('cover-diagnostics-items').children[0].children[0].textContent,/Nenhuma campanha futura/);
 assert.match($('cover-diagnostics-cron').textContent,/Agendador de capas não encontrado/);
});
test('failure does not reveal data or lock refresh button',async()=>{
 const {$}=fixture(null,{message:'Acesso administrativo necessário'});
 await $('cover-diagnostics-refresh').handlers.click();
 assert.match($('cover-diagnostics-status').textContent,/Não foi possível consultar/);
 assert.equal($('cover-diagnostics-refresh').disabled,false);
});
