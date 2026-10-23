import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const xml=fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
const robots=fs.readFileSync(path.join(root,'robots.txt'),'utf8');
const urls=[...xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>(?:\s*<lastmod>([^<]+)<\/lastmod>)?[\s\S]*?<\/url>/g)].map(m=>({url:m[1],lastmod:m[2]}));
const contentTypes={'caso.html':19,'garimpo.html':30,'pericia.html':12,'lendas.html':6,'creepypastas.html':6};
test('sitemap completo, sem URLs duplicadas',()=>{
 assert.match(xml,/^<\?xml version=["']1\.0["'] encoding=["']UTF-8["']\?>/);
 assert.match(xml,/xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/);
 assert.equal(urls.length,94);
 assert.equal(new Set(urls.map(x=>x.url)).size,urls.length);
 assert.ok(urls.every(x=>x.url.startsWith('https://arquivosombrio.net.br/')));
});
test('cobre 73 publicações reais e as cinco editorias',()=>{
 for(const [page,count] of Object.entries(contentTypes)){
  const list=urls.filter(x=>x.url.includes('/'+page+'?id='));
  assert.equal(list.length,count,page);
  assert.ok(list.every(x=>/^https:\/\/arquivosombrio\.net\.br\/[\w-]+\.html\?id=\d+$/.test(x.url)));
  assert.ok(list.every(x=>/^\d{4}-\d\d-\d\d$/.test(x.lastmod)));
 }
});
test('inclui a pesquisa e preserva URLs fundamentais',()=>{
 for(const p of ['/','/dossies.html','/garimpo.html','/pericia.html','/lendas.html','/creepypastas.html','/pesquisa.html'])assert.ok(urls.some(x=>x.url==='https://arquivosombrio.net.br'+p),p);
});
test('IDs representativos realmente publicados possuem URLs próprias',()=>{
 for(const p of ['caso.html?id=26','caso.html?id=27','garimpo.html?id=28','garimpo.html?id=34','pericia.html?id=10','lendas.html?id=4','creepypastas.html?id=4'])assert.ok(urls.some(x=>x.url.endsWith(p)),p);
});
test('robots aponta para o sitemap e afasta painéis administrativos',()=>{
 assert.match(robots,/Sitemap: https:\/\/arquivosombrio\.net\.br\/sitemap\.xml/);
 assert.match(robots,/Disallow: \/admin-v2\//);
 assert.match(robots,/Disallow: \/admin-lite\//);
 assert.doesNotMatch(xml,/\/admin-v2\/|\/admin-lite\/|\/meu-arquivo\.html/);
});
test('URLs estáticas do sitemap têm arquivos correspondentes no repositório',()=>{
 for(const item of urls.filter(x=>!x.url.includes('?id='))){
  const filename=item.url.replace('https://arquivosombrio.net.br/','')||'index.html';
  assert.ok(fs.existsSync(path.join(root,filename)),filename);
 }
});
