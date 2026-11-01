import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");
const sql=read("supabase/migrations/20261101_newsletter_observability.sql");
const fn=read("supabase/functions/newsletter-monitor/index.ts");
const ui=read("admin-v2/js/newsletter-monitor.js");
const page=read("admin-v2/newsletter.html");

test("monitor SQL functions use server-only grants and never expose PII",()=>{
 assert.match(sql,/editorial_newsletter_monitor_snapshot\(\)/);
 assert.match(sql,/editorial_newsletter_simulate_dispatch\(p_edition uuid\)/);
 assert.match(sql,/security invoker set search_path = ''/g);
 assert.match(sql,/revoke all on function public\.editorial_newsletter_monitor_snapshot\(\)\s+from public,anon,authenticated/);
 assert.match(sql,/revoke all on function public\.editorial_newsletter_simulate_dispatch\(uuid\)\s+from public,anon,authenticated/);
 assert.match(sql,/grant execute on function public\.editorial_newsletter_monitor_snapshot\(\)\s+to service_role/);
 assert.match(sql,/grant execute on function public\.editorial_newsletter_simulate_dispatch\(uuid\)\s+to service_role/);
 assert.doesNotMatch(sql,/insert into |update public\.|delete from /i);
 assert.doesNotMatch(sql,/s\.email|select email|subscriber_email|verification_hash/);
});
test("monitor reports real aggregate state and does not confuse provider accept with confirmed delivery",()=>{
 for(const field of ["attempts_24h","attempts_7d","remaining_daily_quota","stalled_15m",
   "accepted_48h","uncertain","failed","complained","delivered","prepared","bounced"])
  assert.ok(sql.includes(field),field);
 assert.match(sql,/status='aceito'/);
 assert.match(sql,/status='entregue'/);
 assert.match(sql,/status='em_envio'/);
 assert.match(sql,/pg_catalog\.jsonb_build_object/);
 assert.match(page,/Entregas confirmadas pelo webhook/);
});
test("simulator excludes unconfirmed and cooldown records and never claims a slot",()=>{
 assert.match(sql,/subscriber_status<>'confirmado' or confirmed_at is null/);
 assert.match(sql,/subscriber_status='confirmado' and confirmed_at is not null/);
 assert.match(sql,/interval '7 days'/);
 assert.match(sql,/edition\.state='aprovado'/);
 assert.match(sql,/least\(5,quota\.remaining,totals\.eligible\)/);
 assert.match(sql,/'simulation_only',true/);
 assert.doesNotMatch(sql,/editorial_claim_newsletter_batch/);
});
test("Edge Function authenticates administrators and validates both request method and origin",()=>{
 assert.match(fn,/db\.auth\.getUser\(token\)/);
 assert.match(fn,/user\.app_metadata\?\.role!=="admin"/);
 assert.match(fn,/if\(req\.method!=="POST"\|\|!origins\.has\(origin\)\)/);
 assert.match(fn,/if\(total>2048\)/);
 assert.match(fn,/security_consume_rate_limit/);
 assert.match(fn,/editorial_newsletter_monitor_snapshot/);
 assert.match(fn,/editorial_newsletter_simulate_dispatch/);
 assert.match(fn,/read_only:true/);
 assert.match(fn,/emails_sent:0/);
 assert.doesNotMatch(fn,/api\.resend\.com|send_batch|Deno\.cron|\.insert\(|\.update\(|\.delete\(/);
});
test("diagnostics distinguish configured secrets from verified delivery",()=>{
 assert.match(fn,/config_gate_ready:configReady/);
 assert.match(fn,/real_domain_verification_checked:false/);
 assert.match(fn,/provider_delivery_tested:false/);
 assert.match(fn,/NEWSLETTER_DISPATCH_ENABLED/);
 assert.doesNotMatch(fn,/provider_key_value|RESEND_API_KEY\s*:/);
});
test("V2 rendering uses DOM-safe text and explicit clicks for manual status/simulation",()=>{
 for(const id of ["newsletter-monitor-panel","newsletter-monitor-refresh",
  "newsletter-monitor-checks","newsletter-monitor-warnings",
  "newsletter-monitor-simulate","newsletter-monitor-simulation",
  "newsletter-monitor-attempts","newsletter-monitor-delivered"])
  assert.ok(page.includes('id="'+id+'"'),id);
 assert.match(page,/newsletter-monitor\.js\?v=1/);
 assert.match(ui,/client\.auth\.getUser\(\)/);
 assert.match(ui,/client\.auth\.getSession\(\)/);
 assert.match(ui,/node\.textContent|\.textContent=/);
 assert.doesNotMatch(ui,/innerHTML|outerHTML|insertAdjacentHTML/);
 assert.match(ui,/addEventListener\("click"/);
 assert.match(ui,/kind:"simulate"/);
 assert.match(ui,/kind:"overview"/);
 assert.doesNotMatch(ui,/RESEND_API_KEY|NEWSLETTER_UNSUBSCRIBE_SECRET|recipient_email/);
});
