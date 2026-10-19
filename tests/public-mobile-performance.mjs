import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const pages=['index.html','dossies.html','garimpo.html','pericia.html','lendas.html','creepypastas.html'];
for(const p of pages){
 const s=fs.readFileSync(path.join(root,p),'utf8');
 test(p+' carrega as fontes de títulos com swap',()=>{
  assert.match(s,/fonts\.googleapis\.com\/css2\?family=Archivo\+Black/);
  assert.match(s,/family=Oswald:wght@500;600;700/);
  assert.match(s,/display=swap/);
 });
 test(p+' preserva o atalho de acessibilidade',()=>{
  assert.match(s,/class="as-skip-link" href="#conteudo-principal"/);
  assert.match(s,/id="conteudo-principal" tabindex="-1"/);
 });
}
for(const p of ['index.html','dossies.html','garimpo.html']){
 const s=fs.readFileSync(path.join(root,p),'utf8');
 test(p+' mantém acompanhamento diferido e em ordem',()=>{
  const script='<script src="js/case-tracking.js?v=20261006" defer>';
  assert.ok(s.includes(script));
  assert.ok(s.indexOf(script)<s.indexOf('<main'));
  assert.ok(s.indexOf(script)<s.lastIndexOf('js/script.js?'));
 });
}
test('a imagem editorial fora da hero principal não bloqueia carregamento',()=>{
 const s=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.match(s,/<img id="hero-editorial-dossie-image"[^>]*loading="lazy"[^>]*decoding="async"/);
 assert.match(s,/id="hero-rotating-title"/);
});
