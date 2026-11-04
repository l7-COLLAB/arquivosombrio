-- Arquivo Sombrio Edições: manuscritos estritamente privados.
-- Aplicado no projeto Supabase em 04/11/2026.
create table if not exists public.editorial_books (
 id uuid primary key default gen_random_uuid(),
 slug text not null unique check(slug ~ '^[a-z0-9-]{3,90}$'),
 title text not null check(char_length(title) between 1 and 200),
 subtitle text not null default '',
 planned_chapters integer not null default 30 check(planned_chapters between 1 and 200),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.editorial_chapters (
 id uuid primary key default gen_random_uuid(),
 book_id uuid not null references public.editorial_books(id) on delete restrict,
 chapter_number integer not null check(chapter_number between 1 and 200),
 title text not null check(char_length(title) between 1 and 250),
 body text not null default '',
 status text not null default 'planejado'
   check(status in ('planejado','a_importar','rascunho','revisao')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(book_id,chapter_number)
);
create index if not exists editorial_chapters_book_number_idx
 on public.editorial_chapters(book_id,chapter_number);
alter table public.editorial_books enable row level security;
alter table public.editorial_chapters enable row level security;
revoke all on public.editorial_books from public,anon,authenticated;
revoke all on public.editorial_chapters from public,anon,authenticated;
grant select,insert,update on public.editorial_books to authenticated;
grant select,insert,update on public.editorial_chapters to authenticated;
create policy editorial_books_admin_select on public.editorial_books for select
 to authenticated using ((select public.is_arquivo_sombrio_admin()));
create policy editorial_books_admin_insert on public.editorial_books for insert
 to authenticated with check ((select public.is_arquivo_sombrio_admin()));
create policy editorial_books_admin_update on public.editorial_books for update
 to authenticated using ((select public.is_arquivo_sombrio_admin()))
 with check ((select public.is_arquivo_sombrio_admin()));
create policy editorial_chapters_admin_select on public.editorial_chapters for select
 to authenticated using ((select public.is_arquivo_sombrio_admin()));
create policy editorial_chapters_admin_insert on public.editorial_chapters for insert
 to authenticated with check ((select public.is_arquivo_sombrio_admin()));
create policy editorial_chapters_admin_update on public.editorial_chapters for update
 to authenticated using ((select public.is_arquivo_sombrio_admin()))
 with check ((select public.is_arquivo_sombrio_admin()));
insert into public.editorial_books(slug,title,subtitle,planned_chapters)
 values('oficio-do-espanto','O Ofício do Espanto','Livro I — O assassinato de Fualdès',30)
 on conflict(slug) do nothing;
with planned(chapter_number,title) as (values
 (1,'Rodez, março de 1817'),(2,'Os homens de sua confiança'),
 (3,'A conspiração de Rodez'),(4,'Dois mil francos'),
 (5,'A saída de casa'),(6,'O corpo no Aveyron'),
 (7,'A bengala na rua du Terral'),(8,'O lenço de Anne Benoît'),
 (9,'A casa Bancal'),(10,'Os moradores'),
 (11,'Os primeiros interrogatórios'),(12,'As primeiras prisões'),
 (13,'Joseph Bousquier'),(14,'Jausion e Bastide-Gramont'),
 (15,'Clarisse Manson'),(16,'Rose Pierret'),
 (17,'A história dos músicos'),(18,'A acusação de junho'),
 (19,'Onze acusados'),(20,'Os depoimentos'),
 (21,'Versões em conflito'),(22,'A defesa'),
 (23,'O primeiro veredito'),(24,'A sentença anulada'),
 (25,'Um novo julgamento'),(26,'Clarisse novamente'),
 (27,'As testemunhas de Albi'),(28,'A decisão de maio'),
 (29,'3 de junho de 1818'),(30,'O último julgamento'))
insert into public.editorial_chapters(book_id,chapter_number,title,status)
select b.id,p.chapter_number,p.title,
 case when p.chapter_number<=8 then 'a_importar' else 'planejado' end
from public.editorial_books b cross join planned p
where b.slug='oficio-do-espanto'
on conflict(book_id,chapter_number) do nothing;
