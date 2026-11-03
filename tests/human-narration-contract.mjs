import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {execFileSync} from "node:child_process";

const read=p=>fs.readFileSync(new URL("../"+p,import.meta.url),"utf8");
const admin=read("supabase/functions/human-narration-studio/index.ts");
const publicApi=read("supabase/functions/public-narration/index.ts");
const ui=read("admin-v2/js/human-narration.js");
const editor=read("admin-v2/js/audio-editor.js");
const entry=read("admin-v2/js/narration.js");
const bootstrap=read("admin-v2/index.html");
const schema=read("sql/human_narration_parts_20261103.sql");

test("Interface da V2 tem JavaScript válido",()=>{
 execFileSync(process.execPath,["--check",new URL("../admin-v2/js/human-narration.js",import.meta.url).pathname]);
 execFileSync(process.execPath,["--check",new URL("../admin-v2/js/audio-editor.js",import.meta.url).pathname]);
 assert.match(bootstrap,/human-narration\.js/);
 assert.match(bootstrap,/audio-editor\.js/);
 assert.match(entry,/ArquivoHumanVoiceStudio\?\.mount/);
});
test("A API de partes exige sessão e autorização administrativa",()=>{
 assert.match(admin,/caller\.auth\.getUser\(\)/);
 assert.match(admin,/rpc\("is_arquivo_sombrio_admin"\)/);
 assert.match(admin,/adminOk!==true/);
 assert.match(admin,/eq\("narration_project_id",projectId\)/);
 assert.match(admin,/security_consume_rate_limit/);
 assert.match(admin,/finish_upload/);
 assert.match(admin,/content-length/);
 assert.match(admin,/validAudio\(new Uint8Array/);
});
test("Nenhum upload passa diretamente ao público",()=>{
 assert.match(admin,/action==="approve_part"/);
 assert.match(admin,/entries\.some\(\(p:any\)=>p\.status!=="ready"/);
 assert.match(admin,/parts_manifest:manifest/);
 assert.match(admin,/active_release_id:release\.data\.id/);
 assert.match(schema,/parts_manifest jsonb not null/);
 assert.match(schema,/enable row level security/g);
 assert.doesNotMatch(schema,/grant\s+(select|all)\s+on[^;]+to\s+anon/i);
 assert.doesNotMatch(schema,/grant\s+(select|all)\s+on[^;]+to\s+authenticated/i);
});
test("Publicação humana precede áudio legado, exige artigo publicado e URL efêmera",()=>{
 const human=publicApi.indexOf("// Áudio humano: somente snapshots aprovados");
 const legacy=publicApi.indexOf("// Approved desktop imports");
 assert.ok(human>0&&legacy>human);
 assert.match(publicApi,/eq\("status_publicacao","publicado"\)/);
 assert.match(publicApi,/active_release_id/);
 assert.match(publicApi,/source_updated_at/);
 assert.match(publicApi,/action==="manifest"/);
 assert.match(publicApi,/action==="chunk"/);
 assert.match(publicApi,/signR2\(aws,url\)/);
 assert.doesNotMatch(ui,/getPublicUrl/);
});
test("Rascunhos editados não reescrevem o snapshot ativo",()=>{
 assert.match(schema,/human_narration_releases/);
 assert.match(schema,/active_release_id/);
 assert.match(admin,/action==="unpublish"/);
 assert.match(admin,/action==="publish"/);
 assert.match(ui,/Publicar narração completa/);
 assert.match(ui,/Roteiro ou lembretes de gravação/);
});

test("Editor gera WAV PCM local e preserva gravações originais",()=>{
 assert.match(editor,/OfflineContext\(1,Math.ceil\(run\*RATE\),RATE\)/);
 assert.match(editor,/new Blob\(\[bytes\],\{type:"audio\/wav"\}\)/);
 assert.match(editor,/new File\(\[blob\]/);
 assert.match(editor,/playbackRate.value=speed/);
 assert.match(editor,/data-ae-music/);
 assert.match(editor,/data-ae-effect/);
 assert.match(editor,/data-ae-start/);
 assert.match(editor,/data-ae-end/);
 assert.match(editor,/data-ae-preset/);
 assert.match(editor,/data-ae-credits/);
 assert.match(editor,/data-ae-rights/);
 assert.match(editor,/onExport\(file,\{credits:/);
 assert.doesNotMatch(editor,/functions.invoke|storage.from|fetch\(/);
 assert.match(ui,/data-part-editor/);
 assert.match(ui,/editedUploads\.has\(p.id\)/);
});
test("Upload verifica o formato real de MP3 e WAV, e não apenas a extensão",()=>{
 assert.match(admin,/const validAudio=/);
 assert.match(admin,/bytes\[20\]===1&&bytes\[21\]===0/);
 assert.match(admin,/bytes\[34\]===16&&bytes\[35\]===0/);
 assert.match(admin,/Range":"bytes=0-63/);
 assert.match(admin,/audio_mime:upload.audio_mime/);
 assert.match(admin,/audio_rights_note:upload.audio_rights_note/);
 assert.match(schema,/audio_mime text/);
 assert.match(schema,/audio_rights_note text/);
});
