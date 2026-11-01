# Etapa 6 — Participação editorial, ficção e newsletter

## Entregas técnicas

- `/participar.html`: formulário de ficção original e pedido de inscrição voluntária por e-mail.
- `/confirmar-inscricao.html`: confirmação/cancelamento mediante clique explícito do titular, sem requisição automática ao abrir o link.
- `/admin-v2/curadoria-ficcao.html`: fila de manuscritos privados, controle de estado editorial e notas restritas à administração; exige sessão V2 e RLS.
- `editorial_fiction_submissions`: originais privados. Nenhum campo/trigger publica em Novels, Dossiês, Garimpo ou outras editorias.
- `editorial_newsletter_subscribers`: consentimento pendente, confirmação e cancelamento. Nenhuma assinatura habilita envios antes da confirmação.
- `editorial-participation`: Supabase Edge Function de API pública com lista de origens, limite de payload, honeypot, validação e limite por sessão de infraestrutura. Chave privilegiada nunca é enviada ao navegador.

## Newsletter: dependência obrigatória do serviço de e-mail

O código usa a **API Resend** exclusivamente para **enviar confirmação de inscrição**. Não existe, nesta etapa, um gerador ou disparador de campanhas promocionais. Assim, não anunciar a newsletter como enviando edições recorrentes.

Para habilitar pedidos de inscrição:
1. Verificar um domínio remetente na Resend e configurar corretamente a autenticação do domínio (SPF/DKIM e demais exigências do fornecedor).
2. No painel Supabase do projeto `iuhotznurbyujzbyhizf`, abrir **Edge Functions > Secrets** e definir `RESEND_API_KEY` e `NEWSLETTER_FROM_EMAIL` (e-mail do domínio verificado, sem nome de exibição).
3. Realizar teste autorizado com endereço pertencente à equipe, confirmar manualmente o e-mail e cancelar. Não enviar campanhas de teste a terceiros.
4. Antes de implantar campanhas, adicionar procedimento de descadastro em **todos** os e-mails, controle de frequência, modelos editoriais, histórico de envios e monitoramento de reclamações/bounces.
5. Sem `RESEND_API_KEY` e `NEWSLETTER_FROM_EMAIL`, o endpoint retorna HTTP 503 **sem armazenar novos e-mails**. Os visitantes podem usar `/rss.xml`, que já funciona.

As chaves de envio nunca devem estar em GitHub, JavaScript público, HTML ou commits.

## Política editorial para ficção

- Autor declara ter 18 anos ou mais e os direitos necessários sobre o texto.
- O envio permite **somente avaliação editorial privada**. Não transfere direitos e não libera publicação.
- O autor fornece e-mail para eventual retorno, pseudônimo, título, gênero, sinopse e trecho. Não há criação de conta de leitor.
- `status = recebido` inicialmente. A administração pode indicar `em_analise`, `solicitar_ajustes`, `aprovado_para_contato` ou `recusado`.
- Para publicar em Novels, a equipe deve tratar autorização/licença de forma separada, registrar o consentimento contratual adequado e usar o editor normal. Nenhum envio entra automaticamente na biblioteca.
- A equipe deve evitar manuscritos com dados pessoais de terceiros, acusações reais não documentadas ou obras que não pertençam ao remetente.
- Pedidos de acesso, correção ou eliminação seguem o canal oficial indicado em `privacidade.html`.
- Alterações de permissões RLS exigem nova revisão; `anon` não recebe SELECT nem INSERT e `authenticated` depende de `is_arquivo_sombrio_admin()`.

## Confirmação/descadastro

- O e-mail contém um token aleatório de 32 bytes em URL **fragmento**. O backend armazena apenas SHA-256 do token.
- A página não confirma ou cancela automaticamente, para não acionar links em prévias de e-mail.
- A confirmação de inscrição pendente expira após 48 horas; um novo pedido gira um novo token.
- O mesmo link também permite cancelar inscrição confirmada. O cancelamento é persistido no banco.
- Não há prova de entrega por teste unitário. É preciso testar com remetente e domínio reais já autorizados.

## Verificações

- Testes unitários de formulário, preservação do manuscrito após falhas, revisão privada, direitos e ausência de publicação automática.
- Auditoria do build e sitemap, autenticação da V2 e confirmação da função implantada.
- Não submeter textos reais de terceiros ou criar assinaturas de teste sem controle do endereço destinatário.
