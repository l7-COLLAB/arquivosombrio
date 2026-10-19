import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
const root=path.resolve(import.meta.dirname,"..");
const html=fs.readFileSync(path.join(root,"dossies/caso-jonbenet-ramsey.html"),"utf8");
test("legacy JonBenet page loads resources from correct published domain root",()=>{
 assert.match(html,/<base href="\/">/);
 assert.doesNotMatch(html,/<base href="\/arquivosombrio\/">/);
 for(const name of ["data/caso.js","js/caso.js"]) {
   assert.match(html,new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")));
   assert.ok(fs.existsSync(path.join(root,name)));
 }
});
test("legacy page points to the published SEO HTML document",()=>{
 const canonical="https://arquivosombrio.net.br/arquivo/caso-7.html";
 assert.match(html,/<link rel="canonical" href="https:\/\/arquivosombrio\.net\.br\/arquivo\/caso-7\.html">/);
 assert.ok(html.includes('content="'+canonical+'"'));
 assert.match(html,/"@id":"https:\/\/arquivosombrio\.net\.br\/arquivo\/caso-7\.html"/);
 assert.match(html,/window\.ARQUIVO_CASO_ID = "7"/);
 const sitemap=fs.readFileSync(path.join(root,"sitemap.xml"),"utf8");
 assert.ok(sitemap.includes("https://arquivosombrio.net.br/dossies/caso-jonbenet-ramsey.html"));
});
