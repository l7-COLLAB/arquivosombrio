import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const root=path.resolve(import.meta.dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const js=read('js/reader-mobile-controls.js');
const dossier=read('js/caso.js');
const css=read('css/reader-mobile-controls.css');
const html=read('caso.html');
test('os dois scripts do leitor continuam sintaticamente válidos',()=>{
 assert.doesNotThrow(()=>new vm.Script(js));
 assert.doesNotThrow(()=>new vm.Script(dossier));
});
test('barra compacta inicia somente após montar controles originais',()=>{
 assert.match(dossier,/window\.ArquivoMarcadorLeitura\?\.init\(casoId\);\s*window\.ArquivoLeitorMobile\?\.init\(\)/);
 assert.ok(html.indexOf('js/reader-mobile-controls.js?v=1')<html.indexOf('js/caso.js?v='));
 assert.match(html,/css\/reader-mobile-controls\.css\?v=1/);
});
test('expansão preserva botões originais e é acessível',()=>{
 assert.match(js,/aria-expanded/);
 assert.match(js,/aria-controls/);
 assert.match(js,/as-mobile-reader-expanded/);
 assert.match(js,/data-reader/); // o módulo NÃO substitui os controles originais
 assert.doesNotMatch(js,/innerHTML\s*=\s*['"`][\s\S]*case-reader-toolbar-inner/);
});
test('sumário é navegado apenas em rolagem, sem interferir no modo livro',()=>{
 assert.match(js,/\.dossie-summary/);
 assert.match(js,/paging&&!paging\.hidden/);
 assert.match(js,/No modo livro, o sumário está na primeira página/);
 assert.match(js,/scrollIntoView/);
});
test('estilos ficam restritos ao celular, preservando tema papel e paginação',()=>{
 assert.match(css,/@media\(max-width:700px\)/);
 assert.match(css,/data-reader-theme="papel"/);
 assert.match(css,/\.reader-page-navigation:not\(\[hidden\]\)/);
 assert.doesNotMatch(css,/novel-reader|admin-dashboard-open/);
});
