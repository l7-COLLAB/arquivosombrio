import assert from "node:assert/strict";
import {resolveEditorialTransport} from "../admin-v2/js/editorial-transport-phase567.mjs";
assert.deepEqual(resolveEditorialTransport("https://arquivosombrio.net.br"),{mode:"supabase",functionName:"editorial-candidates"});
const alt=resolveEditorialTransport("https://arquivosombrio.net.br","/api/admin/editorial-candidates");
assert.equal(alt.mode,"same-origin-proxy");assert.equal(alt.enabled,false);assert.equal(alt.requiresServerAuthorization,true);
for(const bad of ["https://evil.example/p","//evil.example/p","/api/admin/other","/api/admin/editorial-candidates?x=1"]){
 assert.throws(()=>resolveEditorialTransport("https://arquivosombrio.net.br",bad));
}
console.log("Fase 5.67: alternativa same-origin inativa e sem URLs arbitrarias.");
