-- Expansão do Atlas Criminal e curadoria administrativa separada do acervo.
alter table public.case_atlas_locations add column if not exists review_reference text;
alter table public.case_atlas_locations add column if not exists review_note text;
alter table public.case_atlas_locations add column if not exists reviewed_at timestamptz;
alter table public.case_atlas_locations add column if not exists updated_at timestamptz not null default now();
comment on column public.case_atlas_locations.review_reference is 'Documento ou campo editorial que fundamenta a relação entre o caso e a cidade.';
comment on column public.case_atlas_locations.reviewed_at is 'Data de revisão efetiva futura; nulo para a carga inicial, cuja data histórica não foi registrada.';
update public.case_atlas_locations set review_reference =
 'Metadado local do ' || case when dossier_id is not null then 'Dossiê #' || dossier_id::text else 'Garimpo #' || daily_id::text end
where review_reference is null;
do $$ begin
 if not exists (select 1 from pg_constraint where conname='atlas_review_requires_reference' and conrelid='public.case_atlas_locations'::regclass) then
   alter table public.case_atlas_locations add constraint atlas_review_requires_reference
      check (not reviewed or length(btrim(coalesce(review_reference,''))) >= 12);
 end if;
 if not exists (select 1 from pg_constraint where conname='atlas_active_requires_review' and conrelid='public.case_atlas_locations'::regclass) then
   alter table public.case_atlas_locations add constraint atlas_active_requires_review check(not is_active or reviewed);
 end if;
end $$;
revoke all on public.case_atlas_locations from authenticated;
grant select,insert,update on public.case_atlas_locations to authenticated;
create policy "Atlas administração vê locais pendentes" on public.case_atlas_locations
 for select to authenticated using ((select public.is_arquivo_sombrio_admin()));
create policy "Atlas administração cadastra" on public.case_atlas_locations
 for insert to authenticated with check ((select public.is_arquivo_sombrio_admin()));
create policy "Atlas administração altera" on public.case_atlas_locations
 for update to authenticated
 using ((select public.is_arquivo_sombrio_admin()))
 with check ((select public.is_arquivo_sombrio_admin()));
-- Não há DELETE pela API para permitir correção/desativação sem perda de rastreabilidade.
-- Coordenadas ilustrativas: centro urbano, não domicílios nem posição exata do crime.
insert into public.case_atlas_locations
(dossier_id,daily_id,place_key,country,state_region,city,neighborhood,latitude,longitude,event_year,location_precision,reviewed,is_active,review_reference,review_note)
select
 v.dossier_id,v.daily_id,v.place_key,v.country,v.state_region,v.city,v.neighborhood,
 v.latitude,v.longitude,v.event_year,v.location_precision,true,true,
 case when v.dossier_id is not null then 'Campo local e período do Dossiê #' || v.dossier_id::text
      else 'Campo local e data_caso do Garimpo #' || v.daily_id::text end,
 'Referência geográfica aproximada ao centro da cidade; sem indicar endereço da ocorrência.'
