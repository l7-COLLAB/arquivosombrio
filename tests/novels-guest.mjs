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
   const q={select(){return q},eq(){return q},in(){return q},order(){return q},limit(){return q},
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

test("estantes temáticas usam gêneros reais, com acentos, sem duplicar obras",async()=>{
 const titles=[
  ["Enigma pericial","Perícia forense"],
  ["O quarto","Quarto fechado"],
  ["A mansão","Romance gótico"],
  ["A sombra","Suspense psicológico"],
  ["O mistério da floresta","Terror gótico"],
  ["O detetive","Investigação criminal"],
  ["O crime","Investigação"],
  ["Outro caso","Mistério"]
 ];
 const books=titles.map(([titulo,genre],i)=>({id:"theme-"+i,slug:"obra-"+i,titulo,autor_nome:"Autor",generos:[genre],tags:[]}));
 const m=mock({books});
 await m.call("catalog()");
 const section=m.nodes.get("#novel-themes");
 assert.equal(section.hidden,false);
 assert.match(section.innerHTML,/Enigmas e vestígios/);
 assert.match(section.innerHTML,/Segredos na penumbra/);
 assert.match(section.innerHTML,/Investigações clássicas/);
 assert.equal((section.innerHTML.match(/class="novel-theme-item"/g)||[]).length,8);
 for(const b of books){
  assert.equal(section.innerHTML.split("obra="+b.slug).length-1,1,"Estante deve listar "+b.slug+" uma vez");
 }
});
test("estantes vazias ficam ocultas e não inventam recomendações",async()=>{
 const m=mock({books:[{id:"no-theme",slug:"romance",titulo:"História histórica",autor_nome:"Autora",generos:["Romance histórico"],tags:[]}]});
 await m.call("catalog()");
 assert.equal(m.nodes.get("#novel-themes").hidden,true);
 assert.equal(m.nodes.get("#novel-themes").innerHTML,"");
});

test("livros relacionados priorizam gêneros reais e excluem rascunhos e a própria obra",()=>{
 const m=mock();
 const current={id:"a",slug:"obra-a",generos:["Mistério","Investigação criminal"]};
 const others=[
  {id:"a",slug:"obra-a",titulo:"Eu",generos:["Mistério"],status_publicacao:"publicado"},
  {id:"b",slug:"obra-b",titulo:"Investigação",generos:["Investigação"],status_publicacao:"publicado"},
  {id:"c",slug:"obra-c",titulo:"Dossiê de crime",generos:["Mistério","Investigação criminal"],status_publicacao:"publicado"},
  {id:"d",slug:"obra-d",titulo:"Rascunho",generos:["Mistério"],status_publicacao:"rascunho"},
  {id:"e",slug:"obra-e",titulo:"Fantasia",generos:["Fantasia"],status_publicacao:"publicado"},
  {id:"f",slug:"obra-f",titulo:"Outro mistério",generos:["Mistério"],status_publicacao:"publicado"}
 ];
 m.context.testCurrent=current;m.context.testOthers=others;
 assert.equal(m.call("findRelatedNovels(testCurrent,testOthers).map(x=>x.book.slug).join(',')"),"obra-c,obra-f,obra-b");
 assert.equal(m.call("findRelatedNovels(testCurrent,testOthers).length"),3);
 assert.equal(m.call("findRelatedNovels({...testCurrent,generos:[]},testOthers).length"),0);
});
test("recomendações só mostram obras relacionadas e escapam conteúdo editorial",async()=>{
 const current={id:"a",slug:"obra-a",generos:["Terror gótico"]};
 const books=[
  {...current,titulo:"Original",status_publicacao:"publicado"},
  {id:"b",slug:"romance-gotico",titulo:"Um <mistério> & segredo",autor_nome:"Autora <teste>",generos:["Romance gótico"],status_publicacao:"publicado"},
  {id:"c",slug:"fantasia",titulo:"Sem relação",generos:["Fantasia"],status_publicacao:"publicado"},
  {id:"d",slug:"inedita",titulo:"Obra inédita",generos:["Terror gótico"],status_publicacao:"rascunho"}
 ];
 const m=mock({books});m.context.testCurrent=current;
 await m.call('loadRelatedNovels(testCurrent,document.querySelector("#novel-related"))');
 const node=m.nodes.get("#novel-related");
 assert.equal(node.hidden,false);
 assert.match(node.innerHTML,/romance-gotico/);
 assert.match(node.innerHTML,/&lt;mistério&gt; &amp; segredo/);
 assert.doesNotMatch(node.innerHTML,/obra-a|inedita|fantasia|<mistério>/);
});
test("recomendações sem gêneros compartilhados permanecem ocultas",async()=>{
 const m=mock({books:[{id:"b",slug:"outro",titulo:"Outro",generos:["Fantasia"],status_publicacao:"publicado"}]});
 m.context.testCurrent={id:"a",slug:"a",generos:["Mistério"]};
 await m.call('loadRelatedNovels(testCurrent,document.querySelector("#novel-related"),true)');
 assert.equal(m.nodes.get("#novel-related").hidden,true);
});
