import assert from "node:assert/strict";
import {handleEditorialCandidates} from "../supabase/functions/editorial-candidates/handler.mjs";
const items=[{id_caso:6,indice:11,original:"Original",proposta:"Candidata",fonte:"https://example.org",segredo:"nao_expor"}];
const request=(method,auth)=>new Request("https://example.org/editorial-candidates",{method,headers:auth?{authorization:auth}:{}});
const admin={id:"admin-1",app_metadata:{role:"admin"}};
const regular={id:"user-1",app_metadata:{role:"authenticated"}};
const cases=[
 ["anonimo",request("GET"),async()=>admin,401],
 ["sem_bearer",request("GET","token"),async()=>admin,401],
 ["token_invalido",request("GET","Bearer invalido"),async()=>null,401],
 ["auth_excecao",request("GET","Bearer erro"),async()=>{throw new Error("internal secret")},401],
 ["sem_id",request("GET","Bearer token"),async()=>({app_metadata:{role:"admin"}}),401],
 ["usuario_comum",request("GET","Bearer comum"),async()=>regular,403],
 ["metadata_usuario",request("GET","Bearer perfil"),async()=>({id:"u",user_metadata:{role:"admin"}}),403],
 ["sem_papel",request("GET","Bearer perfil"),async()=>({id:"u"}),403],
 ["post",request("POST","Bearer token"),async()=>admin,405],
 ["put",request("PUT","Bearer token"),async()=>admin,405],
 ["get_admin",request("GET","Bearer admin"),async()=>admin,200]
];
for(const [name,req,verify,expected] of cases){
 const response=await handleEditorialCandidates(req,verify,items);
 assert.equal(response.status,expected,name);
 assert.match(response.headers.get("cache-control")||"",/no-store/,name);
 assert.equal(response.headers.get("vary"),"Authorization",name);
 const body=await response.json();
 assert.equal(JSON.stringify(body).includes("internal secret"),false,name);
 if(expected===200){
  assert.equal(body.read_only,true);
  assert.equal(body.publication_allowed,false);
  assert.equal(body.items.length,1);
  assert.deepEqual(Object.keys(body.items[0]).sort(),["fonte","id_caso","indice","original","proposta"].sort());
 }else assert.equal("items" in body,false,name);
}
console.log("Fase 5.59: 11 cenarios negativos e positivos verificados sem acesso externo.");
