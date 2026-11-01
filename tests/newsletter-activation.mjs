import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");
const dispatch=read("supabase/functions/newsletter-dispatch/index.ts");
const activate=read("supabase/functions/newsletter-activation/index.ts");
const pilot=read("supabase/migrations/20261101_newsletter_pilot_claim.sql");
const page=read("admin-v2/newsletter.html");
const ui=read("admin-v2/js/newsletter-activation.js");
const sender=read("admin-v2/js/newsletter-send.js");

test("piloto é a configuração padrão e limita o envio a um endereço confirmado",()=>{
 assert.match(dispatch,/NEWSLETTER_PILOT_ONLY"\)!=="false"/);
 assert.match(dispatch,/NEWSLETTER_PILOT_EMAIL/);
 assert.match(dispatch,/\(!pilotOnly \|\| mailPattern\.test\(pilotEmail\)\)/);
 assert.match(dispatch,/p_limit:config\.pilotOnly\?1:5/);
 assert.match(dispatch,/p_pilot_email:config\.pilotOnly\?config\.pilotEmail:null/);
 assert.match(pilot,/p_pilot_email text/);
 assert.match(pilot,/p_limit<>1/);
 assert.match(pilot,/pg_catalog\.lower\(s\.email\)=pg_catalog\.lower\(p_pilot_email\)/);
 assert.match(pilot,/s\.status='confirmado' and s\.confirmed_at is not null/);
 assert.match(pilot,/for update of q skip locked/);
 assert.match(pilot,/revoke all on function public\.editorial_claim_newsletter_batch\(uuid,integer,text\) from public,anon,authenticated/);
 assert.match(pilot,/grant execute on function public\.editorial_claim_newsletter_batch\(uuid,integer,text\) to service_role/);
});

test("diagnóstico na Resend é somente leitura e exige sessão administrativa",()=>{
 assert.match(activate,/db\.auth\.getUser\(bearer\)/);
 assert.match(activate,/user\.app_metadata\?\.role!=="admin"/);
 assert.match(activate,/security_consume_rate_limit/);
 assert.match(activate,/if\(req\.method!=="POST"\|\|!origins\.has\(origin\)\)/);
 assert.match(activate,/method:"GET"|const res=await fetch/);
 assert.match(activate,/readResend\("domains",inspectKey\)/);
 assert.match(activate,/readResend\("webhooks",inspectKey\)/);
 assert.match(activate,/redirect:"error"/);
 assert.match(activate,/AbortSignal\.timeout\(6500\)/);
 assert.match(activate,/body\.has_more===true/);
 assert.doesNotMatch(activate,/\.insert\(|\.update\(|\.delete\(|\/emails"|Deno\.cron/);
 assert.match(activate,/read_only:true/);
});

test("validação exige domínio verificado para envio e webhook com eventos críticos",()=>{
 assert.match(activate,/target\.status==="verified"\|\|target\.status==="partially_verified"/);
 assert.match(activate,/\.sending==="enabled"/);
 assert.match(activate,/x\.endpoint===webHook&&x\.status==="enabled"/);
 assert.match(activate,/email\.delivered","email\.bounced","email\.complained/);
 assert.match(activate,/requiredEvents\.every\(e=>events\.includes\(e\)\)/);
 assert.match(activate,/sender_domain_matches:match/);
 assert.match(activate,/pilot_ready:pilotOnly&&pilotReady&&verified/);
 assert.match(activate,/provider_delivery_tested|nenhuma|houve e-mail/i);
});

test("pré-voo e UI não revelam endereço piloto ou segredos",()=>{
 assert.doesNotMatch(activate,/respond\(\{[^}]*pilotEmail/);
 assert.doesNotMatch(activate,/return respond\(\{[^}]*inspectKey/);
 assert.doesNotMatch(ui,/RESEND_API_KEY|NEWSLETTER_PILOT_EMAIL|recipient_email|innerHTML|outerHTML/);
 assert.match(ui,/\.textContent=/);
 assert.match(ui,/replaceChildren\(\)/);
 assert.match(ui,/client\.auth\.getUser\(\)/);
 assert.match(ui,/kind:"preflight"/);
 for(const id of ["newsletter-activation-panel","newsletter-activation-refresh",
  "newsletter-activation-checks","newsletter-activation-provider","newsletter-activation-result"])
  assert.match(page,new RegExp('id="'+id+'"'));
 assert.match(page,/newsletter-activation\.js\?v=1/);
 assert.match(sender,/Enviar 1 teste piloto/);
 assert.match(sender,/pilotOnly\?/);
 assert.match(sender,/confirm!=="ENVIAR"/);
});
