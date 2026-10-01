(function(){
var root=document.documentElement,body=document.body;
function get(k){try{return localStorage.getItem("as-lite-"+k)}catch(e){return null}}
function put(k,v){try{localStorage.setItem("as-lite-"+k,v)}catch(e){}}
var AUTH_URL="https://iuhotznurbyujzbyhizf.supabase.co/auth/v1";
var AUTH_KEY="sb_publishable_bpAZ5EhYLIuVoE4Q97s_-A_XQwwRxUj";
var AUTH_STORAGE="sb-iuhotznurbyujzbyhizf-auth-token";
function authRead(){try{var raw=localStorage.getItem(AUTH_STORAGE);return raw?JSON.parse(raw):null}catch(e){return null}}
function authWrite(v){try{if(v)localStorage.setItem(AUTH_STORAGE,JSON.stringify(v));else localStorage.removeItem(AUTH_STORAGE)}catch(e){}}
function authRequest(method,url,body,token,done){
  try{
    var x=new XMLHttpRequest();x.open(method,url,true);
    x.setRequestHeader("apikey",AUTH_KEY);
    x.setRequestHeader("Content-Type","application/json");
    if(token)x.setRequestHeader("Authorization","Bearer "+token);
    x.onreadystatechange=function(){if(x.readyState!==4)return;var data={};try{data=JSON.parse(x.responseText||"{}")}catch(e){}done(x.status,data)};
    x.send(body?JSON.stringify(body):null);
  }catch(e){done(0,{message:"Não foi possível acessar a conta."})}
}
function authUser(session,done){
  if(!session||!session.access_token){done(null);return}
  authRequest("GET",AUTH_URL+"/user",null,session.access_token,function(status,data){
    if(status>=200&&status<300){session.user=data;authWrite(session);done(data);return}
    if(session.refresh_token){
      authRequest("POST",AUTH_URL+"/token?grant_type=refresh_token",{refresh_token:session.refresh_token},null,function(rs,rd){
        if(rs>=200&&rs<300&&rd.access_token){authWrite(rd);done(rd.user||null)}else{authWrite(null);done(null)}
      });
    }else{authWrite(null);done(null)}
  });
}
function authName(user){
  if(!user)return"";
  var m=user.user_metadata||{};
  return m.display_name||m.name||m.full_name||user.email||"Conta";
}
function initAccount(){
  var links=document.querySelectorAll("[data-lite-account-link]");
  authUser(authRead(),function(user){
    for(var i=0;i<links.length;i++)if(user)links[i].innerHTML="Conta · "+authName(user);
    var current=document.querySelector("[data-lite-account-current]"),form=document.querySelector("[data-lite-login]");
    if(current){
      if(user){
        current.hidden=false;if(form)form.style.display="none";
        var n=current.querySelector("[data-lite-account-name]"),e=current.querySelector("[data-lite-account-email]");
        if(n)n.innerHTML=authName(user);if(e)e.innerHTML=user.email||"";
      }else{current.hidden=true;if(form)form.style.display="block"}
    }
  });
  var form=document.querySelector("[data-lite-login]");
  if(form)form.onsubmit=function(ev){
    if(ev&&ev.preventDefault)ev.preventDefault();
    var email=form.elements.email.value.replace(/^\s+|\s+$/g,""),password=form.elements.password.value;
    var state=form.querySelector("[data-lite-login-state]"),btn=form.querySelector('button[type="submit"]');
    if(state)state.innerHTML="Entrando...";if(btn)btn.disabled=true;
    authRequest("POST",AUTH_URL+"/token?grant_type=password",{email:email,password:password},null,function(status,data){
      if(btn)btn.disabled=false;
      if(status>=200&&status<300&&data.access_token){
        authWrite(data);if(state)state.innerHTML="Conta conectada.";setTimeout(function(){location.reload()},250);
      }else if(state)state.innerHTML=(data&&((data.error_description)||(data.msg)||(data.message)))||"E-mail ou senha inválidos.";
    });
    return false;
  };
  var logout=document.querySelector("[data-lite-logout]");
  if(logout)logout.onclick=function(){
    var s=authRead();authWrite(null);
    if(s&&s.access_token)authRequest("POST",AUTH_URL+"/logout",{},s.access_token,function(){location.reload()});else location.reload();
    return false;
  };
}
function apply(){var theme=get("theme")==="paper"?"paper":"dark",size=get("size")||"normal";body.className=body.className.replace(/\b(paper|large|small)\b/g,"").replace(/\s+/g," ")+" "+(theme==="paper"?"paper ":"")+(size==="large"?"large":size==="small"?"small":"");}
function init(){apply();initAccount();var buttons=document.querySelectorAll("[data-lite-setting]");for(var i=0;i<buttons.length;i++){buttons[i].onclick=function(){var k=this.getAttribute("data-lite-setting");if(k==="theme")put("theme",get("theme")==="paper"?"dark":"paper");if(k==="size"){var s=get("size")||"normal";put("size",s==="normal"?"large":s==="large"?"small":"normal")}apply();return false;};}
var save=document.getElementById("save-reading"),resume=document.getElementById("resume-reading");
if(save){save.onclick=function(){put("last",location.href.split("#")[0]);this.innerHTML="Leitura marcada";return false;};}
if(resume){var last=get("last");if(last&&last.indexOf(location.origin+location.pathname.split("/").slice(0,-1).join("/"))===0){resume.href=last;resume.style.display="inline-block";}}
var audioBox=document.querySelector("[data-lite-audio]");
if(audioBox){
  var audioType=audioBox.getAttribute("data-type"),audioId=audioBox.getAttribute("data-id"),audioState=audioBox.querySelector("[data-lite-audio-state]"),audioPlayer=audioBox.querySelector("[data-lite-audio-player]");
  var audioBase="https://iuhotznurbyujzbyhizf.supabase.co/functions/v1/lite-approved-audio";
  try{
    var xhr=new XMLHttpRequest();
    xhr.open("GET",audioBase+"?check=1&type="+encodeURIComponent(audioType)+"&id="+encodeURIComponent(audioId),true);
    xhr.onreadystatechange=function(){
      if(xhr.readyState!==4)return;
      if(xhr.status>=200&&xhr.status<300){
        audioBox.hidden=false;
        audioPlayer.src=audioBase+"?type="+encodeURIComponent(audioType)+"&id="+encodeURIComponent(audioId);
        audioState.innerHTML="Narração Kokoro aprovada e pronta para reprodução.";
      }
    };
    xhr.send(null);
  }catch(e){}
}
var q=document.getElementById("lite-query"),form=document.getElementById("lite-search"),rows=document.querySelectorAll("[data-search]"),category=document.getElementById("lite-category"),sort=document.getElementById("lite-sort");
function filter(){if(!rows.length)return;var term=q?q.value.toLowerCase():"",cat=category?category.value:"all";for(var i=0;i<rows.length;i++){var row=rows[i],show=(cat==="all"||row.getAttribute("data-category")===cat)&&row.getAttribute("data-search").indexOf(term)!==-1;row.style.display=show?"":"none";}}
if(form)form.onsubmit=function(){filter();return false};if(q)q.onkeyup=filter;if(category)category.onchange=filter;
if(sort)sort.onchange=function(){var list=document.getElementById("search-results");if(!list)return;var arr=[];for(var i=0;i<rows.length;i++)arr.push(rows[i]);arr.sort(function(a,b){var k=sort.value,va=a.getAttribute("data-"+k)||"",vb=b.getAttribute("data-"+k)||"";return k==="date"?(va<vb?1:va>vb?-1:0):(va<vb?-1:va>vb?1:0)});for(var j=0;j<arr.length;j++)list.appendChild(arr[j]);filter();};
}
if(document.addEventListener)document.addEventListener("DOMContentLoaded",init,false);else window.onload=init;
})();