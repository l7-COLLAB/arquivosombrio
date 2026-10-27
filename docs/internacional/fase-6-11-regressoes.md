# Fase 6.11 — regressões automatizadas antes da integração

**Situação:** suíte de verificação estática preparada no GitHub. Não foram executadas migrações nem testes de escrita no banco real.

## Implementação
- `scripts/test-internacional-seguranca.mjs` usa o executor nativo Node.js (`node --test`) para examinar as alterações das fases 6.1–6.10.
- Verifica RLS, ausência de acesso público, ausência de permissões diretas de escrita, restrição de RPCs, controle de revisão, auditoria, proteção de origem, bloqueio de publicação e bloqueio dos botões no Admin V2.
- Confirma que os idiomas registrados permanecem pilotos e que nenhuma tradução foi marcada como publicada.
- Não confundir esses testes de código com execução de SQL real ou teste de tokens JWT.

## Comandos de verificação
```sh
node --test scripts/test-internacional-seguranca.mjs
node scripts/validar-conteudos-internacionais.mjs
```

## Bloqueios para ligar o salvamento real
1. Criar um PostgreSQL/Supabase de desenvolvimento isolado, com custo autorizado se aplicável.
2. Aplicar SQL 6.8 revisado apenas nesse ambiente e rodar testes de criação, conflito, auditoria e permissões reais.
3. Inspecionar `SECURITY DEFINER`, acesso a `auth.sessions`, privilégios da função e risco de JWT revogado.
4. Realizar testes funcionais do Admin V2 em desktop e celular, com usuário administrador.
5. Habilitar a gravação apenas após os testes acima e definição de rollback. Publicação permanece bloqueada.

## Próxima fase proposta — 6.12
Implementar testes de integração em ambiente seguro quando disponível, corrigir incompatibilidades identificadas e preparar o fluxo real de salvamento de rascunhos.
