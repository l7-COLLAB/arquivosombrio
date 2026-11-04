import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createCover} from '../scripts/original-covers-svg.mjs';
const read = name => fs.readFileSync(new URL('../' + name, import.meta.url), 'utf8');
const manifest = JSON.parse(read('data/alternativas-originais-uploads-20261103.json'));
const previous = JSON.parse(read('data/capas-alternativas-direitos-20261103.json')).records;
const key = r => r.editoria + ':' + r.id;

test('38 missing-provenance covers and 11 stories are mapped without duplicates', () => {
  assert.equal(manifest.records.length, 38);
  assert.equal(new Set(manifest.records.map(key)).size, 38);
  assert.equal(manifest.records.filter(r => r.story_path).length, 11);
  assert.equal(manifest.records.reduce((n, r) => n + r.story_identical_copies, 0), 14);
  assert.ok(manifest.records.every(r => r.status === 'preparacao_sem_troca_de_banco'));
  assert.ok(!manifest.records.some(r => previous.some(p => key(p) === key(r))));
  const counts = Object.groupBy(manifest.records, r => r.editoria);
  assert.equal(counts.Casos.length, 9);
  assert.equal(counts.casos_diarios.length, 23);
  assert.equal(counts.creepypastas.length, 1);
  assert.equal(counts.novels.length, 4);
  assert.equal(counts.pericias.length, 1);
});

test('all 49 illustrations are deterministic, original self-contained SVG and properly sized', () => {
  const files = [];
  for (const r of manifest.records) {
    files.push([r.cover_path, createCover(r, 'cover'), 900, 1200]);
    if (r.story_path) files.push([r.story_path, createCover(r, 'story'), 1080, 1920]);
  }
  assert.equal(files.length, 49);
  assert.equal(new Set(files.map(f => f[0])).size, 49);
  for (const [path, generated, w, h] of files) {
    assert.match(path,/^assets\/capas-alternativas-direitos\/(?:upload|story)-[a-z0-9-]+\.svg$/);
    const saved = read(path);
    assert.equal(saved, generated, path + ' diverged from reproducible artwork');
    assert.match(saved,new RegExp('viewBox="0 0 ' + w + ' ' + h + '"'));
    assert.ok(saved.includes('<title id="title">') && saved.includes('<desc id="desc">'));
    assert.match(saved, /ILUSTRAÇÃO|FOTOGRAFIA/);
    assert.doesNotMatch(saved, /<(?:script|image|foreignObject|iframe|use)\b/i);
    assert.doesNotMatch(saved, /(?:href|xlink:href|src)\s*=/i);
    assert.doesNotMatch(saved, /(?:data:image|url\(\s*https?:)/i);
    assert.ok(saved.endsWith('</svg>\n'));
  }
});

test('covers use conservative, readable display titles and never claim to show crime evidence',()=>{
  for (const r of manifest.records) {
    assert.ok(r.display_title && r.display_title.length <= 49);
    const svg = read(r.cover_path);
    assert.match(svg, /NÃO É FOTOGRAFIA, DOCUMENTO OU EVIDÊNCIA/);
    assert.ok(!svg.includes('<image '));
    if (r.editoria === 'novels') assert.ok(r.author && svg.includes('CAPA ORIGINAL DE OBRA LITERÁRIA'));
  }
});

test('existing readers expose original-cover attribution and novels use illustrative alt text',()=>{
  const source=read('js/cover-credits.js');
  assert.ok(source.includes('data/capas-alternativas-direitos-20261103.json'));
  assert.ok(source.includes('data/alternativas-originais-uploads-20261103.json'));
  assert.ok(source.includes('Capa ilustrativa original do Arquivo Sombrio'));
  assert.ok(source.includes('row.story_path'));
  const novels=read('js/novels.js');
  assert.ok(novels.includes('Capa ilustrativa original, sem fotografia'));
  const seo=read('scripts/build-seo-pages.py');
  assert.ok(seo.includes('social_cover = sitemap.BASE + "imagem-compartilhamento.jpg" if illustrated else cover'));
});

test('review gallery is noindex, has 38 covers and optional 11 story views',()=>{
 const page=read('previews/capas-uploads-originais-20261103.html');
 assert.match(page,/name="robots" content="noindex,nofollow,noarchive"/);
 assert.equal((page.match(/class="card"/g)||[]).length,38);
 assert.equal((page.match(/<details>/g)||[]).length,11);
 for (const r of manifest.records) assert.ok(page.includes('../'+r.cover_path));
});
