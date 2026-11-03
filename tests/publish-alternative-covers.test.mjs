import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read=p=>fs.readFileSync(new URL("../"+p,import.meta.url),"utf8");
const manifest=JSON.parse(read("data/capas-alternativas-direitos-20261103.json"));
test("21 published-substitute entries retain editorial illustration policy",()=>{
 assert.equal(manifest.records.length,21);
 assert.equal(new Set(manifest.records.map(r=>r.editoria+":"+r.id)).size,21);
 for(const r of manifest.records){
  assert.match(r.alternative_path,/^assets\/capas-alternativas-direitos\/[a-z0-9-]+\.svg$/);
  assert.equal(r.status,"publicado_no_banco_20261103");
  assert.ok(r.previous_cover_url.startsWith("https://"));
  const xml=read(r.alternative_path);
  assert.ok(xml.includes("ILUSTRAÇÃO EDITORIAL ORIGINAL"));
  assert.ok(xml.includes("NÃO É FOTOGRAFIA OU EVIDÊNCIA"));
  assert.doesNotMatch(xml,/<(?:image|script|foreignObject|iframe)\b/i);
 }
});
test("editorial credit renderer labels SVG as an illustration and retains licensed credits",()=>{
 const source=read("js/cover-credits.js");
 assert.ok(source.includes("data/capas-alternativas-direitos-20261103.json"));
 assert.ok(source.includes("data/capas-documentais.json"));
 assert.ok(source.includes("Capa ilustrativa original"));
 assert.ok(source.includes("Não é fotografia"));
 assert.ok(source.includes("Fonte da imagem"));
 assert.ok(source.includes("creativecommons.org"));
 assert.ok(source.includes("img.dataset.coverCredit"));
});
test("SVG previews use a JPEG social card; article image remains the illustration",()=>{
 const python=read("scripts/build-seo-pages.py");
 assert.ok(python.includes('social_cover = sitemap.BASE + "imagem-compartilhamento.jpg" if illustrated else cover'));
 assert.ok(python.includes('e(social_cover)'));
 assert.ok(python.includes("image_alt"));
 assert.ok(python.includes("schema = {"));
 assert.ok(python.includes('"image": [cover]'));
 const browser=read("js/seo-publicacao.js");
 assert.ok(browser.includes("imagemSocial"));
 assert.ok(browser.includes("imagem-compartilhamento.jpg"));
 assert.ok(browser.includes("image: [imagem]"));
});
test("public readers and SEO generated pages invalidate previous script cache",()=>{
 for(const p of ["caso.html","garimpo.html","pericia.html","lendas.html","creepypastas.html","scripts/build-seo-pages.py"]){
  assert.ok(read(p).includes("cover-credits.js?v=20261103-2"),p);
 }
});
