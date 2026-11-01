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

## Etapa 8 — Diagnóstico seguro do remetente (01/11/2026)

A Central V2 inclui uma área de diagnóstico na página `admin-v2/newsletter.html`. A função `editorial-participation` agora aceita `newsletter_admin_diagnostics` **somente com token de sessão administrativa real**, validado com Supabase Auth e `app_metadata.role=admin`. O endpoint não altera configurações nem envia e-mails.

O relatório apresenta apenas indicadores: presença da chave Resend, formato do e-mail remetente, situação da chave `NEWSLETTER_ENABLED`, domínio remetente e estado de verificação obtido pela API `GET /domains`, quando a chave autoriza consultas. Os segredos e endereços dos assinantes nunca retornam ao navegador.

Uma chave Resend com permissão limitada a envio pode receber HTTP 401/403 ao tentar listar domínios. Nesse caso, o diagnóstico indicará **sem permissão de consulta**, que **não deve** ser interpretado como domínio verificado nem como bloqueio comprovado para envio; verifique manualmente na Resend antes de habilitar o serviço. Não amplie permissões de chaves de produção apenas para permitir o diagnóstico.

Resultado do acesso na sessão de implementação: a conexão Cloudflare retornou **zero zonas DNS**. Portanto, esta conexão não pode criar nem verificar os registros de `arquivosombrio.net.br`. Não houve manipulação DNS nem criação de chaves do provedor.

