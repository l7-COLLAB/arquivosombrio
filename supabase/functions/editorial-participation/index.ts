import {createClient} from "npm:@supabase/supabase-js@2.116.0";
const origins=new Set(["https://arquivosombrio.net.br","https://www.arquivosombrio.net.br"]);
const genres=new Set(["terror","suspense","misterio","fantasia_sombria","outro"]);
const kinds=new Set(["fiction","newsletter_subscribe","newsletter_confirm","newsletter_cancel","newsletter_status","newsletter_admin_diagnostics"]);
const utf8=new TextEncoder();
const hex=(bytes:Uint8Array)=>Array.from(bytes).map(n=>n.toString(16).padStart(2,"0")).join("");
const digest=async(s:string)=>hex(new Uint8Array(await crypto.subtle.digest("SHA-256",utf8.encode(s))));
const field=(b:Record<string,unknown>,k:string)=>typeof b[k]==="string"?(b[k] as string).trim():"";
const emailOK=(s:string)=>s.length>=5&&s.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
const token=()=>{const a=new Uint8Array(32);crypto.getRandomValues(a);return hex(a)};
// Newsletter requests are only enabled after a human has verified the sender
// in Resend and explicitly enabled the integration. Merely setting an API key
// must never be mistaken for a working, verified mail service.
const newsletterEnabled=()=>Deno.env.get("NEWSLETTER_ENABLED")==="true" &&
  Boolean(Deno.env.get("RESEND_API_KEY")) &&
  emailOK(Deno.env.get("NEWSLETTER_FROM_EMAIL")||"");
function database(){
 const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"{}").default;
 const url=Deno.env.get("SUPABASE_URL");
 if(!key||!url)throw Error("Database not configured");
 return {key,db:createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})};
}
async function bodyBounded(req:Request){
 const reader=req.body?.getReader();if(!reader)throw Error("Missing body");
 let count=0;const chunks:Uint8Array[]=[];
 for(;;){const {done,value}=await reader.read();if(done)break;count+=value.byteLength;
   if(count>80000){await reader.cancel();throw Error("Too large")}chunks.push(value)}
 const all=new Uint8Array(count);let offset=0;
 for(const c of chunks){all.set(c,offset);offset+=c.length}
 const b=JSON.parse(new TextDecoder().decode(all));
 if(!b||typeof b!=="object"||Array.isArray(b))throw Error("Invalid object");
 return b as Record<string,unknown>;
}
async function rate(db:any,key:string,kind:string,req:Request){
 const actor=req.headers.get("cf-connecting-ip")||"unknown";
 for(const [scope,identity,max] of [
  ["editorial_"+kind,actor,kind==="fiction"?3:kind==="newsletter_admin_diagnostics"?30:5],
  ["editorial_"+kind+"_global","global",kind==="fiction"?100:1500]
 ] as [string,string,number][]){
  const {data,error}=await db.rpc("security_consume_rate_limit",{
   p_scope:scope,p_subject_hash:await digest(key.slice(0,32)+identity),
   p_max:max,p_window_seconds:3600,p_block_seconds:3600
  });
  if(error)throw Error("Limiter unavailable");
  if(data!==true)return false;
 }
 return true;
}
async function sendConfirmation(email:string,verifyToken:string){
 const key=Deno.env.get("RESEND_API_KEY"),from=Deno.env.get("NEWSLETTER_FROM_EMAIL");
 if(!key||!from||!emailOK(from))throw Error("Mail sender unavailable");
 const url="https://arquivosombrio.net.br/confirmar-inscricao.html#token="+verifyToken;
 const txt="Você solicitou a newsletter do Arquivo Sombrio.\n\nConfirme clicando neste endereço e depois em Confirmar inscrição:\n"+url+
   "\n\nCaso não tenha solicitado, ignore este e-mail. Para cancelar posteriormente, use este endereço:\n"+
   url+"&action=cancel\n\nA confirmação exige uma ação sua.";
 const resp=await fetch("https://api.resend.com/emails",{
  method:"POST",redirect:"error",
  headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json",
   "Idempotency-Key":"arquivo-confirm-"+(await digest(verifyToken)).slice(0,40)},
  body:JSON.stringify({from,to:[email],subject:"Confirme sua inscrição · Arquivo Sombrio",text:txt})
 });
 if(!resp.ok)throw Error("Mail provider rejected message");
}
// Read-only, administrative verification. NEVER send sample e-mails, copy API
// keys to the browser, or change a Resend domain / DNS record here.
// A sending-only API key may not have permission to list domains; in that
// situation, return 'sem_permissao' rather than pretending it is verified.
async function inspectResendDomain(apiKey:string,domainName:string){
 if(!apiKey || !domainName)return {state:"nao_configurado"};
 try{
  const response=await fetch("https://api.resend.com/domains?limit=100",{
   method:"GET",redirect:"error",
   headers:{Authorization:"Bearer "+apiKey,Accept:"application/json"},
   signal:AbortSignal.timeout(8000)
  });
  if(response.status===401||response.status===403)return {state:"sem_permissao"};
  if(!response.ok)return {state:"indisponivel"};
  const data=await response.json();
  if(!data || !Array.isArray(data.data))return {state:"indisponivel"};
  const matched=data.data.find((d:unknown)=>{
   if(!d || typeof d!=="object")return false;
   return String((d as Record<string,unknown>).name||"").toLowerCase()===domainName;
  });
  if(!matched)return {state:data.has_more===true?"nao_determinado":"dominio_nao_encontrado"};
  const record=matched as Record<string,unknown>;
  const status=String(record.status||"");
  const caps=record.capabilities && typeof record.capabilities==="object"
   ? record.capabilities as Record<string,unknown> : {};
  const senderVerified=status==="verified" && caps.sending==="enabled";
  return {state:senderVerified?"verificado":"pendente",status:status.slice(0,40),sending:caps.sending==="enabled"};
 }catch{return {state:"indisponivel"};}
}

