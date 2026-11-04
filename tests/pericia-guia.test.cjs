const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const quiz=require('../js/pericia-trilha.js');
const guia=fs.readFileSync('guia-pericia.html','utf8');
const lab=fs.readFileSync('laboratorio-forense.html','utf8');
const pdf=fs.readFileSync('assets/apostila-pericia-forense.pdf');

test('apostila dispõe de todos os capítulos necessários aos nove desafios',()=>{
  const anchors=['metodo','manchas','grupos','comparacao','hemacias','custodia','hipoteses','revisao'];
  for(const id of anchors)assert.match(guia, new RegExp('id="'+id+'"'));
  for(let i=0;i<quiz.QUESTIONS.length;i++){
    const href=quiz.guideForQuestion(i);
    assert.ok(href.startsWith('guia-pericia.html#'));
    assert.ok(guia.includes('id="'+href.split('#')[1]+'"'),href);
  }
  assert.equal(quiz.guideForQuestion(9),null);
  assert.equal(quiz.guideForQuestion(-1),null);
  assert.equal(quiz.QUESTIONS.length,9);
  assert.deepEqual(quiz.QUESTIONS.map(q=>q.correct),[0,2,1,3,0,2,1,3,0]);
});

test('fluxo de estudo vem antes de responder e conserva laboratórios',()=>{
  const locations=['id="apostila"','id="trilha"','id="padroes"','id="tipagem"'].map(x=>lab.indexOf(x));
  assert.ok(locations.every(x=>x>0));
  assert.deepEqual(locations.slice().sort((a,b)=>a-b),locations);
  assert.ok(lab.includes('id="quest-study-link"'));
  assert.ok(lab.includes('href="guia-pericia.html"'));
  assert.ok(lab.includes('assets/apostila-pericia-forense.pdf'));
  assert.equal((lab.match(/class="lab-section study-section"/g)||[]).length,1);
  assert.equal((lab.match(/id="apostila"/g)||[]).length,1);
});

test('PDF de estudo tem cabeçalho, índice de páginas e estrutura íntegra',()=>{
  assert.equal(pdf.subarray(0,8).toString('latin1'),'%PDF-1.4');
  assert.ok(pdf.length>8000,'PDF otimizado precisa ter conteúdo');
  assert.match(pdf.toString('latin1').slice(-500),/%%EOF/);
  const text=pdf.toString('latin1');
  const pos=/startxref\s+(\d+)\s+%%EOF/.exec(text);
  assert.ok(pos,'faltou startxref');
  assert.equal(text.slice(Number(pos[1]),Number(pos[1])+4),'xref');
  assert.equal((text.match(/\/Type\s*\/Page\b/g)||[]).length,7);
  // Streams podem estar comprimidos; a verificação de texto/acento é feita pelo PyMuPDF no QA visual.
  assert.ok(text.includes('/FlateDecode'),'PDF otimizado deve conter stream comprimido');
});

test('recompensas e histórico de respostas permanecem válidos',()=>{
  const old={index:5,answers:[0,2,1,3,0]};
  assert.deepEqual(quiz.validateState(old),old);
  assert.equal(quiz.progress(old.answers).points,50);
  assert.equal(quiz.progress(old.answers).badges,1);
  assert.equal(quiz.progress(quiz.QUESTIONS.map(q=>q.correct)).points,90);
});
