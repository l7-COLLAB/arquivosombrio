const origin="https://arquivosombrio.net.br";
const headers={"Content-Type":"application/json","Access-Control-Allow-Origin":origin,"Access-Control-Allow-Headers":"content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Cache-Control":"no-store"};
const respond=(status:number,data:unknown)=>new Response(JSON.stringify(data),{status,headers});
const hex=(a:ArrayBuffer)=>Array.from(new Uint8Array(a)).map(x=>x.toString(16).padStart(2,"0")).join("");
const sha=async(s:string)=>hex(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)));
const equal=(a:string,b:string)=>{let diff=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)diff|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return diff===0};
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(req.method!=="POST"||req.headers.get("origin")!==origin)return respond(403,{error:"Origem não autorizada"});
 const configuredPassword=Deno.env.get("LITE_ADMIN_PASSWORD");const expected=configuredPassword?await sha(configuredPassword):"";const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),url=Deno.env.get("SUPABASE_URL");
 if(!configuredPassword||configuredPassword.length<16||!key||!url)return respond(503,{error:"Acesso ainda não configurado"});
 if(Number(req.headers.get("content-length")||0)>1200000)return respond(413,{error:"Requisição muito grande"});
 let body:any;try{body=await req.json()}catch{return respond(400,{error:"JSON inválido"})}
 const client=async(path:string,method="GET",payload?:unknown,prefer?:string)=>{const h:Record<string,string>={apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json"};if(prefer)h.Prefer=prefer;const r=await fetch(url+"/rest/v1/"+path,{method,headers:h,body:payload===undefined?undefined:JSON.stringify(payload)});if(!r.ok)throw new Error("Database "+r.status);return r.status===204?[]:await r.json()};
 try{
 if(body.action==="login"){
  const ip=req.headers.get("cf-connecting-ip")||"unknown";
  const ipHash=await sha((Deno.env.get("LITE_ADMIN_IP_PEPPER")||expected)+ip);
  const since=new Date(Date.now()-15*60000).toISOString();
  const attempts=await client("lite_admin_access_attempts?select=id&ip_hash=eq."+ipHash+"&attempted_at=gte."+encodeURIComponent(since)+"&limit=8");
  if(attempts.length>=5)return respond(429,{error:"Muitas tentativas. Aguarde 15 minutos."});
  const password=typeof body.password==="string"?body.password:"";
  if(password.length<12||password.length>256||!equal(await sha(password),expected)){
   await client("lite_admin_access_attempts","POST",{ip_hash:ipHash},"return=minimal");
   return respond(401,{error:"Código incorreto"});
  }
  const token=hex(crypto.getRandomValues(new Uint8Array(32)).buffer);
  await client("lite_admin_sessions","POST",{token_hash:await sha(token),expires_at:new Date(Date.now()+45*60000).toISOString()},"return=minimal");
  return respond(200,{token,expires_in:2700});
 }
 const token=typeof body.token==="string"?body.token:"";
 if(!/^[a-f0-9]{64}$/.test(token))return respond(401,{error:"Sessão necessária"});
 const hash=await sha(token);
 const sessions=await client("lite_admin_sessions?select=token_hash&token_hash=eq."+hash+"&expires_at=gt."+encodeURIComponent(new Date().toISOString())+"&limit=1");
 if(!sessions.length)return respond(401,{error:"Sessão expirada. Digite o código novamente."});
 if(body.action==="logout"){await client("lite_admin_sessions?token_hash=eq."+hash,"DELETE");return respond(200,{ok:true})}
 if(body.action==="list"){const rows=await client("lite_admin_staging?select=id,category,title,updated_at&order=updated_at.desc&limit=100");return respond(200,{items:rows})}
 if(body.action==="get"){if(!/^[0-9a-f-]{36}$/i.test(body.id||""))return respond(400,{error:"ID inválido"});const rows=await client("lite_admin_staging?select=*&id=eq."+body.id+"&limit=1");return respond(200,{item:rows[0]||null})}
 if(body.action==="catalog"){
  const tables:Record<string,string>={dossies:"Casos",garimpo:"casos_diarios",pericia:"pericias",lendas:"lendas",creepypastas:"creepypastas",novels:"novels",capitulos:"novel_capitulos"};
  const table=tables[String(body.category||"")];if(!table)return respond(400,{error:"Categoria inválida"});
  const rows=await client(table+"?select=id,titulo&order=created_at.desc&limit=100");return respond(200,{items:rows});
 }
 if(body.action==="copy"){
  const tables:Record<string,string>={dossies:"Casos",garimpo:"casos_diarios",pericia:"pericias",lendas:"lendas",creepypastas:"creepypastas",novels:"novels",capitulos:"novel_capitulos"};
  const cat=String(body.category||""),table=tables[cat],id=String(body.id||"");
  if(!table||!/^(?:[0-9]+|[a-f0-9-]{36})$/i.test(id))return respond(400,{error:"Referência inválida"});
  const rows=await client(table+"?select=*&id=eq."+id+"&limit=1");if(!rows.length)return respond(404,{error:"Arquivo não encontrado"});
  const o=rows[0],p={titulo:o.titulo||"",subtitulo:o.subtitulo||"",resumo:o.resumo||o.sinopse||"",situacao:o.status_caso||o.status||o.status_obra||"",local:o.local||o.origem||"",data:o.ano||o.data_caso||o.periodo||"",conteudo:o.historia||o.conteudo||o.introducao||"",cronologia:typeof o.cronologia==="string"?o.cronologia:JSON.stringify(o.cronologia||[]),evidencias:JSON.stringify(o.evidencias||[]),teorias:JSON.stringify(o.teorias||o.hipoteses||[]),contexto:o.contexto_historico||o.como_funciona||"",fontes:JSON.stringify(o.fontes||[]),livro:o.novel_id||"",numero:String(o.numero||""),notas:"Cópia de preparação do registro "+id,pendencias:"",_source:{table,id,snapshot:o}};
  const inserted=await client("lite_admin_staging","POST",{category:cat,title:p.titulo||"Sem título",payload:p},"return=representation");return respond(200,{item:inserted[0]});
 }
 if(body.action==="save"){
  const category=String(body.category||""),title=String(body.title||"").trim(),payload=body.payload;
  if(!["dossies","garimpo","pericia","lendas","creepypastas","novels","capitulos"].includes(category)||!title||title.length>250||!payload||typeof payload!=="object"||JSON.stringify(payload).length>900000)return respond(400,{error:"Dados inválidos"});
  if(body.id){
   if(!/^[0-9a-f-]{36}$/i.test(body.id))return respond(400,{error:"ID inválido"});
   const rows=await client("lite_admin_staging?select=id,updated_at&id=eq."+body.id+"&limit=1");
   if(!rows.length)return respond(404,{error:"Rascunho não encontrado"});
   if(rows[0].updated_at!==body.updated_at)return respond(409,{error:"O rascunho foi alterado em outro dispositivo. Recarregue antes de salvar."});
   const updated=await client("lite_admin_staging?id=eq."+body.id+"&updated_at=eq."+encodeURIComponent(body.updated_at),"PATCH",{category,title,payload,updated_at:new Date().toISOString()},"return=representation");
   if(!updated.length)return respond(409,{error:"Conflito de edição"});
   return respond(200,{item:updated[0]});
  }
  const inserted=await client("lite_admin_staging","POST",{category,title,payload},"return=representation");return respond(200,{item:inserted[0]});
 }
 return respond(400,{error:"Ação inválida"});
 }catch(e){console.error("Lite admin internal error",String(e));return respond(500,{error:"Não foi possível concluir a operação"})}
});