// Etapa 11: monitoramento administrativo somente leitura e simulacao sem envio.
// Nunca consulta enderecos de e-mail, nunca chama o provedor e nunca libera campanhas.
import {createClient} from "npm:@supabase/supabase-js@2.116.0";

const origins=new Set(["https://arquivosombrio.net.br","https://www.arquivosombrio.net.br"]);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const encoder=new TextEncoder();
const sha=async(s:string)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",encoder.encode(s))))
 .map(x=>x.toString(16).padStart(2,"0")).join("");
const field=(b:Record<string,unknown>,k:string)=>typeof b[k]==="string"?(b[k] as string).trim():"";
function database(){
 const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||
  JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"{}").default;
 const url=Deno.env.get("SUPABASE_URL");
 if(!key||!url)throw Error("Database not available");
 return {key,db:createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})};
}
function checks(){
 const from=Deno.env.get("NEWSLETTER_FROM_EMAIL")||"";
 const providerKey=Boolean(Deno.env.get("RESEND_API_KEY"));
 const declared=(Deno.env.get("NEWSLETTER_VERIFIED_DOMAIN")||"").trim().toLowerCase();
 const senderDomain=from.includes("@")?from.split("@").pop()!.toLowerCase():"";
 const senderValid=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(from);
 const confirmedDomain=Boolean(senderValid && declared && declared===senderDomain);
 const webhookConfigured=(Deno.env.get("RESEND_WEBHOOK_SECRET")||"").startsWith("whsec_");
 const unsubscribeConfigured=(Deno.env.get("NEWSLETTER_UNSUBSCRIBE_SECRET")||"").length>=32;
 const registrationFlag=Deno.env.get("NEWSLETTER_ENABLED")==="true";
 const dispatchFlag=Deno.env.get("NEWSLETTER_DISPATCH_ENABLED")==="true";
 const configReady=providerKey&&confirmedDomain&&webhookConfigured&&unsubscribeConfigured&&
  registrationFlag&&dispatchFlag;
 return {
  provider_key_present:providerKey,
  sender_domain_declared_matches:confirmedDomain,
  webhook_secret_present:webhookConfigured,
  unsubscribe_secret_present:unsubscribeConfigured,
  registration_flag:registrationFlag,
  dispatch_flag:dispatchFlag,
  config_gate_ready:configReady,
  real_domain_verification_checked:false,
  provider_delivery_tested:false
 };
}
async function readPayload(req:Request){
 const reader=req.body?.getReader();if(!reader)throw Error("Payload missing");
 const chunks:Uint8Array[]=[];let total=0;
 while(true){
  const {done,value}=await reader.read();if(done)break;
  total+=value.byteLength;
  if(total>2048){await reader.cancel();throw Error("Payload too large");}
  chunks.push(value);
 }
 const all=new Uint8Array(total);let pos=0;
 for(const c of chunks){all.set(c,pos);pos+=c.length;}
 const data=JSON.parse(new TextDecoder().decode(all));
 if(!data||typeof data!=="object"||Array.isArray(data))throw Error("Invalid body");
 return data as Record<string,unknown>;
}
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get("origin")||"";
 const headers:Record<string,string>={
  "Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","Vary":"Origin"
 };
 if(origins.has(origin))headers["Access-Control-Allow-Origin"]=origin;
 const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{headers,status});
 if(req.method==="OPTIONS")return new Response(null,{status:origins.has(origin)?204:403,headers:{
  ...headers,"Access-Control-Allow-Methods":"POST,OPTIONS",
  "Access-Control-Allow-Headers":"apikey,authorization,content-type,x-client-info"
 }});
 if(req.method!=="POST"||!origins.has(origin))return reply({error:"Requisição não permitida."},403);
 if(Number(req.headers.get("content-length")||0)>2048)return reply({error:"Corpo muito grande."},413);
 let body:Record<string,unknown>;
 try{body=await readPayload(req);}catch{return reply({error:"Dados inválidos."},400);}
 const kind=field(body,"kind");
 if(!["overview","simulate"].includes(kind))return reply({error:"Operação inválida."},400);
 try{
  const {db,key}=database();
  const token=(req.headers.get("authorization")||"").match(/^Bearer\s+(.+)$/i)?.[1];
  if(!token)return reply({error:"Autenticação administrativa obrigatória."},401);
  const {data:{user},error:authError}=await db.auth.getUser(token);
  if(authError||!user)return reply({error:"Sessão inválida."},401);
  if(user.app_metadata?.role!=="admin")return reply({error:"Acesso negado."},403);
  const actor=req.headers.get("cf-connecting-ip")||"unknown";
  const {data:allowed,error:rateError}=await db.rpc("security_consume_rate_limit",{
   p_scope:"newsletter_monitor_"+kind,
   p_subject_hash:await sha(key.slice(0,32)+actor),
   p_max:kind==="overview"?60:30,p_window_seconds:3600,p_block_seconds:3600
  });
  if(rateError)throw Error("Rate limiter unavailable");
  if(allowed!==true)return reply({error:"Limite de consultas alcançado."},429);
  if(kind==="overview"){
   const {data,error}=await db.rpc("editorial_newsletter_monitor_snapshot");
   if(error)throw Error("Monitor unavailable");
   return reply({ok:true,snapshot:data,configuration:checks(),read_only:true});
  }
  const editionId=field(body,"edition_id");
  if(!uuid.test(editionId))return reply({error:"Identificador da edição inválido."},400);
  const {data,error}=await db.rpc("editorial_newsletter_simulate_dispatch",{p_edition:editionId});
  if(error)throw Error("Simulation unavailable");
  return reply({ok:true,simulation:data,read_only:true,emails_sent:0});
 }catch(e){
  console.error("Newsletter monitoring unavailable",String(e));
  return reply({error:"Não foi possível consultar os indicadores."},503);
 }
});
