import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";

const file = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const docs = {
  privacy: file("privacidade.html"),
  terms: file("termos.html")
};

test("legal documents expose one consistent current revision", () => {
  assert.match(docs.privacy, /VERSÃO DO DOCUMENTO<\/small>\s*<strong>1\.4<\/strong>/);
  assert.match(docs.privacy, /versão 1\.4, atualizada em 31 de outubro de 2026/);
  assert.match(docs.terms, /VERSÃO 1\.2/);
  assert.match(docs.terms, /Versão 1\.2 dos Termos de Uso/);
  assert.doesNotMatch(docs.privacy, /<strong>19 de setembro de 2026<\/strong>/);
  assert.doesNotMatch(docs.terms, /<strong>\s*19 de setembro de 2026\s*<\/strong>/);
});

test("every known signup and Google consent flow submits current versions", () => {
  for (const [path,expected] of [
    ["js/public-narration.js",1],
    ["js/filtros.js",1],
    ["js/script.js",2]
  ]) {
    const source = file(path);
    const terms = source.match(/terms_version\s*:\s*["']1\.2["']/g) || [];
    const privacy = source.match(/privacy_version\s*:\s*["']1\.4["']/g) || [];
    assert.equal(terms.length, expected, path + " terms count");
    assert.equal(privacy.length, expected, path + " privacy count");
    assert.doesNotMatch(source, /terms_version\s*:\s*["']1\.1["']/);
    assert.doesNotMatch(source, /privacy_version\s*:\s*["']1\.2["']/);
  }
});

test("database migration retains legacy consent and records Google updates", () => {
  const sql = file("migracoes/2026-11-03-registro-aceite-versoes-legais.sql");
  assert.match(sql, /v_terms = '1\.1' and v_privacy = '1\.2'/);
  assert.match(sql, /v_terms = '1\.2' and v_privacy = '1\.4'/);
  assert.match(sql, /after update of raw_user_meta_data on auth\.users/i);
  assert.match(sql, /revoke all on function public\.record_legal_acceptance\(\)/i);
  assert.doesNotMatch(sql, /^\s*(?:begin|commit);\s*$/im);
  const guard = file("migracoes/2026-11-03-gatilho-aceite-update-restrito.sql");
  assert.ok(guard.includes("new.raw_user_meta_data ->> 'legal_acceptance' = 'true'"));
  for (const field of ["legal_acceptance","age_18_confirmed","terms_version","privacy_version","guidelines_version"]) {
    assert.ok(guard.includes("is distinct from new.raw_user_meta_data ->> '" + field + "'"), field);
  }
});

test("legal pages have keyboard skip target and readable focus styling", () => {
  for (const path of ["privacidade.html","termos.html","fontes-direitos.html"]) {
    const html = file(path);
    assert.match(html,/class="as-legal-skip" href="#conteudo-principal"/);
    assert.match(html,/id="conteudo-principal"/);
    assert.match(html,/legal-accessibility-20261103\.css/);
  }
  const css = file("css/legal-accessibility-20261103.css");
  assert.match(css, /:focus-visible/);
  assert.match(css, /#d47872/);
});
