# Arquivo Sombrio Studio — versão 0.1.1

Aplicativo local para Windows que entrega **MP4 de verdade**, com roteiro dividido
em cenas, fotografias, narração, legendas e transições. Interface em português.
Não publica no Instagram e não modifica o site.

## Instalação no Windows

1. Extraia a pasta inteira para `C:\ArquivoSombrioStudio`.
2. Tenha Python 3.11 ou superior instalado. Na instalação, marque **Add Python to PATH**.
3. Abra `INSTALAR.bat` e espere concluir. Requer internet e baixa dependências.
4. Abra `INICIAR.bat`. A interface abrirá em http://127.0.0.1:8505.
5. Mantenha o terminal aberto durante a geração. Para fechar, use Ctrl+C no terminal.

Não precisa de Git, Node, ImageMagick ou placa de vídeo dedicada. O FFmpeg é
localizado no sistema ou fornecido por imageio-ffmpeg. A primeira instalação
pode baixar esse executável. A transcrição opcional exige download adicional.

## Caminho mais automático

1. Na barra lateral, configure a API de planejamento: URL base, chave e nome do modelo.
   Aceita protocolo `/chat/completions`. Exemplo de URL: `https://api.openai.com/v1`.
   Para Ollama local: `http://localhost:11434/v1`, com modelo instalado e chave vazia.
   Claude nativo usa outro protocolo; necessita gateway compatível nesta versão.
   Uma assinatura de ChatGPT/Claude não fornece automaticamente créditos de API.
2. Configure a chave do Pexels ou Pixabay. As páginas para obtê-las estão na interface.
3. Cole instruções que incluam o roteiro e os fatos. Links sozinhos não são lidos.
4. Clique **Preparar e gerar automaticamente · prévia**.
5. Revise o vídeo na aba 3. Troque as imagens na aba 2 quando necessário.
6. Desmarque **Prévia rápida** e clique **GERAR VÍDEO MP4** para Full HD.

O atalho automático usa fotos de banco ilustrativas e Edge TTS, sem música por
padrão. Não gera imagens pagas silenciosamente. Se uma busca não encontrar uma
imagem única, salva o projeto e informa qual cena precisa de atenção.

## Sem API de planejamento

Escolha **Colar somente narração · sem API**. Cole apenas o texto a ser falado,
com parágrafos separando cenas. Prepare, importe fotografias ou escreva termos
para buscá-las e use **GERAR VÍDEO MP4**. As orientações visuais são configuradas
pelos controles. Não cole instruções de edição no campo de narração.

## Recursos implementados

- Pedido livre interpretado por API compatível com OpenAI; roteiro manual sem API.
- Storyboard editável: texto, termos de busca, imagem, fonte, ordem e tipo.
- Fotografias via Pexels/Pixabay, importação de JPEG/PNG/WebP e busca automática.
- Geração opcional de imagens por API `/images/generations`, com clique explícito.
  O servidor deve aceitar `size=1024x1536` e responder com `b64_json` ou `url`.
- Duas vozes brasileiras via Edge TTS; importação de áudio MP3/WAV/M4A/FLAC/OGG.
- Legendas sincronizadas pelos tempos da síntese; importação de SRT com áudio.
- Whisper local opcional para transcrever áudio sem SRT, pelo `INSTALAR_TRANSCRICAO.bat`.
- Legendas amarelas com contorno preto, até duas linhas, na parte central inferior.
- Título branco fixo no canto superior direito, com margem para controles do Instagram.
- Fotografias em preto e branco, preservadas inteiras sobre fundo escuro, sem movimento automático e com dissolução entre cenas.
- Fade de imagem e áudio no início e no fim. O fade é aplicado depois dos textos.
- Música importada com volume ajustável e redução automática durante a voz.
- Prévia 360×640 e exportação 1080×1920, H.264/AAC, 30 fps.
- Baixar MP4, WAV, SRT e registro de fontes; salvar e reabrir projetos; ZIP portátil.
- Cache de falas e cenas completas. Alterações reutilizam etapas não modificadas.
- Não corta a fala para forçar o tempo desejado. Informa o tempo real e o desvio.

## Fotos reais e imagens ilustrativas

