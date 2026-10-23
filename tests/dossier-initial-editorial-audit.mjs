import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import vm from "node:vm";

const code = readFileSync(new URL("../data/caso.js", import.meta.url), "utf8");
const context = vm.createContext({});
vm.runInContext(code + "\n;globalThis.__auditoriaCasos = casosArquivo;", context);
const casos = Array.from(context.__auditoriaCasos || []);
const registros = casos.map((caso) => {
  const blocos = Array.isArray(caso.conteudo_blocos) ? caso.conteudo_blocos : [];
  const cronologias = blocos.filter(b => b?.tipo === "cronologia");
  const fontes = blocos.filter(b => b?.tipo === "fontes");
  const semData = [];
  const semNatureza = [];
  const semReferencia = [];
  cronologias.forEach((bloco, i) => {
    (Array.isArray(bloco.dados?.itens) ? bloco.dados.itens : []).forEach((ev, j) => {
      if (!ev || typeof ev !== "object") return;
      if (!String(ev.data || ev.periodo || ev.quando || "").trim()) semData.push([i+1,j+1]);
      if (!String(ev.natureza_documental || ev.classificacao_editorial || ev.natureza_evento || "").trim()) semNatureza.push([i+1,j+1]);
      if (!String(ev.fonte || ev.referencia || ev.link_fonte || ev.fonte_url || ev.url_fonte || "").trim()) semReferencia.push([i+1,j+1]);
    });
  });
  return {id: caso.id ?? null, titulo: caso.titulo || "(sem título)", cronologias:cronologias.length, fontes:fontes.length, historias:!!String(caso.historia||"").trim(), semData, semNatureza, semReferencia, observacao:cronologias.length ? "Revisar apontamentos dos eventos" : "Sem cronologia estruturada no arquivo inicial; não inferir datas a partir da narrativa"};
});
const saida = {origem:"data/caso.js (dados iniciais versionados; NÃO abrange Supabase, Admin V2 ou banco em produção)",total:registros.length, comCronologia:registros.filter(x=>x.cronologias>0).length, registros};
assert(saida.total > 0, "Esperados casos iniciais");
mkdirSync("artifacts/editorial", {recursive:true});
writeFileSync("artifacts/editorial/auditoria-casos-iniciais.json", JSON.stringify(saida,null,2)+"\n");
console.log("Auditoria inicial:",saida.total,"registros;",saida.comCronologia,"com cronologia estruturada. Relatório em artifacts/editorial.");
