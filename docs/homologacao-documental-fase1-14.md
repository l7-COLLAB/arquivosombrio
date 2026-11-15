# Homologação documental — Fase 1.14

Status: **pendente de validação visual e funcional**. Não equivale a aprovação para produção.

## Pré-condições

- Testar uma prévia publicada a partir da ramificação `feat/padronizacao-documental-etapa1`, não a página de produção (`main`).
- Não inserir informações de casos reais em fixtures de demonstração.
- Conferir os resultados do workflow `Regressão documental` no commit da proposta.
- Registrar data, dispositivo/navegador, URL de prévia, capturas e resultado para cada cenário.

## Matriz de testes manuais

| ID | Cenário | Critério para aprovação | Resultado |
| --- | --- | --- | --- |
| D01 | Dossiê com mais de cinco evidências | Todas aparecem, na ordem e sem truncamento | Pendente |
| D02 | Evidência expandida | Botão ABRIR/FECHAR alterna o conteúdo e `aria-expanded` corresponde ao estado | Pendente |
| D03 | Evidências antigas em texto livre | Título e detalhes legíveis sem sumiço de informação | Pendente |
| D04 | Evidência com metadados | Classificação, procedência, data e situação aparecem apenas se cadastradas | Pendente |
| D05 | Lista de fontes estruturadas | Títulos, instituições, datas e URLs exibidos corretamente | Pendente |
| D06 | Fonte textual com título e URL em linhas distintas | Aparece como uma referência com link válido | Pendente |
| D07 | Fontes com a mesma URL | Não duplicar visualmente; manter a referência completa no banco | Pendente |
| D08 | Fonte sem URL válida | Exibir referência textual sem criar link inválido | Pendente |
| D09 | Documento com metadados opcionais | Campos presentes aparecem, ausentes não geram lacunas visuais | Pendente |
| D10 | Documento com link original | Link abre em nova aba com `noopener noreferrer` | Pendente |
| D11 | Cronologia documentada | Todos os eventos e datas registrados permanecem visíveis | Pendente |
| D12 | Desktop e celular (375px / 768px / 1280px) | Sem rolagem horizontal indevida ou texto cortado | Pendente |
| D13 | Modos livro e scroll; escuro e papel antigo | Fontes, links e cartões legíveis; sem quebra de paginação crítica | Pendente |
| D14 | Modo Lite iOS 9.3.5 | Sem regressão de navegação e leitura; testar em dispositivo real se possível | Pendente |
| D15 | Admin V2 | Compilação mantém avisos editoriais não bloqueantes e compatibilidade | Pendente |
| D16 | Acessibilidade via teclado | Links e botões navegáveis; foco visível e sem armadilhas | Pendente |

## Critérios de publicação

1. Todas as verificações automatizadas do commit candidato concluídas com sucesso.
2. Cenários D01–D13 e D15–D16 aprovados na prévia, ou exceções documentadas e aceitas antes do merge. D14 exige verificação em equipamento compatível.
3. Nenhuma alteração automática nos dados publicados do Supabase.
4. Revisão final do diff, links e segurança.
5. Merge da PR #75 somente após homologação explícita.

## Registro de execução

- Prévia/ambiente: **não configurado nesta etapa**
- Navegadores e dispositivos: **não executado**
- Capturas: **não coletadas**
- Bloqueios: **ausência de ambiente de prévia da branch acessível nesta sessão**
- Decisão: **não publicar**

## Conferência técnica — 22/10/2026

- Pull request #75 permaneceu aberto, em rascunho, com `mergeable=true` e `mergeable_state=clean` no SHA `855703a5185a0dbcf61686f951c146223ac03d2f`.
- Seis workflows deste commit concluíram com `success`: Regressão documental, Admin V2, sitemap/SEO, marcador de leitura, controles móveis e leituras relacionadas.
- Esses testes verificam código e regressões automatizadas; **não constituem teste visual no navegador**.
- A tentativa de inspecionar `https://arquivosombrio.net.br/caso.html?id=28` não foi bem-sucedida no ambiente de navegação desta sessão.
- Os cenários D01–D16 permanecem pendentes de homologação visual/manual em prévia da ramificação. O modo Lite exige dispositivo compatível.
- Decisão: **não publicar e não marcar homologação como aprovada**.

## Conferência de artefatos — 22/10/2026

- Execução Chromium: https://github.com/l7-COLLAB/arquivosombrio/actions/runs/39857888667, concluída com `success`.
- Artefato `capturas-dossie-documental` localizado, tamanho 189288 bytes, `expired=false` no momento da conferência.
- Cenários automatizados: sete cartões, botão expandir/recolher, atributos de segurança dos links, ausência de rolagem horizontal em 375, 768 e 1280 px. Não representam a totalidade dos cenários D01–D16.
- As imagens PNG do artefato **não foram abertas ou inspecionadas visualmente nesta sessão**. Não declarar aprovação estética ou homologação manual.
- GitHub informou PR #75 em rascunho, `mergeable=true` e `mergeable_state=clean` no commit `6a4f98e74de28d495aac0dd3758e61c61f208d3f`.
- **Decisão: manter a PR em rascunho e não realizar merge.** Necessária análise humana das capturas e testes da página real com modos de leitura.
