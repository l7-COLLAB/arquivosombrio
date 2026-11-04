
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors={
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":"POST, OPTIONS"
};

function json(body:any,status=200){
  return new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json"}});
}

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
  if(req.method!=="POST")return json({error:"Método não permitido."},405);

  const url=Deno.env.get("SUPABASE_URL");
  const serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!url||!serviceKey)return json({error:"Configuração Supabase indisponível."},503);
  // This administrative generator must never be callable anonymously.
  const supplied=req.headers.get("Authorization")||"";
  const cronToken=req.headers.get("x-prewarm-token")||"";
  const serviceAuthenticated=supplied==="Bearer "+serviceKey;
  if(!serviceAuthenticated){
    if(!cronToken)return json({error:"Não autorizado."},401);
    const verifier=createClient(url,serviceKey,{auth:{persistSession:false}});
    const verification=await verifier.rpc("verify_narration_prewarm_token",{p_token:cronToken});
    if(verification.error||verification.data!==true)return json({error:"Não autorizado."},401);
  }

  const admin=createClient(url,serviceKey,{auth:{persistSession:false}});
  let job:any=null;

  try{
    const claim=await admin.rpc("claim_narration_prewarm");
    if(claim.error)throw claim.error;
    job=claim.data;
    if(!job?.id)return json({ok:true,idle:true});

    const headers={
      "Content-Type":"application/json",
      "apikey":serviceKey,
      "Authorization":"Bearer "+serviceKey
    };
    const narrationUrl=url+"/functions/v1/public-narration";
    const call=async(body:any)=>{
      const r=await fetch(narrationUrl,{method:"POST",headers,body:JSON.stringify(body)});
      const data=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(data?.error||("Falha na narração: HTTP "+r.status));
      return data;
    };

    const manifest=await call({
      type:job.content_type,
      id:String(job.content_id),
      action:"manifest"
    });

    const total=Number(manifest?.total_chunks||0);
    if(!Number.isInteger(total)||total<1)throw new Error("Manifesto sem trechos narráveis.");

    let next=Math.max(0,Number(job.next_chunk||0));
    const started=Date.now();
    let generated=0;

    while(next<total){
      await call({
        type:job.content_type,
        id:String(job.content_id),
        action:"chunk",
        index:next
      });
      next++;
      generated++;

      await admin.from("narration_prewarm_queue").update({
        next_chunk:next,
        total_chunks:total,
        status:next>=total?"done":"running",
        completed_at:next>=total?new Date().toISOString():null,
        last_error:null,
        next_retry_at:null,
        updated_at:new Date().toISOString()
      }).eq("id",job.id);

      if(next>=total)break;
      if(Date.now()-started>18000||generated>=6)break;
    }

    if(next<total){
      const up=await admin.from("narration_prewarm_queue").update({
        status:"pending",
        next_chunk:next,
        total_chunks:total,
        next_retry_at:new Date(Date.now()+15000).toISOString(),
        updated_at:new Date().toISOString()
      }).eq("id",job.id);
      if(up.error)throw up.error;
    }

    return json({
      ok:true,
      content_type:job.content_type,
      content_id:job.content_id,
      generated_now:generated,
      next_chunk:next,
      total_chunks:total,
      complete:next>=total
    });
  }catch(e){
    console.error(e);
    if(job?.id){
      const attempts=Number(job.attempts||1);
      const waitMinutes=Math.min(30,Math.max(1,Math.pow(2,Math.min(4,attempts-1))));
      await admin.from("narration_prewarm_queue").update({
        status:"failed",
        last_error:e instanceof Error?e.message:"Falha na pré-geração.",
        next_retry_at:new Date(Date.now()+waitMinutes*60000).toISOString(),
        updated_at:new Date().toISOString()
      }).eq("id",job.id);
    }
    return json({error:"Não foi possível concluir a pré-geração."},500);
  }
});