Pexels e Pixabay fornecem imagens de banco. Uma busca relacionada ao tema não
identifica automaticamente pessoas, locais ou documentos de um crime real.
As imagens encontradas e geradas recebem **IMAGEM ILUSTRATIVA**. Para fotografias
históricas verificadas, importe manualmente, registre a fonte e selecione
**Registro real verificado**. A marcação não faz uma verificação automática.

O programa identifica termos e organiza imagens pelo tema; não contém nesta
versão um modelo visual capaz de provar a identidade de uma pessoa ou documento.
Revise a prévia e o enquadramento de cada fotografia antes de publicar.

## Áudio importado

Importe a narração já pronta do Kokoro e, se tiver, o SRT correspondente.
Sem SRT, instale Whisper pela opção extra. O modelo `base` baixa no primeiro uso.
A transcrição usa o áudio real, mas pode errar nomes: revise as legendas.
Com áudio importado, as imagens se distribuem proporcionalmente ao texto das
cenas; essa associação não é um alinhamento forçado palavra a palavra.

## Projetos e privacidade

Tudo é salvo na pasta `projects`. Chaves ficam somente na sessão do aplicativo,
não no projeto, ZIP ou GitHub. Ao fechar a sessão, será necessário digitá-las de novo.
O texto é enviado ao provedor de IA escolhido apenas ao solicitar interpretação.
As consultas são enviadas ao banco de imagens. A narração é enviada ao Edge TTS
quando essa voz é usada. Importar áudio+SRT e fotos permite renderizar offline.
O programa escuta apenas em `127.0.0.1`. Não exponha esta versão diretamente na internet.

Não há pausa com retomada no mesmo frame. Se fechar durante a geração, reabra
o projeto e gere novamente; apenas etapas completamente concluídas são reutilizadas.

## Base MoneyPrinterTurbo

Referência original: https://github.com/harry0703/MoneyPrinterTurbo

Este Studio é uma aplicação nova com arquitetura inspirada no projeto original e
reutilização efetiva de seu leitor SRT, sob licença MIT, no commit
`33dde166da7f75287ea727c10e37243f03d167c8`. Créditos e licença em `vendor/`.
Não é um fork completo nem a versão oficial do MoneyPrinterTurbo.
O motor FFmpeg do Studio foi escrito para este fluxo e tem menos dependências.

Também é possível exportar um projeto para a CLI oficial:

```bash
python mpt-export.py projects/ID/projeto.json
```

Em uma instalação separada do original, use:

```bash
python cli.py --batch-file CAMINHO/moneyprinter-batch.json
```

Essa exportação preserva roteiro, ordem e materiais; os acabamentos exclusivos
do Studio (título, P&B e fades finais) não são transferidos para a CLI original.

## Testes e limites desta entrega

Verificados em Linux: render real em prévia e Full HD, trilha, áudio importado,
SRT, transições, duração, cache e fluxo da interface via Streamlit AppTest.
Os `.bat` foram revisados; ainda precisam de execução no Windows da usuária.
A síntese Edge não pôde ser validada neste ambiente devido a erro de certificado.
APIs de texto e imagens foram implementadas, mas não testadas com credenciais reais.

```bash
python -m unittest discover -s tests -v
```

## Próximas evoluções

- Comparar visualmente as imagens com a descrição da cena.
- Alinhamento forçado de roteiro e áudio importado.
- Linha do tempo com ajuste manual do início/fim das cenas e vídeos como materiais.
- Exportação para editor externo: o projeto atual é editável no próprio Studio,
  não é um projeto CapCut.
- Instalador Windows com Python incluído e atualização automática assinada.
- Versão hospedada com contas e fila de renderização; não implementada nesta entrega.

Software gratuito sob MIT. APIs podem ter custos e limites próprios. Fotografia
e voz dependem da disponibilidade e das condições de seus respectivos serviços.


## Correção 0.1.1

Preserva a fotografia inteira, sem cortar para preencher 9:16. Áreas livres recebem fundo escuro. Remove o zoom automático que podia causar saltos de pixels. Invalida apenas o cache visual anterior; projetos, imagens e áudio permanecem.

Para atualizar a instalação existente: feche o Studio com Ctrl+C e copie somente engine.py desta versão para a pasta original, substituindo o arquivo. Reabra INICIAR.bat e gere uma nova prévia. Não substitua nem apague a pasta projects. Não é necessário reinstalar dependências.

Fotos reais devem ser marcadas como Registro real verificado em cada cena; a atualização não modifica essa classificação automaticamente.
