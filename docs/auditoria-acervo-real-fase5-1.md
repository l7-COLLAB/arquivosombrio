# Fase 5.1 — Auditoria de acervo real (somente leitura)

Data: 22/10/2026. Origem: projeto Supabase Arquivo Sombrio, tabela pública `"Casos"`. Sem UPDATE/INSERT/DELETE.

## Totais
- 25 registros, 20 publicados e 5 rascunhos.
- 21 dossiês possuem bloco `cronologia` e 21 possuem bloco `fontes`.
- 327 itens nos blocos de cronologia.
- Apenas 5 itens possuem `link_fonte` diretamente no evento; 322 não possuem referência estruturada nos campos checados (`fonte`, `referencia`, `link_fonte`, `fonte_url`, `url_fonte`).
- Os 327 itens não possuem a natureza documental estruturada nos três campos auditados. Isso **não prova** falta de referências na narrativa ou em blocos de fontes.
- Os itens que não possuem campo `data` podem ser strings com data embutida: isso foi conferido em Lizzie Borden, Escola Base e Irmãos Menendez. Não os chamar de eventos históricos sem data sem exame de conteúdo.

## Rascunhos
| ID banco | Título | Cronologia | Bloco fontes |
|---|---|---|---|
| 20 | Cleveland | 1 | 1 |
| 100 | Jennifer Pan | 0 | 0 |
| 101 | Susan Powell | 0 | 0 |
| 102 | Natascha Kampusch | 0 | 0 |
| 103 | Jaycee Dugard | 0 | 0 |

## Bloqueio crítico: colisão dos identificadores
Os IDs 101 e 103 do arquivo versionado `data/caso.js` identificam Dyatlov e Somerton, mas **não** no banco real: o banco usa 101 para Susan Powell e 103 para Jaycee Dugard. Qualquer importação dos pacotes `docs/pacote-integracao-dyatlov-somerton-fase4-5.json` baseada em `caso_id` seria perigosa. Os pacotes não devem ser aplicados até mapear por identidade editorial verificada e revisar a correspondência com o banco.

## Prioridades propostas
1. Bloquear importações por ID legado ou validar ID + título + slug.
2. Criar rotina de migração *não destrutiva* de eventos em texto para objetos estruturados, mediante revisão caso a caso (sem inventar dados).
3. Vincular fontes aos eventos usando os blocos de fontes já existentes, após conferir correspondência documental.
4. Completar estruturas dos quatro rascunhos sem cronologia, quando pertinentes.
5. Reexecutar auditoria e homologar antes de qualquer publicação.

Os números refletem o instante de leitura da base. Não são atestado da completude histórica dos 25 dossiês.
