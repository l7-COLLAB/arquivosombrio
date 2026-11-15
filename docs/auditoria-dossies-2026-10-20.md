# Auditoria estrutural dos dossiês publicados — 2026-10-20

Fonte: consulta **somente leitura** ao Supabase de produção, tabela `public."Casos"`, `status_publicacao='publicado'`. Não foi feito UPDATE, INSERT ou DELETE.

## Visão geral

- Total publicados: **19**
- Sem resumo: **0**
- Sem narrativa identificável: **0**
- Sem evidências identificáveis: **0**
- Sem bloco de cronologia: **2**
- Sem bloco de fontes: **2**
- Sem documentos vinculados: **5**
- Sem local/ano: **0**

## Pendências por título

| Dossiê | Fontes (bloco) | Cronologia (bloco) | Documentos |
|---|---|---|---|
| A família Turpin | Presente | **Não identificado** | Presente |
| Caso Dana Chandler | **Não identificado** | Presente | **Não identificado** |
| Christa Pike | Presente | Presente | **Não identificado** |
| Joseph DeAngelo | Presente | Presente | **Não identificado** |
| Lizzie Borden | **Não identificado** | **Não identificado** | **Não identificado** |
| Marc Dutroux | Presente | Presente | **Não identificado** |

Os 13 dossiês restantes não apresentaram ausência nos três elementos acima segundo esta consulta estrutural.

## Priorização
1. **Lizzie Borden**: revisar fontes, cronologia e documentos, nessa ordem.
2. **Dana Chandler**: revisar bloco de fontes e documentação.
3. **Família Turpin**: estruturar cronologia, preservando narrativa.
4. **Christa Pike, Joseph DeAngelo e Marc Dutroux**: verificar documentação disponível e pertinência de vinculação; ausência de anexo não é automaticamente erro.

## Critério e ressalvas

A verificação identifica somente se existe bloco de tipo `fontes` ou `cronologia` em `conteudo_blocos`, e se há documentos no array `documentos` ou em blocos `documento`. Conteúdo textual e listas fora desses campos podem conter fontes ou cronologias. A presença de blocos não comprova a qualidade do material. O relatório não valida factualmente narrativas, URLs, decisões judiciais, imagens nem direitos de uso. Não criar material ou preencher campos automaticamente com inferências.

## Próxima ação técnica
Revisar esses seis registros com fontes externas confiáveis, registrar alterações em ambiente de preparo e submeter qualquer mudança de produção a validação de conteúdo e backup.