const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const lab=require('../js/pericia-novos-modulos.js');
const read=(name)=>fs.readFileSync(name,'utf8');

test('cadeia de custódia: 5 registros, ordem correta e reordenação incorreta',()=>{
  assert.equal(lab.ITEMS.length,5);
  assert.deepEqual(lab.ITEMS.map(x=>x.id),[0,1,2,3,4]);
  assert.ok(!lab.checkOrder(lab.INITIAL));
  assert.ok(lab.checkOrder([0,1,2,3,4]));
  assert.equal(lab.checkOrder([0,1,2,2,4]),false);
  assert.equal(lab.checkOrder([0,1,2]),false);
  assert.equal(lab.checkOrder([0,1,2,3,'4']),false);
  assert.equal(lab.ITEMS[3].time,'10h20');
});

test('cadeia de custódia: lacuna é recebedor não identificado, sem inferir fraude',()=>{
  assert.equal(lab.checkGap(1),true);
  assert.equal(lab.checkGap(0),false);
  assert.equal(lab.checkGap(2),false);
  const html=read('pericia-custodia.html');
  assert.match(html,/Responsável pelo recebimento: —/);
  assert.match(html,/Não há identificação de quem recebeu/i);
  assert.match(html,/não comprova|não prova|não demonstra|não identifica/i);
});

test('cadeia de custódia: estado inválido não libera medalha',()=>{
  const normalized=lab.normalizeCustody({order:[0,1,2,3,4],sorted:true,complete:true});
  assert.equal(normalized.complete,true);
  assert.equal(lab.normalizeCustody({order:[0,1,3,2,4],sorted:true,complete:true}).complete,false);
  assert.equal(lab.normalizeCustody(null).complete,false);
  assert.equal(lab.normalizeCustody({order:[0,0,1,2,4],sorted:true}).sorted,false);
});

test('impressões sintéticas: associação visual e limite da conclusão',()=>{
  assert.equal(lab.checkReference('r17'),true);
  assert.equal(lab.checkReference('r24'),false);
  assert.equal(lab.checkReference('V03'),false);
  assert.equal(lab.checkConclusion(1),true);
  assert.equal(lab.checkConclusion(0),false);
  assert.equal(lab.checkConclusion(2),false);
  const c=lab.normalizePrint({compared:true,complete:true,reference:'r17',marks:true});
  assert.equal(c.complete,true);
  assert.equal(lab.normalizePrint({compared:false,complete:true,reference:'r17',marks:true}).complete,false);
  assert.equal(lab.normalizePrint({compared:true,complete:true,reference:'invalid',marks:true}).complete,false);
});

test('guias e PDFs existem e vêm antes da atividade',()=>{
  for(const key of ['custodia','papiloscopia']){
    const labHtml=read('pericia-'+key+'.html');
    const guide=read('guia-pericia-'+key+'.html');
    const pdf=fs.readFileSync('assets/guia-pericia-'+key+'.pdf');
    assert.ok(labHtml.indexOf('id="estudo"')<labHtml.indexOf('id="atividade"'));
    assert.ok(labHtml.includes('href="guia-pericia-'+key+'.html"'));
    assert.ok(labHtml.includes('href="assets/guia-pericia-'+key+'.pdf"'));
    assert.ok(guide.includes('assets/guia-pericia-'+key+'.pdf'));
    assert.equal((guide.match(/class="m-chapter"/g)||[]).length,4);
    assert.ok(pdf.subarray(0,8).toString('latin1')==='%PDF-1.4');
    assert.match(pdf.toString('latin1').slice(-400),/%%EOF/);
    assert.ok(pdf.length>8000);
  }
});

test('integração mantém trilha original com acesso temporariamente oculto na editoria',()=>{
  const listing=read('pericia.html');
  const home=read('laboratorio-forense.html');
  assert.equal((listing.match(/class="forensic-exercises-link"/g)||[]).length,0);
  assert.ok(!listing.includes('href="laboratorio-forense.html"'));
  assert.ok(!listing.includes('forensic-interactive-card'));
  assert.ok(home.includes('href="pericia-custodia.html"'));
  assert.ok(home.includes('href="pericia-papiloscopia.html"'));
  assert.ok(home.includes('id="trilha"'));
  assert.ok(home.includes('id="padroes"'));
  assert.ok(home.includes('id="tipagem"'));
});

test('módulos não enviam dados pessoais nem usam APIs remotas',()=>{
  const js=read('js/pericia-novos-modulos.js');
  assert.ok(js.includes('localStorage'));
  assert.ok(!js.includes('fetch('));
  assert.ok(!js.includes('XMLHttpRequest'));
  assert.ok(!js.includes('navigator.geolocation'));
  assert.ok(!js.includes('sendBeacon'));
});
