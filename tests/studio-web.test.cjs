const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM,VirtualConsole}=require('jsdom');
const html=fs.readFileSync('admin-v2/studio/index.html','utf8');
const script=fs.readFileSync('admin-v2/studio/studio.js','utf8');
const tick=()=>new Promise(r=>setTimeout(r,20));
function setup(role='admin',online=true){
 const dom=new JSDOM(html,{url:'https://arquivosombrio.net.br/admin-v2/studio/',runScripts:'outside-only',virtualConsole:new VirtualConsole()});
 const w=dom.window,calls=[];w.confirm=()=>true;w.AbortSignal.timeout=()=>undefined;
 const user={id:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',app_metadata:{role}};
 w.sessionStorage.setItem('arquivo-admin-verified-at',Date.now());w.sessionStorage.setItem('arquivo-admin-verified-user',user.id);
 w.obterClienteAdminIsolado=()=>({auth:{getUser:async()=>({data:{user}}),getSession:async()=>({data:{session:{access_token:'test-token'}}}),onAuthStateChange:()=>{}}});
 w.fetch=async(url,options)=>{calls.push({url,options});if(!online)throw Error('offline');return {ok:true,headers:{get:()=> 'application/json'},json:async()=>({ok:true,voices:[]})}};
 w.eval(script);return {dom,w,calls};
}
test('administrador abre Studio e prepara cenas sem servidor',async()=>{const {dom,w,calls}=setup('admin',false);await tick();assert.equal(w.document.querySelector('#studio').hidden,false);assert.equal(w.document.querySelector('#render').disabled,true);assert.match(w.document.querySelector('#connection-status').textContent,/indisponível/);w.document.querySelector('#script-text').value='Primeira pista.\n\nSegunda pista.';w.document.querySelector('#prepare').click();assert.equal(w.document.querySelectorAll('.scene').length,2);const buttons=w.document.querySelectorAll('.scene-actions button');buttons[2].click();assert.equal(w.document.querySelectorAll('.scene').length,1);assert.equal(calls[0].options.headers.Authorization,'Bearer test-token');dom.window.close()});
test('usuário comum não acessa nem consulta o serviço',async()=>{const {dom,w,calls}=setup('reader');await tick();assert.equal(w.document.querySelector('#studio').hidden,true);assert.equal(calls.length,0);dom.window.close()});
test('serviço conectado habilita renderização e bloqueia cenas sem imagem',async()=>{const {dom,w}=setup();await tick();assert.equal(w.document.querySelector('#render').disabled,false);w.document.querySelector('#script-text').value='<img src=x onerror=alert(1)> Texto.';w.document.querySelector('#prepare').click();assert.equal(w.document.querySelectorAll('.scene img[src]').length,0);w.document.querySelector('#render').click();await tick();assert.match(w.document.querySelector('#status').textContent,/Importe uma imagem/);dom.window.close()});
test('menu V2 e publicação incluem a rota escolhida',()=>{const admin=fs.readFileSync('admin-v2/index.html','utf8'),workflow=fs.readFileSync('.github/workflows/deploy-pages.yml','utf8');assert.match(admin,/href="\.\/studio\/"/);assert.match(workflow,/test -f _site\/admin-v2\/studio\/index.html/);assert.match(workflow,/--exclude='tools'/)});
