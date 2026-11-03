import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const parse=(s)=>{
 const rows=s.trimEnd().split('\n').map(line=>Array.from(line.matchAll(/"((?:[^"]|"")*)"(?:,|$)/g),m=>m[1].replace(/""/g,'"')));
 const h=rows.shift();return rows.map(row=>Object.fromEntries(h.map((k,i)=>[k,row[i]])));
};
const alts=JSON.parse(read('data/capas-alternativas-direitos-20261103.json'));
const external=parse(read('docs/triagem-21-capas-terceiros-20261103.csv'));
const uploads=parse(read('docs/rastreio-storage-capas-20261103.csv'));
const key=r=>r.editoria+':'+r.id;

test('21 distinct third-party covers have exactly one original visual alternative',()=>{
 assert.equal(alts.records.length,21);
 assert.equal(external.length,21);
 assert.equal(new Set(alts.records.map(key)).size,21);
 assert.equal(new Set(external.map(key)).size,21);
 for(const p of external){
  const a=alts.records.find(a=>key(a)===key(p));
  assert.ok(a,'missing '+key(p));
  assert.equal(a.alternative_path,p.alternativa_original_svg);
  assert.equal(a.status,'publicado_no_banco_20261103');
  assert.equal(p.estado_substituicao,'substituida_em_20261103_backup_privado');
  assert.equal(p.situacao_licenca,'licenca_especifica_nao_comprovada');
 }
});

test('all 21 alternatives are self-contained documentary SVGs without remote media',()=>{
 for(const a of alts.records){
  assert.match(a.alternative_path,/^assets\/capas-alternativas-direitos\/[a-z0-9-]+\.svg$/);
  const svg=read(a.alternative_path);
  assert.match(svg,/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(svg,/viewBox="0 0 900 1200"/);
  assert.match(svg,/<title id="title">/);
  assert.match(svg,/<desc id="desc">/);
  assert.match(svg,/ILUSTRAÇÃO EDITORIAL ORIGINAL/);
  assert.match(svg,/NÃO É FOTOGRAFIA OU EVIDÊNCIA/);
  assert.doesNotMatch(svg,/<(?:script|image|foreignObject|iframe|use)\b/i);
  assert.doesNotMatch(svg,/(?:href|src|xlink:href)\s*=/i);
  assert.doesNotMatch(svg,/url\(\s*(?:http|data):/i);
 }
});

test('38 Storage uploads are traced without leaking uploader IDs or false licensing claims',()=>{
 assert.equal(uploads.length,38);
 assert.equal(new Set(uploads.map(key)).size,38);
 assert.equal(uploads.filter(x=>x.metadados_personalizados==='ausente').length,38);
 assert.equal(uploads.filter(x=>x.estado_de_licenca==='fonte_e_licenca_nao_documentadas').length,38);
 assert.equal(new Set(uploads.map(x=>x.responsavel_envio_pseudonimo)).size,2);
 assert.ok(uploads.every(x=>/^envio_[12]$/.test(x.responsavel_envio_pseudonimo)));
 assert.ok(uploads.some(x=>x.storage_path.startsWith('novel-capas/')));
 assert.ok(uploads.some(x=>x.storage_path.startsWith('imagens/')));
});

test('duplicate external image reference is identified across two editorias',()=>{
 const dup=external.filter(x=>x.mesma_foto_em_outra_publicacao);
 assert.equal(dup.length,2);
 assert.deepEqual(new Set(dup.map(key)),new Set(['casos_diarios:34','pericias:14']));
});

test('illustrative preview is noindex and does not hotlink source images',()=>{
 const html=read('previews/capas-alternativas-direitos-20261103.html');
 assert.match(html,/name="robots" content="noindex,nofollow,noarchive"/);
 assert.equal((html.match(/class="card"/g)||[]).length,21);
 assert.doesNotMatch(html,/https?:\/\/(?:.*?\.)?(?:cbsnews|abcnews|nflximg|zeiss)\./i);
 for(const a of alts.records)assert.ok(html.includes('../'+a.alternative_path));
});
