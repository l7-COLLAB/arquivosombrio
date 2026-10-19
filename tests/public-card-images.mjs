import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const root=path.resolve(import.meta.dirname,'..');
const script=fs.readFileSync(path.join(root,'js/script.js'),'utf8');
const literary=fs.readFileSync(path.join(root,'js/arquivo-literario.js'),'utf8');
test('código dos cards continua sintaticamente válido',()=>{
 assert.doesNotThrow(()=>new vm.Script(script));
 assert.doesNotThrow(()=>new vm.Script(literary));
});
test('cards de dossiês e perícia reservam proporção e usam fallback local',()=>{
 assert.match(script,/loading="lazy" decoding="async" width="800" height="500"/);
 assert.match(script,/this\.onerror=null;this\.src='imagem-compartilhamento\.jpg'/);
 assert.doesNotMatch(script,/placehold\.co\/800x500\/111\/777/);
 assert.ok(fs.existsSync(path.join(root,'imagem-compartilhamento.jpg')));
});
test('cards Garimpo possuem dimensões explícitas e decodificação assíncrona',()=>{
 assert.match(script,/loading="lazy" decoding="async" width="92" height="104"/);
 assert.match(script,/function criarPreviaCasoDiario/);
});
test('cards literários estabilizam dimensões da capa sem mudar a estrutura',()=>{
 assert.match(literary,/archive-literary-card-media/);
 assert.match(literary,/loading="lazy" decoding="async" width="184" height="154"/);
 assert.match(literary,/this\.style\.visibility='hidden'/);
 assert.match(literary,/archive-literary-detail-cover/);
});
test('edição de novels e do painel administrativo permanece fora do escopo',()=>{
 assert.doesNotMatch(literary,/document\.querySelector\(['"]\.novels/);
});
