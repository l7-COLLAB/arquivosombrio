import { createClient } from "npm:@supabase/supabase-js@2.116.0";

const origins = new Set(["https://arquivosombrio.net.br", "https://www.arquivosombrio.net.br"]);
const events = new Set(["audio_click", "login_gate_shown", "login_success", "signup_started", "signup_success", "manifest_ready", "play_started", "play_completed", "play_error"]);
const types: Record<string, string> = {dossie:"Casos",garimpo:"casos_diarios",pericia:"pericias",lenda:"lendas",creepypasta:"creepypastas"};
const hash = async (value: string) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)))).map(x=>x.toString(16).padStart(2,"0")).join("");

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin") || "";
  const headers: Record<string,string> = {"Content-Type":"application/json", "Cache-Control":"no-store", "Vary":"Origin"};
  if (origins.has(origin)) headers["Access-Control-Allow-Origin"] = origin;
  const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), {status, headers});
  if (req.method === "OPTIONS") return new Response(null, {status:origins.has(origin)?204:403, headers:{...headers,"Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info"}});
  if (req.method !== "POST" || !origins.has(origin)) return reply({error:"Requisição não permitida."},403);
  if (Number(req.headers.get("content-length") || 0) > 12000) return reply({error:"Dados muito grandes."},413);
  try {
    // Bound the stream before parsing, including chunked bodies without Content-Length.
    const reader=req.body?.getReader();if(!reader)return reply({error:"Dados inválidos."},400);
    const parts:Uint8Array[]=[];let size=0;
    for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>12000){await reader.cancel();return reply({error:"Dados muito grandes."},413)}parts.push(value)}
    const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length}
    const body=JSON.parse(new TextDecoder().decode(bytes));
    if(!body || typeof body!=="object" || Array.isArray(body) || body.website) return reply({error:"Dados inválidos."},400);
    const kind=body.kind;
    if(kind!=="suggestion" && kind!=="audio_metric")return reply({error:"Operação inválida."},400);
    let payload:Record<string,unknown>;
    if(kind==="suggestion"){
      const name=String(body.name||"").trim(),title=String(body.title||"").trim(),description=String(body.description||"").trim();
      if(name.length<2 || name.length>100 || title.length<3 || title.length>200 || description.length>5000)return reply({error:"Confira nome, título e descrição."},400);
      payload={nome:name,titulo:title,descricao:description||null,status:"nova",account_content_state:"active"};
    }else{
      if(!events.has(body.event_type) || !types[body.content_type] || !Number.isSafeInteger(body.content_id) || body.content_id<=0)return reply({error:"Evento inválido."},400);
      const metadata:Record<string,unknown>={};
      for(const key of ["chunks","total_chunks","index"])if(Number.isSafeInteger(body.metadata?.[key]) && body.metadata[key]>=0 && body.metadata[key]<=10000)metadata[key]=body.metadata[key];
      if(typeof body.metadata?.confirmation_required==="boolean")metadata.confirmation_required=body.metadata.confirmation_required;
      payload={event_type:body.event_type,content_type:body.content_type,content_id:body.content_id,metadata};
    }
    const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const db=createClient(Deno.env.get("SUPABASE_URL")!,key,{auth:{persistSession:false,autoRefreshToken:false}});
    let uid:string|null=null;
    const authorization=req.headers.get("authorization");
    if(authorization){
      const token=authorization.match(/^Bearer (.+)$/i)?.[1];
      if(!token)return reply({error:"Sessão inválida."},401);
      const user=await db.auth.getUser(token);
      if(user.error || !user.data.user)return reply({error:"Sessão inválida."},401);
      uid=user.data.user.id;
    }
    const ip=req.headers.get("cf-connecting-ip");
    // Never depend on caller-controlled e-mail or arbitrary user-agent for the fallback.
    const identity=uid?"user:"+uid:ip?"ip:"+ip:"unknown";
    const checks=[
      {p_scope:"public_"+kind,p_subject_hash:await hash(key.slice(0,32)+identity),p_max:kind==="suggestion"?5:240,p_window_seconds:kind==="suggestion"?3600:900,p_block_seconds:900},
      {p_scope:"public_"+kind+"_global",p_subject_hash:await hash(key.slice(0,32)+"global"),p_max:kind==="suggestion"?100:10000,p_window_seconds:3600,p_block_seconds:900}
    ];
    for(const check of checks){const result=await db.rpc("security_consume_rate_limit",check);if(result.error)return reply({error:"Serviço temporariamente indisponível."},503);if(result.data!==true)return reply({error:"Limite temporário. Tente novamente mais tarde."},429)}
    const result=await db.from(kind==="suggestion"?"Sugestoes":"audio_usage_events").insert({...payload,user_id:uid});
    if(result.error){console.error("public contribution",result.error.code);return reply({error:"Não foi possível registrar."},503)}
    return reply({ok:true});
  }catch{return reply({error:"Dados inválidos."},400)}
});
