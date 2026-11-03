import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const paths=[
 ['js/script.js','senha',2],
 ['js/filtros.js','senha',2],
 ['js/public-narration.js','password',1]
];

test('all public signup forms require at least twelve characters',()=>{
 for(const [path,,inputs] of paths){
  const source=read(path);
  assert.equal((source.match(/minlength="12"/g)||[]).length,inputs,path+': input minlength');
  assert.doesNotMatch(source,/minlength="(?:6|8)"/,path+': weak minlength');
 }
});

test('all public signup implementations verify length, case, digits and symbols',()=>{
 for(const [path,variable] of paths){
  const source=read(path);
  assert.match(source,new RegExp(variable+'\\.length\\s*>=\\s*12'),path+': length');
  for(const condition of ['/[a-z]/.test(','/[A-Z]/.test(','/\\d/.test(','/[^A-Za-z0-9]/.test(']){
    assert.ok(source.includes(condition+variable+')'),path+': missing '+condition);
  }
  assert.match(source,/Use pelo menos 12 caracteres/);
 }
});

test('narration checks password before sending CAPTCHA or signup request',()=>{
 const source=read('js/public-narration.js');
 const from=source.indexOf('form="signup"]').addEventListener("submit"');
 const end=source.indexOf('overlay._open=open;',from);
 assert.ok(from>=0&&end>from);
 const block=source.slice(from,end);
 assert.ok(block.indexOf('password.length>=12')>=0);
 assert.ok(block.indexOf('password.length>=12')<block.indexOf('await captchaToken()'));
 assert.ok(block.indexOf('await captchaToken()')<block.indexOf('c.auth.signUp('));
});

test('password recovery retains the same minimum and complexity',()=>{
 const source=read('js/redefinir-senha.js');
 assert.match(source,/senha\.length >= 12/);
 assert.match(source,/\/\[a-z\]\/\.test\(senha\)/);
 assert.match(source,/\/\[A-Z\]\/\.test\(senha\)/);
 assert.match(source,/\/\\d\/\.test\(senha\)/);
 assert.match(source,/\/\[\^A-Za-z0-9\]\/\.test\(senha\)/);
});

test('sensitive privileged functions retain explicit authorization guards',()=>{
 const diagnostics=read('supabase/migrations/20261101151000_admin_v2_campaign_cover_diagnostics.sql');
 const deletion=read('migracoes/2026-09-19-exclusao-conta-consentimentos.sql');
 assert.match(diagnostics,/auth\.uid\(\) IS NULL OR NOT public\.is_arquivo_sombrio_admin\(\)/i);
 assert.match(diagnostics,/REVOKE ALL ON FUNCTION public\.admin_v2_campaign_cover_diagnostics\(\) FROM PUBLIC,anon,authenticated/i);
 assert.match(deletion,/v_user_id uuid := auth\.uid\(\)/i);
 assert.match(deletion,/if v_user_id is null then raise exception/i);
 assert.match(deletion,/p_content_choice not in \('delete_all', 'review_for_anonymization'\)/);
 assert.match(deletion,/revoke all on function public\.request_account_deletion\(text\) from public, anon/i);
});
