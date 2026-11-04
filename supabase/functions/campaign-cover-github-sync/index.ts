import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "npm:@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization,apikey,content-type","Access-Control-Allow-Methods":"POST,OPTIONS"};
const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors,"Content-Type":"application/json","Cache-Control":"no-store"}});
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response(null,{headers:cors});
 if(req.method!=="POST")return reply({error:"Método não permitido"},405);
 try{
 const token=(req.headers.get("Authorization")||"").replace(/^Bearer\s+/i,"");
 const url=Deno.env.get("SUPABASE_URL")||"";
 const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
 const publish=Deno.env.get("SUPABASE_ANON_KEY")||"";
 if(!token||!url||!service||!publish)return reply({error:"Autenticação indisponível"},401);
 const admin=createClient(url,service,{auth:{persistSession:false}});
 const {data:who,error:authError}=await admin.auth.getUser(token);
 if(authError||!who.user)return reply({error:"Sessão expirada"},401);
 const client=createClient(url,publish,{global:{headers:{Authorization:"Bearer "+token}},auth:{persistSession:false}});
 const {data:isAdmin,error:roleError}=await client.rpc("is_arquivo_sombrio_admin");
 if(roleError||isAdmin!==true)return reply({error:"Acesso administrativo necessário"},403);
 const body=await req.json().catch(()=>({}));
 const theme=String(body.theme||"");const storagePath=String(body.storagePath||"");
 if(!/^[a-z0-9-]{2,80}$/.test(theme)||!/^[a-z0-9-]+\/capa-[a-z0-9-]+-[a-z0-9]+\.(webp|png|jpg|jpeg)$/.test(storagePath))return reply({error:"Nome inválido"},400);
 const rows=await admin.from("editorial_campaigns").select("id,payload").limit(100);
 const found=(rows.data||[]).find((r:any)=>r.payload?.theme===theme);
 if(!found||!storagePath.startsWith(found.payload.slug+"/capa-"+theme+"-"))return reply({error:"Capa não corresponde à campanha salva"},400);
 const release=await admin.from("published_campaigns").select("publish_at,payload").eq("id",found.id).maybeSingle();
 if(release.error)return reply({error:"Não foi possível verificar a publicação"},503);
 const releaseAt=Date.parse(String(release.data?.publish_at||""));
 if(!release.data||!Number.isFinite(releaseAt)||releaseAt>Date.now())
   return reply({error:"Campanha ainda não publicada; sincronização bloqueada"},403);
 if(release.data.payload?.theme!==theme)
   return reply({error:"Versão pública não corresponde à campanha"},403);

 const tokenGit=Deno.env.get("ARQUIVO_GITHUB_TOKEN");
 if(!tokenGit)return reply({error:"Credencial ARQUIVO_GITHUB_TOKEN ainda não configurada no Supabase",code:"GITHUB_NOT_CONFIGURED"},503);
 const result=await admin.storage.from("campaign-images").download(storagePath);
 if(result.error||!result.data)return reply({error:"Imagem não encontrada no Storage"},404);
 const bytes=new Uint8Array(await result.data.arrayBuffer());
 if(bytes.length>6291456)return reply({error:"Arquivo acima do limite"},413);
 const ext=storagePath.split(".").pop()==="jpeg"?"jpg":storagePath.split(".").pop();
 const gitPath="assets/especiais/capa-"+theme+"."+ext;
 const endpoint="https://api.github.com/repos/l7-COLLAB/arquivosombrio/contents/"+gitPath;
 const headers={"Authorization":"Bearer "+tokenGit,"Accept":"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28","Content-Type":"application/json"};
 const check=await fetch(endpoint+"?ref=main",{headers});
 let sha:string|undefined;
 if(check.ok){const j=await check.json();sha=j.sha}
 else if(check.status!==404)return reply({error:"Falha ao consultar destino GitHub",githubStatus:check.status},502);
 let binary="";for(const b of bytes)binary+=String.fromCharCode(b);
 const payload={message:"assets(especiais): atualizar capa "+theme,content:btoa(binary),branch:"main",...(sha?{sha}:{})};
 const put=await fetch(endpoint,{method:"PUT",headers,body:JSON.stringify(payload)});
 if(!put.ok){console.error("GitHub cover write failed",put.status);return reply({error:"Falha na gravação no GitHub",githubStatus:put.status},502)}
 const committed=await put.json();
 return reply({ok:true,path:gitPath,commit:committed.commit?.sha||null});
 }catch(e){console.error("Campaign cover GitHub sync failed",e);return reply({error:"Falha ao sincronizar a capa.",code:"SYNC_FAILED"},500)}
});