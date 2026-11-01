
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.116.0";
import { PollyClient, SynthesizeSpeechCommand } from "npm:@aws-sdk/client-polly";
import { FetchHttpHandler } from "npm:@smithy/fetch-http-handler";
import { AwsClient } from "npm:aws4fetch@1.0.20";


// aws4fetch reads expiry from the URL, not a top-level sign() option.
async function signR2(aws: AwsClient, value: string, method = "GET", headers?: HeadersInit, ttl = 600) {
  const url = new URL(value);
  url.searchParams.set("X-Amz-Expires", String(ttl));
  return aws.sign(new Request(url, {method, headers}), {aws: {signQuery: true, allHeaders: false}});
}

const cors={
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":"POST, OPTIONS"
};
const allowed=new Set(["dossie","garimpo","pericia","lenda","creepypasta"]);
const tableMap:any={dossie:"Casos",garimpo:"casos_diarios",pericia:"pericias",lenda:"lendas",creepypasta:"creepypastas"};

function json(body:any,status=200){return new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json","Cache-Control":"no-store"}})}
async function hash(v:string){const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(v));return [...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,"0")).join("")}
function escXml(v:string){return v.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;")}
function clean(v:any){return String(v??"").replace(/<[^>]+>/g," ").replace(/[ \t]+/g," ").replace(/\n{3,}/g,"\n\n").trim()}
function textValue(v:any):string{
  if(v==null)return "";
  if(typeof v==="string"||typeof v==="number")return clean(v);
  if(Array.isArray(v))return v.map(textValue).filter(Boolean).join(". ");
  if(typeof v==="object"){
    const keys=["titulo","nome","texto","descricao","detalhes","resumo","conteudo","data","ano","periodo","explicacao"];
    const arr:string[]=[];
    for(const k of keys){if(v[k]!=null){const t=textValue(v[k]);if(t&&!arr.includes(t))arr.push(t)}}
    if(arr.length)return arr.join(". ");
    return Object.values(v).map(textValue).filter(Boolean).join(". ");
  }
  return "";
}
function blocksText(blocks:any){
  if(!Array.isArray(blocks))return "";
  return blocks.map((b:any)=>{
    const type=String(b?.tipo||"");
    if(["imagem","documento","video","fontes"].includes(type))return "";
    return textValue(b?.dados?.texto||b?.dados?.itens||b?.texto||b?.dados||b);
  }).filter(Boolean).join("\n\n");
}
function buildText(type:string,row:any){
  const p:string[]=[]; const add=(v:any)=>{const t=textValue(v);if(t)p.push(t)};
  add(row.titulo); if(type!=="garimpo") add(row.resumo);
  if(type==="dossie"){
    const bt=blocksText(row.conteudo_blocos); if(bt)p.push(bt); else add(row.historia);
    add(row.evidencias); add(row.teorias);
  }else if(type==="garimpo"){
    add(row.conteudo); add(row.cronologia); add(row.evidencias); add(row.hipoteses); add(row.situacao_oficial);
  }else if(type==="pericia"){
    add(row.introducao); add(row.como_funciona); add(row.historia_tecnica); add(row.aplicacao_casos_reais); add(row.limitacoes_controversias); add(row.curiosidades); add(row.casos_relacionados);
  }else if(type==="lenda"){
    add(row.introducao); const bt=blocksText(row.conteudo_blocos); if(bt)p.push(bt); else add(row.conteudo);
    add(row.contexto_historico); add(row.versoes); add(row.elementos_reais); add(row.afirmacoes_blocos); add(row.documentado_blocos); add(row.origem_evolucao_blocos); add(row.versoes_itens); add(row.hipoteses); add(row.cronologia); add(row.conclusao_arquivo);
  }else if(type==="creepypasta"){
    add(row.introducao); const bt=blocksText(row.conteudo_blocos); if(bt)p.push(bt); else add(row.conteudo);
    add(row.bastidores_blocos); add(row.realidade_ficcao); add(row.nota_editorial);
  }
  return p.filter(Boolean).join("\n\n").trim();
}
function chunks(text:string,max=1800){
  const paras=text.split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean);
  const out:string[]=[]; let cur="";
  const add=(s:string)=>{
    if(!s)return;
    if((cur+" "+s).trim().length<=max){cur=(cur+" "+s).trim();return}
    if(cur){out.push(cur);cur=""}
    const sentences=s.match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[s];
    for(const raw of sentences){
      const x=raw.trim(); if(!x)continue;
      if((cur+" "+x).trim().length<=max)cur=(cur+" "+x).trim();
      else{if(cur)out.push(cur);cur=x}
    }
  };
  paras.forEach(add); if(cur)out.push(cur); return out;
}


