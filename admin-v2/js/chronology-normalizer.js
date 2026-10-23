// Conversão conservadora e não destrutiva para prévia editorial.
// Não escreve no Supabase e nunca infere fontes nem natureza documental.
const YEAR = /^((?:1[5-9]|20)\d{2})\s*[:—–-]\s*(.+)$/u;
const DATE = /^((?:0?[1-9]|[12]\d|3[01])\s+de\s+[a-záàâãéêíóôõúç]+\s+de\s+(?:1[5-9]|20)\d{2})\s*[:—–-]\s*(.+)$/iu;
const SLASH = /^((?:0?[1-9]|[12]\d|3[01])\/(?:0?[1-9]|1[0-2])\/(?:1[5-9]|20)\d{2})\s*[:—–-]\s*(.+)$/u;
export function normalizarEvento(evento) {
 if (typeof evento !== "string") return {evento:structuredClone(evento),alterado:false,exigeRevisao:false};
 const original=evento;
 const texto=evento.trim();
 const partes=DATE.exec(texto)||SLASH.exec(texto)||YEAR.exec(texto);
 if (!partes) return {evento:original,alterado:false,exigeRevisao:true,motivo:"Data não reconhecida; texto preservado"};
 return {evento:{data:partes[1],descricao:partes[2],texto_original:original},alterado:true,exigeRevisao:true,motivo:"Separação sintática pendente de validação editorial"};
}
export function prepararCronologia(itens) {
 if (!Array.isArray(itens)) throw new TypeError("Cronologia deve ser uma lista");
 return itens.map(normalizarEvento);
}
