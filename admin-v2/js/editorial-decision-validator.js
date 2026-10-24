export const DECISIONS=Object.freeze(["aprovar","rejeitar","solicitar_revisao"]);
export function validateEditorialDecision(entry){
 if(!entry||typeof entry!=="object")return {valid:false,errors:["registro_invalido"]};
 if(entry.decisao==="pendente")return {valid:false,errors:["decisao_pendente"]};
 const errors=[];
 if(!DECISIONS.includes(entry.decisao))errors.push("decisao_invalida");
 if(typeof entry.responsavel!=="string"||!entry.responsavel.trim())errors.push("responsavel_obrigatorio");
 if(typeof entry.data_decisao!=="string"||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(entry.data_decisao)||Number.isNaN(Date.parse(entry.data_decisao))||new Date(entry.data_decisao).toISOString().slice(0,10)!==entry.data_decisao)errors.push("data_invalida");
 if(typeof entry.justificativa!=="string"||!entry.justificativa.trim())errors.push("justificativa_obrigatoria");
 return {valid:errors.length===0,errors};
}
