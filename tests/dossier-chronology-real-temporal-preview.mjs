import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
async function load(p){return import("data:text/javascript;base64,"+Buffer.from(readFileSync(new URL(p,import.meta.url),"utf8")).toString("base64"))}
const {classificarPendencia}=await load("../admin-v2/js/chronology-pending-classifier.js");
const {prepararPreviaTemporal}=await load("../admin-v2/js/chronology-temporal-preview.js");
const report=JSON.parse(readFileSync(new URL("../docs/relatorio-normalizacao-acervo-fase5-9.json",import.meta.url),"utf8"));
const month=/^((?:janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro) de (?:1[5-9]|20)\d{2})\s*[:—–-]\s*(.+)$/iu;
const remaining=report.eventos.filter(x=>x.tipo==="texto"&&!x.candidato&&!month.test(x.texto_original.trim()));
assert.equal(remaining.length,38);
const counts={};const rows=[];
for(const item of remaining){
 const categoria=classificarPendencia(item.texto_original),preview=prepararPreviaTemporal(item.texto_original,categoria);
 assert.equal(preview.texto_original,item.texto_original);
 assert.equal(preview.publicavel_automaticamente,false);
 assert.equal(preview.exige_revisao,true);
 assert.equal(preview.fonte,undefined);
 assert.equal(preview.natureza_documental,undefined);
 if(preview.resultado==="previsa_temporal"){
  assert.ok(preview.periodo_original && preview.descricao_original);
  assert.equal(preview.periodo_original+": "+preview.descricao_original,item.texto_original.trim());
 }
 const key=categoria+" / "+preview.resultado;counts[key]=(counts[key]||0)+1;
 rows.push({id:item.id,posicao:item.posicao,categoria,resultado:preview.resultado});
}
assert.equal(rows.length,38);
console.log(JSON.stringify({total:rows.length,grupos:counts,registros:rows},null,2));
