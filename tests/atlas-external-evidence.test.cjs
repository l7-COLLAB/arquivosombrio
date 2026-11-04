const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=name=>fs.readFileSync(name,'utf8');
const report=read('docs/atlas-cotejo-externo-20261104.md');
const sqlFiles=[
  read('sql/atlas-cotejo-externo-geografico-20261104.sql'),
  read('sql/atlas-cotejo-externo-geografico-complementar-20261104.sql'),
  read('sql/atlas-cotejo-geografico-conclusivo-20261104.sql')
];
const deploy=read('.github/workflows/deploy-pages.yml');

test('Relatório final contém exatamente 53 localidades distintas e fontes HTTPS',()=>{
 const lines=report.split('\n').filter(line=>/^\|\s*\d+\s*\|/.test(line));
 assert.equal(lines.length,53);
 const ids=lines.map(line=>Number(line.split('|')[1].trim()));
 assert.deepEqual(ids,Array.from({length:53},(_,i)=>i+1));
 for(const line of lines){
   assert.match(line,/\[Conferir documento\]\(https:\/\//);
 }
});
test('As três rodadas de cotejamento cobrem 47 fichas, sem duplicidades',()=>{
 const ids=sqlFiles.flatMap(sql=>[...sql.matchAll(/\((\d+),'https:\/\//g)].map(x=>Number(x[1])));
 assert.equal(ids.length,47);
 assert.equal(new Set(ids).size,47);
});
test('O cotejamento não publica drafts, altera coordenadas ou reescreve textos',()=>{
 for(const sql of sqlFiles){
  assert.doesNotMatch(sql,/\bdelete\s+from\b|\btruncate\b/gi);
  assert.doesNotMatch(sql,/\bset\s+(?:latitude|longitude|historia|conteudo|status_publicacao|is_active)\s*=/gi);
 }
 assert.match(sqlFiles[2],/location_precision='metro'/);
});
test('CI de publicação compara versões reais dos scripts, não valores antigos',()=>{
 assert.match(deploy,/admin_match=re\.search/);
 assert.match(deploy,/public_match=re\.search/);
 assert.doesNotMatch(deploy,/'atlas-admin\.js\?v=1'/);
 const admin=read('admin-v2/atlas.html');
 const publicPage=read('atlas.html');
 assert.match(admin,/atlas-admin\.js\?v=2/);
 assert.match(publicPage,/atlas-criminal\.js\?v=2/);
});
test('Relatório registra limites sobre autoria e São Paulo 2026',()=>{
 assert.match(report,/não representa validação jurídica da autoria/);
 assert.match(report,/não afirmação de que todos os fatos se passaram naquela cidade/);
 assert.match(sqlFiles[1],/NÃO há ligação demonstrada entre os casos/);
 assert.match(sqlFiles[2],/Pino Pasadena refere-se à coleta/);
});