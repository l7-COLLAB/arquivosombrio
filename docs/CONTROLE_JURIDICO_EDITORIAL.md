# Controle jurídico-editorial — Arquivo Sombrio
Atualizado em 03/11/2026 · Uso interno · Revisão jurídica humana recomendada.

## Regra geral
Nenhum caso real deve ser publicado ou ter seu status alterado para `publicado` sem revisão documental, de direitos de personalidade e de direitos de uso dos materiais. A preparação e assinatura deste checklist **não automatizam** bloqueios no Admin V2 ou no Supabase; até a implementação de um bloqueio técnico, a exigência é processual e deve ser verificada pelo responsável editorial.

## Registro por publicação
- Identificador / seção / título / URL final:
- Data, revisor editorial e última checagem:
- Estado: rascunho / em revisão / aprovado / publicado.
- Versão examinada e hash ou link imutável da versão do conteúdo:
- Fontes primárias consultadas, links, datas de consulta e cópias autorizadas:

## Portão obrigatório antes de publicar
- [ ] A identidade das pessoas, datas, locais e andamento processual está documentalmente comprovada.
- [ ] Separar fatos reconhecidos, depoimentos, alegações de imprensa, hipóteses e boatos. Atribuir claramente cada afirmação à sua fonte.
- [ ] Não apresentar investigados, suspeitos ou pessoas absolvidas como culpadas. Verificar absolvições, arquivamentos, recursos, prescrições e atualizações.
- [ ] Para alegações gravosas ou ainda controvertidas, exigir fonte de alta confiabilidade e necessidade editorial; retirar acusações sem suporte. A indicação "boato" não neutraliza, por si só, o risco jurídico.
- [ ] Considerar intimidade, honra, imagem e vida privada de vítimas, familiares, crianças e pessoas não públicas; suprimir dados desnecessários.
- [ ] Confirmar necessidade, identificação e contexto de fotografias reais; não apresentar ilustração ou imagem sintética como evidência documental.
- [ ] Registrar titular/licença/fundamento, fonte, permissão de adaptações e exigências de crédito para **cada** fotografia, capa, vídeo, mapa, documento e obra.
- [ ] Verificar se direitos autorais de textos, traduções, narrativas, músicas e áudios estão cobertos independentemente da obra original ou da fotografia.
- [ ] Analisar classificação e avisos de conteúdo sensível e obrigações aplicáveis do ECA Digital; não confiar exclusivamente na autodeclaração de 18 anos quando a lei exigir aferição confiável.
- [ ] Conferir hyperlinks, documentos originais, datas de acesso e trechos citados, respeitando os direitos de terceiros.
- [ ] Conferir critérios de publicidade/afiliação se existirem links remunerados e informar eventual relação comercial claramente.
- [ ] Aplicar revisão de acessibilidade: texto alternativo informativo, imagem decorativa com alt vazio, contraste, foco, navegação por teclado e modal acessível.
- [ ] Confirmar canal de correção/contestação, registro das retificações e preservação documental adequada.
- [ ] Registrar aprovação editorial e jurídica quando houver acusações controvertidas, menores, imagens íntimas, caso em andamento ou alto risco de identificação.

## Após a publicação
1. Registrar horário, versão publicada, editor e fontes em sistema de auditoria.
2. Monitorar pedidos de correção, notificações e comunicados oficiais sem modificar silenciosamente o histórico de alterações.
3. Diante de contestação consistente, avaliar resposta proporcional e imediata, com apoio jurídico quando necessário.
4. Aplicar o mesmo fluxo de revisão ao atualizar trechos, capas, títulos e repostagens em redes sociais.

## Critérios de recusa
Não publicar material cuja fonte seja apenas rumor, cuja licença seja inexistente ou desconhecida quando exigível, que exponha desnecessariamente dado sensível ou que afirme culpa criminal sem respaldo. Encaminhar para reavaliação jurídica ou retirar o trecho.

## Limite de implementação
Este documento define o padrão editorial humano. **Ainda falta implementar e testar um bloqueio técnico real de publicação** que exija evidências de aprovação no Admin V2 e faça a verificação também no backend; uma validação apenas em JavaScript no navegador seria contornável. Não aplicar triggers bloqueantes diretamente sem mapear publicações agendadas e fluxos existentes.
