import { createClient } from "npm:@supabase/supabase-js@2.116.0";
import { AwsClient } from "npm:aws4fetch@1.0.20";

// aws4fetch reads expiry from the URL, not a top-level sign() option.
async function signR2(aws: AwsClient, value: string, method = "GET", headers?: HeadersInit, ttl = 600) {
  const url = new URL(value);
  url.searchParams.set("X-Amz-Expires", String(ttl));
  return aws.sign(new Request(url, {method, headers}), {aws: {signQuery: true, allHeaders: false}});
}

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info,x-supabase-api-version,accept","Access-Control-Allow-Methods":"POST,OPTIONS"};
const respond=(v:any,status=200)=>new Response(JSON.stringify(v),{status,headers:{...cors,"Content-Type":"application/json","Cache-Control":"no-store"}});
const tables:any={dossie:"Casos",garimpo:"casos_diarios",pericia:"pericias",lenda:"lendas",creepypasta:"creepypastas"};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response(null,{headers:cors});
 if(req.method!=="POST")return respond({error:"Método não permitido"},405);
 try{
  const auth=req.headers.get("Authorization")||"";
  if(!auth.startsWith("Bearer "))return respond({error:"Sessão necessária"},401);
  const url=Deno.env.get("SUPABASE_URL")!,anon=Deno.env.get("SUPABASE_ANON_KEY")!;
  const userClient=createClient(url,anon,{global:{headers:{Authorization:auth}}});
  const {data:{user},error:ue}=await userClient.auth.getUser();
  if(ue||!user)return respond({error:"Sessão inválida"},401);
  const {data:isAdmin,error:ae}=await userClient.rpc("is_arquivo_sombrio_admin");
  if(ae||isAdmin!==true)return respond({error:"Somente administradores"},403);
  const service=createClient(url,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const body=await req.json(),action=String(body.action||"");
  if(action==="init"){
   const hash=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(user.id)))).map(x=>x.toString(16).padStart(2,"0")).join("");
   const {data:ok,error:limitError}=await service.rpc("security_consume_rate_limit",{p_scope:"manual_audio_upload",p_subject_hash:hash,p_max:30,p_window_seconds:86400,p_block_seconds:900});
   if(limitError)return respond({error:"Controle de segurança indisponível"},503);
   if(!ok)return respond({error:"Limite temporário de uploads atingido.",code:"RATE_LIMIT"},429);
  }
  const endpoint=Deno.env.get("R2_ENDPOINT"),key=Deno.env.get("R2_ACCESS_KEY_ID"),secret=Deno.env.get("R2_SECRET_ACCESS_KEY"),bucket=Deno.env.get("R2_BUCKET");
  if(!endpoint||!key||!secret||!bucket)return respond({error:"Armazenamento R2 não configurado"},503);
  const aws=new AwsClient({accessKeyId:key,secretAccessKey:secret,region:"auto",service:"s3"});
  const objectUrl=(path:string)=>endpoint.replace(/\/$/,"")+"/"+encodeURIComponent(bucket)+"/"+path.split("/").map(encodeURIComponent).join("/");
  const db=service.from("arquivo_voz_manual_imports");
  if(action==="init"){
   const type=String(body.content_type||""),id=Number(body.content_id),projectId=String(body.project_id||""),size=Number(body.size);
   if(!tables[type]||!Number.isSafeInteger(id)||id<=0||!uuid.test(projectId)||!Number.isSafeInteger(size)||size<1024||size>104857600)return respond({error:"Arquivo ou tamanho inválido (máximo 100 MB)"},400);
   const {data:project}=await service.from("narration_projects").select("id,content_type,content_id").eq("id",projectId).maybeSingle();
   if(!project||project.content_type!==type||Number(project.content_id)!==id)return respond({error:"Projeto não corresponde ao arquivo"},400);
   const {data:article,error:arErr}=await service.from(tables[type]).select("id,updated_at").eq("id",id).maybeSingle();
   if(arErr||!article)return respond({error:"Arquivo de destino não encontrado"},404);
   const uploadId=crypto.randomUUID(),path="manual-imports/"+type+"/"+id+"/"+uploadId+".mp3";
   const {error:insertError}=await db.insert({id:uploadId,content_type:type,content_id:id,project_id:projectId,audio_path:path,file_size:size,created_by:user.id,source_updated_at:article.updated_at||null,original_filename:String(body.filename||"").slice(0,180),duration_seconds:Number.isFinite(Number(body.duration_seconds))&&Number(body.duration_seconds)>0?Math.min(Number(body.duration_seconds),86400):null});
   if(insertError)throw insertError;
   const signed=await signR2(aws,objectUrl(path),"PUT",{"Content-Type":"audio/mpeg"},900);
   return respond({upload_id:uploadId,upload_url:signed.url,expires_in:900});
  }
  const importId=String(body.upload_id||"");
  if(!uuid.test(importId))return respond({error:"Identificador inválido"},400);
  const {data:item,error:ie}=await db.select("*").eq("id",importId).single();
  if(ie||!item)return respond({error:"Importação não encontrada"},404);
  if(action==="delete"){
   // Stop public playback before removing the stored object. A failed cleanup can be retried.
   const {error:hideError}=await db.update({status:"rejected",updated_at:new Date().toISOString()}).eq("id",importId);
   if(hideError)throw hideError;
   const removed=await aws.fetch(objectUrl(item.audio_path),{method:"DELETE"});
   if(!removed.ok&&removed.status!==404)return respond({error:"Áudio retirado do player, mas não foi possível remover o MP3. Tente excluir novamente."},502);
   const {error:deleteError}=await db.delete().eq("id",importId);
   if(deleteError)throw deleteError;
   return respond({deleted:true});
  }
  if(action==="preview"){
   if(!["review","approved"].includes(item.status))return respond({error:"Arquivo ainda não validado"},409);
   const signed=await signR2(aws,objectUrl(item.audio_path));
   return respond({url:signed.url,expires_in:600,status:item.status});
  }
  if(action==="proxy_upload"){if(item.status!=="uploading")return respond({error:"Envio não está pendente"},409);const encoded=String(body.base64||"");if(!encoded||encoded.length>14000000)return respond({error:"Envio alternativo aceita arquivos de até 10 MB"},413);const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));if(bytes.length!==Number(item.file_size))return respond({error:"Tamanho divergente"},422);const mp3=(bytes[0]===73&&bytes[1]===68&&bytes[2]===51)||bytes.some((b,i)=>i<8&&b===255&&i+1<bytes.length&&(bytes[i+1]&224)===224);if(!mp3)return respond({error:"MP3 inválido"},422);const uploaded=await aws.fetch(objectUrl(item.audio_path),{method:"PUT",headers:{"Content-Type":"audio/mpeg"},body:bytes});if(!uploaded.ok){const diagnostic=(await uploaded.text()).slice(0,1200);console.error("R2 upload rejected",{status:uploaded.status,code:diagnostic.match(/<Code>([^<]+)<\/Code>/)?.[1]||"unknown",requestId:uploaded.headers.get("cf-ray")||null});return respond({error:"R2 recusou envio alternativo: "+uploaded.status+" ("+(diagnostic.match(/<Code>([^<]+)<\/Code>/)?.[1]||"verifique credenciais e permissão de gravação")+")"},502);}return respond({uploaded:true});}
  if(action==="finish"){
   if(item.status!=="uploading")return respond({error:"Upload já finalizado"},409);
   const head=await aws.fetch(objectUrl(item.audio_path),{method:"HEAD"});
   if(!head.ok)return respond({error:"Upload não localizado no R2"},409);
   if(Number(head.headers.get("content-length"))!==Number(item.file_size))return respond({error:"Tamanho do arquivo divergente"},422);
   const sample=await aws.fetch(objectUrl(item.audio_path),{method:"GET",headers:{"Range":"bytes=0-31"}});
   if(!sample.ok)return respond({error:"Não foi possível verificar o MP3"},422);
   const bytes=new Uint8Array(await sample.arrayBuffer()),mp3=(bytes[0]===73&&bytes[1]===68&&bytes[2]===51)||bytes.some((b,i)=>i<8&&b===255&&i+1<bytes.length&&(bytes[i+1]&224)===224);
   if(!mp3)return respond({error:"O arquivo não parece ser um MP3 válido"},422);
   const {error:e}=await db.update({status:"review",updated_at:new Date().toISOString()}).eq("id",importId).eq("status","uploading");
   if(e)throw e;
   return respond({status:"review"});
  }
  if(action==="approve"||action==="reject"){
   if(item.status!=="review")return respond({error:"Apenas arquivos em revisão podem ser avaliados"},409);
   const {data:article}=await service.from(tables[item.content_type]).select("id,updated_at").eq("id",item.content_id).maybeSingle();
   if(!article||String(article.updated_at||"")!==String(item.source_updated_at||""))return respond({error:"O conteúdo mudou após o envio. Gere um novo áudio antes de aprovar."},409);
   const {error:e}=await db.update({status:action==="approve"?"approved":"rejected",updated_at:new Date().toISOString()}).eq("id",importId).eq("status","review");
   if(e)throw e;
   return respond({status:action==="approve"?"approved":"rejected"});
  }
  return respond({error:"Ação desconhecida"},400);
 }catch(e){console.error("manual audio import",e);return respond({error:"Não foi possível processar a importação"},500)}
});
