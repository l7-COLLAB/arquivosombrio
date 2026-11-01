const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {stripTypeScriptTypes}=require('node:module');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const source=name=>read('supabase/functions/'+name+'/index.ts');

function harness(name,{limited=false}={}){
  let handler;const inserts=[],signs=[],limits=[];
  const env={SUPABASE_URL:'https://project.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-service-key',R2_ENDPOINT:'https://test.r2.cloudflarestorage.com',R2_ACCESS_KEY_ID:'test-access',R2_SECRET_ACCESS_KEY:'test-secret',R2_BUCKET:'test-bucket'};
  const db={auth:{getUser:async token=>token==='valid-user'?{data:{user:{id:'verified-user'}},error:null}:{data:{user:null},error:{message:'Invalid token'}}},
    rpc:async(name,values)=>{limits.push({name,values});return {data:limited?false:true,error:null}},
    from:table=>{
      const chain={};
      for(const method of ['select','eq','or','order','not','limit'])chain[method]=()=>chain;
      chain.maybeSingle=async()=>({data:{id:4,updated_at:'2026-10-01T00:00:00Z',status_publicacao:'publicado'},error:null});
      chain.then=(resolve,reject)=>Promise.resolve({data:table==='arquivo_voz_cloud_jobs'?[{id:'test-job',audio_path:'audio/file.mp3'}]:[],error:null}).then(resolve,reject);
      chain.insert=async row=>{inserts.push({table,row});return {error:null}};
      return chain;
    }};
  class AwsClient{async sign(request){signs.push(request.url);return {url:request.url+'&X-Amz-Signature=test'}}}
  const code=stripTypeScriptTypes(source(name).replace(/^import .*;\s*$/gm,''));
  new Function('Deno','createClient','AwsClient',code)({env:{get:key=>env[key]},serve:fn=>{handler=fn}},()=>db,AwsClient);
  return {handler,inserts,signs,limits};
}
const request=(body,token,origin='https://arquivosombrio.net.br')=>new Request('https://project.supabase.co/functions/v1/public-contribution-submit',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});

test('all changed Edge Functions have valid TypeScript syntax',()=>{
  for(const name of ['lite-approved-audio','public-narration','novel-narration','arquivo-voz-private-preview','arquivo-voz-manual-import','public-contribution-submit'])assert.doesNotThrow(()=>stripTypeScriptTypes(source(name)));
});
test('Lite playback denies missing and invalid sessions without issuing a signed URL',async()=>{
  for(const token of [null,'invalid-token']){
    const h=harness('lite-approved-audio');
    const r=await h.handler(new Request('https://project.supabase.co/audio?type=dossie&id=4',{headers:token?{Authorization:'Bearer '+token}:{}}));
    assert.equal(r.status,401);assert.equal(h.signs.length,0);
  }
});
test('Lite availability never returns a playback URL',async()=>{
  const h=harness('lite-approved-audio');const r=await h.handler(new Request('https://project.supabase.co/audio?type=dossie&id=4&check=1'));
  assert.deepEqual(await r.json(),{available:true,engine:'kokoro',source:'approved'});assert.equal(h.signs.length,0);
});
test('verified Lite user receives a signed URL expiring in 600 seconds',async()=>{
  const h=harness('lite-approved-audio');const r=await h.handler(new Request('https://project.supabase.co/audio?type=dossie&id=4&format=json',{headers:{Authorization:'Bearer valid-user'}}));
  assert.equal(r.status,200);const body=await r.json();assert.equal(new URL(body.url).searchParams.get('X-Amz-Expires'),'600');assert.equal(body.expires_in,600);assert.equal(r.headers.get('cache-control'),'no-store');
});
test('limited Lite user cannot obtain a signed URL',async()=>{
  const h=harness('lite-approved-audio',{limited:true});const r=await h.handler(new Request('https://project.supabase.co/audio?type=dossie&id=4',{headers:{Authorization:'Bearer valid-user'}}));
  assert.equal(r.status,429);assert.equal(h.signs.length,0);
});
test('contribution endpoint validates inputs, rejects unapproved origins and invalid tokens',async()=>{
  for(const [body,token,origin,status] of [[{kind:'suggestion'},null,undefined,400],[{kind:'audio_metric',event_type:'forged'},null,undefined,400],[{kind:'suggestion',name:'Visitor',title:'Case suggestion'},'invalid-token',undefined,401],[{},null,'https://other.example',403]]){
    const h=harness('public-contribution-submit');assert.equal((await h.handler(request(body,token,origin))).status,status);assert.equal(h.inserts.length,0);
  }
});
test('suggestions use a verified identity and never accept caller moderation fields',async()=>{
  const h=harness('public-contribution-submit');const r=await h.handler(request({kind:'suggestion',name:'Visitor',title:'Case suggestion',description:'Details',user_id:'someone-else',status:'approved'},'valid-user'));
  assert.equal(r.status,200);assert.equal(h.inserts[0].row.user_id,'verified-user');assert.equal(h.inserts[0].row.status,'nova');assert.equal(h.limits.length,2);
});
test('rate-limited contributions do not write and metric metadata is allowlisted',async()=>{
  const body={kind:'audio_metric',event_type:'audio_click',content_type:'dossie',content_id:4,metadata:{index:1,secret:'must-not-be-stored'}};
  const limited=harness('public-contribution-submit',{limited:true});assert.equal((await limited.handler(request(body))).status,429);assert.equal(limited.inserts.length,0);
  const allowed=harness('public-contribution-submit');assert.equal((await allowed.handler(request(body))).status,200);assert.deepEqual(allowed.inserts[0].row.metadata,{index:1});assert.equal(allowed.inserts[0].row.user_id,null);
});
test('Lite refresh job reapplies the hardening and user-controlled names use textContent',()=>{
  const lite=read('lite-preview/lite.js');assert.ok(!lite.includes('innerHTML=authName(user)'));assert.ok(lite.includes('session.access_token'));assert.ok(read('.github/workflows/lite-publish-preview.yml').includes('scripts/harden-lite.py lite-preview/lite.js'));
});
