-- Arquivo Sombrio: diagnóstico administrativo das capas agendadas.
-- A função é executada com privilégios restritos por checagem obrigatória de JWT de administrador.
CREATE OR REPLACE FUNCTION public.admin_v2_campaign_cover_diagnostics()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $f$
DECLARE result jsonb;
BEGIN
 IF auth.uid() IS NULL OR NOT public.is_arquivo_sombrio_admin() THEN
  RAISE EXCEPTION 'Acesso administrativo necessário' USING ERRCODE='42501';
 END IF;
 WITH t AS (
 SELECT p.id, left(coalesce(p.payload->>'title',p.id),140) title, p.publish_at,
 (coalesce(p.payload->>'heroImage','') LIKE 'staging:%') hero_private,
 (coalesce(p.payload->>'cardImage','') LIKE 'staging:%') card_private,
 CASE WHEN r.hero_ref IS NOT DISTINCT FROM p.payload->>'heroImage'
 AND r.card_ref IS NOT DISTINCT FROM p.payload->>'cardImage'
 THEN coalesce(r.failures,0) ELSE 0 END failures,
 CASE WHEN r.hero_ref IS NOT DISTINCT FROM p.payload->>'heroImage'
 AND r.card_ref IS NOT DISTINCT FROM p.payload->>'cardImage'
 THEN r.last_error_code END error_code,
 CASE WHEN r.hero_ref IS NOT DISTINCT FROM p.payload->>'heroImage'
 AND r.card_ref IS NOT DISTINCT FROM p.payload->>'cardImage'
 THEN r.retry_at END retry_at
 FROM public.published_campaigns p LEFT JOIN public.campaign_cover_retries r
 ON r.campaign_id=p.id
 ), counts AS (
 SELECT count(*) total,count(*) FILTER(WHERE publish_at>now()) scheduled,
 count(*) FILTER(WHERE publish_at>now() AND (hero_private OR card_private)) private_scheduled,
 count(*) FILTER(WHERE publish_at<=now() AND (hero_private OR card_private)) due_pending,
 count(*) FILTER(WHERE publish_at<=now() AND failures>0 AND (hero_private OR card_private)) retrying,
 count(*) FILTER(WHERE publish_at<=now() AND NOT (hero_private OR card_private)) released FROM t
 )
 SELECT jsonb_build_object(
  'generated_at',now(),
  'summary',jsonb_build_object('total',c.total,'scheduled',c.scheduled,
   'private_scheduled',c.private_scheduled,'due_pending',c.due_pending,
   'retrying',c.retrying,'released',c.released,
   'draft_private',(SELECT count(*) FROM public.editorial_campaigns e WHERE
      coalesce(e.payload->>'heroImage','') LIKE 'staging:%'
      OR coalesce(e.payload->>'cardImage','') LIKE 'staging:%')),
  'job',(SELECT jsonb_build_object('active',j.active,'schedule',j.schedule,
    'last_run_at',(SELECT d.start_time FROM cron.job_run_details d WHERE d.jobid=j.jobid ORDER BY d.start_time DESC LIMIT 1),
    'last_run_status',(SELECT d.status FROM cron.job_run_details d WHERE d.jobid=j.jobid ORDER BY d.start_time DESC LIMIT 1))
    FROM cron.job j WHERE j.jobname='arquivo_campaign_covers_auto_promotion' LIMIT 1),
  'items',(SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) FROM (
   SELECT id,title,publish_at,hero_private,card_private,failures,error_code,retry_at,
   CASE WHEN publish_at<=now() AND (hero_private OR card_private) AND failures>0 THEN 'retry'
    WHEN publish_at<=now() AND (hero_private OR card_private) THEN 'due'
    WHEN publish_at>now() AND (hero_private OR card_private) THEN 'scheduled_private'
    ELSE 'scheduled' END state
   FROM t WHERE publish_at>now() OR hero_private OR card_private
   ORDER BY publish_at,id LIMIT 30
  ) x)
 ) INTO result FROM counts c;
 RETURN result;
END $f$;
REVOKE ALL ON FUNCTION public.admin_v2_campaign_cover_diagnostics() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_v2_campaign_cover_diagnostics() TO authenticated;
