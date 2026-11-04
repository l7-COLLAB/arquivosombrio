import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const file = path => fs.readFileSync(new URL("../" + path, import.meta.url), "utf8");
function parseCsv(text) {
  const lines = text.trimEnd().split("\n");
  const parse = line => Array.from(line.matchAll(/"((?:[^"]|"")*)"(?:,|$)/g), match => match[1].replace(/""/g, '"'));
  const heading = parse(lines.shift());
  return lines.map(line => {
    const cells = parse(line);
    assert.equal(cells.length, heading.length, "Malformed CSV record");
    return Object.fromEntries(heading.map((key, index) => [key, cells[index]]));
  });
}
const pending = parseCsv(file("docs/inventario-direitos-44-pendencias-20261103.csv"));
const official = JSON.parse(file("data/termos-institucionais-capas-20261103.json"));
const historical = parseCsv(file("docs/inventario-direitos-capas-priorizado-20261103.csv"));
const replacements = JSON.parse(file("data/capas-alternativas-direitos-20261103.json")).records;
const credits = file("creditos-imagens.html");
const key = row => row.editoria + ":" + (row.id || row.content_id);

test("new live baseline tracks 44 distinct entries and preserves historic snapshots", () => {
  assert.equal(pending.length, 44);
  assert.equal(new Set(pending.map(key)).size, 44);
  assert.equal(historical.length, 94);
  assert.equal(replacements.length, 21);
  assert.equal(replacements.filter(r => r.status === "publicado_no_banco_20261103").length, 21);
  assert.ok(pending.every(row => !replacements.some(r => key(r) === key(row))));
});

test("provenance classification stays complete without inventing licensing claims", () => {
  const classes = Object.groupBy(pending, r => r.origem_tecnica);
  assert.equal(classes.upload_sem_proveniencia?.length, 38);
  assert.equal(classes.institucional?.length, 3);
  assert.equal(classes.arquivo_local?.length, 1);
  assert.equal(classes.data_uri?.length, 1);
  assert.equal(classes.capa_ausente?.length, 1);
  assert.equal(pending.filter(r => r.estado_documental === "pendente_evidencia").length, 43);
  assert.equal(pending.filter(r => r.estado_documental === "termos_institucionais_documentados").length, 1);
  assert.equal(pending.filter(r => r.prioridade === "alta" && r.editoria === "Casos" && r.id === "15").length, 1);
});

test("14 exact duplicate Story files across 11 source cover records remain flagged", () => {
  const copies = pending.map(x => Number(x.copias_iguais_em_stories));
  assert.ok(copies.every(Number.isInteger));
  assert.equal(copies.reduce((a, b) => a + b, 0), 14);
  assert.equal(copies.filter(c => c > 0).length, 11);
  assert.ok(pending.some(r => r.editoria === "casos_diarios" && r.id === "48" && Number(r.copias_iguais_em_stories) === 1));
});

test("institutions have transparent evidence and no blanket licence claims", () => {
  assert.equal(official.records.length, 3);
  const map = new Map(official.records.map(r => [key(r), r]));
  assert.equal(map.get("pericias:12").estado, "termos_institucionais_documentados");
  assert.equal(map.get("Casos:7").estado, "sem_licenca_ou_autoria_comprovada");
  assert.equal(map.get("casos_diarios:33").estado, "pendente_validacao_escopo");
  assert.match(map.get("pericias:12").termos, /^https:\/\/www\.nist\.gov\/copyrights-disclaimers$/);
  assert.ok(credits.includes('id="pericias-12"'));
  assert.equal((credits.match(/<article class="credit"/g) || []).length, 110);
});

test("rights inventory does not publish embedded image data or user identity", () => {
  const csv = file("docs/inventario-direitos-44-pendencias-20261103.csv");
  assert.ok(!csv.includes("data:image/jpeg;base64,"));
  assert.ok(!csv.includes("owner_id"));
  assert.ok(!csv.includes("user_metadata"));
  const embedded = pending.find(r => r.editoria === "casos_diarios" && r.id === "6");
  assert.equal(embedded.localizador_sem_dados_embutidos, "DATA_URI_OMITIDA");
});
