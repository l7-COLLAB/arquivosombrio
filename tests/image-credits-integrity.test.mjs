import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const file = path => fs.readFileSync(new URL("../" + path, import.meta.url), "utf8");
function parseCsv(text) {
  const rows = [];
  let row = [], value = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { value += '"'; i++; }
      else if (c === '"') quoted = false;
      else value += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(value); value = ""; }
    else if (c === "\n") { row.push(value); rows.push(row); row = []; value = ""; }
    else if (c !== "\r") value += c;
  }
  const headings = rows.shift();
  return rows.filter(r => r.length === headings.length)
    .map(r => Object.fromEntries(headings.map((h, i) => [h, r[i]])));
}

const inventory = parseCsv(file("docs/inventario-direitos-capas-20261103.csv"));
const triage = parseCsv(file("docs/inventario-direitos-capas-priorizado-20261103.csv"));
const manifest = JSON.parse(file("data/capas-documentais.json"));
const verified = JSON.parse(file("data/creditos-capas-verificados-20261103.json")).records;
const creditsPage = file("creditos-imagens.html");

const key = x => x.editoria + ":" + x.id;
const sourceRecords = new Map(verified.map(x => [key(x), x]));

test("baseline and prioritized snapshot preserve every published cover", () => {
  assert.equal(inventory.length, 115);
  assert.equal(inventory.filter(x => x.estado_documental === "direitos_a_comprovar").length, 94);
  assert.equal(triage.length, 94);
  assert.equal(new Set(triage.map(key)).size, triage.length);
  for (const item of triage) assert.ok(inventory.find(x => key(x) === key(item)));
});

test("all 29 independently researched Wikimedia records link to source pages", () => {
  assert.equal(verified.length, 29);
  assert.equal(sourceRecords.size, 29);
  for (const record of verified) {
    assert.match(record.source_url, /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    assert.match(record.license_url, /^https:\/\//);
    for (const field of ["credit", "license", "description", "scope"]) {
      assert.ok(record[field]?.trim(), key(record) + ": empty " + field);
    }
    assert.equal(record.status, "licenca_declarada_na_pagina_original");
    const item = inventory.find(x => key(x) === key(record));
    assert.ok(item, key(record) + ": no matching cover in inventory");
    assert.match(item.url_publicada_sem_parametros, /wikimedia\.org/);
  }
});

test("prioritized inventory never confuses declared license with legal clearance", () => {
  assert.equal(triage.filter(x => x.estado_verificacao === "LICENCA_DECLARADA_NA_ORIGEM_PENDENTE_DE_VERIFICAR_USO").length, 29);
  assert.equal(triage.filter(x => x.estado_verificacao === "SEM_COMPROVACAO_DOCUMENTAL_ATUAL").length, 65);
  assert.equal(triage.filter(x => x.categoria_risco === "WIKIMEDIA_ORIGEM_VERIFICADA").length, 29);
  assert.equal(triage.filter(x => x.categoria_risco === "ARQUIVO_UPLOAD_ORIGEM_INCERTA").length, 38);
  assert.equal(triage.filter(x => x.categoria_risco === "IMPRENSA_OU_STREAMING").length, 11);
  assert.ok(!triage.some(x => x.url_capa_curta.includes("base64,")), "Do not store entire embedded pictures in compact public export");
});

test("public registry renders 50 source-credit entries and warns about limitations", () => {
  const old = inventory.filter(x => manifest.some(m =>
    m.table === x.editoria && String(m.id) === x.id && x.url_publicada_sem_parametros.includes(m.asset_path)
  ));
  assert.equal(old.length, 21);
  const inPage = (creditsPage.match(/<article class="credit"/g) || []).length;
  assert.equal(inPage, 50);
  for (const record of verified) {
    assert.ok(creditsPage.includes('id="' + key(record) + '"'), "Missing public credit: " + key(record));
  }
  assert.ok(creditsPage.includes("Relação parcial de 50 capas"));
  assert.ok(creditsPage.includes("não é um certificado"));
  assert.ok(file("fontes-direitos.html").includes('href="creditos-imagens.html"'));
});
