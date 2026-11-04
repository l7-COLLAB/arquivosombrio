import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const config=fs.readFileSync(new URL('../admin-v2/js/config.js',import.meta.url),'utf8');
const base=config.match(/SUPABASE_URL="([^"]+)"/)?.[1];
const publicKey=config.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)?.[1];
assert.ok(base?.startsWith('https://iuhotznurbyujzbyhizf.supabase.co'),'Project isolation: expected Arquivo Sombrio');
assert.ok(publicKey?.startsWith('sb_publishable_'),'Use only the public publishable key');

async function call(endpoint,{method='POST',payload=null,bearer=null,origin='https://arquivosombrio.net.br',apikey=true}={}){
 const headers={'Accept':'application/json','Origin':origin};
 if(apikey)headers.apikey=publicKey;
 if(bearer)headers.Authorization='Bearer '+bearer;
 if(payload!==null)headers['Content-Type']='application/json';
 const response=await fetch(base+endpoint,{method,headers,body:payload===null?undefined:JSON.stringify(payload),signal:AbortSignal.timeout(15000)});
 let data=null;
 try{data=await response.json()}catch{}
 return {status:response.status,data};
}

// All calls are read-only or deliberately rejected before any write.
// No accounts, OTPs, audio generation or email sends are attempted.
test('LIVE: API publica continua oferecendo dossiês publicados',async()=>{
 const r=await call('/rest/v1/Casos?select=id&limit=1',{method:'GET'});
 assert.equal(r.status,200);
 assert.ok(Array.isArray(r.data));
 assert.ok(r.data.length>=1);
});
test('LIVE: API anonima nao devolve rascunhos ou anotacoes privadas',async()=>{
 for(const table of ['admin_drafts','investigator_notes','lite_admin_sessions','studio_pair_codes']){
   const r=await call('/rest/v1/'+table+'?select=*&limit=1',{method:'GET'});
   assert.ok([200,401,403,404].includes(r.status),table+': unexpected HTTP '+r.status);
   if(r.status===200)assert.deepEqual(r.data,[],table+': unexpected private rows');
 }
});
test('LIVE: narracao publica nao gera playback sem login',async()=>{
 for(const bearer of [null,'invalid-or-expired-token']){
  const r=await call('/functions/v1/public-narration',{
    payload:{type:'dossie',id:'4',action:'chunk',index:0},bearer
  });
  assert.equal(r.status,401);
  assert.ok(!r.data?.url && !r.data?.signedUrl);
 }
});
test('LIVE: narracoes de novels negam token ausente ou invalido',async()=>{
 for(const bearer of [null,'invalid-or-expired-token']){
  const r=await call('/functions/v1/novel-narration',{
    payload:{capitulo_id:'00000000-0000-0000-0000-000000000004',action:'url'},bearer
  });
  assert.equal(r.status,401);
  assert.ok(!r.data?.url);
 }
});
test('LIVE: previa privada e servicos admin negam usuario anonimo',async()=>{
 const routes=[
  ['/functions/v1/arquivo-voz-private-preview',{type:'dossie',id:'4'}],
  ['/functions/v1/moneyprinter-access',{action:'mpt_get'}],
  ['/functions/v1/admin-secure-rpc',{action:'list'}]
 ];
 for(const [url,payload] of routes){
  const r=await call(url,{payload});
  assert.ok([401,403].includes(r.status),url+': expected deny, got '+r.status);
 }
});
test('LIVE: consulta publica de disponibilidade nao inclui URL assinada',async()=>{
 const r=await call('/functions/v1/public-narration',{payload:{type:'dossie',id:'4',action:'availability'}});
 assert.equal(r.status,200);
 assert.equal(typeof r.data?.available,'boolean');
 assert.deepEqual(Object.keys(r.data).sort(),['available']);
});
test('LIVE: endpoint de contribuicao rejeita origem nao autorizada antes de gravar',async()=>{
 const r=await call('/functions/v1/public-contribution-submit',{payload:{kind:'suggestion'},origin:'https://invalid.example'});
 assert.equal(r.status,403);
});


test('LIVE: importação manual e sincronização de capas não podem ser usadas sem sessão',async()=>{
 const routes=[
  ['/functions/v1/arquivo-voz-manual-import',{action:'init',content_type:'dossie',content_id:1}],
  ['/functions/v1/campaign-cover-github-sync',{theme:'teste',storagePath:'x/capa-teste-y.png'}]
 ];
 for(const [url,payload] of routes){
   for(const bearer of [null,'invalid-or-expired-token']){
     const r=await call(url,{payload,bearer});
     assert.ok([401,403].includes(r.status),url+': expected authentication denial, got '+r.status);
     assert.ok(!r.data?.upload_url && !r.data?.url && !r.data?.commit,url+': unexpected privileged output');
   }
 }
});
test('LIVE: solicitações de exclusão de conta e cron de narração não executam sem autorização',async()=>{
 const routes=[
  ['/functions/v1/delete-own-account',{content_choice:'delete_all'}],
  ['/functions/v1/narration-prewarm',{}]
 ];
 for(const [url,payload] of routes){
   const r=await call(url,{payload});
   assert.ok([401,403].includes(r.status),url+': unexpected HTTP '+r.status);
   assert.equal(r.data?.success,undefined,url+': no destructive action permitted');
 }
});
test('LIVE: Supabase Auth rejeita token inválido em endpoint de sessão',async()=>{
 const r=await call('/auth/v1/user',{method:'GET',bearer:'expired-or-revoked-token-simulator'});
 assert.ok([401,403].includes(r.status),'Invalid token must be denied (401/403), got '+r.status);
 assert.equal(r.data?.id,undefined);
});
