# Caso em acompanhamento

Implementado em 06/10/2026 para Dossiês e Garimpo Sombrio. A classificação não substitui a categoria, o estado da investigação ou o fluxo de publicação.

## Operação na V2

1. Entre em **Conteúdos e edição**, escolha **Dossiês** ou **Garimpo Sombrio** e crie ou abra um arquivo.
2. Na seção **CASO EM ACOMPANHAMENTO**, escolha **Caso em acompanhamento** e clique em **Aplicar classificação**. Essa ação salva diretamente a classificação, sem publicar um rascunho.
3. Use **Adicionar atualização**. Informe data real, título opcional, natureza da informação, texto e fontes. Links são opcionais. **Salvar atualização** grava o registro separado do relato original. Em um arquivo já publicado, a atualização fica pública imediatamente.
4. Use **Editar** para corrigir texto, data, fontes ou prioridade. A data organiza a linha do tempo do mais recente para o mais antigo. A prioridade organiza registros do mesmo dia, em ordem crescente.
5. **Excluir atualização** retira a entrada da leitura pública, preservando a versão anterior no histórico administrativo.
6. **Encerrar acompanhamento** mantém conteúdo, publicação, URL e atualizações; retira selo e aviso, registra a data do encerramento. A opção **Arquivo normal** também retira a classificação, preservando as atualizações. É possível reativar o acompanhamento.
7. O fluxo normal de **Salvar alterações**, **Publicar**, revisão e agendamento continua separado. A publicação exige os campos e fontes já validados pelos editores existentes.

## Banco e segurança

- Campos `acompanhamento_status` (`normal`, `ativo`, `encerrado`) e `acompanhamento_encerrado_em` adicionados a `Casos` e `casos_diarios`. Os arquivos existentes recebem `normal`.
- `case_updates`: atualização individual, com FK para um único arquivo, data, título, texto, natureza editorial, lista estruturada de fontes, prioridade, datas técnicas e exclusão lógica.
- `case_update_history`: cópias anteriores às edições e exclusões. Sem UPDATE/DELETE concedidos pela API.
- `case_tracking_summary`: view com `security_invoker`, que respeita a RLS do arquivo e calcula última data editorial e modificação técnica. Publicação original permanece em `published_at`/`publicado_em`.
- RLS reutiliza `is_arquivo_sombrio_admin()`, baseado em `app_metadata`. Usuários comuns e anônimos só leem atualizações não excluídas de arquivos publicados.
- Triggers de validação executam com privilégios do chamador, validam datas, limites e fontes HTTP/HTTPS, preservam snapshots e gerenciam a data de encerramento.
- Textos e títulos são escapados na renderização. Não é aceito HTML nas atualizações.
- Atualizações editadas usam a data técnica como trava contra sobrescrita de outra sessão.
- Correção da sequência de IDs de Garimpo: avança até o maior ID existente, sem alterar registros.

## Integração pública

Cards, resultados de busca e lists de Dossiês/Garimpo identificam registros ativos. Filtros de acompanhamento se combinam com os filtros existentes. Compartilhamento usa o mesmo catálogo e URLs. A cronologia dos acontecimentos, as evidências, hipóteses e referências originais são preservadas; atualizações possuem uma seção própria e fontes identificadas por entrada.

SEO mantém canonical, metadados, schema Article e URL. O schema distingue `datePublished` e `dateModified`. O sitemap é atualizado pela rotina pública já existente de sincronização Lite, aproximadamente a cada cinco minutos, mantendo os endereços dos arquivos.

Lite exporta selo, aviso, datas, atualizações, fontes e encerramento para HTML estático; mantém JavaScript ES5 nos filtros. A sincronização depende da rotina já existente de cinco minutos. A gestão dessas atualizações fica na V2.

## Validação

- `tests/case-tracking.sql`: teste transacional com RLS de administrador, usuário comum e anônimo; criação, edição, publicação, múltiplas atualizações, fontes, validação de data futura/URL insegura, histórico, exclusão, encerramento, data original e ausência de exposição de rascunhos. Finaliza com ROLLBACK.
- `tests/case-tracking.mjs`: testes DOM dos controles administrativos, fontes, edição, exclusão, histórico, ordenação, publicação sem conflito com a classificação, escaping, selo, datas, canonical, schema e filtros/links de compartilhamento. Instalar dependências com `npm ci --prefix tests`; executar `node tests/case-tracking.mjs`.
- Lite: testes existentes de publicação, embargo, escaping, categorias e biblioteca; novos testes em `lite/test_tracking.py` na branch `feature/arquivo-lite-ios9`.
- Verificação sintática dos arquivos JS/Python e `git diff --check`.
- Auditoria Supabase: nenhuma advertência adicional associada às estruturas novas; advertências anteriores de outros componentes não foram alteradas.

## Limites de verificação

Os testes DOM não substituem a inspeção visual em aparelhos reais. A infraestrutura desta sessão não oferece emulação de múltiplas telas nem sessão administrativa autenticada para vistoria visual de ponta a ponta da V2. CSS inclui quebra de colunas, controles flexíveis, limites de largura e fontes com quebra de URLs longas. A compatibilidade iOS 9 é estática/ES5, sem validação em um iPad físico nesta sessão.

O primeiro caso de São Paulo é somente um rascunho estrutural. Não há confirmação inserida de quantidade de vítimas, conexão entre ocorrências, método, suspeito ou assassinatos em série. A publicação depende de apuração e fontes confiáveis.
