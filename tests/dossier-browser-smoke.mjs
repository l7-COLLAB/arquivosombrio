import assert from "node:assert/strict";
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const browser = await chromium.launch({headless:true});
const outputs="artifacts/documental";
mkdirSync(outputs,{recursive:true});
try {
  for(const width of [375,768,1280]) {
    const page=await browser.newPage({viewport:{width,height:900}});
    await page.setContent(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>
      body{background:#171410;color:#e9dfce;margin:0;font:16px Georgia,serif}
      main{max-width:850px;margin:auto;padding:18px;box-sizing:border-box}
      section{min-width:0}.evidence-card{border:1px solid #6b5641;padding:12px;margin:12px 0}
      button{background:#30261f;color:#e9dfce;border:1px solid #8b6a4a;padding:14px;cursor:pointer;width:100%;text-align:left}
      a{color:#dfba80;overflow-wrap:anywhere}.case-content-card-list{display:grid;gap:10px}
      </style></head><body><main><h1>Teste documental (dados fictícios)</h1><div id="fixture"></div></main></body></html>`);
    await page.addStyleTag({path:"css/caso.css"});
    await page.addScriptTag({path:"js/caso.js"});
    const result=await page.evaluate(()=>{
      const destino=document.getElementById("fixture");
      const itens=Array.from({length:7},(_,i)=>({titulo:`Registro ${i+1}`,descricao:`Detalhe fictício ${i+1}`,classificacao:"Documental",procedencia:"Arquivo demonstrativo",fonte:"Exemplo fictício"}));
      const e=renderizarCardsBlocoDossie("evidencias",{titulo:"Evidências",itens});
      const f=renderizarFontesBlocoDossie({titulo:"Fontes",itens:[{titulo:"Exemplo",instituicao:"Laboratório fictício",url:"https://example.org/teste"}]});
      destino.append(e,f);
      return {cards:destino.querySelectorAll(".evidence-card").length, sources:destino.querySelectorAll(".case-content-sources li").length};
    });
    assert.equal(result.cards,7,"Todos os 7 registros precisam aparecer");
    assert.equal(result.sources,1);
    const button=page.locator(".evidence-toggle").first();
    await button.click();
    assert.equal(await button.getAttribute("aria-expanded"),"true");
    assert.equal(await page.locator(".evidence-details").first().isVisible(),true);
    await button.click();
    assert.equal(await button.getAttribute("aria-expanded"),"false");
    const external=page.locator('.case-content-sources a').first();
    assert.equal(await external.getAttribute("target"),"_blank");
    assert.match(await external.getAttribute("rel"),/noopener/);
    await page.evaluate(()=>{
      const eventos=[
        {data:"1941",descricao:"Investigação fictícia",categoria:"Investigação",detalhes:"Contexto adicional"},
        {data:"1942",descricao:"Perícia documental",categoria:"Perícia",fonte:"Arquivo demonstrativo",link_fonte:"https://example.org/fonte"},
        {data:"1942",descricao:"Segundo evento de perícia",categoria:"Perícia"},
        {data:"1943",descricao:"Julgamento fictício",categoria:"Julgamento"},
        {data:"Sem data",descricao:"Registro não classificado"}
      ];
      document.getElementById("fixture").append(renderizarCronologiaBlocoDossie({titulo:"Cronologia demonstrativa",itens:eventos}));
    });
    const timeline=page.locator(".case-content-timeline");
    assert.equal(await timeline.locator("ol > li").count(),5);
    const search=timeline.locator('input[type="search"]');
    const select=timeline.locator("select");
    await search.fill("pericia");
    assert.equal(await timeline.locator("ol > li:visible").count(),2,"Busca deve ignorar acentos");
    assert.equal(await timeline.locator(".case-timeline-navigation a:visible").count(),1);
    const yearLink=timeline.locator('.case-timeline-navigation a:visible').first();
    const destination=await yearLink.getAttribute("href");
    assert(destination?.startsWith("#cronologia-ano-1942"));
    assert.equal(await timeline.locator(destination).isVisible(),true);
    await select.selectOption({label:"Julgamento"});
    assert.equal(await timeline.locator("ol > li:visible").count(),0);
    assert.equal(await timeline.locator(".case-timeline-empty").isVisible(),true);
    await timeline.locator(".case-timeline-reset").click();
    assert.equal(await timeline.locator("ol > li:visible").count(),5);
    assert.equal(await timeline.locator(".case-timeline-empty").isVisible(),false);
    const details=timeline.locator("details").first();
    await details.locator("summary").click();
    assert.equal(await details.getAttribute("open"),"");
    const fonteEvento=timeline.locator(".case-timeline-source-link").first();
    assert.equal(await fonteEvento.getAttribute("target"),"_blank");
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
    assert(!overflow,`Rolagem horizontal em ${width}px`);
    await page.screenshot({path:`${outputs}/dossie-${width}.png`,fullPage:true});
    await page.close();
  }
  console.log("Smoke test de navegador aprovado (375, 768 e 1280 px).");
} finally { await browser.close(); }
