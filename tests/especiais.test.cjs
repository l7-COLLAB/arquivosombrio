/* Testes sem dependências para o manifesto dos especiais. Executar: node tests/especiais.test.cjs */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/especiais.json'),'utf8'));
const campaigns=manifest.campaigns;
assert.ok(Array.isArray(campaigns)&&campaigns.length>=4);
const ids=new Set(),slugs=new Set();
for(const c of campaigns){
 assert.match(c.id,/^[a-z0-9-]+$/);
 assert.match(c.slug,/^[a-z0-9-]+$/);
 assert.ok(!ids.has(c.id),'ID repetido: '+c.id);
 assert.ok(!slugs.has(c.slug),'Slug repetido: '+c.slug);
 ids.add(c.id);slugs.add(c.slug);
 assert.ok(['draft','scheduled','active','completed'].includes(c.status));
 assert.match(c.start,/^\d{4}-\d{2}-\d{2}$/);
 assert.match(c.end,/^\d{4}-\d{2}-\d{2}$/);
 assert.ok(c.start<=c.end);
 assert.ok(Array.isArray(c.days));
 for(const day of c.days){
  assert.ok(day.date>=c.start&&day.date<=c.end,'Dia fora do período');
  if(day.url)assert.match(day.url,/^\/(?!\/)[a-zA-Z0-9_./?=&%-]+$/);
  assert.ok(!day.url||(!day.url.includes('..')&&!day.url.includes('//')));
  if(day.published)assert.ok(day.url,'Artigo marcado publicado sem URL');
 }
 const asset=path.join(__dirname,'../assets/especiais/banner-'+c.theme+'.svg');
 assert.ok(fs.existsSync(asset),'Banner ausente '+c.theme);
}
const activeAt=date=>campaigns.filter(c=>['scheduled','active'].includes(c.status)&&c.start<=date&&c.end>=date);
assert.deepEqual(activeAt('2026-10-24').map(c=>c.id),[]);
assert.deepEqual(activeAt('2026-10-25').map(c=>c.id),['halloween-2026']);
assert.deepEqual(activeAt('2026-10-31').map(c=>c.id),['halloween-2026']);
assert.deepEqual(activeAt('2026-11-01').map(c=>c.id),[]);
assert.deepEqual(activeAt('2026-11-02').map(c=>c.id),[]);
assert.ok(campaigns.every(c=>c.days.every(d=>!d.published||Boolean(d.url))),'Arquivo público sem URL: revisar');
const halloween=campaigns.find(c=>c.id==='halloween-2026');
assert.equal(halloween.days.length,7,'O especial de Halloween deve conter sete noites');
assert.ok(halloween.days.every((d,i)=>d.date===`2026-10-${String(25+i).padStart(2,'0')}`),'Datas de Halloween fora de ordem');
assert.equal(halloween.days[0].title,'Ronald O’Bryan');
assert.equal(halloween.days[1].title,'Martha Moxley');
assert.equal(halloween.days[0].caseId,53);
assert.equal(halloween.days[1].caseId,54);
assert.ok(new Set(halloween.days.filter(d=>d.caseId).map(d=>d.caseId)).size===halloween.days.filter(d=>d.caseId).length,'ID de caso repetido na campanha');
console.log('Manifesto, períodos, banners e bloqueios básicos: OK');
