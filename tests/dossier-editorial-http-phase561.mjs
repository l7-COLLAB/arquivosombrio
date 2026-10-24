import assert from "node:assert/strict";
import {createServer} from "node:http";
import {once} from "node:events";
import {handleEditorialCandidates} from "../supabase/functions/editorial-candidates/handler.mjs";
const candidates=[{id_caso:6,indice:11,original:"Original de teste",proposta:"Candidata de teste",fonte:"https://example.org",secret:"not-for-client"}];
const verify=async(token)=>token==="valid-admin"?{id:"1",app_metadata:{role:"admin"}}:token==="valid-user"?{id:"2",app_metadata:{role:"user"}}:null;
const server=createServer(async(req,res)=>{
 const chunks=[];for await(const chunk of req)chunks.push(chunk);
 const request=new Request("http://localhost"+req.url,{method:req.method,headers:req.headers,body:["GET","HEAD"].includes(req.method)?undefined:Buffer.concat(chunks)});
 const output=await handleEditorialCandidates(request,verify,candidates);
 res.writeHead(output.status,Object.fromEntries(output.headers));res.end(Buffer.from(await output.arrayBuffer()));
});
server.listen(0,"127.0.0.1");await once(server,"listening");
const base="http://127.0.0.1:"+server.address().port;
const allowed="https://arquivosombrio.net.br";
try{
 const check=async(label,options,status)=>{
  const response=await fetch(base+"/editorial-candidates",options);
  assert.equal(response.status,status,label);
  assert.match(response.headers.get("cache-control")||"",/no-store/,label);
  return response;
 };
 const opt=await check("preflight permitido",{method:"OPTIONS",headers:{origin:allowed,"access-control-request-method":"GET"}},204);
 assert.equal(opt.headers.get("access-control-allow-origin"),allowed);
 const denied=await check("preflight outro dominio",{method:"OPTIONS",headers:{origin:"https://unknown.example","access-control-request-method":"GET"}},204);
 assert.equal(denied.headers.get("access-control-allow-origin"),null);
 await check("anonimo",{headers:{origin:allowed}},401);
 await check("token invalido",{headers:{origin:allowed,authorization:"Bearer incorrect"}},401);
 await check("usuario comum",{headers:{origin:allowed,authorization:"Bearer valid-user"}},403);
 await check("metodo indevido",{method:"POST",headers:{origin:allowed,authorization:"Bearer valid-admin"}},405);
 const ok=await check("administrador",{headers:{origin:allowed,authorization:"Bearer valid-admin"}},200);
 assert.equal(ok.headers.get("access-control-allow-origin"),allowed);
 const body=await ok.json();assert.equal(body.read_only,true);assert.equal(body.publication_allowed,false);
 assert.equal(body.items.length,1);assert.equal("secret" in body.items[0],false);
 console.log("Fase 5.61: 7 cenarios HTTP locais validados sem Supabase real.");
}finally{server.close();await once(server,"close");}
