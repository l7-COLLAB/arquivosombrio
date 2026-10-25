import assert from "node:assert/strict";import {readFileSync} from "node:fs";
const config=readFileSync(new URL("../supabase/config.toml",import.meta.url),"utf8");
const section=config.match(/\[functions\.editorial-candidates\]([\s\S]*?)(?=\n\[|$)/);
assert.ok(section,"Configuracao editorial ausente");
assert.match(section[1],/^verify_jwt\s*=\s*true/m);
const edge=readFileSync(new URL("../supabase/functions/editorial-candidates/index.ts",import.meta.url),"utf8");
assert.match(edge,/auth\.getUser\(token\)/);
assert.doesNotMatch(edge,/service_role|SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY/i);
console.log("Fase 5.64: verify_jwt=true e segunda validacao de identidade presentes na branch.");
