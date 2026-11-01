-- Service-role permissions were explicitly absent on the earlier private tables.
-- Grant only server-side operations required by confirmed opt-in and queue staging.
-- anon has no privileges; authenticated keeps existing admin-scoped RLS SELECT.
begin;
grant select on public.editorial_newsletter_editions to service_role;
grant select,insert,update on public.editorial_newsletter_subscribers to service_role;
commit;
