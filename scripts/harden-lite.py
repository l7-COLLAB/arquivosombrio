"""Apply security fixes after importing the separately generated Lite edition."""
from pathlib import Path
import sys

AUDIO = '''var audioBox=document.querySelector("[data-lite-audio]");
if(audioBox){
  var audioType=audioBox.getAttribute("data-type"),audioId=audioBox.getAttribute("data-id"),audioState=audioBox.querySelector("[data-lite-audio-state]"),audioPlayer=audioBox.querySelector("[data-lite-audio-player]");
  var audioBase="https://iuhotznurbyujzbyhizf.supabase.co/functions/v1/lite-approved-audio";
  authRequest("GET",audioBase+"?check=1&type="+encodeURIComponent(audioType)+"&id="+encodeURIComponent(audioId),null,null,function(status,data){
    if(status<200||status>=300||data.available!==true)return;
    audioBox.hidden=false;
    var enable=document.createElement("button");enable.type="button";enable.textContent="Liberar áudio";
    audioBox.insertBefore(enable,audioPlayer);
    audioState.textContent="Entre na sua conta para ouvir este arquivo.";
    enable.onclick=function(){
      enable.disabled=true;
      authUser(authRead(),function(user){
        var session=authRead();
        if(!user||!session||!session.access_token){
          enable.disabled=false;
          audioState.textContent="Entre na sua conta para ouvir. ";
          var link=document.createElement("a");link.href="../conta.html";link.textContent="Acessar conta";audioState.appendChild(link);return;
        }
        authRequest("GET",audioBase+"?format=json&type="+encodeURIComponent(audioType)+"&id="+encodeURIComponent(audioId),null,session.access_token,function(code,result){
          enable.disabled=false;
          if(code>=200&&code<300&&typeof result.url==="string"&&result.url.indexOf("https://")===0){
            audioPlayer.src=result.url;audioPlayer.load();enable.textContent="Renovar acesso ao áudio";
            audioState.textContent="Áudio liberado. Use os controles para reproduzir.";
          }else audioState.textContent=result.error||"Não foi possível liberar o áudio.";
        });
      });
    };
  });
}
'''

def harden(path):
    path=Path(path)
    text=path.read_text()
    text=text.replace('links[i].innerHTML="Conta · "+authName(user)', 'links[i].textContent="Conta · "+authName(user)')
    text=text.replace('n.innerHTML=authName(user)', 'n.textContent=authName(user)')
    text=text.replace('e.innerHTML=user.email||""', 'e.textContent=user.email||""')
    text=text.replace('state.innerHTML=', 'state.textContent=')
    start=text.find('var audioBox=document.querySelector("[data-lite-audio]");')
    end=text.find('var q=document.getElementById("lite-query")',start)
    if start>=0:
        if end<0:raise ValueError('Unknown Lite audio block; refusing an unsafe partial edit')
        text=text[:start]+AUDIO+text[end:]
    path.write_text(text)

if __name__=='__main__':
    harden(sys.argv[1] if len(sys.argv)>1 else 'lite-preview/lite.js')
