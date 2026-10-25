import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const src=readFileSync(new URL("../admin-v2/js/chronology-normalizer.js",import.meta.url),"utf8");
const {normalizarEvento}=await import("data:text/javascript;base64,"+Buffer.from(src).toString("base64"));
const amostra=JSON.parse(readFileSync(new URL("../docs/amostra-normalizacao-fase5-5.json",import.meta.url),"utf8"));
assert.equal(amostra.status,"previa_sem_aplicacao");
assert.equal(amostra.amostra.length,8);
const identificados=[];
for(const original of amostra.amostra){
 const saida=normalizarEvento(original.texto_original);
 assert.equal(saida.alterado,true,"Data clara não reconhecida: "+original.texto_original);
 assert.equal(saida.exigeRevisao,true);
 assert.equal(saida.evento.texto_original,original.texto_original);
 assert.equal(saida.evento.fonte,undefined);
 assert.equal(saida.evento.natureza_documental,undefined);
 identificados.push({id_banco:original.id_banco,posicao:original.posicao,data:saida.evento.data,descricao:saida.evento.descricao});
}
console.log(JSON.stringify({total:identificados.length,resultado:identificados},null,2));
