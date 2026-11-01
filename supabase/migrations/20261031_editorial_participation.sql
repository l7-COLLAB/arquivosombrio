begin;

create table if not exists public.editorial_fiction_submissions (
  id uuid primary key default gen_random_uuid(),
  pen_name text not null check (char_length(btrim(pen_name)) between 2 and 90),
  contact_email text not null check (char_length(contact_email) between 5 and 254),
  title text not null check (char_length(btrim(title)) between 3 and 180),
  genre text not null check (genre in ('terror','suspense','misterio','fantasia_sombria','outro')),
  synopsis text not null check (char_length(btrim(synopsis)) between 80 and 2000),
  manuscript_excerpt text not null check (char_length(btrim(manuscript_excerpt)) between 500 and 18000),
  rights_declaration boolean not null check (rights_declaration = true),
  adult_declaration boolean not null check (adult_declaration = true),
  consent_review boolean not null check (consent_review = true),
  fingerprint text not null unique check (fingerprint ~ '^[0-9a-f]{64}$'),
  status text not null default 'recebido' check (status in ('recebido','em_analise','solicitar_ajustes','aprovado_para_contato','recusado')),
  editorial_notes text check (char_length(editorial_notes) <= 6000),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
comment on table public.editorial_fiction_submissions is 'Private unsolicited fiction manuscripts; never joins or publishes into novels, cases, or other public editorial tables.';
create index if not exists editorial_fiction_submissions_pending_idx
  on public.editorial_fiction_submissions (created_at desc)
  where status in ('recebido','em_analise');

create table if not exists public.editorial_newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (char_length(email) between 5 and 254 and email = lower(btrim(email))),
  status text not null default 'pendente' check (status in ('pendente','confirmado','cancelado')),
  verification_hash text not null unique check (verification_hash ~ '^[0-9a-f]{64}$'),
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  confirmation_requested_at timestamptz not null default now(),
  source text not null default 'participar',
  created_at timestamptz not null default now(),
  constraint editorial_newsletter_confirm_status check ((status = 'confirmado' and confirmed_at is not null) or status <> 'confirmado')
);
comment on table public.editorial_newsletter_subscribers is 'Private newsletter double-opt-in state. No one is eligible for campaigns until confirmed. No open read API.';
create index if not exists editorial_newsletter_confirmed_idx
  on public.editorial_newsletter_subscribers (created_at desc) where status = 'confirmado';

alter table public.editorial_fiction_submissions enable row level security;
alter table public.editorial_newsletter_subscribers enable row level security;

revoke all on public.editorial_fiction_submissions from anon, authenticated;
revoke all on public.editorial_newsletter_subscribers from anon, authenticated;
grant select, update on public.editorial_fiction_submissions to authenticated;
grant select on public.editorial_newsletter_subscribers to authenticated;

create policy editorial_fiction_admin_read on public.editorial_fiction_submissions
  for select to authenticated using ((select public.is_arquivo_sombrio_admin()));
create policy editorial_fiction_admin_update on public.editorial_fiction_submissions
  for update to authenticated using ((select public.is_arquivo_sombrio_admin()))
  with check ((select public.is_arquivo_sombrio_admin()));
create policy editorial_newsletter_admin_read on public.editorial_newsletter_subscribers
  for select to authenticated using ((select public.is_arquivo_sombrio_admin()));

commit;
