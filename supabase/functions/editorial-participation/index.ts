import {createClient} from "npm:@supabase/supabase-js@2.116.0";
const origins=new Set(["https://arquivosombrio.net.br","https://www.arquivosombrio.net.br"]);
const genres=new Set(["terror","suspense","misterio","fantasia_sombria","outro"]);
const kinds=new Set(["fiction","newsletter_subscribe","newsletter_confirm","newsletter_cancel"]);
const utf8=new TextEncoder();
const hex=(bytes:Uint8Array)=>Array.from(bytes).map(n=>n.toString(16).padStart(2,"0")).join("");
const digest=async(s:string)=>hex(new Uint8Array(await crypto.subtle.digest("SHA-256",utf8.encode(s))));
const field=(b:Record<string,unknown>,k:string)=>typeof b[k]==="string"?(b[k] as string).trim():"";
const emailOK=(s:string)=>s.length>=5&&s.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
const token=()=>{const a=new Uint8Array(32);crypto.getRandomValues(a);return hex(a)};
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
  ["editorial_"+kind,actor,kind==="fiction"?3:5],
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
  if(!Deno.env.get("RESEND_API_KEY")||!emailOK(Deno.env.get("NEWSLETTER_FROM_EMAIL")||""))
   return reply({error:"Newsletter por e-mail indisponível no momento. Use o RSS."},503);
  try{
   const {db,key}=database();
   if(!await rate(db,key,kind,req))return reply({error:"Limite de solicitações."},429);
   const existing=await db.from("editorial_newsletter_subscribers").select("id,status").eq("email",email).maybeSingle();
   if(existing.error)throw existing.error;
   if(existing.data?.status==="confirmado")return reply({ok:true,already_confirmed:true});
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
