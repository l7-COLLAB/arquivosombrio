import {createClient} from "npm:@supabase/supabase-js@2";

const PRIVATE="campaign-covers-staging";
const PUBLIC="campaign-images";
const PUBLIC_PREFIX="https://iuhotznurbyujzbyhizf.supabase.co/storage/v1/object/public/campaign-images/";
const MAX_BYTES=6291456;
const staged=(value:unknown)=>typeof value==="string"&&value.startsWith("staging:");

function imageSignatureValid(bytes:Uint8Array,path:string):boolean{
 if(path.endsWith(".png"))return bytes.length>=8&&[137,80,78,71,13,10,26,10].every((b,i)=>bytes[i]===b);
 if(path.endsWith(".jpg"))return bytes.length>=4&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 if(path.endsWith(".webp"))return bytes.length>=12&&String.fromCharCode(...bytes.slice(0,4))==="RIFF"&&String.fromCharCode(...bytes.slice(8,12))==="WEBP";
 return false;
}
function filePath(ref:string,slug:string):string|null{
 const path=ref.slice("staging:".length);
 if(!/^[a-z0-9-]+\/[a-z0-9-]+\.(webp|png|jpg)$/.test(path))return null;
 return path.split("/")[0]===slug?path:null;
}
function isConflict(err:any):boolean{
 return Number(err?.statusCode)===409||/already exists|duplicate|resourcealreadyexists/i.test(String(err?.message||err?.error||""));
}
async function sameFile(a:Uint8Array,b:Uint8Array):Promise<boolean>{
 if(a.length!==b.length)return false;
 const [x,y]=await Promise.all([crypto.subtle.digest("SHA-256",a),crypto.subtle.digest("SHA-256",b)]);
 return new Uint8Array(x).every((v,i)=>v===new Uint8Array(y)[i]);
}
async function publishAsset(db:any,ref:string,slug:string):Promise<string|null>{
 const path=filePath(ref,slug);
 if(!path)throw new Error("invalid_private_reference");
 const privateResult=await db.storage.from(PRIVATE).download(path);
 if(privateResult.error||!privateResult.data)throw new Error("missing_private_file");
 const bytes=new Uint8Array(await privateResult.data.arrayBuffer());
 if(bytes.length===0||bytes.length>MAX_BYTES)throw new Error("invalid_image_size");
 if(!imageSignatureValid(bytes,path))throw new Error("invalid_image_signature");
 const mime=path.endsWith(".png")?"image/png":path.endsWith(".webp")?"image/webp":"image/jpeg";
 const uploaded=await db.storage.from(PUBLIC).upload(path,bytes,{contentType:mime,upsert:false,cacheControl:"3600"});
 if(uploaded.error){
   if(!isConflict(uploaded.error))throw new Error("public_upload_failed");
   const existing=await db.storage.from(PUBLIC).download(path);
   if(existing.error||!existing.data)throw new Error("public_existing_unreadable");
   const existingBytes=new Uint8Array(await existing.data.arrayBuffer());
   if(!(await sameFile(bytes,existingBytes)))throw new Error("public_image_collision");
 }
 return PUBLIC_PREFIX+path;
}
async function recordFailure(db:any,id:string,hero:string|null,card:string|null,code:string){
 const result=await db.rpc("campaign_covers_record_failure",{
  p_id:id,p_hero:hero,p_card:card,p_code:code
 });
 if(result.error)console.error("campaign retry log failure",id,result.error.code||"unknown");
}
export async function processCampaign(db:any,row:any):Promise<{state:"promoted"|"skipped"|"failed";code?:string}>{
 const id=String(row.campaign_id||row.id||"");
 const p=row.campaign_payload||row.payload;
 const hero=typeof p?.heroImage==="string"?p.heroImage:null;
 const card=typeof p?.cardImage==="string"?p.cardImage:null;
 const slug=String(p?.slug||"");
 if(!id||!slug||(!staged(hero)&&!staged(card)))return {state:"skipped"};
 try{
  for(const ref of [hero,card]){
    if(staged(ref))await publishAsset(db,ref!,slug);
  }
  const committed=await db.rpc("campaign_covers_finalize",{p_id:id,p_expected_hero:hero,p_expected_card:card});
  if(committed.error)throw new Error("database_finalization_failed");
  if(committed.data!==true)return {state:"skipped"}; // Rescheduled or changed while copying.
  const cleared=await db.rpc("campaign_covers_clear_retry",{p_id:id});
  if(cleared.error)console.error("campaign retry clear failed",id,cleared.error.code||"unknown");
  return {state:"promoted"};
 }catch(e){
  const code=e instanceof Error&&/^[a-z_]{3,50}$/.test(e.message)?e.message:"unexpected_failure";
  await recordFailure(db,id,hero,card,code);
  return {state:"failed",code};
 }
}