**Para finalizar a configuração externa:**
1. Na conta Resend da equipe, [adicionar/verificar o domínio](https://resend.com/domains), copiando os registros **exatos** oferecidos pelo provedor (SPF, DKIM, MX conforme aplicáveis).
2. Inserir esses registros no **provedor DNS efetivamente autoritativo** pelo domínio (a integração Cloudflare deste ChatGPT não controla zonas). Não substituir registros de correio já existentes sem analisar impacto.
3. Confirmar na Resend que a capacidade de envio está **enabled** e o domínio está **verified**.
4. Criar uma chave Resend de envio apropriada, inserir `RESEND_API_KEY` e `NEWSLETTER_FROM_EMAIL` em **Supabase > Edge Functions > Secrets**. Nunca enviar segredos na conversa, GitHub ou HTML.
5. Apenas depois de comprovada a verificação, definir `NEWSLETTER_ENABLED=true` em Secrets. O cadastro público continua desativado enquanto a chave não estiver definida como `true`.
6. Testar com um endereço de propriedade da equipe, validar duplo opt-in e cancelamento. Não disparar e-mails a inscritos antes de concluir a Etapa 9/10.

Não foi comprovada entrega de e-mails nem se ativou o disparador de newsletter nesta etapa.

## Etapa 9 — Preparação segura de distribuição (01/11/2026)

A fila foi implantada no banco e a Edge Function `newsletter-distribution` está ativa para **consultar estado, preparar fila e descadastrar**. **Não existe método de envio de edições nesta etapa**. O sistema continua sem cron, agendamento, webhooks externos nem disparos reais.

- `editorial_newsletter_delivery_queue`: uma linha por par `(edition_id, subscriber_id)`, impedindo duplicação; apenas assinaturas `confirmado` com `confirmed_at` são elegíveis, e somente edições `aprovado` podem ser preparadas.
- `editorial_prepare_newsletter_queue(uuid)`: função SQL `SECURITY INVOKER`, executável apenas por `service_role`; acesso público e de leitores revogado. A Edge Function valida `auth.getUser` e `app_metadata.role=admin` antes de chamar.
- `editorial_newsletter_delivery_events`: log transacional privado das transições de estado; preparado/cancelado hoje e espaço para eventos de provedor no futuro. Padrão RLS fechado.
- Depois da primeira inclusão na fila, o conteúdo editorial não pode mais ser modificado. Para revisar, crie outra edição; o preparo vazio (zero destinatários) não congela.
- Admin V2: indicadores agregados, seletor de edições aprovadas e botão **Preparar fila, sem envio**. Não são exibidos e-mails, tokens ou segredos.
- `/descadastrar-newsletter.html#token=<subscriber-uuid>.<hmac-hex>` oferece confirmação por clique do titular. O token usa HMAC-SHA256 sobre `arquivo-newsletter-unsubscribe:v1:` + UUID minúsculo, assinado com o segredo privado `NEWSLETTER_UNSUBSCRIBE_SECRET` (mínimo 32 caracteres). O token não aparece em URLs HTTP e só será criado pelo futuro serviço de envio, que deve usar exatamente esse contrato.
- O descadastro exige `POST`, verifica a assinatura e altera a assinatura confirmada para `cancelado`, além de cancelar mensagens ainda preparadas. Abrir a página não provoca ação automática.

**Configuração futura, não realizada agora:** manter a chave HMAC apenas nos segredos da Edge Function; confirmar o domínio e a chave Resend da Etapa 8; configurar `NEWSLETTER_ENABLED=true` apenas para confirmação de inscrições, quando o remetente estiver validado. Mesmo com esta variável ativada, a Etapa 9 não envia edições. Antes de habilitar envio real, a próxima etapa deve adicionar autorização separada de disparo, revalidar assinatura imediatamente antes de enviar, inserir link individual de descadastro no corpo, usar chave de idempotência por mensagem, limites de lote, eventos verificados do provedor, gestão de bounce/reclamação e inspeção dos resultados. Não confundir aceitação da API Resend com entrega na caixa postal.

Teste transacional de criação de fila, duplicação, evento e bloqueio de edição executado com rollback; nenhum assinante ou edição de teste permaneceu no banco. Sem a conta Resend verificada, não é possível atestar entrega real ou testar descadastro por e-mail.

**Revisão de permissões:** o teste com o papel efetivo `service_role` identificou que as tabelas privadas anteriores não concediam operações à função de backend. A migração `20261101_newsletter_service_role_grants.sql` concede somente leitura de edições e leitura/gravação de assinantes para `service_role`, preservando o isolamento público. O teste transacional foi repetido com `SET LOCAL ROLE service_role`: preparou 1 destinatário e foi revertido sem persistência.


## Etapa 10 — Envio manual com travas e webhook (01/11/2026)

**Código implementado; envio real permanece BLOQUEADO por padrão.** As funções `newsletter-dispatch` e `newsletter-webhook` são separadas da preparação da Etapa 9. A V2 mostra a situação da autorização e disponibiliza uma ação manual de até 5 mensagens, que só é ativada com todos os pré-requisitos confirmados pelo servidor.

### Condições cumulativas para envio real

No projeto Supabase `iuhotznurbyujzbyhizf`, em Edge Functions > Secrets:

- `RESEND_API_KEY`: chave restrita e válida para envio, nunca publicada;
- `NEWSLETTER_FROM_EMAIL`: endereço completo do remetente verificado;
- `NEWSLETTER_VERIFIED_DOMAIN`: exatamente o domínio após `@` do remetente, configurado **apenas após a confirmação manual do status Verified / sending enabled na Resend**;
- `NEWSLETTER_UNSUBSCRIBE_SECRET`: segredo aleatório com pelo menos 32 caracteres (compartilhado com a Etapa 9 para assinar os links); trocar o segredo invalida links antigos;
- `RESEND_WEBHOOK_SECRET`: assinatura `whsec_...` obtida ao registrar o webhook, nunca enviada para GitHub;
- `NEWSLETTER_ENABLED=true`: liberação de inscrições/duplo opt-in da Etapa 8;
- `NEWSLETTER_DISPATCH_ENABLED=true`: **liberação independente** para envios reais; omita ou mantenha `false` até verificar todos os requisitos e fazer teste controlado com endereços da equipe.

Se qualquer condição falhar, `newsletter-dispatch` responde bloqueado, sem chamar a Resend. A consulta de status exige autenticação real e `app_metadata.role=admin`; não expõe valores de segredos. Não existe cron para os disparos desta etapa.

### Fluxo operacional após ativação

1. Preparar edição `aprovado` e fila na V2. A preparação não envia e-mails e bloqueia alterações posteriores à edição que recebeu destinatários.
2. Escolher a edição no painel e clicar em `Verificar liberação`.
3. Clicar `Enviar até 5 mensagens` e digitar exatamente `ENVIAR`. A Edge Function valida a sessão com Supabase Auth, a função de administrador, as flags e aplica limite por IP.
4. A função SQL `editorial_claim_newsletter_batch` reserva até 5 linhas usando bloqueio transacional e `FOR UPDATE SKIP LOCKED`; cota global de **50 tentativas em qualquer janela móvel de 24 horas** e intervalo mínimo de **7 dias por leitor entre edições**. O envio revalida que o assinante ainda está confirmado antes de cada chamada ao provedor.
5. Cada mensagem é individual, em texto, inclui link HTTPS de leitura opcional e link assinado de descadastro; usa `Idempotency-Key: arquivo-newsletter-v1-<delivery-id>`. O cabeçalho `List-Unsubscribe` abre uma página com confirmação humana; **não** declarar `List-Unsubscribe-Post: One-Click` sem implementar o endpoint específico.
6. Status `aceito` significa aceitação pelo provedor, **não** entrega. Erros definitivos viram `falhou`; resultados de rede/429/5xx ambíguos viram `incerto`, sem nova tentativa automática. A Resend retém chaves idempotentes por 24 horas; retentar manualmente após essa janela exige reconciliação para evitar mensagens duplicadas.
7. Cadastre na Resend `https://iuhotznurbyujzbyhizf.supabase.co/functions/v1/newsletter-webhook` para eventos `email.sent`, `email.delivered`, `email.bounced`, `email.complained`, `email.failed` e `email.suppressed`, conforme disponibilidade. A função verifica **o corpo bruto assinado** por Svix, valida `svix-id`, e grava eventos idempotentes no banco.
8. Bounce ou reclamação cancela a assinatura e as mensagens ainda preparadas daquele leitor; o histórico é privado e não armazena endereços nas notificações de eventos.

### Segurança e limites residuais

- O acesso público aos registros e funções SQL de reserva/eventos permanece revogado; apenas `service_role` executa a movimentação sensível.
- A assinatura do webhook tem que ser configurada pelo painel Resend; deploy da função, isoladamente, não significa que eventos estão chegando.
- Há uma pequena janela de concorrência entre a última verificação de consentimento e a chamada à API de envio. O sistema reduz, mas não elimina, esta condição; requisições já aceitas pelo provedor não podem ser recolhidas após um descadastro.
- A fila não reenvia automaticamente pedidos incertos e não oferece resolução automática para respostas sem ID; é necessária reconciliação operacional antes de qualquer tentativa adicional.
- O botão não executa envio enquanto a configuração externa da Resend e o segredo separado de despacho estiverem ausentes. **Nenhum e-mail real foi enviado durante o desenvolvimento.**
- Para evitar confusão: seções históricas anteriores descrevem as capacidades de suas próprias etapas. Esta é a implementação posterior de envio manual, sempre inicialmente bloqueada.

### Verificações

Teste SQL transacional com `SET LOCAL ROLE service_role`, contendo reserva do lote, elegibilidade, aceite, evento `delivered` duplicado, reclamação, supressão da assinatura e recusa de nova reserva. Executado com `ROLLBACK`. Os testes de código verificam autenticação, limites, segredos, link de descadastro, assinatura do webhook e ausência de cron. A entrega real depende da Resend e ainda não foi comprovada.


## Etapa 11 — Observabilidade administrativa e simulação segura (01/11/2026)

A função `newsletter-monitor` foi criada e implantada no Supabase. O Estúdio da Newsletter na V2 inclui agora indicadores operacionais, checagem de pré-requisitos, alertas e uma simulação de lote.

**O painel não envia e-mails nem agenda tarefas.** O sistema consulta dados sob demanda e exige token de usuário real por `auth.getUser` com `app_metadata.role=admin`. Os resultados contêm somente contagens e datas agregadas, sem dados de assinantes, IDs de destinatários, tokens ou chaves.

### Indicadores monitorados

- Assinaturas confirmadas, pendentes e canceladas; número de edições aprovadas.
- Mensagens preparadas, em envio, aceitas pelo provedor, entregues segundo webhook, falhadas, incertas, canceladas, bounces e reclamações.
- Reserva de tentativas em 24 horas e em 7 dias; cota residual de 50 tentativas por janela móvel de 24 horas.
- Histórico agregado de eventos em 7 dias, última tentativa de envio, último evento recebido.
- Atenção manual para: `em_envio` há mais de 15 minutos, `aceito` sem entrega confirmada após 48 horas, resultados incertos, falhas, bounces ou reclamações.

**Interpretação:** `aceito` significa que a Resend aceitou o pedido; não significa entrega na caixa postal. Falta de eventos pode indicar webhook ausente ou problema de entrega. O painel não afirma entrega por ausência de bounces nem monitora aberturas/leitura.

### Simulação, sem efeitos de envio

Selecione uma edição aprovada na lista da fila e escolha `Simular até 5 destinatários`. A RPC `editorial_newsletter_simulate_dispatch(uuid)` calcula destinatários elegíveis (somente `confirmado` com `confirmed_at`), pendências de confirmação, intervalo de 7 dias por leitor e cota disponível. O resultado indica quantas mensagens **seriam reservadas** se o disparo ocorresse agora. A função é `STABLE SECURITY INVOKER`, exclusivamente para `service_role`, sem `INSERT`, `UPDATE`, `DELETE` ou chamada ao provedor. As métricas e simulações não reservam vagas para envio; concorrência posterior pode alterar a disponibilidade.

### Pré-requisitos e dependências pendentes

Os indicadores de configuração mostram apenas a presença/validade estrutural de variáveis do Supabase, não as credenciais. A coincidência do domínio declarado `NEWSLETTER_VERIFIED_DOMAIN` com `NEWSLETTER_FROM_EMAIL` **não comprova** verificação de DNS na Resend. A ativação real ainda depende das configurações externas da Etapa 8, da instalação do webhook e de testes controlados de confirmação, entrega e descadastro.

`NEWSLETTER_DISPATCH_ENABLED` não foi habilitada por esta etapa. O painel não cria campanhas, não testa com e-mails reais e não publica indicadores para visitantes.

### Auditoria

- Teste SQL com dados temporários e `ROLLBACK`: contabilização de inscrito confirmado e pendente, fila agregada, exclusão de destinatário não confirmado e previsão de um lote elegível.
- Execução das RPCs com `SET LOCAL ROLE service_role` confirmada; `anon` e `authenticated` não têm autorização para executar as funções SQL.
- Testes do CI para autenticação, limites de payload, ausência de dados pessoais na resposta, ausência de disparos e integridade dos indicadores.
- O painel é atualizado **sob demanda**, sem monitoramento contínuo nem alertas automáticos.

## Etapa 12 — Ativação supervisionada e diagnóstico direto da Resend (01/11/2026)

**Implementação técnica concluída, mas a ativação real permanece bloqueada até a Resend e um endereço de equipe serem configurados.** Esta etapa introduz um modo piloto restrito por padrão e uma Edge Function de diagnóstico com leitura da API do provedor, sem envio de mensagens.

### Proteção obrigatória de piloto

O módulo `newsletter-dispatch` agora assume `NEWSLETTER_PILOT_ONLY=true` quando essa variável não existe ou possui qualquer valor diferente de `false`. No modo piloto, ele só é ativável se `NEWSLETTER_PILOT_EMAIL` contiver um endereço de teste válido e configurado **diretamente nos segredos do Supabase**. O e-mail configurado deve estar inscrito na newsletter com consentimento duplo, `status=confirmado` e `confirmed_at` preenchido.

A RPC nova `editorial_claim_newsletter_batch(uuid,integer,text)` restringe a reserva a esse e-mail, no banco, antes de devolver dados ao servidor. Só permite lote de **1** no modo piloto; se o endereço não constar na fila ou estiver pendente/cancelado, nada é reservado. A reserva mantém bloqueio transacional, cota global de 50 tentativas em 24h, intervalo de sete dias e proteção contra reenvio. A assinatura de dois parâmetros permanece apenas para compatibilidade de backend antigo, revogada para usuários públicos. **A Edge Function implantada usa apenas a assinatura nova com três parâmetros.**

Para envio geral após o piloto, é necessária uma ação administrativa consciente: alterar `NEWSLETTER_PILOT_ONLY=false` nos segredos. Isso **não** é feito nesta etapa. A flag geral `NEWSLETTER_DISPATCH_ENABLED` também continua sem alteração.

### Pré-verificação sem enviar e-mail

A nova Edge Function `newsletter-activation` possui apenas a ação `preflight`, acessível por POST sob origem do site, Supabase Auth válido e `app_metadata.role=admin`. Ela compara o remetente declarado e, se houver API key com permissão, consulta as APIs **GET** da Resend:

- `https://api.resend.com/domains`: busca o domínio do remetente, exige `status=verified` (ou `partially_verified` com capacidade de envio realmente liberada) e `capabilities.sending=enabled`;
- `https://api.resend.com/webhooks`: exige endpoint ativo correspondente exatamente a `https://iuhotznurbyujzbyhizf.supabase.co/functions/v1/newsletter-webhook`, recebendo pelo menos `email.delivered`, `email.bounced` e `email.complained`;
- as respostas **nunca** incluem chaves, nomes de domínio cadastrados, contatos, segredos, endereços dos inscritos ou payloads brutos do provedor.

A chave padrão `RESEND_API_KEY` pode ter permissão apenas de envio e recusar a API de listagem, resultando em `unauthorized`. Se a equipe desejar verificações automáticas, pode criar `RESEND_MANAGEMENT_API_KEY` separada, com permissão de consulta ao painel da Resend. Como a Resend pode exigir permissão Full Access para listagem, guarde esta credencial exclusivamente no Supabase, proteja-a com controles operacionais fortes e não a crie se a avaliação de risco não justificar essa capacidade. Sem essa chave, a checagem externa permanece inconclusiva, e a confirmação deve ser feita no painel da Resend. Em ambos os casos, o sistema **não** assume que a coincidência do domínio configurado comprova a verificação DNS.

### Passo a passo externo pendente

1. Na <https://resend.com/domains>, cadastre o domínio remetente desejado. Copie exatamente os registros DNS mostrados pela Resend e publique no provedor responsável pelo DNS autoritativo; não use registros genéricos. Confirme que a capacidade **Sending** está habilitada. A conexão Cloudflare disponível nesta sessão não retornou uma zona `arquivosombrio.net.br`, portanto nenhum DNS foi modificado.
2. Na <https://resend.com/webhooks>, cadastre `https://iuhotznurbyujzbyhizf.supabase.co/functions/v1/newsletter-webhook` com eventos de entrega, bounce e reclamação. Copie a chave de assinatura da Resend diretamente para o segredo `RESEND_WEBHOOK_SECRET` do Supabase. O teste definitivo requer ao menos um evento assinado aceito pela função.
3. Em <https://supabase.com/dashboard/project/iuhotznurbyujzbyhizf/settings/functions>, configure `RESEND_API_KEY`, `NEWSLETTER_FROM_EMAIL`, `NEWSLETTER_VERIFIED_DOMAIN`, `NEWSLETTER_UNSUBSCRIBE_SECRET` (mínimo 32 caracteres) e `RESEND_WEBHOOK_SECRET`, além de `NEWSLETTER_PILOT_EMAIL` com um endereço real controlado pela equipe. `RESEND_MANAGEMENT_API_KEY` é opcional para inspeção da Resend.
4. Com DNS e webhook prontos, e **após** confirmar consentimento do endereço piloto, habilite `NEWSLETTER_ENABLED=true`, `NEWSLETTER_DISPATCH_ENABLED=true` e mantenha `NEWSLETTER_PILOT_ONLY=true`. O envio geral continuará bloqueado.
5. Acesse <https://arquivosombrio.net.br/admin-v2/newsletter.html>, clique em **Consultar validação na Resend** e confirme os resultados. Prepare uma edição de teste aprovada, com apenas um endereço piloto confirmado, e verifique a simulação.
6. Execute no máximo um envio piloto manual e confirme `ENVIAR`. Confira recebimento real na caixa controlada, evento assinado `email.delivered`, link de descadastro, cancelamento na base e impossibilidade de incluir esse leitor novamente. Aceite pelo provedor não prova entrega.
7. **Não** desative `NEWSLETTER_PILOT_ONLY` nem divulgue a newsletter como operacional até todos os testes passarem. Havendo falha em etapas críticas, mantenha `NEWSLETTER_DISPATCH_ENABLED=false`.

### Auditoria realizada nesta etapa

- Criada e aplicada a migração `20261101_newsletter_pilot_claim.sql`; testada com dois destinatários confirmados dentro de transação revertida: exatamente um endereço piloto foi reservado, a segunda tentativa não repetiu o envio, e o outro inscrito permaneceu preparado, sem alteração.
- Implantadas `newsletter-dispatch` v2 com limitação piloto padrão e `newsletter-activation` v2 com diagnóstico de leitura.
- Nenhum pedido de criação de domínio ou webhook foi executado na Resend, pois não havia credencial da conta acessível; nenhum segredo de Resend foi inserido no banco ou no GitHub.
- **Não houve envio real, recebimento confirmado, teste SMTP nem descadastro real nesta sessão.** Esses testes dependem da configuração dos segredos, da conta e de um destinatário autorizado.

### Notas de segurança

O mecanismo não permite envio anônimo e não expõe emails individuais nos indicadores administrativos. Os testes automatizados de CI cobrem o bloqueio por padrão, a RPC seletiva, a política administrativa, a checagem remota de domínio/webhook e a ausência de operações de escrita no pré-voo. Ainda será necessário fazer uma auditoria final de entrega autenticada após o cadastro real da Resend. 