from (values
 (10,null,'decatur-georgia','Estados Unidos','Geórgia','Decatur',null,33.7748,-84.2963,1968,'city'),
 (11,null,'frederick-colorado','Estados Unidos','Colorado','Frederick',null,40.0992,-104.9372,2018,'city'),
 (17,null,'perris-california','Estados Unidos','Califórnia','Perris',null,33.7825,-117.2286,2018,'city'),
 (19,null,'port-coquitlam','Canadá','Colúmbia Britânica','Port Coquitlam',null,49.2628,-122.7811,1997,'city'),
 (21,null,'knoxville-tennessee','Estados Unidos','Tennessee','Knoxville',null,35.9606,-83.9207,1995,'city'),
 (25,null,'vallejo-california','Estados Unidos','Califórnia','Vallejo',null,38.1041,-122.2566,2015,'city'),
 (26,null,'omaha-nebraska','Estados Unidos','Nebraska','Omaha',null,41.2565,-95.9345,2012,'city'),
 (27,null,'erie-pennsylvania','Estados Unidos','Pensilvânia','Erie',null,42.1292,-80.0851,2003,'city'),
 (null,2,'des-moines-iowa','Estados Unidos','Iowa','Des Moines',null,41.5868,-93.625,1987,'city'),
 (null,3,'cleveland-ohio','Estados Unidos','Ohio','Cleveland',null,41.4993,-81.6944,2019,'city'),
 (null,4,'wisbech-uk','Reino Unido','Inglaterra','Wisbech',null,52.6665,0.1595,2013,'city'),
 (null,6,'washington-dc','Estados Unidos','Distrito de Colúmbia','Washington',null,38.9072,-77.0369,2014,'city'),
 (null,8,'hickory-nc','Estados Unidos','Carolina do Norte','Hickory',null,35.7345,-81.3445,2010,'city'),
 (null,10,'salisbury-nc','Estados Unidos','Carolina do Norte','Salisbury',null,35.6709,-80.4742,2011,'city'),
 (null,11,'dickinson-tx','Estados Unidos','Texas','Dickinson',null,29.4608,-95.0513,1990,'city'),
 (null,12,'sedro-woolley-wa','Estados Unidos','Washington','Sedro-Woolley',null,48.5039,-122.236,2011,'city'),
 (null,14,'houston-tx','Estados Unidos','Texas','Houston',null,29.7604,-95.3698,1970,'city'),
 (null,17,'palmdale-ca','Estados Unidos','Califórnia','Palmdale',null,34.5794,-118.1165,2012,'city'),
 (null,20,'newtown-connecticut','Estados Unidos','Connecticut','Newtown',null,41.414,-73.3036,2012,'city'),
 (null,21,'jeffersonville-indiana','Estados Unidos','Indiana','Jeffersonville',null,38.2776,-85.7372,1992,'city'),
 (null,25,'london-uk','Reino Unido','Inglaterra','Londres',null,51.5072,-0.1276,1999,'city'),
 (null,26,'kansas-city-missouri','Estados Unidos','Missouri','Kansas City',null,39.0997,-94.5786,1984,'city'),
 (null,28,'burlington-nc','Estados Unidos','Carolina do Norte','Burlington',null,36.0957,-79.4378,1984,'city'),
 (null,29,'redding-ca','Estados Unidos','Califórnia','Redding',null,40.5865,-122.3917,2016,'city'),
 (null,31,'san-antonio-tx','Estados Unidos','Texas','San Antonio',null,29.4241,-98.4936,1994,'city'),
 (null,34,'cottage-grove-mn','Estados Unidos','Minnesota','Cottage Grove',null,44.8277,-92.9438,2016,'city'),
 (null,35,'westfield-nj','Estados Unidos','Nova Jersey','Westfield',null,40.6589,-74.3474,1971,'city'),
 (null,36,'springfield-mo','Estados Unidos','Missouri','Springfield',null,37.2089,-93.2923,2015,'city'),
 (null,39,'tokyo-setagaya','Japão','Tóquio','Tóquio','Setagaya',35.6762,139.6503,2000,'city'),
 (null,53,'pasadena-texas','Estados Unidos','Texas','Pasadena',null,29.6911,-95.2091,1974,'city'),
 (null,62,'oil-city-pennsylvania','Estados Unidos','Pensilvânia','Oil City',null,41.4339,-79.7064,1992,'city'),
 (null,64,'napa-california','Estados Unidos','Califórnia','Napa',null,38.2975,-122.2869,2004,'city'),
 (null,65,'pasadena-california','Estados Unidos','Califórnia','Pasadena',null,34.1478,-118.1445,1993,'city'),
 (null,66,'bogota','Colômbia','Bogotá D.C.','Bogotá',null,4.711,-74.0721,2010,'city')
) as v(dossier_id,daily_id,place_key,country,state_region,city,neighborhood,latitude,longitude,event_year,location_precision)
where (v.dossier_id is not null and exists(select 1 from public."Casos" d where d.id=v.dossier_id and d.status_publicacao='publicado'))
   or (v.daily_id is not null and exists(select 1 from public.casos_diarios g where g.id=v.daily_id and g.status_publicacao='publicado'))
on conflict do nothing;