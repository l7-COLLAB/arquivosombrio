const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=path=>fs.readFileSync(path,'utf8');
const sql=read('supabase/migrations/20261104173837_atlas_reservar_notas_editoriais_e_incluir_especiais.sql');
const js=read('js/atlas-criminal.js');
const html=read('atlas.html');
test('RLS pública só permite visualizar localidades a pessoas anônimas',()=>{
 assert.match(sql,/drop policy if exists "Atlas apenas localidades publicadas"/);
 assert.match(sql,/for select to anon using/i);
 assert.match(sql,/for select to anon using\s*\(\s*reviewed and is_active/i);
 assert.match(sql,/revoke select on public\.case_atlas_locations from anon/i);
});
test('Notas e referências editoriais não são concedidas à API anônima',()=>{
 const privilege=sql.match(/grant select\s*\(([\s\S]*?)\)\s*on public\.case_atlas_locations to anon/i);
 assert.ok(privilege,'Faltou concessão por coluna para anon');
 assert.doesNotMatch(privilege[1],/review_note|review_reference|reviewed_at/i);
 assert.match(sql,/with\s*\(security_invoker\s*=\s*true\)/);
});
test('Casos especiais publicados agora participam do atlas',()=>{
 assert.match(sql,/create or replace view public\.case_atlas_public/);
 assert.doesNotMatch(sql,/not ilike 'especial%'/i);
 assert.match(sql,/g\.status_publicacao='publicado'/);
 assert.match(sql,/g\.publicado_em is null or g\.publicado_em<=now\(\)/);
});
test('Pesquisa textual recentraliza o mapa',()=>{
 assert.match(js,/fields\.search\.addEventListener\('input',\s*\(\)\s*=>\s*\{[\s\S]*?const matching = locationMatches\(\);[\s\S]*?fitItems\(matching\)/);
 assert.match(html,/\/js\/atlas-criminal\.js\?v=2/);
});
test('Não se expõem notas ou endereços pessoais no dataset público',()=>{
 assert.doesNotMatch(js,/review_note|review_reference|exact_address|navigator\.geolocation/);
 assert.match(js,/from\s*['"]?case_atlas_public|rest\/v1\/case_atlas_public/);
});