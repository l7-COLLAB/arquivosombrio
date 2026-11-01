import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const sharedScheduled=read('supabase/functions/promote-scheduled-campaign-covers/promotion-core.ts');
const sharedImmediate=read('supabase/functions/promote-campaign-covers/promotion-core.ts');
const scheduled=read('supabase/functions/promote-scheduled-campaign-covers/index.ts');
const immediate=read('supabase/functions/promote-campaign-covers/index.ts');
const sql=read('supabase/migrations/20261101140000_campaign_cover_atomic_and_retry.sql');

test('promotores usam a mesma implementação de segurança',()=>{
 assert.equal(sharedScheduled,sharedImmediate);
 assert.match(scheduled,/processCampaign\(db,row\)/);
 assert.match(immediate,/processCampaign\(db,row\.data\)/);
});
test('idempotência não aceita arquivos divergentes ou sobrescrita',()=>{
 assert.match(sharedScheduled,/upsert:false/);
 assert.match(sharedScheduled,/sameFile\(bytes,existingBytes\)/);
 assert.match(sharedScheduled,/public_image_collision/);
 assert.match(sharedScheduled,/SHA-256/);
 assert.match(sharedScheduled,/invalid_image_signature/);
});
test('publicação só conclui após verificação atômica de estado',()=>{
 assert.match(sharedScheduled,/campaign_covers_finalize/);
 assert.match(sql,/IS NOT DISTINCT FROM p_expected_hero/);
 assert.match(sql,/IS NOT DISTINCT FROM p_expected_card/);
 assert.match(sql,/c\.publish_at\s*<=\s*now\(\)/);
 assert.match(sql,/jsonb_set/);
});
test('fila prioriza somente capas vencidas e tem retentativa limitada',()=>{
 assert.match(scheduled,/campaign_covers_pending/);
 assert.match(scheduled,/p_limit:20/);
 assert.match(sql,/campaign_cover_retries/);
 assert.match(sql,/a\.retry_at <= now\(\)/);
 assert.match(sql,/make_interval/);
 assert.match(sql,/least\(60/);
});
test('chamada cron exige segredo e não expõe banco administrativo',()=>{
 assert.match(scheduled,/verify_campaign_cover_cron_token/);
 assert.match(scheduled,/Forbidden/);
 assert.match(sql,/REVOKE ALL ON FUNCTION public\.campaign_covers_pending\(integer\) FROM PUBLIC,anon,authenticated/);
 assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.campaign_covers_pending\(integer\) TO service_role/);
 assert.match(sql,/ALTER TABLE public\.campaign_cover_retries ENABLE ROW LEVEL SECURITY/);
});
