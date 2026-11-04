// Execute com: node --test tests/laboratorio-forense.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const lab = require('../js/laboratorio-forense.js');

test('todos os oito grupos sanguíneos são oferecidos', () => {
  assert.equal(lab.GROUPS.length, 8);
  assert.equal(new Set(lab.GROUPS).size, 8);
});

test('matriz completa de compatibilidade básica de hemácias', () => {
  const expected = {
    'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    'O+': ['O+', 'A+', 'B+', 'AB+'],
    'A-': ['A-', 'A+', 'AB-', 'AB+'],
    'A+': ['A+', 'AB+'],
    'B-': ['B-', 'B+', 'AB-', 'AB+'],
    'B+': ['B+', 'AB+'],
    'AB-': ['AB-', 'AB+'],
    'AB+': ['AB+']
  };
  let matches = 0;
  for (const donor of lab.GROUPS) {
    for (const recipient of lab.GROUPS) {
      const result = lab.redCellsCompatible(donor, recipient);
      assert.equal(result, expected[donor].includes(recipient), donor + ' -> ' + recipient);
      matches += Number(result);
    }
  }
  assert.equal(matches, 27);
});

test('hemácias e comparação forense têm regras e mensagens distintas', () => {
  const same = lab.compareForensic('A+', 'A+');
  assert.equal(same.status, 'positive');
  assert.match(same.detail, /não prova/i);
  assert.equal(lab.compareForensic('A+', 'O+').status, 'negative');
  assert.equal(lab.redCellsCompatible('O-', 'AB+'), true);
  assert.equal(lab.redCellsCompatible('AB+', 'O-'), false);
  assert.equal(lab.compareTransfusion('O-', 'AB+').status, 'positive');
  assert.match(lab.compareTransfusion('O-', 'AB+').detail, /não autoriza/i);
});

test('entradas ausentes e inválidas não criam conclusões', () => {
  assert.equal(lab.redCellsCompatible('A+', ''), null);
  assert.equal(lab.redCellsCompatible('A', 'O+'), null);
  assert.equal(lab.compareForensic('', 'A+').status, 'neutral');
  assert.equal(lab.compareTransfusion('O-', '').status, 'neutral');
  assert.equal(lab.assessScene('gotas', '').status, 'neutral');
});

test('cada padrão visual tem hipótese didática e alertas', () => {
  for (const scene of lab.SCENES) {
    const ok = lab.assessScene(scene, scene);
    assert.equal(ok.status, 'positive');
    assert.match(ok.detail, /não|sem/i);
    const alternative = lab.SCENES.find(x => x !== scene);
    const wrong = lab.assessScene(scene, alternative);
    assert.equal(wrong.status, 'negative');
    assert.match(wrong.detail, /não permite descartar/i);
  }
});
