const PUBLIC_BLOCK_TYPES=new Set(["subtitulo","paragrafo","imagem","documento","video","cronologia","evidencias","hipoteses","situacao_oficial","fontes"]);
const txt=v=>String(v??"").trim();
export function compileDossierForPublic(draft){
 const d=structuredClone(draft||{}),errors=[],warnings=[];
 const blocks=Array.isArray(d.conteudo_blocos)?d.conteudo_blocos:[];
 const compiled=[];
 blocks.forEach((b,i)=>{
  const type=txt(b?.tipo),data=(b&&typeof b.dados==="object"&&!Array.isArray(b.dados))?{...b.dados}:{};
  if(!PUBLIC_BLOCK_TYPES.has(type)){warnings.push("Bloco "+(i+1)+" ("+(type||"sem tipo")+") não é suportado pelo renderizador público e não será publicado.");return}
  const out={...b,tipo:type,ordem:compiled.length+1,dados:data};
  if(["paragrafo","subtitulo"].includes(type)&&!txt(data.texto)){errors.push("Bloco "+(i+1)+" sem texto.");return}
  if(type==="imagem"&&!txt(data.url)){errors.push("Imagem "+(i+1)+" sem URL.");return}
  if(type==="documento"&&!txt(data.url)){errors.push("Documento "+(i+1)+" sem URL.");return}
  compiled.push(out)
 });
 const row={
  titulo:txt(d.titulo),categoria:txt(d.categoria),local:txt(d.local),ano:txt(d.ano),status:txt(d.status),
  imagem:txt(d.imagem),resumo:txt(d.resumo),historia:txt(d.historia),
  evidencias:Array.isArray(d.evidencias)?d.evidencias:[],teorias:Array.isArray(d.teorias)?d.teorias:[],
  documentos:Array.isArray(d.documentos)?d.documentos:[],conteudo_blocos:compiled,
  slug:txt(d.slug),editor_version:Number(d.editor_version)||2,status_publicacao:"publicado"
 };
 ["titulo","resumo","slug"].forEach(k=>{if(!row[k])errors.push("Campo público obrigatório ausente: "+k+".")});
 return{row,errors,warnings,compatible:errors.length===0}
}
export function publicDiff(current,next){const keys=["titulo","categoria","local","ano","status","imagem","resumo","historia","evidencias","teorias","documentos","conteudo_blocos","slug","status_publicacao"];return keys.filter(k=>JSON.stringify(current?.[k]??null)!==JSON.stringify(next?.[k]??null)).map(k=>({field:k,before:current?.[k]??null,after:next?.[k]??null}))}