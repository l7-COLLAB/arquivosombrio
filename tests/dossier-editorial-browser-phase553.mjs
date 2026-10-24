import assert from "node:assert/strict";
import { chromium } from "playwright";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { mkdirSync } from "node:fs";

const browser=await chromium.launch({headless:true});
mkdirSync("artifacts/documental",{recursive:true});
const url=pathToFileURL(resolve("previews/revisao-editorial-fase5-50.html")).href;
try {
 for(const width of [320,375,768,1280]){
  const page=await browser.newPage({viewport:{width,height:850}});
  await page.goto(url);
  await page.locator("article").first().waitFor();
  assert.equal(await page.locator("article").count(),2);
  const dimensions=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));
  assert(dimensions.scroll<=dimensions.viewport+1,"Overflow horizontal em "+width+": "+JSON.stringify(dimensions));
  assert.equal(await page.locator("h2").count(),2);
  assert.equal(await page.locator("a#back-to-editorial").count(),1);
  const back=await page.locator("#back-to-editorial").getAttribute("href");
  assert.equal(back,"../admin-v2/editorial.html");
  assert.equal(await page.locator("button").count(),0);
  assert.equal(await page.locator('a[target="_blank"]').count(),2);
  await page.screenshot({path:"artifacts/documental/editorial-preview-"+width+".png",fullPage:true});
  await page.close();
 }
 console.log("Fase 5.53: visualizacao em quatro larguras sem overflow e retorno presente.");
} finally {await browser.close();}
