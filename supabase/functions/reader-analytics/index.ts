import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

function headers(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin === "https://www.arquivosombrio.net.br" ? origin : "https://arquivosombrio.net.br",
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json"
  };
}
const allowed = new Set(["inicio","dossies","garimpo","pericia","lendas","creepypastas","novels","biblioteca","outros"]);
const allowedSources = new Set(["instagram","google","facebook","whatsapp","direct","internal","other"]);
const allowedMedium = new Set(["reels","stories","carousel","bio","post","unspecified"]);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
Deno.serve(async (req) => {
  const origin=req.headers.get("origin")||"";
  const cors=headers(origin);
  if (req.method === "OPTIONS") return new Response(null,{status:!origin || origin==="https://arquivosombrio.net.br" || origin==="https://www.arquivosombrio.net.br"?204:403,headers:cors});
  if (req.method === "GET") {
    if (origin && origin!=="https://arquivosombrio.net.br" && origin!=="https://www.arquivosombrio.net.br")
      return new Response('{"ok":false}',{status:403,headers:cors});
    return new Response('{"ok":true,"function":"reader-analytics"}',{status:200,headers:cors});
  }
  if (req.method !== "POST") return new Response('{"error":"method"}',{status:405,headers:cors});
  if (origin && origin!=="https://arquivosombrio.net.br" && origin!=="https://www.arquivosombrio.net.br")
    return new Response('{"error":"origin"}',{status:403,headers:cors});
  if(Number(req.headers.get("content-length")||0)>8192)return new Response('{"error":"payload_too_large"}',{status:413,headers:cors});
  try {
    const raw=await req.text();
    if(raw.length>8192)return new Response('{"error":"payload_too_large"}',{status:413,headers:cors});
    const b=JSON.parse(raw);
    if(!uuid.test(String(b.page_instance||"")) || !uuid.test(String(b.session_id||""))) throw new Error("invalid id");
    const content_type=allowed.has(b.content_type)?b.content_type:"outros";
    const content_id=String(b.content_id||"pagina").slice(0,120).replace(/[?#].*$/,"");
    const content_title=String(b.content_title||"Sem título").replace(/[\r\n\t]/g," ").trim().slice(0,160);
    const active_seconds=Math.max(0,Math.min(1800,Math.round(Number(b.active_seconds)||0)));
    const scroll_percent=Math.max(0,Math.min(100,Math.round(Number(b.scroll_percent)||0)));
    const registered=b.registered===true;
    const traffic_source=allowedSources.has(b.traffic_source)?b.traffic_source:"direct";
    const traffic_medium=allowedMedium.has(b.traffic_medium)?b.traffic_medium:"unspecified";
    const event_type=b.event_type==="signup_intent"?"signup_intent":"read";
    const supabase=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    // Enforce atomic limits before writing. Client-supplied UUIDs are not trusted for identity.
    const ip=req.headers.get("cf-connecting-ip")?.trim()||"";
    const hash=async (value:string)=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value)))).map(v=>v.toString(16).padStart(2,"0")).join("");
    const pepper=Deno.env.get("ANALYTICS_RATE_LIMIT_PEPPER")||Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const subject=await hash(pepper+"|"+(ip?"ip:"+ip:"missing-ip-shared"));
    const {data:accepted,error:limitError}=await supabase.rpc("security_consume_rate_limit",{
      p_scope:ip?"reader_analytics_ip":"reader_analytics_no_ip",
      p_subject_hash:subject,p_max:ip?240:1200,p_window_seconds:3600,p_block_seconds:300
    });
    if(limitError){
      console.error("reader_analytics_rate_limit_error",limitError.code);
      return new Response('{"error":"temporarily_unavailable"}',{status:503,headers:cors});
    }
    if(accepted!==true)return new Response('{"error":"rate_limited"}',{status:429,headers:{...cors,"Retry-After":"300"}});
    const {error}=await supabase.from("reader_analytics").upsert({
      page_instance:b.page_instance,session_id:b.session_id,content_type,content_id,content_title,
      active_seconds:event_type==="signup_intent"?0:active_seconds,scroll_percent:event_type==="signup_intent"?0:scroll_percent,registered,event_type,traffic_source,traffic_medium,updated_at:new Date().toISOString()
    },{onConflict:"page_instance"});
    if(error) throw error;
    return new Response('{"ok":true}',{status:200,headers:cors});
  } catch(e) {
    console.error("reader_analytics_ingestion_failure", e instanceof Error ? e.message : JSON.stringify(e));
    return new Response(JSON.stringify({error:"invalid_event"}),{status:400,headers:cors});
  }
});