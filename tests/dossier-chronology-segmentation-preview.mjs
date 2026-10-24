import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),"utf8"));
const original=read("../docs/relatorio-normalizacao-acervo-fase5-9.json");
const previa=read("../docs/previa-segmentacao-cronologias-fase5-16.json");
assert.equal(previa.estado,"proposta_sem_publicacao");
assert.equal(previa.cronologias.length,2);
assert.deepEqual(previa.cronologias.map(c=>c.acontecimentos.length),[12,18]);
assert.equal(previa.referencias_auxiliares.length,2);
for (const c of previa.cronologias){
 const item=original.eventos.find(e=>e.id===c.id_origem&&e.posicao===c.posicao_origem);
 assert.ok(item);
 const refeito=[...(c.cabecalho?[c.cabecalho]:[]),...c.acontecimentos.map(e=>e.texto_original)].join("\n");
 assert.equal(refeito,item.texto_original);
 for (const e of c.acontecimentos){assert.equal(e.data_confirmada,null);assert.equal(e.fonte_confirmada,null);}
}
for(const ref of previa.referencias_auxiliares){
 assert.equal(ref.converter_em_evento,false);
 assert.equal(ref.texto_original,original.eventos.find(e=>e.id===ref.id_origem&&e.posicao===ref.posicao_origem).texto_original);
}
console.log("Segmentação sem perdas validada: 30 linhas e 2 referências auxiliares");
