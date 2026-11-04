const test = require('node:test');
const assert = require('node:assert/strict');
const {STAGES, QUESTIONS, validateState, evaluate, progress, reviewMistakes, recommendedReadings} = require('../js/pericia-trilha.js');

test('nove questões distribuídas em três etapas com alternativas válidas', () => {
  assert.equal(STAGES.length, 3);
  assert.equal(QUESTIONS.length, 9);
  for(let i=0; i<QUESTIONS.length; i++){
    const q=QUESTIONS[i];
    assert.equal(q.stage,Math.floor(i/3));
    assert.equal(q.choices.length,4);
    assert.equal(new Set(q.choices).size,4);
    assert.ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<=3);
    assert.ok(q.prompt.length>25);
    assert.ok(q.context.length>25);
    assert.ok(q.explanation.length>35);
    assert.ok(evaluate(i,q.correct).correct);
  }
});

test('todas as 36 opções são avaliadas consistentemente', () => {
  let n=0;
  QUESTIONS.forEach((q,i)=>{
    for(let choice=0;choice<4;choice++){
      const result=evaluate(i,choice);
      assert.equal(result.correct,choice===q.correct);
      assert.match(result.detail,/\.|;/);
      if(!result.correct) assert.match(result.detail,/melhor resposta/);
      n++;
    }
  });
  assert.equal(n,36);
});

test('os selos liberam a cada três respostas mesmo sem acertos', () => {
  for(let count=0;count<=9;count++){
    const answers=QUESTIONS.slice(0,count).map(q=>(q.correct+1)%4);
    const p=progress(answers);
    assert.equal(p.badges,Math.floor(count/3));
    assert.equal(p.correct,0);
    assert.equal(p.points,0);
    assert.equal(p.done,count);
    assert.equal(p.completed,count===9);
  }
});

test('pontuação máxima exige nove acertos e dá 90 pontos', () => {
  const answers=QUESTIONS.map(q=>q.correct);
  assert.deepEqual(progress(answers),{done:9,correct:9,points:90,badges:3,completed:true});
  const mixed=answers.slice();
  mixed[0]=(mixed[0]+1)%4;
  mixed[8]=(mixed[8]+1)%4;
  assert.deepEqual(progress(mixed),{done:9,correct:7,points:70,badges:3,completed:true});
});

test('salvamento só aceita estado linear válido; rejeita índices incorretos', () => {
  assert.deepEqual(validateState(null),{index:0,answers:[]});
  assert.deepEqual(validateState({index:2,answers:[0,2]}),{index:2,answers:[0,2]});
  assert.deepEqual(validateState({index:1,answers:[0,2]}),{index:1,answers:[0,2]});
  assert.deepEqual(validateState({index:9,answers:QUESTIONS.map(q=>q.correct)}),{index:9,answers:QUESTIONS.map(q=>q.correct)});
  for(const bad of [
    {index:0,answers:[0,1,2]},
    {index:-1,answers:[]},
    {index:10,answers:QUESTIONS.map(q=>q.correct)},
    {index:1,answers:[]},
    {index:0,answers:[9]},
    {index:0,answers:[1.1]},
    {index:0,answers:'a'},
    {index:8,answers:Array(10).fill(0)},
    {index:2,answers:[0]}
  ]) assert.deepEqual(validateState(bad),{index:0,answers:[]});
});

test('entradas fora do intervalo não são avaliadas',()=>{
  assert.equal(evaluate(-1,0),null);
  assert.equal(evaluate(9,0),null);
  assert.equal(evaluate(0,-1),null);
  assert.equal(evaluate(0,4),null);
  assert.equal(evaluate(0,1.5),null);
});

test('erros não se transformam em aprovação profissional',()=>{
  assert.equal(QUESTIONS.length,9);
  assert.match(QUESTIONS[3].explanation,/não provam/i);
  assert.match(QUESTIONS[5].explanation,/testes.*avaliação profissional/i);
  assert.match(QUESTIONS[7].explanation,/cadeia de custódia/i);
});


test('a revisão traz apenas erros e preserva as explicações corretas', () => {
  const answers = QUESTIONS.map(q => q.correct);
  assert.deepEqual(reviewMistakes(answers), []);
  answers[0] = (answers[0] + 1) % 4;
  answers[4] = (answers[4] + 1) % 4;
  const review = reviewMistakes(answers);
  assert.equal(review.length, 2);
  assert.deepEqual(review.map(x => x.index), [1, 5]);
  assert.equal(review[0].selected, QUESTIONS[0].choices[answers[0]]);
  assert.equal(review[0].correct, QUESTIONS[0].choices[QUESTIONS[0].correct]);
  assert.equal(review[1].explanation, QUESTIONS[4].explanation);
  assert.equal(progress(answers).points, 70);
  assert.equal(progress(answers).badges, 3);
  assert.equal(reviewMistakes(null).length, 0);
});

test('as sugestões priorizam etapas com mais erros e apontam a artigos do acervo', () => {
  const answers = QUESTIONS.map(q => q.correct);
  answers[3] = (answers[3]+1)%4;
  answers[4] = (answers[4]+1)%4;
  answers[5] = (answers[5]+1)%4;
  answers[8] = (answers[8]+1)%4;
  const links = recommendedReadings(answers);
  assert.deepEqual(links.map(x => x.stage), [1, 2]);
  assert.deepEqual(links.map(x => x.href), [
    'pericia.html?id=8#forense',
    'pericia.html?id=11#forense'
  ]);
  assert.deepEqual(recommendedReadings(QUESTIONS.map(q=>q.correct)).map(x=>x.stage), [0,1]);
  assert.equal(new Set(links.map(x => x.href)).size, links.length);
});

test('a revisão é informativa: não altera o resultado original', () => {
  const answers=QUESTIONS.map(q=>q.correct);
  answers[6]=(answers[6]+2)%4;
  const snapshot=JSON.stringify(answers);
  reviewMistakes(answers);
  recommendedReadings(answers);
  assert.equal(JSON.stringify(answers), snapshot);
  assert.deepEqual(progress(answers), {done:9,correct:8,points:80,badges:3,completed:true});
});
