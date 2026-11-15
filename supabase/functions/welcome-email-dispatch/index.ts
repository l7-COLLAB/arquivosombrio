import {createClient} from "npm:@supabase/supabase-js@2.116.0";
const respond=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
const escapeHtml=(s:string)=>s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]!));
const firstName=(s:string)=>{const v=s.trim().replace(/\s+/g," ").slice(0,80).split(" ")[0]||"";return /^[\p{L}\p{M}'-]{1,40}$/u.test(v)?v:"";};
const html=(name:string)=>{const who=name?"Olá, "+escapeHtml(name)+"!":"Olá, investigador(a)!";return `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bem-vindo ao Arquivo Sombrio</title></head><body style="margin:0;padding:24px 12px;background:#0c0e11;color:#eee8df;font-family:Georgia,serif"><table role="presentation" cellpadding="0" cellspacing="0" style="max-width:610px;margin:auto;width:100%;background:#15181c;border:1px solid #54473d"><tr><td style="padding:35px 30px;text-align:center;border-bottom:1px solid #51463b"><div style="letter-spacing:3px;color:#d3b68c;font-size:17px;font-weight:bold">ARQUIVO SOMBRIO</div><div style="font-size:12px;letter-spacing:2px;color:#a9a29b;margin-top:12px">ACERVO INVESTIGATIVO</div></td></tr><tr><td style="padding:36px 30px;font-size:16px;line-height:1.8"><h1 style="font-size:29px;line-height:1.3;color:#f2e7d6;margin:0 0 25px">Seu arquivo acaba de ser aberto.</h1><p>${who}</p><p>Algumas histórias terminam com uma resposta. Outras continuam despertando perguntas décadas depois de seus acontecimentos.</p><p>Agora você faz parte do Arquivo Sombrio, um acervo dedicado a quem acredita que compreender uma história exige olhar além das manchetes, examinar os detalhes e questionar aquilo que parece evidente.</p><p>Aqui, você encontrará investigações criminais, ciência forense, mistérios, lendas e obras literárias que exploram os limites entre o conhecido e o desconhecido.</p><p>Seu cadastro é a entrada para um acervo em constante expansão, construído para leitores que não se contentam apenas com a primeira versão dos fatos.</p><p>Explore os dossiês, conheça as técnicas que ajudam a solucionar crimes e construa sua própria coleção de leituras.</p><p style="color:#d3b68c;font-weight:bold">A investigação começa aqui.</p><div style="text-align:center;padding:20px 0"><a href="https://arquivosombrio.net.br/" style="display:inline-block;padding:13px 24px;background:#92282e;color:white;text-decoration:none;font-family:Arial,sans-serif;font-size:14px;font-weight:bold">EXPLORAR O ARQUIVO SOMBRIO</a></div></td></tr><tr><td style="padding:18px 30px;border-top:1px solid #51463b;color:#b8b2a9;font-size:12px;text-align:center;font-family:Arial,sans-serif">Arquivo Sombrio · E-mail de serviço relativo à criação da sua conta.<br><a href="https://arquivosombrio.net.br/" style="color:#d3b68c">arquivosombrio.net.br</a></td></tr></table></body></html>`;};
Deno.serve(async(req:Request)=>{
 if(req.method!=="POST")return respond({error:"Method not allowed"},405);
 if(Number(req.headers.get("content-length")||0)>1024)return respond({error:"Invalid request"},413);
 const url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")||"{}").default;
 if(!url||!key)return respond({error:"Backend unavailable"},503);
 const db=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
 const candidate=req.headers.get("x-welcome-token")||"";
 if(candidate.length<32||candidate.length>256)return respond({error:"Unauthorized"},401);
 const {data:ok,error:authError}=await db.rpc("verify_welcome_dispatch_token",{p_token:candidate});
 if(authError||ok!==true)return respond({error:"Unauthorized"},401);
 const resend=Deno.env.get("RESEND_API_KEY")||"";
 const from="boasvindas@arquivosombrio.net.br";
 // Distinct from newsletter flags. Do not consume queued messages until verified credentials are configured.
 if(Deno.env.get("WELCOME_EMAIL_ENABLED")!=="true"||!resend)return respond({ok:true,enabled:false,sent:0});
 const {data:jobs,error:claimError}=await db.rpc("claim_welcome_email");
 if(claimError){console.error("Welcome claim error",claimError.message);return respond({error:"Queue unavailable"},503);}
 if(!jobs?.length)return respond({ok:true,enabled:true,sent:0});
 const job=jobs[0],name=firstName(job.full_name||"");
 const text=[name?"Olá, "+name+"!":"Olá, investigador(a)!","Seu arquivo acaba de ser aberto.","Algumas histórias terminam com uma resposta. Outras continuam despertando perguntas décadas depois de seus acontecimentos.","Agora você faz parte do Arquivo Sombrio, um acervo dedicado a quem acredita que compreender uma história exige olhar além das manchetes, examinar os detalhes e questionar aquilo que parece evidente.","Explore dossiês, ciência forense, mistérios, lendas e literatura.","A investigação começa aqui.","https://arquivosombrio.net.br/"].join("\n\n");
 try{
  const r=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+resend,"Content-Type":"application/json","Idempotency-Key":"arquivo-welcome-"+job.user_id},body:JSON.stringify({from:"Arquivo Sombrio <"+from+">",to:[job.email],subject:"Seu arquivo foi aberto. Bem-vindo ao Arquivo Sombrio.",html:html(name),text})});
  const json=await r.json().catch(()=>({}));
  const accepted=r.ok&&typeof json?.id==="string";
  await db.rpc("finalize_welcome_email",{p_user:job.user_id,p_status:accepted?"sent":"uncertain",p_provider_id:accepted?json.id:null,p_error:accepted?null:"Provider did not confirm acceptance"});
  return respond({ok:accepted,sent:accepted?1:0,status:accepted?"accepted":"uncertain"},accepted?200:502);
 }catch(e){
  console.error("Welcome provider request uncertain",String(e));
  await db.rpc("finalize_welcome_email",{p_user:job.user_id,p_status:"uncertain",p_error:"Network or response uncertain"});
  return respond({error:"Provider result uncertain",sent:0},502);
 }
});