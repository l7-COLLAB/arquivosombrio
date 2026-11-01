import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import fs from "node:fs";

const src=fs.readFileSync(new URL("../admin-v2/js/newsletter-editor.js",import.meta.url),"utf8");
const sql=fs.readFileSync(new URL("../supabase/migrations/20261031_newsletter_editorial_editions.sql",import.meta.url),"utf8");
const html=fs.readFileSync(new URL("../admin-v2/newsletter.html",import.meta.url),"utf8");
function fixture(admin=false){
 const calls=[],handles={};
 function node(name){
  return {name,children:[],textContent:"",value:"",disabled:false,
   appendChild(x){this.children.push(x);return x;},
   replaceChildren(){this.children=[];},
   addEventListener(event,callback){this["on"+event]=callback;},
   scrollIntoView(){},
   reset(){},
   reportValidity(){return true;}};
 }
 const els={};
 for(const name of ["edition-form","edition-fields","edition-save","edition-new",
  "edition-preview","edition-preview-output","edition-list","refresh-editions","page-status",
  "editor-heading","edition-feedback","sub-confirmed","sub-pending","sub-cancelled"]){
  els[name]=node(name);
 }
 els["edition-fields"].disabled=true;
 els["refresh-editions"].disabled=true;
 els["edition-form"].elements={
  namedItem(k){return (handles[k]??=Object.assign(node(k),{value:({
   title:"Edição documental",
   subject:"Arquivo Sombrio: novas histórias e análises",
   preheader:"Destaques editoriais da semana",
   body_text:"Um texto original de apresentação editorial cuidadosamente verificado. ".repeat(3),
   cta_label:"Abrir o acervo",
   cta_url:"https://arquivosombrio.net.br/pesquisa.html",
   status:"rascunho"
  })[k]??""}));}
 };
 const client={
  auth:{async getUser(){return {data:{user:admin?{id:"a",app_metadata:{role:"admin"}}:{id:"reader",app_metadata:{role:"reader"}}},error:null};}},
  from(table){
   calls.push({table});
   if(table==="editorial_newsletter_editions"){
    const query={
     select(){return this},order(){return this},
     limit(){return Promise.resolve({data:[],error:null});},
     insert(payload){calls.push({insert:payload});return this},
     single(){return Promise.resolve({data:{id:"new-1"},error:null});}
    };
    return query;
   }
   if(table==="editorial_newsletter_subscribers"){
    return {select(columns,opts){
     calls.push({subscriberSelect:columns,opts});return this;
    },eq(field,value){calls.push({filter:field,value});return Promise.resolve({count:0,error:null});}};
   }
   throw Error("Unexpected table: "+table);
  }
 };
 const document={
  readyState:"loading",
  querySelector(selector){return els[selector.slice(1)]||null},
  getElementById(id){return els[id]||null},
  createElement(nodeName){return node(nodeName)},
  addEventListener(name,callback){if(name==="DOMContentLoaded")handles.start=callback;}
 };
 const sandbox={document,window:{supabase:{createClient(){return client}}},URL,console};
 vm.runInNewContext(src,sandbox);
 return {els,calls,handles,init:()=>handles.start()};
}
test("anonymous or ordinary readers cannot load drafts or subscriber statistics",async()=>{
 const x=fixture(false);await x.init();
 assert.equal(x.calls.length,0);
 assert.equal(x.els["edition-fields"].disabled,true);
 assert.match(x.els["page-status"].textContent,/Acesso restrito/);
});
test("admin loads only counts of subscriber statuses and no email addresses",async()=>{
 const x=fixture(true);await x.init();
 assert.equal(x.els["edition-fields"].disabled,false);
 const subs=x.calls.filter(c=>c.subscriberSelect);
 assert.equal(subs.length,3);
 for(const c of subs){
  assert.equal(c.subscriberSelect,"id");
  assert.equal(c.opts.head,true);
  assert.equal(c.opts.count,"exact");
 }
 assert.deepEqual(x.calls.filter(c=>c.filter==="status").map(c=>c.value).sort(),
  ["cancelado","confirmado","pendente"]);
 assert.equal(x.calls.filter(c=>c.table==="editorial_newsletter_subscribers").length,3);
});
test("the preview creates safe text-only DOM, never using executable HTML",async()=>{
 const x=fixture(false);
 x.handles.body_text={value:'<img src=x onerror=alert(1)> Original documentary text '.repeat(5)};
 await x.init();
 const preview=x.els["edition-preview-output"];
 const body=preview.children.find(c=>c.name==="div"&&c.className==="body");
 assert.ok(body);
 assert.match(body.textContent,/<img src=x onerror=alert/);
 assert.equal(body.children.length,0);
 assert.doesNotMatch(src,/innerHTML|outerHTML|insertAdjacentHTML/);
});
test("approved drafts do not deliver mail; storage only allows editorial states",()=>{
 assert.match(sql,/alter table public\.editorial_newsletter_editions enable row level security/);
 assert.match(sql,/revoke all on public\.editorial_newsletter_editions from public, anon, authenticated/);
 assert.match(sql,/is_arquivo_sombrio_admin\(\)/);
 assert.match(sql,/created_by = \(select auth\.uid\(\)\)/);
 assert.match(sql,/status in \('rascunho','revisao','aprovado','arquivado'\)/);
 assert.doesNotMatch(sql,/grant delete/i);
 assert.doesNotMatch(sql,/grant .* to anon/i);
 assert.doesNotMatch(src,/https:\/\/api\.resend\.com|\.sendEmail\(|\.send\(/);
 assert.doesNotMatch(src,/\.select\([^)]*email/);
 assert.match(html,/Não há botão de envio/);
 assert.match(html,/noindex,nofollow/);
 assert.match(html,/fieldset id="edition-fields" disabled/);
});
test("the save flow requires a successful server write before claiming success",async()=>{
 const x=fixture(true);await x.init();
 const fields=x.els["edition-form"].elements;
 x.handles.body_text.value="Conteúdo original validado antes do envio futuro. ".repeat(4);
 await x.els["edition-form"].onsubmit({preventDefault(){}});
 const written=x.calls.find(c=>c.insert);
 assert.ok(written);
 assert.equal(written.insert.status,"rascunho");
 assert.equal(written.insert.title,fields.namedItem("title").value);
 assert.match(x.els["edition-feedback"].textContent,/gravação|gravada/i);
});
