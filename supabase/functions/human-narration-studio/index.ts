import {createClient} from "npm:@supabase/supabase-js@2.116.0";
import {AwsClient} from "npm:aws4fetch@1.0.20";

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info,x-supabase-api-version,accept","Access-Control-Allow-Methods":"POST,OPTIONS"};
const json=(body:any,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json","Cache-Control":"no-store"}});
const tables:Record<string,string>={dossie:"Casos",garimpo:"casos_diarios",pericia:"pericias",lenda:"lendas",creepypasta:"creepypastas"};
const uuid=/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i;
const clip=(value:any,max:number)=>String(value??"").trim().slice(0,max);
const mp3=(bytes:Uint8Array)=>bytes.length>=3&&((bytes[0]===73&&bytes[1]===68&&bytes[2]===51)||bytes.some((b,i)=>i<8&&b===255&&i+1<bytes.length&&(bytes[i+1]&224)===224));
const wav=(bytes:Uint8Array)=>bytes.length>=36
  &&String.fromCharCode(...bytes.subarray(0,4))==="RIFF"
  &&String.fromCharCode(...bytes.subarray(8,12))==="WAVE"
  &&String.fromCharCode(...bytes.subarray(12,16))==="fmt "
  &&bytes[20]===1&&bytes[21]===0
  &&bytes[22]>=1&&bytes[22]<=2&&bytes[23]===0
  &&bytes[34]===16&&bytes[35]===0;
const validAudio=(bytes:Uint8Array,mime:string)=>mime==="audio/wav"?wav(bytes):mime==="audio/mpeg"&&mp3(bytes);

async function signed(aws:AwsClient,url:string,method="GET",ttl=600,headers?:HeadersInit){
  const target=new URL(url); target.searchParams.set("X-Amz-Expires",String(ttl));
  return await aws.sign(new Request(target,{method,headers}),{aws:{signQuery:true,allHeaders:false}});
}
Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response(null,{headers:cors});
  if(req.method!=="POST")return json({error:"Método não permitido"},405);
  try{
    const auth=req.headers.get("Authorization")||"";
    if(!auth.startsWith("Bearer "))return json({error:"Sessão necessária"},401);
    const url=Deno.env.get("SUPABASE_URL")!,anon=Deno.env.get("SUPABASE_ANON_KEY")!;
    const caller=createClient(url,anon,{global:{headers:{Authorization:auth}}});
    const {data:{user},error:userError}=await caller.auth.getUser();
    if(userError||!user)return json({error:"Sessão inválida"},401);
    const {data:adminOk,error:adminError}=await caller.rpc("is_arquivo_sombrio_admin");
    if(adminError||adminOk!==true)return json({error:"Apenas administradores"},403);
    const db=createClient(url,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const body=await req.json().catch(()=>({}));
    const action=clip(body.action,30);
    const projectId=clip(body.project_id,50);
    if(!uuid.test(projectId))return json({error:"Projeto inválido"},400);

    const {data:project,error:projectError}=await db.from("narration_projects")
      .select("id,content_type,content_id").eq("id",projectId).maybeSingle();
    if(projectError||!project||!tables[project.content_type])return json({error:"Projeto não encontrado"},404);
    const contentType=String(project.content_type),contentId=Number(project.content_id);
    const {data:article,error:articleError}=await db.from(tables[contentType])
      .select("id,updated_at").eq("id",contentId).maybeSingle();
    if(articleError||!article)return json({error:"Arquivo original não encontrado"},404);

    const sets=db.from("human_narration_sets"),parts=db.from("human_narration_parts"),uploads=db.from("human_narration_uploads");
    let {data:set,error:setError}=await sets.select("*").eq("narration_project_id",projectId).maybeSingle();
    if(setError)throw setError;
    if(!set){
      if(action!=="state")return json({error:"Abra o estúdio primeiro"},409);
      const ins=await sets.insert({narration_project_id:projectId,content_type:contentType,content_id:contentId,created_by:user.id})
        .select("*").single();
      if(ins.error){
        const other=await sets.select("*").eq("narration_project_id",projectId).maybeSingle();
        if(other.error||!other.data)throw ins.error;
        set=other.data;
      }else set=ins.data;
    }
    const now=new Date().toISOString();
    const load=async()=>{
      const [entries,active]=await Promise.all([
        parts.select("id,sort_order,title,script_notes,audio_path,audio_mime,audio_rights_note,audio_size,duration_seconds,status,updated_at")
          .eq("set_id",set.id).order("sort_order",{ascending:true}),
        set.active_release_id?db.from("human_narration_releases").select("id,created_at,source_updated_at,duration_seconds,parts_manifest")
          .eq("id",set.active_release_id).eq("set_id",set.id).maybeSingle():Promise.resolve({data:null,error:null})
      ]);
      if(entries.error||active.error)throw entries.error||active.error;
      return {set_id:set.id,expected_parts:set.expected_parts,parts:entries.data||[],
        published:active.data?{id:active.data.id,created_at:active.data.created_at,total_seconds:active.data.duration_seconds,
          parts_count:Array.isArray(active.data.parts_manifest)?active.data.parts_manifest.length:0,
          stale:String(active.data.source_updated_at||"")!==String(article.updated_at||"")}:null};
    };
    if(action==="state")return json(await load());
    if(action==="set_count"){
      const count=Number(body.expected_parts);
      if(!Number.isInteger(count)||count<1||count>60)return json({error:"Quantidade permitida: 1 a 60 partes"},400);
      const change=await sets.update({expected_parts:count,updated_at:now}).eq("id",set.id);
      if(change.error)throw change.error;set.expected_parts=count;
      return json(await load());
    }
    if(action==="add"){
      const {data:current,error}=await parts.select("sort_order").eq("set_id",set.id).order("sort_order",{ascending:false}).limit(1);
      if(error)throw error;
      const currentCount=await parts.select("id",{count:"exact",head:true}).eq("set_id",set.id);
      if(currentCount.error)throw currentCount.error;
      if((currentCount.count||0)>=60)return json({error:"Máximo de 60 partes"},409);
      const pos=Number(current?.[0]?.sort_order||0)+1;
      const entry=await parts.insert({set_id:set.id,sort_order:pos,title:clip(body.title,180)||"Parte "+pos,
        script_notes:clip(body.script_notes,30000)}).select("id").single();
      if(entry.error)throw entry.error;
      return json(await load());
    }

    if(action==="unpublish"){
      const stop=await sets.update({active_release_id:null,updated_at:now}).eq("id",set.id);
      if(stop.error)throw stop.error;
      set.active_release_id=null;
      return json(await load());
    }
    if(action==="publish"){
      const {data:entries,error}=await parts.select("*").eq("set_id",set.id).order("sort_order",{ascending:true});
      if(error)throw error;
      if(!entries?.length||entries.length!==Number(set.expected_parts))
        return json({error:"Cadastre exatamente "+set.expected_parts+" partes antes de publicar."},409);
      if(entries.some((p:any)=>p.status!=="ready"||!p.audio_path||!(Number(p.duration_seconds)>0)))
        return json({error:"Todas as partes precisam ter MP3 enviado, ouvido e aprovado."},409);
      if(new Set(entries.map((p:any)=>p.sort_order)).size!==entries.length)
        return json({error:"Reordene as partes para resolver posições duplicadas."},409);
      const endpoint=Deno.env.get("R2_ENDPOINT"),key=Deno.env.get("R2_ACCESS_KEY_ID"),
        secret=Deno.env.get("R2_SECRET_ACCESS_KEY"),bucket=Deno.env.get("R2_BUCKET");
      if(!endpoint||!key||!secret||!bucket)return json({error:"Armazenamento privado indisponível"},503);
      const aws=new AwsClient({accessKeyId:key,secretAccessKey:secret,region:"auto",service:"s3"});
      const objectUrl=(path:string)=>endpoint.replace(/\/$/,"")+"/"+encodeURIComponent(bucket)+"/"+path.split("/").map(encodeURIComponent).join("/");
      for(const p of entries){
        const head=await aws.fetch(objectUrl(p.audio_path),{method:"HEAD"});
        if(!head.ok)return json({error:"MP3 não localizado: "+p.title},409);
      }
      const manifest=entries.map((p:any,i:number)=>({index:i,title:p.title||"Parte "+(i+1),
        path:p.audio_path,duration_seconds:Number(p.duration_seconds)}));
      const total=manifest.reduce((n:number,p:any)=>n+p.duration_seconds,0);
      const release=await db.from("human_narration_releases").insert({
        set_id:set.id,parts_manifest:manifest,source_updated_at:article.updated_at,
        duration_seconds:total,approved_by:user.id
      }).select("id").single();
      if(release.error)throw release.error;
      const published=await sets.update({active_release_id:release.data.id,updated_at:now}).eq("id",set.id);
      if(published.error)throw published.error;
      set.active_release_id=release.data.id;
      return json(await load());
    }

    const partId=clip(body.part_id,50);
    if(!uuid.test(partId))return json({error:"Selecione uma parte"},400);
    const {data:part,error:partError}=await parts.select("*").eq("id",partId).eq("set_id",set.id).maybeSingle();
    if(partError||!part)return json({error:"Parte não encontrada"},404);

    if(action==="edit"){
      const title=clip(body.title,180)||"Parte "+part.sort_order;
      const notes=clip(body.script_notes,30000);
      const changed=notes!==String(part.script_notes||"");
      const saved=await parts.update({title,script_notes:notes,status:changed?"pending":part.status,updated_at:now})
        .eq("id",partId).eq("set_id",set.id);
      if(saved.error)throw saved.error;
      return json(await load());
    }
    if(action==="move"){
      const {data:ordered,error}=await parts.select("id,sort_order").eq("set_id",set.id).order("sort_order",{ascending:true});
      if(error)throw error;
      const index=(ordered||[]).findIndex(p=>p.id===partId),dir=body.direction==="up"?-1:body.direction==="down"?1:0;
      if(!dir||index<0||index+dir<0||index+dir>=ordered.length)return json(await load());
      const neighbor=ordered[index+dir];
      // Sem restrição UNIQUE em sort_order: a troca de posições é recuperável.
      const a=await parts.update({sort_order:neighbor.sort_order,updated_at:now}).eq("id",partId).eq("set_id",set.id);
      if(a.error)throw a.error;
      const b=await parts.update({sort_order:part.sort_order,updated_at:now}).eq("id",neighbor.id).eq("set_id",set.id);
      if(b.error)throw b.error;
      return json(await load());
    }
    if(action==="remove"){
      const deleted=await parts.delete().eq("id",partId).eq("set_id",set.id);
      if(deleted.error)throw deleted.error;
      // Arquivos de versões já publicadas não são removidos; limpeza deverá conferir referências.
      return json(await load());
    }

    const endpoint=Deno.env.get("R2_ENDPOINT"),key=Deno.env.get("R2_ACCESS_KEY_ID"),
      secret=Deno.env.get("R2_SECRET_ACCESS_KEY"),bucket=Deno.env.get("R2_BUCKET");
    if(!endpoint||!key||!secret||!bucket)return json({error:"Armazenamento privado indisponível"},503);
    const aws=new AwsClient({accessKeyId:key,secretAccessKey:secret,region:"auto",service:"s3"});
    const objectUrl=(path:string)=>endpoint.replace(/\/$/,"")+"/"+encodeURIComponent(bucket)+"/"+path.split("/").map(encodeURIComponent).join("/");

    if(action==="init_upload"){
      const size=Number(body.size),seconds=Number(body.duration_seconds),mime=String(body.mime||"audio/mpeg");
      if(!["audio/mpeg","audio/wav"].includes(mime))return json({error:"Formato permitido: MP3 ou WAV PCM"},415);
      if(!Number.isSafeInteger(size)||size<1024||size>31457280)return json({error:"Áudio precisa ter de 1 KB a 30 MB"},400);
      if(!Number.isFinite(seconds)||seconds<=0||seconds>86400)return json({error:"Duração do áudio inválida"},400);
      const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(user.id));
      const subject=Array.from(new Uint8Array(digest)).map(v=>v.toString(16).padStart(2,"0")).join("");
      const limit=await db.rpc("security_consume_rate_limit",{p_scope:"human_audio_upload",p_subject_hash:subject,p_max:40,p_window_seconds:86400,p_block_seconds:900});
      if(limit.error)return json({error:"Limite de segurança indisponível"},503);
      if(limit.data!==true)return json({error:"Limite de envio atingido"},429);
      const uploadId=crypto.randomUUID();
      const path="human-parts/"+contentType+"/"+contentId+"/"+partId+"/"+uploadId+(mime==="audio/wav"?".wav":".mp3");
      const inserted=await uploads.insert({id:uploadId,part_id:partId,audio_path:path,audio_mime:mime,audio_rights_note:clip(body.rights_note,1000),file_size:size,duration_seconds:seconds,created_by:user.id});
      if(inserted.error)throw inserted.error;
      const signedUrl=await signed(aws,objectUrl(path),"PUT",900,{"Content-Type":mime});
      return json({upload_id:uploadId,upload_url:signedUrl.url,expires_in:900});
    }
    if(action==="preview"){
      if(!part.audio_path)return json({error:"Essa parte ainda não tem áudio"},409);
      const link=await signed(aws,objectUrl(part.audio_path));
      return json({url:link.url,expires_in:600});
    }
    if(action==="approve_part"){
      if(!part.audio_path||!part.duration_seconds)return json({error:"Envie um áudio válido primeiro"},409);
      const changed=await parts.update({status:"ready",updated_at:now}).eq("id",partId).eq("set_id",set.id);
      if(changed.error)throw changed.error;
      return json(await load());
    }

    const uploadId=clip(body.upload_id,50);
    if(!uuid.test(uploadId))return json({error:"Envio inválido"},400);
    const {data:upload,error:uploadError}=await uploads.select("*").eq("id",uploadId).eq("part_id",partId).maybeSingle();
    if(uploadError||!upload)return json({error:"Envio não encontrado"},404);
    if(upload.state!=="uploading")return json({error:"Envio já finalizado"},409);
    if(action==="proxy_upload"){
      if(upload.file_size>10*1024*1024)return json({error:"Envio alternativo limitado a 10 MB"},413);
      const encoded=String(body.base64||"");
      if(encoded.length>14000000)return json({error:"Arquivo grande demais"},413);
      let bytes:Uint8Array;
      try{bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));}
      catch(_){return json({error:"Arquivo inválido"},400)}
      if(bytes.length!==Number(upload.file_size)||!validAudio(bytes,upload.audio_mime))return json({error:"Áudio ou tamanho inválido"},422);
      const put=await aws.fetch(objectUrl(upload.audio_path),{method:"PUT",headers:{"Content-Type":upload.audio_mime},body:new Blob([bytes.buffer as ArrayBuffer],{type:upload.audio_mime})});
      if(!put.ok)return json({error:"Falha ao enviar arquivo ao armazenamento"},502);
      return json({uploaded:true});
    }
    if(action==="finish_upload"){
      const head=await aws.fetch(objectUrl(upload.audio_path),{method:"HEAD"});
      if(!head.ok)return json({error:"Áudio não recebido"},409);
      if(Number(head.headers.get("content-length"))!==Number(upload.file_size))return json({error:"Tamanho divergente"},422);
      const sample=await aws.fetch(objectUrl(upload.audio_path),{method:"GET",headers:{"Range":"bytes=0-31"}});
      if(!sample.ok||!validAudio(new Uint8Array(await sample.arrayBuffer()),upload.audio_mime))
        return json({error:"Arquivo não reconhecido como MP3 ou WAV PCM válido"},422);
      const updatePart=await parts.update({audio_path:upload.audio_path,audio_mime:upload.audio_mime,audio_rights_note:upload.audio_rights_note,audio_size:upload.file_size,
        duration_seconds:upload.duration_seconds,status:"pending",updated_at:now}).eq("id",partId).eq("set_id",set.id);
      if(updatePart.error)throw updatePart.error;
      const updateUpload=await uploads.update({state:"finished"}).eq("id",uploadId).eq("state","uploading");
      if(updateUpload.error)throw updateUpload.error;
      return json(await load());
    }
    return json({error:"Ação não reconhecida"},400);
  }catch(error){
    console.error("human-narration-studio",error);
    return json({error:"Não foi possível concluir a operação de narração."},500);
  }
});
