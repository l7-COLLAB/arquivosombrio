# Arquivo Sombrio — Plano de adequação jurídico-técnica
**Revisão:** 03/11/2026. **Escopo:** portal público, cadastro, Supabase, editorias e acervo multimídia.
**Estado:** diagnóstico + alterações preparadas em ramificação. **Não representa parecer jurídico nem certificação LGPD/WCAG.**

## Situação das 9 frentes
| Frente | Estado | Ação verificável / critério de conclusão |
|---|---|---|
| Versões legais e aceite | Preparado em PR; implantação pendente | Cabeçalhos de privacidade 1.4 (31/10/2026) e termos 1.2 (31/10/2026) alinhados aos registros finais; formulário de cadastro atualizado; aplicar migração SQL de gatilho antes do frontend e testar novo cadastro. Preservar histórico dos três aceites preexistentes. |
| Senhas e funções privilegiadas | Bloqueada/parcial | A organização Supabase está no **Free**; leaked-password protection nativa exige Pro. Não alterar plano ou cobranças sem autorização. Revisar as 2 funções SECURITY DEFINER sinalizadas, suas validações e chamadas, sem retirar exclusão de conta. |
| Direitos autorais (imagens, música, traduções) | Incompleto | Manifesto de 33 capas com proveniência disponível; ainda é preciso inventário item a item do restante do acervo. Avaliar licenças, fotografia, personagens, capas, traduções e músicas/áudios usados também no Instagram. |
| Controle editorial antes de publicar | Regra processual preparada | Checklist em CONTROLE_JURIDICO_EDITORIAL.md incluído nas instruções do repositório. **Não há bloqueio técnico validado** no Admin V2; testar integração com agendamentos antes de bloquear publicações. |
| ECA Digital e moderação | Pendente de avaliação e teste | Política de contas 18+ e checkbox existem. Verificar enquadramento dos conteúdos, riscos a menores e mecanismos de aferição quando exigidos; testar denúncia, contestação e resposta a conteúdo ilícito. |
| Contraste e acesso por teclado | Ajustes em PR; testes pendentes | CSS de páginas legais, link de salto, foco visível e metadados legíveis preparados; validar em dispositivo real, leitores de tela, modais e leitores de novels. |
| LGPD, transferências e retenção | Inventário parcial abaixo | Mapear cada operação, base legal por finalidade, titular, fornecedor, localização, medida contratual, retenção e procedimento de exclusão; comprovar fundamento de transferência internacional sob Res. ANPD 19/2024. |
| Avisos e cookies/rastreadores | Parcial | Analytics próprio começa por consentimento opcional, armazenado em localStorage, com recusa. Confirmar demais scripts e serviços de terceiros, política de revogação, logs e base legal por operação. |
| Política comercial e reembolso | Condicional | Site usa leitura gratuita e apoio voluntário Pix; caso haja venda ou assinatura, publicar informações pré-contratuais, arrependimento, cancelamentos, atendimento e reembolso compatíveis com CDC/Decreto 7.962/2013. |

## Fluxos de dados identificados (inventário inicial)
| Operação | Dados | Finalidade | Armazenamento | Pendência de prova |
|---|---|---|---|---|
| Cadastro e login | E-mail, nome/pseudônimo, ID, tokens/sessão, metadados de aceite | Autenticação e conta | Supabase Auth e legal_acceptances | Identificar prazos, consentimento informado e registro por versão sem retroatividade |
| Métricas de leitura opcionais | IDs aleatórios, conteúdo, tempo aproximado ativo, rolagem, origem categorizada, estado de login | Relatórios editoriais | reader_analytics; retenção agendada em 90 dias | Validar execução da limpeza e consistência em todas as páginas; não tratar pseudônimo como anonimização |
| Proteção contra abuso | Hashes de identificadores de tráfego na Edge Function, logs de rate limit | Segurança e prevenção de fraude | security_rate_limits e logs do fornecedor | Prazos de retenção, minimização, contrato e acesso |
| Fórum / Meu Arquivo | Perfil, publicações, comentários, marcações, histórico e preferências | Funcionalidades de usuário | Tabelas RLS no Supabase | Testes entre usuários, acesso anônimo, exclusão e backups |
| Formulário de ficção | Nome literário, e-mail, título, gênero, sinopse, trecho, declarações | Análise editorial privada | editorial_fiction_submissions | Retenção e descarte de originais não selecionados, restrição de acesso |
| Newsletter | E-mail, data e estado de confirmação/cancelamento | Correspondência editorial opcional | editorial_newsletter_subscribers | Testar double opt-in e descadastramento quando operacional |
| Feedback | Mensagem, e-mail opcional, página relacionada, tipo do problema | Atendimento e correções | visitor_messages | Política de retenção e informação de privacidade específica |
| Armazenamento de arquivos | Imagens, documentos, áudios, capas, arquivos privados de usuário | Conteúdo e serviços | Supabase Storage | Auditar licenças por arquivo, logs de download, URLs assinadas e segregação de buckets |
| Pix de apoio | Dados definidos pelo intermediador bancário; página divulga recebedor e chave | Contribuições voluntárias | Site e intermediador | Verificar natureza fiscal/comercial e informação ao consumidor |

