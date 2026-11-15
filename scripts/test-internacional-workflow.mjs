#!/usr/bin/env node
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../admin-v2/internacional/draft-workflow.js',import.meta.url),'utf8');
const fields={
 'draft-title':{value:'A fully translated title'},
 'draft-summary':{value:'A sufficiently detailed summary for review.'},
 'draft-body':{value:JSON.stringify([{type:'paragraph',text:'Narrative with context and sources.'}])},
 'draft-sources':{value:JSON.stringify([{id:'source-1',url:'https://example.org/evidence',description:'News report'}])},
 'draft-locale':{value:'en-US'}
};
const context={window:{ARQUIVO_I18N_WRITES_ENABLED:true},document:{getElementById:(id)=>fields[id]},URL,Error,Array,JSON};
vm.runInNewContext(src,context);
const api=context.window.arquivoI18nDraft;
test('write disabled even if window flag set',()=>assert.equal(api.enabled,false));
test('structured serialization',()=>{
 const out=api.validate();
 assert.equal(out.blocks[0].type,'paragraph');
 assert.equal(out.sources[0].description,'News report');
});
test('invalid source rejected',()=>{
 const prev=fields['draft-sources'].value;
 try{fields['draft-sources'].value=JSON.stringify([{id:'1',url:'javascript:alert(1)',description:'x'}]);assert.throws(()=>api.validate(),/Fontes/)}
 finally{fields['draft-sources'].value=prev}
});
test('invalid block type rejected',()=>{
 const prev=fields['draft-body'].value;
 try{fields['draft-body'].value=JSON.stringify([{type:'unsafe',text:'x'}]);assert.throws(()=>api.validate(),/Blocos/)}
 finally{fields['draft-body'].value=prev}
});
test('saving blocked before RPC',async()=>{
 let calls=0;
 await assert.rejects(()=>api.save({rpc:()=>{calls++}},{id:1},'Casos',0),/desativada/);
 assert.equal(calls,0);
});
test('review blocked before RPC',async()=>{
 let calls=0;
 await assert.rejects(()=>api.submit({rpc:()=>{calls++}},'example',1),/desativado/);
 assert.equal(calls,0);
});
test('audit read maps results',async()=>{
 const response={data:[{action:'save_draft',to_revision:2}]};
 const client={from:()=>({select:()=>({eq:()=>({order:()=>({limit:async()=>response})})})})};
 const history=await api.audit(client,'example');
 assert.equal(history[0].to_revision,2);
});
