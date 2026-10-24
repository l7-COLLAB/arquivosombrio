import assert from "node:assert/strict";
import{readFileSync}from"node:fs";
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),"utf8"));
const check=read("../docs/checklist-decisao-editorial-fase5-43.json");
const pack=read("../docs/pacote-aprovacao-cronologias-fase5-42.json");
assert.equal(check.fase,"5.43");assert.equal(check.regressao_anterior.testes_aprovados,6);
assert.equal(check.criterios.length,5);assert.ok(check.criterios.every(c=>c.concluido===false));
assert.equal(check.decisoes.length,pack.itens.length);
for(const a of Object.values(check.autorizacoes))assert.equal(a,false);
assert.equal(check.rollback.testes_de_recuperacao_executados,false);
for(const d of check.decisoes){assert.ok(pack.itens.some(p=>p.id_caso===d.id_caso&&p.indice===d.indice));}
assert.equal(check.decisoes.find(x=>x.indice===12).decisao,"excluir_da_publicacao");

const audit=check.auditoria_complementar_2026_10_24;
assert.equal(audit.origem,"docs/pacote-aprovacao-cronologias-fase5-42.json");
assert.equal(audit.regressao_fase542.conclusao,"success");
assert.equal(audit.regressao_fase542.workflows_aprovados,6);
assert.equal(audit.regressao_fase542.validacao_editorial,false);
assert.equal(audit.ressalvas.length,3);
for(const item of audit.ressalvas){
 assert.equal(item.aprovado,false);
 assert.ok(check.decisoes.some(d=>d.id_caso===item.id_caso&&d.indice===item.indice));
}
const mosser=audit.ressalvas.find(x=>x.id_caso===6);
assert.equal(mosser.fonte_especifica_divergencia_confirmada,false);
const note=audit.ressalvas.find(x=>x.id_caso===5&&x.indice===12);
assert.equal(note.fora_da_cronologia,true);
assert.equal(note.publicavel,false);
assert.equal(note.redacao_candidata,null);
for(const [key,value] of Object.entries(audit.seguranca))assert.equal(value,false,key);
assert.equal(audit.decisao,"continuar_revisao_sem_homologacao");
console.log("Fase 5.43: checklist e rollback documentados; autorizacoes bloqueadas.");
