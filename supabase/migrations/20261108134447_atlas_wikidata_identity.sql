-- Identidade pública opcional para associar o mesmo caso entre o Atlas e a Wikipédia.
alter table public.case_atlas_locations
  add column wikidata_id text
  constraint case_atlas_locations_wikidata_id_check
  check (wikidata_id ~ '^Q[1-9][0-9]{0,11}$');

grant select (wikidata_id) on public.case_atlas_locations to anon;

create or replace view public.case_atlas_public with (security_invoker=true) as
 select 'dossie'::text as source_type,d.id as source_id,d.titulo as title,
        left(coalesce(d.resumo,''),230) as summary,
        l.country,l.state_region,l.city,l.neighborhood,l.latitude,l.longitude,
        l.event_year,l.location_precision,l.wikidata_id
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
        l.event_year,l.location_precision,l.wikidata_id
 from public.case_atlas_locations l
 join public.casos_diarios g on g.id=l.daily_id
 where l.reviewed and l.is_active and g.status_publicacao='publicado'
   and (g.publicado_em is null or g.publicado_em<=now())
   and coalesce(g.categoria,'') not ilike 'pericia%'
   and coalesce(g.categoria,'') not ilike 'perícia%';

comment on column public.case_atlas_locations.wikidata_id is
  'Identificador Wikidata do mesmo caso, revisado junto à localização. Nulo para registros sem correspondência validada.';

-- Dois vínculos de partida conferidos por acontecimento, cidade e ano.
-- https://www.wikidata.org/wiki/Q906933
update public.case_atlas_locations
set wikidata_id = 'Q906933'
where daily_id = 20 and city = 'Newtown' and event_year = 2012 and reviewed and is_active;

-- https://www.wikidata.org/wiki/Q112123052
update public.case_atlas_locations
set wikidata_id = 'Q112123052'
where daily_id = 16 and city = 'Uvalde' and event_year = 2022 and reviewed and is_active;
