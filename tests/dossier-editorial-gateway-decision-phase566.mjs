import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const config=readFileSync(new URL("../supabase/config.toml",import.meta.url),"utf8");
const report=JSON.parse(readFileSync(new URL("../docs/decisao-gateway-fase5-66.json",import.meta.url),"utf8"));
assert.match(config,/\[functions\.editorial-candidates\]\s*verify_jwt\s*=\s*true/);
assert.equal(report.gateway_preflight_confirmado,false);
assert.equal(report.decisao,"manter_verify_jwt_true");
assert.equal(report.deploy_autorizado,false);
console.log("Fase 5.66: JWT mantido; comportamento real de preflight continua pendente.");
