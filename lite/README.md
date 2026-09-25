# Arquivo Sombrio Lite — protótipo isolado

Versão HTML/CSS de baixo consumo para Safari antigo. Esta ramificação NÃO está publicada. O gerador está implementado, mas a exportação automática do banco ainda NÃO está integrada.

## Gerador estático

Execute na raiz do repositório:

```sh
python3 lite/test_build.py
python3 lite/build.py lite/publications.json lite/dist
```

O arquivo `publications.json` está vazio intencionalmente. Nunca adicione rascunhos, dados privados ou chaves de serviço. Para validar manualmente, use exclusivamente registros editoriais públicos já revisados.

Exemplo de estrutura de entrada (exemplo fictício, não publicar como caso real):

```json
[{
  "slug": "exemplo",
  "titulo": "Exemplo de estrutura",
  "categoria": "dossies",
  "status_publicacao": "publicado",
  "publicado_em": "2026-09-01T12:00:00-03:00",
  "resumo": "Resumo de exemplo.",
  "conteudo": ["Primeiro parágrafo.", "Segundo parágrafo."],
  "cronologia": ["01/09: exemplo."],
  "evidencias": ["Exemplo."],
  "fontes": ["Fonte de exemplo."]
}]
```

Categorias aceitas: dossies, garimpo, pericia, biblioteca, lendas. O gerador omite tudo que não esteja publicado ou tenha data futura, valida slug e escapa o conteúdo para evitar injeção HTML. Gera arquivos individuais e índice paginado a cada 12 registros. Pesquisa ainda pendente.

## Pendências obrigatórias antes de publicar
1. Mapear tabelas e campos reais, incluindo textos completos, fontes, cronologia e capítulos de novels.
2. Implementar exportação somente de conteúdo público no pipeline confiável, sem expor credenciais ou usar Supabase JS no iOS 9.
3. Tratar formatação editorial revisada, imagens licenciadas e eventuais anexos.
4. Adicionar pesquisa estática ou de servidor e teste de paginação com acervo real.
5. Conferir cache, publicação agendada, remoção/correção de conteúdos e SEO/canonical.
6. Testar Safari real iOS 9.3.5, TLS, memória e tempos de navegação.
7. Configurar hospedagem/subdomínio somente após aprovação.

Não mesclar a ramificação até a validação.
