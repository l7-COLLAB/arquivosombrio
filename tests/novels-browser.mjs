import assert from "node:assert/strict";
import { chromium } from "playwright";
const server = "http://127.0.0.1:8787";
const data = {
  novels: [
    {id:"11111111-1111-4111-8111-111111111111",slug:"misterio-da-biblioteca",titulo:"O Mistério da Biblioteca",autor_nome:"Arquivo Sombrio",sinopse:"Um livro de mistério para o teste.",generos:["Mistério"],tags:[],destaque:true,status_obra:"concluida",status_publicacao:"publicado",imagem_capa:null},
    {id:"22222222-2222-4222-8222-222222222222",slug:"segredo-da-casa",titulo:"O Segredo da Casa",autor_nome:"Autor de Teste",sinopse:"Outro mistério.",generos:["Mistério","Suspense"],tags:[],destaque:false,status_obra:"concluida",status_publicacao:"publicado",imagem_capa:null}
  ],
  novel_capitulos: [
    {id:"33333333-3333-4333-8333-333333333333",novel_id:"11111111-1111-4111-8111-111111111111",numero:1,titulo:"A Primeira Página",palavras:2200,status_publicacao:"publicado",publicado_em:null,conteudo:("Era uma noite silenciosa. A biblioteca guardava um segredo. \n\n").repeat(110)},
    {id:"44444444-4444-4444-8444-444444444444",novel_id:"11111111-1111-4111-8111-111111111111",numero:2,titulo:"A Segunda Página",palavras:1800,status_publicacao:"publicado",publicado_em:null,conteudo:("Uma pista surgiu entre as páginas. \n\n").repeat(100)}
  ]
};
function supabaseStub(rows){
 window.supabase={createClient(){return {
   auth:{getUser:async()=>({data:{user:null}})},
   from(table){
     const initial=(rows[table]||[]).slice();let filters=[];let sorters=[];
     const apply=()=>{let r=initial.filter(x=>filters.every(f=>f(x)));for(const [field,asc] of sorters.slice().reverse())r.sort((a,b)=>(a[field]===b[field]?0:a[field]>b[field]?1:-1)*(asc?1:-1));return r};
     const q={
       select(){return q},
       eq(k,v){filters.push(x=>x[k]===v);return q},
       in(k,values){filters.push(x=>values.includes(x[k]));return q},
       order(k,{ascending=true}={}){sorters.push([k,ascending]);return q},
       limit(){return q},
       then(resolve,reject){return Promise.resolve({data:apply(),error:null}).then(resolve,reject)},
       async single(){return {data:apply()[0]||null,error:null}},
       async maybeSingle(){return {data:apply()[0]||null,error:null}}
     };return q;
   }
 }}};
}
const stub="("+supabaseStub.toString()+")("+JSON.stringify(data)+")";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
let count=0;
try {
 for(const viewport of [{width:1280,height:800},{width:390,height:844}]){
   const context=await browser.newContext({viewport,locale:"pt-BR"});
   await context.route("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0",route=>route.fulfill({status:200,contentType:"application/javascript",body:stub}));
   const page=await context.newPage();
   const faults=[];
   page.on("pageerror",err=>{if(err.message.includes("novels"))faults.push(err.message)});
   await page.goto(server+"/novels.html",{waitUntil:"domcontentloaded"});
   await page.locator("#novel-grid .novel-card").first().waitFor({timeout:10000});
   assert.equal(await page.locator("#novel-grid .novel-card").count(),2);
   assert.equal(await page.locator("#novel-starter a").count(),2);
   assert.equal(await page.locator("#novel-themes .novel-theme-item").count(),2);
   assert.match(await page.locator("#novel-themes").innerText(),/Investigações clássicas/);
   assert.match(await page.locator("#novel-themes").innerText(),/Segredos na penumbra/);
   if(viewport.width===390){
     const catalogSize=await page.evaluate(()=>({documentWidth:document.documentElement.scrollWidth,viewport:innerWidth}));
     assert(catalogSize.documentWidth<=catalogSize.viewport+8,"Catálogo ultrapassa viewport: "+JSON.stringify(catalogSize));
   }
   await page.locator("#novel-search").fill("sem resultado");
   assert.match(await page.locator("#novel-grid").innerText(),/Nenhuma obra encontrada/);
   await page.locator("#novel-search").fill("");
   await page.locator('#novel-grid a[href*="misterio-da-biblioteca"]').first().click();
   await page.locator("#novel-detail h1").waitFor({timeout:10000});
   assert.match(await page.title(),/O Mistério da Biblioteca/);
   await page.locator("#novel-detail #novel-related .novel-related-card").first().waitFor({timeout:10000});
   assert.equal(await page.locator("#novel-detail #novel-related .novel-related-card").count(),1);
   assert.match(await page.locator("#novel-detail #novel-related").innerText(),/O Segredo da Casa/);
   await page.locator("#novel-detail a.novel-button").first().click();
   await page.locator("#reader-body p").first().waitFor({timeout:10000});
   assert.equal(await page.locator("#reader-body p").count(),110);
   assert.match(await page.title(),/Capítulo 1/);
   assert.equal(await page.locator("#novel-reader #novel-related").count(),0);
   await page.evaluate(()=>window.scrollTo({top:480,behavior:"instant"}));
   await page.evaluate(()=>window.dispatchEvent(new Event("pagehide")));
   const local=await page.evaluate(()=>JSON.parse(localStorage.getItem("as-novel-guest-progress-v1-11111111-1111-4111-8111-111111111111")));
   assert.equal(local.chapter,1);
   assert(local.scroll>=400,"Posição não salva: "+local.scroll);
   await page.reload({waitUntil:"domcontentloaded"});
   await page.locator("#reader-body p").first().waitFor({timeout:10000});
   await page.waitForFunction(()=>window.scrollY>=400,{timeout:10000});
   await page.locator("#chapter-jump").selectOption("2");
   await page.locator("#reader-body p").first().waitFor({timeout:10000});
   assert.match(await page.title(),/Capítulo 2/);
   await page.locator("#novel-reader #novel-related .novel-related-card").first().waitFor({timeout:10000});
   assert.equal(await page.locator("#novel-reader #novel-related .novel-related-card").count(),1);
   assert.match(await page.locator("#novel-reader #novel-related h2").innerText(),/Sua próxima leitura/);
   if(viewport.width===390){
     const size=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth}));
     assert(size.scrollWidth<=size.viewport+8,"Leitor ultrapassa viewport: "+JSON.stringify(size));
     assert.equal(await page.locator("#reader-menu-toggle").count(),1);
   }
   assert.deepEqual(faults,[],"Erros JavaScript: "+faults.join(" | "));
   await context.close();
   count++;
 }
 console.log("Novels: "+count+" testes de navegador aprovados (desktop e mobile).");
}finally{await browser.close()}
