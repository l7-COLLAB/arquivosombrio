"use strict";
(() => {
  const SUPABASE_URL = "https://iuhotznurbyujzbyhizf.supabase.co";
  const SUPABASE_KEY = "sb_publishable_bpAZ5EhYLIuVoE4Q97s_-A_XQwwRxUj";
  const STORAGE_KEY = "arquivo-sombrio-admin-auth-v2";
  const $ = selector => document.querySelector(selector);
  const message = (text, isError = false) => {
    const node = $("#message");
    node.textContent = text;
    node.style.color = isError ? "#efaba2" : "";
  };
  let client, book, chapters = [], current = null, dirty = false, busy = false;

  function locked() {
    $("#unauthorized").hidden = false;
    $("#workspace").hidden = true;
  }
  function enableEditor(enabled) {
    for (const id of ["chapter-title", "chapter-body", "chapter-status", "save", "preview-button", "download"]) {
      $("#" + id).disabled = !enabled;
    }
  }
  function setDirty(value) {
    dirty = value;
    $("#save-state").textContent = value ? "Alterações não salvas" : (current ? "Salvo" : "");
  }
  function chapterLabel(status, hasText) {
    if (hasText) return status === "revisao" ? "Em revisão" : "Rascunho";
    return status === "a_importar" ? "A importar" : "Planejado";
  }
  function renderList() {
    const list = $("#chapter-list");
    list.replaceChildren();
    $("#count").textContent = chapters.length + " / " + (book?.planned_chapters || "30");
    for (const item of chapters) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chapter" + (current?.id === item.id ? " active" : "");
      b.setAttribute("aria-pressed", String(current?.id === item.id));
      const title = document.createElement("b");
      title.textContent = String(item.chapter_number).padStart(2,"0") + " · " + item.title;
      const status = document.createElement("small");
      status.textContent = chapterLabel(item.status, item.hasText);
      b.append(title,status);
      b.onclick = () => openChapter(item.id);
      list.append(b);
    }
  }
  async function loadList() {
    const {data,error} = await client.from("editorial_chapters")
      .select("id,chapter_number,title,status,updated_at,body")
      .eq("book_id", book.id).order("chapter_number", {ascending:true});
    if(error) throw error;
    // This MVP has just 30 chapters; content is read only into the authenticated admin session.
    chapters = (data || []).map(c => ({
      id:c.id,chapter_number:c.chapter_number,title:c.title,
      status:c.status,updated_at:c.updated_at,hasText:!!String(c.body || "").trim()
    }));
    renderList();
  }
  async function openChapter(id) {
    if (busy || (current?.id === id)) return;
    if (dirty && !window.confirm("Há alterações não salvas. Descartá-las para abrir outro capítulo?")) return;
    busy = true;
    message("Carregando capítulo...");
    try {
      const {data,error} = await client.from("editorial_chapters")
        .select("id,chapter_number,title,body,status,updated_at")
        .eq("id", id).eq("book_id", book.id).single();
      if (error) throw error;
      current = data;
      $("#selected-chapter").textContent = "Capítulo " + data.chapter_number;
      $("#chapter-title").value = data.title;
      $("#chapter-body").value = data.body || "";
      $("#chapter-status").value = data.status;
      enableEditor(true);
      setDirty(false);
      renderList();
      message("Capítulo aberto. Alterações só são gravadas ao clicar em Salvar.");
    } catch (e) {
      message("Não foi possível abrir o capítulo: " + (e.message || e), true);
    } finally {
      busy = false;
    }
  }
  function edited() {
    if (!current) return;
    if ($("#chapter-body").value.trim() && $("#chapter-status").value === "a_importar") {
      $("#chapter-status").value = "rascunho";
    }
    setDirty(true);
  }
  async function save() {
    if (!current || busy) return;
    const title = $("#chapter-title").value.trim();
    if (!title) {message("O capítulo precisa de um título.", true);return;}
    const body = $("#chapter-body").value;
    if (body.length > 600000) {message("O capítulo está acima do limite do editor. Divida o texto antes de salvar.", true);return;}
    busy = true;
    $("#save").disabled = true;
    message("Salvando no banco privado...");
    try {
      const now = new Date().toISOString();
      const {data,error} = await client.from("editorial_chapters").update({
        title, body, status:$("#chapter-status").value, updated_at:now
      }).eq("id",current.id).eq("book_id",book.id)
        .eq("updated_at",current.updated_at)
        .select("id,updated_at");
      if (error) throw error;
      if (!data || data.length !== 1) throw Error("Esta versão mudou em outra sessão. Copie o texto antes de recarregar para evitar perda de alterações.");
      current = {...current,title,body,status:$("#chapter-status").value,updated_at:data[0].updated_at};
      setDirty(false);
      await loadList();
      message("Capítulo salvo com sucesso. Não foi publicado no site.");
    } catch (e) {
      setDirty(true);
      message("Falha ao salvar: " + (e.message || e) + " O texto permanece nesta tela.", true);
    } finally {
      busy = false;
      $("#save").disabled = false;
    }
  }
  function preview() {
    if (!current) return;
    $("#preview-title").textContent = "Capítulo " + current.chapter_number + " — " + $("#chapter-title").value.trim();
    const text = $("#preview-text");
    text.replaceChildren();
    const paragraphs = $("#chapter-body").value.replace(/\r\n/g,"\n").split(/\n\s*\n/);
    for (const paragraph of paragraphs) {
      if(!paragraph.trim()) continue;
      const p = document.createElement("p");
      p.textContent = paragraph.trim();
      text.append(p);
    }
    if (!text.childNodes.length) {
      const p = document.createElement("p");p.textContent = "Este capítulo ainda não tem texto.";text.append(p);
    }
    $("#workspace").hidden = true;
    $("#editor-intro").hidden = true;
    $("#preview-section").hidden = false;
    message("Prévia de leitura. A impressão usa o tamanho de página 16 × 23 cm.");
    window.scrollTo({top:0,behavior:"smooth"});
  }
  function closePreview() {
    $("#preview-section").hidden = true;
    $("#editor-intro").hidden = false;
    $("#workspace").hidden = false;
    window.scrollTo({top:0,behavior:"smooth"});
  }
  function download() {
    if (!current) return;
    const text = "O OFÍCIO DO ESPANTO\n" +
      "Capítulo " + current.chapter_number + " — " + $("#chapter-title").value.trim() +
      "\n\n" + $("#chapter-body").value;
    const blob = new Blob([text],{type:"text/plain;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "oficio-do-espanto-capitulo-" + String(current.chapter_number).padStart(2,"0") + ".txt";
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(() => URL.revokeObjectURL(url),1000);
  }
  async function start() {
    try {
      if (!window.supabase?.createClient) throw Error("Biblioteca de autenticação indisponível.");
      client = window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{
        auth:{storageKey:STORAGE_KEY,persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}
      });
      const {data:{user},error:authError} = await client.auth.getUser();
      if(authError || !user || user.app_metadata?.role !== "admin") {locked();message("Acesso reservado a administradores.",true);return;}
      const {data:isAdmin,error:roleError} = await client.rpc("is_arquivo_sombrio_admin");
      if (roleError || isAdmin !== true) {locked();message("Autorização administrativa não confirmada.",true);return;}
      const {data:bookData,error:bookError} = await client.from("editorial_books")
        .select("id,title,subtitle,planned_chapters")
        .eq("slug","oficio-do-espanto").single();
      if (bookError || !bookData) throw bookError || Error("Livro não encontrado.");
      book = bookData;
      $("#workspace").hidden = false;
      $("#unauthorized").hidden = true;
      await loadList();
      if (chapters.length) await openChapter(chapters[0].id);
      message("Estúdio pronto. Os rascunhos são privados e não serão publicados automaticamente.");
    } catch(e) {
      locked();
      message("Não foi possível preparar o estúdio: " + (e.message || e),true);
    }
  }
  document.addEventListener("DOMContentLoaded",() => {
    for(const id of ["chapter-title","chapter-body","chapter-status"])
      $("#"+id).addEventListener("input",edited);
    $("#save").addEventListener("click",save);
    $("#preview-button").addEventListener("click",preview);
    $("#download").addEventListener("click",download);
    $("#close-preview").addEventListener("click",closePreview);
    $("#print").addEventListener("click",() => window.print());
    window.addEventListener("beforeunload",e => {
      if(dirty){e.preventDefault();e.returnValue="";}
    });
    start();
  });
})();