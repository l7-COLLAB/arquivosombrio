# Studio Web da V2

Página: `/admin-v2/studio/`. O menu da V2 aponta para ela. O site existente continua no GitHub Pages. O código Python é excluído do artefato público.

## O que funciona

Interface responsiva com sessão administrativa existente, roteiro manual, cenas reordenáveis, imagens com fonte e identificação, áudio/SRT/música importados, voz online, referência Chatterbox, prévia e MP4 Full HD. Projetos completos ficam em IndexedDB neste navegador e podem ser baixados em JSON. Não há sincronização de projetos entre dispositivos. Referências de voz ficam no servidor e não entram no JSON. Imagens são reduzidas para até 1920 pixels no navegador. O envio completo tem limite de 100 MB.

A página não contém simulação de geração. Sem um adaptador Python ativo, mostra a indisponibilidade e mantém preparação e exportação de projetos. A hospedagem Python e seu endereço ainda precisam ser provisionados. Não há servidor contratado ou endereço inventado no código.

Planejamento via API e busca Pexels/Pixabay usam credenciais configuradas no ambiente do servidor: `STUDIO_PLANNER_URL`, `STUDIO_PLANNER_MODEL`, `STUDIO_PLANNER_KEY`, `STUDIO_PEXELS_KEY` e `STUDIO_PIXABAY_KEY`. As buscas retornam até quatro opções ilustrativas por cena. A geração de imagens por API continua disponível apenas no aplicativo desktop. A reprodução usa os controles nativos de vídeo; revise as legendas no SRT exportado. Não há editor de legenda palavra a palavra ou garantia de retomada após reinício do servidor.

## Instalação do serviço

Em Linux/Windows com Python 3.11 e FFmpeg compatível com libass:

1. Instale `requirements.txt` em um ambiente virtual. Para áudio importado sem SRT, instale `faster-whisper`. Para voz própria, use o ambiente `.venv_voice` descrito no README e no instalador existente. O endpoint de cadastro aceita referência mesmo antes da instalação; geração Chatterbox exige o módulo.
2. Configure no ambiente do processo `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` com os mesmos valores públicos usados pela V2, `STUDIO_ORIGIN=https://arquivosombrio.net.br`, `STUDIO_DATA_DIR` com diretório privado persistente e opcionalmente `STUDIO_PORT=8510`.
3. Execute `python web_api.py`. Escuta somente em `127.0.0.1`. Use um supervisor de processos com reinício e persistência de `web_data`, `voices`, `.venv_voice` e cache de modelos. Não execute múltiplos processos usando o mesmo diretório. A fila é sequencial e permite até dois trabalhos pendentes por administrador.
4. Publique por proxy reverso HTTPS. Exemplo Caddy no servidor (substitua o endereço pelo domínio real do servidor; o usuário continua acessando a página pela V2):

```caddy
ENDERECO_REAL_DO_SERVIDOR {
    request_body {
        max_size 100MB
    }
    reverse_proxy 127.0.0.1:8510
}
```

5. Coloque a URL HTTPS em `admin-v2/studio/config.js`, campo `ARQUIVO_VIDEO_STUDIO_API`, e publique o arquivo. Para teste, o administrador pode informar a URL em “Configurar serviço”. A interface solicita confirmação antes de enviar a sessão a um novo domínio. O token nunca vai para parâmetros de URL ou projetos.
6. Valide `/health` autenticado, geração de prévia e final e a voz real. O serviço consulta `/auth/v1/user` do Supabase em cada operação e exige `app_metadata.role=admin`; arquivos são restritos ao administrador que criou o trabalho.

Para API no mesmo domínio em `/admin-v2/studio-api/`, é necessário um proxy na frente do domínio atual. GitHub Pages sozinho não roteia requisições para Python. A página `/admin-v2/studio/` funciona tanto com API em outro domínio quanto com esse proxy; não é necessário alterar o endereço escolhido pela usuária.

## Operação

A geração continua ao fechar a aba; o computador/servidor deve permanecer ligado. A identificação do último trabalho fica no navegador e pode ser consultada ao retornar. Reinício do processo marca tarefas interrompidas como falhas; envie novamente o projeto salvo. Gerações concluídas ficam no disco do servidor até remoção administrativa. Dimensione memória, disco e a retenção dos arquivos; o serviço não apaga projetos automaticamente. Inferência real de Chatterbox e navegação em iPhone físico exigem validação no ambiente final.

Verificação local: `python -m unittest discover -s tests -p 'test_web_api.py'` dentro desta pasta.
