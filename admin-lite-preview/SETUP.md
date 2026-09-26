# Administração Lite · configuração
Painel: https://arquivosombrio.net.br/admin-lite-preview/
Backend: Edge Function lite-admin no projeto Supabase Arquivo Sombrio.

## Ativar o acesso
No Supabase Dashboard > Edge Functions > Secrets, adicionar LITE_ADMIN_PASSWORD com uma senha exclusiva de pelo menos 16 caracteres. Não enviar a senha pelo chat nem adicioná-la ao GitHub.
A função responde com indisponibilidade até que o segredo exista.
O navegador envia a senha diretamente à Edge Function por HTTPS. A sessão temporária de 45 minutos fica somente na memória do navegador.
O backend aplica limite de cinco tentativas por identificador de origem a cada 15 minutos.

## Escopo atual
Dossiês, Garimpo, Perícia, Lendas, Creepypastas, Livros e Capítulos. É possível criar rascunhos remotos ou copiar registros existentes para editar sem modificar o original. Não há operações de publicação, agendamento ou exclusão.
Os rascunhos ficam na tabela lite_admin_staging, separada de admin_drafts. A sincronização com o painel V2 ainda depende de um adaptador editorial que preserve os campos estruturados e associe cada rascunho ao administrador autorizado.

## Segurança
Nunca guardar senha no código-fonte, expor service_role no navegador ou armazenar sessão no localStorage.
As tabelas auxiliares têm RLS habilitada e nenhum acesso direto para anon ou authenticated.
Validar conexão HTTPS no Safari iOS 9.3.5 antes de digitar a senha. Se aparecer aviso de certificado, não prosseguir.
A proteção por senha restringe acesso ao editor remoto, mas os arquivos estáticos HTML/JS são públicos e não contêm dados privados.