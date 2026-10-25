import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const src=readFileSync(new URL("../admin-v2/js/chronology-temporal-preview.js",import.meta.url),"utf8");
const {prepararPreviaTemporal}=await import("data:text/javascript;base64,"+Buffer.from(src).toString("base64"));
for(const [texto,categoria,precisao] of [
 ["28/08/2003, cerca de 13h30: pedido de duas pizzas","data_com_horario","data_com_horario_qualificado"],
 ["Janeiro/1998: a promotoria suspende as acusações","mes_ano_barra","mes_ano"],
 ["19–20 de dezembro de 1968: resgate","intervalo_ou_multiplas_datas","intervalo_ou_multiplas_datas"],
 ["Por volta de 2014: família se muda","periodo_aproximado","periodo_aproximado"]
]){
 const p=prepararPreviaTemporal(texto,categoria);
 assert.equal(p.resultado,"previsa_temporal");
 assert.equal(p.precisao,precisao);
 assert.equal(p.texto_original,texto);
 assert.equal(p.exige_revisao,true);
 assert.equal(p.publicavel_automaticamente,false);
 assert.equal(p.fonte,undefined);
 assert.equal(p.natureza_documental,undefined);
}
for(const categoria of ["referencia_auxiliar","marcador_sem_data","multiplos_eventos"]){
 assert.equal(prepararPreviaTemporal("Texto sem data",categoria).resultado,"preservar_sem_data");
}
assert.equal(prepararPreviaTemporal("21 e 22 de agosto de 2025: decisão","intervalo_ou_multiplas_datas").periodo_original,"21 e 22 de agosto de 2025");
assert.equal(prepararPreviaTemporal("sem separador","periodo_aproximado").resultado,"revisao_manual");
console.log("Prévia temporal segura validada");
