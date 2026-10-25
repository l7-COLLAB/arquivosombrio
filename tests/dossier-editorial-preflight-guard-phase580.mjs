import assert from "node:assert/strict";import{readFileSync}from"node:fs";
const src=readFileSync(new URL("./dossier-editorial-preflight-phase580.mjs",import.meta.url),"utf8");
assert.match(src,/docker_engine_disponivel/);
assert.match(src,/supabase_cli_disponivel/);
assert.match(src,/node_adequado/);
assert.match(src,/conexao_externa:false/);
for(const forbidden of ["supabase link","supabase db push","supabase functions deploy","docker run","service_role"])assert.equal(src.includes(forbidden),false);
console.log("Fase 5.80: checagem passiva do motor Docker e CLI, sem deploy.");
