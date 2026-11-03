# Estúdio de Narração Humana — projeto por partes

Estado em 03/11/2026: **implementado em branch de desenvolvimento, SEM implantação em produção**. Este documento não equivale a homologação.

## Objetivo editorial
Permitir narrar com a própria voz, em partes pequenas, com **roteiro independente** do texto publicado. O texto do artigo permanece inalterado. Importar MP3s editados ao longo dos dias; ouvir e aprovar individualmente; só liberar quando todas as partes planejadas estiverem presentes e aprovadas.

## Jornada do administrador
1. Admin V2 → Narração → selecionar tipo/arquivo → Abrir roteiro.
2. Na área **Estúdio de Narração Humana**, indicar a quantidade total planejada de partes.
3. Adicionar títulos como “Abertura”, “Contexto”, “Investigação” e “Conclusão” e escrever roteiro/observações faladas por parte.
4. Gravar em aplicativo externo, editar e exportar MP3. Enviar uma parte por vez (até 30 MB por MP3); usar envio alternativo para arquivos até 10 MB quando CORS direto ao R2 não funcionar.
5. Ouvir prévia privada e aprovar a parte. Reordenar, regravar ou excluir rascunhos sem afetar uma versão pública já aprovada.
6. **Publicar narração completa** somente quando a quantidade de partes corresponder ao planejamento e todas estiverem aprovadas.
7. Se o artigo sofrer atualização após a publicação do áudio, reouvir, confirmar e publicar uma nova versão. Enquanto a versão humana estiver desatualizada, o player pode oferecer outra fonte de áudio aprovada.
8. É possível retirar a versão humana do ar sem apagar capítulos já publicados nem alterar áudio legado.

## Estrutura
- `human_narration_sets`: projeto, total esperado, ponteiro para versão ativa.
- `human_narration_parts`: ordem, título, roteiro particular, arquivo MP3, duração e aprovação.
- `human_narration_uploads`: envio temporário para R2 e verificações de conteúdo.
- `human_narration_releases`: manifesto congelado, nunca ligado diretamente ao rascunho atual.
- `human-narration-studio`: Edge Function com sessão do usuário, RPC de administrador e limite de uploads.
- `public-narration`: lê **somente a versão ativa** e gera URL assinada por trecho para usuário autenticado; continua com fallback legado.
- R2 privado, sem links públicos permanentes. Nenhuma chave secreta entra no JavaScript do navegador.

## Sequência obrigatória de implantação
1. Backup/snapshot e ambiente de testes. Avaliar volume atual, grants e riscos antes da migração.
2. Aplicar `sql/human_narration_parts_20261103.sql` em **staging** e conferir RLS, FK, acesso `anon` negado e acesso restrito do servidor.
3. Implantar Edge `human-narration-studio` com mesma verificação de JWT e permissões da função de importação manual; validar sessão admin, usuário comum, anônimo e contas diferentes.
4. Testar R2 PUT, HEAD, assinaturas, expiração, preview, upload interrompido, arquivo com MIME falso e MP3 >30 MB.
5. Implantar `public-narration` compatível com manifestos humanos. Testar `availability`, `manifest`, `chunk`, login exigido e reprodução sequencial.
6. Fazer deploy do Admin V2. Criar um projeto de teste, simular todas as etapas e testar em computador/iPhone/Android.
7. Só então mesclar/deploy para produção e registrar comprovação no Notion.

## Limites e tarefas de homologação
- Não houve execução real com MP3 ou teste em navegador nesta branch.
- A troca de ordem usa duas gravações sucessivas; deve ser refatorada para operação transacional se houver edição simultânea de múltiplos administradores.
- A publicação faz `INSERT` do snapshot e depois `UPDATE` do ponteiro ativo; eventual falha no segundo deixa snapshot não ativo, sem exposição pública. Adoção de RPC transacional é uma melhoria recomendada antes de escala.
- Arquivos R2 não referenciados ainda não são excluídos automaticamente; implementar limpeza segura preservando snapshots.
- Somente MP3 nesta versão; edição de ruído, redução de pausas e corte devem ser feitos antes do upload.
- O player público já reproduz chunks, mas a timeline marca a duração da parte atual; melhoria futura: timeline global com capítulos clicáveis e retomada por parte.
- Revisão editorial humana permanece obrigatória antes da publicação: datas, nomes, atribuição, hipóteses e créditos.

## Editor de áudio integrado — extensão de 03/11/2026
Esta PR também inclui `admin-v2/js/audio-editor.js`, integrado diretamente ao botão **Editar áudio** de cada parte. Processamento inteiramente local no navegador por Web Audio API: corte de início/fim, velocidade (0,90–1,25×), volume de voz, fade, filtros natural/clareza/grave/rádio/eco, trilha musical opcional em volume baixo e efeito pontual posicionado por segundos. O usuário pode ouvir prévia de 20 s a partir de um ponto selecionado e exportar a parte editada em WAV PCM mono 32 kHz. O botão de envio aceita MP3 ou WAV (até 30 MB por parte) e valida o cabeçalho no R2 antes de liberar para revisão.

**Limite técnico:** alteração de velocidade via `AudioBufferSourceNode.playbackRate` altera também o tom da voz; não anunciar preservação de pitch. WAV consome espaço maior que MP3; para duração acima de ~8 minutos, dividir a parte. Em celular, renderização longa pode falhar por falta de memória; usar trechos menores. Nem a prévia nem a edição são enviadas ao servidor antes do comando explícito de upload.

Música e efeitos são arquivos importados pelo administrador. Não existe catálogo incorporado de músicas comerciais. Quando há trilha ou efeito, o editor exige confirmação de direitos e informação de fonte/licença, persistida em `audio_rights_note` (dado administrativo). Antes da publicação, conferir se a licença exige atribuição pública no próprio artigo. O sistema não comprova automaticamente o direito autoral dos arquivos.

**Futuras melhorias:** preservar tom ao acelerar, redução de ruído por processamento especializado, compressão/exportação MP3 via backend seguro ou encoder local, waveform com corte visual, edição multipista e histórico de edição. Não declarar essas melhorias como entregues.
