import {handleEditorialCandidates} from "../supabase/functions/editorial-candidates/handler.mjs";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
const editorial=read("../admin-v2/editorial.html");
const record=read("../admin-v2/js/editorial-record.js");
const preview=read("../previews/revisao-editorial-fase5-50.html");
const workflow=read("../admin-v2/js/editorial-review-workflow.js");
assert.match(editorial,/<div id="app" hidden>/);
assert.ok(editorial.indexOf('id="editorial-preview-entry"')>editorial.indexOf('<div id="app" hidden>'));
assert.match(editorial,/admin-auth\.js/);
assert.match(record,/obterSessaoAdminIsolada|obterClienteAdminIsolado/);
assert.doesNotMatch(preview,/<button\b|<form\b/i);
assert.doesNotMatch(preview,/supabase\.from\s*\(|fetch\s*\(|localStorage/i);
assert.match(workflow,/publicacao_autorizada:false/);
console.log("Fase 5.55: verificacoes estaticas de isolamento aprovadas; controle servidor nao testado.");

// Verifica a fronteira real do handler, além dos sinais visuais de autenticação.
const candidates=[{id_caso:6,indice:11,original:"Original ficticio",proposta:"Proposta ficticia",fonte:"https://example.org",segredo:"nao_expor"}];
const request=(authorization)=>new Request("https://example.org/editorial-candidates",{headers:authorization?{authorization}:{}});
const admin={id:"admin-teste",app_metadata:{role:"admin"}};
const normal={id:"usuario-teste",app_metadata:{role:"user"}};
const cases=[
 [request(),async()=>admin,401],
 [request("Bearer token"),async()=>normal,403],
 [request("Bearer token"),async()=>admin,200]
];
for(const [req,verify,expected] of cases){
 const response=await handleEditorialCandidates(req,verify,candidates);
 assert.equal(response.status,expected);
 assert.match(response.headers.get("cache-control"),/no-store/);
 const body=await response.json();
 assert.equal("items" in body,expected===200);
 if(expected===200){assert.equal(body.read_only,true);assert.equal(body.publication_allowed,false);assert.equal("segredo" in body.items[0],false);}
}
