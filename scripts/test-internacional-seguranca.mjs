#!/usr/bin/env node
/**
 * Fase 6.11 — regressão estática da internacionalização.
 * Executar na raiz: node --test scripts/test-internacional-seguranca.mjs
 * NÃO substitui testes PostgreSQL com tokens reais.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const sql = read('sql/internacional/fase-6-8-rascunhos-seguros.sql');
const ui = read('admin-v2/internacional/index.html');
const config = JSON.parse(read('i18n/config-internacional.json'));
const registry = JSON.parse(read('i18n/registro-conteudos.json'));

test('schema tem segurança de linhas nas duas tabelas', () => {
  assert.match(sql, /alter table public\.international_content_versions enable row level security;/i);
  assert.match(sql, /alter table public\.international_content_audit enable row level security;/i);
  assert.match(sql, /revoke all on public\.international_content_versions from public,anon,authenticated;/i);
  assert.match(sql, /revoke all on public\.international_content_audit from public,anon,authenticated;/i);
});
test('nenhum grant de escrita direta a authenticated e anon', () => {
  assert.doesNotMatch(sql, /grant\s+(?:all|insert|update|delete)[\s\S]{0,100}\s+to\s+(?:anon|authenticated)\s*;/i);
  assert.match(sql, /grant select on public\.international_content_versions to authenticated;/i);
});
test('RPCs verificam admin e sessao e restringem EXECUTE', () => {
  const marker = /if v_uid is null or not public\.is_arquivo_sombrio_admin\(\)/g;
  assert.equal([...sql.matchAll(marker)].length, 2);
  assert.equal([...sql.matchAll(/from auth\.sessions ses/g)].length, 2);
  assert.match(sql, /revoke all on function public\.international_save_draft\(/);
  assert.match(sql, /revoke all on function public\.international_submit_review\(/);
});
test('nao existem operacoes de aprovacao nem publicacao', () => {
  assert.match(sql, /editorial_status in \('draft','in_review'\)/);
  assert.doesNotMatch(sql, /create or replace function public\.international_(?:publish|approve)/);
  assert.equal(config.productionRoutesEnabled, false);
  assert.equal(registry.publicIndexEnabled, false);
});
test('revisoes e auditoria sao obrigatorias no fluxo RPC', () => {
  assert.match(sql, /p_expected_revision/);
  assert.match(sql, /revision conflict/);
  assert.match(sql, /source updated; manual reconciliation required/);
  assert.match(sql, /international_content_audit/);
  assert.match(sql, /for share;/);
  assert.match(sql, /for update;/);
});
test('admin V2 nao emite requisicoes de escrita', () => {
  assert.match(ui, /id="draft-editor"/);
  assert.match(ui, /id="preview-local"/);
  assert.equal((ui.match(/disabled aria-disabled="true"/g) || []).length, 2);
  assert.doesNotMatch(ui, /\.rpc\s*\(/);
  assert.doesNotMatch(ui, /\.(?:insert|update|delete|upsert)\s*\(/);
});
test('idiomas e registro continuam sem publicacao', () => {
  assert.deepEqual(config.locales.map((x) => x.code), ['pt-BR','en-US','es-ES','fr-FR']);
  for (const item of registry.items) for (const tr of Object.values(item.translations)) {
    assert.equal(tr.status, 'not_started');
    assert.equal(tr.contentPath, null);
  }
});
