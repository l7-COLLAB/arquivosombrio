import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),"utf8"));
const doc=read("../docs/revisao-documental-cronologias-fase5-41.json");
const candidate=read("../docs/versao-candidata-cronologias-fase5-38.json");
assert.equal(doc.fase,"5.41");
assert.equal(doc.checagem_workflows_fase540.aprovados,6);
assert.equal(doc.casos.length,3);
for(const [key,val] of Object.entries(doc.restricoes)) assert.equal(val,false,key);
for(const item of doc.casos){const c=candidate.casos.find(x=>x.id_caso===item.id_caso);assert.ok(c);const entry=c.acontecimentos.find(x=>x.indice===item.indice);assert.ok(entry);assert.equal(entry.aprovado,false);assert.equal(entry.publicavel,false);assert.equal(item.aplicado,false);assert.equal(item.aprovado,false);}
assert.equal(doc.casos.find(x=>x.indice===12).redacao_sugerida,null);

const check=doc.verificacao_adicional_2026_10_24;
assert.equal(check.natureza,"checagem_independente_de_fontes_sem_aprovacao_editorial");
assert.equal(check.fontes_consultadas.length,3);
assert.ok(check.fontes_consultadas.every(s=>s.aprovado===false && s.url.startsWith("https://")));
assert.ok(check.fontes_consultadas.some(s=>s.id_caso===6&&s.indice===11&&s.grau==="divergencia_nao_comprovada_nesta_fonte"));
assert.ok(check.fontes_consultadas.some(s=>s.id_caso===5&&s.indice===5&&s.grau==="confirmacao_documental_judicial_do_historico_de_2012"));
assert.equal(check.nota_processual_dana.id_caso,5);
assert.equal(check.nota_processual_dana.indice,12);
assert.equal(check.nota_processual_dana.redacao_candidata,null);
assert.equal(check.nota_processual_dana.publicavel,false);
assert.equal(check.aprovacao_editorial,false);
assert.equal(check.publicacao_autorizada,false);
console.log("Fase 5.41: fontes registradas e publicacao bloqueada.");
