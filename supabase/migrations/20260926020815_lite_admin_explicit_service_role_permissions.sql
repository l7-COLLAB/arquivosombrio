grant select, insert, update, delete on table
  public.lite_admin_access_attempts,
  public.lite_admin_sessions,
  public.lite_admin_staging
to service_role;

grant usage, select on sequence public.lite_admin_access_attempts_id_seq to service_role;
