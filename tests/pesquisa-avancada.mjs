import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
const root=path.resolve(import.meta.dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const html=read("pesquisa.html"),js=read("js/pesquisa-acervo.js"),css=read("css/pesquisa-acervo.css");
test("pesquisa unificada mantém sintaxe válida",()=>assert.doesNotThrow(()=>new vm.Script(js)));
test("histórico desativado por padrão, sem envio de termos a terceiros",()=>{
 assert.match(html,/id="as-search-save-history"/);
 assert.match(js,/function historyEnabled\(\)/);
 assert.match(js,/storageGet\(HISTORY_ENABLED\)==="yes"/);
 assert.match(js,/if\(!historyEnabled\(\)\|\|!q\)return/);
 assert.match(js,/storageRemove\(HISTORY_KEY\)/);
 assert.match(js,/\.slice\(0,6\)/);
 assert.doesNotMatch(js,/sendBeacon\(|\.functions\.invoke\(/);
});
test("sugestões usam somente registros publicados já carregados",()=>{
 assert.match(js,/state\.rows\.forEach/);
 assert.match(js,/normalize\(item\.titulo\)\.includes\(q\)/);
 assert.match(js,/item\.status_publicacao==="publicado"/);
 assert.match(js,/params\.set\("status_publicacao","eq.publicado"\)/);
 assert.match(js,/holder\.append\(b\)/);
});
test("ordena por relevância, data e alfabeto com fallback estável",()=>{
 for(const mode of ["relevance","recent","oldest","az","za"])assert.ok(html.includes('value="'+mode+'"'));
 assert.match(js,/function sorter\(a,b,terms\)/);
 assert.match(js,/\.sort\(\(a,b\)=>sorter\(a,b,terms\)\)/);
});
test("layout móvel, seletores e acessibilidade preservados",()=>{
 assert.match(html,/id="as-search-suggestions"/);
 assert.match(html,/id="as-search-order"/);
 assert.match(html,/id="as-search-clear-history"/);
 assert.match(css,/@media\(max-width:590px\)/);
 assert.match(css,/:focus-visible/);
 assert.match(html,/js\/pesquisa-acervo.js\?v=2/);
});
