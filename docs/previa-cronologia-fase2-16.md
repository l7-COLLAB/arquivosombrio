# Prévia isolada da cronologia — Fase 2.16

A prévia está em `previews/cronologia-fase2.html`. Usa os arquivos reais `js/caso.js` e `css/caso.css` da ramificação e seis acontecimentos inteiramente fictícios. Não consulta o Supabase e não modifica casos publicados.

## Abrir no Windows

1. Baixe a ramificação `feat/cronologia-interativa-fase2` do repositório GitHub e extraia o conteúdo, ou faça checkout dessa ramificação.
2. Abra o PowerShell na **raiz** da pasta do repositório (onde ficam `caso.html`, `js` e `previews`).
3. Execute `py -m http.server 8000` (ou `python -m http.server 8000`).
4. No navegador, abra `http://localhost:8000/previews/cronologia-fase2.html`.
5. Para encerrar, use `Ctrl+C` no PowerShell.

**Importante:** `localhost` refere-se ao computador onde o servidor local foi iniciado, não ao domínio público. Não hospedar a prévia no ambiente de produção nem inserir chaves secretas, dados pessoais ou informações reais.

## Verificar

- Anos 1941, 1942, 1943 e 1944; atalho por ano e rolagem.
- Filtros Investigação, Perícia, Depoimento e Julgamento.
- Pesquisa `pericia` encontra o acontecimento com `Perícia`.
- Pesquisa sem resultados, botão para limpar filtros e contador.
- Categoria e natureza documental, detalhes expansíveis e metadados fictícios da fonte.
- 375 px, 768 px e computador; leitura sem sobreposição e links legíveis.

## Limites

Esta prévia é uma demonstração de componentes, **não** a página de um dossiê real. Para homologação definitiva, ainda é necessário verificar `docs/homologacao-cronologia-fase2-10.md` em ambiente separado com dados de casos reais, temas e modos de leitura. A presença de um link do GitHub para o arquivo HTML não significa que GitHub Pages esteja configurado.
