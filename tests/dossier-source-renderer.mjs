import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(new URL("../js/caso.js", import.meta.url), "utf8");
assert(source.includes("const fontesUnicas = itens"), "Deduplicação visual ausente");
assert(source.includes("fontesUnicas.forEach(item =>"), "Fontes únicas devem ser renderizadas");
assert(source.includes("url:\" + url[0]"), "Identificação por URL ausente");
assert(source.includes(String.raw` .split(/\n\s*\n/g)`.trim()), "Fonte textual deve ser separada por parágrafos");
console.log("Verificações estruturais de fontes concluídas");
