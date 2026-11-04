import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const page=read('admin-v2/gravador-local.html');
const editor=read('admin-v2/js/audio-editor.js');
const admin=read('admin-v2/index.html');
const inline=page.match(/<script defer>\s*([\s\S]*?)\s*<\/script>/)?.[1];
test('Gravador e editor têm JavaScript válido',()=>{
 assert.ok(inline);
 new vm.Script(inline,{filename:'gravador-local-inline.js'});
 new vm.Script(editor,{filename:'audio-editor.js'});
});
test('Ferramenta local preservada, sem entrada temporária no menu V2',()=>{
 assert.doesNotMatch(admin,/href="\.\/gravador-local\.html"/);
 assert.match(page,/<meta name="robots" content="noindex,nofollow,noarchive">/);
 assert.match(page,/connect-src 'none'/);
 assert.match(page,/getUserMedia/);
 assert.match(page,/MediaRecorder/);
 assert.match(page,/indexedDB\.open/);
 assert.match(page,/URL\.createObjectURL/);
 assert.match(page,/navigator\.mediaDevices\.enumerateDevices/);
 assert.doesNotMatch(inline,/\bfetch\s*\(|XMLHttpRequest|supabase|SERVICE_ROLE_KEY/i);
});
test('Gravação por partes pode pausar, retomar, importar e editar',()=>{
 assert.match(page,/recorder\.pause\(\)/);
 assert.match(page,/recorder\.resume\(\)/);
 assert.match(page,/recorder\.stop\(\)/);
 assert.match(page,/audio\/webm;codecs=opus/);
 assert.match(page,/audio\/mp4/);
 assert.match(page,/onExport:async/);
 assert.match(page,/Baixar arquivo/);
 assert.match(page,/Confirme antes que você já baixou/);
 assert.match(editor,/OfflineContext\(1,Math\.ceil\(run\*RATE\),RATE\)/);
 assert.match(editor,/data-ae-music/);
 assert.match(editor,/data-ae-effect/);
 assert.match(editor,/data-ae-credits/);
 assert.match(editor,/webm\|m4a\|mp4\|ogg/);
});
test('Gravações não são publicadas automaticamente nem expostas pela página',()=>{
 assert.match(page,/suas gravações não são enviadas/i);
 assert.match(page,/A publicação de narrações completas é um processo separado/i);
 assert.doesNotMatch(page,/publish\b|storage\.from|functions\.invoke|postMessage\(/i);
});
