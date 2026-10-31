import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read = file => fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
const main=read('js/script.js');
function context(catalog) {
 const grid={innerHTML:''};
 const document={getElementById:id=>id==='as-public-listings'?{textContent:JSON.stringify(catalog)}:id==='grid-casos'?grid:null,dispatchEvent:()=>{}};
 const ctx=vm.createContext({document,window:{},console,Date,Event:class{}});
 vm.runInContext(read('js/public-listings.js'),ctx);
 return {ctx,grid};
}
test('published HTML metadata survives before remote data and filters never start at zero',()=>{
 const {ctx,grid}=context({Casos:[{id:1,titulo:'Registro',status_publicacao:'publicado'}]});
 vm.runInContext('let casosSupabase = window.ArquivoListagens.read("Casos"); function obterCasosIniciais(){return [{id:999,titulo:"Legado"}]}; function criarCardCaso(c){return c.titulo};',ctx);
 for(const [start,end] of [['function casoEstaPublicado(', '/* ==========================================================================\n   RENDERIZAÇÃO DOS CASOS'],['function carregarCasos()','/* ==========================================================================\n   PERÍCIA / FILTROS FORENSES']]) {
   vm.runInContext(main.slice(main.indexOf(start),main.indexOf(end,main.indexOf(start))),ctx);
 }
 vm.runInContext('carregarCasos()',ctx);
 assert.equal(grid.innerHTML,'Registro');
 vm.runInContext('casosSupabase=[];carregarCasos()',ctx);
 assert.match(grid.innerHTML,/Nenhum dossiê disponível/);
 assert.doesNotMatch(grid.innerHTML,/Legado/);
});
test('future and draft records cannot enrich listings',()=>{
 const {ctx}=context({});
 assert.equal(vm.runInContext('window.ArquivoListagens.published({status_publicacao:"rascunho"})',ctx),false);
 assert.equal(vm.runInContext('window.ArquivoListagens.published({publicado_em:"2999-01-01T00:00:00Z"})',ctx),false);
});
test('modified browser scripts parse',()=>{
 for(const file of ['js/script.js','js/arquivo-literario.js','js/public-listings.js']) assert.doesNotThrow(()=>new vm.Script(read(file)));
});
