import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { JSDOM } from "jsdom";

const read = path => fs.readFileSync(new URL("../" + path, import.meta.url), "utf8");
const moduleSource = read("js/meu-arquivo-comunidade.js");
const sql = read("supabase/migrations/20261103221500_member_community_notifications_tags.sql");
const secondSql = read("supabase/migrations/20261103222500_blocked_member_forum_comments.sql");

function harness(responses = {}) {
    const dom = new JSDOM('<main class="arquivo-dashboard"><button id="abrir-seguidos">Seguidos</button><section id="compartilhar-teoria"><div class="compartilhar-teoria-content"></div></section><div id="lista-marcadores"></div><div id="arquivo-modal-content"></div></main>', {
        url: "https://arquivosombrio.net.br/meu-arquivo.html",
        runScripts: "outside-only"
    });
    const w = dom.window;
    const user = {id:"usuario-test",user_metadata:{display_name:"Investigador de teste"}};
    const inserts = [];
    const dataFor = key => typeof responses[key] === "function" ? responses[key]() : (responses[key] ?? []);
    const client = {
        auth: {getUser: async()=>({data:{user},error:null})},
        from(table) {
            let op = "select", payload = null;
            const chain = {
                select() {return this;},
                eq() {return this;},
                order() {return this;},
                limit() {return this;},
                upsert(value) {op="upsert";payload=value;inserts.push({table,op,value});return this;},
                insert(value) {op="insert";payload=value;inserts.push({table,op,value});return this;},
                delete() {op="delete";return this;},
                single: async()=>({data:op === "select" ? dataFor(table)[0] || null : (table==="forum_posts"?{id:1}:payload),error:null}),
                maybeSingle: async()=>({data:dataFor(table)[0] || null,error:null}),
                then(resolve) {return Promise.resolve({data:dataFor(table),error:null}).then(resolve);}
            };
            return chain;
        }
    };
    w.meuArquivoState = {
        preferencias:{notify_comments:true},
        marcadores:[],favoritos:[],dossies:[],usuario:user
    };
    w.obterSupabaseMeuArquivo=async()=>client;
    w.abrirModalArquivo=(_name,html)=>{w.document.querySelector("#arquivo-modal-content").innerHTML=html;};
    w.carregarSeguidosUsuario=async()=>{};
    w.carregarBloqueadosUsuario=async()=>{};
    w.normalizarLinkMeuArquivo=x=>x || "#";
    w.confirm=()=>true;
    w.alert=()=>{};
    w.eval(moduleSource);
    w.document.dispatchEvent(new w.Event("DOMContentLoaded"));
    return {dom,w,client,user,inserts,cleanup:()=>dom.window.close()};
}

test("comunidade só aparece por adesão, com RLS e bloqueios preservados no banco",()=>{
    assert.match(sql,/create table if not exists public.member_profiles/i);
    assert.match(sql,/alter table public.member_profiles enable row level security/i);
    assert.match(sql,/published boolean not null default false/i);
    assert.match(sql,/member_view_allowed\(user_id\)/i);
    assert.match(sql,/foreign key\(tag_id,user_id\)/i);
    assert.match(sql,/user_item_tags.*enable row level security/is);
    assert.match(sql,/trigger arquivo_validate_member_follow/i);
    assert.match(sql,/trigger arquivo_notify_forum_comment/i);
    assert.match(sql,/source_key/i);
    assert.match(secondSql,/arquivo_guard_blocked_forum_comment/i);
    assert.doesNotMatch(sql,/grant insert on public.user_notifications to authenticated/i);
});

test("interface instala descoberta e envio sem expor conta automaticamente",async()=>{
    const {w,cleanup}=harness();
    assert.ok(w.document.getElementById("descobrir-investigadores"));
    assert.ok(w.document.getElementById("abrir-compartilhamento-teoria"));
    await w.ArquivoComunidade.privacy();
    const selector=w.document.getElementById("member-profile-visibility");
    assert.equal(selector.value,"private");
    cleanup();
});

test("publicação de perfil é uma ação opt-in e salva consentimento antes de publicar",async()=>{
    const {w,inserts,cleanup}=harness();
    await w.ArquivoComunidade.privacy();
    w.document.getElementById("member-profile-display").value="Investigador Público";
    w.document.getElementById("member-profile-visibility").value="community";
    const form=w.document.querySelector("#arquivo-community-modal form");
    form.dispatchEvent(new w.Event("submit",{bubbles:true,cancelable:true}));
    await new Promise(resolve=>setTimeout(resolve,30));
    const prefs=inserts.find(x=>x.table==="user_preferences");
    const profile=inserts.find(x=>x.table==="member_profiles");
    assert.ok(prefs&&profile);
    assert.equal(prefs.value.profile_visibility,"community");
    assert.equal(profile.value.published,true);
    assert.ok(inserts.indexOf(prefs)<inserts.indexOf(profile),"Consentimento deve vir antes da publicação");
    cleanup();
});

test("hipóteses privadas são enviadas pendentes e nunca publicadas automaticamente",async()=>{
    const {w,inserts,cleanup}=harness({
        user_theories:[{id:"teoria-1",title:"Linha investigativa",content:"A interpretação ainda não foi confirmada."}]
    });
    await w.ArquivoComunidade.shareTheory();
    const form=w.document.querySelector("#arquivo-community-modal form");
    form.querySelector('input[type="checkbox"]').checked=true;
    form.dispatchEvent(new w.Event("submit",{bubbles:true,cancelable:true}));
    await new Promise(resolve=>setTimeout(resolve,30));
    const entry=inserts.find(x=>x.table==="forum_posts");
    assert.ok(entry);
    assert.equal(entry.value.status,"pendente");
    assert.match(entry.value.title,/Hipótese pessoal:/);
    assert.match(entry.value.content,/NÃO VERIFICADA/);
    cleanup();
});

test("atribuições de etiquetas usam proprietário e item de conteúdo",async()=>{
    const {w,inserts,cleanup}=harness({
        user_tags:[{id:"tag-1",name:"Estudo"}],
        user_item_tags:[]
    });
    await w.ArquivoComunidade.tags("dossier","dossier-123","Caso teste");
    const input=w.document.querySelector(".arquivo-community-tag input");
    assert.ok(input);
    input.checked=true;
    input.dispatchEvent(new w.Event("change",{bubbles:true}));
    await new Promise(resolve=>setTimeout(resolve,20));
    const entry=inserts.find(x=>x.table==="user_item_tags");
    assert.equal(entry.value.user_id,"usuario-test");
    assert.equal(entry.value.tag_id,"tag-1");
    assert.equal(entry.value.item_type,"dossier");
    assert.equal(entry.value.item_id,"dossier-123");
    cleanup();
});

test("links de notificação apontam ao post específico sem script no ID",()=>{
    const src=read("js/forum-deep-link.js");
    assert.match(src,/\^\\d\{1,20\}\$/);
    assert.match(read("forum.html"),/forum-deep-link\.js/);
    const dom=new JSDOM('<article class="forum-post-card" data-post-id="42"></article>',{
        url:"https://arquivosombrio.net.br/forum.html?post=42",runScripts:"outside-only"
    });
    dom.window.Element.prototype.scrollIntoView=()=>{};
    dom.window.eval(src);
    dom.window.document.dispatchEvent(new dom.window.Event("DOMContentLoaded"));
    assert.equal(dom.window.document.querySelector(".forum-post-card").classList.contains("forum-post-targeted"),true);
    dom.window.close();
});
