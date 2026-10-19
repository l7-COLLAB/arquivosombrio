# Etapa 28 — navegação entre editorias

Cada página HTML canônica pode exibir, após as sugestões de sua própria editoria, um bloco **Explore outras editorias** com até duas leituras de editorias diferentes.

A seleção é determinística e usa exclusivamente registros públicos já consultados na geração do sitemap. A rotação por ID evita que todas as páginas apontem sempre para os mesmos documentos. Não há inferência de semelhança criminal, forense ou histórica; a interface declara expressamente que são opções de navegação, não vínculos factuais.

Os destinos são URLs HTML canônicas já existentes. O auditor da Etapa 27 verifica automaticamente links para páginas ausentes e páginas órfãs. Sem mudanças no leitor, Admin V2, banco, conteúdo editorial ou URLs legadas.

Os testes comprovam que os links cruzados levam a páginas efetivamente geradas de editorias diferentes e que editorias vazias não geram sugestões fictícias. A publicação é condicionada a CI e deploy aprovados.
