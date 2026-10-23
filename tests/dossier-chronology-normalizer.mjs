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

for(const invalida of ["31/02/2008: data impossível","31 de abril de 1892: data impossível","29/02/1900: século não bissexto"]){const res=normalizarEvento(invalida);assert.equal(res.alterado,false);assert.equal(res.evento,invalida);assert.equal(res.exigeRevisao,true);}
assert.equal(normalizarEvento("29/02/2000: data válida").alterado,true);

for (const texto of [
  "26 de dezembro de 1996, 5h52\nPatsy liga para o serviço de emergência.",
  "1997\nA investigação prossegue.",
  "Dezembro de 1968\\nUm pedido de resgate é registrado."
]) {
  const resultado=normalizarEvento(texto);
  assert.equal(resultado.alterado,true,JSON.stringify(resultado));
  assert.equal(resultado.evento.texto_original,texto);
  assert.equal(resultado.exigeRevisao,true);
  assert.equal(resultado.evento.fonte,undefined);
}
for (const texto of ["Primeira tentativa de pagamento\\nA entrega falha.", "31 de fevereiro de 1996\nEvento impossível"]) {
  const resultado=normalizarEvento(texto);
  assert.equal(resultado.alterado,false);
  assert.equal(resultado.evento,texto);
}

for (const texto of ["Setembro de 2007: os pais são investigados.", "Junho de 2020: autoridades fazem anúncio."]) {
 const r=normalizarEvento(texto);
 assert.equal(r.alterado,true);
 assert.equal(r.evento.texto_original,texto);
 assert.equal(r.exigeRevisao,true);
}
for (const texto of ["1993,1995: anos distintos", "19–20 de dezembro de 1968\\nperíodo", "Fonte: https://example.org"]) {
 const r=normalizarEvento(texto);
 assert.equal(r.alterado,false);
 assert.equal(r.evento,texto);
}
