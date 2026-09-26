# Administração Lite para iOS 9.3.5
Protótipo local em admin-lite-preview/. Não é um painel autenticado. A página será pública se for publicada no GitHub Pages.

## Próxima fase
1. Validar código forte exclusivamente no servidor com hash, limite de tentativas e auditoria.
2. Vincular código a identidade administrativa preexistente; emitir sessão curta e restrita à edição de rascunhos.
3. Validar permissões no servidor, não no JavaScript do iPad. Nunca incluir chaves secretas ou service_role no frontend.
4. Verificar compatibilidade HTTPS/TLS do Safari 9 antes de solicitar credenciais.
5. Criar sincronização autorizada de rascunhos com histórico de versões e proteção contra substituição concorrente.
6. Testar no iPad antigo antes de habilitar qualquer escrita remota.

## Melhorias
Checklist editorial, aviso de mudanças não salvas, exportação de segurança e navegação por seções.

Não habilitar publicação definitiva ou escrita pública nesta fase.

## Etapa concluída nesta revisão
- Autosave local de 15 segundos, indicador de alterações pendentes e aviso ao sair.
- Importação de backup JSON limitado a 2 MB, com verificação de formato e confirmação antes de substituir.
- Checklist editorial e prévia local.
- Nenhuma operação de escrita remota foi habilitada. O PIN deve ser verificado no servidor, com limite de tentativas persistente e sessão curta. Não criar PIN no GitHub ou no HTML.

## Bloqueios antes da publicação autenticada
- Configurar segredo de acesso no ambiente seguro do Supabase, fora do repositório, e vincular ao administrador autorizado.
- Implementar/verificar limitação de tentativas no servidor e revogação de sessões; registrar auditoria sem salvar o código.
- Testar HTTPS no Safari iOS 9.3.5 antes de enviar qualquer credencial.
- Testar integração com admin_drafts sem expor rascunhos de outros usuários; manter publicação desativada.
