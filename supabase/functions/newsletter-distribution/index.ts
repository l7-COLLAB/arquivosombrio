// Etapa 9: operacoes de fila (sem envio) e descadastro por token HMAC.
// Nenhum caminho desta funcao chama a API Resend ou envia mensagens.
import {createClient} from "npm:@supabase/supabase-js@2.116.0";

const origins=new Set(["https://arquivosombrio.net.br","https://www.arquivosombrio.net.br"]);
const kinds=new Set(["admin_status","prepare_edition","unsubscribe"]);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const enc=new TextEncoder();
const hex=(a:Uint8Array)=>Array.from(a).map(x=>x.toString(16).padStart(2,"0")).join("");
function unhex(input:string){
 const pairs=input.match(/.{2}/g)||[];
 return new Uint8Array(pairs.map(pair=>Number.parseInt(pair,16)));
}
const sha=async(input:string)=>hex(new Uint8Array(await crypto.subtle.digest("SHA-256",enc.encode(input))));
const get=(body:Record<string,unknown>,key:string)=>typeof body[key]==="string"?(body[key] as string).trim():"";
function database(){
 const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"{}").default;
 const url=Deno.env.get("SUPABASE_URL");
 if(!key||!url)throw Error("DB not configured");
 return {key,db:createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})};
}
async function readBody(req:Request){
 const reader=req.body?.getReader();
 if(!reader)throw Error("Missing body");
 let total=0;const chunks:Uint8Array[]=[];
 for(;;){
  const {done,value}=await reader.read();
  if(done)break;
  total+=value.byteLength;
  if(total>4096){await reader.cancel();throw Error("Too large");}
  chunks.push(value);
 }
 const all=new Uint8Array(total);let offset=0;
 for(const chunk of chunks){all.set(chunk,offset);offset+=chunk.length;}
 const data=JSON.parse(new TextDecoder().decode(all));
 if(!data || typeof data!=="object" || Array.isArray(data))throw Error("Invalid body");
 return data as Record<string,unknown>;
}
async function verifyUnsubscribeToken(token:string){
 const match=token.match(/^([0-9a-f-]{36})\.([0-9a-f]{64})$/i);
 if(!match || !uuid.test(match[1]))return null;
 const id=match[1].toLowerCase();
 const secret=Deno.env.get("NEWSLETTER_UNSUBSCRIBE_SECRET")||"";
 if(secret.length<32)throw Error("Unsubscribe secret not configured");
 const key=await crypto.subtle.importKey("raw",enc.encode(secret),{name:"HMAC",hash:"SHA-256"},false,["verify"]);
 const valid=await crypto.subtle.verify("HMAC",key,unhex(match[2]),enc.encode("arquivo-newsletter-unsubscribe:v1:"+id));
 return valid?id:null;
}
async function rate(db:any,key:string,scope:string,request:Request,max:number){
 const actor=request.headers.get("cf-connecting-ip")||"unknown";
 const result=await db.rpc("security_consume_rate_limit",{
  p_scope:"newsletter_distribution_"+scope,
  p_subject_hash:await sha(key.slice(0,32)+actor),
  p_max:max,p_window_seconds:3600,p_block_seconds:3600
 });
 if(result.error)throw Error("Rate limiter unavailable");
 return result.data===true;
}
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get("origin")||"";
 const headers:Record<string,string>={"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","Vary":"Origin"};
 if(origins.has(origin))headers["Access-Control-Allow-Origin"]=origin;
 const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
 if(req.method==="OPTIONS")return new Response(null,{status:origins.has(origin)?204:403,headers:{
  ...headers,"Access-Control-Allow-Methods":"POST,OPTIONS",
  "Access-Control-Allow-Headers":"apikey,authorization,content-type,x-client-info"
 }});
 if(req.method!=="POST"||!origins.has(origin))return reply({error:"Requisição não permitida."},403);
 if(Number(req.headers.get("content-length")||0)>4096)return reply({error:"Requisição muito grande."},413);
 let body:Record<string,unknown>;
 try{body=await readBody(req);}catch{return reply({error:"Dados inválidos."},400);}
 const kind=get(body,"kind");
 if(!kinds.has(kind))return reply({error:"Operação inválida."},400);
 try{
  const {db,key}=database();
  if(kind==="unsubscribe"){
   if(!await rate(db,key,"unsubscribe",req,100))return reply({error:"Limite de tentativas."},429);
   const subscriberId=await verifyUnsubscribeToken(get(body,"token"));
   if(!subscriberId)return reply({error:"Link inválido."},400);
   const {error}=await db.from("editorial_newsletter_subscribers").update({
    status:"cancelado",cancelled_at:new Date().toISOString()
   }).eq("id",subscriberId).eq("status","confirmado");
   if(error)throw Error("Subscriber update failed");
   const {error:queueError}=await db.from("editorial_newsletter_delivery_queue")
    .update({status:"cancelado",updated_at:new Date().toISOString()})
    .eq("subscriber_id",subscriberId).eq("status","preparado");
   if(queueError)throw Error("Queue cancel failed");
   return reply({ok:true,status:"cancelado"});
  }

  const bearer=(req.headers.get("authorization")||"").match(/^Bearer\s+(.+)$/i)?.[1];
  if(!bearer)return reply({error:"Sessão administrativa necessária."},401);
  const {data:{user},error:authError}=await db.auth.getUser(bearer);
  if(authError||!user)return reply({error:"Sessão expirada."},401);
  if(user.app_metadata?.role!=="admin")return reply({error:"Acesso negado."},403);
  if(!await rate(db,key,kind,req,kind==="prepare_edition"?20:60))return reply({error:"Limite de consultas."},429);

  if(kind==="admin_status"){
   const approved=await db.from("editorial_newsletter_editions").select("id,title,subject,status,updated_at")
    .eq("status","aprovado").order("updated_at",{ascending:false}).limit(100);
   if(approved.error)throw Error("Edition read failed");
   const counts:Record<string,number>={};
   for(const status of ["preparado","cancelado","em_envio","aceito","entregue","falhou","incerto","bounce","reclamacao"]){
    const {count,error}=await db.from("editorial_newsletter_delivery_queue")
     .select("id",{count:"exact",head:true}).eq("status",status);
    if(error)throw Error("Queue count failed");
    counts[status]=count||0;
   }
   return reply({ok:true,editions:approved.data||[],counts,dispatch_enabled:false});
  }
  const editionId=get(body,"edition_id");
  if(!uuid.test(editionId))return reply({error:"Edição inválida."},400);
  const {data:inserted,error:preparedError}=await db.rpc("editorial_prepare_newsletter_queue",{p_edition:editionId});
  if(preparedError){
   if(preparedError.code==="22023")return reply({error:"Somente edições aprovadas podem ser preparadas."},409);
   throw Error("Queue preparation failed");
  }
  const {count,error:countError}=await db.from("editorial_newsletter_delivery_queue")
   .select("id",{count:"exact",head:true}).eq("edition_id",editionId).eq("status","preparado");
  if(countError)throw Error("Queue count failed");
  return reply({ok:true,created:inserted||0,prepared:count||0,emails_sent:0});
 }catch(error){
  console.error("Newsletter distribution unavailable",String(error));
  return reply({error:"Serviço temporariamente indisponível."},503);
 }
});
