// Etapa 12: verifica domínios e webhooks diretamente na Resend, SEM alterações externas.
// Sem API de envio. Retorna somente flags e estados, jamais chaves, e-mails ou IDs externos.
import {createClient} from "npm:@supabase/supabase-js@2.116.0";
const origins=new Set(["https://arquivosombrio.net.br","https://www.arquivosombrio.net.br"]);
const webHook="https://iuhotznurbyujzbyhizf.supabase.co/functions/v1/newsletter-webhook";
const requiredEvents=["email.delivered","email.bounced","email.complained"];
const encoding=new TextEncoder();
const digest=async(s:string)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",encoding.encode(s)))).map(n=>n.toString(16).padStart(2,"0")).join("");
const field=(b:Record<string,unknown>,k:string)=>typeof b[k]==="string"?(b[k] as string).trim():"";
async function parse(req:Request){
 const reader=req.body?.getReader();if(!reader)throw Error("No body");
 let total=0;const parts:Uint8Array[]=[];
 for(;;){const {done,value}=await reader.read();if(done)break;
  total+=value.byteLength;if(total>1024){await reader.cancel();throw Error("Body too large");}
  parts.push(value);}
 const bytes=new Uint8Array(total);let i=0;for(const x of parts){bytes.set(x,i);i+=x.length;}
 const b=JSON.parse(new TextDecoder().decode(bytes));
 if(!b||typeof b!=="object"||Array.isArray(b))throw Error("Body malformed");
 return b as Record<string,unknown>;
}
function database(){
 const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||
  JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"{}").default;
 const url=Deno.env.get("SUPABASE_URL");
 if(!url||!key)throw Error("DB unavailable");
 return {key,db:createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})};
}
async function readResend(path:string,apiKey:string){
 if(!apiKey)return {state:"not_configured",data:[]};
 try{
  const res=await fetch("https://api.resend.com/"+path,{
   headers:{"Authorization":"Bearer "+apiKey,"Accept":"application/json"},
   redirect:"error",signal:AbortSignal.timeout(6500)
  });
  if(res.status===401||res.status===403)return {state:"unauthorized",data:[]};
  if(!res.ok)return {state:"unavailable",data:[]};
  const body=await res.json();
  if(!Array.isArray(body?.data))return {state:"unavailable",data:[]};
  if(body.has_more===true)return {state:"incomplete",data:[]};
  return {state:"read",data:body.data as Array<Record<string,unknown>>};
 }catch{return {state:"unavailable",data:[]};}
}
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get("origin")||"";
 const headers:Record<string,string>={
  "Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","Vary":"Origin"
 };
 if(origins.has(origin))headers["Access-Control-Allow-Origin"]=origin;
 const respond=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
 if(req.method==="OPTIONS")return new Response(null,{status:origins.has(origin)?204:403,headers:{
  ...headers,"Access-Control-Allow-Methods":"POST,OPTIONS",
  "Access-Control-Allow-Headers":"apikey,authorization,content-type,x-client-info"
 }});
 if(req.method!=="POST"||!origins.has(origin))return respond({error:"Origem ou método não permitido."},403);
 if(Number(req.headers.get("content-length")||0)>1024)return respond({error:"Dados inválidos."},413);
 let body:Record<string,unknown>;
 try{body=await parse(req);}catch{return respond({error:"Dados inválidos."},400);}
 if(field(body,"kind")!=="preflight")return respond({error:"Operação inválida."},400);
 try{
  const {key,db}=database();
  const bearer=(req.headers.get("authorization")||"").match(/^Bearer\s+(.+)$/i)?.[1];
  if(!bearer)return respond({error:"Autenticação administrativa obrigatória."},401);
  const {data:{user},error:authError}=await db.auth.getUser(bearer);
  if(authError||!user)return respond({error:"Sessão inválida."},401);
  if(user.app_metadata?.role!=="admin")return respond({error:"Acesso negado."},403);
  const actor=req.headers.get("cf-connecting-ip")||"unknown";
  const {data:allowed,error:rateError}=await db.rpc("security_consume_rate_limit",{
   p_scope:"newsletter_activation_preflight",
   p_subject_hash:await digest(key.slice(0,32)+actor),
   p_max:20,p_window_seconds:3600,p_block_seconds:3600
  });
  if(rateError)throw Error("Rate limiter unavailable");
  if(allowed!==true)return respond({error:"Limite de consultas."},429);
  const from=Deno.env.get("NEWSLETTER_FROM_EMAIL")||"";
  const declared=(Deno.env.get("NEWSLETTER_VERIFIED_DOMAIN")||"").trim().toLowerCase();
  const domain=from.includes("@")?from.split("@").pop()!.toLowerCase():"";
  const match=Boolean(/^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(from)&&declared&&domain===declared);
  const unsubscribeReady=(Deno.env.get("NEWSLETTER_UNSUBSCRIBE_SECRET")||"").length>=32;
  const webhookSecretReady=(Deno.env.get("RESEND_WEBHOOK_SECRET")||"").startsWith("whsec_");
  const pilotOnly=Deno.env.get("NEWSLETTER_PILOT_ONLY")!=="false";
  const pilotReady=/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(Deno.env.get("NEWSLETTER_PILOT_EMAIL")||"");
  // Em contas com API key somente de envio, a Resend pode bloquear GET /domains e /webhooks.
  // Chave separada de consulta (Full Access) é opcional; NÃO deve ser retornada ou logada.
  const inspectKey=Deno.env.get("RESEND_MANAGEMENT_API_KEY")||Deno.env.get("RESEND_API_KEY")||"";
  const [domains,webhooks]=await Promise.all([
   readResend("domains",inspectKey),readResend("webhooks",inspectKey)
  ]);
  const target=domains.state==="read"?
   domains.data.find(x=>typeof x.name==="string"&&x.name.toLowerCase()===domain):null;
  const verified=Boolean(match && target &&
   (target.status==="verified"||target.status==="partially_verified") &&
   typeof target.capabilities==="object"&&target.capabilities!==null &&
   (target.capabilities as Record<string,unknown>).sending==="enabled");
  const registered=webhooks.state==="read"?
   webhooks.data.find(x=>x.endpoint===webHook&&x.status==="enabled"&&Array.isArray(x.events)):null;
  const events=registered?registered.events as string[]:[];
  const subscribed=requiredEvents.every(e=>events.includes(e));
  return respond({ok:true,read_only:true,
   flags:{
    registration_enabled:Deno.env.get("NEWSLETTER_ENABLED")==="true",
    dispatch_enabled:Deno.env.get("NEWSLETTER_DISPATCH_ENABLED")==="true",
    pilot_only:pilotOnly,pilot_recipient_configured:pilotReady,
    sender_domain_matches:match,unsubscribe_secret_present:unsubscribeReady,
    webhook_secret_present:webhookSecretReady,
    delivery_api_key_present:Boolean(Deno.env.get("RESEND_API_KEY")),
    management_inspection_key_present:Boolean(Deno.env.get("RESEND_MANAGEMENT_API_KEY"))
   },
   provider:{
    domain_lookup:domains.state,domain_sending_verified:verified,
    webhook_lookup:webhooks.state,webhook_enabled:registered!==null,
    webhook_required_events_present:subscribed,
    checked_at:new Date().toISOString()
   },
   pilot_ready:pilotOnly&&pilotReady&&verified&&registered!==null&&subscribed&&
    Boolean(Deno.env.get("RESEND_API_KEY"))&&
    unsubscribeReady&&webhookSecretReady&&match&&
    Deno.env.get("NEWSLETTER_ENABLED")==="true" &&
    Deno.env.get("NEWSLETTER_DISPATCH_ENABLED")==="true",
   note:"Pré-verificação apenas: não houve e-mail ou alteração no provedor."
  });
 }catch(e){
  console.error("Newsletter preflight unavailable",String(e));
  return respond({error:"Diagnóstico temporariamente indisponível."},503);
 }
});
