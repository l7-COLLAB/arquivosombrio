import {handleEditorialCandidates} from "../supabase/functions/editorial-candidates/handler.mjs";
import assert from "node:assert/strict";import {readFileSync} from "node:fs";
const p=JSON.parse(readFileSync(new URL("../docs/contrato-acesso-editorial-fase5-56.json",import.meta.url),"utf8"));
assert.equal(p.fase,"5.56");
assert.equal(p.regressao_fase555.aprovados,6);
assert.equal(p.requisitos.falhas.sem_token,401);
assert.equal(p.requisitos.falhas.sem_permissao,403);
assert.deepEqual(p.requisitos.operacoes_permitidas,["leitura"]);
assert.equal(p.situacao_atual.pagina_estatica_publica,true);
assert.equal(p.situacao_atual.endpoint_protegido_implantado,false);
assert.equal(p.situacao_atual.testes_de_acesso_reais_executados,false);
for(const v of Object.values(p.bloqueios))assert.equal(v,false);
console.log("Fase 5.56: contrato registrado; endpoint nao implantado e acesso real nao validado.");

// O contrato e a implementação devem produzir o mesmo código HTTP.
const candidate=[{id_caso:6,indice:11,original:"Texto original",proposta:"Texto candidato",fonte:"https://example.org",segredo:"nao_expor"}];
const request=(auth)=>new Request("https://example.org/editorial-candidates",{headers:auth?{authorization:auth}:{}});
const cases=[
 [request(),async()=>({id:"u",app_metadata:{role:"admin"}}),p.requisitos.falhas.sem_token],
 [request("Bearer ruim"),async()=>{throw Error("Falha de autenticacao")},p.requisitos.falhas.erro_de_validacao_identidade],
 [request("Bearer comum"),async()=>({id:"u",app_metadata:{role:"user"}}),p.requisitos.falhas.sem_permissao],
 [request("Bearer admin"),async()=>({id:"a",app_metadata:{role:"admin"}}),200]
];
for(const [req,verify,expected] of cases){
 const response=await handleEditorialCandidates(req,verify,candidate);
 assert.equal(response.status,expected);
 assert.match(response.headers.get("cache-control"),/no-store/);
 const body=await response.json();
 if(expected===200){assert.equal(body.publication_allowed,false);assert.equal(body.read_only,true);assert.equal("segredo" in body.items[0],false);}
 else assert.equal("items" in body,false);
}
assert.equal(p.situacao_atual.endpoint_protegido_implementado_no_repositorio,true);
assert.equal(p.situacao_atual.endpoint_protegido_implantado,false);
