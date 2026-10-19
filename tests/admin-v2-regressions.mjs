import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(import.meta.dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const page = read('admin-v2/index.html');
const nav = read('admin-v2/js/easy-navigation.js');
const assist = read('admin-v2/js/content-assist.js');
const legacyHub = read('admin-v2/legacy/js/admin-dashboard.js');
const legacyEditor = read('admin-v2/legacy/js/script.js');

test('scripts do painel são sintaticamente válidos', () => {
  for (const [file, code] of [
    ['easy-navigation.js', nav],
    ['content-assist.js', assist],
    ['admin-dashboard.js', legacyHub],
    ['legacy/script.js', legacyEditor],
  ]) {
    assert.doesNotThrow(() => new vm.Script(code, { filename: file }));
  }
});

test('acesso administrativo é verificado antes de montar os módulos', () => {
  const auth = page.indexOf('obterSessaoAdminIsolada()');
  const role = page.indexOf('arquivo-admin-verified-at');
  const mount = page.indexOf('await abrirPainelAdmin(sessao)');
  const navLoad = page.indexOf('await load("a busca de funções"');
  const contentLoad = page.indexOf('await load("o guia do editor');
  assert.ok(auth >= 0 && role > auth && mount > role);
  assert.ok(navLoad > mount && contentLoad > navLoad);
  assert.match(legacyHub, /app_metadata\?\.role\s*!==\s*"admin"/);
});

test('navegação tem saída segura sem alterar operações de edição', () => {
  assert.match(page, /easy-navigation\.css\?v=1/);
  assert.match(page, /content-assist\.css\?v=1/);
  assert.match(nav, /dataset\.easyNavReady/);
  assert.match(nav, /data-admin-hub-view/);
  assert.match(nav, /function update\(\)/);
  assert.match(nav, /keydown/);
  assert.match(assist, /dataset\.contentToolsReady/);
  assert.match(assist, /admin-content-search/);
  assert.match(assist, /admin-content-order/);
  assert.match(assist, /admin-content-tracking/);
  assert.doesNotMatch(nav + assist, /\.functions\.invoke\s*\(|\.from\s*\(\s*['"]/);
});

test('editor mantém ações originais e suas categorias', () => {
  for (const token of [
    'data-admin-tab="dossies"',
    'data-admin-tab="diarios"',
    'data-admin-tab="pericias"',
    'id="admin-content-search"',
    'id="admin-content-order"',
    'data-admin-create="dossies"',
    'data-admin-create="pericias"',
    'status_publicacao',
  ]) assert.ok(legacyEditor.includes(token), 'Ausente: ' + token);
  assert.match(assist, /Rascunho: ainda não publicado/);
  assert.match(assist, /ausência de etiqueta não comprova publicação/);
});

test('modo de manutenção está desativado e novels não são importadas pela UI de QA', () => {
  const workflow = read('.github/workflows/deploy-pages.yml');
  assert.match(workflow, /MAINTENANCE_MODE: 'false'/);
  assert.doesNotMatch(page, /\.\.\/css\/novels\.css/);
  assert.doesNotMatch(nav + assist, /novels\.html/);
});
