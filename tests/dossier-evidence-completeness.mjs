import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../js/caso.js", import.meta.url), "utf8");
const start = source.indexOf("function renderizarCardsBlocoDossie(");
const end = source.indexOf("\nfunction ", start + 12);
assert(start >= 0 && end > start, "Renderizador dos cartões não encontrado");
const body = source.slice(start, end);
assert.match(body, /normalizarItensBlocoDossie\(dados\)/);
assert.doesNotMatch(body, /\.slice\(0,\s*(?:5|limite)\)/);
assert.match(body, /itens\.forEach\(/);
console.log("A lista de evidências não tem truncamento por quantidade.");
