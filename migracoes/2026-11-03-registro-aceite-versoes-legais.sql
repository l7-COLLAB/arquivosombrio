-- Arquivo Sombrio — coordenação de versões legais, 03/11/2026.
-- APLICAR NO BANCO ANTES DE PUBLICAR O FRONTEND QUE REGISTRA 1.2/1.4.
-- Aceita versões anteriores durante a transição; preserva registros históricos.
-- Função invocada exclusivamente pelo trigger AFTER INSERT em auth.users.
begin;

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

commit;

-- Validação após aplicar:
-- select pg_get_functiondef('public.record_legal_acceptance()'::regprocedure);
-- select count(*) from public.legal_acceptances;
-- Nunca atualizar retroativamente termos_version/privacy_version de aceites antigos.
