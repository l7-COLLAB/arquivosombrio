import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
const page=read("../admin-v2/editorial-candidates.html");
const view=read("../admin-v2/js/editorial-candidates-view.js");
const menu=read("../admin-v2/editorial.html");
const endpoint=read("../supabase/functions/editorial-candidates/index.ts");
assert.match(menu,/editorial-candidates\.html/);
assert.match(page,/admin-auth\.js/);
assert.match(page,/editorial-candidates-view\.js/);
assert.match(view,/obterSessaoAdminIsolada\(\)/);
assert.match(view,/arquivo-admin-verified-user/);
assert.match(view,/functions\.invoke\("editorial-candidates"/);
assert.match(view,/method:"GET"/);
assert.match(view,/read_only/);
assert.doesNotMatch(view,/\.insert\(|\.upsert\(|\.update\(|\.delete\(/);
assert.doesNotMatch(page,/Thomas Mosser|Dana Chandler/);
assert.match(endpoint,/auth\.getUser\(token\)/);

// Evitar que links relativos sejam resolvidos como HTTPS do proprio dominio.
assert.match(view,/typeof item\.fonte!=="string"/);
assert.match(view,/new URL\(item\.fonte\)/);
assert.match(view,/sourceUrl\.protocol!=="https:"/);
assert.match(view,/sourceUrl\.username\|\|sourceUrl\.password/);
assert.ok(view.indexOf("new URL(item.fonte)")<view.indexOf("link.href=sourceUrl.href"));
assert.doesNotMatch(view,/link\.href=item\.fonte/);
console.log("Fase 5.58: fluxo autenticado preparado; sem deploy e sem teste real de acesso.");
