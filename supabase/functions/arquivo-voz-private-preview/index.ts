import { createClient } from "npm:@supabase/supabase-js@2.116.0";
import { AwsClient } from "npm:aws4fetch@1.0.20";

// aws4fetch reads expiry from the URL, not a top-level sign() option.
async function signR2(aws: AwsClient, value: string, method = "GET", headers?: HeadersInit, ttl = 600) {
  const url = new URL(value);
  url.searchParams.set("X-Amz-Expires", String(ttl));
  return aws.sign(new Request(url, {method, headers}), {aws: {signQuery: true, allHeaders: false}});
}

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Access-Control-Allow-Methods":"POST,OPTIONS"};
function respond(body,status=200){return new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json","Cache-Control":"no-store"}});}
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response(null,{headers:cors});
 if(req.method!=="POST")return respond({error:"Method not allowed"},405);
 try{
  const auth=req.headers.get("Authorization")||"";
  if(!auth.startsWith("Bearer "))return respond({error:"Sessão necessária"},401);
  const supabaseUrl=Deno.env.get("SUPABASE_URL")!,anon=Deno.env.get("SUPABASE_ANON_KEY")!;
  const userClient=createClient(supabaseUrl,anon,{global:{headers:{Authorization:auth}}});
  const {data:{user},error:ue}=await userClient.auth.getUser();
  if(ue||!user)return respond({error:"Sessão inválida"},401);
  const {data:isAdmin,error:ae}=await userClient.rpc("is_arquivo_sombrio_admin");
  if(ae||isAdmin!==true)return respond({error:"Acesso administrativo necessário"},403);
  const {job_id}=await req.json();
  if(typeof job_id!=="string"||!/^[0-9a-f-]{36}$/i.test(job_id))return respond({error:"ID inválido"},400);
  const service=createClient(supabaseUrl,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const {data:job,error:je}=await service.from("arquivo_voz_cloud_jobs").select("status,audio_path").eq("id",job_id).single();
  if(je||!job||!["review","approved"].includes(job.status)||!job.audio_path)return respond({error:"Áudio ainda indisponível"},404);
  const endpoint=Deno.env.get("R2_ENDPOINT"),key=Deno.env.get("R2_ACCESS_KEY_ID"),secret=Deno.env.get("R2_SECRET_ACCESS_KEY"),bucket=Deno.env.get("R2_BUCKET");
  if(!endpoint||!key||!secret||!bucket)return respond({error:"Prévia privada ainda não configurada no servidor"},503);
  const aws=new AwsClient({accessKeyId:key,secretAccessKey:secret,region:"auto",service:"s3"});
  const objectUrl=endpoint.replace(/\/$/,"")+"/"+encodeURIComponent(bucket)+"/"+job.audio_path.split("/").map(encodeURIComponent).join("/");
  const signed=await signR2(aws,objectUrl);
  return respond({url:signed.url,expires_in:600});
 }catch(e){console.error("private preview error",e);return respond({error:"Falha ao preparar a prévia privada"},500);}
});
