// Executar somente contra Supabase local (127.0.0.1 ou localhost).
// Credenciais sao lidas do ambiente; jamais gravadas no repositorio.
import assert from "node:assert/strict";
const base=process.env.SUPABASE_LOCAL_URL || "http://127.0.0.1:54321";
const endpoint=new URL(base);
assert(["127.0.0.1","localhost","::1"].includes(endpoint.hostname),"Somente loopback e permitido");
assert.equal(endpoint.protocol,"http:","Ambiente local esperado em HTTP");
const key=process.env.SUPABASE_LOCAL_ANON_KEY;
const adminEmail=process.env.LOCAL_ADMIN_EMAIL,adminPass=process.env.LOCAL_ADMIN_PASSWORD;
const userEmail=process.env.LOCAL_USER_EMAIL,userPass=process.env.LOCAL_USER_PASSWORD;
assert(key&&adminEmail&&adminPass&&userEmail&&userPass,"Defina somente credenciais ficticias do ambiente local");
async function login(email,password){
 const response=await fetch(new URL("/auth/v1/token?grant_type=password",base),{method:"POST",headers:{"apikey":key,"content-type":"application/json"},body:JSON.stringify({email,password})});
 assert.equal(response.status,200,"Falha no login local");
 const body=await response.json();assert(body.access_token);return body.access_token;
}
const functionUrl=new URL("/functions/v1/editorial-candidates",base);
async function probe(name,method,token,expected){
 const response=await fetch(functionUrl,{method,headers:{"apikey":key,...token?{"authorization":"Bearer "+token}:{}}});
 const result={name,method,status:response.status,expected,passed:response.status===expected};
 assert(result.passed,`${name}: HTTP ${response.status}, esperado ${expected}`);
 return result;
}
const userToken=await login(userEmail,userPass);
const adminToken=await login(adminEmail,adminPass);
const results=[];
results.push(await probe("anonimo","GET",null,401));
results.push(await probe("token_invalido","GET","invalid-token",401));
results.push(await probe("usuario_comum","GET",userToken,403));
results.push(await probe("administrador","GET",adminToken,200));
results.push(await probe("escrita_bloqueada","POST",adminToken,405));
const options=await fetch(functionUrl,{method:"OPTIONS",headers:{"origin":"https://arquivosombrio.net.br","access-control-request-method":"GET","access-control-request-headers":"authorization,apikey,x-client-info"}});
results.push({name:"preflight",method:"OPTIONS",status:options.status,allowOrigin:options.headers.get("access-control-allow-origin"),passed:options.status===204&&options.headers.get("access-control-allow-origin")==="https://arquivosombrio.net.br"});
console.log(JSON.stringify({mode:"local_supabase",real_gateway_of_local_environment:true,results},null,2));
if(results.some(x=>!x.passed))process.exitCode=1;
