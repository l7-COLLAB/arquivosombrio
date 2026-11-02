import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {readFileSync} from "node:fs";
const code=readFileSync(new URL("../js/novels-extras.js",import.meta.url),"utf8");
function build({storage=new Map(),chapters=[]}={}){
 const nodes=new Map();
 const make=(id)=>{
  if(!nodes.has(id))nodes.set(id,{innerHTML:"",hidden:true,onclick:null,dataset:{},setAttribute(){},contains(){return true}});
  return nodes.get(id);
 };
 const doc={querySelector:make};
 const ctx={window:{},document:doc,Date,Number,String,Map,console,localStorage:{
  getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)
 }};
 vm.createContext(ctx);vm.runInContext(code,ctx);
 const sb={from(){return {select(){return this},in(){return this},eq(){return Promise.resolve({data:chapters,error:null})}}}};
 return {api:ctx.window.NovelExtras,nodes,storage,sb};
}
const books=[
 {id:"b1",slug:"um-livro",titulo:"Livro Um",status_publicacao:"publicado"},
 {id:"b2",slug:"outro-livro",titulo:"Livro Dois",status_publicacao:"publicado"}
];
test("estante pessoal filtra em andamento, quero ler e concluídas",()=>{
 const m=build();const section=m.nodes.get("#novel-personal")||{hidden:true,innerHTML:"",contains(){return true}};
 const e=[{book:books[0],chapter:2,updated:20}];
 m.api.renderPersonalShelf(section,books,e,new Set(["b2"]),new Set(["b1"]));
 assert.equal(section.hidden,false);
 assert.match(section.innerHTML,/Em andamento \(1\)/);
 assert.match(section.innerHTML,/Quero ler \(1\)/);
 assert.match(section.innerHTML,/Concluídas \(1\)/);
 assert.match(section.innerHTML,/Capítulo 2/);
 section.onclick({target:{closest(){return {dataset:{personalFilter:"concluido"}}}}});
 assert.match(section.innerHTML,/Concluído por você/);
 assert.doesNotMatch(section.innerHTML,/Capítulo 2/);
 section.onclick({target:{closest(){return {dataset:{personalFilter:"quero"}}}}});
 assert.match(section.innerHTML,/Salvo para depois/);
});
test("alertas ficam desligados por padrão e exigem opção explícita",async()=>{
 const m=build({chapters:[{novel_id:"b1",numero:4,status_publicacao:"publicado"}]});
 const area={hidden:true,innerHTML:"",onclick:null,contains(){return true}};
 await m.api.renderChapterAlerts(area,books,{id:"reader-a"},m.sb);
 assert.equal(area.hidden,true);
 assert.equal(m.storage.size,0);
 const control=m.nodes.get("#novel-chapter-alert-controls")||{innerHTML:""};
 // A página original fornece o container; o componente não cria conta.
 m.nodes.set("#novel-chapter-alert-controls",control);
 m.api.wireChapterAlerts(books[0],[{numero:4,publicado_em:null}],{id:"reader-a"});
 assert.match(control.innerHTML,/Avisar quando houver novos capítulos/);
 assert.match(control.innerHTML,/Não enviamos e-mails/);
 m.nodes.get("#novel-alert-toggle").onclick();
 assert.equal(m.storage.get("as-novel-chapter-alert-v1-reader-a-b1"),"4");
 await m.api.renderChapterAlerts(area,books,{id:"reader-a"},m.sb);
 assert.equal(area.hidden,true);
});
test("novos capítulos aparecem somente depois da publicação e só na conta inscrita",async()=>{
 const storage=new Map([["as-novel-chapter-alert-v1-reader-a-b1","2"]]);
 const chapters=[
  {novel_id:"b1",numero:3,status_publicacao:"publicado",publicado_em:null},
  {novel_id:"b1",numero:4,status_publicacao:"publicado",agendado_para:"2099-01-01T00:00:00Z"}
 ];
 const m=build({storage,chapters});
 const area={hidden:true,innerHTML:"",onclick:null,contains(){return true}};
 await m.api.renderChapterAlerts(area,books,{id:"reader-a"},m.sb);
 assert.equal(area.hidden,false);
 assert.match(area.innerHTML,/Capítulo 3/);
 assert.doesNotMatch(area.innerHTML,/Capítulo 4/);
 area.onclick({target:{closest(){return {dataset:{chapterAlertRead:"b1"}}}}});
 assert.equal(storage.get("as-novel-chapter-alert-v1-reader-a-b1"),"3");
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(area.hidden,true);
 await m.api.renderChapterAlerts(area,books,{id:"reader-b"},m.sb);
 assert.equal(area.hidden,true);
});
