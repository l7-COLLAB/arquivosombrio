const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const report=fs.readFileSync('docs/atlas-auditoria-geografica-20261104.md','utf8');
const sql=fs.readFileSync('sql/atlas-auditoria-fontes-geograficas-20261104.sql','utf8');

test('Auditoria relaciona 53 localizações publicadas, sem repetições',()=>{
 const lines=report.split('\n').filter(s=>/^\|\s*\d+\s*\|/.test(s));
 assert.equal(lines.length,53,'Deve incluir todos os 53 registros geográficos');
 const ids=lines.map(s=>Number(s.split('|')[1].trim()));
 assert.equal(new Set(ids).size,53);
 assert.deepEqual(ids,Array.from({length:53},(_,i)=>i+1));
});
test('Fontes institucionais de seis dossiês identificadas',()=>{
 const ids=[1,3,4,21,22,24];
 for(const id of ids)assert.match(sql,new RegExp('where id='+id+' and dossier_id='));
 assert.match(report,/Dossiês com nova referência institucional\/judicial: \*\*6\*\*/);
 assert.match(sql,/jsonb_array_length\(coalesce\(documentos,'\[\]'::jsonb\)\)=0/);
});
test('Auditoria distingue documentação geral de conferência externa',()=>{
 assert.match(report,/referências rastreáveis já presentes no artigo/);
 assert.match(report,/47/);
 assert.match(sql,/ainda não foi conferida individualmente como prova específica da localidade/);
});
test('Textos originais, coordenadas e condição de publicação não são alterados',()=>{
 assert.doesNotMatch(sql,/\bset\s+(?:latitude|longitude|historia|conteudo|status_publicacao|is_active)\s*=/i);
 assert.doesNotMatch(sql,/\bdelete\s+from\b/i);
});
