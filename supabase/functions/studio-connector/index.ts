import { createClient } from 'npm:@supabase/supabase-js@2.116.0';
const url=Deno.env.get('SUPABASE_URL')!,key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const cors={'Access-Control-Allow-Origin':'https://arquivosombrio.net.br','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info,x-host-token,x-job-id,x-job-lease','Access-Control-Allow-Methods':'POST,OPTIONS','Vary':'Origin'};
const json=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers:{...cors,'Content-Type':'application/json'}});
const hash=async(s:string)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(b=>b.toString(16).padStart(2,'0')).join('');
const secret=()=>[...crypto.getRandomValues(new Uint8Array(24))].map(b=>b.toString(16).padStart(2,'0')).join('');
function checked<T extends {error?:unknown,data?:unknown}>(r:T){if(r.error)throw Error('Falha na operação do Estúdio');return r.data;}
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 if(req.method!=='POST')return json({error:'Método inválido'},405);
 try{
  const hostToken=req.headers.get('x-host-token');
  let host:any=null;
  if(hostToken){if(!/^[a-f0-9]{48}$/.test(hostToken))return json({error:'Hospedeiro inválido'},401);host=checked(await db.from('studio_hosts').select('id,owner_id').eq('token_hash',await hash(hostToken)).eq('revoked',false).maybeSingle());if(!host)return json({error:'Hospedeiro desconectado ou revogado'},401);}
  if(req.headers.get('content-type')?.startsWith('audio/mpeg')){
   if(!host)return json({error:'Hospedeiro obrigatório'},401);
   const id=req.headers.get('x-job-id'),lease=req.headers.get('x-job-lease');
   const job=checked(await db.from('studio_jobs').select('id,owner_id,lease_until').eq('id',id).eq('host_id',host.id).eq('lease',lease).eq('status','processing').maybeSingle()) as any;
   if(!job||new Date(job.lease_until).getTime()<Date.now())return json({error:'Trabalho expirado'},409);
   const chunks:Uint8Array[]=[];let size=0;const reader=req.body?.getReader();if(!reader)return json({error:'Áudio vazio'},400);
   for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>20*1024*1024){await reader.cancel();return json({error:'Áudio maior que 20 MB'},413)}chunks.push(value)}
   if(size<128)return json({error:'Áudio vazio'},400);const audio=new Uint8Array(size);let offset=0;for(const part of chunks){audio.set(part,offset);offset+=part.length}
   const path=job.owner_id+'/'+job.id+'/'+lease+'.mp3';checked(await db.storage.from('studio-results').upload(path,audio,{contentType:'audio/mpeg',upsert:false}));
   return json({path});
  }
  const raw=await req.text();if(raw.length>150000)return json({error:'Requisição muito grande'},413);const body=JSON.parse(raw),action=body.action;
  if(action==='pair'){
   if(typeof body.code!=='string'||!/^[a-f0-9]{48}$/.test(body.code))return json({error:'Código inválido ou expirado'},400);
   const token=secret();const {data,error}=await db.rpc('studio_pair_host',{p_code_hash:await hash(body.code),p_token_hash:await hash(token)});
   if(error)return json({error:'Código expirado, já utilizado ou limite de três hospedeiros atingido'},400);
   return json({host:data,token});
  }
  if(host){
   if(action==='poll'){const job=checked(await db.rpc('studio_claim_job',{p_host:host.id}));return json({job})}
   if(action==='heartbeat'){
    checked(await db.from('studio_hosts').update({last_seen:new Date().toISOString()}).eq('id',host.id));
    if(body.job&&body.lease)checked(await db.from('studio_jobs').update({lease_until:new Date(Date.now()+120000).toISOString()}).eq('id',body.job).eq('lease',body.lease).eq('host_id',host.id).eq('status','processing'));
    return json({ok:true});
   }
   if(action==='finish'||action==='fail'){
    const path=host.owner_id+'/'+body.job+'/'+body.lease+'.mp3';
    if(action==='finish'&&(typeof body.srt!=='string'||body.srt.length>100000))return json({error:'Legenda inválida'},400);
    const result=await db.from('studio_jobs').update(action==='finish'?{status:'completed',result_path:path,subtitle_text:body.srt,finished_at:new Date().toISOString()}:{status:'failed',error:'A geração falhou no hospedeiro. Verifique a janela do auxiliar.',finished_at:new Date().toISOString()}).eq('id',body.job).eq('host_id',host.id).eq('lease',body.lease).eq('status','processing').gt('lease_until',new Date().toISOString()).select('id');
    checked(result);if(!result.data?.length)return json({error:'Trabalho expirado'},409);return json({ok:true});
   }
   return json({error:'Operação não permitida'},403);
  }
  const bearer=req.headers.get('authorization')?.replace(/^Bearer /,'');if(!bearer)return json({error:'Sessão necessária'},401);
  const {data:auth,error:authError}=await db.auth.getUser(bearer);
  if(authError||!auth.user||auth.user.app_metadata?.role!=='admin')return json({error:'Acesso administrativo necessário'},403);
  const owner=auth.user.id;
  if(action==='list'){
   const hosts=checked(await db.from('studio_hosts').select('id,name,last_seen,created_at').eq('owner_id',owner).eq('revoked',false).order('created_at'));
   const jobs=checked(await db.from('studio_jobs').select('id,host_id,status,error,created_at').eq('owner_id',owner).order('created_at',{ascending:false}).limit(15));return json({hosts,jobs});
  }
  if(action==='create_code'){
   const name=String(body.name||'PC principal').trim().slice(0,80);if(!name)return json({error:'Informe um nome'},400);
   const hosts=checked(await db.from('studio_hosts').select('id').eq('owner_id',owner).eq('revoked',false)) as any[];if(hosts.length>=3)return json({error:'Limite de três hospedeiros atingido'},400);
   await db.from('studio_pair_codes').delete().eq('owner_id',owner);
   const code=secret(),expires=new Date(Date.now()+10*60000).toISOString();checked(await db.from('studio_pair_codes').insert({code_hash:await hash(code),owner_id:owner,name,expires_at:expires}));return json({code,expires});
  }
  if(action==='revoke'){
   checked(await db.from('studio_hosts').update({revoked:true}).eq('id',body.host).eq('owner_id',owner));
   checked(await db.from('studio_jobs').update({status:'failed',error:'Hospedeiro desconectado pela administração'}).eq('owner_id',owner).eq('host_id',body.host).in('status',['queued','processing']));return json({ok:true});
  }
  if(action==='enqueue'){
   const text=String(body.text||'').trim(),style=String(body.style||'dossie');if(!text||text.length>15000||!['dossie','pericia','lenda','dramatica','jornalistica','normal'].includes(style))return json({error:'Roteiro ou estilo inválido (até 15 mil caracteres)'},400);
   const {data,error}=await db.rpc('studio_enqueue_tts',{p_owner:owner,p_host:body.host,p_payload:{text,style,voice:'pt-BR-AntonioNeural'}});if(error)return json({error:'Hospedeiro indisponível ou fila cheia (máximo de três trabalhos)'},400);return json({id:data});
  }
  if(action==='result'){
   const job=checked(await db.from('studio_jobs').select('result_path,subtitle_text').eq('id',body.job).eq('owner_id',owner).eq('status','completed').maybeSingle()) as any;if(!job?.result_path)return json({error:'Resultado ainda indisponível'},404);
   const signed=checked(await db.storage.from('studio-results').createSignedUrl(job.result_path,300)) as any;return json({url:signed.signedUrl,srt:job.subtitle_text||''});
  }
  return json({error:'Operação desconhecida'},400);
 }catch(_e){return json({error:'Não foi possível concluir a operação do Estúdio'},400)}
});
