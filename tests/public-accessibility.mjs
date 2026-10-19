import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const pages = ['index.html','dossies.html','garimpo.html','pericia.html','lendas.html','creepypastas.html'];
const css = fs.readFileSync(path.join(root,'css/acessibilidade-publica-20261018.css'),'utf8');

for (const page of pages) {
  test(page + ' apresenta atalho de teclado antes do cabeçalho e conteúdo principal acessível', () => {
    const source = fs.readFileSync(path.join(root,page),'utf8');
    const skip = source.indexOf('class="as-skip-link" href="#conteudo-principal"');
    const body = source.indexOf('<body');
    const main = source.indexOf('<main id="conteudo-principal" tabindex="-1"');
    assert.ok(skip > body && skip < main, 'Link deve preceder o conteúdo principal');
    assert.equal((source.match(/class="as-skip-link" href="#conteudo-principal"/g) || []).length,1);
    assert.equal((source.match(/id="conteudo-principal"/g) || []).length,1);
    assert.ok(source.includes('css/acessibilidade-publica-20261018.css?v=1'));
    assert.ok(source.indexOf('as-skip-link') < source.indexOf('class="main-header"'));
  });
}
test('atalho é visível apenas ao receber foco',()=>{
  assert.match(css,/visibility:hidden/);
  assert.match(css,/:focus\s*\{/);
  assert.match(css,/visibility:visible/);
  assert.match(css,/min-height:44px/);
  assert.doesNotMatch(css, /novels-page|admin-dashboard-open/);
});
