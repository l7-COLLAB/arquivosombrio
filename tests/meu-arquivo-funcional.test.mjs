import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { JSDOM } from "jsdom";

const ler = caminho => fs.readFileSync(new URL("../" + caminho, import.meta.url), "utf8");
const js = ler("js/meu-arquivo.js");
const caso = ler("js/caso.js");

function trecho(arquivo, inicio, fim) {
    const a = arquivo.indexOf(inicio);
    const b = arquivo.indexOf(fim, a + inicio.length);
    assert.ok(a >= 0 && b > a, "Função não encontrada: " + inicio);
    return arquivo.slice(a, b);
}

test("modal X, scripts e versão de cache estão integrados no HTML", () => {
    const html = ler("meu-arquivo.html");
    assert.match(html, /id="arquivo-modal-close"\s+data-close-arquivo-modal/);
    assert.match(html, /js\/meu-arquivo-novels\.js\?v=meu-arquivo-20261103-1/);
    assert.match(html, /js\/meu-arquivo\.js\?v=meu-arquivo-20261103-1/);
});

test("falha na tabela não aparece como lista vazia", async () => {
    const codigo = trecho(js, "async function consultarTabelaUsuario(", "/* =========================================================\n   MEUS DOSSIÊS");
    const supabase = {
        from: () => ({
            select() { return this; },
            eq() { return this; },
            then(resolve) { return Promise.resolve({data: null, error: new Error("RLS test")}).then(resolve); }
        })
    };
    const funcao = new Function("obterSupabaseMeuArquivo", "meuArquivoState",
        codigo + "\nreturn consultarTabelaUsuario;"
    )(async () => supabase, {usuario: {id:"usuario-test"}});
    await assert.rejects(funcao("user_dossiers"), /RLS test/);
});

test("a sincronização não apaga trechos antigos quando o insert falha", async () => {
    const codigo = trecho(caso, "async function sincronizarDestaquesLeitura(casoId, lista) {",
        "async function carregarDestaquesPrivadosDoCaso");
    let exclusoes = 0;
    const supabase = {
        auth: {getUser: async () => ({data:{user:{id:"usuario-1"}},error:null})},
        from() {
            return {
                select() { return this; },
                eq() { return this; },
                delete() { exclusoes++; return this; },
                insert: async () => ({error:new Error("Falha simulada")}),
                then(resolve) {
                    return Promise.resolve({data:[
                        {id:"destaque-original",start_offset:4,end_offset:8}
                    ],error:null}).then(resolve);
                }
            };
        }
    };
    const sincronizar = new Function("obterClienteSupabaseCaso","obterTextoBaseLeitura",
        "obterTituloDossieAtual",codigo+"\nreturn sincronizarDestaquesLeitura;"
    )(async()=>supabase, ()=>"Exemplo de texto de leitura", ()=>"Dossiê teste");
    await assert.rejects(sincronizar("123",[{inicio:4,fim:8},{inicio:10,fim:15}]),/Falha simulada/);
    assert.equal(exclusoes,0,"Deleção prematura removeu um trecho salvo");
});

test("o salvamento do mural acompanha alterações feitas durante envio", async () => {
    const codigo = trecho(js, "async function salvarMuralAberto(", "/* =========================================================\n   ABRIR REGISTRO GENÉRICO");
    const state={
        usuario:{id:"user-test"},muralAberto:{id:"board-test",board_data:{items:[{title:"Antes"}]}},
        muralSalvamentoTimer:null,muralSalvamentoPromise:null,muralSalvando:false
    };
    const chamadas=[];
    const supabase={
        from(){
            return {
                update(data){ chamadas.push(structuredClone(data.board_data)); return this; },
                eq(){return this;},select(){return this;},
                async single(){
                    if(chamadas.length===1){
                        state.muralAberto.board_data={items:[{title:"Depois"}]};
                    }
                    return {data:{id:"board-test",updated_at:new Date().toISOString()},error:null};
                }
            };
        }
    };
    const rascunhos = new Map();
    const salvar = new Function("meuArquivoState","obterSupabaseMeuArquivo",
        "atualizarEstadoSalvamentoMural","obterChaveRascunhoMural","window","localStorage",
        codigo+"\nreturn salvarMuralAberto;"
    )(state,async()=>supabase,()=>{} ,()=> "mural-test",{clearTimeout(){}},
        {setItem:(chave,valor)=>rascunhos.set(chave,valor)});
    assert.equal(await salvar(false),true);
    assert.equal(chamadas.length,2);
    assert.equal(chamadas[1].items[0].title,"Depois");
    assert.equal(JSON.parse(rascunhos.get("mural-test")).data.items[0].title,"Depois");
});

test("Minhas Leituras trata títulos e imagens não confiáveis como texto", async () => {
    const dom = new JSDOM('<div><article id="favoritos"></article></div>',{
        url:"https://arquivosombrio.net.br/meu-arquivo.html",
        runScripts:"outside-only"
    });
    const w = dom.window;
    const banco={
        auth:{getUser: async()=>({data:{user:{id:"user-test"}},error:null})},
        from(nome){
            return {
                select(){return this},
                eq(){
                    return Promise.resolve({error:null,data:nome==="novel_biblioteca"
                        ? [{novel_id:"novel-1",estado:"lendo",novels:{
                            slug:"obra-test",titulo:'<img src=x onerror=alert(1)>',
                            imagem_capa:"javascript:alert(1)",status_publicacao:"publicado"
                        }}] : [{novel_id:"novel-1",percentual:42,novel_capitulos:{numero:3,titulo:"Capítulo 3"}}]});
                }
            };
        }
    };
    w.obterSupabaseMeuArquivo=async()=>banco;
    w.eval(ler("js/meu-arquivo-novels.js"));
    await new Promise(resolve=>setTimeout(resolve,20));
    const strong=dom.window.document.querySelector(".novel-library-meta strong");
    assert.equal(strong?.textContent,'<img src=x onerror=alert(1)>');
    assert.equal(dom.window.document.querySelector(".novel-library-meta img"),null);
    const href=dom.window.document.querySelector(".novel-library-item")?.getAttribute("href");
    assert.match(href,/novel\.html\?obra=obra-test&capitulo=3/);
    dom.window.close();
});
