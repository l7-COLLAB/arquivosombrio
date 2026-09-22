# Arquivo Sombrio — Central Administrativa V2

Ambiente paralelo de desenvolvimento. Não substitui admin.html ou painel-admin.html.

## Regras
1. O painel antigo permanece operacional até validação integral do V2.
2. O V2 não depende do js/script.js público.
3. Nenhuma service_role ou chave privada pode existir no frontend.
4. Alterações de schema devem permanecer compatíveis com o painel antigo durante a transição.
5. Escritas públicas ficam desabilitadas na base inicial do V2.
6. Todo módulo privilegiado deve respeitar RLS e role administrativa server-controlled.

## Escopo registrado
Conteúdo unificado: Dossiês, Garimpo, Perícia, Lendas, Creepypastas e Biblioteca.
Publicação: rascunho, revisão, pronto, agendado, publicado e arquivado; calendário editorial; agendamento também dentro do editor.
Editor: blocos, mídia, fontes, SEO, notas internas, relacionados, preview, checklist, versões, restauração, duplicação e lixeira.
Narração do Arquivo: teleprompter, gravação por blocos, recuperação, Storage, versões, texto para narração e pronúncias especiais.
Comunidade: comentários, fórum, respostas, denúncias e sanções.
Administração: usuários, solicitações, auditoria, tarefas, saúde do site, configurações e controle editorial da Home.

## Próximas etapas
Mapear tabelas, buckets, políticas RLS e funções RPC atuais.
Definir contratos de dados comuns e específicos por tipo de conteúdo.
Criar autenticação/login próprio do V2.
Implementar primeiro o núcleo editorial sem afetar o frontend público.
