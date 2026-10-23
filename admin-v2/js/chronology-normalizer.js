// Conversão conservadora e não destrutiva para prévia editorial.
// Não escreve no Supabase e nunca infere fontes nem natureza documental.
const YEAR = /^((?:1[5-9]|20)\d{2})\s*[:—–-]\s*(.+)$/u;
const DATE = /^((?:0?[1-9]|[12]\d|3[01])\s+de\s+[a-záàâãéêíóôõúç]+\s+de\s+(?:1[5-9]|20)\d{2})\s*[:—–-]\s*(.+)$/iu;
const SLASH = /^((?:0?[1-9]|[12]\d|3[01])\/(?:0?[1-9]|1[0-2])\/(?:1[5-9]|20)\d{2})\s*[:—–-]\s*(.+)$/u;
const MESES={janeiro:1,fevereiro:2,março:3,abril:4,maio:5,junho:6,julho:7,agosto:8,setembro:9,outubro:10,novembro:11,dezembro:12};
function dataValida(data){
 const slash=/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(data);
 const ext=/^(\d{1,2}) de ([a-zçãéêíóôõú]+) de (\d{4})$/iu.exec(data);
 if(!slash&&!ext)return true;
 const dia=Number((slash||ext)[1]),mes=slash?Number(slash[2]):MESES[ext[2].toLowerCase()],ano=Number((slash||ext)[3]);
 if(!mes||mes<1||mes>12)return false;
 return dia>=1&&dia<=new Date(Date.UTC(ano,mes,0)).getUTCDate();
}
export function normalizarEvento(evento) {
 if (typeof evento !== "string") return {evento:structuredClone(evento),alterado:false,exigeRevisao:false};
 const original=evento;
 const texto=evento.trim();
 const partes=DATE.exec(texto)||SLASH.exec(texto)||YEAR.exec(texto);
 if (!partes || !dataValida(partes[1])) return {evento:original,alterado:false,exigeRevisao:true,motivo:"Data não reconhecida ou calendário inválido; texto preservado"};
 return {evento:{data:partes[1],descricao:partes[2],texto_original:original},alterado:true,exigeRevisao:true,motivo:"Separação sintática pendente de validação editorial"};
}
export function prepararCronologia(itens) {
 if (!Array.isArray(itens)) throw new TypeError("Cronologia deve ser uma lista");
 return itens.map(normalizarEvento);
}
