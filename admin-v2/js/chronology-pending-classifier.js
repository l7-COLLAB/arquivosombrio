// Triagem estritamente editorial: não altera nem normaliza o registro.
export function classificarPendencia(texto) {
 if (typeof texto!=="string") return "nao_textual";
 const t=texto.trim();
 if (/^Fontes?:\s/i.test(t)) return "referencia_auxiliar";
 if (/^Cronologia(?:\r?\n|\\n)/i.test(t)||/^\d{4}:\s[\s\S]*(?:\r?\n|\\n)\d{4}\s*[:—–-]/u.test(t)) return "multiplos_eventos";
 if (/^(?:janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro) e (?:janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro) de \d{4}\s*[:—–-]/iu.test(t)) return "intervalo_ou_multiplas_datas";
 if (/^(?:Primeira|Segunda) tentativa\b/i.test(t)) return "marcador_sem_data";
 if (/^(?:Década de|Primeiro semestre|Primavera|Fim de|Antes de|Por volta de|Primeiras horas|Manhã de)\b/i.test(t)) return "periodo_aproximado";
 if (/^(?:\d{1,2}\s*(?:a|e|ou|–|-)\s*\d{1,2}\s+de\b|\d{1,2}\s*(?:e|ou|–|-)\s*\d{1,2}\/|\d{4}\s*(?:e|,)\s*\d{4}|\d{1,2}\s*(?:–|-)\s*\d{1,2}\/)/iu.test(t)) return "intervalo_ou_multiplas_datas";
 if (/^(?:\d{1,2}\/\d{1,2}\/\d{4}),\s*(?:cerca|aproximadamente|\d{1,2}h)/iu.test(t)) return "data_com_horario";
 if (/^(?:\d{1,2}\/\d{1,2}\/\d{4}|\d{4})/u.test(t)) return "formato_especial";
 if (/^(?:janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\/\d{4}/iu.test(t)) return "mes_ano_barra";
 return "revisao_manual";
}
