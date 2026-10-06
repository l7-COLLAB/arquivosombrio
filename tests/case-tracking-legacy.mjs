import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const {JSDOM}=createRequire(import.meta.url)('jsdom');
const dom=new JSDOM('<body></body>',{runScripts:'outside-only'}),w=dom.window;
w.ARQUIVO_ADMIN_V2_CLONE=true;
w.abrirFormularioAdmin=()=>{w.document.body.innerHTML='<div id="admin-form-modal"><form id="admin-content-form"><input id="admin-title"></form></div>';};
w.abrirFormularioCasoDiario=()=>{w.document.body.innerHTML='<div id="admin-daily-case-modal"><form id="daily-case-form"></form></div>';};
const client={isolated:true};w.obterClienteAdminIsolado=()=>client;
let mounted;
w.__module={mountCaseTracking:async(...args)=>{mounted=args;args[3]({updated_at:'novo'});}};
w.eval(fs.readFileSync('admin-v2/js/case-tracking-legacy.js','utf8').replace("import('./case-tracking.js?v=case-tracking-20261006-2')","Promise.resolve(window.__module)"));
const tick=()=>new Promise(r=>setTimeout(r,20));
for(const type of ['dossie','garimpo']){
 const open=data=>type==='dossie'?w.abrirFormularioAdmin('caso',data):w.abrirFormularioCasoDiario(data);
 open(null);await tick();
 const form=w.document.querySelector('form'),root=w.document.querySelector('[data-legacy-tracking]');
 assert(root&&!form.contains(root));assert(form.querySelector('[data-tracking-status]'));
 const select=root.querySelector('select');select.value='ativo';select.dispatchEvent(new w.Event('change'));
 assert.equal(form.querySelector('[data-tracking-status]').value,'ativo');
 const record={id:1,updated_at:'antes'};open(record);await tick();
 assert.equal(mounted[1],type);assert.equal(mounted[2](),record);assert.equal(mounted[4],client);assert.equal(record.updated_at,'novo');
}
const legacy=fs.readFileSync('admin-v2/legacy/js/script.js','utf8');
assert(legacy.includes('["dossies","diarios"].includes(secaoAdminAtiva)'));
assert(legacy.includes('document.getElementById("admin-content-order")?.after(label)'));
assert(legacy.includes('acompanhamento_status: formulario.querySelector("[data-tracking-status]")'));
console.log('PASS: formulários ativos V2, criação, edição, cliente isolado e metadados atualizados.');
