/* Arquivo Sombrio — acompanhamento voluntário de dossiês e Garimpo.
   Uses existing user_watchlist/RLS, never a service-role key or local-only success.
*/
(function(){
"use strict";
const project="https://iuhotznurbyujzbyhizf.supabase.co";
const key="sb_publishable_bpAZ5EhYLIuVoE4Q97s_-A_XQwwRxUj";
const sdk="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0";
let clientPromise=null;
function safeReference(btn){
 const type=btn.getAttribute("data-watch-type");
 const id=btn.getAttribute("data-watch-id");
 const title=String(btn.getAttribute("data-watch-title")||"").trim();
 if(!["dossie","garimpo"].includes(type)||!/^[1-9][0-9]{0,12}$/.test(id||"")||!title||title.length>220)return null;
 const path=type==="dossie"?"caso":"garimpo";
 return {
   case_id:type+":"+id,
   title:title.slice(0,200),
   subtitle:type==="dossie"?"Dossiê em observação":"Garimpo em observação",
   target_url:"/arquivo/"+path+"-"+id+".html",
   image_url:null
 };
}
function getClient(){
 if(typeof obterClienteSupabase==="function")return obterClienteSupabase();
 if(clientPromise)return clientPromise;
 clientPromise=new Promise((resolve,reject)=>{
   function finish(){
     if(!window.supabase||typeof window.supabase.createClient!=="function")return reject(Error("SDK indisponível"));
     resolve(window.supabase.createClient(project,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}}));
   }
   if(window.supabase?.createClient){finish();return;}
   const script=document.createElement("script");
   script.src=sdk;script.async=true;script.onload=finish;
   script.onerror=()=>reject(Error("Conexão indisponível"));
   document.head.appendChild(script);
 }).catch(error=>{clientPromise=null;throw error;});
 return clientPromise;
}
function feedback(btn,message){
 const parent=btn.parentElement;
 const output=parent?.querySelector(".watch-feedback")||parent?.querySelector("[data-watch-feedback]");
 if(output)output.textContent=message;
}
async function follow(btn){
 const entry=safeReference(btn);
 if(!entry){feedback(btn,"Registro inválido.");return;}
 if(btn.disabled)return;
 btn.disabled=true;
 feedback(btn,"Verificando sua conta…");
 try{
   const client=await getClient();
   const {data,error:authError}=await client.auth.getUser();
   if(authError||!data?.user){
     feedback(btn,"Entre na sua conta para acompanhar este arquivo.");
     btn.textContent="Entrar para acompanhar";
     btn.dataset.watchLogin="true";
     return;
   }
   const {error}=await client.from("user_watchlist").insert({...entry,user_id:data.user.id});
   if(error&&error.code!=="23505")throw error;
   btn.textContent="Acompanhando";
   btn.disabled=true;
   feedback(btn,error?"Este arquivo já está na sua lista de observação.":"Adicionado ao Meu Arquivo. Você pode abrir ou remover o caso por lá.");
 }catch(error){
   console.warn("Acompanhamento não confirmado",error);
   feedback(btn,"Não foi possível confirmar o acompanhamento. Tente novamente.");
 }finally{
   if(btn.textContent!=="Acompanhando")btn.disabled=false;
 }
}
document.addEventListener("click",event=>{
 const btn=event.target.closest?.("[data-watch-type][data-watch-id]");
 if(!btn)return;
 if(btn.dataset.watchLogin==="true"){
   window.location.assign("/meu-arquivo.html#observacao");return;
 }
 follow(btn);
});
})();
