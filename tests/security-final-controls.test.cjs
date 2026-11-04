const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {stripTypeScriptTypes}=require('node:module');

const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const config=read('supabase/config.toml');
const manual=read('supabase/functions/arquivo-voz-manual-import/index.ts');
const prewarm=read('supabase/functions/narration-prewarm/index.ts');
const sync=read('supabase/functions/campaign-cover-github-sync/index.ts');
const deletion=read('supabase/functions/delete-own-account/index.ts');

test('config de importação coincide com gateway ativo e exige autorização dentro do handler',()=>{
 assert.match(config,/\[functions\.arquivo-voz-manual-import\]\s*\nverify_jwt = false/);
 assert.match(manual,/auth\.getUser\(\)/);
 assert.match(manual,/userClient\.rpc\("is_arquivo_sombrio_admin"\)/);
 assert.match(manual,/if\(ue\|\|!user\)return respond\(\{error:"Sessão inválida"\},401\)/);
 assert.match(manual,/if\(ae\|\|isAdmin!==true\)return respond\(\{error:"Somente administradores"\},403\)/);
 assert.ok(manual.indexOf('auth.getUser()')<manual.indexOf('const service=createClient('));
});

test('erros de funções operacionais não vazam e.message para resposta HTTP',()=>{
 assert.match(prewarm,/console\.error\(e\)/);
 assert.match(prewarm,/return json\(\{error:"Não foi possível concluir a pré-geração\."\},500\)/);
 assert.doesNotMatch(prewarm,/return json\(\{error:e instanceof Error\?e\.message/);
 assert.match(sync,/console\.error\("Campaign cover GitHub sync failed",e\)/);
 assert.match(sync,/return reply\(\{error:"Falha ao sincronizar a capa\.",code:"SYNC_FAILED"\},500\)/);
 assert.doesNotMatch(sync,/return reply\(\{error:String\(e instanceof Error/);
 assert.doesNotMatch(sync,/detail:String\(e\.message/);
});

test('funções Deno alteradas são sintaticamente válidas após remover tipos TS',()=>{
 for(const src of [prewarm,sync]){
  const stripped=stripTypeScriptTypes(src,{mode:'strip'});
  // Dynamic code parsing ONLY: do not execute imports or network calls.
  assert.doesNotThrow(()=>new Function(stripped.replace(/^import[^\n]*\n/gm,'')));
 }
});

function harness({id='f7777777-0000-4000-8000-000000000001',choice='delete_all',missingUser=false,
                   cleanupError=false,deleteError=false,finalUpdateError=false}={}){
 const calls={deleteUser:[],storageBuckets:[],phases:[],rpc:[]};
 let handler;
 const withSupabase=(options,fn)=>{assert.equal(options.auth,'user');return fn};
 const Deno={serve:fn=>{handler=fn}};
 const stripped=stripTypeScriptTypes(deletion.replace(/^import \{ withSupabase \} from "npm:@supabase\/server";\s*/,''));
 new Function('Deno','withSupabase',stripped)(Deno,withSupabase);
 const chain={
  eq(){return this},
  then(resolve){resolve({error:null})}
 };
 const supabase={
  rpc:async(name,payload)=>{calls.rpc.push({name,payload});return{data:'request-1',error:null}}
 };
 const admin={
  from(name){
   assert.equal(name,'account_deletion_requests');
   return {update(data){calls.phases.push(data);return {
     eq(){return this},
     then(resolve){
      const isFinal=Object.prototype.hasOwnProperty.call(data,'completed_at');
      resolve({error:isFinal&&finalUpdateError?{message:'mock update fail'}:null});
     }
   }}};
  },
  storage:{
   from(bucket){
     calls.storageBuckets.push(bucket);
     return {
       list:async()=>cleanupError?{data:null,error:{message:'mock storage broken'}}:{data:[],error:null},
       remove:async()=>({error:null})
     };
   }
  },
  auth:{admin:{deleteUser:async uid=>{calls.deleteUser.push(uid);return {error:deleteError?{message:'mock auth delete fail'}:null}}}}
 };
 const ctx={userClaims:missingUser?null:{id},supabase,supabaseAdmin:admin};
 const run=async()=> {
  const req=new Request('https://test.invalid/functions/v1/delete-own-account',
    {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({content_choice:choice})});
  const response=await handler(req,ctx);
  return {status:response.status,data:await response.json(),calls};
 };
 return {run,id};
}

test('exclusão com opção delete_all invoca somente deleção da identidade validada e seus diretórios',async()=>{
 const h=harness();
 const {status,data,calls}=await h.run();
 assert.equal(status,200);
 assert.equal(data.success,true);
 assert.equal(data.content_choice,'delete_all');
 assert.deepEqual(calls.deleteUser,[h.id]);
 assert.deepEqual(calls.storageBuckets,['avatars','mural-private']);
 assert.deepEqual(calls.rpc,[{name:'request_account_deletion',payload:{p_content_choice:'delete_all'}}]);
 assert.ok(calls.phases.some(x=>x.status==='completed'));
});

test('revisão para anonimização conserva requisição sob revisão',async()=>{
 const h=harness({choice:'review_for_anonymization'});
 const r=await h.run();
 assert.equal(r.status,200);
 assert.equal(r.data.success,true);
 assert.ok(r.calls.phases.some(p=>p.status==='under_review'));
});

test('identidade ausente e opção inválida falham sem exclusão de usuário',async()=>{
 for(const opts of [{missingUser:true},{choice:'not-valid'}]){
  const {status,calls}=await harness(opts).run();
  assert.ok([400,401].includes(status));
  assert.equal(calls.deleteUser.length,0);
  assert.equal(calls.rpc.length,0);
 }
});

test('falha no Storage evita exclusão da conta e permite reprocessar',async()=>{
 const r=await harness({cleanupError:true}).run();
 assert.equal(r.status,503);
 assert.equal(r.data.retryable,true);
 assert.equal(r.calls.deleteUser.length,0);
});

test('falha ao excluir Auth mantém solicitação e retorna possibilidade de nova tentativa',async()=>{
 const r=await harness({deleteError:true}).run();
 assert.equal(r.status,500);
 assert.equal(r.data.retryable,true);
 assert.equal(r.calls.deleteUser.length,1);
});

test('falha no registro final após remover Auth sinaliza necessidade de reconciliação',async()=>{
 const r=await harness({finalUpdateError:true}).run();
 assert.equal(r.status,200);
 assert.equal(r.data.reconciliation_required,true);
 assert.equal(r.calls.deleteUser.length,1);
});
