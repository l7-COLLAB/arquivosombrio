import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root=path.resolve(import.meta.dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const module=read('js/reader-bookmark.js'),dossier=read('js/caso.js'),html=read('caso.html'),css=read('css/reader-bookmark.css');

test('scripts do dossiê e marcador possuem sintaxe válida',()=>{
 assert.doesNotThrow(()=>new vm.Script(module));
 assert.doesNotThrow(()=>new vm.Script(dossier));
});
test('marcador carrega antes do leitor e depois da autenticação pública não necessária',()=>{
 const marker='src="js/reader-bookmark.js?v=1" defer';
 const reader='src="js/caso.js?v=case-tracking-20261006-2"';
 assert.ok(html.indexOf(marker)>=0&&html.indexOf(marker)<html.indexOf(reader));
 assert.match(html,/css\/reader-bookmark\.css\?v=1/);
 assert.match(dossier,/configurarSumarioDossie\(\);\s*window\.ArquivoMarcadorLeitura\?\.init\(casoId\)/);
});
test('marcador depende de ação explícita e não envia a posição para backend',()=>{
 assert.match(module,/save\.addEventListener\("click"/);
 assert.match(module,/resume\.addEventListener\("click"/);
 assert.match(module,/clear\.addEventListener\("click"/);
 assert.match(module,/localStorage\.setItem/);
 assert.match(module,/localStorage\.removeItem/);
 assert.doesNotMatch(module,/fetch\(|sendBeacon|\.from\(|\.functions\.invoke\(/);
});
test('retomada respeita modo livro, identifica arquivo e expira em 90 dias',()=>{
 assert.match(module,/prefix\+String\(id\)/);
 assert.match(module,/paging&&!paging\.hidden/);
 assert.match(module,/if\(bookMode\(\)\)/);
 assert.match(module,/90\*24\*60\*60\*1000/);
 assert.match(module,/window\.scrollTo/);
});
test('estilo de leitura preserva papel antigo e celular',()=>{
 assert.match(css,/data-reader-theme="papel"/);
 assert.match(css,/@media\(max-width:700px\)/);
 assert.match(css,/:focus-visible/);
});
