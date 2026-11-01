// Resend Webhook: assinatura criptografica antes de qualquer escrita.
// Somente eventos de e-mail relacionados a envios registrados alteram a base.
import {Webhook} from "npm:svix@2.9.1";
import {createClient} from "npm:@supabase/supabase-js@2.116.0";
const accepted=new Set([
 "email.sent","email.delivered","email.bounced","email.complained",
 "email.failed","email.suppressed"
]);
function database(){
 const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||
  JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"{}").default;
 const url=Deno.env.get("SUPABASE_URL");
 if(!key||!url)throw Error("Database unavailable");
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
async function rawBody(req:Request){
 const reader=req.body?.getReader();if(!reader)throw Error("Empty body");
 let total=0;const chunks:Uint8Array[]=[];
 while(true){
  const {done,value}=await reader.read();if(done)break;
  total+=value.byteLength;if(total>16000){await reader.cancel();throw Error("Too large");}
  chunks.push(value);
 }
 const all=new Uint8Array(total);let offset=0;
 for(const part of chunks){all.set(part,offset);offset+=part.length;}
 return new TextDecoder().decode(all);
}
Deno.serve(async(req:Request)=>{
 const headers={"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"};
 const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{headers,status});
 if(req.method!=="POST")return reply({error:"Método inválido."},405);
 if(Number(req.headers.get("content-length")||0)>16000)return reply({error:"Payload muito grande."},413);
 const secret=Deno.env.get("RESEND_WEBHOOK_SECRET")||"";
 if(!secret.startsWith("whsec_"))return reply({error:"Webhook não configurado."},503);
 const id=req.headers.get("svix-id")||"";
 const timestamp=req.headers.get("svix-timestamp")||"";
 const signature=req.headers.get("svix-signature")||"";
 if(!id||id.length>180||!timestamp||!signature)return reply({error:"Assinatura ausente."},401);
 let content="";
 try{content=await rawBody(req);}catch{return reply({error:"Payload inválido."},400);}
 let event:any;
 try{
  event=new Webhook(secret).verify(content,{
   "svix-id":id,"svix-timestamp":timestamp,"svix-signature":signature
  });
 }catch{return reply({error:"Assinatura inválida."},401);}
 if(!event||typeof event!=="object"||!accepted.has(event.type))
  return reply({ok:true,ignored:true});
 const providerId=event.data?.email_id;
 if(typeof providerId!=="string"||providerId.length<3||providerId.length>180)
  return reply({error:"Evento sem ID de mensagem."},400);
 try{
  const db=database();
  const {data,error}=await db.rpc("editorial_record_newsletter_provider_event",{
   p_provider_id:providerId,p_event_id:id,p_event_type:event.type
  });
  if(error){
   // Se webhook chegar antes de gravar ID da mensagem, Resend pode reenviar.
   // Não registrar evento como entregue sem correspondência.
   if(error.code==="P0002")return reply({error:"Mensagem ainda não vinculada."},503);
   throw Error("Event transaction failed");
  }
  return reply({ok:true,recorded:data===true});
 }catch{
  console.error("Newsletter provider event could not be recorded");
  return reply({error:"Evento não processado."},503);
 }
});
