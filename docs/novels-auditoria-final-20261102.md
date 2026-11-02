# Biblioteca de Novels — auditoria de encerramento da fase
Data de referência: 02/11/2026. Escopo: catálogo, leitor de capítulos, continuidade, biblioteca pessoal e permissões públicas.

## Entrega e critérios de aceite
1. **Progresso anônimo → conta:** painel explícito de autorização, validação do usuário atual, comparação de timestamps, verificação do capítulo público e atualização condicional somente quando o dado do dispositivo é mais recente. Importação não iniciada sem clique. Resultado e erros parciais visíveis. Progresso local removido apenas quando confirmado na conta ou se a posição da conta é mais recente. Leituras marcadas como concluídas não são modificadas.
2. **Privacidade de sessão:** progresso autenticado temporário usa `sessionStorage`; chaves persistentes antigas `novel-progress-*` são limpas, sem afetar as posições de visitantes. Cache autenticado é limpo ao sair ou trocar de conta.
3. **Filtros pessoais:** botões Em andamento / Quero ler / Concluídas, resultados e estados vazios, URLs de continuidade e nenhuma inferência de conclusão.
4. **Avisos de capítulos:** opt-in por obra, dispositivo e conta, verificação dos capítulos publicados e não agendados para o futuro; botão “Marcar como visto”. **Avisos somente dentro da biblioteca quando ela é aberta.** Não existe envio de e-mail, push, monitoramento contínuo nem sincronização da preferência entre dispositivos.
5. **QA:** testes Node, regressões de acesso público, geração SEO, sitemap, teste automatizado Chromium desktop 1280 px e mobile 390 px. Teste com celular físico, Safari iOS real, leitores de tela e medição Lighthouse em rede real não executados nesta etapa.

## Segurança: verificações realizadas
- Policies `novel_progresso` e `novel_biblioteca`: SELECT/INSERT/UPDATE limitados a `auth.uid() = user_id`; a biblioteca tem DELETE restrito ao dono.
- `novel_capitulos`: **`enforce_publication_time` já é RESTRICTIVE** e exige publicação vigente ou exceção de administrador. Não criar política duplicada; nenhuma alteração RLS necessária.
- Consulta read-only como `anon`: 8 obras e 226 capítulos visíveis; 0 capítulos futuros visíveis em 02/11/2026. Valores pontuais, não prova universal.
- Não usar service role no navegador; manter chave publicável existente.
- O navegador pode ser compartilhado: aviso explícito na importação e nenhum envio automático de dados.

## Questões que não devem ser confundidas com bugs da biblioteca
- O Supabase Advisor em 02/11/2026 aponta avisos de segurança gerais do projeto (proteção contra senhas vazadas desligada e funções SECURITY DEFINER executáveis por autenticados). Exigem triagem contextual, mas não decorrem do novo código de novels.
- O mesmo Advisor lista melhorias de índices/desempenho em outras tabelas. Não mudar índices indiscriminadamente sem análise de consultas e custo.
- Para alertas por e-mail/push ou sincronizados entre aparelhos será preciso opt-in persistente no banco, emissor autorizado, rotina de publicação confiável e opção de descadastro.

## Publicação e rollback
Publicar apenas após aprovação do GitHub Actions e revisão de merge; a implementação estática pode ser revertida pelo commit do PR. Não limpar o histórico de leitura salvo no Supabase como parte de rollback.
