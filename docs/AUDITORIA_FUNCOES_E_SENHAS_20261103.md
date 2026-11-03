# Arquivo Sombrio — Segurança de senhas e funções privilegiadas
Data de verificação: 03/11/2026. Escopo: Supabase `iuhotznurbyujzbyhizf`, autenticação pública, senha redefinida, permissões PostgreSQL.

## Resultado verificado
1. O Supabase da organização está no **plano Free**. O Security Advisor registra `auth_leaked_password_protection` como WARN. A checagem nativa com Have I Been Pwned exige **Pro ou superior**, conforme [documentação oficial](https://supabase.com/docs/guides/auth/password-security). Nenhum upgrade, cobrança ou alteração de plano foi realizada.
2. Os cadastros públicos do fórum, formulário seguro e narração tinham requisitos inconsistentes: alguns de seis caracteres, outro de oito. A redefinição de senha já exigia 12 caracteres, maiúscula, minúscula, número e símbolo. Os três cadastros foram alinhados a esse padrão no **frontend**. Não se afirma que essa validação possa impedir chamadas diretas à API de autenticação. Para obrigatoriedade de servidor, configurar os requisitos no Supabase Auth e comprovar o comportamento com chamada autenticada de teste.
3. O aviso `authenticated_security_definer_function_executable` aponta duas funções:
   - `admin_v2_campaign_cover_diagnostics()`: proprietário `postgres`, `SECURITY DEFINER`, `search_path=''`; EXECUTE apenas para `authenticated` e owner. Verifica `auth.uid()` e `public.is_arquivo_sombrio_admin()` antes de produzir diagnóstico. A validação de administrador consulta `app_metadata.role` no JWT, não campos de `user_metadata`. Necessária ao painel administrativo.
   - `request_account_deletion(text)`: proprietário `postgres`, `SECURITY DEFINER`, `search_path=''`; EXECUTE apenas para `authenticated` e owner. Exige `auth.uid()`, valida escolhas `delete_all` / `review_for_anonymization` e limita exclusões e alterações de contribuições ao `user_id` autenticado. É chamada por `supabase/functions/delete-own-account/index.ts`.
4. O aviso de RLS habilitada sem policy em 13 tabelas **é INFO**, compatível com tabelas de serviço privadas. Não foram criadas policies/grants públicos para ocultá-lo.

## Testes realizados
- Consultas de grants no catálogo comprovaram que `anon` não possui EXECUTE nas duas funções; `authenticated` possui nos contratos que precisam dele.
- Em transação SQL revertida com `SET LOCAL ROLE authenticated` e JWT **simulado de usuário comum**, a função de diagnósticos negou a chamada com SQLSTATE `42501`, como esperado. Não foi invocada função de administração como administrador, e nenhum dado real foi modificado.
- Em transação SQL revertida, chamada à rotina de exclusão com opção inválida foi negada. **Nenhuma opção válida de exclusão foi executada.**
- Testes automatizados adicionados para preservar a política de senha, as condições de autorização no código e o cadastro com CAPTCHA; incluem rejeição de senhas fracas antes do envio à API. Os resultados finais do GitHub Actions devem ser consultados após a abertura do PR.

## Decisões técnicas
**Não revogar o EXECUTE das duas funções sinalizadas sem redesenhar os fluxos.** O alerta é de exposição potencial inerente a SECURITY DEFINER; a análise atual não identificou exploração específica. Alterar indiscriminadamente poderia bloquear diagnóstico de campanhas e exclusão de contas.

**Não implementar suposta verificação de senhas vazadas somente em JavaScript** nem afirmar que essa função seria substituto à proteção nativa: um cliente poderia contorná-la e sua disponibilidade dependeria de serviços externos.

**Não forçar troca de senha em usuários antigos.** As regras de criação de conta não se aplicam retroativamente; o fluxo de login permanece igual.

## Riscos residuais e critérios de conclusão
- [ ] Habilitar proteção nativa de senha vazada mediante mudança autorizada para Pro ou mecanismo alternativo obrigatório no servidor adequadamente projetado, testado e documentado.
- [ ] Confirmar e configurar políticas de senha no painel Auth (comprimento/composição) e testar uma tentativa de cadastro abaixo do mínimo pela API. **Frontend não é servidor**.
- [ ] Testar login/recuperação de conta, token expirado, usuário comum versus admin, e exclusão de conta **com usuário descartável**, incluindo limpeza de Storage e solicitação por novo cadastro.
- [ ] Revisar riscos de sessão longa e necessidade de reautenticação para exclusão irreversível antes de alterar o fluxo.
- [ ] Confirmar atualização de índices e comportamento do painel administrativo, sem retirar o acesso legítimo.
- [ ] Reexecutar [Security Advisor](https://supabase.com/dashboard/project/iuhotznurbyujzbyhizf/advisors/security) periodicamente; avisos residuais não são, isoladamente, prova de vulnerabilidade.

## Referências
- [Password security — Supabase](https://supabase.com/docs/guides/auth/password-security)
- [Database Advisor — funções SECURITY DEFINER](https://supabase.com/docs/guides/observability/advisors?queryGroups=lint&lint=0029_authenticated_security_definer_function_executable)
- [Production checklist — Supabase](https://supabase.com/docs/guides/security/production-checklist)
