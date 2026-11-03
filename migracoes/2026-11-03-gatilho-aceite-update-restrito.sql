-- Arquivo Sombrio — endurecimento do gatilho de aceite para OAuth, 03/11/2026.
-- Mudança compatível: não altera contas, metadados nem registros de aceite.
-- O trigger só dispara quando campos de consentimento/idade/versão mudam.
-- Modificações alheias ao aceite, como avatar ou nome público, são ignoradas.

drop trigger if exists on_auth_user_legal_acceptance_update on auth.users;

create trigger on_auth_user_legal_acceptance_update
after update of raw_user_meta_data on auth.users
for each row
when (
    new.raw_user_meta_data ->> 'legal_acceptance' = 'true'
    and (
        old.raw_user_meta_data ->> 'legal_acceptance'
          is distinct from new.raw_user_meta_data ->> 'legal_acceptance'
        or old.raw_user_meta_data ->> 'age_18_confirmed'
          is distinct from new.raw_user_meta_data ->> 'age_18_confirmed'
        or old.raw_user_meta_data ->> 'terms_version'
          is distinct from new.raw_user_meta_data ->> 'terms_version'
        or old.raw_user_meta_data ->> 'privacy_version'
          is distinct from new.raw_user_meta_data ->> 'privacy_version'
        or old.raw_user_meta_data ->> 'guidelines_version'
          is distinct from new.raw_user_meta_data ->> 'guidelines_version'
    )
)
execute function public.record_legal_acceptance();

-- A função continua validando explicitamente idade, aceite e versões.
-- Não modificar nem reconstruir histórico de public.legal_acceptances.
