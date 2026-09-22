export const NAV=[
{group:"GERAL",items:[["overview","Visão geral"]]},
{group:"CONTEÚDO",items:[["dossies","Dossiês"],["garimpo","Garimpo Sombrio"],["pericias","Perícia"],["lendas","Lendas"],["creepypastas","Creepypastas"],["biblioteca","Biblioteca"]]},
{group:"NARRAÇÃO",items:[["narracoes","Narração do Arquivo"],["pronuncias","Pronúncias especiais"]]},
{group:"COMUNIDADE",items:[["comentarios","Comentários"],["forum","Fórum"],["denuncias","Denúncias"]]},
{group:"ADMINISTRAÇÃO",items:[["usuarios","Usuários"],["solicitacoes","Solicitações"],["midia","Mídia"],["fontes-central","Fontes"]]},
{group:"PUBLICAÇÃO",items:[["calendario","Calendário editorial"],["agendados","Agendados"],["rascunhos","Rascunhos"],["revisao","Revisão editorial"],["publicados","Publicados"],["arquivados","Arquivados"]]},
{group:"SISTEMA",items:[["tarefas","Pendências"],["historico","Histórico"],["saude","Saúde do site"],["configuracoes","Configurações"]]}
];
export const LABELS=Object.fromEntries(NAV.flatMap(g=>g.items));