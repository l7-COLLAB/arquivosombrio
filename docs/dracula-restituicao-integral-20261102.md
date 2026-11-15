# Drácula (1897) — protocolo de restituição e publicação integral

**Obra:** `public.novels.slug = 'dracula'` | Autor: Bram Stoker | Idioma da edição: pt-BR

## Fontes e direitos
- Texto original inglês: Project Gutenberg eBook 345, https://www.gutenberg.org/ebooks/345 (27 capítulos, texto em domínio público).
- Traduções recentes feitas por editoras e sites são obras derivadas protegidas, ainda que o romance original esteja em domínio público. É proibido importar, raspar ou reaproveitar outra tradução integral sem licença explícita.
- A capa histórica da primeira edição é de 1897: https://commons.wikimedia.org/wiki/File:Dracula_cover_600px.jpg (domínio público).

## Diagnóstico no banco (02/11/2026)
- 27 capítulos em `public.novel_capitulos`, 85.852 palavras em português; **0 publicados**.
- Capítulos **XII–XXVII (16)** identificados no próprio texto como condensados. Precisam de **restituição textual**, não apenas revisão ortográfica.
- Capítulos I–IV e VI–XI: preservar como rascunho até cotejo integral.
- Capítulo V: primeiro cotejo documental concluído, seis documentos presentes; prova literária parcial já trabalhada e removida nota interna de rodapé. **Ainda não marcado como aprovado.**
- A obra está em `status_obra='concluida'` por possuir a estrutura completa, mas `status_publicacao='rascunho'`. Não confundir os dois campos.

## Procedimento editorial para cada capítulo
1. Obter texto **integral** do respectivo capítulo inglês; manter referências de edição e capítulo.
2. Segmentar por cartas, diários, telegramas, recortes e datas; registrar a ordem original.
3. Cotejar a tradução existente com **todos os parágrafos** do inglês, identificando omissões, condensações, acréscimos e erros de sentido.
4. Traduzir diretamente do inglês cada trecho ausente, sem copiar traduções modernas de terceiros.
5. Revisar uniformidade de nomes, datas, topônimos, tratamentos pronominais, pontuação e vozes narrativas; preservar epistolaridade e características do século XIX.
6. Remover **somente depois da restauração** os avisos editoriais `[FIM DO CAPÍTULO ...]`, que não pertencem à obra literária. Não apagar uma nota como substituto da revisão.
7. Confirmar capítulos consecutivos (1–27), integridade de navegação, capa e exibição em dispositivos móveis.
8. Após a prova integral por capítulo, preencher a aprovação editorial privada com o hash do conteúdo. Toda nova edição exige nova aprovação do novo hash.
9. Publicar a obra **apenas** após 27 aprovações válidas e teste público no site.

## Proteção de publicação já instalada
A migration `supabase/migrations/20261102_dracula_editorial_publication_guard.sql` registra a trava de produção em 02/11/2026.
- `private.dracula_revisao_editorial`: tabela não exposta a `anon` nem `authenticated`.
- `trg_guardar_publicacao_dracula`: impede a passagem da obra para `publicado` se faltar capítulo, aprovação, íntegra, ou se um capítulo tiver mudado desde a aprovação.
- `trg_guardar_capitulo_dracula`: impede publicação individual sem revisão e hash correspondentes.
- O gatilho existente `trg_sync_novel_chapters_publication` publica todos os capítulos automaticamente ao publicar a obra. Por isso a trava **deve permanecer ativa**.

## Como aprovar um capítulo (somente após revisão editorial real)
Exemplo administrativo, **não executar em lote automaticamente**. A assinatura registra qual versão exata do texto foi aprovada:

```sql
UPDATE private.dracula_revisao_editorial r
SET estado = 'aprovado',
    cotejo_original_completo = true,
    passagem_integral_restituida = true,
    prova_literaria_concluida = true,
    hash_conteudo_aprovado = md5(c.conteudo),
    atualizado_em = now(),
    observacoes = 'Prova e cotejo integrais concluídos; referenciar evidências da revisão.'
FROM public.novel_capitulos c
WHERE c.novel_id = r.novel_id
  AND c.numero = r.capitulo_numero
  AND c.novel_id = (SELECT id FROM public.novels WHERE slug='dracula')
  AND c.numero = :numero_aprovado;
```

**Importante:** quantidade de palavras, ausência de marcadores e presença de capítulos **não provam integralidade**. A aprovação de conteúdo é decisão editorial documentada, não um cálculo automático.

## Bloqueadores
- [ ] Restituir o texto omitido dos capítulos XII–XXVII.
- [ ] Cotejar integralmente os capítulos I–XI, inclusive prova final do V.
- [ ] Revisar capítulos XXVI–XXVII após a restituição, pois o fim também foi marcado como condensado.
- [ ] Aprovar os 27 capítulos com hashes válidos.
- [ ] Publicar e testar navegação pública.

Rastreabilidade: issue #126, https://github.com/l7-COLLAB/arquivosombrio/issues/126 .
