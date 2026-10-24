import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),"utf8"));
const report=read("../docs/parecer-homologacao-cronologias-fase5-40.json");
const previous=read("../docs/validacao-candidata-cronologias-fase5-39.json");
const candidate=read("../docs/versao-candidata-cronologias-fase5-38.json");
assert.equal(report.fase,"5.40");
assert.equal(report.verificacoes.total,6);
assert.equal(report.verificacoes.aprovadas,6);
assert.equal(report.decisao,"homologacao_tecnica_aprovada_editorial_nao_homologada");
assert.equal(report.itens.length,3);
for(const [name,value] of Object.entries(report.restricoes)) assert.equal(value,false,name);
assert.equal(previous.homologacao_editorial_aprovada,false);
assert.equal(candidate.publicacao_autorizada,false);
assert.equal(candidate.gravacao_supabase_autorizada,false);
assert.ok(report.itens.every(x=>x.estado!=="aprovado"));

// Salvaguardas posteriores: a Fase 5.41 não homologou as revisões editoriais.
const documentary=read("../docs/revisao-documental-cronologias-fase5-41.json");
assert.equal(documentary.estado,"revisao_documental_consolidada_sem_homologacao");
assert.equal(documentary.casos.length,3);
for(const item of documentary.casos){
  assert.equal(item.aprovado,false);
  assert.equal(item.aplicado,false);
}
assert.match(documentary.observacao,/não publicar nota sobre essa divergência sem comprovação específica/i);
const temporalNote=candidate.casos.find(c=>c.id_caso===5).acontecimentos.find(e=>e.indice===12);
assert.equal(temporalNote.tipo,"nota_de_situacao");
assert.equal(temporalNote.publicavel,false);
assert.equal(temporalNote.aprovado,false);
assert.equal(documentary.casos.find(e=>e.id_caso===5&&e.indice===12).redacao_sugerida,null);
console.log("Fase 5.40: parecer tecnico registrado; homologacao editorial e publicacao bloqueadas.");
