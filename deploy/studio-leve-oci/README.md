# Studio Leve 1.3.2 — implantação na OCI sem reconstrução

**Situação:** código de implantação preparado; instância OCI **ainda não provisionada**. A V2 existente e a rota \`/admin-v2/studio/\` **não devem ser substituídas** até validar o aplicativo original no servidor.

## Fonte de verdade

O executável é o ZIP enviado e aprovado pela proprietária: \`Estudio_Arquivo_Sombrio_1_3_2_Leve(1).zip\`, SHA-256 \`0d085a162aa6b772a91e10770aae0c394b9479f5cc844b37d6fbaf6323e8ddb5\`. O instalador confere este checksum e extrai o conteúdo **sem modificar o código do editor**. O ZIP não está armazenado neste repositório; transfira-o de forma privada para a VM e não publique projetos, mídias ou segredos no GitHub.

A aplicação original é \`Arquivo_Sombrio_Estudio/studio_app.py\` (Streamlit). Preservar as seis abas, layout e efeitos de áudio/vídeo. Os projetos e a senha ficam em \`/opt/arquivo-sombrio-studio/storage/studio_v1\` e exigem backup privado.

## Provisão exigida na conta Oracle (não automatizada)

1. Instância Ubuntu 24.04, arquitetura ARM64 com shape Always Free **somente se houver capacidade**; confirmar preço e limites reais antes de criar. Exemplo de dimensionamento inicial: 2 OCPUs e 12 GB RAM.
2. Utilizar VCN existente \`studio-rede\` se válida, subnet pública para administração via SSH. Abrir **somente porta 22** para IP administrativo confiável; **não abrir 8502, 8501 nem portas do Streamlit** no VCN, NSG ou firewall do Ubuntu.
3. Criar chave SSH e conservar a privada fora do repositório.
4. Transferir o ZIP e esta pasta \`deploy/studio-leve-oci\` para a VM Ubuntu. Dentro da pasta, executar:

   \`\`\`bash
   bash install.sh /caminho/Estudio_Arquivo_Sombrio_1_3_2_Leve\(1\).zip
   \`\`\`

5. No computador autorizado, abrir um túnel SSH:

   \`\`\`bash
   ssh -i /caminho/CHAVE_PRIVADA -L 8502:127.0.0.1:8502 ubuntu@IP_DA_VM
   \`\`\`

6. Abrir \`http://127.0.0.1:8502\` **pelo túnel SSH**, criar uma senha exclusiva no primeiro acesso e realizar testes completos. O setup inicial do Studio exige origem localhost; jamais tornar o setup público.
7. Examinar logs com \`sudo journalctl -u studio-leve -n 100 --no-pager\`. Testar quatro cenas, narração Antônio/Edge TTS, imagens, legendas, exportação MP4 e uso no Safari.
8. Fazer backup privado periódico do diretório \`storage/studio_v1\`, incluindo SQLite com checkpoint/backup consistente; monitorar disco, memória e CPU. Reinício do processo pode interromper renders em andamento.

## Publicar na V2, **somente após os testes**

- A V2 é hospedada pelo GitHub Pages e não pode encaminhar requisições HTTP para a VM diretamente pela rota \`/admin-v2/studio/\`.
- Manter o Studio Leve como aplicação original em subdomínio HTTPS privado, com proxy reverso WebSocket e **controle de acesso na borda** (VPN, gateway com autenticação ou equivalente), além da senha do aplicativo.
- O fato de uma URL estar disponível somente no menu administrativo da V2 **não protege** o serviço contra acesso direto. Nunca publicar o Streamlit usando apenas essa restrição visual.
- Após obter hostname real e camada de autenticação, adicionar acesso específico no menu V2 por revisão separada. **Não apagar nem substituir** o outro Studio Web existente em \`admin-v2/studio/\`.
- Se for indispensável usar o mesmo caminho \`/admin-v2/studio/\`, será necessário migrar o roteamento do domínio para uma infraestrutura com proxy, e isso requer plano específico e testes de regressão do site todo. Um link administrativo para o subdomínio privado é a opção menos invasiva.

## Limitações conhecidas

- Bibliotecas e FFmpeg devem ser validados em Linux ARM64 no servidor real. O pacote usa \`IMAGEIO_FFMPEG_EXE=/usr/bin/ffmpeg\` para escolher o binário nativo.
- Edge TTS requer conexão externa e pode sofrer indisponibilidade; não é um SLA de API oficial.
- O código da interface original **não foi reescrito**, mas resultado visual e áudio em dispositivos diferentes exigem teste.
- O **áudio automático dos arquivos públicos do site é escopo posterior**, não deve ser implementado nesta entrega.
