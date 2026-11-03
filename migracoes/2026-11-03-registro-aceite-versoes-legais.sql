-- Arquivo Sombrio — coordenação de versões legais, 03/11/2026.
-- APLICAR NO BANCO ANTES DE PUBLICAR O FRONTEND QUE REGISTRA 1.2/1.4.
-- Aceita versões anteriores durante a transição; preserva registros históricos.
-- Função invocada somente por triggers de INSERT/UPDATE em auth.users.
create or replace function public.record_legal_acceptance()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_terms text := new.raw_user_meta_data ->> 'terms_version';
  v_privacy text := new.raw_user_meta_data ->> 'privacy_version';
  v_guidelines text := new.raw_user_meta_data ->> 'guidelines_version';
begin
  if new.raw_user_meta_data ->> 'age_18_confirmed' = 'true'
     and new.raw_user_meta_data ->> 'legal_acceptance' = 'true'
     and v_guidelines = '1.0'
     and (
       (v_terms = '1.1' and v_privacy = '1.2')
       or
       (v_terms = '1.2' and v_privacy = '1.4')
     )
  then
    insert into public.legal_acceptances
      (user_id, age_18_confirmed, terms_version, privacy_version, guidelines_version)
    values
      (new.id, true, v_terms, v_privacy, v_guidelines)
    on conflict (user_id, terms_version, privacy_version, guidelines_version)
    do nothing;
  end if;
  return new;
end;
$function$;

-- Esta função é utilizada como trigger; não é endpoint de API.
revoke all on function public.record_legal_acceptance() from public, anon, authenticated;

-- Captura também aceite após retorno de OAuth Google (updateUser),
-- que ocorre DEPOIS da criação inicial de auth.users.
-- O gatilho não reescreve versões já aceitas e ON CONFLICT evita duplicatas.
drop trigger if exists on_auth_user_legal_acceptance_update on auth.users;
create trigger on_auth_user_legal_acceptance_update
after update of raw_user_meta_data on auth.users
for each row
when (old.raw_user_meta_data is distinct from new.raw_user_meta_data)
execute function public.record_legal_acceptance();

-- Validação após aplicar:
-- select pg_get_functiondef('public.record_legal_acceptance()'::regprocedure);
-- select count(*) from public.legal_acceptances;
-- select tgname, pg_get_triggerdef(oid) from pg_trigger where tgrelid='auth.users'::regclass and tgname like '%legal_acceptance%';
-- Nunca atualizar retroativamente termos_version/privacy_version de aceites antigos.
