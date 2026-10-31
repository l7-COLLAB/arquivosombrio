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


const vm=require('node:vm');
const viewSource=fs.readFileSync(path.join(__dirname,'../js/especiais.js'),'utf8');
assert.ok(viewSource.includes("if(document.readyState==='loading')"),'Ponto de inicialização ausente');
const exposed=viewSource.replace("if(document.readyState==='loading')","globalThis.__testSpecials={setCampaigns:list=>{campaigns=list},active,halloweenExpiry,entry};if(document.readyState==='loading')");
class FakeDate extends Date{
 constructor(...args){super(...(args.length?args:['2026-11-02T01:00:00Z']))}
 static now(){return Date.parse('2026-11-02T01:00:00Z')}
}
const sandbox={document:{readyState:'loading',addEventListener(){}},location:{origin:'https://arquivosombrio.net.br'},console,URL,URLSearchParams,Date:FakeDate,Intl};
vm.runInNewContext(exposed,sandbox,{filename:'especiais.js'});
const t=sandbox.__testSpecials;
const scenario=JSON.parse(JSON.stringify(halloween));
scenario.days[0].published=true;
scenario.days[0].url='/especiais/7-noites-de-horror-real/arquivo/?id=53';
scenario.days[0].cover='https://example.com/cover.jpg';
scenario.days[0].summary='Resumo breve da investigação.';
const final=scenario.days.at(-1);
final.published=true;
final.url='/especiais/7-noites-de-horror-real/arquivo/?id=66';
final.publishedAt='2026-10-31T23:00:00Z';
t.setCampaigns([scenario]);
const expires=Date.parse('2026-11-01T23:00:00Z');
assert.equal(t.halloweenExpiry(scenario),expires,'Prazo deve ser 24h após a estreia das 20h');
assert.equal(t.active('2026-11-01',expires-1)?.id,'halloween-2026','Não ocultar antes das 24h');
assert.equal(t.active('2026-11-01',expires),undefined,'Ocultar destaque pontualmente ao final das 24h');
final.publishedAt='2026-11-01T01:00:00Z';
assert.equal(t.halloweenExpiry(scenario),Date.parse('2026-11-02T01:00:00Z'),'Publicação tardia deve prorrogar as 24h');
final.publishedAt='2026-10-31T23:00:00Z';
final.published=false;final.url=null;
assert.equal(t.halloweenExpiry(scenario),null,'Não encerrar antes da confirmação da publicação final');
assert.equal(t.active('2026-11-01',expires+1000)?.id,'halloween-2026','Manter promoção se último arquivo ainda não foi publicado');
const cards=t.entry(scenario,'2026-11-01');
assert.ok(cards.includes('Resumo breve da investigação.'),'Card deve conter resumo');
assert.ok(cards.includes('https://example.com/cover.jpg'),'Card deve conter capa');
assert.ok(cards.includes('/arquivo/?id=53'),'Card deve abrir arquivo completo');
assert.ok(!cards.includes('id=54'),'Rascunhos não podem aparecer nos cards');
console.log('Prazo de 24 horas, atraso de publicação e cards públicos: OK');
