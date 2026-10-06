-- Imported Garimpo records were ahead of the identity sequence. Move forward only.
begin;
lock table public.casos_diarios in share row exclusive mode;
select setval(pg_get_serial_sequence('public.casos_diarios','id'),greatest(coalesce((select max(id) from public.casos_diarios),1),(select last_value from public.casos_diarios_id_seq)),true);
commit;
