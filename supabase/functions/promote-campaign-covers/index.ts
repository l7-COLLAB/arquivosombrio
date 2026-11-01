import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "npm:@supabase/supabase-js@2";
import {processCampaign} from "./promotion-core.ts";
const headers={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization,apikey,content-type","Access-Control-Allow-Methods":"POST,OPTIONS","Content-Type":"application/json","Cache-Control":"no-store"};
const respond=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers});
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response(null,{headers});
 if(req.method!=="POST")return respond({error:"Método inválido"},405);
 try{
 const token=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"");
 const url=Deno.env.get("SUPABASE_URL")||"",key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
 if(!token||!url||!key)return respond({error:"Autenticação necessária"},401);
 const db=createClient(url,key,{auth:{persistSession:false}});
 const user=await db.auth.getUser(token);
 if(user.error||!user.data.user)return respond({error:"Sessão inválida"},401);
 const caller=createClient(url,Deno.env.get("SUPABASE_ANON_KEY")||"",{global:{headers:{Authorization:"Bearer "+token}},auth:{persistSession:false}});
 const role=await caller.rpc("is_arquivo_sombrio_admin");
 if(role.error||role.data!==true)return respond({error:"Acesso negado"},403);
 const body=await req.json().catch(()=>({}));
 const id=String(body.id||"");
 if(!/^[a-z0-9-]{1,100}$/.test(id))return respond({error:"Campanha inválida"},400);
 const row=await db.from("published_campaigns").select("id,payload,publish_at").eq("id",id).maybeSingle();
 if(row.error||!row.data)return respond({error:"Campanha não encontrada"},404);
 if(Date.parse(row.data.publish_at)>Date.now())return respond({error:"Aguardando data programada"},409);
 const outcome=await processCampaign(db,row.data);
 if(outcome.state==="failed")return respond({error:"Falha ao promover capa",code:outcome.code},503);
 if(outcome.state==="skipped"&&["heroImage","cardImage"].some(k=>String(row.data.payload?.[k]||"").startsWith("staging:")))
   return respond({error:"Campanha alterada durante a promoção; atualize o editor e tente novamente"},409);
 return respond({ok:true,promoted:outcome.state==="promoted"?1:0});
 }catch{return respond({error:"Falha interna"},500)}
});