import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
const root=path.resolve(import.meta.dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const page=read("pesquisa.html");
const js=read("js/pesquisa-acervo.js");
const css=read("css/pesquisa-acervo.css");
test("página com SEO, acessibilidade e controles funcionais",()=>{
 assert.match(page,/<html lang="pt-BR">/);
 assert.match(page,/https:\/\/arquivosombrio.net.br\/pesquisa.html/);
 for(const id of ["as-search-form","as-search-input","as-results-count","as-search-sections","as-search-message"])assert.ok(page.includes('id="'+id+'"'));
 assert.match(page,/role="search"/);
 assert.match(page,/js\/pesquisa-acervo.js\?v=2/);
 assert.match(page,/css\/pesquisa-acervo.css\?v=1/);
});
test("script válido e cinco fontes corretas",()=>{
 assert.doesNotThrow(()=>new vm.Script(js));
 for(const t of ["Casos","casos_diarios","pericias","lendas","creepypastas"])assert.ok(js.includes('table:"'+t+'"'));
 assert.match(js,/status_publicacao","eq\.publicado"/);
 assert.match(js,/item\.status_publicacao==="publicado"/);
  assert.match(js,/Promise\.allSettled/);
  assert.doesNotMatch(js,/table:"livros"/);
  assert.match(js,/Nenhum registro corresponde à pesquisa/);
  assert.match(js,/Pesquisa parcial: algumas editorias não responderam/);
 });
test("resultados escapam conteúdo ao criar elementos",()=>{
 assert.match(js,/name\.textContent|el\.textContent/);
 assert.match(js,/encodeURIComponent\(String\(item\.id\)\)/);
 assert.doesNotMatch(js,/\.innerHTML\s*=/);
 assert.match(js,/URLSearchParams/);
 assert.match(js,/aria-pressed/);
});
test("layout adaptativo e movimento reduzido",()=>{
 assert.match(css,/@media\(max-width:590px\)/);
 assert.match(css,/prefers-reduced-motion/);
 assert.match(css,/:focus-visible/);
});
for(const p of ["index.html","dossies.html","garimpo.html","pericia.html","lendas.html","creepypastas.html"]){
 test(p+" inclui acesso à pesquisa",()=>{
  const content=read(p);
  assert.match(content,/href="pesquisa.html"/);
 });
}
