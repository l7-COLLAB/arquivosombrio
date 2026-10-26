import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const root=path.resolve(import.meta.dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const main=read('js/script.js'),literary=read('js/arquivo-literario.js');
test('scripts das buscas não têm erros sintáticos',()=>{
 assert.doesNotThrow(()=>new vm.Script(main));
 assert.doesNotThrow(()=>new vm.Script(literary));
});
test('Garimpo combina palavra-chave, local e categoria com filtro de acompanhamento',()=>{
 const fn=main.slice(main.indexOf('function instalarFiltrosAcompanhamentoGarimpo('));
 assert.match(fn,/data-name/);
 assert.match(fn,/data-category/);
 assert.match(fn,/data-tracking/);
 assert.match(fn,/r\.local,r\.resumo/);
 assert.match(fn,/terms\.every/);
 assert.match(fn,/registros"/);
 assert.match(fn,/Limpar filtros/);
 assert.match(main,/\.eq\("status_publicacao", "publicado"\)/);
});
test('Garimpo busca apenas metadados na lista e preserva dados completos no detalhe',()=>{
 const start=main.indexOf('async function carregarGarimpoPublico()');
 const end=main.indexOf('async function carregarRelacionadosGarimpo(',start);
 assert.ok(start>=0&&end>start);
 const fn=main.slice(start,end);
 assert.match(fn,/\.select\(id \? "\*" : "id,titulo,resumo,imagem_capa,categoria,local,data_caso,status_caso,acompanhamento_status,publicado_em,created_at"\)/);
 assert.match(fn,/if \(id\) \{/);
 assert.match(fn,/consulta = consulta\.eq\("id", id\)\.limit\(1\)/);
 assert.match(fn,/instalarFiltrosAcompanhamentoGarimpo\(grade, casos\)/);
});
test('Lendas e Creepypastas combinam origem com pesquisa e contagem',()=>{
 assert.match(literary,/origins=\[\.\.\.new Set/);
 assert.match(literary,/Filtrar por origem/);
 assert.match(literary,/terms\.every/);
 assert.match(literary,/status_publicacao=eq\.publicado/);
 assert.match(literary,/Limpar filtros/);
});
for(const page of ['garimpo.html','lendas.html','creepypastas.html']){
 test(page+' usa estilos da busca aprimorada sem alterar arquivos',()=>{
  assert.match(read(page),/css\/discovery-filters-20261018\.css\?v=1/);
 });
}
test('Garimpo atualiza a versão do script após otimização da lista',()=>{
 const html=read('garimpo.html');
 assert.match(html,/js\\/script\\.js\\?v=garimpo-list-perf-20261026/);
});
test('busca possui foco visível e layout para celular',()=>{
 const css=read('css/discovery-filters-20261018.css');
 assert.match(css,/:focus-visible/);
 assert.match(css,/@media\(max-width:650px\)/);
 assert.doesNotMatch(css,/admin-dashboard-open|novel-reader/);
});
