import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root=path.resolve(import.meta.dirname,'..');
const file=(name)=>fs.readFileSync(path.join(root,name),'utf8');
const module=file('js/related-reading.js');
const dossier=file('js/caso.js');
const listings=file('js/script.js');
const literary=file('js/arquivo-literario.js');

for(const [name,code] of [['related-reading.js',module],['caso.js',dossier],['script.js',listings],['arquivo-literario.js',literary]]){
 test('JavaScript sintaticamente válido: '+name,()=>assert.doesNotThrow(()=>new vm.Script(code,{filename:name})));
}

test('recomendações mostram somente publicados e não repetem o registro aberto',()=>{
 assert.match(module,/status_publicacao\|\|""/);
 assert.match(module,/!=="publicado"/);
 assert.match(module,/String\(item\.id\)===current/);
 assert.match(module,/rows\.slice\(0,3\)/);
 assert.match(module,/textContent=String\(item\.titulo\)/);
 assert.doesNotMatch(module,/innerHTML\s*=/);
});

test('Dossiês consultam a mesma classificação e apenas registros publicados',()=>{
 assert.match(dossier,/async function carregarRelacionadosDossie/);
 assert.match(dossier,/\.from\("Casos"\)/);
 assert.match(dossier,/\.eq\("status_publicacao","publicado"\)/);
 assert.match(dossier,/\.eq\("categoria",caso\.categoria\)/);
 assert.match(dossier,/\.neq\("id",caso\.id\)/);
});
test('Garimpo e Perícia não inferem vínculo entre casos',()=>{
 assert.match(listings,/async function carregarRelacionadosGarimpo/);
 assert.match(listings,/\.from\("casos_diarios"\)/);
 assert.match(listings,/\.eq\("status_publicacao","publicado"\)/);
 assert.match(listings,/Outras técnicas desta especialidade/);
 assert.match(listings,/periciasSupabase/);
});
test('Lendas e Creepypastas sugerem apenas arquivos publicados da coleção',()=>{
 assert.match(literary,/Outras narrativas desta coleção/);
 assert.match(literary,/status_publicacao=eq\.publicado/);
 assert.match(literary,/matching=same\.filter/);
});
for(const page of ['caso.html','garimpo.html','pericia.html','lendas.html','creepypastas.html']){
 test(page+' carrega módulo antes do editor e contém estilos',()=>{
  const html=file(page);
  assert.match(html,/css\/related-reading\.css\?v=1/);
  assert.match(html,/js\/related-reading\.js\?v=1" defer/);
  const p=html.indexOf('js/related-reading.js?v=1');
  const real=html.includes('js/caso.js?')?html.indexOf('js/caso.js?'):html.includes('js/arquivo-literario.js?')?html.indexOf('js/arquivo-literario.js?'):html.indexOf('js/script.js?');
  assert.ok(p>=0 && real>p);
 });
}
