import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read=p=>fs.readFileSync(new URL("../"+p,import.meta.url),"utf8");
const sql=read("supabase/migrations/20261101_newsletter_reconciliation.sql");
const endpoint=read("supabase/functions/newsletter-monitor/index.ts");
const ui=read("admin-v2/js/newsletter-reconciliation.js");
const page=read("admin-v2/newsletter.html");

test("incidentes retornam identificadores opacos sem dados dos leitores",()=>{
 assert.match(sql,/editorial_newsletter_list_incidents\(p_limit integer default 10\)/);
 assert.match(sql,/security invoker set search_path = ''/);
 assert.match(sql,/jsonb_build_object/);
 assert.match(sql,/'delivery_id',i\.id/);
 assert.match(sql,/'can_mark_uncertain',i\.can_mark_uncertain/);
 assert.match(sql,/p_limit > 20/);
 assert.match(sql,/status='incerto'/);
 assert.match(sql,/status='aceito'/);
 assert.doesNotMatch(sql,/s\.email|recipient_email|verification_hash|subscriber_id/);
 assert.match(sql,/revoke all on function public\.editorial_newsletter_list_incidents\(integer\)\s+from public,anon,authenticated/);
 assert.match(sql,/grant execute on function public\.editorial_newsletter_list_incidents\(integer\)\s+to service_role/);
});

test("a marcação conservadora só alcança envios antigos e não agenda retransmissões",()=>{
 assert.match(sql,/editorial_newsletter_mark_stale_uncertain\(p_delivery uuid\)/);
 assert.match(sql,/set status='incerto',updated_at=pg_catalog\.now\(\)/);
 assert.match(sql,/status='em_envio'/);
 assert.match(sql,/attempts>=1/);
 assert.match(sql,/provider_message_id is null/);
 assert.match(sql,/dispatch_started_at <= pg_catalog\.now\(\)-interval '15 minutes'/);
 assert.match(sql,/return affected=1/);
 assert.doesNotMatch(sql,/set status='preparado'|set status='entregue'|set attempts=0/i);
 assert.doesNotMatch(sql,/create\s+extension\s+pg_cron|cron\.schedule|pg_net|http_post/i);
 assert.match(sql,/revoke all on function public\.editorial_newsletter_mark_stale_uncertain\(uuid\)\s+from public,anon,authenticated/);
 assert.match(sql,/grant execute on function public\.editorial_newsletter_mark_stale_uncertain\(uuid\)\s+to service_role/);
});

test("a Edge Function só opera sob admin validado e confirmação literal",()=>{
 assert.match(endpoint,/\["overview","simulate","incidents","mark_stale"\]/);
 assert.match(endpoint,/db\.auth\.getUser\(token\)/);
 assert.match(endpoint,/app_metadata\?\.role!=="admin"/);
 assert.match(endpoint,/security_consume_rate_limit/);
 assert.match(endpoint,/kind==="mark_stale"\?6:30/);
 assert.match(endpoint,/field\(body,"confirmation"\)!=="MARCAR INCERTO"/);
 assert.match(endpoint,/if\(!uuid\.test\(deliveryId\)\)/);
 assert.match(endpoint,/editorial_newsletter_list_incidents/);
 assert.match(endpoint,/editorial_newsletter_mark_stale_uncertain/);
 assert.match(endpoint,/data!==true/);
 assert.match(endpoint,/resend_scheduled:false/);
 assert.match(endpoint,/emails_sent:0/);
 assert.doesNotMatch(endpoint,/api\.resend\.com|editorial_claim_newsletter_batch|send_batch/);
});

test("Admin V2 requer ação explícita e exibe conteúdo com escaping",()=>{
 assert.match(page,/id="newsletter-reconciliation-panel"/);
 assert.match(page,/id="newsletter-incident-refresh"/);
 assert.match(page,/id="newsletter-incident-list"/);
 assert.match(page,/newsletter-reconciliation\.js\?v=1/);
 assert.match(ui,/client\.auth\.getUser\(\)/);
 assert.match(ui,/client\.auth\.getSession\(\)/);
 assert.match(ui,/window\.prompt/);
 assert.match(ui,/answer!=="MARCAR INCERTO"/);
 assert.match(ui,/kind.*mark_stale|api\("mark_stale"/);
 assert.match(ui,/\.textContent=/);
 assert.match(ui,/createElement/);
 assert.doesNotMatch(ui,/innerHTML|outerHTML|insertAdjacentHTML/);
 assert.doesNotMatch(ui,/recipient_email|RESEND_API_KEY|NEWSLETTER_UNSUBSCRIBE_SECRET/);
});
