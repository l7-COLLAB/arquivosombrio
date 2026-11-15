#!/usr/bin/env node
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const intro=JSON.parse(read('i18n/introducoes.json'));
const ui=JSON.parse(read('i18n/interface-internacional.json'));
const cfg=JSON.parse(read('i18n/config-internacional.json'));
const releases=JSON.parse(read('i18n/international-release.json'));
const locales=[['en-US','en'],['es-ES','es'],['fr-FR','fr']];
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
test('production routes remain disabled',()=>{
 assert.equal(cfg.productionRoutesEnabled,false);
 assert.equal(releases.productionRoutesEnabled,false);
 assert.equal(releases.internationalLaunchApproved,false);
 assert.equal(releases.status,'preview-only');
});
for(const [locale,dir] of locales){
 test(locale+' preview has static localized metadata and content',()=>{
  const h=read('preview-internacional/'+dir+'/index.html');
  assert.match(h,new RegExp('<html lang="'+locale+'">'));
  assert.match(h,/<meta name="robots" content="noindex,nofollow,noarchive">/);
  assert.ok(h.includes('content="'+esc(ui.locales[locale].description)+'"'));
  assert.ok(h.includes('<h2>'+esc(intro.locales[locale].tagline)+'</h2>'));
  assert.ok(h.includes(esc(intro.locales[locale].intro)));
  for(const item of ui.locales[locale].categories)assert.ok(h.includes('<li>'+esc(item)+'</li>'));
  assert.doesNotMatch(h,/<link\s+rel="(?:canonical|alternate)"/i);
  assert.doesNotMatch(h,/<script[\s>]/i);
  assert.match(h,/<a class="skip" href="#conteudo">/);
  assert.ok(h.includes('href="../preview.css"'));
  assert.ok(h.includes('href="../../index.html"'));
  assert.equal(releases.previewPages.find(x=>x.locale===locale).publishedCases,0);
  assert.equal(releases.previewPages.find(x=>x.locale===locale).indexable,false);
 });
}
test('preview languages and paths correspond to planned locales',()=>{
 for(const [locale,dir] of locales){
  const item=cfg.locales.find(x=>x.code===locale);
  assert.equal(releases.previewPages.find(x=>x.locale===locale).plannedProductionPath,item.plannedPath);
  const h=read('preview-internacional/'+dir+'/index.html');
  for(const [,segment] of locales)assert.ok(h.includes('href="../'+segment+'/"'));
 }
});
test('CSS supports compact devices, focus and reduced-motion accessibility',()=>{
 const css=read('preview-internacional/preview.css');
 assert.ok(css.includes('max-width:690px'));
 assert.ok(css.includes('max-width:410px'));
 assert.ok(css.includes('prefers-reduced-motion'));
 assert.ok(css.includes(':focus-visible'));
});
