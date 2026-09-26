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