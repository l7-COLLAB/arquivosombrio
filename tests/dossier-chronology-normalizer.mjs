import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const src=readFileSync(new URL("../admin-v2/js/chronology-normalizer.js",import.meta.url),"utf8");
const {normalizarEvento,prepararCronologia}=await import("data:text/javascript;base64,"+Buffer.from(src).toString("base64"));
for(const [original,data,descricao] of [
 ["1968: nasce Joseph Lyle Menendez.","1968","nasce Joseph Lyle Menendez."],
 ["4 de agosto de 1892: Andrew e Abby Borden são assassinados.","4 de agosto de 1892","Andrew e Abby Borden são assassinados."],
 ["29/03/2008: Um acontecimento.","29/03/2008","Um acontecimento."]
]){
 const x=normalizarEvento(original);
 assert.equal(x.evento.data,data);assert.equal(x.evento.descricao,descricao);
 assert.equal(x.evento.texto_original,original);assert.equal(x.exigeRevisao,true);
 assert.equal(x.evento.fonte,undefined);assert.equal(x.evento.natureza_documental,undefined);
}
const v="Fim de março de 1994: apuração com datas divergentes";
assert.equal(normalizarEvento(v).evento,v);
const structured={data:"2001",descricao:"Original",fonte:"Documento"};
const x=normalizarEvento(structured);assert.deepEqual(x.evento,structured);assert.notEqual(x.evento,structured);
assert.equal(prepararCronologia([v,"2000: evento",structured]).length,3);
assert.throws(()=>prepararCronologia({}),TypeError);
console.log("Normalização conservadora aprovada.");
