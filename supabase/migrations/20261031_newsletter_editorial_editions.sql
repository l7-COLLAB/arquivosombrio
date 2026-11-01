-- Editorial-only newsletter drafts. Absolutely no sending, scheduling, or subscriber writes.
begin;
create table if not exists public.editorial_newsletter_editions (
 id uuid primary key default gen_random_uuid(),
 created_by uuid not null default auth.uid(),
 title text not null check (char_length(btrim(title)) between 3 and 120),
 subject text not null check (char_length(btrim(subject)) between 5 and 150),
 preheader text not null default '' check (char_length(preheader) <= 180),
 body_text text not null check (char_length(btrim(body_text)) between 100 and 12000),
 cta_label text not null default '' check (char_length(cta_label) <= 90),
 cta_url text not null default '' check (char_length(cta_url) <= 500),
 status text not null default 'rascunho'
  check (status in ('rascunho','revisao','aprovado','arquivado')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint editorial_newsletter_cta_pair check
  ((cta_label = '' and cta_url = '') or (char_length(btrim(cta_label)) > 0 and cta_url ~ '^https://[^[:space:]]+$'))
);
comment on table public.editorial_newsletter_editions is
 'Private editorial-only newsletter drafts; approval is not permission or mechanism to send. No subscriber links or automated delivery.';
create index if not exists editorial_newsletter_editions_last_edit_idx
 on public.editorial_newsletter_editions (updated_at desc);
alter table public.editorial_newsletter_editions enable row level security;
revoke all on public.editorial_newsletter_editions from public, anon, authenticated;
grant select, insert on public.editorial_newsletter_editions to authenticated;
grant update (title,subject,preheader,body_text,cta_label,cta_url,status,updated_at)
 on public.editorial_newsletter_editions to authenticated;
create policy editorial_newsletter_editions_admin_read on public.editorial_newsletter_editions
 for select to authenticated using ((select public.is_arquivo_sombrio_admin()));
create policy editorial_newsletter_editions_admin_insert on public.editorial_newsletter_editions
 for insert to authenticated with check
 ((select public.is_arquivo_sombrio_admin()) and created_by = (select auth.uid()));
create policy editorial_newsletter_editions_admin_update on public.editorial_newsletter_editions
 for update to authenticated using ((select public.is_arquivo_sombrio_admin()))
 with check ((select public.is_arquivo_sombrio_admin()));
commit;
