import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");
const backend=read("supabase/functions/newsletter-distribution/index.ts");
const schema=read("supabase/migrations/20261101_newsletter_distribution_queue.sql");
const events=read("supabase/migrations/20261101_newsletter_delivery_events_trigger.sql");
const grants=read("supabase/migrations/20261101_newsletter_service_role_grants.sql");
const panel=read("admin-v2/newsletter.html");
const ui=read("admin-v2/js/newsletter-distribution.js");
const unsubscribe=read("descadastrar-newsletter.html");

test("staging module does not itself send mail or schedule jobs",()=>{
 assert.doesNotMatch(backend,/api\.resend\.com|sendEmail|sendBatch|\/emails\b|Deno\.cron/i);
 assert.match(backend,/emails_sent:0/);
 assert.match(backend,/dispatch_enabled:false/);
 assert.doesNotMatch(ui,/api\.resend\.com|RESEND_API_KEY/);
 assert.match(panel,/Não há envio automático/i);
});
test("prepare is exclusively administrative, confirmed recipients and idempotent",()=>{
 assert.match(backend,/db\.auth\.getUser\(bearer\)/);
 assert.match(backend,/user\.app_metadata\?\.role!=="admin"/);
 assert.match(schema,/s\.status = 'confirmado' and s\.confirmed_at is not null/);
 assert.match(schema,/unique \(edition_id,subscriber_id\)/);
 assert.match(schema,/on conflict \(edition_id,subscriber_id\) do nothing/);
 assert.match(schema,/status = 'aprovado'/);
});
test("service role is sole database queue RPC caller; public roles have no queue access",()=>{
 assert.match(schema,/security invoker set search_path = ''/);
 assert.match(schema,/revoke all on public\.editorial_newsletter_delivery_queue from public,anon,authenticated/);
 assert.match(schema,/revoke all on public\.editorial_newsletter_delivery_events from public,anon,authenticated/);
 assert.match(schema,/revoke all on function public\.editorial_prepare_newsletter_queue\(uuid\) from public,anon,authenticated/);
 assert.match(schema,/grant execute on function public\.editorial_prepare_newsletter_queue\(uuid\) to service_role/);
 assert.match(schema,/enable row level security/g);
});
test("editions are frozen after successful queue preparation",()=>{
 assert.match(schema,/before update on public\.editorial_newsletter_editions/);
 assert.match(schema,/new\.body_text/);
 assert.match(schema,/new\.status/);
 assert.match(schema,/com fila preparada/);
});
test("events append transactionally on changes, not through public input",()=>{
 assert.match(events,/after insert or update of status/);
 assert.match(events,/insert into public\.editorial_newsletter_delivery_events/);
 assert.match(events,/new\.status is distinct from old\.status/);
 assert.match(schema,/unique\(provider_event_id\)/);
});
test("unsubscribe is POST only, signed, needs real user confirmation and remains private",()=>{
 assert.match(backend,/crypto\.subtle\.verify\("HMAC"/);
 assert.match(backend,/NEWSLETTER_UNSUBSCRIBE_SECRET/);
 assert.match(backend,/kind==="unsubscribe"/);
 assert.match(backend,/\.eq\("status","confirmado"\)/);
 assert.match(backend,/\.eq\("status","preparado"\)/);
 assert.match(unsubscribe,/meta name="robots" content="noindex,nofollow,noarchive"/);
 assert.match(unsubscribe,/history\.replaceState/);
 assert.match(unsubscribe,/button\.addEventListener\("click"/);
 assert.doesNotMatch(unsubscribe,/location\.search/);
 assert.ok(unsubscribe.indexOf('button.addEventListener("click"')<unsubscribe.indexOf('kind:"unsubscribe"'));
});
test("subscriber private data and API secrets are never included in admin response",()=>{
 assert.match(backend,/\.select\("id,title,subject,status,updated_at"\)/);
 assert.match(backend,/\.select\("id",\{count:"exact",head:true\}\)/);
 assert.doesNotMatch(backend,/\.select\("email/);
 assert.doesNotMatch(ui,/innerHTML|outerHTML|insertAdjacentHTML/);
 assert.doesNotMatch(backend,/console\.log\(.*email/);
});
test("bounded request body and explicit origin allowlist",()=>{
 assert.match(backend,/if\(total>4096\)/);
 assert.match(backend,/await reader\.cancel\(\)/);
 assert.match(backend,/!origins\.has\(origin\)/);
 assert.match(backend,/if\(req\.method!=="POST"/);
});
test("admin page includes accessible feedback and separate staging",()=>{
 for(const id of ["newsletter-queue-panel","newsletter-queue-prepare","newsletter-queue-message",
  "newsletter-queue-edition","newsletter-queue-prepared"])assert.ok(panel.includes(id));
 assert.match(panel,/role="status" aria-live="polite"/);
 assert.match(ui,/window\.confirm/);
 assert.match(ui,/kind,...fields/);
 assert.doesNotMatch(ui,/\.send\(|\.sendEmail\(/);
});

test("existing private newsletter tables grant only required server privileges",()=>{
 assert.match(grants,/grant select on public\.editorial_newsletter_editions to service_role/);
 assert.match(grants,/grant select,insert,update on public\.editorial_newsletter_subscribers to service_role/);
 assert.doesNotMatch(grants,/grant .* to anon/);
 assert.doesNotMatch(grants,/grant .* to authenticated/);
});