### Armazenamento — observações
Buckets observados: `imagens` e `novel-capas` são públicos; `avatars`, `documentos`, `forum`, `mural-private`, `narracoes` e `studio-results` são privados. **O atributo public não comprova, sozinho, direitos de utilização nem políticas Storage corretas.** Não alterar o acesso sem mapear o consumo público do site.

### Terceiros e transferências internacionais
Fornecedores referidos na Política: Supabase, GitHub Pages, Cloudflare/Turnstile, Google Fonts, Font Awesome/cdnjs, jsDelivr. Supabase principal está na região `us-east-2` (EUA). Registrar para cada transferência: tipo de dado, local de tratamento, responsável, contrato, mecanismo da LGPD, prazo e documentação divulgada aos titulares. Não presumir que a utilização de fornecedor internacional, isoladamente, demonstre adoção de cláusulas-padrão da ANPD.

### Direitos de imagem e autoria — inventário pendente
- Identificar e conferir licenças de **todas** as capas de Dossiês, Garimpo, Perícia, Lendas, Creepypastas e Novels, incluindo os arquivos publicados anteriormente às 33 substituições documentadas.
- No levantamento de 02/11/2026, 16 matérias de Perícia publicadas possuíam imagem e 15 preenchiam `fonte_imagem`: priorizar a sem fonte preenchida, mas fonte não equivale a licença.
- Conferir cada imagem inserida nos blocos narrativos, no fórum, em documentos e nos cards, não apenas a imagem principal.
- Para filmes/livros: verificar limites de reprodução de cartazes, capas e materiais promocionais.
- Para novels: verificar obra original, edição, capa, tradução e licença independente da tradução.
- Para Instagram e narrações: licença de músicas, efeitos, vídeos, imagens, serviços de voz e eventuais restrições de uso comercial. Uso autorizado dentro de uma plataforma não autoriza automaticamente reutilização fora dela.

## Sequência segura de implantação das versões legais
1. Aplicar e validar `migracoes/2026-11-03-registro-aceite-versoes-legais.sql` **antes** de publicar o novo `js/public-narration.js`. A migração aceita tanto os pares antigos (1.1/1.2) como os novos (1.2/1.4).
2. Verificar `pg_get_functiondef('public.record_legal_acceptance()'::regprocedure)` e conferir que as permissões EXECUTE não foram abertas.
3. Publicar as páginas legais e o frontend de cadastro juntos, sem substituir, alterar ou remover os registros anteriores.
4. Criar conta de teste com consentimento real em ambiente apropriado; verificar que `legal_acceptances` recebeu as versões 1.2/1.4, e testar e-mail/idade/exclusão sem manipular contas reais.
5. Revisar todas as outras rotas de cadastro. Considerar aviso e novo aceite para usuários antigos quando juridicamente necessário; não fabricar consentimento retroativo.

## Limitações
- O pop-up próprio de métricas não garante que todo script externo está bloqueado até consentimento; verificar em navegador com inspeção de rede e armazenamento.
- O manifesto de capas identifica 33 arquivos, não o acervo integral; as autorizações devem ser conferidas.
- As funções SECURITY DEFINER examinadas incluem validações internas e não foram classificadas automaticamente como vulneráveis por terem privilégio.
- A página comercial/tributária deve ser validada em função do modelo de negócios real.
- Não publicar afirmação de conformidade integral ou imunidade a ações judiciais.