function normalizeContextualMeaning(text: string) {
  let out = String(text || "");

  // Datas e referências históricas: a.C. / d.C. ganham significado cronológico.
  out = out
    .replace(/(\b\d{1,4}\b|\bséculo\s+[IVXLCDM]+\b)\s+a\.?\s*C\.?/g, "$1 antes de Cristo")
    .replace(/(\b\d{1,4}\b|\bséculo\s+[IVXLCDM]+\b)\s+d\.?\s*C\.?/g, "$1 depois de Cristo");

  // Distrito de Columbia: a forma em caixa alta é tratada como nome geográfico/institucional.
  out = out
    .replace(/\bWashington,\s*D\.C\./g, "Washington, Dí Cí")
    .replace(/\bD\.C\.(?=\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/g, "Dí Cí");

  // Alguns padrões frequentes de siglas pontuadas em nomes próprios.
  out = out
    .replace(/\bU\.S\.(?=\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/g, "Iu És")
    .replace(/\bU\.K\.(?=\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/g, "Iu Kê");

  return out;
}

async function scopedDictionary(admin:any,type:string,id:string){
  const d=await admin.from("narration_pronunciations")
    .select("term,pronunciation,scope_type,content_type,content_id,priority");
  if(d.error)throw d.error;
  const rank=(x:any)=>x.scope_type==="content"?3:x.scope_type==="content_type"?2:1;
  const rows=(d.data||[]).filter((item:any)=>{
    if(item.scope_type==="content")return item.content_type===type&&String(item.content_id)===String(id);
    if(item.scope_type==="content_type")return item.content_type===type;
    return item.scope_type==="global"||!item.scope_type;
  }).filter((x:any)=>String(x.term||"").trim()&&String(x.pronunciation||"").trim())
    .sort((a:any,b:any)=>rank(b)-rank(a)||Number(b.priority||0)-Number(a.priority||0)||b.term.length-a.term.length);
  const seen=new Set<string>();
  return rows.filter((x:any)=>{
    const key=x.term.normalize("NFC").toLocaleLowerCase("pt-BR");
    if(seen.has(key))return false;
    seen.add(key);return true;
  }).map((x:any)=>({term:x.term.normalize("NFC"),pronunciation:x.pronunciation.normalize("NFC"),rank:rank(x),priority:Number(x.priority||0)}))
    .sort((a:any,b:any)=>a.rank===b.rank?b.term.length-a.term.length||b.priority-a.priority:b.rank-a.rank);
}

function applyPronunciationDictionary(source:string,dict:any[]){
  // One pass over ORIGINAL text: replacements never become input for another rule.
  // Unicode-aware word boundaries protect surnames embedded in other words.
  const matches:any[]=[];
  const isWord=(v:string)=>/[\\p{L}\\p{N}]/u.test(v||"");
  for(const entry of dict){
    const term=entry.term;
    let from=0;
    while(from<source.length){
      const at=source.indexOf(term,from);
      if(at<0)break;
      const before=at>0?source[at-1]:"";
      const after=source[at+term.length]||"";
      if((!isWord(term[0])||!isWord(before))&&(!isWord(term[term.length-1])||!isWord(after)))
        matches.push({at,end:at+term.length,entry});
      from=at+Math.max(1,term.length);
    }
  }
  // At the same position, use the most specific scope; then the longest term.
  matches.sort((a,b)=>a.at-b.at||b.entry.rank-a.entry.rank||b.entry.term.length-a.entry.term.length||b.entry.priority-a.entry.priority);
  let result="",cursor=0;
  for(const m of matches){
    if(m.at<cursor)continue;
    result+=source.slice(cursor,m.at)+m.entry.pronunciation;
    cursor=m.end;
  }
  return result+source.slice(cursor);
}

async function adapt(admin:any,text:string,type:string,id:string){
  const dict=await scopedDictionary(admin,type,id);

  let out=normalizeContextualMeaning(text)
    .replace(/\u00a0/g," ")
    .replace(/[ \t]+/g," ")
    .replace(/\r\n?/g,"\n")
    .replace(/\bDra\.\s*/gi,"Doutora ")
    .replace(/\bDr\.\s*/gi,"Doutor ")
    .replace(/\bSra\.\s*/gi,"Senhora ")
    .replace(/\bSr\.\s*/gi,"Senhor ")
    .replace(/\bJr\./gi,"Júnior")
    .replace(/\bProf\.\s*/gi,"Professor ")
    .replace(/\bProfa\.\s*/gi,"Professora ")
    .replace(/\bAv\.\s*/gi,"Avenida ")
    .replace(/\bRod\.\s*/gi,"Rodovia ")
    .replace(/\baprox\.\s*/gi,"aproximadamente ")
    .replace(/\b(\d{1,2})h(\d{2})\b/gi,(_:string,h:string,m:string)=>Number(m)===0?h+" horas":h+" horas e "+Number(m)+" minutos")
    .replace(/\b(\d{1,2})h\b/gi,"$1 horas")
    .replace(/\b1º\b/g,"primeiro")
    .replace(/\b1ª\b/g,"primeira")
    .replace(/\b2º\b/g,"segundo")
    .replace(/\b2ª\b/g,"segunda")
    .replace(/\b3º\b/g,"terceiro")
    .replace(/\b3ª\b/g,"terceira")
    .replace(/\bUS\$\s*([\d.,]+)\s*milhão\b/gi,"$1 milhão de dólares")
    .replace(/\bUS\$\s*([\d.,]+)\s*milhões\b/gi,"$1 milhões de dólares")
    .replace(/\bUS\$\s*([\d.,]+)/gi,"$1 dólares");

  out=applyPronunciationDictionary(out,dict);

  return out.replace(/[ \t]+/g," ").replace(/\n{3,}/g,"\n\n").trim();
}

function speechMarkup(text:string){
  let out=escXml(text);
  out=out.replace(/\b([A-Z]{2,5})\b/g,'<say-as interpret-as="characters">$1</say-as>');
  out=out
    .replace(/,(\s+)/g,',<break time="170ms"/>$1')
    .replace(/;(\s+)/g,';<break time="280ms"/>$1')
    .replace(/:(\s+)/g,':<break time="230ms"/>$1');
  return out;
}

function ssml(text:string){
  const paragraphs=String(text||"").split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean);
  const body=paragraphs.map(x=>"<p>"+speechMarkup(x)+"</p>").join('<break time="560ms"/>');
  return '<speak><prosody rate="92%">'+body+'</prosody></speak>';
}
async function cleanupOldAudioVersions(admin:any,type:string,id:string,currentHash:string){
  try{
    const base="public-polly/"+type+"/"+id;
    const roots=await admin.storage.from("narracoes").list(base,{limit:100});
    if(roots.error)return;
    const stale=(roots.data||[])
      .filter((x:any)=>x?.name&&x.name!==currentHash)
      .sort((a:any,b:any)=>String(b.updated_at||b.created_at||"").localeCompare(String(a.updated_at||a.created_at||"")));
    const remove=stale.slice(1);
    for(const folder of remove){
      const prefix=base+"/"+folder.name;
      const files=await admin.storage.from("narracoes").list(prefix,{limit:1000});
      if(files.error)continue;
      const paths=(files.data||[]).filter((x:any)=>x?.name).map((x:any)=>prefix+"/"+x.name);
      if(paths.length)await admin.storage.from("narracoes").remove(paths);
    }
  }catch(e){console.warn("Falha ao limpar versões antigas de áudio",e)}
}

async function loadArchive(admin:any,type:string,id:string){
  const q=await admin.from(tableMap[type]).select("*").eq("id",id).eq("status_publicacao","publicado").or((type==="dossie"?"published_at":"publicado_em")+".is.null,"+(type==="dossie"?"published_at":"publicado_em")+".lte."+new Date().toISOString()).maybeSingle();
  if(q.error)throw q.error;
  if(!q.data)throw new Error("Arquivo não publicado ou inexistente.");
  const raw=buildText(type,q.data);
  if(!raw)throw new Error("Este arquivo ainda não possui conteúdo narrável.");
  const adapted=await adapt(admin,raw,type,id);
  const pieceList=chunks(adapted);
  const sourceHash=await hash(type+"|"+id+"|"+adapted+"|Camila|standard|us-east-2|92|tts-v6-scoped");
  return {row:q.data,pieces:pieceList,sourceHash};
}

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
  if(req.method!=="POST")return json({error:"Método não permitido."},405);
  try{
    const body=await req.json().catch(()=>({}));
    const type=String(body?.type||"").trim(),id=String(body?.id||"").trim();
    const action=String(body?.action||"manifest");
    if(!allowed.has(type)||!/^\d+$/.test(id))return json({error:"Arquivo inválido."},400);

    const supabaseUrl=Deno.env.get("SUPABASE_URL")!;
    const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin=createClient(supabaseUrl,serviceKey,{auth:{persistSession:false}});

    // Public metadata only: never synthesize, expose a path or signed audio URL.
    if(action==="availability"){
      const article=await admin.from(tableMap[type]).select("id,updated_at").eq("id",Number(id)).eq("status_publicacao","publicado").or((type==="dossie"?"published_at":"publicado_em")+".is.null,"+(type==="dossie"?"published_at":"publicado_em")+".lte."+new Date().toISOString()).maybeSingle();
      if(!article.data)return json({available:false});
      const manual=await admin.from("arquivo_voz_manual_imports").select("id,audio_path,source_updated_at").eq("content_type",type).eq("content_id",Number(id)).eq("status","approved").not("audio_path","is",null).order("created_at",{ascending:false}).limit(5);
      const configured=["R2_ENDPOINT","R2_ACCESS_KEY_ID","R2_SECRET_ACCESS_KEY","R2_BUCKET"].every(x=>Boolean(Deno.env.get(x)));
      if(configured&&!manual.error&&(manual.data||[]).some(x=>x.source_updated_at===article.data.updated_at))return json({available:true});
      const cloud=await admin.from("arquivo_voz_cloud_jobs").select("id,audio_path").eq("content_type",type).eq("content_id",Number(id)).eq("status","approved").not("audio_path","is",null).order("created_at",{ascending:false}).limit(8);
      if(!cloud.error)for(const job of cloud.data||[]){
        const valid=await admin.rpc(type==="dossie"?"is_dossier_audio_current":"is_remaining_archive_audio_current",{p_job_id:job.id});
        if(!valid.error&&valid.data===true)return json({available:true});
      }
      return json({available:false});
    }

    const authHeader=req.headers.get("Authorization")||"";
    const token=authHeader.startsWith("Bearer ")?authHeader.slice(7).trim():"";
    const internalCall=Boolean(token&&token===serviceKey);

    if(!internalCall){
      if(!token)return json({error:"Entre na sua conta para ouvir este arquivo.",code:"LOGIN_REQUIRED"},401);
      const userResult=await admin.auth.getUser(token);
      if(userResult.error||!userResult.data?.user){
        return json({error:"Sua sessão expirou. Entre novamente para ouvir.",code:"LOGIN_REQUIRED"},401);
      }
    }

    if(!internalCall){
      const userId=(await admin.auth.getUser(token)).data.user!.id;
      const ip=req.headers.get("cf-connecting-ip")||"";
      const max=action==="chunk"?100:action==="manifest"?120:20;
      const subject=await hash("narration:"+userId);
      const {data:allowedUser,error:limitError}=await admin.rpc("security_consume_rate_limit",{p_scope:"public_narration_"+(action==="chunk"?"chunk":action==="manifest"?"manifest":"other"),p_subject_hash:subject,p_max:max,p_window_seconds:900,p_block_seconds:900});
      if(limitError){console.error("narration limiter",limitError.code);return json({error:"Serviço temporariamente indisponível."},503)}
      if(!allowedUser)return json({error:"Limite temporário de solicitações. Tente novamente em 15 minutos.",code:"RATE_LIMIT"},429);
      if(ip){
        const {data:allowedIp,error:ipError}=await admin.rpc("security_consume_rate_limit",{p_scope:"public_narration_ip",p_subject_hash:await hash("narration-ip:"+ip),p_max:240,p_window_seconds:900,p_block_seconds:900});
        if(ipError)return json({error:"Serviço temporariamente indisponível."},503);
        if(!allowedIp)return json({error:"Limite temporário de solicitações.",code:"RATE_LIMIT"},429);
      }
    }

    // Administrative preview never modifies the public article or generates audio.
    if(action==="preview_kokoro"){
      if(!internalCall)return json({error:"Acesso administrativo necessário."},403);
      const loaded=await loadArchive(admin,type,id);
      const preview=await adapt(admin,buildText(type,loaded.row),type,id);
      return json({type,id,text:preview,characters:preview.length,engine:"kokoro-preparation-preview"});
    }

    const released=await admin.from(tableMap[type]).select("id").eq("id",Number(id))
      .eq("status_publicacao","publicado")
      .or((type==="dossie"?"published_at":"publicado_em")+".is.null,"+(type==="dossie"?"published_at":"publicado_em")+".lte."+new Date().toISOString()).maybeSingle();
    if(released.error)return json({error:"Serviço temporariamente indisponível."},503);
    if(!released.data)return json({error:"Arquivo indisponível."},404);

    // Approved desktop imports take priority only while the source article is unchanged.
    if(body?.force_polly!==true){
      const manual=await admin.from("arquivo_voz_manual_imports").select("id,audio_path,source_updated_at").eq("content_type",type).eq("content_id",Number(id)).eq("status","approved").order("created_at",{ascending:false}).limit(5);
      if(!manual.error&&manual.data?.length){
        const article=await admin.from(tableMap[type]).select("id,updated_at").eq("id",Number(id)).eq("status_publicacao","publicado").or((type==="dossie"?"published_at":"publicado_em")+".is.null,"+(type==="dossie"?"published_at":"publicado_em")+".lte."+new Date().toISOString()).maybeSingle();
        for(const item of manual.data){
          if(!article.data||String(article.data.updated_at||"")!==String(item.source_updated_at||""))continue;
          const endpoint=Deno.env.get("R2_ENDPOINT"),key=Deno.env.get("R2_ACCESS_KEY_ID"),secret=Deno.env.get("R2_SECRET_ACCESS_KEY"),bucket=Deno.env.get("R2_BUCKET");
          if(!endpoint||!key||!secret||!bucket)break;
          const url=endpoint.replace(/\/$/,"")+"/"+encodeURIComponent(bucket)+"/"+item.audio_path.split("/").map(encodeURIComponent).join("/");
          const aws=new AwsClient({accessKeyId:key,secretAccessKey:secret,region:"auto",service:"s3"});
          if(action==="manifest")return json({title:type,type,total_chunks:1,source_hash:item.id,voice:"Kokoro",engine:"kokoro-manual"});
          if(action==="chunk"){
            if(Number(body?.index)!==0)return json({error:"Trecho inválido."},400);
            const signed=await signR2(aws,url);
            return json({index:0,total_chunks:1,url:signed.url,source_hash:item.id,engine:"kokoro-manual"});
          }
        }
      }
    }

    // Verified Kokoro for every archive category; retain Polly fallback.
    if(body?.force_polly!==true){
      const candidates=await admin.from("arquivo_voz_cloud_jobs")
        .select("id,audio_path").eq("content_type",type).eq("content_id",Number(id))
        .eq("status","approved").not("audio_path","is",null)
        .order("created_at",{ascending:false}).limit(8);
      if(!candidates.error){
        for(const job of candidates.data||[]){
          const valid=await admin.rpc(type==="dossie"?"is_dossier_audio_current":"is_remaining_archive_audio_current",{p_job_id:job.id});
          if(valid.error||valid.data!==true)continue;
          try{
            const endpoint=Deno.env.get("R2_ENDPOINT"),key=Deno.env.get("R2_ACCESS_KEY_ID"),
              secret=Deno.env.get("R2_SECRET_ACCESS_KEY"),bucket=Deno.env.get("R2_BUCKET");
            if(!endpoint||!key||!secret||!bucket)throw new Error("R2 not configured");
            const base=endpoint.endsWith("/")?endpoint.slice(0,-1):endpoint;
            const url=base+"/"+encodeURIComponent(bucket)+"/"+job.audio_path.split("/").map(encodeURIComponent).join("/");
            const aws=new AwsClient({accessKeyId:key,secretAccessKey:secret,region:"auto",service:"s3"});
            if(action==="manifest")return json({title:type,type,total_chunks:1,source_hash:job.id,voice:"Kokoro",engine:"kokoro-r2"});
            if(action==="chunk"){
              if(Number(body?.index)!==0)return json({error:"Trecho inválido."},400);
              const signed=await signR2(aws,url);
              return json({index:0,total_chunks:1,url:signed.url,cached:true,engine:"kokoro-r2"});
            }
            return json({error:"Ação inválida."},400);
          }catch(err){console.error("Kokoro R2 unavailable; Polly fallback",err);break}
        }
      }
    }
    return json({
      error:"Este arquivo ainda não possui uma narração aprovada disponível.",
      code:"AUDIO_UNAVAILABLE"
    },404);
  }catch(e){
    console.error(e);
    return json({error:e instanceof Error?e.message:"Falha ao preparar a narração."},500);
  }
});
