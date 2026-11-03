# Revisão de direitos e riscos editoriais — 03/11/2026

## Escopo e método
Leitura **somente de consulta**, sem alteração de artigos publicados, de 115 registros de capa em seis editorias; comparação com o manifesto `data/capas-documentais.json`; conferência contextual de dois dossiês em pesquisa por termo potencialmente controverso. Essa é uma triagem documental, **não** um parecer jurídico ou exame integral de licenças/obras.

## Capas publicadas
| Editoria | Capas/publicações | Correspondência com manifesto | Sem correspondência |
|---|---:|---:|---:|
| Dossiês (Casos) | 23 | 0 | 23 |
| Garimpo (casos_diarios) | 51 | 1 | 50 |
| Perícia | 17 | 9 | 8 |
| Lendas | 8 | 6 | 2 |
| Creepypastas | 8 | 5 | 3 |
| Novels | 8 | 0 | 8 |
| **Total** | **115** | **21** | **94** |

O manifesto original contém 33 entradas, incluindo materiais que não coincidem com capas **atualmente publicadas**. Portanto, 94 "sem correspondência" significa ausência de comprovação **neste inventário**, não declaração de ilegalidade ou falta absoluta de autorização.

A listagem item a item está em `docs/inventario-direitos-capas-20261103.csv`: URL publicada sem parâmetros de consulta, identificador, editoria, fonte conhecida, licença declarada quando existente e providência requerida.

### Exigências de revisão
1. Validar as 21 licenças declaradas na origem (autoria real, licença e condições de crédito/adaptação). Um manifesto interno não é autorização automática.
2. Para as 94 restantes, verificar se já há licenças ou autorizações em outros arquivos, registros editoriais e contratos. Registrar prova verificável **antes** de classificar uma capa como regularizada.
3. Dar prioridade a fotografias de veículos de imprensa, plataformas de streaming e materiais com marca ou crédito de terceiros; uma imagem visível em sites de notícias não é automaticamente reutilizável.
4. No cadastro Perícia, 17/17 capas publicadas possuem o campo `fonte_imagem` preenchido nesta consulta. **Fonte preenchida não prova licença.**
5. A capa do dossiê publicado `Casos.id=10` (Barbara Mackle) não estava definida no campo principal de imagem. Isso não constitui infração autoral, mas exige verificar a página renderizada antes de corrigir.
6. Estender o inventário a imagens internas em blocos narrativos, documentos, PDFs, fórum, conteúdo de usuários, vídeos, áudio, narrativas e publicações no Instagram — ainda **não cobertos** por esse levantamento.

## Triagem de alegações de alto risco
- **Dossiê `Casos.id=9`, Madeleine McCann:** o texto contém seção que reproduz rumores graves de terceiros e os classifica explicitamente como alegações sem documentação pública comprobatória, com exemplos de desmentidos. Apesar dessas ressalvas, a reprodução detalhada de imputações contra pessoas identificáveis continua a apresentar risco jurídico. **Ação: revisão jurídica humana da necessidade editorial, base documental e formulação.** Não reinterpretar o rumor como fato e não divulgar acusações adicionais no material promocional.
- **Dossiê `Casos.id=6`, Unabomber:** a palavra "Epstein" identificada na pesquisa se refere ao geneticista **Charles Epstein**, destinatário de um dos pacotes-bomba, sem relação com Jeffrey Epstein. **Ação: não classificar como erro**, pois seria falso positivo.
- Os demais dossiês não foram revisados frase a frase nesta etapa; não se deve declará-los juridicamente aprovados por ausência de palavras-chave.

## Portão operacional para futuras publicações
Usar `docs/CONTROLE_JURIDICO_EDITORIAL.md` em todas as editorias documentais. Quando faltarem provas, evidências de licença ou houver alegações gravosas, manter o item em revisão. O checklist humano ainda não é um bloqueio transacional do backend, e **não** deve ser apresentado como proteção técnica já implantada.

## Registros do trabalho
- Revisão do banco limitada a consultas e à migração de registro de aceite autorizada em etapa separada.
- Nenhuma fotografia foi removida/substituída e nenhum texto de dossiê publicado foi editado durante a triagem.
- Futura ação sobre imagens depende de verificar direitos e compatibilidade da substituição com leitores, SEO, links e agendamentos.
