grant select on table public.casos_diarios, public.pericias, public.lendas, public.creepypastas, public.novels, public.novel_capitulos to service_role;
grant select on table public.lite_admin_staging to authenticated;
drop policy if exists lite_admin_v2_admin_read on public.lite_admin_staging;
create policy lite_admin_v2_admin_read on public.lite_admin_staging for select to authenticated using ((select public.is_arquivo_sombrio_admin()));
