-- Atlas Criminal: corrigir exposição de notas internas e liberar especiais factuais publicados.
-- Aplicação em produção é transacional; nenhuma linha do acervo é apagada.
revoke select on public.case_atlas_locations from anon;
grant select (
 id,dossier_id,daily_id,place_key,country,state_region,city,neighborhood,
 latitude,longitude,event_year,location_precision,reviewed,is_active,created_at
) on public.case_atlas_locations to anon;
-- Leitor com sessão não recebe campos editoriais internos; o atlas público usa chave anônima.
drop policy if exists "Atlas apenas localidades publicadas" on public.case_atlas_locations;
create policy "Atlas apenas localidades publicadas" on public.case_atlas_locations
 for select to anon using (
  reviewed and is_active and (
    (dossier_id is not null and exists (
      select 1 from public."Casos" d
      where d.id=dossier_id and d.status_publicacao='publicado'
        and (d.published_at is null or d.published_at<=now())
        and coalesce(d.categoria,'') not ilike 'pericia%'
        and coalesce(d.categoria,'') not ilike 'perícia%'
    ))
    or (daily_id is not null and exists (
      select 1 from public.casos_diarios g
      where g.id=daily_id and g.status_publicacao='publicado'
        and (g.publicado_em is null or g.publicado_em<=now())
        and coalesce(g.categoria,'') not ilike 'pericia%'
        and coalesce(g.categoria,'') not ilike 'perícia%'
    ))
  )
 );
create or replace view public.case_atlas_public with (security_invoker=true) as
 select 'dossie'::text as source_type,d.id as source_id,d.titulo as title,
        left(coalesce(d.resumo,''),230) as summary,
        l.country,l.state_region,l.city,l.neighborhood,l.latitude,l.longitude,
        l.event_year,l.location_precision
 from public.case_atlas_locations l
 join public."Casos" d on d.id=l.dossier_id
 where l.reviewed and l.is_active and d.status_publicacao='publicado'
   and (d.published_at is null or d.published_at<=now())
   and coalesce(d.categoria,'') not ilike 'pericia%'
   and coalesce(d.categoria,'') not ilike 'perícia%'
 union all
 select 'garimpo'::text as source_type,g.id as source_id,g.titulo as title,
        left(coalesce(g.resumo,''),230) as summary,
        l.country,l.state_region,l.city,l.neighborhood,l.latitude,l.longitude,
        l.event_year,l.location_precision
 from public.case_atlas_locations l
 join public.casos_diarios g on g.id=l.daily_id
 where l.reviewed and l.is_active and g.status_publicacao='publicado'
   and (g.publicado_em is null or g.publicado_em<=now())
   and coalesce(g.categoria,'') not ilike 'pericia%'
   and coalesce(g.categoria,'') not ilike 'perícia%';
grant select on public.case_atlas_public to anon,authenticated;
comment on view public.case_atlas_public is 'Consulta geográfica pública com RLS security_invoker; especiais factuais publicados incluídos, textos internos omitidos.';