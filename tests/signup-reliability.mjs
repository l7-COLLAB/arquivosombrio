import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';

const main=fs.readFileSync('js/script.js','utf8');
const filters=fs.readFileSync('js/filtros.js','utf8');
const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
function env(){
  const {window:w}=new JSDOM('<button id="before">Antes</button>',{runScripts:'outside-only',url:'https://arquivosombrio.net.br/'});
  const timers=new Map();let id=0;
  w.setTimeout=(fn,ms)=>{timers.set(++id,{fn,ms});return id;};w.clearTimeout=id=>timers.delete(id);
  const calls=[],widgets=[];
  w.turnstile={render:(el,options)=>{assert.equal(el.childElementCount,0);widgets.push(options);return widgets.length;},remove:wid=>calls.push(['remove',wid])};
  w.eval(main.slice(0,main.indexOf('/* ==========================================================================',main.indexOf('function obterTokenTurnstile()')))+';window.obterTokenTurnstile=obterTokenTurnstile;');
  w.eval(filters.slice(filters.indexOf('async function tokenCaptcha()'),filters.indexOf('function abrirModalAdminImediatamente()'))+filters.slice(filters.indexOf('function fecharCadastroSeguro()'),filters.indexOf('function instalarCadastroSeguro()')));
  const authCalls=[];
  w.obterClienteSupabase=async()=>({auth:{signUp:async args=>{authCalls.push(['signup',args]);return {data:{user:{id:'test-only'},session:null},error:null};},resend:async args=>{authCalls.push(['resend',args]);return {error:null};}}});
  return {w,timers,calls,widgets,authCalls};
}
function signup(w){
  w.abrirCadastroSeguro();const form=w.document.querySelector('form');
  for(const [id,value] of Object.entries({nome:'Pessoa Teste',email:'test@example.com',senha:'test-only-password',confirmar:'test-only-password'}))form.querySelector('#arquivo-cadastro-'+id).value=value;
  form.querySelector('#arquivo-cadastro-politicas').checked=true;
  return form;
}
function submit(w,form){return w.cadastrarUsuarioSeguro({preventDefault(){},currentTarget:form});}

// A slow human challenge survives 30 seconds and only expires at 2 minutes.
{
 const {w,timers,widgets}=env();w.document.getElementById('before').focus();
 const p=w.obterTokenTurnstile();assert.equal(w.obterTokenTurnstile(),p);await flush();
 assert.equal(widgets.length,1);assert.equal([...timers.values()][0].ms,120000);
 const rejected=assert.rejects(p,e=>e.code==='captcha_timeout');[...timers.values()][0].fn();await rejected;
 assert.equal(w.document.getElementById('arquivo-sombrio-turnstile'),null);assert.equal(w.document.activeElement.id,'before');assert.equal(timers.size,0);
 const retry=w.obterTokenTurnstile();await flush();widgets[1].callback('unit-token');assert.equal(await retry,'unit-token');
 w.close();
}
// Cancel/failure/expiry never send a signup and preserve the typed form.
for(const failure of ['cancel','error','expired','render']){
 const {w,widgets,authCalls,timers}=env();const form=signup(w);
 if(failure==='render')w.turnstile.render=()=>{throw new Error('unit provider failed');};
 const p=submit(w,form);await flush();
 if(failure==='cancel')w.document.querySelector('#arquivo-sombrio-turnstile button').click();
 if(failure==='error')widgets[0]['error-callback']('110200');
 if(failure==='expired')widgets[0]['expired-callback']();
 await p;assert.equal(authCalls.length,0);assert.equal(form.querySelector('#arquivo-cadastro-nome').value,'Pessoa Teste');
 assert.equal(form.querySelector('#arquivo-cadastro-senha').value,'test-only-password');assert.equal(form.querySelector('[type=submit]').disabled,false);assert.equal(timers.size,0);
 if(failure==='error')assert.match(form.querySelector('#arquivo-cadastro-mensagem').textContent,/110200/);
 w.close();
}
// Duplicate submits: one challenge, one request; persistent success, no plaintext password left.
{
 const {w,widgets,authCalls}=env();const form=signup(w),p=submit(w,form);await submit(w,form);await flush();
 widgets[0].callback('signup-token');await p;
 assert.equal(authCalls.length,1);assert.equal(authCalls[0][1].options.captchaToken,'signup-token');assert.equal(authCalls[0][1].options.data.legal_acceptance,true);
 assert.equal(form.isConnected,true);assert.match(form.querySelector('#arquivo-cadastro-mensagem').textContent,/Solicitação recebida/);assert.equal(form.querySelector('#arquivo-cadastro-senha').value,'');
 assert.equal(form.querySelector('[type=submit]').hidden,true);assert.equal(form.querySelectorAll('a').length,3);
 // The cooldown avoids immediately repeating an email send.
 const resend=form.querySelector('[data-resend-confirmation]');resend.click();await flush();assert.equal(widgets.length,1);
 form.dataset.resendAfter='0';resend.click();await flush();assert.equal(widgets.length,2);widgets[1].callback('resend-token');await flush();
 assert.equal(authCalls[1][0],'resend');assert.equal(authCalls[1][1].type,'signup');assert.equal(authCalls[1][1].options.captchaToken,'resend-token');assert.equal(authCalls[1][1].email,'test@example.com');
 resend.click();await flush();assert.equal(authCalls.length,2);assert.equal(form.querySelector('[type=submit]').disabled,true);
 w.close();
}
// Slow network: show a status update, keep the request locked, handle the eventual reply once.
{
 const {w,timers,widgets}=env();let finish,requests=0;
 w.obterClienteSupabase=async()=>({auth:{signUp:()=>{requests++;return new Promise(r=>{finish=r;});}}});
 const form=signup(w),p=submit(w,form);await flush();widgets[0].callback('unit-token');await flush();
 [...timers.values()].find(t=>t.ms===20000).fn();assert.match(form.querySelector('#arquivo-cadastro-mensagem').textContent,/está demorando/);
 await submit(w,form);assert.equal(requests,1);assert.equal(form.querySelector('[type=submit]').disabled,true);
 finish({data:{user:{id:'unit'},session:null}});await p;assert.equal(form.dataset.signupComplete,'true');assert.equal(timers.size,0);w.close();
}
// Resend is reachable from login without a password or legal checkbox, and reports SMTP restrictions.
{
 const {w,widgets}=env();w.abrirLoginSeguro();const form=w.document.querySelector('form');form.querySelector('[type=email]').value='test@example.com';
 w.obterClienteSupabase=async()=>({auth:{resend:async()=>({error:{code:'email_address_not_authorized',message:'Email address not authorized'}})}});
 form.querySelector('[data-resend-confirmation]').click();await flush();widgets[0].callback('unit-token');await flush();assert.match(form.querySelector('#arquivo-login-mensagem').textContent,/envio de e-mails do site está restrito/);
 assert.equal(form.querySelector('[data-resend-confirmation]').disabled,false);assert.equal(form.querySelector('[type=submit]').disabled,false);w.close();
}
console.log('PASS: CAPTCHA de 2 minutos, cancelamento, erro, expiração, repetição, reenvio, limite, confirmação persistente e resposta lenta.');
