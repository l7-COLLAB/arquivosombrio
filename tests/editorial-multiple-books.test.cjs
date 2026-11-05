'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../admin-v2/editorial/editorial.js'),'utf8');
async function boot(search='',admin=true){
 const nodes=new Map(),events={},downloads=[],assignments=[],calls=[];
 const element=()=>({children:[],handlers:{},hidden:true,value:'',style:{},append(...x){this.children.push(...x)},replaceChildren(){this.children=[]},setAttribute(){},addEventListener(k,v){this.handlers[k]=v},remove(){},click(){if(this.download)downloads.push(this.download)}});
 const get=s=>{if(!nodes.has(s))nodes.set(s,element());return nodes.get(s)};
 const books=[{id:'history',slug:'oficio-do-espanto',title:'O Ofício do Espanto',planned_chapters:30},{id:'novel',slug:'miani-romance-nora-whitmore',title:'Romance de Nora Whitmore',planned_chapters:2}];
 const rows=[{id:'p',book_id:'novel',chapter_number:1,title:'Prólogo',body:'Texto do prólogo',status:'rascunho'},{id:'n1',book_id:'novel',chapter_number:2,title:'11 de outubro de 2023',body:'Texto do capítulo',status:'rascunho'},{id:'h1',book_id:'history',chapter_number:1,title:'Rodez',body:'Texto histórico',status:'rascunho'}];
 const client={auth:{getUser:async()=>({data:{user:{app_metadata:{role:admin?'admin':'member'}}}})},rpc:async()=>({data:admin}),from(table){calls.push(table);const filters={};return {select(){return this},eq(k,v){filters[k]=v;return this},async order(){return {data:table==='editorial_books'?books:rows.filter(r=>r.book_id===filters.book_id)}},async single(){return {data:rows.find(r=>r.id===filters.id&&r.book_id===filters.book_id)}}}}};
 const window={location:{href:'https://example.test/admin-v2/editorial/'+search,assign:x=>assignments.push(x)},supabase:{createClient:()=>client},confirm:()=>false,addEventListener(){},scrollTo(){}};
 class LocalURL extends URL {static createObjectURL(){return 'blob:test'}static revokeObjectURL(){}}
 const context={window,document:{querySelector:get,createElement:element,body:{appendChild(){}},addEventListener:(k,v)=>events[k]=v},URL:LocalURL,Blob,setTimeout:()=>{},console};
 vm.runInNewContext(source,context);events.DOMContentLoaded();
 for(let n=0;n<6;n++)await new Promise(resolve=>setImmediate(resolve));
 return {get,window,downloads,assignments,calls};
}
test('Seleciona romance por URL, mantém prólogo separado e exporta nome do livro correto',async()=>{
 const ui=await boot('?book=miani-romance-nora-whitmore');
 assert.equal(ui.get('#book-title').textContent,'Romance de Nora Whitmore');
 assert.equal(ui.get('#selected-chapter').textContent,'Prólogo');
 const list=ui.get('#chapter-list').children;
 assert.equal(list[1].children[0].textContent,'Capítulo 1 · 11 de outubro de 2023');
 await list[1].onclick();
 assert.equal(ui.get('#selected-chapter').textContent,'Capítulo 1');
 ui.get('#download').handlers.click();
 assert.equal(ui.downloads[0],'miani-romance-nora-whitmore-capitulo-01.txt');
});
test('Preserva seleção padrão e numeração de Fualdès',async()=>{
 const ui=await boot();assert.equal(ui.get('#book-title').textContent,'O Ofício do Espanto');assert.equal(ui.get('#selected-chapter').textContent,'Capítulo 1');
});
test('Não carrega livros para pessoa sem autorização administrativa',async()=>{
 const ui=await boot('',false);assert.deepEqual(ui.calls,[]);assert.equal(ui.get('#workspace').hidden,true);
});
test('Livro desconhecido não abre silenciosamente outro manuscrito',async()=>{
 const ui=await boot('?book=inexistente');assert.equal(ui.get('#workspace').hidden,true);assert.match(ui.get('#message').textContent,/Livro não encontrado/);
});
test('Troca de livro preserva seleção se descarte das alterações for recusado',async()=>{
 const ui=await boot('?book=miani-romance-nora-whitmore');ui.get('#chapter-body').handlers.input();ui.get('#book-select').value='oficio-do-espanto';ui.get('#book-select').handlers.change();assert.deepEqual(ui.assignments,[]);assert.equal(ui.get('#book-select').value,'miani-romance-nora-whitmore');
});
