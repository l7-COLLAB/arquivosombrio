import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "npm:@supabase/supabase-js@2";
import {processCampaign} from "./promotion-core.ts";
const json=(v:unknown,s=200)=>new Response(JSON.stringify(v),{status:s,headers:{"content-type":"application/json","cache-control":"no-store"}});
Deno.serve(async req=>{
 if(req.method!=="POST")return json({error:"Method not allowed"},405);
 const url=Deno.env.get("SUPABASE_URL")||"",key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
 if(!url||!key)return json({error:"Unavailable"},503);
 const db=createClient(url,key,{auth:{persistSession:false}});
 let token="";try{token=atob(req.headers.get("x-campaign-cron-token")||"")}catch{return json({error:"Invalid token encoding"},401)}
 if(!token)return json({error:"Unauthorized"},401);
 const allowed=await db.rpc("verify_campaign_cover_cron_token",{p_token:token});
 if(allowed.error||allowed.data!==true)return json({error:"Forbidden"},403);
 const due=await db.rpc("campaign_covers_pending",{p_limit:20});
 if(due.error)return json({error:"Pending selection failed",code:due.error.code||null},503);
 let promoted=0,failed=0,checked=0,skipped=0;
 const errors:Record<string,number>={};
 for(const row of due.data||[]){
   checked++;
   const result=await processCampaign(db,row);
   if(result.state==="promoted")promoted++;
   else if(result.state==="failed"){failed++;errors[result.code||"unknown"]=(errors[result.code||"unknown"]||0)+1;}
   else skipped++;
 }
 const ok=failed===0;
 if(checked>0||!ok)console.info("Campaign cover batch",JSON.stringify({checked,promoted,failed,skipped,errors}));
 return json({ok,checked,promoted,failed,skipped,errors},ok?200:503);
});
