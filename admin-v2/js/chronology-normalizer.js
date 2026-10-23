// Conversão conservadora e não destrutiva para prévia editorial.
// Não escreve no Supabase e nunca infere fontes nem natureza documental.
const YEAR = /^((?:1[5-9]|20)\d{2})\s*[:—–-]\s*(.+)$/u;
const DATE = /^((?:0?[1-9]|[12]\d|3[01])\s+de\s+[a-záàâãéêíóôõúç]+\s+de\s+(?:1[5-9]|20)\d{2})\s*[:—–-]\s*(.+)$/iu;
const SLASH = /^((?:0?[1-9]|[12]\d|3[01])\/(?:0?[1-9]|1[0-2])\/(?:1[5-9]|20)\d{2})\s*[:—–-]\s*(.+)$/u;
const MES_ANO = /^((?:janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro) de (?:1[5-9]|20)\d{2})\s*[:—–-]\s*(.+)$/iu;
const MESES={janeiro:1,fevereiro:2,março:3,abril:4,maio:5,junho:6,julho:7,agosto:8,setembro:9,outubro:10,novembro:11,dezembro:12};
function dataValida(data){
 const slash=/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(data);
 const ext=/^(\d{1,2}) de ([a-zçãéêíóôõú]+) de (\d{4})$/iu.exec(data);
 if(!slash&&!ext)return true;
 const dia=Number((slash||ext)[1]),mes=slash?Number(slash[2]):MESES[ext[2].toLowerCase()],ano=Number((slash||ext)[3]);
 if(!mes||mes<1||mes>12)return false;
 return dia>=1&&dia<=new Date(Date.UTC(ano,mes,0)).getUTCDate();
}
const MONTH = "janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro";
const HEADING = new RegExp("^(?:(?:[0-3]?\\d de (?:"+MONTH+") de (?:1[5-9]|20)\\d{2})(?:, [^\\n]+)?|(?:1[5-9]|20)\\d{2}|(?:"+MONTH+") de (?:1[5-9]|20)\\d{2})$", "iu");
function separarLinhas(texto) {
 const separador = texto.includes("\n") ? "\n" : texto.includes("\\n") ? "\\n" : null;
 if (!separador) return null;
 const indice=texto.indexOf(separador);
 const data=texto.slice(0,indice).trim(), descricao=texto.slice(indice+separador.length).trim();
 if (!descricao || !HEADING.test(data)) return null;
 const inicio=/^(\d{1,2} de [a-zçãéêíóôõú]+ de \d{4})/iu.exec(data);
 if (inicio && !dataValida(inicio[1])) return null;
 return [data,descricao];
}
export function normalizarEvento(evento) {
 if (typeof evento !== "string") return {evento:structuredClone(evento),alterado:false,exigeRevisao:false};
 const original=evento;
 const texto=evento.trim();
 const partes=DATE.exec(texto)||SLASH.exec(texto)||YEAR.exec(texto)||MES_ANO.exec(texto)||separarLinhas(texto);
 if (!partes || !dataValida(partes[1])) return {evento:original,alterado:false,exigeRevisao:true,motivo:"Data não reconhecida ou calendário inválido; texto preservado"};
 return {evento:{data:partes[1],descricao:partes[2],texto_original:original},alterado:true,exigeRevisao:true,motivo:"Separação sintática pendente de validação editorial"};
}
export function prepararCronologia(itens) {
 if (!Array.isArray(itens)) throw new TypeError("Cronologia deve ser uma lista");
 return itens.map(normalizarEvento);
}
