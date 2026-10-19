import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
const root=path.resolve(import.meta.dirname,"..");
const read=(p)=>fs.readFileSync(path.join(root,p),"utf8");
const seo=read("js/seo-publicacao.js");
const dossier=read("js/caso.js");
const workflow=read(".github/workflows/deploy-pages.yml");
test("módulo de SEO e leitor mantêm sintaxe válida",()=>{
 assert.doesNotThrow(()=>new vm.Script(seo));
 assert.doesNotThrow(()=>new vm.Script(dossier));
});
test("rascunhos recebem noindex e não recebem Article JSON-LD",()=>{
 assert.match(dossier,/indexavel:\s*String\(caso\.status_publicacao\s*\|\|\s*""\)\.toLowerCase\(\) !== "rascunho"/);
 assert.match(seo,/configuracao\.indexavel !== false/);
 assert.match(seo,/"noindex, nofollow"/);
 assert.match(seo,/if \(!indexavel\)[\s\S]*?\.remove\(\);[\s\S]*?return;/);
 assert.match(seo,/schema\.dateModified/);
});
test("deploy inclui sitemap dinâmico e agenda recorrente",()=>{
 assert.match(workflow,/cron: '17 \*\/6 \* \* \*'/);
 assert.match(workflow,/python3 scripts\/build-seo-pages\.py _site/);
 assert.ok(workflow.indexOf("build-seo-pages.py")<workflow.indexOf("upload-pages-artifact@"));
 assert.match(read("robots.txt"),/Sitemap: https:\/\/arquivosombrio\.net\.br\/sitemap\.xml/);
});
