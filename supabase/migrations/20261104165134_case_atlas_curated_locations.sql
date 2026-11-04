-- Atlas Criminal: geografia editorial sem endereços privados.
create table if not exists public.case_atlas_locations (
 id bigint generated always as identity primary key,
 dossier_id bigint references public."Casos"(id) on delete restrict,
 daily_id bigint references public.casos_diarios(id) on delete restrict,
 place_key text not null,
 country text not null,
 state_region text,
 city text not null,
 neighborhood text,
 latitude numeric(9,6) not null check(latitude between -90 and 90),
 longitude numeric(9,6) not null check(longitude between -180 and 180),
 event_year integer not null check(event_year between 1000 and 2100),
 location_precision text not null default 'city' check(location_precision in ('city','metro','region')),
 reviewed boolean not null default false,
 is_active boolean not null default false,
 created_at timestamptz not null default now(),
 check ((dossier_id is null) <> (daily_id is null)),
 unique(dossier_id,place_key),
 unique(daily_id,place_key)
);
comment on table public.case_atlas_locations is 'Coordenadas da cidade ou região documentada, nunca endereços de pessoas.';
create index if not exists case_atlas_geo_active_idx on public.case_atlas_locations(country,state_region,city,event_year) where reviewed and is_active;
alter table public.case_atlas_locations enable row level security;
revoke all on public.case_atlas_locations from public,anon,authenticated;
grant select on public.case_atlas_locations to anon,authenticated;
create policy "Atlas apenas localidades publicadas" on public.case_atlas_locations for select to anon,authenticated using (
 reviewed and is_active and (
  (dossier_id is not null and exists (
    select 1 from public."Casos" d where d.id=dossier_id and d.status_publicacao='publicado'
    and (d.published_at is null or d.published_at<=now())
    and coalesce(d.categoria,'') not ilike 'pericia%' and coalesce(d.categoria,'') not ilike 'perícia%'
  )) or
  (daily_id is not null and exists (
    select 1 from public.casos_diarios g where g.id=daily_id and g.status_publicacao='publicado'
    and (g.publicado_em is null or g.publicado_em<=now())
    and coalesce(g.categoria,'') not ilike 'pericia%' and coalesce(g.categoria,'') not ilike 'perícia%'
    and coalesce(g.categoria,'') not ilike 'especial%'
  ))
 )
);
create or replace view public.case_atlas_public with (security_invoker=true) as
select 'dossie'::text source_type,d.id source_id,d.titulo title,left(coalesce(d.resumo,''),230) summary,
 l.country,l.state_region,l.city,l.neighborhood,l.latitude,l.longitude,l.event_year,l.location_precision
from public.case_atlas_locations l join public."Casos" d on d.id=l.dossier_id
where l.reviewed and l.is_active and d.status_publicacao='publicado'
and (d.published_at is null or d.published_at<=now())
and coalesce(d.categoria,'') not ilike 'pericia%' and coalesce(d.categoria,'') not ilike 'perícia%'
union all
select 'garimpo'::text,g.id,g.titulo,left(coalesce(g.resumo,''),230),
 l.country,l.state_region,l.city,l.neighborhood,l.latitude,l.longitude,l.event_year,l.location_precision
from public.case_atlas_locations l join public.casos_diarios g on g.id=l.daily_id
where l.reviewed and l.is_active and g.status_publicacao='publicado'
and (g.publicado_em is null or g.publicado_em<=now())
and coalesce(g.categoria,'') not ilike 'pericia%' and coalesce(g.categoria,'') not ilike 'perícia%'
and coalesce(g.categoria,'') not ilike 'especial%';
revoke all on public.case_atlas_public from public,anon,authenticated;
grant select on public.case_atlas_public to anon,authenticated;
comment on view public.case_atlas_public is 'Metadados mínimos; segurança invoker e filtro de publicações.';
insert into public.case_atlas_locations
(dossier_id,daily_id,place_key,country,state_region,city,neighborhood,latitude,longitude,event_year,location_precision,reviewed,is_active)
values
(4,null,'fall-river-ma','Estados Unidos','Massachusetts','Fall River',null,41.701500,-71.155000,1892,'city',true,true),
(5,null,'topeka-ks','Estados Unidos','Kansas','Topeka',null,39.047300,-95.675200,2002,'city',true,true),
(7,null,'boulder-co','Estados Unidos','Colorado','Boulder',null,40.015000,-105.270500,1996,'city',true,true),
(9,null,'praia-da-luz','Portugal','Algarve','Praia da Luz',null,37.086700,-8.731500,2007,'city',true,true),
(13,null,'beverly-hills-ca','Estados Unidos','Califórnia','Beverly Hills',null,34.073600,-118.400400,1989,'city',true,true),
(16,null,'wichita-ks','Estados Unidos','Kansas','Wichita',null,37.687200,-97.330100,1974,'city',true,true),
(28,null,'sao-paulo-sp','Brasil','São Paulo','São Paulo','Aclimação',-23.550500,-46.633300,1994,'city',true,true),
(100,null,'markham-on','Canadá','Ontário','Markham',null,43.856100,-79.337000,2010,'city',true,true),
(null,13,'indianapolis-in','Estados Unidos','Indiana','Indianápolis',null,39.768400,-86.158100,1965,'city',true,true),
(null,16,'uvalde-tx','Estados Unidos','Texas','Uvalde',null,29.209700,-99.786200,2022,'city',true,true),
(null,22,'toronto-on','Canadá','Ontário','Toronto',null,43.653200,-79.383200,2010,'city',true,true),
(null,24,'beslan-ossetia','Rússia','Ossétia do Norte','Beslan',null,43.190000,44.540000,2004,'city',true,true),
(null,27,'sao-paulo-rm','Brasil','São Paulo','São Paulo',null,-23.550500,-46.633300,2026,'metro',true,true),
(null,30,'sacramento-ca','Estados Unidos','Califórnia','Sacramento',null,38.581600,-121.494400,1982,'city',true,true),
(null,38,'bergen','Noruega','Vestland','Bergen',null,60.391300,5.322100,1970,'city',true,true),
(null,42,'varna','Bulgária','Varna','Varna',null,43.214100,27.914700,2014,'city',true,true),
(null,43,'los-angeles-ca','Estados Unidos','Califórnia','Los Angeles',null,34.052200,-118.243700,2013,'city',true,true),
(null,48,'londres','Reino Unido','Inglaterra','Londres',null,51.507200,-0.127600,1992,'city',true,true),
(null,49,'los-angeles-ca','Estados Unidos','Califórnia','Los Angeles',null,34.052200,-118.243700,1986,'city',true,true)
on conflict do nothing;