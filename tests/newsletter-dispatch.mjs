import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");
const dispatch=read("supabase/functions/newsletter-dispatch/index.ts");
const webhook=read("supabase/functions/newsletter-webhook/index.ts");
const migration=read("supabase/migrations/20261101_newsletter_safe_dispatch.sql");
const compat=read("supabase/migrations/20261101_newsletter_claim_compat.sql");
const ui=read("admin-v2/js/newsletter-send.js");
const page=read("admin-v2/newsletter.html");
const stage=read("supabase/functions/newsletter-distribution/index.ts");

test("live mailing is double gated and additionally checks domain and signing secrets",()=>{
 for(const key of ["NEWSLETTER_DISPATCH_ENABLED","NEWSLETTER_ENABLED",
  "NEWSLETTER_VERIFIED_DOMAIN","NEWSLETTER_UNSUBSCRIBE_SECRET","RESEND_API_KEY",
  "RESEND_WEBHOOK_SECRET"]) assert.match(dispatch,new RegExp(key));
 assert.match(dispatch,/NEWSLETTER_DISPATCH_ENABLED"\)==="true"/);
 assert.match(dispatch,/!active\)return reply/);
 assert.match(dispatch,/if\(!now\.active\)/);
 assert.doesNotMatch(dispatch,/Deno\.cron|setInterval|pg_cron/);
});
test("manual admin approval, real token, typed confirmation and public origin allowlist",()=>{
 assert.match(dispatch,/db\.auth\.getUser\(bearer\)/);
 assert.match(dispatch,/app_metadata\?\.role!=="admin"/);
 assert.match(dispatch,/str\(b,"confirmation"\)!=="ENVIAR"/);
 assert.match(dispatch,/!origins\.has\(origin\)/);
 assert.match(dispatch,/if\(req\.method!=="POST"/);
 assert.match(ui,/window\.prompt/);
 assert.match(ui,/confirm!=="ENVIAR"/);
 assert.match(page,/id="newsletter-send-now"[^>]*disabled/);
});
test("quota and frequency restrictions implemented at database claim with locking",()=>{
 assert.match(migration,/pg_advisory_xact_lock/);
 assert.match(migration,/for update of q skip locked/);
 assert.match(migration,/q\.attempts=0/);
 assert.match(migration,/interval '24 hours'/);
 assert.match(migration,/interval '7 days'/);
 assert.match(migration,/50-quota_used/);
 assert.match(compat,/least\(p_limit,greatest/);
 assert.match(migration,/p_limit > 5/);
 assert.match(dispatch,/p_limit:5/);
});
test("prepared recipients need verified opt-in when claimed and again before contact",()=>{
 assert.match(migration,/s\.status='confirmado' and s\.confirmed_at is not null/);
 assert.match(migration,/editorial_newsletter_can_send/);
 assert.match(dispatch,/editorial_newsletter_can_send/);
 assert.match(dispatch,/allowed!==true/);
 assert.match(stage,/\.eq\("status","preparado"\)/);
});
test("one attempt only and no automatic retry when network status is uncertain",()=>{
 assert.match(migration,/attempts=q\.attempts\+1/);
 assert.match(migration,/q\.attempts=0/);
 assert.match(dispatch,/await finish\("incerto"\)/);
 assert.match(dispatch,/Idempotency-Key/);
 assert.match(dispatch,/arquivo-newsletter-v1-/);
 assert.match(dispatch,/return "incerto"/);
 assert.doesNotMatch(dispatch,/for\s*\(.*retry|setTimeout|while\s*\(.*send/);
});
test("every body carries signed individual unsubscribe link consistent with stage 9",()=>{
 assert.match(dispatch,/arquivo-newsletter-unsubscribe:v1:/);
 assert.match(stage,/arquivo-newsletter-unsubscribe:v1:/);
 assert.match(dispatch,/crypto\.subtle\.sign\("HMAC"/);
 assert.match(stage,/crypto\.subtle\.verify\("HMAC"/);
 assert.match(dispatch,/descadastrar-newsletter\.html#token=/);
 assert.match(dispatch,/Cancelar inscrição:/);
 assert.match(dispatch,/List-Unsubscribe/);
});
test("provider webhook is verified from raw signed bytes with no CORS or anonymous database writes",()=>{
 assert.match(webhook,/import \{Webhook\} from "npm:svix@2\.9\.1"/);
 assert.match(webhook,/new Webhook\(secret\)\.verify\(content/);
 for(const field of ["svix-id","svix-timestamp","svix-signature"])assert.match(webhook,new RegExp(field));
 assert.match(webhook,/await rawBody\(req\)/);
 assert.match(webhook,/if\(total>16000\)/);
 assert.doesNotMatch(webhook,/Access-Control-Allow-Origin/);
 assert.match(migration,/revoke all on function public\.editorial_record_newsletter_provider_event.*from public,anon,authenticated/);
});
test("events are idempotent and suppress future deliveries after bounce and complaint",()=>{
 assert.match(migration,/provider_event_id=p_event_id/);
 assert.match(migration,/email\.bounced/);
 assert.match(migration,/email\.complained/);
 assert.match(migration,/status='cancelado',cancelled_at=/);
 assert.match(migration,/subscriber_id=subscriber and status='preparado'/);
 assert.match(webhook,/error\.code==="P0002"/);
});
test("no subscriber emails or private tokens in admin UI or public responses",()=>{
 assert.doesNotMatch(ui,/recipient_email|NEWSLETTER_UNSUBSCRIBE_SECRET|RESEND_API_KEY/);
 assert.doesNotMatch(dispatch,/reply\(\{[^}]*recipient_email/);
 assert.doesNotMatch(webhook,/console\.log\(.*data/);
 assert.doesNotMatch(ui,/innerHTML|outerHTML/);
});
