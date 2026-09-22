export const NAV=[
{group:"GERAL",items:[["overview","Visão geral"]]},
{group:"CONTEÚDO",items:[["conteudos","Conteúdos e edição"]]},
{group:"PUBLICAÇÃO",items:[["rascunhos","Rascunhos"],["revisao","Revisão editorial"],["agendados","Agendamentos"],["midia","Mídia"],["fontes-central","Fontes"]]},
{group:"COMUNIDADE",items:[["comentarios","Comentários"],["forum","Fórum"],["denuncias","Denúncias"],["sugestoes","Sugestões"]]},
{group:"ADMINISTRAÇÃO",items:[["usuarios","Usuários"],["solicitacoes","Solicitações"],["historico","Histórico administrativo"]]}
];export const LABELS=Object.fromEntries(NAV.flatMap(g=>g.items));