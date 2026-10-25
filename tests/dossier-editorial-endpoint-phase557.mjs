import assert from "node:assert/strict";
import {handleEditorialCandidates} from "../supabase/functions/editorial-candidates/handler.mjs";
const items=[{id_caso:6,indice:11,original:"A",proposta:"B",fonte:"https://example.org",extra_secret:"private"}];
const req=(method,token)=>new Request("https://example.org/editorial",{method,headers:token?{authorization:"Bearer "+token}:{}});
const verify=async(token)=>token==="admin"?{id:"1",app_metadata:{role:"admin"}}:token==="user"?{id:"2",app_metadata:{role:"user"}}:null;
for(const [request,code] of [[req("GET"),401],[req("GET","invalid"),401],[req("GET","user"),403],[req("POST","admin"),405],[req("GET","admin"),200]]){
 const response=await handleEditorialCandidates(request,verify,items);
 assert.equal(response.status,code);
 assert.match(response.headers.get("cache-control"),/no-store/);
 if(code===200){const payload=await response.json();assert.equal(payload.read_only,true);assert.equal(payload.publication_allowed,false);assert.equal(payload.items.length,1);assert.equal("extra_secret" in payload.items[0],false);}
}
assert.equal((await handleEditorialCandidates(req("GET","admin"),()=>{throw new Error("Auth offline")},items)).status,401);

for(const [request,code] of [[req("PUT","admin"),405],[req("DELETE","admin"),405],[req("GET",""),401]]){
 const response=await handleEditorialCandidates(request,verify,items);
 assert.equal(response.status,code);
 const payload=await response.json();
 assert.equal("items" in payload,false);
 assert.equal(JSON.stringify(payload).includes("private"),false);
}
for(const origin of ["https://arquivosombrio.net.br","https://site-nao-autorizado.example"]){
 const request=new Request("https://example.org/editorial",{headers:{authorization:"Bearer admin",origin}});
 const response=await handleEditorialCandidates(request,verify,items);
 assert.equal(response.status,200);
 assert.equal(response.headers.get("access-control-allow-origin"),origin==="https://arquivosombrio.net.br"?origin:null);
 assert.match(response.headers.get("cache-control"),/no-store/);
 const body=await response.json();
 assert.deepEqual(Object.keys(body.items[0]).sort(),["id_caso","indice","original","proposta","fonte"].sort());
}
const options=new Request("https://example.org/editorial",{method:"OPTIONS",headers:{origin:"https://arquivosombrio.net.br"}});
const preflight=await handleEditorialCandidates(options,verify,items);
assert.equal(preflight.status,204);
assert.equal(preflight.headers.get("access-control-allow-origin"),"https://arquivosombrio.net.br");
assert.equal(preflight.headers.get("access-control-allow-methods"),"GET, OPTIONS");
console.log("Fase 5.57: mock HTTP 401/403/405/200 e whitelist de campos OK; sem deploy.");
