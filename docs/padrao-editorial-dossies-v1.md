# Arquivo Sombrio — Padrão editorial documental v1

## Objetivo
Uniformizar o trabalho com fontes, evidências, cronologias e documentos sem mudar a narrativa já publicada nem exigir migração destrutiva do banco de dados.

## Princípios
- Fatos documentados, declarações atribuídas, hipóteses e controvérsias devem ser claramente separados.
- A ausência de fonte não pode ser preenchida por inferência ou conteúdo inventado.
- Imagens, reportagens e documentos devem ter origem identificável e contexto.
- Pessoas investigadas ou acusadas não devem ser apresentadas como condenadas sem fundamento judicial.
- Pessoas vítimas devem ser descritas com precisão e dignidade, evitando dramatização fictícia.
- A documentação deve preservar URLs, títulos, autores/instituições e datas de acesso quando disponíveis.

## Estrutura mínima recomendada de um dossiê
1. Identificação: título, resumo, local, período, categoria e situação do caso.
2. Contextualização e histórico das pessoas envolvidas, apenas quando verificáveis e relevantes.
3. Narrativa cronológica dos acontecimentos com distinção entre fatos, depoimentos e versões.
4. Investigação: procedimentos, provas, limitações e resultados.
5. Cronologia de eventos com data, descrição e referência.
6. Evidências: descrição, origem, classificação e grau de confirmação.
7. Hipóteses/controvérsias: atribuição explícita, contrapontos e situação.
8. Desdobramentos e situação judicial, com datas.
9. Fontes e materiais: documentos, reportagens e mídia com créditos.
10. Registro editorial: última revisão, ressalvas e pendências.

## Modelo de registro de fonte (compatível como metadado editorial)
```json
{
  "titulo": "Título exato da fonte",
  "url": "https://exemplo.org/documento",
  "instituicao": "Órgão, veículo ou autor",
  "tipo": "documento_oficial",
  "data_publicacao": "AAAA-MM-DD",
  "data_acesso": "AAAA-MM-DD",
  "observacoes": "Escopo e possíveis limitações"
}
```
Tipos sugeridos: documento_oficial, decisao_judicial, reportagem, entrevista, artigo_cientifico, livro, outro.

## Modelo de evidência
```json
{
  "titulo": "Descrição curta",
  "descricao": "O que é conhecido, sem extrapolar",
  "classificacao": "documentada",
  "fonte": "Referência verificável",
  "observacoes": "Limitações da evidência"
}
```
Classificações sugeridas: documentada, relatada, contestada, nao_confirmada. A classificação avalia a afirmação editorial, não substitui laudo pericial ou decisão judicial.

## Critérios de revisão
- Conteúdo sem referência para alegações sensíveis: sinalizar para revisão, não completar automaticamente.
- Links ausentes/quebrados: registrar pendência.
- Fonte que não sustenta a afirmação: reescrever a afirmação ou buscar evidência adequada.
- Informações divergentes: atribuir cada versão e não apresentar consenso inexistente.
- Não reutilizar imagem de pessoa, local ou documento para representar outro sem aviso explícito.
- Dados pessoais de pessoas não públicas e menores: minimizar exposição.

## Compatibilidade com a estrutura atual
O código existente reconhece blocos `cronologia`, `evidencias`, `hipoteses`, `situacao_oficial`, `fontes`, `documento` e `video`. Os exemplos acima descrevem **metadados editoriais recomendados**, não uma alteração automática do esquema Supabase. Não substituir arrays legados sem avaliar os renderizadores e as tabelas do banco.

## Sequência de implantação
1. Aplicar diagnóstico não destrutivo aos dossiês.
2. Priorizar arquivos com fontes insuficientes, controvérsias sem atribuição e documentação incompleta.
3. Revisar fontes e conteúdo caso a caso.
4. Adaptar formulários V2, renderizador e banco somente após testes.
5. Fazer publicação gradual, mantendo histórico de alterações e opção de reversão.
