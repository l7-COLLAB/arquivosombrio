const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=path=>fs.readFileSync(path,'utf8');
const html=read('admin-v2/atlas.html');
const js=read('admin-v2/js/atlas-admin.js');
const sql=read('sql/atlas-admin-curadoria-e-localidades-20261104.sql');
test('Página administrativa não é indexável e possui campos de curadoria',()=>{
 assert.match(html,/name="robots" content="noindex,nofollow,noarchive"/);
 for (const id of ['restricted','workspace','status','location-form','source-type','source-id','country','state-region','city',
  'neighborhood','event-year','precision','reference','latitude','longitude','review-note','geocode','geocode-results',
  'publish','save-draft','deactivate','location-list','unmapped-list','open-map']) {
   assert.ok(html.includes('id="'+id+'"'), 'Campo ausente: '+id);
 }
});
test('Menu administrativo aponta para a curadoria geográfica',()=>{
 assert.match(read('admin-v2/index.html'),/href="\.\/atlas\.html"/);
 assert.match(html,/href="\.\.\/atlas\.html"/);
});
test('A autorização depende de identidade administrativa e de RLS',()=>{
 assert.match(js,/db\.auth\.getUser\(\)/);
 assert.match(js,/app_metadata\?\.role!=='admin'/);
 assert.match(js,/db\.from\('case_atlas_locations'\)/);
 assert.doesNotMatch(js,/service_role|SUPABASE_SERVICE_ROLE|localStorage\.getItem\('is_admin'\)/i);
 assert.match(sql,/for insert to authenticated with check \(\(select public\.is_arquivo_sombrio_admin\(\)\)\)/);
 assert.match(sql,/for update to authenticated/);
 assert.doesNotMatch(sql,/grant\s+delete\s+on\s+public\.case_atlas_locations\s+to\s+authenticated/i);
});
test('Salvar desativa publicação e publicar exige uma ação distinta',()=>{
 assert.match(js,/reviewed:false,is_active:false,reviewed_at:null/);
 assert.match(js,/!selectedId\|\|dirty/);
 assert.match(js,/window\.confirm\(message\)/);
 assert.match(js,/reviewed:true,is_active:true,reviewed_at:now/);
 assert.match(sql,/atlas_active_requires_review/);
 assert.match(sql,/atlas_review_requires_reference/);
});
test('Exibição considera o catálogo público, sem confundir com simples aprovação',()=>{
 assert.match(js,/from\('case_atlas_public'\)/);
 assert.match(js,/visibleSourceIds/);
 assert.match(js,/APROVADO · NÃO EXIBIDO/);
});
test('Geocodificação não é automática e requer escolha do editor',()=>{
 assert.match(js,/addEventListener\('click',geocode\)/);
 assert.match(js,/geocodeResults/);
 assert.match(js,/addEventListener\('click',useGeocode\)/);
 assert.match(html,/centro da cidade ou região/);
});
test('Não há dados de endereço individual nem rastreamento do visitante',()=>{
 assert.doesNotMatch(js,/navigator\.geolocation|watchPosition|getCurrentPosition|service_role/);
 assert.match(html,/nunca a residência de vítimas/);
});