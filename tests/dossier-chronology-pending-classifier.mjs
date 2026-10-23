import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=readFileSync(new URL("../admin-v2/js/chronology-pending-classifier.js",import.meta.url),"utf8");
const {classificarPendencia}=await import("data:text/javascript;base64,"+Buffer.from(source).toString("base64"));
const d=JSON.parse(readFileSync(new URL("../docs/relatorio-normalizacao-acervo-fase5-9.json",import.meta.url),"utf8"));
const pend=d.eventos.filter(x=>x.tipo==="texto"&&!x.candidato);
const month=/^((?:janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro) de (?:1[5-9]|20)\d{2})\s*[:—–-]\s*(.+)$/iu;
const rem=pend.filter(x=>!month.test(x.texto_original.trim()));
assert.equal(pend.length,75);assert.equal(rem.length,38);
const counts={};for(const x of rem){const tipo=classificarPendencia(x.texto_original);counts[tipo]=(counts[tipo]||0)+1}
assert.equal(Object.values(counts).reduce((a,b)=>a+b,0),38);
assert.equal(classificarPendencia("Fontes: https://example.org"),"referencia_auxiliar");
assert.equal(classificarPendencia("Primeira tentativa de pagamento\\nOcorreu a entrega."),"marcador_sem_data");
assert.equal(classificarPendencia("1997 e 1998: ocorreram eventos."),"intervalo_ou_multiplas_datas");
assert.equal(classificarPendencia("Antes de 28/08/2003: evento"),"periodo_aproximado");
console.log(JSON.stringify({total:rem.length,por_categoria:counts},null,2));
