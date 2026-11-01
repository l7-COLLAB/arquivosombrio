import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.116.0";
import { AwsClient } from "npm:aws4fetch@1.0.20";

// aws4fetch reads expiry from the URL, not a top-level sign() option.
async function signR2(aws: AwsClient, value: string, method = "GET", headers?: HeadersInit, ttl = 600) {
  const url = new URL(value);
  url.searchParams.set("X-Amz-Expires", String(ttl));
  return aws.sign(new Request(url, {method, headers}), {aws: {signQuery: true, allHeaders: false}});
}

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Access-Control-Allow-Methods":"POST,OPTIONS"};
const respond=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors,"Content-Type":"application/json","Cache-Control":"no-store"}});
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="POST")return respond({error:"Método não permitido"},405);
 try{
  const auth=req.headers.get("Authorization")||"";
  const token=auth.startsWith("Bearer ")?auth.slice(7):"";
  if(!token)return respond({error:"Entre na conta para ouvir.",code:"LOGIN_REQUIRED"},401);
  const url=Deno.env.get("SUPABASE_URL")!,key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const db=createClient(url,key,{auth:{persistSession:false}});
  const verified=await db.auth.getUser(token);
  if(verified.error||!verified.data.user)return respond({error:"Sessão inválida",code:"LOGIN_REQUIRED"},401);
  const uid=verified.data.user.id;
  const digest=async(s:string)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,"0")).join("");
  const {data:allowed,error:limitError}=await db.rpc("security_consume_rate_limit",{p_scope:"novel_narration_user",p_subject_hash:await digest(uid),p_max:90,p_window_seconds:900,p_block_seconds:900});
  if(limitError)return respond({error:"Serviço temporariamente indisponível"},503);
  if(!allowed)return respond({error:"Muitas solicitações. Aguarde 15 minutos.",code:"RATE_LIMIT"},429);
  const body=await req.json();
  const id=String(body.capitulo_id||"");
  if(!/^[a-f0-9-]{36}$/i.test(id))return respond({error:"Capítulo inválido"},400);
  const chapter=await db.from("novel_capitulos").select("id,novel_id,conteudo,status_publicacao").eq("id",id).or("publicado_em.is.null,publicado_em.lte."+new Date().toISOString()).or("agendado_para.is.null,agendado_para.lte."+new Date().toISOString()).maybeSingle();
  if(chapter.error||!chapter.data||chapter.data.status_publicacao!=="publicado")return respond({available:false});
  const novel=await db.from("novels").select("status_publicacao").eq("id",chapter.data.novel_id).or("publicado_em.is.null,publicado_em.lte."+new Date().toISOString()).maybeSingle();
  if(novel.error||novel.data?.status_publicacao!=="publicado")return respond({available:false});
  const rows=await db.from("novel_capitulo_audios").select("id,texto_hash,caminho_audio,alinhamento,duracao_segundos").eq("capitulo_id",id).eq("status","approved").not("caminho_audio","is",null).order("criado_em",{ascending:false}).limit(5);
  if(rows.error)throw rows.error;
  // Check every approved candidate against the current chapter snapshot.
  let selected=null;
  for(const candidate of rows.data||[]){
    const check=await db.rpc("is_novel_audio_current",{p_audio_id:candidate.id});
    if(check.error)throw check.error;
    if(check.data===true){selected=candidate;break}
  }
  if(!selected)return respond({available:false});
  if(body.action==="status")return respond({available:true,aligned:Array.isArray(selected.alinhamento)&&selected.alinhamento.length>0});
  if(body.action!=="url")return respond({error:"Ação inválida"},400);
  const endpoint=Deno.env.get("R2_ENDPOINT"),accessKeyId=Deno.env.get("R2_ACCESS_KEY_ID"),secretAccessKey=Deno.env.get("R2_SECRET_ACCESS_KEY"),bucket=Deno.env.get("R2_BUCKET");
  if(!endpoint||!accessKeyId||!secretAccessKey||!bucket)throw new Error("Armazenamento indisponível");
  const path=selected.caminho_audio!.split("/").map(encodeURIComponent).join("/");
  const objectUrl=endpoint.replace(/\/$/,"")+"/"+encodeURIComponent(bucket)+"/"+path;
  const aws=new AwsClient({accessKeyId,secretAccessKey,region:"auto",service:"s3"});
  const signed=await signR2(aws,objectUrl);
  return respond({available:true,url:signed.url,alignment:selected.alinhamento,duration:selected.duracao_segundos});
 }catch(e){console.error("novel narration",e);return respond({error:"Não foi possível carregar o áudio"},500)}
});
