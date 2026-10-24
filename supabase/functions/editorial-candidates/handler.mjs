export async function handleEditorialCandidates(request, verifyUser, candidates) {
 const headers={"content-type":"application/json; charset=utf-8","cache-control":"no-store, private","vary":"Authorization"};
 const respond=(status,body)=>new Response(JSON.stringify(body),{status,headers});
 if(request.method!=="GET")return respond(405,{error:"method_not_allowed"});
 const auth=request.headers.get("authorization")||"";
 if(!/^Bearer [^\s]+$/.test(auth))return respond(401,{error:"unauthorized"});
 let user;
 try {user=await verifyUser(auth.slice(7));}catch{return respond(401,{error:"unauthorized"});}
 if(!user?.id)return respond(401,{error:"unauthorized"});
 if(user.app_metadata?.role!=="admin")return respond(403,{error:"forbidden"});
 return respond(200,{items:candidates.map(({id_caso,indice,original,proposta,fonte})=>({id_caso,indice,original,proposta,fonte})),read_only:true,publication_allowed:false});
}
