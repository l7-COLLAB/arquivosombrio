create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile_visibility text not null default 'private'
    check (profile_visibility in ('private', 'community')),
  show_bio boolean not null default false,
  show_activity boolean not null default false,
  notify_comments boolean not null default true,
  notify_replies boolean not null default true,
  notify_case_updates boolean not null default true,
  notify_admin boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

drop policy if exists "owner_select_user_preferences" on public.user_preferences;
create policy "owner_select_user_preferences"
on public.user_preferences for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "owner_insert_user_preferences" on public.user_preferences;
create policy "owner_insert_user_preferences"
on public.user_preferences for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "owner_update_user_preferences" on public.user_preferences;
create policy "owner_update_user_preferences"
on public.user_preferences for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "owner_delete_user_preferences" on public.user_preferences;
create policy "owner_delete_user_preferences"
on public.user_preferences for delete to authenticated
using ((select auth.uid()) = user_id);

revoke all on table public.user_preferences from anon;
grant select, insert, update, delete on table public.user_preferences to authenticated;
