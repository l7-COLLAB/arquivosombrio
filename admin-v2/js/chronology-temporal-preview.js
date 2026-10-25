// Prévia editorial sem escrita; não altera dados históricos nem cria precisão fictícia.
export function prepararPreviaTemporal(texto, categoria) {
 if(typeof texto!=="string") throw new TypeError("Texto original obrigatório");
 const original=texto, t=texto.trim();
 const modelo={texto_original:original,categoria_entrada:categoria,exige_revisao:true,publicavel_automaticamente:false};
 if(categoryHasNoTemporalData(categoria)) return {...modelo,resultado:"preservar_sem_data",motivo:"Marcador ou referência não é um evento temporal"};
 if(categoria==="data_com_horario") {
   const m=/^(\d{1,2}\/\d{1,2}\/\d{4}),\s*([^:]+):\s*([\s\S]+)$/u.exec(t);
   if(m) return {...modelo,resultado:"previsa_temporal",periodo_original:m[1]+", "+m[2],descricao_original:m[3],precisao:"data_com_horario_qualificado"};
 }
 if(categoria==="mes_ano_barra"){
   const m=/^([a-zçãéêíóôõú]+\/\d{4}):\s*([\s\S]+)$/iu.exec(t);
   if(m)return {...modelo,resultado:"previsa_temporal",periodo_original:m[1],descricao_original:m[2],precisao:"mes_ano"};
 }
 if(categoria==="periodo_aproximado"||categoria==="intervalo_ou_multiplas_datas"){
   const m=/^([^:\n]+):\s*([\s\S]+)$/u.exec(t);
   if(m)return {...modelo,resultado:"previsa_temporal",periodo_original:m[1],descricao_original:m[2],precisao:categoria};
 }
 return {...modelo,resultado:"revisao_manual",motivo:"Não foi possível separar período e descrição sem interpretação"};
}
function categoryHasNoTemporalData(c){return c==="referencia_auxiliar"||c==="marcador_sem_data"||c==="multiplos_eventos";}
