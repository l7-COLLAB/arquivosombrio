# Jarvis Helpdesk — integração do WebChat (preparação)

Estado: **desativado**. Esta branch não envia mensagens de visitantes e não carrega nenhum script de terceiros até a configuração ser habilitada explicitamente.

## Implementação
- `index.html` referencia `/js/jarvis-webchat-loader.js`.
- O carregador só atua com `window.ARQUIVO_JARVIS_WEBCHAT.enabled === true`, `scriptUrl` HTTPS e `allowedOrigin` exatamente igual à origem do script.
- A integração final requer o **código de incorporação emitido pelo painel do Jarvis Helpdesk em helpdesk.jarvis.cx**. Não reutilizar snippets de outros produtos chamados Jarvis.
- Se o código oficial precisar de inline config/iframe, adaptar a integração ao formato documentado; não presumir que um único arquivo JS seja suficiente.

## Para completar após obter o snippet oficial
1. Identificar o canal Website / WebChat no painel e copiar seu código de incorporação (sem chaves privadas).
2. Conferir domínio autorizado `arquivosombrio.net.br` e linguagem pt-BR.
3. Configurar origem/script conforme a documentação do fornecedor e verificar política CSP aplicável.
4. Conferir layout mobile, botão de áudio e compartilhar, consentimento de privacidade/cookies, acessibilidade e performance.
5. Testar perguntas editoriais e de suporte em modo **Testing**. Não ativar respostas automáticas até validação.
6. Integrar após revisão, com opção para desligar rapidamente.

## Nota
Nunca incluir tokens de API, credenciais de administrador, nem dados de usuários em JS público.
