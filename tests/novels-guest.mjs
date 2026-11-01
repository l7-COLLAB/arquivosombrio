import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";

const source=readFileSync(new URL("../js/novels.js",import.meta.url),"utf8");
function mock({search="",books=[],chapters=[],progress=[],library=[],user=null,storage=new Map(),writes=[]}={}){
 const nodes=new Map();
 const events=new Map();
 const element=(name)=>{if(!nodes.has(name))nodes.set(name,{innerHTML:"",hidden:true,value:"",style:{},dataset:{},classList:{add(){},remove(){},toggle(){return true}},setAttribute(){},insertAdjacentHTML(){},contains(){return false}});return nodes.get(name)};
 const api={
  from(table){
   const rows=table==="novels"?books:table==="novel_capitulos"?chapters:table==="novel_biblioteca"?library:progress;
   const q={select(){return q},eq(){return q},in(){return q},order(){return q},limit(){return q},
    upsert(row){writes.push({table,action:"upsert",row});const i=library.findIndex(x=>x.novel_id===row.novel_id);if(i>=0)library[i]={...row};else library.push({...row});return Promise.resolve({error:null})},
    insert(row){writes.push({table,action:"insert",row});library.push({...row});return Promise.resolve({error:null})},
    delete(){writes.push({table,action:"delete"});return q},
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
  localStorage:{getItem(k){return storage.get(k)??null},setItem(k,v){storage.set(k,v)},removeItem(k){storage.delete(k)}},
  addEventListener(type,fn){events.set(type,fn)},
  setTimeout(){return 1},clearTimeout(){},
  requestAnimationFrame(fn){fn()},
  scrollTo({top}){context.scrollY=top},
  Date,Math,Map,Number,String
 };
 vm.createContext(context);
 vm.runInContext(source,context,{filename:"js/novels.js"});
 return {context,nodes,events,storage,writes,call:x=>vm.runInContext(x,context)};
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

test("jornada anônima usa apenas leituras locais e oferece obra ainda não iniciada",async()=>{
 const books=[
  {id:"a",slug:"a",titulo:"Primeiro Mistério",autor_nome:"Autor A",generos:["Mistério"],status_publicacao:"publicado"},
  {id:"b",slug:"b",titulo:"Novo Mistério",autor_nome:"Autor B",generos:["Mistério"],status_publicacao:"publicado"},
  {id:"c",slug:"c",titulo:"Suspense",autor_nome:"Autor C",generos:["Suspense"],status_publicacao:"publicado"}
 ];
 const storage=new Map([["as-novel-guest-progress-v1-a",JSON.stringify({chapter:2,scroll:160,percent:42,updated:100})]]);
 const m=mock({books,storage});
 await m.call("catalog()");
 assert.equal(m.nodes.get("#novel-journey").hidden,false);
 assert.match(m.nodes.get("#novel-journey").innerHTML,/1<\/strong>/);
 assert.match(m.nodes.get("#novel-journey").innerHTML,/Primeiro Mistério · Capítulo 2/);
 assert.match(m.nodes.get("#novel-journey").innerHTML,/obra=a&capitulo=2/);
 assert.equal(m.nodes.get("#novel-next").hidden,false);
 assert.match(m.nodes.get("#novel-next").innerHTML,/Novo Mistério/);
 assert.doesNotMatch(m.nodes.get("#novel-next").innerHTML,/href="novel.html\?obra=a"/);
 assert.doesNotMatch(m.nodes.get("#novel-starter").innerHTML,/href="novel.html\?obra=a"/);
 assert.match(m.nodes.get("#novel-starter").innerHTML,/Por onde começar/);
});
test("jornada autenticada utiliza progresso Supabase e ignora o de visitante",async()=>{
 const books=[{id:"a",slug:"a",titulo:"Livro da Conta",generos:["Mistério"],status_publicacao:"publicado"},
  {id:"b",slug:"b",titulo:"Livro do Visitante",generos:["Mistério"],status_publicacao:"publicado"},
  {id:"c",slug:"c",titulo:"Próxima História",generos:["Mistério"],status_publicacao:"publicado"}];
 const progress=[{novel_id:"a",capitulo_id:"chapter-a",percentual:24,atualizado_em:"2026-10-31T13:00:00Z"}];
 const chapters=[{id:"chapter-a",numero:4,status_publicacao:"publicado"}];
 const storage=new Map([["as-novel-guest-progress-v1-b",JSON.stringify({chapter:20,scroll:400,percent:88,updated:999})]]);
 const m=mock({books,chapters,progress,storage,user:{id:"logged"}});
 await m.call("catalog()");
 assert.match(m.nodes.get("#novel-journey").innerHTML,/Livro da Conta · Capítulo 4/);
 assert.doesNotMatch(m.nodes.get("#novel-journey").innerHTML,/Livro do Visitante/);
 assert.match(m.nodes.get("#novel-journey").innerHTML,/O histórico utiliza o progresso da sua conta/);
 assert.match(m.nodes.get("#novel-next").innerHTML,/Próxima obra/);
 assert.equal(m.nodes.get("#novel-next").hidden,false);
});
test("jornada inicial não promete conclusão e evita recomendações repetidas",async()=>{
 const books=[{id:"a",slug:"a",titulo:"Um",generos:["Mistério"],status_publicacao:"publicado"}];
 const m=mock({books});
 await m.call("catalog()");
 assert.match(m.nodes.get("#novel-journey").innerHTML,/0<\/strong>/);
 assert.match(m.nodes.get("#novel-journey").innerHTML,/não necessariamente concluídas/);
 assert.equal(m.nodes.get("#novel-next").hidden,true);
 assert.match(m.nodes.get("#novel-starter").innerHTML,/Um/);
 const storage=new Map([["as-novel-guest-progress-v1-a",JSON.stringify({chapter:1,scroll:0,percent:100,updated:1})]]);
 const existing=mock({books,storage});
 await existing.call("catalog()");
 assert.equal(existing.nodes.get("#novel-next").hidden,true);
 assert.equal(existing.nodes.get("#novel-starter").hidden,true);
 assert.match(existing.nodes.get("#novel-journey").innerHTML,/1<\/strong>/);
});

test("conclusão anônima é explícita, reversível e independente da posição de leitura",async()=>{
 const book={id:"b1",slug:"um-livro",titulo:"Livro",status_obra:"concluida"};
 const m=mock();
 m.context.book=book;
 await m.call("wireNovelLibraryControls(book,null)");
 const btn=m.nodes.get("#novel-complete-toggle");
 assert.equal(btn.textContent,"Marcar como concluída");
 assert.equal(m.call('readGuestCompleted("b1")'),false);
 await btn.onclick();
 assert.equal(m.call('readGuestCompleted("b1")'),true);
 assert.equal(btn.textContent,"Desmarcar conclusão");
 assert.equal(m.storage.get("as-novel-completed-v1-b1"),"1");
 await btn.onclick();
 assert.equal(m.call('readGuestCompleted("b1")'),false);
 assert.equal(m.storage.has("as-novel-completed-v1-b1"),false);
});
test("conta autenticada persiste conclusão via estado existente com o próprio user_id",async()=>{
 const book={id:"b1",slug:"um-livro",titulo:"Livro",status_obra:"concluida"};
 const library=[{user_id:"user1",novel_id:"b1",estado:"acompanhando"}];
 const m=mock({user:{id:"user1"},library});
 m.context.book=book;
 await m.call("wireNovelLibraryControls(book,{id:'user1'})");
 const btn=m.nodes.get("#novel-complete-toggle");
 await btn.onclick();
 assert.equal(m.writes[0].table,"novel_biblioteca");
 assert.equal(m.writes[0].row.user_id,"user1");
 assert.equal(m.writes[0].row.estado,"concluido");
 assert.equal(btn.textContent,"Desmarcar conclusão");
 await btn.onclick();
 assert.equal(m.writes[1].row.estado,"acompanhando");
 assert.equal(m.storage.size,0);
});
test("jornada mostra concluídas declaradas e remove essas obras de continuar e próxima",async()=>{
 const books=[
  {id:"a",slug:"a",titulo:"Obra terminada",status_obra:"concluida",status_publicacao:"publicado",generos:["Mistério"]},
  {id:"b",slug:"b",titulo:"Próxima obra",status_obra:"concluida",status_publicacao:"publicado",generos:["Mistério"]}
 ];
 const storage=new Map([
  ["as-novel-guest-progress-v1-a",JSON.stringify({chapter:3,scroll:200,percent:100,updated:1})],
  ["as-novel-completed-v1-a","1"]
 ]);
 const guest=mock({books,storage});
 await guest.call("catalog()");
 assert.match(guest.nodes.get("#novel-journey").innerHTML,/1<\/strong><span>obra concluída/);
 assert.match(guest.nodes.get("#novel-journey").innerHTML,/Concluídas por você/);
 assert.match(guest.nodes.get("#novel-journey").innerHTML,/Obra terminada/);
 assert.equal(guest.nodes.get("#novel-continue").hidden,true);
 assert.match(guest.nodes.get("#novel-next").innerHTML,/Próxima obra/);
 assert.doesNotMatch(guest.nodes.get("#novel-starter").innerHTML,/href="novel.html\?obra=a"/);
 const authed=mock({books,user:{id:"user1"},library:[{user_id:"user1",novel_id:"a",estado:"concluido"}]});
 await authed.call("catalog()");
 assert.match(authed.nodes.get("#novel-journey").innerHTML,/1<\/strong><span>obra concluída/);
 assert.match(authed.nodes.get("#novel-next").innerHTML,/Próxima obra/);
 assert.equal(authed.nodes.get("#novel-continue").hidden,true);
});
