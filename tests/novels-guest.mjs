import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";

const source=readFileSync(new URL("../js/novels.js",import.meta.url),"utf8");
function mock({search="",books=[],chapters=[],progress=[],user=null,storage=new Map()}={}){
 const nodes=new Map();
 const events=new Map();
 const element=(name)=>{if(!nodes.has(name))nodes.set(name,{innerHTML:"",hidden:true,value:"",style:{},dataset:{},classList:{add(){},remove(){},toggle(){return true}},setAttribute(){},insertAdjacentHTML(){},contains(){return false}});return nodes.get(name)};
 const api={
  from(table){
   const rows=table==="novels"?books:table==="novel_capitulos"?chapters:progress;
   const q={select(){return q},eq(){return q},in(){return q},order(){return q},
    then(resolve,reject){return Promise.resolve({data:rows,error:null}).then(resolve,reject)},
    async single(){return {data:rows[0]??null,error:null}},
    async maybeSingle(){return {data:rows[0]??null,error:null}}
   };
   return q;
  },
  auth:{async getUser(){return {data:{user}}}}
 };
 const context={window:{supabase:{createClient(){return api}}},URLSearchParams,
  location:{search,href:""},console,innerHeight:800,scrollY:0,
  document:{head:{appendChild(){}},body:{dataset:{},classList:{toggle(){return true},add(){},remove(){}}},documentElement:{scrollHeight:2000},fonts:{ready:Promise.resolve()},
   querySelector:element,querySelectorAll(){return []},createElement(){return {setAttribute(){}}},addEventListener(type,fn){events.set("document:"+type,fn)},visibilityState:"visible"},
  localStorage:{getItem(k){return storage.get(k)??null},setItem(k,v){storage.set(k,v)}},
  addEventListener(type,fn){events.set(type,fn)},
  setTimeout(){return 1},clearTimeout(){},
  requestAnimationFrame(fn){fn()},
  scrollTo({top}){context.scrollY=top},
  Date,Math,Map,Number,String
 };
 vm.createContext(context);
 vm.runInContext(source,context,{filename:"js/novels.js"});
 return {context,nodes,events,storage,call:x=>vm.runInContext(x,context)};
}
test("leitura anônima: dados locais válidos e corrompidos",()=>{
 const m=mock();
 m.storage.set("as-novel-guest-progress-v1-book-1",JSON.stringify({chapter:2,scroll:90,percent:30,updated:123}));
 assert.equal(m.call('readGuestProgress("book-1").chapter'),2);
 m.storage.set("as-novel-guest-progress-v1-book-1",'{"chapter":');
 assert.equal(m.call('readGuestProgress("book-1")'),null);
 m.storage.set("as-novel-guest-progress-v1-book-1",JSON.stringify({chapter:-1,scroll:0,percent:99}));
 assert.equal(m.call('readGuestProgress("book-1")'),null);
});
test("catálogo: recomendações, busca e continuar lendo como visitante",async()=>{
 const books=[{id:"b1",slug:"um-livro",titulo:"Livro de Mistério",autor_nome:"Autor A",sinopse:"Caso sombrio",generos:["Mistério"],tags:[]},
 {id:"b2",slug:"segundo-livro",titulo:"Outro título",autor_nome:"Autor B",sinopse:"História",generos:["Suspense"],tags:[]}];
 const storage=new Map([["as-novel-guest-progress-v1-b1",JSON.stringify({chapter:3,scroll:300,percent:25,updated:1})]]);
 const m=mock({books,storage});
 await m.call("catalog()");
 assert.match(m.nodes.get("#novel-starter").innerHTML,/Comece por aqui/);
 assert.match(m.nodes.get("#novel-continue").innerHTML,/capitulo=3/);
 assert.match(m.nodes.get("#novel-grid").innerHTML,/Livro de Mistério/);
 assert.equal(m.nodes.get("#novel-continue").hidden,false);
 m.nodes.get("#novel-search").value="nenhum";
 m.nodes.get("#novel-search").oninput();
 assert.match(m.nodes.get("#novel-grid").innerHTML,/Nenhuma obra encontrada/);
});
test("catálogo autenticado: progresso servidor tem prioridade sobre local anônimo",async()=>{
 const books=[{id:"b1",slug:"um-livro",titulo:"Livro",autor_nome:"Autor",generos:[],tags:[]}];
 const progress=[{novel_id:"b1",capitulo_id:"c2",percentual:40,scroll_y:100,atualizado_em:"2026-10-31T00:00:00Z"}];
 const chapters=[{id:"c2",numero:2,status_publicacao:"publicado"}];
 const storage=new Map([["as-novel-guest-progress-v1-b1",JSON.stringify({chapter:9,scroll:90,percent:30,updated:1})]]);
 const m=mock({books,progress,chapters,user:{id:"user1"},storage});
 await m.call("catalog()");
 assert.match(m.nodes.get("#novel-continue").innerHTML,/capitulo=2/);
 assert.doesNotMatch(m.nodes.get("#novel-continue").innerHTML,/capitulo=9/);
});
test("leitor anônimo: salva e restaura a posição no mesmo dispositivo",async()=>{
 const book={id:"b1",slug:"um-livro",titulo:"Livro de Mistério"};
 const chapters=[{id:"c1",numero:1,titulo:"Primeiro capítulo",conteudo:"Texto de leitura. ".repeat(100)}];
 const storage=new Map();
 const first=mock({search:"?obra=um-livro&capitulo=1",books:[book],chapters,storage});
 await first.call("reader()");
 assert.equal(JSON.parse(storage.get("as-novel-guest-progress-v1-b1")).chapter,1);
 first.context.scrollY=250;
 first.events.get("pagehide")();
 assert.equal(JSON.parse(storage.get("as-novel-guest-progress-v1-b1")).scroll,250);
 const second=mock({search:"?obra=um-livro&capitulo=1",books:[book],chapters,storage});
 await second.call("reader()");
 assert.equal(second.context.scrollY,250);
});
