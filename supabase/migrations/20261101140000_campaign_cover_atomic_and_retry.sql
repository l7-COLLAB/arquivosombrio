-- Arquivo Sombrio: proteção atômica e recuperação de capas programadas.
-- Correspondência das funções implantadas no Supabase (2026-11-01).
-- Para uso posterior em ambiente novo, a base precisa ter Supabase Storage instalado.
CREATE TABLE IF NOT EXISTS public.campaign_cover_retries (
 campaign_id text PRIMARY KEY,
 hero_ref text,
 card_ref text,
 failures integer NOT NULL DEFAULT 0 CHECK(failures BETWEEN 0 AND 10000),
 last_error_code text,
 retry_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.campaign_cover_retries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.campaign_cover_retries FROM PUBLIC,anon,authenticated;
CREATE INDEX IF NOT EXISTS campaign_cover_retry_at_idx
 ON public.campaign_cover_retries(retry_at);
CREATE INDEX IF NOT EXISTS published_campaign_covers_due_idx
 ON public.published_campaigns(publish_at,id)
 WHERE payload->>'heroImage' LIKE 'staging:%'
    OR payload->>'cardImage' LIKE 'staging:%';

CREATE OR REPLACE FUNCTION public.campaign_covers_clear_retry(p_id text)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ DELETE FROM public.campaign_cover_retries WHERE campaign_id=p_id $function$

CREATE OR REPLACE FUNCTION public.campaign_covers_finalize(p_id text, p_expected_hero text, p_expected_card text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE v_rows integer; v_public text := 'https://iuhotznurbyujzbyhizf.supabase.co/storage/v1/object/public/campaign-images/';
BEGIN
 IF NOT (coalesce(p_expected_hero,'') LIKE 'staging:%' OR coalesce(p_expected_card,'') LIKE 'staging:%') THEN RETURN false; END IF;
 UPDATE public.published_campaigns AS c
 SET payload = jsonb_set(
   jsonb_set(c.payload,'{heroImage}',
     CASE WHEN coalesce(p_expected_hero,'') LIKE 'staging:%'
       THEN to_jsonb(v_public || substring(p_expected_hero FROM 9))
       ELSE coalesce(c.payload->'heroImage','null'::jsonb) END,true),
   '{cardImage}',
   CASE WHEN coalesce(p_expected_card,'') LIKE 'staging:%'
     THEN to_jsonb(v_public || substring(p_expected_card FROM 9))
     ELSE coalesce(c.payload->'cardImage','null'::jsonb) END,true),
   updated_at=now()
 WHERE c.id=p_id
   AND c.publish_at<=now()
   AND c.payload->>'heroImage' IS NOT DISTINCT FROM p_expected_hero
   AND c.payload->>'cardImage' IS NOT DISTINCT FROM p_expected_card
   AND c.payload->>'slug' ~ '^[a-z0-9-]+$'
   AND (
     coalesce(p_expected_hero,'') NOT LIKE 'staging:%'
     OR (
       substring(p_expected_hero FROM 9) ~ '^[a-z0-9-]+/[a-z0-9-]+\.(png|webp|jpg)$'
       AND split_part(substring(p_expected_hero FROM 9),'/',1)=c.payload->>'slug'
     ))
   AND (
     coalesce(p_expected_card,'') NOT LIKE 'staging:%'
     OR (
       substring(p_expected_card FROM 9) ~ '^[a-z0-9-]+/[a-z0-9-]+\.(png|webp|jpg)$'
       AND split_part(substring(p_expected_card FROM 9),'/',1)=c.payload->>'slug'
     ));
 GET DIAGNOSTICS v_rows = ROW_COUNT;
 RETURN v_rows=1;
END
$function$

CREATE OR REPLACE FUNCTION public.campaign_covers_pending(p_limit integer DEFAULT 40)
 RETURNS TABLE(campaign_id text, campaign_payload jsonb, scheduled_at timestamp with time zone)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
 SELECT c.id,c.payload,c.publish_at
 FROM public.published_campaigns c
 LEFT JOIN public.campaign_cover_retries a ON a.campaign_id = c.id
 WHERE c.publish_at <= now()
 AND (c.payload->>'heroImage' LIKE 'staging:%' OR c.payload->>'cardImage' LIKE 'staging:%')
 AND (a.campaign_id IS NULL OR a.retry_at <= now()
      OR a.hero_ref IS DISTINCT FROM c.payload->>'heroImage'
      OR a.card_ref IS DISTINCT FROM c.payload->>'cardImage')
 ORDER BY c.publish_at,c.id
 LIMIT least(greatest(coalesce(p_limit,40),1),100)
$function$

CREATE OR REPLACE FUNCTION public.campaign_covers_record_failure(p_id text, p_hero text, p_card text, p_code text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE n integer;
BEGIN
 IF p_code IS NULL OR p_code !~ '^[a-z_]{3,50}$' THEN RETURN false; END IF;
 INSERT INTO public.campaign_cover_retries (campaign_id,hero_ref,card_ref,failures,last_error_code,retry_at,updated_at)
 SELECT c.id,p_hero,p_card,1,p_code,now()+interval '2 minutes',now()
 FROM public.published_campaigns c
 WHERE c.id=p_id AND c.publish_at<=now()
 AND c.payload->>'heroImage' IS NOT DISTINCT FROM p_hero
 AND c.payload->>'cardImage' IS NOT DISTINCT FROM p_card
 AND (coalesce(p_hero,'') LIKE 'staging:%' OR coalesce(p_card,'') LIKE 'staging:%')
 ON CONFLICT(campaign_id) DO UPDATE SET
   failures=CASE WHEN public.campaign_cover_retries.hero_ref IS NOT DISTINCT FROM excluded.hero_ref
    AND public.campaign_cover_retries.card_ref IS NOT DISTINCT FROM excluded.card_ref
    THEN least(public.campaign_cover_retries.failures+1,10000) ELSE 1 END,
   hero_ref=excluded.hero_ref,card_ref=excluded.card_ref,
   last_error_code=excluded.last_error_code,
   retry_at=now()+make_interval(mins=>
     least(60,
      power(2::numeric,least(
       CASE WHEN public.campaign_cover_retries.hero_ref IS NOT DISTINCT FROM excluded.hero_ref
         AND public.campaign_cover_retries.card_ref IS NOT DISTINCT FROM excluded.card_ref
         THEN least(public.campaign_cover_retries.failures+1,10000) ELSE 1 END,
       6))::integer
     )
   ),
   updated_at=now();
 GET DIAGNOSTICS n = ROW_COUNT;
 RETURN n=1;
END
$function$


REVOKE ALL ON FUNCTION public.campaign_covers_pending(integer) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.campaign_covers_finalize(text,text,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.campaign_covers_record_failure(text,text,text,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.campaign_covers_clear_retry(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.campaign_covers_pending(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.campaign_covers_finalize(text,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.campaign_covers_record_failure(text,text,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.campaign_covers_clear_retry(text) TO service_role;
