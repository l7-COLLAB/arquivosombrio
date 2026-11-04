import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const manifest=JSON.parse(read('data/alternativas-originais-uploads-20261103.json'));
const prior=JSON.parse(read('data/capas-alternativas-direitos-20261103.json'));
const credits=read('creditos-imagens.html');
const parse=s=>{
 const lines=s.trimEnd().split('\n');
 const extract=x=>Array.from(x.matchAll(/"((?:[^"]|"")*)"(?:,|$)/g),m=>m[1].replace(/""/g,'"'));
 const header=extract(lines.shift());
 return lines.map(x=>{const row=extract(x);assert.equal(row.length,header.length);return Object.fromEntries(header.map((key,i)=>[key,row[i]]));});
};
const current=parse(read('docs/estado-atual-44-direitos-capas-20261103.csv'));
const key=r=>r.editoria+':'+r.id;

test('manifest and current registry agree on 38 applied cover replacements',()=>{
 assert.equal(manifest.records.length,38);
 assert.equal(manifest.records.filter(x=>x.status==='publicado_no_banco_20261103').length,38);
 assert.equal(manifest.records.filter(x=>x.story_path).length,11);
 assert.equal(manifest.records.reduce((n,x)=>n+x.story_identical_copies,0),14);
 assert.equal(current.length,44);
 assert.equal(new Set(current.map(key)).size,44);
 assert.equal(current.filter(x=>x.estado==='substituido').length,38);
 assert.equal(current.filter(x=>x.estado==='pendente_evidencia').length,5);
 assert.equal(current.filter(x=>x.estado==='termos_institucionais_documentados').length,1);
 assert.equal(current.filter(x=>x.imagem_atual_de_story).length,11);
 for(const r of manifest.records){
  const x=current.find(y=>key(y)===key(r));
  assert.ok(x,'current row missing '+key(r));
  assert.equal(x.localizador_atual,r.cover_path);
  assert.equal(x.imagem_atual_de_story,r.story_path||'');
 }
});
test('public image credits cover 59 original editorial SVGs plus 51 prior documented sources',()=>{
 assert.equal(prior.records.length,21);
 const all=[...prior.records.map(x=>({editoria:x.editoria,id:x.id,path:x.alternative_path})),...manifest.records.map(x=>({editoria:x.editoria,id:x.id,path:x.cover_path}))];
 assert.equal(all.length,59);
 assert.equal(new Set(all.map(key)).size,59);
 assert.equal((credits.match(/<article class="credit"/g)||[]).length,110);
 assert.ok(credits.includes('Relação parcial de 110 capas'));
 for(const x of all){
  assert.ok(credits.includes('id="'+x.editoria+'-'+x.id+'"'),'credit missing '+key(x));
  assert.ok(credits.includes('href="/'+x.path+'"'),'link missing '+key(x));
 }
 assert.ok(credits.includes('id="pericias-12"'));
});
test('public current audit omits unlicensed source bytes and indicates six special cases',()=>{
 const raw=read('docs/estado-atual-44-direitos-capas-20261103.csv');
 assert.doesNotMatch(raw,/data:image\/jpeg;base64,/);
 assert.doesNotMatch(raw,/owner_id|user_metadata|service_role/);
 assert.equal(current.filter(x=>x.estado!=='substituido').length,6);
 assert.equal(current.find(x=>x.editoria==='casos_diarios'&&x.id==='6').localizador_atual,'DATA_URI_OMITIDA');
 assert.ok(read('docs/REGISTRO_PUBLICACAO_38_CAPAS_E_11_STORIES_20261103.md').includes('38/38'));
});
