# Fase 6.10 — leitura de rascunhos e preparação de integração segura

**Estado:** mudanças no GitHub (PR #86), sem deploy e sem alteração do Supabase de produção.

## Melhorias feitas
- A versão proposta de `fase-6-8-rascunhos-seguros.sql` foi revisada para qualificar `pg_catalog.jsonb_typeof`, `pg_catalog.jsonb_array_length` e `pg_catalog.length` quando o `search_path` é vazio.
- Os acessos à linha de origem agora usam `FOR SHARE` na operação, evitando mudança concorrente dessa linha durante a transação.
- As RPCs fazem verificação explícita da sessão via `auth.sessions` além de `auth.uid()` e `app_metadata.role`. Reavaliar compatibilidade da consulta a `auth.sessions` com o owner/ambiente e claims de sessão antes da implantação.
- Adicionados limites de tamanho para blocos e fontes JSON. Ainda falta validação estrutural profunda.
- Editor `admin-v2/internacional/index.html` tenta leitura RLS da tradução selecionada, carregando `revision`, estado editorial, título, resumo, blocos e URLs de fontes. Ao detectar a ausência da tabela, continua como prévia local sem alegar que nada existe.
- A interface conserva os botões `Salvar` e `Enviar para revisão` **desabilitados**. Não foram ligadas RPCs de escrita.

## Procedimento de implantação e critérios bloqueadores
1. Obter ambiente de teste sem custo não autorizado e com backup apropriado.
2. Aplicar **somente** a versão revisada do SQL 6.8 no ambiente de ensaio; **não** executar SQL 6.6.
3. Compilar funções, verificar privilégios e executar testes como anon, usuário comum e admin; revalidar que `auth.sessions` funciona.
4. Testar consistência de blocos e URLs, `FOR SHARE`, travas concorrentes e falhas de sessão revogada.
5. Validar a consulta de rascunhos no navegador como administrador autenticado.
6. Implementar transições, logs e tratamento de conflitos observados em testes antes de ligar botão de gravar.
7. Rodar advisors de segurança/performance, conferir grants e definir rollback.

## Riscos ainda existentes
- O SQL continua **proposto**; não é evidência de funcionamento real.
- `SECURITY DEFINER` exige revisão específica do owner, grants, RLS e acesso a `auth.sessions`.
- A origem preserva seus dados; seus `updated_at` devem representar alterações de forma confiável.
- O modelo não tem suporte a `livros` ou `capítulos` nesta fase.
- Nenhuma tradução internacional está pronta para publicação.
- A interface ainda precisa de teste visual e teste de sincronização do navegador.

## Próxima fase candidata: 6.11
Rodar testes de integração em banco isolado, corrigir incompatibilidades e só então habilitar gravação de rascunhos com tratamento de conflitos e auditoria.
