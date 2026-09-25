# Arquivo Sombrio Lite (protótipo isolado)

Esta pasta é uma prévia visual HTML/CSS para Safari do iOS 9.3.5. Não está publicada e NÃO sincroniza o acervo ainda. Não incorporar na produção sem testes.

## Decisões
- HTML sem JavaScript, fontes externas, animações ou imagens obrigatórias.
- Mesmo projeto editorial, sem login, fórum, recompensas ou áudio automático.
- CSS clássico e largura estreita para dispositivos antigos.
- Páginas finais deverão ser geradas previamente a partir SOMENTE de publicações públicas, evitando Supabase JS e credenciais privadas no cliente.
- O gerador futuro deverá escapar HTML, preservar a estrutura editorial (cronologia, fontes, evidências), gerar páginas por item, catálogo paginado e índice de busca estático ou pesquisa no servidor.
- Não copiar páginas modernas por iframe ou linkar para elas como se fossem compatíveis.
- Conferir política de direitos de imagem, noindex/canonical e publicação agendada antes de exportar.
- Testar HTTPS/TLS e certificado em aparelho real com iOS 9.3.5; emulador não substitui aparelho.

## Próximas etapas
1. Mapear tabelas/colunas públicas e regras RLS para cada categoria.
2. Construir gerador de HTML estático no pipeline de publicação, sem expor service role.
3. Implementar catálogo e páginas reais e atualizar a busca.
4. Testar carga, imagens e navegação no dispositivo.
5. Configurar hospedagem/subdomínio após validação.
