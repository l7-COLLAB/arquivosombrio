export function verificarAlvoEditorial(proposta, registro) {
 const alvo=proposta?.identidade_alvo;
 if(!alvo || alvo.estado!=="verificado") return {ok:false,motivo:"Identidade editorial ainda não verificada"};
 if(!Number.isSafeInteger(alvo.id_banco_verificado) || alvo.id_banco_verificado<=0) return {ok:false,motivo:"ID do banco inválido"};
 if(!alvo.slug_verificado || !alvo.titulo_exato) return {ok:false,motivo:"Título e slug obrigatórios"};
 if(!registro || registro.id!==alvo.id_banco_verificado || registro.slug!==alvo.slug_verificado || registro.titulo!==alvo.titulo_exato) return {ok:false,motivo:"O registro do banco não corresponde à identidade editorial"};
 return {ok:true};
}
