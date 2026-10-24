import {validateEditorialDecision} from "./editorial-decision-validator.js";

export function createEditorialReview(records) {
  if (!Array.isArray(records)) throw new TypeError("Registros invalidos");
  const ids = new Set();
  const decisoes = records.map(({id_caso, indice, fonte}) => {
    const key = String(id_caso) + ":" + String(indice);
    if (ids.has(key)) throw new Error("Registro duplicado");
    ids.add(key);
    return {id_caso, indice, fonte, decisao:"pendente", historico:[]};
  });
  return {decisoes, publicacao_autorizada:false};
}

export function recordEditorialReview(state, change) {
  const idx = state.decisoes.findIndex(x => x.id_caso===change.id_caso && x.indice===change.indice);
  if (idx<0) throw new Error("Registro desconhecido");
  if (state.decisoes[idx].decisao!=="pendente") throw new Error("Decisao ja registrada");
  if (!validateEditorialDecision(change).valid) throw new Error("Decisao invalida");
  const event = {decisao:change.decisao, responsavel:change.responsavel.trim(), data_decisao:change.data_decisao, justificativa:change.justificativa.trim()};
  const decisoes = state.decisoes.map((x,i) => i===idx ? {...x,...event,historico:[...x.historico,event]} : x);
  return {decisoes, publicacao_autorizada:false};
}
