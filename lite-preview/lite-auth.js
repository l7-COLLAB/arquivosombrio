/* Arquivo Sombrio Lite auth. ES5, no heavy SDK, Turnstile required. */
(function(w,d){
'use strict';
var BASE='https://iuhotznurbyujzbyhizf.supabase.co';
var KEY='sb_publishable_bpAZ5EhYLIuVoE4Q97s_-A_XQwwRxUj';
var SITE='0x4AAAAAAEnNLBi2BDt_aJkF';
var STORE='sb-iuhotznurbyujzbyhizf-auth-token';
var widget=null,challengeToken='',challengeReady=false,loading=false;
function byId(id){return d.getElementById(id)}
function msg(t){var el=byId('auth-status');if(el)el.textContent=t}
function read(){try{return JSON.parse(w.localStorage.getItem(STORE)||'null')}catch(e){return null}}
function save(data){if(!data||!data.access_token||!data.refresh_token)return false;data.expires_at=Math.floor(new Date().getTime()/1000)+Number(data.expires_in||3600);try{w.localStorage.setItem(STORE,JSON.stringify(data));return true}catch(e){msg('Ative o armazenamento local do navegador para manter a sessão.');return false}}
function clear(){try{w.localStorage.removeItem(STORE)}catch(e){}}
function request(method,path,body,callback,authorization){
 var xhr=new XMLHttpRequest();xhr.open(method,BASE+path,true);xhr.setRequestHeader('apikey',KEY);
 xhr.setRequestHeader('Content-Type','application/json');
 if(authorization)xhr.setRequestHeader('Authorization','Bearer '+authorization);
 xhr.onreadystatechange=function(){if(xhr.readyState!==4)return;var value={};try{value=JSON.parse(xhr.responseText)}catch(e){}
 callback(xhr.status,value)};
 xhr.onerror=function(){callback(0,{})};xhr.send(body?JSON.stringify(body):null);
}
function access(cb){
 var session=read();if(!session||!session.access_token){cb(null);return}
 var now=Math.floor(new Date().getTime()/1000);
 if(session.expires_at&&session.expires_at>now+90){cb(session.access_token);return}
 if(!session.refresh_token){clear();cb(null);return}
 request('POST','/auth/v1/token?grant_type=refresh_token',{refresh_token:session.refresh_token},function(status,result){
  if(status===200&&save(result)){cb(result.access_token)}else{clear();cb(null)}
 });
}
function resetChallenge(){challengeToken='';if(widget!==null&&w.turnstile){try{w.turnstile.reset(widget)}catch(e){}}}
function captchaLoaded(){
 if(!byId('lite-turnstile'))return;
 try{
  widget=w.turnstile.render('#lite-turnstile',{sitekey:SITE,callback:function(token){challengeToken=token;challengeReady=true;msg('Verificação concluída.');},
   'expired-callback':function(){challengeToken='';msg('A verificação expirou. Faça-a novamente.');},
   'error-callback':function(){challengeToken='';msg('Não foi possível concluir a verificação neste navegador.')}}
  );
  challengeReady=true;
 }catch(e){msg('A verificação de segurança não é compatível com este navegador. Use um dispositivo atualizado para entrar.')}
}
function loadCaptcha(){
 if(!byId('lite-turnstile'))return;
 var s=d.createElement('script');s.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';s.async=true;
 s.onload=function(){if(w.turnstile)captchaLoaded();else msg('A verificação de segurança não carregou.')};
 s.onerror=function(){msg('O CAPTCHA não abriu neste navegador. Você pode confirmar um código recebido por e-mail abaixo, sem carregar o desafio no iPad.')};
 d.getElementsByTagName('head')[0].appendChild(s);
 w.setTimeout(function(){if(!challengeToken&&!w.turnstile)msg('Este navegador pode não carregar o CAPTCHA. Para entrar com código, solicite-o em um aparelho moderno e confirme abaixo no iPad.')},9000);
}
function pending(){var value='';try{value=w.sessionStorage.getItem('as-lite-return')||''}catch(e){}try{var match=/(?:^|[?&])return=([^&]+)/.exec(w.location.search);if(match)value=decodeURIComponent(match[1])}catch(e){}return /^arquivos\/[a-z0-9-]+\.html$/i.test(value)?value:'index.html'}
function done(){if(byId('auth-forms'))byId('auth-forms').style.display='none';if(byId('auth-account'))byId('auth-account').style.display='block';msg('Conta conectada. Você já pode ouvir os áudios disponíveis.');var a=byId('auth-back');if(a)a.href=pending()}
function setBusy(on){loading=on;var btns=d.querySelectorAll('#auth-forms button');for(var i=0;i<btns.length;i++)btns[i].disabled=on}
function submit(mode,ev){
 if(ev&&ev.preventDefault)ev.preventDefault();if(loading)return false;
 if(!challengeReady||!challengeToken){msg('Conclua a verificação de segurança para continuar.');return false}
 var email=byId(mode+'-email').value.replace(/^\s+|\s+$/g,'');
 var pass=byId(mode+'-password').value;if(!email||!pass){msg('Informe e-mail e senha.');return false}
 var data={email:email,password:pass,gotrue_meta_security:{captcha_token:challengeToken}};
 var path='/auth/v1/token?grant_type=password';
 if(mode==='signup'){
  if(!byId('signup-age').checked||!byId('signup-legal').checked){msg('Confirme a idade e aceite os documentos legais.');return false}
  var name=byId('signup-name').value.replace(/^\s+|\s+$/g,'');if(!name){msg('Informe seu nome ou codinome.');return false}
  data.data={display_name:name,age_18_confirmed:true,legal_acceptance:true,terms_version:'1.1',privacy_version:'1.2',guidelines_version:'1.0',legal_accepted_at:new Date().toISOString()};
  path='/auth/v1/signup?redirect_to='+encodeURIComponent('https://arquivosombrio.net.br/lite-preview/conta.html');
 }
 setBusy(true);msg(mode==='signup'?'Criando sua conta...':'Verificando sua conta...');
 request('POST',path,data,function(status,result){
  setBusy(false);resetChallenge();byId(mode+'-password').value='';
  if(status>=200&&status<300){
   if(result.access_token&&save(result)){done();return}
   if(mode==='signup'){msg('Solicitação recebida. Confira seu e-mail para confirmar sua conta. O redirecionamento pelo link de confirmação ainda requer validação neste iPad.');return}
   msg('O login não retornou uma sessão. Confira sua conta.');return;
  }
  if(status===0){msg('Sem conexão com o serviço de login. Verifique a rede e tente novamente.');return}
  if(result.code==='captcha_failed'||/captcha/i.test(String(result.msg||result.message||''))){msg('A verificação de segurança falhou. Tente novamente.');return}
  if(status===429){msg('Muitas tentativas. Aguarde antes de tentar novamente.');return}
  msg('Não foi possível '+(mode==='signup'?'criar a conta':'entrar')+'. Confira os dados e tente novamente.');
 });return false;
}
function show(mode){byId('login-form').style.display=mode==='login'?'block':'none';byId('signup-form').style.display=mode==='signup'?'block':'none';msg('Complete a verificação para entrar com senha. Se o CAPTCHA não carregar neste iPad, utilize a opção de código por e-mail.')}
function initOtp(){
 var sendForm=byId('otp-request-form'),verifyForm=byId('otp-verify-form');
 if(!sendForm||!verifyForm)return;
 sendForm.onsubmit=function(e){
  if(e&&e.preventDefault)e.preventDefault();
  if(!challengeToken){msg('Para solicitar um código, abra esta página em um aparelho atualizado e conclua o CAPTCHA. No iPad antigo, use apenas o campo de confirmação do código.');return false}
  var email=byId('otp-request-email').value.replace(/^\\s+|\\s+$/g,'');
  msg('Solicitando código...');var captcha=challengeToken;resetChallenge();
  request('POST','/auth/v1/otp',{email:email,create_user:false,gotrue_meta_security:{captcha_token:captcha}},function(status,result){
   if(status>=200&&status<300)msg('Pedido enviado. Confira seu e-mail. Se receber apenas um link em vez de seis dígitos, o modelo de e-mail OTP do Supabase ainda precisa ser configurado.');
   else if(status===429)msg('Aguarde antes de solicitar outro código.');
   else msg('Não foi possível solicitar o código. Confira a verificação de segurança.');
  });return false
 };
 verifyForm.onsubmit=function(e){
  if(e&&e.preventDefault)e.preventDefault();
  var email=byId('otp-email').value.replace(/^\\s+|\\s+$/g,'');
  var code=byId('otp-code').value.replace(/\\s+/g,'');
  if(!/^[0-9]{6}$/.test(code)){msg('Informe os seis dígitos recebidos no e-mail.');return false}
  msg('Verificando seu código...');
  request('POST','/auth/v1/verify',{type:'email',email:email,token:code},function(status,result){
   byId('otp-code').value='';
   if(status>=200&&status<300&&result.access_token&&save(result)){done();return}
   if(status===429){msg('Muitas tentativas. Aguarde antes de tentar novamente.');return}
   msg('O código não pôde ser confirmado. Confira se está correto e dentro da validade.');
  });return false
 };
}
function init(){
 if(!byId('auth-forms'))return;
 initOtp();
 /* Supabase confirmation links can return an implicit session in the fragment. */
 if(w.location.hash&&w.location.hash.indexOf('access_token=')>=0){
  var parts=w.location.hash.replace(/^#/,'').split('&'),result={};
  for(var k=0;k<parts.length;k++){var pair=parts[k].split('=');try{result[decodeURIComponent(pair[0])]=decodeURIComponent((pair[1]||'').replace(/\\+/g,' '))}catch(e){}}
  if(result.access_token&&result.refresh_token){if(save(result)){try{w.history.replaceState(null,d.title,w.location.pathname)}catch(e){w.location.hash=''}}}
 }

 byId('login-form').onsubmit=function(e){return submit('login',e)};
 byId('signup-form').onsubmit=function(e){return submit('signup',e)};
 byId('auth-show-login').onclick=function(){show('login')};
 byId('auth-show-signup').onclick=function(){show('signup')};
 byId('auth-signout').onclick=function(){
  access(function(t){if(t)request('POST','/auth/v1/logout',{},function(){},t)});
  clear();byId('auth-forms').style.display='block';byId('auth-account').style.display='none';resetChallenge();show('login');if(widget===null)loadCaptcha();
 };
 access(function(t){if(t)done();else{show('login');loadCaptcha()}});
}
w.ArquivoLiteAuth={access:access,read:read,save:save,clear:clear};
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init);else init();
})(window,document);
