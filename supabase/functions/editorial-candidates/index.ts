import {createClient} from "npm:@supabase/supabase-js@2.57.0";
import {handleEditorialCandidates} from "./handler.mjs";
const url=Deno.env.get("SUPABASE_URL");
const key=Deno.env.get("SUPABASE_ANON_KEY");
const candidates=[
 {id_caso:6,indice:11,original:"10 de dezembro de 1994: Thomas Mosser é morto.",proposta:"10 de dezembro de 1994: Thomas Mosser morre após a explosão de uma bomba em North Caldwell, Nova Jersey, segundo o Departamento de Justiça dos Estados Unidos.",fonte:"https://www.justice.gov/archive/opa/pr/1996/Jun96/283crm.htm"},
 {id_caso:5,indice:5,original:"2012: primeira condenação e duas penas de prisão perpétua.",proposta:"2012: Dana Chandler é condenada por dois homicídios e recebe duas penas consecutivas de prisão perpétua, cada uma com período mínimo obrigatório de 50 anos. As condenações seriam anuladas pela Suprema Corte do Kansas em 2018.",fonte:"https://law.justia.com/cases/kansas/supreme-court/2018/108625.html"}
];
Deno.serve(async(request)=>{
 if(!url||!key)return new Response(JSON.stringify({error:"unavailable"}),{status:503,headers:{"content-type":"application/json","cache-control":"no-store"}});
 const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 return handleEditorialCandidates(request,async(token)=>{
   const {data,error}=await client.auth.getUser(token);
   if(error||!data?.user)return null;
   return data.user;
 },candidates);
});
