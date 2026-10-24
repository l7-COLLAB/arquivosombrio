const ALLOWED_ORIGINS=new Set(["https://arquivosombrio.net.br","https://www.arquivosombrio.net.br"]);
export async function handleEditorialCandidates(request,verifyUser,candidates){
 const origin=request.headers.get("origin");
 const headers={"content-type":"application/json; charset=utf-8","cache-control":"no-store, private","vary":"Authorization"};
 if(origin&&ALLOWED_ORIGINS.has(origin)){
  headers["access-control-allow-origin"]=origin;
  headers["access-control-allow-methods"]="GET, OPTIONS";
  headers["access-control-allow-headers"]="authorization, apikey, x-client-info, content-type, x-retry-count";
  headers["vary"]="Authorization, Origin";
 }
 const respond=(status,body)=>new Response(JSON.stringify(body),{status,headers});
 if(request.method==="OPTIONS")return new Response(null,{status:204,headers});
 if(request.method!=="GET")return respond(405,{error:"method_not_allowed"});
 const auth=request.headers.get("authorization")||"";
 if(!/^Bearer [^\s]+$/.test(auth))return respond(401,{error:"unauthorized"});
 let user;
 try{user=await verifyUser(auth.slice(7));}catch{return respond(401,{error:"unauthorized"});}
 if(!user?.id)return respond(401,{error:"unauthorized"});
 if(user.app_metadata?.role!=="admin")return respond(403,{error:"forbidden"});
 return respond(200,{items:candidates.map(({id_caso,indice,original,proposta,fonte})=>({id_caso,indice,original,proposta,fonte})),read_only:true,publication_allowed:false});
}
