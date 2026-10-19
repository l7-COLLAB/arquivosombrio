import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root=path.resolve(import.meta.dirname,"..");
const source=fs.readFileSync(path.join(root,"js/pesquisa-acervo.js"),"utf8");
const cases=[
 ["Casos","26","Cari Farver: a vítima que foi transformada em perseguidora","HOMICÍDIO E FRAUDE DIGITAL"],
 ["casos_diarios","28","Ronald Cotton: a certeza que condenou o homem errado","GARIMPO SOMBRIO"],
 ["pericias","10","Genealogia genética e a solução de crimes antigos","DNA Forense"],
 ["lendas","4","A Pisadeira","Criatura / entidade"],
 ["creepypastas","4","Mr. Widemouth","CREEPYPASTA"]
];
class Element{
 constructor(tag="div"){this.tag=tag;this.children=[];this.attributes={};this.listeners={};this.dataset={};this.hidden=false;this.value="";this.textContent="";}
 append(...nodes){this.children.push(...nodes);}
 replaceChildren(...nodes){this.children=[...nodes];}
 setAttribute(key,value){this.attributes[key]=value;}
 addEventListener(type,fn){this.listeners[type]=fn;}
 remove(){this.removed=true;}
 focus(){this.focused=true;}
}
const flush=async()=>{for(let i=0;i<8;i++)await new Promise(resolve=>setImmediate(resolve));};
async function harness({q="",fail=[]}={}){
 const ids=["as-search-input","as-results-count","as-search-message","as-search-sections","as-search-suggestion-items","as-search-suggestions","as-search-save-history","as-search-history-content","as-search-history-items","as-search-clear-history","as-search-order","as-search-form"];
 const elements=Object.fromEntries(ids.map(id=>[id,new Element()]));
 const controls=["all","dossies","garimpo","pericia","lendas","creepypastas"].map(category=>{const el=new Element("button");el.dataset.asSearchCategory=category;return el;});
 const failing=new Set(fail),requests=[];
 const context={
  URL,URLSearchParams,Date,Number,String,Set,Array,JSON,Promise,Math,console,
  location:{href:"https://arquivosombrio.net.br/pesquisa.html?q="+encodeURIComponent(q),search:"?q="+encodeURIComponent(q)},
  history:{replaceState(){}},
  localStorage:{getItem(){return null;},setItem(){},removeItem(){}},
  setTimeout:(f)=>{f();return 1;},clearTimeout(){},
  document:{
   readyState:"complete",
   getElementById:id=>elements[id],
   createElement:tag=>new Element(tag),
   createTextNode:value=>String(value),
   querySelectorAll:()=>controls,
   addEventListener(){}
  },
  fetch:async uri=>{
   const u=new URL(uri);
   const table=decodeURIComponent(u.pathname.split("/").at(-1));
   requests.push({table,status:u.searchParams.get("status_publicacao")});
   if(failing.has(table))throw Error("Falha simulada: "+table);
   const row=cases.find(x=>x[0]===table);
   return {ok:true,json:async()=>row?[{id:row[1],titulo:row[2],categoria:row[3],resumo:"Registro documental publicado",created_at:"2026-10-01T12:00:00Z",status_publicacao:"publicado"},{id:"999",titulo:"Rascunho privado",status_publicacao:"rascunho"}]:[]};
  }
 };
 vm.runInNewContext(source,context,{filename:"pesquisa-acervo.js"});
 await flush();
 return {elements,controls,requests,failing};
}
const descendants=(node,tag)=>node.children.flatMap(child=>typeof child==="object"&&child!==null?[...(child.tag===tag?[child]:[]),...descendants(child,tag)]:[]);
test("termos reais e acentuação: Genealogia genética",async()=>{
 const {elements,requests}=await harness({q:"genetica"});
 assert.equal(elements["as-results-count"].textContent,"1 registro encontrado");
 assert.equal(requests.length,5);
 assert.ok(requests.every(x=>x.status==="eq.publicado"));
 const links=descendants(elements["as-search-sections"],"a");
 assert.equal(links.length,1);
 assert.equal(links[0].href,"pericia.html?id=10#forense");
});
test("destinos públicos de Garimpo, Dossiês, Lendas e Creepypastas",async()=>{
 for(const [term,href] of [["ronald","garimpo.html?id=28"],["cari","caso.html?id=26"],["pisadeira","lendas.html?id=4"],["widemouth","creepypastas.html?id=4"]]){
  const {elements}=await harness({q:term});
  const links=descendants(elements["as-search-sections"],"a");
  assert.equal(links.length,1,term);
  assert.equal(links[0].href,href);
 }
});
test("rascunhos nunca aparecem nos resultados ou sugestões",async()=>{
 const {elements}=await harness({q:"rascunho"});
 assert.equal(descendants(elements["as-search-sections"],"a").length,0);
 assert.equal(elements["as-results-count"].textContent,"0 registros encontrados");
});
test("uma editoria falha, resultados de outras permanecem e há recuperação",async()=>{
 const h=await harness({q:"pisadeira",fail:["lendas"]});
 assert.equal(h.elements["as-results-count"].textContent,"0 registros encontrados");
 assert.match(h.elements["as-search-message"].textContent,/incompleta/);
 const retry=descendants(h.elements["as-search-message"],"button")[0];
 assert.ok(retry);
 h.failing.clear();
 await retry.listeners.click();
 await flush();
 assert.equal(h.elements["as-results-count"].textContent,"1 registro encontrado");
 assert.equal(descendants(h.elements["as-search-sections"],"a")[0].href,"lendas.html?id=4");
 assert.equal(h.requests.filter(x=>x.table==="lendas").length,2);
 assert.equal(h.requests.filter(x=>x.table==="Casos").length,1);
});
test("falha total é distinguida de ausência de correspondência",async()=>{
 const h=await harness({q:"termo-inexistente",fail:cases.map(x=>x[0])});
 assert.match(h.elements["as-search-message"].textContent,/Não foi possível consultar/);
 assert.ok(descendants(h.elements["as-search-message"],"button").length>0);
});
