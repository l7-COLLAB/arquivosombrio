import { createClient } from 'npm:@supabase/supabase-js@2.116.0';
const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
const cors={'Access-Control-Allow-Origin':'https://arquivosombrio.net.br','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS','Vary':'Origin'};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}});
function normalizePrivateUrl(value:unknown){const url=new URL(String(value).trim());if(url.protocol!=='https:'||url.username||url.password||!/^([a-z0-9][a-z0-9-]*[a-z0-9]|[a-z0-9])\.[a-z0-9-]+\.ts\.net$/i.test(url.hostname)||!['','443','8443'].includes(url.port)||!['','/'].includes(url.pathname)||url.search||url.hash)throw Error('Endereço privado inválido');return url.origin+'/';}
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 if(req.method!=='POST')return json({error:'Método inválido'},405);
 try{
  const bearer=req.headers.get('authorization')?.replace(/^Bearer /,'');if(!bearer)return json({error:'Sessão necessária'},401);
  const {data,error}=await db.auth.getUser(bearer);if(error||data.user?.app_metadata?.role!=='admin')return json({error:'Acesso administrativo necessário'},403);
  const raw=await req.text();if(raw.length>5000)return json({error:'Requisição muito grande'},413);const body=JSON.parse(raw),owner=data.user!.id;
  if(body.action==='mpt_get'){const {data:row,error}=await db.from('studio_mpt_access').select('connections').eq('owner_id',owner).maybeSingle();if(error)throw error;return json({connections:row?.connections||[]});}
  if(body.action==='mpt_save'){
   if(!Array.isArray(body.connections)||body.connections.length>3)return json({error:'Salve no máximo três computadores'},400);
   const connections=body.connections.map((c:any)=>{if(!c||typeof c.name!=='string'||!c.name.trim()||c.name.length>80||typeof c.url!=='string')throw Error('Conexão inválida');return{name:c.name.trim(),url:normalizePrivateUrl(c.url)}});
   const {error}=await db.from('studio_mpt_access').upsert({owner_id:owner,connections,updated_at:new Date().toISOString()},{onConflict:'owner_id'});if(error)throw error;return json({connections});
  }
  return json({error:'Operação desconhecida'},400);
 }catch{return json({error:'Não foi possível salvar ou carregar. Confira o endereço privado e sua sessão.'},400)}
});