Deno.serve(async(req:Request)=>{
 const origin=req.headers.get("origin")||"";
 const headers:Record<string,string>={"Content-Type":"application/json","Cache-Control":"no-store","Vary":"Origin"};
 if(origins.has(origin))headers["Access-Control-Allow-Origin"]=origin;
 const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
 if(req.method==="OPTIONS")return new Response(null,{status:origins.has(origin)?204:403,headers:{
  ...headers,"Access-Control-Allow-Methods":"POST,OPTIONS",
  "Access-Control-Allow-Headers":"apikey,authorization,content-type,x-client-info"
 }});
 if(req.method!=="POST"||!origins.has(origin))return reply({error:"Requisição não permitida."},403);
 if(Number(req.headers.get("content-length")||0)>80000)return reply({error:"Conteúdo muito grande."},413);
 let b:Record<string,unknown>;
 try{b=await bodyBounded(req)}catch{return reply({error:"Dados inválidos ou muito grandes."},400)}
 const kind=field(b,"kind");
 if(!kinds.has(kind)||field(b,"website"))return reply({error:"Formulário inválido."},400);
 if(kind==="newsletter_status")return reply({ok:true,available:newsletterEnabled()});
 if(kind==="newsletter_admin_diagnostics"){
  const auth=req.headers.get("authorization")||"";
  const tokenValue=auth.match(/^Bearer\s+(.+)$/i)?.[1];
  if(!tokenValue)return reply({error:"Autenticação administrativa necessária."},401);
  try{
   const {db,key}=database();
   const {data:{user},error}=await db.auth.getUser(tokenValue);
   if(error||!user)return reply({error:"Sessão inválida."},401);
   // Only immutable app_metadata is considered; user_metadata is never trusted.
   if(user.app_metadata?.role!=="admin")return reply({error:"Acesso negado."},403);
   if(!await rate(db,key,kind,req))return reply({error:"Limite de consultas administrativas."},429);
   const apiKey=Deno.env.get("RESEND_API_KEY")||"";
   const from=Deno.env.get("NEWSLETTER_FROM_EMAIL")||"";
   const fromValid=emailOK(from);
   const senderDomain=fromValid?from.split("@")[1].toLowerCase():"";
   const provider=await inspectResendDomain(apiKey,senderDomain);
   return reply({
    ok:true,available:newsletterEnabled(),activation_flag:Deno.env.get("NEWSLETTER_ENABLED")==="true",
    api_key_present:Boolean(apiKey),sender_configured:fromValid,
    sender_domain:senderDomain||null,provider
   });
  }catch{
   return reply({error:"Não foi possível concluir a verificação."},503);
  }
 }
 if(kind==="fiction"){
  const pen_name=field(b,"pen_name"),contact_email=field(b,"contact_email").toLowerCase();
  const title=field(b,"title"),genre=field(b,"genre");
  const synopsis=field(b,"synopsis"),manuscript_excerpt=field(b,"manuscript_excerpt");
  if(pen_name.length<2||pen_name.length>90||!emailOK(contact_email)||
    title.length<3||title.length>180||!genres.has(genre)||
    synopsis.length<80||synopsis.length>2000||manuscript_excerpt.length<500||
    manuscript_excerpt.length>18000||b.rights_declaration!==true||
    b.adult_declaration!==true||b.consent_review!==true)
    return reply({error:"Revise os dados e as declarações obrigatórias."},400);
  try{
   const {db,key}=database();
   if(!await rate(db,key,kind,req))return reply({error:"Limite de envios atingido."},429);
   const fingerprint=await digest(contact_email+"\n"+title.toLowerCase()+"\n"+manuscript_excerpt);
   const {error}=await db.from("editorial_fiction_submissions").insert({
    pen_name,contact_email,title,genre,synopsis,manuscript_excerpt,
    rights_declaration:true,adult_declaration:true,consent_review:true,fingerprint
   });
   if(error?.code==="23505")return reply({ok:true,duplicate:true});
   if(error){console.error("fiction insert",error.code);return reply({error:"Envio não registrado."},503)}
   return reply({ok:true});
  }catch(e){console.error("fiction unavailable",String(e));return reply({error:"Recebimento temporariamente indisponível."},503)}
 }
 if(kind==="newsletter_subscribe"){
  const email=field(b,"email").toLowerCase();
  if(!emailOK(email)||b.consent!==true)return reply({error:"E-mail e consentimento obrigatórios."},400);
  if(!newsletterEnabled())
   return reply({error:"Newsletter por e-mail indisponível no momento. Use o RSS."},503);
  try{
   const {db,key}=database();
   if(!await rate(db,key,kind,req))return reply({error:"Limite de solicitações."},429);
   const existing=await db.from("editorial_newsletter_subscribers").select("id,status").eq("email",email).maybeSingle();
   if(existing.error)throw existing.error;
   if(existing.data?.status==="confirmado")return reply({ok:true});
   const random=token(),verification_hash=await digest(random);
   const values={email,status:"pendente",verification_hash,confirmed_at:null,cancelled_at:null,confirmation_requested_at:new Date().toISOString(),source:"participar"};
   const op=existing.data
    ? db.from("editorial_newsletter_subscribers").update(values).eq("id",existing.data.id)
    : db.from("editorial_newsletter_subscribers").insert(values);
   const {error}=await op;if(error)throw error;
   await sendConfirmation(email,random);
   return reply({ok:true,email_sent:true});
  }catch(e){console.error("newsletter send",String(e));return reply({error:"Não foi possível enviar o e-mail de confirmação."},503)}
 }
 const submittedToken=field(b,"token");
 if(!/^[0-9a-f]{64}$/.test(submittedToken))return reply({error:"Link inválido."},400);
 try{
  const {db,key}=database();
  if(!await rate(db,key,kind,req))return reply({error:"Limite de tentativas."},429);
  const verification_hash=await digest(submittedToken);
  const {data,error}=await db.from("editorial_newsletter_subscribers").select("id,status,confirmation_requested_at")
    .eq("verification_hash",verification_hash).maybeSingle();
  if(error)throw error;
  if(!data)return reply({error:"Link desconhecido ou substituído."},404);
  if(kind==="newsletter_cancel"){
   if(data.status!=="cancelado"){
    const {error:e}=await db.from("editorial_newsletter_subscribers").update({
     status:"cancelado",cancelled_at:new Date().toISOString()
    }).eq("id",data.id);if(e)throw e;
   }
   return reply({ok:true,status:"cancelado"});
  }
  if(data.status==="cancelado")return reply({error:"Inscrição cancelada."},409);
  if(data.status==="confirmado")return reply({ok:true,status:"confirmado"});
  const created=Date.parse(data.confirmation_requested_at);
  if(!Number.isFinite(created)||Date.now()-created>48*60*60*1000)
   return reply({error:"Link expirado. Solicite uma nova confirmação."},410);
  const {error:e}=await db.from("editorial_newsletter_subscribers").update({
   status:"confirmado",confirmed_at:new Date().toISOString(),cancelled_at:null
  }).eq("id",data.id).eq("status","pendente");if(e)throw e;
  return reply({ok:true,status:"confirmado"});
 }catch(e){console.error("newsletter change",String(e));return reply({error:"Não foi possível concluir."},503)}
});
