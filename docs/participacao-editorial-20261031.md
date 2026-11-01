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
2. Acesse [Resend — Domains](https://resend.com/domains) com uma conta da equipe, adicione o domínio remetente e copie os **registros DNS mostrados para sua conta**. Não use valores genéricos ou de terceiros; publique-os no provedor DNS que administra o domínio e confirme o status **Verified / Sending enabled** na Resend.
3. No [Supabase — Edge Function Secrets](https://supabase.com/dashboard/project/iuhotznurbyujzbyhizf/settings/functions), adicione `RESEND_API_KEY` e `NEWSLETTER_FROM_EMAIL` (um e-mail pertencente ao domínio verificado, sem nome de exibição). **Nunca coloque a chave em GitHub, JavaScript ou neste chat.**
4. Para ativação controlada, defina `NEWSLETTER_ENABLED=true` **somente após** o domínio e o remetente estarem verificados na Resend. Enquanto o segredo for omitido ou diferente de `true`, o backend retorna `available:false` na consulta sem e-mail, não registra novos assinantes e o formulário permanece desabilitado.
5. Realize um teste autorizado com endereço de e-mail da equipe: receber confirmação, confirmar manualmente, confirmar o estado de banco e cancelar a inscrição. Não envie testes a terceiros.
6. Antes de enviar campanhas, implementar descadastro em **todos** os e-mails, controle de frequência, histórico de envios, monitoramento de reclamações e bounces e envio periódico separado. Esta etapa ainda **não** envia newsletters.
7. Sem as **três** variáveis validadas (`RESEND_API_KEY`, `NEWSLETTER_FROM_EMAIL`, `NEWSLETTER_ENABLED=true`), o endpoint retorna HTTP 503 **sem armazenar novos e-mails**. Os visitantes podem usar `/rss.xml`, que já funciona.

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

## Estúdio editorial de newsletter na V2

- Acesse /admin-v2/newsletter.html, também disponível pelo menu da Central V2.
- Somente usuários administrativos podem consultar e criar edições; a sessão é verificada no navegador e o Supabase mantém políticas RLS administrativas.
- A tabela editorial_newsletter_editions armazena título, assunto, prévia curta, texto, CTA HTTPS opcional e situação interna: rascunho, revisao, aprovado ou arquivado.
- O estado aprovado significa apenas revisão editorial concluída. Não há botão, cron ou serviço de envio/agenda neste módulo.
- A prévia usa textContent em vez de interpretação de HTML, e não representa o template final de e-mail.
- O painel mostra apenas contagens de inscrições confirmadas, pendentes e canceladas. Não acessa e-mails individuais, tokens ou lista de destinatários.
- Sem sessão administrativa, os controles permanecem desabilitados. Em erro de gravação, não há confirmação falsa.

### Pré-requisitos de envio futuro

1. Confirmar domínio remetente verificado e testar o ciclo de confirmação/cancelamento na Resend.
2. Criar serviço de disparo separado e autorizado, auditado e com confirmação real de entregas pelo provedor.
3. Selecionar somente assinaturas com status confirmado, revalidando imediatamente antes de cada envio.
4. Incluir cancelamento individualizado em todos os e-mails, limites de taxa e controles de reclamação/bounce.
5. Impedir mensagens duplicadas e não tratar a marcação editorial como envio.

A criação de rascunhos é independente de RESEND_API_KEY, NEWSLETTER_FROM_EMAIL e NEWSLETTER_ENABLED; a ausência dessas credenciais continua bloqueando inscrições por e-mail.
