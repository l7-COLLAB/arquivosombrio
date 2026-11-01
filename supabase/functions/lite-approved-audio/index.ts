
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.116.0";
import { AwsClient } from "npm:aws4fetch@1.0.20";


// aws4fetch reads expiry from the URL, not a top-level sign() option.
async function signR2(aws: AwsClient, value: string, method = "GET", headers?: HeadersInit, ttl = 600) {
  const url = new URL(value);
  url.searchParams.set("X-Amz-Expires", String(ttl));
  return aws.sign(new Request(url, {method, headers}), {aws: {signQuery: true, allHeaders: false}});
}

const cors={
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Headers":"content-type,apikey,authorization",
  "Access-Control-Allow-Methods":"GET,OPTIONS",
  "Cache-Control":"no-store"
};
const tables:any={
  dossie:"Casos",
  garimpo:"casos_diarios",
  pericia:"pericias",
  lenda:"lendas",
  creepypasta:"creepypastas"
};
function json(v:any,status=200){return new Response(JSON.stringify(v),{status,headers:{...cors,"Content-Type":"application/json"}})}
async function signedR2(path:string){
  const endpoint=Deno.env.get("R2_ENDPOINT"),key=Deno.env.get("R2_ACCESS_KEY_ID"),
        secret=Deno.env.get("R2_SECRET_ACCESS_KEY"),bucket=Deno.env.get("R2_BUCKET");
  if(!endpoint||!key||!secret||!bucket)throw new Error("R2 indisponível");
  const url=endpoint.replace(/\/$/,"")+"/"+encodeURIComponent(bucket)+"/"+path.split("/").map(encodeURIComponent).join("/");
  const aws=new AwsClient({accessKeyId:key,secretAccessKey:secret,region:"auto",service:"s3"});
  return await signR2(aws,url);
}
Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response(null,{headers:cors});
  if(req.method!=="GET")return json({error:"Método não permitido"},405);
  try{
    const u=new URL(req.url),type=String(u.searchParams.get("type")||""),id=Number(u.searchParams.get("id"));
    const check=u.searchParams.get("check")==="1";
    if(!tables[type]||!Number.isSafeInteger(id)||id<=0)return json({error:"Arquivo inválido"},400);

    const admin=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{auth:{persistSession:false}});
    if(!check){
      const token=req.headers.get("Authorization")?.match(/^Bearer (.+)$/i)?.[1];
      if(!token)return json({error:"Entre na sua conta para ouvir.",code:"LOGIN_REQUIRED"},401);
      const verified=await admin.auth.getUser(token);
      if(verified.error||!verified.data.user)return json({error:"Sessão inválida.",code:"LOGIN_REQUIRED"},401);
      const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(verified.data.user.id));
      const subject=Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,"0")).join("");
      const limit=await admin.rpc("security_consume_rate_limit",{p_scope:"lite_audio_user",p_subject_hash:subject,p_max:90,p_window_seconds:900,p_block_seconds:900});
      if(limit.error)return json({error:"Serviço temporariamente indisponível."},503);
      if(limit.data!==true)return json({error:"Limite temporário de solicitações."},429);
    }
    const article=await admin.from(tables[type]).select("id,updated_at,status_publicacao").eq("id",id).eq("status_publicacao","publicado").or((type==="dossie"?"published_at":"publicado_em")+".is.null,"+(type==="dossie"?"published_at":"publicado_em")+".lte."+new Date().toISOString()).maybeSingle();
    if(article.error||!article.data)return json({available:false},404);

    const manual=await admin.from("arquivo_voz_manual_imports")
      .select("id,audio_path,source_updated_at")
      .eq("content_type",type).eq("content_id",id).eq("status","approved")
      .order("created_at",{ascending:false}).limit(5);
    if(!manual.error){
      for(const item of manual.data||[]){
        if(String(article.data.updated_at||"")!==String(item.source_updated_at||""))continue;
        if(check)return json({available:true,engine:"kokoro",source:"approved"});
        const signed=await signedR2(item.audio_path);
        return u.searchParams.get("format")==="json"?json({url:signed.url,expires_in:600}):new Response(null,{status:302,headers:{...cors,Location:signed.url}});
      }
    }

    const cloud=await admin.from("arquivo_voz_cloud_jobs")
      .select("id,audio_path").eq("content_type",type).eq("content_id",id)
      .eq("status","approved").not("audio_path","is",null)
      .order("created_at",{ascending:false}).limit(8);
    if(!cloud.error){
      for(const job of cloud.data||[]){
        const rpc=type==="dossie"?"is_dossier_audio_current":"is_remaining_archive_audio_current";
        const valid=await admin.rpc(rpc,{p_job_id:job.id});
        if(valid.error||valid.data!==true)continue;
        if(check)return json({available:true,engine:"kokoro",source:"approved"});
        const signed=await signedR2(job.audio_path);
        return u.searchParams.get("format")==="json"?json({url:signed.url,expires_in:600}):new Response(null,{status:302,headers:{...cors,Location:signed.url}});
      }
    }

    return json({available:false},404);
  }catch(e){
    console.error("lite-approved-audio",e);
    return json({available:false,error:"Áudio indisponível"},500);
  }
});
