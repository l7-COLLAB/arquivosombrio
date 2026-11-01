// Etapa 10: despacho sob dupla ativacao, admin autenticado e lote limitado.
// NENHUM cron, nenhuma fila automatica; sem flags explicitas jamais contata Resend.
import {createClient} from "npm:@supabase/supabase-js@2.116.0";
const origins=new Set(["https://arquivosombrio.net.br","https://www.arquivosombrio.net.br"]);
const idPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const mailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const encoder=new TextEncoder();
const hex=(a:Uint8Array)=>Array.from(a).map(x=>x.toString(16).padStart(2,"0")).join("");
const sha=async(s:string)=>hex(new Uint8Array(await crypto.subtle.digest("SHA-256",encoder.encode(s))));
const str=(o:Record<string,unknown>,key:string)=>typeof o[key]==="string"?(o[key] as string).trim():"";
function settings(){
 const from=Deno.env.get("NEWSLETTER_FROM_EMAIL")||"";
 const domain=from.includes("@")?from.split("@").pop()!.toLowerCase():"";
 const expected=(Deno.env.get("NEWSLETTER_VERIFIED_DOMAIN")||"").toLowerCase();
 return {
  active:Deno.env.get("NEWSLETTER_DISPATCH_ENABLED")==="true" &&
   Deno.env.get("NEWSLETTER_ENABLED")==="true" &&
   Boolean(Deno.env.get("RESEND_API_KEY")) &&
   mailPattern.test(from) &&
   expected.length>3 && domain===expected &&
   (Deno.env.get("NEWSLETTER_UNSUBSCRIBE_SECRET")||"").length>=32 &&
   (Deno.env.get("RESEND_WEBHOOK_SECRET")||"").startsWith("whsec_"),
  from
 };
}
function database(){
 const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||
  JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"{}").default;
 const url=Deno.env.get("SUPABASE_URL");
 if(!url||!key)throw Error("Missing database configuration");
 return {key,db:createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})};
}
async function bodyBounded(req:Request){
 const reader=req.body?.getReader();if(!reader)throw Error("Body missing");
 const chunks:Uint8Array[]=[];let size=0;
 while(true){
  const {done,value}=await reader.read();if(done)break;
  size+=value.byteLength;if(size>2048){await reader.cancel();throw Error("Payload too large");}
  chunks.push(value);
 }
 const b=new Uint8Array(size);let offset=0;
 for(const c of chunks){b.set(c,offset);offset+=c.length;}
 const payload=JSON.parse(new TextDecoder().decode(b));
 if(!payload||typeof payload!=="object"||Array.isArray(payload))throw Error("Invalid payload");
 return payload as Record<string,unknown>;
}
async function limited(db:any,key:string,req:Request,kind:string){
 const scope="newsletter_dispatch_"+kind;
 const actor=req.headers.get("cf-connecting-ip")||"unknown";
 const {data,error}=await db.rpc("security_consume_rate_limit",{
  p_scope:scope,p_subject_hash:await sha(key.slice(0,32)+actor),
  p_max:kind==="send_batch"?12:60,p_window_seconds:3600,p_block_seconds:3600
 });
 if(error)throw Error("Rate limiter unavailable");
 return data===true;
}
async function signedLink(subscriberId:string){
 const secret=Deno.env.get("NEWSLETTER_UNSUBSCRIBE_SECRET")||"";
 if(secret.length<32)throw Error("Signing unavailable");
 const key=await crypto.subtle.importKey("raw",encoder.encode(secret),
  {name:"HMAC",hash:"SHA-256"},false,["sign"]);
 const sig=hex(new Uint8Array(await crypto.subtle.sign("HMAC",key,
  encoder.encode("arquivo-newsletter-unsubscribe:v1:"+subscriberId.toLowerCase()))));
 return "https://arquivosombrio.net.br/descadastrar-newsletter.html#token="+subscriberId.toLowerCase()+"."+sig;
}
type MailRow={
 delivery_id:string;subscriber_id:string;recipient_email:string;
 mail_subject:string;mail_preheader:string;mail_body:string;
 mail_cta_label:string;mail_cta_url:string
};
async function processOne(db:any,row:MailRow,from:string){
 const finish=async(status:string,providerId:string|null=null)=>{
  const {data,error}=await db.rpc("editorial_finish_newsletter_delivery",{
   p_delivery:row.delivery_id,p_status:status,p_provider_id:providerId
  });
  if(error||data!==true)throw Error("Could not record delivery state");
 };
 const {data:allowed,error:eligibilityError}=await db.rpc("editorial_newsletter_can_send",{
  p_delivery:row.delivery_id
 });
 if(eligibilityError)throw Error("Eligibility unavailable");
 if(allowed!==true){await finish("cancelado");return "cancelado";}
 // Re-read feature switch just before network action.
 const now=settings();
 if(!now.active){await finish("cancelado");return "cancelado";}
 const link=await signedLink(row.subscriber_id);
 const text=[
  (row.mail_preheader||"").trim(),
  (row.mail_body||"").trim(),
  row.mail_cta_label&&row.mail_cta_url?row.mail_cta_label+"\n"+row.mail_cta_url:"",
  "Você recebe esta edição porque confirmou sua inscrição no Arquivo Sombrio.",
  "Cancelar inscrição: "+link
 ].filter(Boolean).join("\n\n");
 const requestBody={
  from,to:[row.recipient_email],subject:row.mail_subject,text,
  headers:{"List-Unsubscribe":"<"+link+">"}
 };
 let response:Response;
 try{
  response=await fetch("https://api.resend.com/emails",{
   method:"POST",redirect:"error",
   headers:{
    "Authorization":"Bearer "+Deno.env.get("RESEND_API_KEY"),
    "Content-Type":"application/json",
    "Idempotency-Key":"arquivo-newsletter-v1-"+row.delivery_id
   },
   body:JSON.stringify(requestBody),signal:AbortSignal.timeout(12000)
  });
 }catch{
  // O provedor pode ter recebido a mensagem. Nunca reenfileirar automaticamente.
  await finish("incerto");return "incerto";
 }
 if(!response.ok){
  // 4xx nao ambiguos rejeitam o pedido. 409/429/5xx tratados como incertos.
  const finalStatus=response.status>=400 && response.status<500 &&
   ![408,409,425,429].includes(response.status)?"falhou":"incerto";
  await finish(finalStatus);return finalStatus;
 }
 let responseId="";
 try{
  const json=await response.json();
  responseId=typeof json?.id==="string"?json.id:"";
 }catch{}
 if(responseId.length<3||responseId.length>180){
  await finish("incerto");return "incerto";
 }
 await finish("aceito",responseId);
 return "aceito";
}
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get("origin")||"";
 const headers:Record<string,string>={
  "Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","Vary":"Origin"
 };
 if(origins.has(origin))headers["Access-Control-Allow-Origin"]=origin;
 const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
 if(req.method==="OPTIONS")return new Response(null,{
  status:origins.has(origin)?204:403,headers:{
   ...headers,"Access-Control-Allow-Methods":"POST,OPTIONS",
   "Access-Control-Allow-Headers":"apikey,authorization,content-type,x-client-info"
  }});
 if(req.method!=="POST"||!origins.has(origin))return reply({error:"Requisição não permitida."},403);
 if(Number(req.headers.get("content-length")||0)>2048)return reply({error:"Conteúdo excessivo."},413);
 let b:Record<string,unknown>;
 try{b=await bodyBounded(req);}catch{return reply({error:"Dados inválidos."},400);}
 const kind=str(b,"kind");
 if(!["status","send_batch"].includes(kind))return reply({error:"Operação inválida."},400);
 try{
  const {db,key}=database();
  const bearer=(req.headers.get("authorization")||"").match(/^Bearer\s+(.+)$/i)?.[1];
  if(!bearer)return reply({error:"Sessão administrativa necessária."},401);
  const {data:{user},error:authError}=await db.auth.getUser(bearer);
  if(authError||!user)return reply({error:"Sessão inválida."},401);
  if(user.app_metadata?.role!=="admin")return reply({error:"Acesso negado."},403);
  if(!await limited(db,key,req,kind))return reply({error:"Limite de solicitações."},429);
  const active=settings().active;
  if(kind==="status")return reply({
   ok:true,dispatch_enabled:active,
   state:active?"ativado":"bloqueado",
   max_batch:5,max_daily:50,frequency_days:7
  });
  if(!active)return reply({error:"Envio desativado. Verifique Resend, DNS e chaves de ativação."},503);
  if(str(b,"confirmation")!=="ENVIAR")return reply({error:"Confirmação explícita obrigatória."},400);
  const editionId=str(b,"edition_id");
  if(!idPattern.test(editionId))return reply({error:"Edição inválida."},400);
  const {data:claimed,error:claimError}=await db.rpc("editorial_claim_newsletter_batch",{
   p_edition:editionId,p_limit:5
  });
  if(claimError)throw Error("Claim failed");
  const counts:Record<string,number>={aceito:0,incerto:0,falhou:0,cancelado:0};
  for(const item of (claimed||[]) as MailRow[]){
   try{
    const state=await processOne(db,item,settings().from);
    counts[state]=(counts[state]||0)+1;
   }catch{
    // Não tentar de novo uma mensagem com resultado possivelmente enviado.
    const {error:finishError}=await db.rpc("editorial_finish_newsletter_delivery",{
     p_delivery:item.delivery_id,p_status:"incerto",p_provider_id:null
    });
    if(finishError)console.error("Newsletter delivery requires manual reconciliation");
    counts.incerto++;
   }
  }
  return reply({ok:true,claimed:(claimed||[]).length,results:counts,
   note:"Aceito pelo provedor não comprova entrega; confirme por webhook."});
 }catch(error){
  console.error("Newsletter batch unavailable",String(error));
  return reply({error:"Envio indisponível. Verifique a operação no painel."},503);
 }
});
