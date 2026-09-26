alter table public.admin_drafts drop constraint if exists admin_drafts_type_check;
alter table public.admin_drafts add constraint admin_drafts_type_check check (content_type = any (array['dossie'::text,'caso_diario'::text,'pericia'::text,'livro'::text,'lendas'::text,'creepypastas'::text]));
