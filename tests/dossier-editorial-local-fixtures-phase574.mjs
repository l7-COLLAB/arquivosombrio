import assert from "node:assert/strict";
import {handleEditorialCandidates} from "../supabase/functions/editorial-candidates/handler.mjs";
const fixtures=Object.freeze({
 admin:Object.freeze({id:"local-admin",app_metadata:{role:"admin"}}),
 user:Object.freeze({id:"local-user",app_metadata:{role:"user"}}),
 items:Object.freeze([{id_caso:999,indice:0,original:"Registro demonstrativo",proposta:"Redacao demonstrativa",fonte:"https://example.org/fixture"}])
});
const run=(token)=>handleEditorialCandidates(new Request("http://localhost/functions/v1/editorial-candidates",{headers:token?{authorization:"Bearer "+token}:{}}),async(t)=>t==="fixture-admin"?fixtures.admin:t==="fixture-user"?fixtures.user:null,fixtures.items);
assert.equal((await run(null)).status,401);
assert.equal((await run("fixture-user")).status,403);
const result=await run("fixture-admin");assert.equal(result.status,200);
const body=await result.json();assert.equal(body.items[0].id_caso,999);assert.equal(body.publication_allowed,false);
console.log("Fase 5.74: fixtures sem dados reais e bloqueio de publicacao confirmados.");
