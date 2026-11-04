const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const source=fs.readFileSync(path.join(__dirname,'../admin-v2/js/auth.js'),'utf8');

function makeHarness({session=null,user=null,error=null}={}){
 let getUserCalls=0;
 const auth={
  getSession:async()=>({data:{session},error:null}),
  getUser:async()=>{getUserCalls++;return{data:{user},error}},
  signOut:async()=>({error:null})
 };
 const client={auth};
 const window={supabase:{createClient:()=>client}};
 const fnSource=source
  .replace(/^import\{[^\n]*\}from"\.\/config\.js";\s*/,'')
  .replace(/export /g,'');
 const module=new Function('window','SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY','ADMIN_STORAGE_KEY','ADMIN_ROLE',
   fnSource+'\nreturn {requireAdmin};');
 const {requireAdmin}=module(window,'https://example.supabase.co','sb_publishable_fixture','admin-fixture','admin');
 return {requireAdmin,callCount:()=>getUserCalls};
}

const localAdmin={user:{id:'admin-1',app_metadata:{role:'admin'}},access_token:'local-token'};
test('Admin V2: sessão local ausente não abre painel',async()=>{
 const h=makeHarness({});
 assert.equal(await h.requireAdmin(),null);
 assert.equal(h.callCount(),0);
});
test('Admin V2: sessão local de leitor não abre painel',async()=>{
 const h=makeHarness({session:{user:{id:'u',app_metadata:{role:'reader'}}}});
 assert.equal(await h.requireAdmin(),null);
 assert.equal(h.callCount(),0);
});
test('Admin V2: sessão admin local expirada ou revogada é recusada pelo servidor',async()=>{
 const h=makeHarness({session:localAdmin,user:null,error:{message:'Invalid token'}});
 assert.equal(await h.requireAdmin(),null);
 assert.equal(h.callCount(),1);
});
test('Admin V2: identidade e papel administrativos são revalidados remotamente',async()=>{
 for(const user of [
   {id:'admin-1',app_metadata:{role:'reader'}},
   {id:'different-user',app_metadata:{role:'admin'}},
   null
 ]){
   const h=makeHarness({session:localAdmin,user});
   assert.equal(await h.requireAdmin(),null);
 }
});
test('Admin V2: admin legítimo permanece autorizado',async()=>{
 const h=makeHarness({session:localAdmin,user:{id:'admin-1',app_metadata:{role:'admin'}}});
 assert.equal(await h.requireAdmin(),localAdmin);
 assert.equal(h.callCount(),1);
});
test('Admin V2: erro de rede não permite acesso por fallback local',async()=>{
 const h=makeHarness({session:localAdmin});
 assert.doesNotMatch(source,/return\s+.*session\s*\|\|/);
 assert.equal(await h.requireAdmin(),null);
});