const PUBLIC_BLOCK_TYPES=new Set(["subtitulo","paragrafo","imagem","documento","video","cronologia","evidencias","hipoteses","situacao_oficial","fontes"]);
const txt=v=>String(v??"").trim();
export function compileDossierForPublic(draft){
 const d=structuredClone(draft||{}),errors=[],warnings=[];
 const blocks=Array.isArray(d.conteudo_blocos)?d.conteudo_blocos:[];
 const expanded=[];blocks.forEach(b=>{if(b?.tipo==="galeria"){const imgs=Array.isArray(b.dados?.itens)?b.dados.itens:[];if(!imgs.length)warnings.push("Galeria vazia não será publicada.");imgs.forEach((img,n)=>expanded.push({id:(b.id||"galeria")+"-"+n,tipo:"imagem",ordem:expanded.length+1,dados:typeof img==="string"?{url:img}:{...img}}));return}if(["citacao","nota_do_arquivo","destaque"].includes(b?.tipo)){const text=String(b.dados?.texto??"").trim();if(text){expanded.push({...b,tipo:"paragrafo",ordem:expanded.length+1,dados:{...b.dados,texto:text}});warnings.push((b.tipo==="citacao"?"Citação":b.tipo==="nota_do_arquivo"?"Nota do Arquivo":"Destaque")+" será publicada como parágrafo até o site público possuir estilo próprio.");}return}if(b?.tipo==="separador"){warnings.push("Separador é apenas editorial e não gera bloco público.");return}expanded.push(b)});
 const compiled=[];
 expanded.forEach((b,i)=>{
  const type=txt(b?.tipo),data=(b&&typeof b.dados==="object"&&!Array.isArray(b.dados))?{...b.dados}:{};
  if(!PUBLIC_BLOCK_TYPES.has(type)){warnings.push("Bloco "+(i+1)+" ("+(type||"sem tipo")+") não é suportado pelo renderizador público e não será publicado.");return}
  const out={...b,tipo:type,ordem:compiled.length+1,dados:data};
  if(["paragrafo","subtitulo"].includes(type)&&!txt(data.texto)){errors.push("Bloco "+(i+1)+" sem texto.");return}
  if(type==="imagem"&&!txt(data.url)){errors.push("Imagem "+(i+1)+" sem URL.");return}
  if(type==="documento"&&!txt(data.url)){errors.push("Documento "+(i+1)+" sem URL.");return}
  compiled.push(out)
 });
 // Diagnóstico editorial não bloqueante: preserva a publicação legada.
 const temBloco=tipo=>compiled.some(b=>b.tipo===tipo);
 const temLista=valor=>Array.isArray(valor)&&valor.some(item=>item!=null&&String(typeof item==="object"?JSON.stringify(item):item).trim());
 if(!temBloco("fontes"))warnings.push("Revisão documental: bloco de fontes não identificado. Confira se as referências estão presentes na narrativa.");
 if(!temBloco("cronologia"))warnings.push("Revisão documental: cronologia estruturada não identificada. Avalie se é aplicável.");
 if(!temBloco("documento")&&!temLista(d.documentos))warnings.push("Revisão documental: sem documentos vinculados. Isso não impede a publicação.");
 if(!temBloco("evidencias")&&!temLista(d.evidencias))warnings.push("Revisão documental: evidências estruturadas não identificadas; verifique se são pertinentes ao caso.");
 // Avisos de rastreabilidade apenas para cronologias estruturadas.
 compiled.filter(b=>b.tipo==="cronologia").forEach((bloco,indice)=>{
  const itens=Array.isArray(bloco.dados?.itens)?bloco.dados.itens:[];
  const vistos=new Set();
  itens.forEach((item,pos)=>{
   if(!item||typeof item!=="object"||Array.isArray(item))return;
   const num=pos+1,prefix="Cronologia "+(indice+1)+", evento "+num+": ";
   const fonte=txt(item.fonte||item.referencia);
   const link=txt(item.link_fonte||item.fonte_url||item.url_fonte);
   const instituicao=txt(item.instituicao_fonte||item.orgao_fonte);
   const identificador=txt(item.identificador_documento||item.numero_documento);
   const natureza=txt(item.natureza_documental||item.classificacao_editorial||item.natureza_evento)
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim().replace(/\s+/g,"_");
   const naturezasAceitas=new Set(["fato","fato_documentado","testemunho","hipotese","controversia"]);
   if(natureza&&!naturezasAceitas.has(natureza))warnings.push(prefix+"natureza editorial não reconhecida; confira o vocabulário utilizado.");
   if((natureza==="fato"||natureza==="fato_documentado")&&!fonte&&!instituicao&&!identificador&&!link)
    warnings.push(prefix+"fato classificado como documentado sem referência identificada.");
   if(link){
    let valido=false;
    try{const u=new URL(link);valido=["http:","https:"].includes(u.protocol)&&!!u.hostname}
    catch{}
    if(!valido)warnings.push(prefix+"URL da fonte inválida (somente http/https).");
    else if(vistos.has(link.trim().toLowerCase()))warnings.push(prefix+"URL de fonte repetida no mesmo bloco; confira se corresponde a documentos distintos.");
    vistos.add(link.trim().toLowerCase());
   }
   if((fonte||instituicao||identificador)&&!link)warnings.push(prefix+"referência sem link verificável; confirme se a fonte está disponível apenas offline.");
   if(link&&!fonte&&!instituicao&&!identificador)warnings.push(prefix+"link sem identificação da fonte ou instituição.");
  });
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