export function validateDossier(d){
 const x=d||{},e=x.editor_v2||{},sources=e.fontes_estruturadas||[],blocks=x.conteudo_blocos||[],docs=x.documentos||[];
 const out=[];const add=(level,label,detail,tab)=>out.push({level,label,detail,tab});
 const req=(ok,label,detail,tab)=>add(ok?"ok":"error",label,detail,tab);
 req((x.titulo||"").trim().length>=10,"Título","Use um título informativo com pelo menos 10 caracteres.","geral");
 req((x.resumo||"").trim().length>=80,"Resumo","O resumo deve contextualizar o caso antes da leitura.","geral");
 req((x.local||"").trim(),"Localização","Informe o local principal associado ao caso.","geral");
 req((x.ano||"").trim(),"Período","Informe ano ou período associado ao caso.","geral");
 req((x.status||"").trim(),"Situação do caso","Informe a situação factual do caso.","geral");
 req((x.historia||"").trim().length>=500||blocks.length>=3,"Narrativa","Inclua narrativa suficiente ou blocos estruturados.","conteudo");
 req((x.evidencias||[]).length>0,"Evidências","Cadastre ao menos uma evidência relevante.","evidencias");
 if((x.evidencias||[]).length>5)add("warn","Quantidade de evidências","O padrão atual do Arquivo Sombrio prevê até 5 cards de evidência.","evidencias");
 req(sources.length>=2,"Fontes","Cadastre pelo menos duas fontes estruturadas.","fontes");
 if(sources.length&&!sources.some(s=>["primaria","judicial","institucional","cientifica"].includes(s.tipo)))add("warn","Fonte de maior autoridade","Considere incluir fonte primária, judicial, institucional ou científica.","fontes");
 sources.forEach((s,i)=>{if(!String(s.url||"").startsWith("http"))add("error","URL da fonte "+(i+1),"A referência precisa de URL válida.","fontes")});
 req((x.imagem||"").trim(),"Imagem de capa","Adicione uma capa ao dossiê.","midia");
 if(x.imagem&&!e.cover_credit)add("warn","Crédito da capa","Informe o crédito da imagem principal.","midia");
 if(x.imagem&&!e.cover_source)add("warn","Fonte da capa","Informe a origem da imagem principal.","midia");
 if(x.imagem&&!e.cover_alt)add("warn","Alt text da capa","Descreva a imagem para acessibilidade e SEO.","midia");
 blocks.filter(b=>b.tipo==="imagem").forEach((b,i)=>{const z=b.dados||{};if(!z.url)add("error","Imagem de bloco "+(i+1),"Bloco de imagem sem arquivo/URL.","conteudo");if(z.url&&!z.credito)add("warn","Crédito de imagem "+(i+1),"Informe o crédito da imagem do conteúdo.","conteudo")});
 docs.forEach((d,i)=>{if(!d.url)add("error","Documento "+(i+1),"Documento vinculado sem arquivo/URL.","midia");if(!d.fonte)add("warn","Fonte documental "+(i+1),"Informe a procedência do documento.","midia")});
 if(!e.seo_title)add("warn","Título SEO","Defina um título específico para mecanismos de busca.","seo");
 if(!e.seo_description)add("warn","Meta descrição","Defina a descrição que poderá aparecer nos resultados de busca.","seo");
 else if(e.seo_description.length>170)add("warn","Meta descrição extensa","A meta descrição tem mais de 170 caracteres.","seo");
 req((x.slug||"").trim(),"Slug","O conteúdo precisa de identificador permanente.","seo");
 return out
}
export function validationSummary(items){return{errors:items.filter(x=>x.level==="error").length,warnings:items.filter(x=>x.level==="warn").length,ok:items.filter(x=>x.level==="ok").length,total:items.length}}