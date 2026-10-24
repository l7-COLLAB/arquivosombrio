import assert from "node:assert/strict";
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
import {handleEditorialCandidates} from "../supabase/functions/editorial-candidates/handler.mjs";
const spec=JSON.parse(readFileSync(new URL("../docs/roteiro-homologacao-editorial-fase5-69.json",import.meta.url),"utf8"));
const data=[{id_caso:6,indice:11,original:"TESTE",proposta:"TESTE",fonte:"https://example.org"}];
const verify=async token=>token==="admin-test"?{id:"test-admin",app_metadata:{role:"admin"}}:token==="user-test"?{id:"test-user",app_metadata:{role:"user"}}:null;
const origin="https://arquivosombrio.net.br";
const cases=[
 ["sem_token",new Request("https://example.test",{method:"GET"}),401],
 ["token_invalido",new Request("https://example.test",{method:"GET",headers:{authorization:"Bearer bad"}}),401],
 ["usuario_comum",new Request("https://example.test",{method:"GET",headers:{authorization:"Bearer user-test"}}),403],
 ["admin",new Request("https://example.test",{method:"GET",headers:{authorization:"Bearer admin-test"}}),200],
 ["post_bloqueado",new Request("https://example.test",{method:"POST",headers:{authorization:"Bearer admin-test"}}),405],
 ["preflight_oficial",new Request("https://example.test",{method:"OPTIONS",headers:{origin}}),204],
 ["preflight_origem_nao_autorizada",new Request("https://example.test",{method:"OPTIONS",headers:{origin:"https://unknown.example"}}),204]
];
const results=[];
for(const [id,request,expected] of cases){
 const response=await handleEditorialCandidates(request,verify,data);
 assert.equal(response.status,expected,id);
 if(id==="preflight_oficial")assert.equal(response.headers.get("access-control-allow-origin"),origin);
 if(id==="preflight_origem_nao_autorizada")assert.equal(response.headers.get("access-control-allow-origin"),null);
 const body=response.status===204?null:await response.json();
 if(id==="admin"){assert.equal(body.read_only,true);assert.equal(body.publication_allowed,false);}
 else if(body)assert.equal("items" in body,false);
 results.push({id,result:"passed",http_status:response.status,environment:"local_mock"});
}
assert.deepEqual(results.map(x=>x.id),spec.casos.map(x=>x.id));
const evidence={fase:"5.70",execution:"local_mock_only",real_gateway_tested:false,real_auth_tested:false,production_changed:false,results};
mkdirSync("artifacts/editorial",{recursive:true});writeFileSync("artifacts/editorial/fase5-70-local.json",JSON.stringify(evidence,null,2)+"\n");
console.log("Fase 5.70: 7 cenarios locais validados; evidencia sem tokens registrada.");
