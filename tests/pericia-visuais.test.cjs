// Valida o material visual e didático das mesmas nove questões (sem criar novos desafios).
const test = require('node:test');
const assert = require('node:assert/strict');
const visual = require('../js/pericia-visuais.js');
const game = require('../js/pericia-trilha.js');

test('exatamente nove diagramas SVG, todos com descrição acessível',()=>{
  assert.equal(visual.VISUALS.length, 9);
  assert.equal(visual.HINTS.length, 9);
  assert.equal(visual.CHOICE_NOTES.length, 9);
  assert.equal(game.QUESTIONS.length, 9);
  let distinct = new Set();
  visual.VISUALS.forEach((v,i)=>{
    assert.ok(v.alt.length>35, 'alt da questão '+(i+1));
    assert.match(v.html, /<svg [^>]+role="img"[^>]+aria-label=/);
    assert.ok(v.html.includes('</svg>'));
    assert.equal(v.html.includes('<script'),false);
    assert.ok(v.html.length>600);
    distinct.add(v.html);
    assert.deepEqual(visual.details(i).visual,v);
  });
  assert.equal(distinct.size,9);
  assert.equal(visual.details(-1),null);
  assert.equal(visual.details(9),null);
});

test('cada uma das 36 escolhas explica a alternativa específica',()=>{
  let count=0;
  game.QUESTIONS.forEach((q,i)=>{
    assert.ok(visual.HINTS[i].length>35);
    assert.ok(!visual.HINTS[i].includes(q.choices[q.correct]),'dica não pode repetir a alternativa correta');
    assert.equal(visual.CHOICE_NOTES[i].length,4);
    visual.CHOICE_NOTES[i].forEach((note,j)=>{
      assert.ok(note.length>35,'justificativa '+(i+1)+'/'+(j+1));
      assert.equal(game.evaluate(i,j).reason,note);
      assert.equal(game.evaluate(i,j).correct,j===q.correct);
      count++;
    });
  });
  assert.equal(count,36);
});

test('revisão traz a justificativa da alternativa marcada sem alterar a nota',()=>{
  const original = game.QUESTIONS.map(q=>q.correct);
  const answers = original.slice();
  answers[0]=(answers[0]+1)%4;
  answers[4]=(answers[4]+1)%4;
  const before = game.progress(answers);
  const review = game.reviewMistakes(answers);
  assert.deepEqual(review.map(x=>x.index),[1,5]);
  assert.equal(review[0].reason,visual.CHOICE_NOTES[0][answers[0]]);
  assert.equal(review[1].reason,visual.CHOICE_NOTES[4][answers[4]]);
  assert.deepEqual(game.progress(answers),before);
  assert.equal(game.progress(original).points,90);
});

test('chave e mapeamento do progresso anterior continuam estáveis',()=>{
  assert.equal(game.QUESTIONS.length,9);
  assert.deepEqual(game.QUESTIONS.map(q=>q.correct),[0,2,1,3,0,2,1,3,0]);
  const saved = {index:5, answers:[0,2,1,3,0]};
  assert.deepEqual(game.validateState(saved),saved);
  assert.equal(game.progress(saved.answers).points,50);
  assert.equal(game.progress(saved.answers).badges,1);
});
