# Fase 4.2 — Triagem editorial dos dados iniciais

Data: 22/10/2026.

## Fonte e limites
Inspeção do arquivo versionado `data/caso.js` na ramificação `feat/cronologia-interativa-fase2`; não representa o acervo remoto do Supabase nem arquivos criados via Admin V2. Os testes de regressão do commit `662c3981eb71d12de0517e43e97f9c2891fac70f` terminaram com sucesso, inclusive a execução 39888626048. O relatório JSON é gerado como artefato do workflow; esta triagem registra achados diretamente conferidos no arquivo versionado.

## Registros
| ID | Título | Categoria editorial | Encaminhamento |
|---|---|---|---|
| 101 | O Incidente do Passo Dyatlov | Caso histórico | Avaliar cronologia após pesquisa documental externa e conferência da versão remota |
| 102 | Análise de Luminol em Cenas de Crime | Conteúdo técnico | Cronologia opcional, não inserir eventos fictícios |
| 103 | O Homem de Somerton | Caso histórico | Avaliar cronologia após pesquisa documental externa e conferência da versão remota |
| 104 | Datiloscopia e Identificação Papiloscópica | Conteúdo técnico | Cronologia opcional, manter organização pedagógica |

Os quatro itens não possuem `conteudo_blocos` no arquivo inicial. Isso **não prova** ausência de datas, fontes ou conteúdo estruturado nas versões remotas do site. Não foram realizadas alterações em dados históricos.

## Prioridade
1. Conferir as versões efetivamente publicadas dos casos 101 e 103.
2. Verificar fatos, períodos, natureza documental e referências primárias antes de criar eventos.
3. Apenas se editorialmente pertinente, avaliar cronologia em 102 e 104.
4. Repetir auditoria sobre dados remotos mediante consulta autorizada, sem alterações.

## Situação
Auditoria inicial aprovada tecnicamente; integração aos conteúdos reais ainda pendente. Nenhuma publicação ou merge autorizado.
