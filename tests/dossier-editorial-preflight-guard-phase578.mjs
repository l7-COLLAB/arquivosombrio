import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=readFileSync(new URL("./dossier-editorial-preflight-phase578.mjs",import.meta.url),"utf8");
assert.match(source,/docker/);
assert.match(source,/supabase/);
assert.match(source,/--version/);
for(const unsafe of ["supabase link","supabase db push","supabase functions deploy","docker run","SERVICE_ROLE","https://"]) assert.equal(source.includes(unsafe),false,"Ação não permitida: "+unsafe);
assert.match(source,/servicos_iniciados:false/);
console.log("Fase 5.78: preflight sem start e sem acesso remoto.");
