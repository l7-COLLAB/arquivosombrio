import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),"utf8"));
const audit=read("../docs/validacao-candidata-cronologias-fase5-39.json");
const candidate=read("../docs/versao-candidata-cronologias-fase5-38.json");
const proposals=read("../docs/propostas-correcao-editorial-fase5-37.json");
assert.equal(audit.fase,"5.39");
assert.equal(audit.workflow_regressao.conclusao,"success");
for(const field of ["homologacao_editorial_aprovada","publicacao_autorizada","gravacao_supabase_autorizada","merge_autorizado","deploy_autorizado"]) assert.equal(audit[field],false);
assert.equal(candidate.publicacao_autorizada,false);
assert.equal(candidate.gravacao_supabase_autorizada,false);
const entries=candidate.casos.flatMap(c=>c.acontecimentos.map(e=>({...e,id_caso:c.id_caso})));
assert.equal(entries.length,audit.escopo.acontecimentos);
assert.equal(entries.filter(x=>x.tipo==="marco_temporal").length,audit.escopo.marcos_temporais);
assert.equal(entries.filter(x=>x.alteracao_proposta).length,audit.escopo.redacoes_alternativas);
assert.equal(entries.filter(x=>x.tipo==="nota_de_situacao"&&!x.publicavel).length,audit.escopo.notas_bloqueadas);
for(const d of audit.decisoes){
 const e=entries.find(x=>x.id_caso===d.id_caso&&x.indice===d.indice);
 assert.ok(e);
 assert.equal(e.publicavel,false);
 assert.equal(e.aprovado,false);
 assert.ok(Array.isArray(d.condicoes)&&d.condicoes.length>0);
 const proposal=proposals.propostas.find(x=>x.id_caso===d.id_caso&&x.indice===d.indice);
 assert.ok(proposal);
 assert.equal(proposal.aplicado,false);
 assert.equal(proposal.aprovado,false);
}
console.log("Fase 5.39: regressao documentada; homologacao e publicacao bloqueadas.");
