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
  let versions = [], selectedVersion = null;

  function locked() {
    $("#unauthorized").hidden = false;
    $("#workspace").hidden = true;
  }
  function enableEditor(enabled) {
    for (const id of ["chapter-title", "chapter-body", "chapter-status", "save", "preview-button", "download", "save-alternative"]) {
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
  function sectionLabel(item) {
    const hasPrologue = chapters[0]?.chapter_number === 1 && /^prólogo(?:\b|$)/i.test(chapters[0].title);
    if (hasPrologue && item.chapter_number === 1) return "Prólogo";
    return "Capítulo " + (item.chapter_number - (hasPrologue ? 1 : 0));
  }
  function renderList() {
    const list = $("#chapter-list");
    list.replaceChildren();
    $("#count").textContent = chapters.filter(c => sectionLabel(c) !== "Prólogo").length + " / " + (book?.planned_chapters || "30");
    for (const item of chapters) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chapter" + (current?.id === item.id ? " active" : "");
      b.setAttribute("aria-pressed", String(current?.id === item.id));
      const title = document.createElement("b");
      title.textContent = sectionLabel(item) === "Prólogo" ? item.title : sectionLabel(item) + " · " + item.title;
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
      $("#selected-chapter").textContent = sectionLabel(data);
      $("#chapter-title").value = data.title;
      $("#chapter-body").value = data.body || "";
      $("#chapter-status").value = data.status;
      enableEditor(true);
      setDirty(false);
      renderList();
      $("#version-panel").hidden = false;
      await loadVersions();
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
      await loadVersions();
      message("Capítulo salvo. A versão anterior foi guardada automaticamente quando houve alteração.");
    } catch (e) {
      setDirty(true);
      message("Falha ao salvar: " + (e.message || e) + " O texto permanece nesta tela.", true);
    } finally {
      busy = false;
      $("#save").disabled = false;
    }
  }

  function clearComparison() {
    selectedVersion = null;
    $("#version-compare").hidden = true;
    $("#restore-version").disabled = true;
    $("#version-description").textContent = "";
    $("#version-previous").value = "";
    $("#version-current").value = "";
  }
  async function loadVersions() {
    clearComparison();
    versions = [];
    const select = $("#version-select");
    select.replaceChildren();
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Nenhuma versão anterior";
    select.append(placeholder);
    select.disabled = true;
    $("#compare-version").disabled = true;
    if (!current) return;
    const {data,error} = await client.from("editorial_chapter_versions")
      .select("id,version_label,source_kind,created_at")
      .eq("chapter_id",current.id).order("created_at",{ascending:false});
    if (error) throw error;
    versions = data || [];
    for (const v of versions) {
      const option = document.createElement("option");
      option.value = v.id;
      option.textContent = v.version_label + (v.source_kind === "alternativa" ? " · alternativa" : " · anterior");
      select.append(option);
    }
    if (versions.length) {
      placeholder.textContent = "Escolha uma das " + versions.length + " versões";
      select.disabled = false;
    }
    $("#compare-version").disabled = !versions.length;
  }
  async function compareVersion() {
    if (!current || busy) return;
    const id = $("#version-select").value;
    if (!id) {message("Selecione uma versão para comparar.",true);return;}
    busy = true;
    $("#compare-version").disabled = true;
    try {
      const {data,error} = await client.from("editorial_chapter_versions")
        .select("id,chapter_id,version_label,title,body,status,source_kind,created_at")
        .eq("id",id).eq("chapter_id",current.id).single();
      if (error) throw error;
      selectedVersion = data;
      $("#version-current").value = $("#chapter-body").value;
      $("#version-previous").value = data.body;
      $("#version-description").textContent = data.version_label + " · " +
        (data.source_kind === "alternativa" ? "Redação alternativa" : "Redação anterior") +
        " · " + new Date(data.created_at).toLocaleString("pt-BR");
      $("#version-compare").hidden = false;
      $("#restore-version").disabled = false;
      message("Comparação aberta. Os dois textos permanecem privados e nenhum foi alterado.");
    } catch (e) {
      message("Falha ao consultar a versão: "+(e.message||e),true);
    } finally {
      busy = false;
      $("#compare-version").disabled = false;
    }
  }
  async function saveAlternative() {
    if (!current || busy) return;
    const title = $("#chapter-title").value.trim();
    if (!title) {message("Informe o título do capítulo antes de guardar a alternativa.",true);return;}
    const body = $("#chapter-body").value;
    if (body.length > 600000) {message("O texto excedeu o limite do editor.",true);return;}
    const versionLabel = $("#version-label").value.trim() || "Alternativa manual · " + new Date().toLocaleString("pt-BR");
    if (versionLabel.length > 180) {message("O nome da versão deve ter até 180 caracteres.",true);return;}
    busy = true;
    $("#save-alternative").disabled = true;
    try {
      const {error} = await client.from("editorial_chapter_versions").insert({
        chapter_id:current.id, version_label:versionLabel, title,
        body, status:$("#chapter-status").value, source_kind:"alternativa"
      });
      if (error) throw error;
      $("#version-label").value = "";
      await loadVersions();
      message("Versão alternativa preservada. O capítulo principal não foi substituído.");
    } catch(e) {
      message("Falha ao guardar alternativa: "+(e.message||e)+" O texto continua no editor.",true);
    } finally {
      busy = false;
      $("#save-alternative").disabled = false;
    }
  }
  async function restoreVersion() {
    if (!current || !selectedVersion || busy) return;
    if (!window.confirm("Tornar esta versão o texto vigente? O texto atual será preservado automaticamente no histórico. Alterações NÃO SALVAS no editor serão descartadas.")) return;
    const restored = selectedVersion;
    busy = true;
    $("#restore-version").disabled = true;
    try {
      const now = new Date().toISOString();
      const {data,error} = await client.from("editorial_chapters").update({
        title:restored.title, body:restored.body, status:restored.status, updated_at:now
      }).eq("id",current.id).eq("book_id",book.id).eq("updated_at",current.updated_at)
        .select("id,updated_at");
      if (error) throw error;
      if (!data || data.length !== 1) throw Error("O capítulo mudou em outra sessão. Nenhum texto foi substituído.");
      current = {...current,title:restored.title,body:restored.body,
        status:restored.status,updated_at:data[0].updated_at};
      $("#chapter-title").value = restored.title;
      $("#chapter-body").value = restored.body;
      $("#chapter-status").value = restored.status;
      setDirty(false);
      await loadList();
      await loadVersions();
      message("Versão restaurada como vigente. O texto anterior foi preservado no histórico.");
    } catch(e) {
      message("Falha ao restaurar versão: "+(e.message||e),true);
    } finally {
      busy = false;
      $("#restore-version").disabled = !selectedVersion;
    }
  }
  function preview() {
    if (!current) return;
    $("#preview-title").textContent = sectionLabel(current) === "Prólogo" ? $("#chapter-title").value.trim() : sectionLabel(current) + " — " + $("#chapter-title").value.trim();
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
    const text = book.title + "\n" +
      sectionLabel(current) + " — " + $("#chapter-title").value.trim() +
      "\n\n" + $("#chapter-body").value;
    const blob = new Blob([text],{type:"text/plain;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = book.slug + "-" + (sectionLabel(current) === "Prólogo" ? "prologo" : "capitulo-" + sectionLabel(current).replace("Capítulo ", "").padStart(2,"0")) + ".txt";
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
      const {data:books,error:bookError} = await client.from("editorial_books")
        .select("id,slug,title,subtitle,planned_chapters").is("archived_at",null).order("created_at", {ascending:true});
      if (bookError || !books?.length) throw bookError || Error("Nenhum livro cadastrado.");
      const requestedSlug = new URL(window.location.href).searchParams.get("book");
      const legacyAlternative = requestedSlug === "miani-nora-versoes-alternativas";
      const selectedSlug = legacyAlternative ? "miani-romance-nora-whitmore" : requestedSlug;
      book = books.find(item => item.slug === (selectedSlug || "oficio-do-espanto"));
      if (!book && selectedSlug) throw Error("Livro não encontrado.");
      book ||= books[0];
      if (legacyAlternative) {
        const redirected = new URL(window.location.href);
        redirected.searchParams.set("book",book.slug);
        window.history.replaceState(null,"",redirected.href);
      }
      $("#book-title").textContent = book.title;
      $("#book-description").textContent = book.subtitle || "Escrever, revisar e visualizar. Sem publicação automática.";
      const select = $("#book-select");
      select.replaceChildren();
      for (const item of books) {
        const option = document.createElement("option");
        option.value = item.slug;
        option.textContent = item.title;
        select.append(option);
      }
      select.value = book.slug;
      select.addEventListener("change", () => {
        if (busy) {select.value = book.slug;return;}
        if (dirty && !window.confirm("Há alterações não salvas. Descartá-las para abrir outro livro?")) {
          select.value = book.slug;
          return;
        }
        setDirty(false);
        const url = new URL(window.location.href);
        url.searchParams.set("book",select.value);
        window.location.assign(url.href);
      });
      $("#book-picker").hidden = false;
      $("#workspace").hidden = false;
      $("#unauthorized").hidden = true;
      await loadList();
      if (chapters.length) await openChapter((legacyAlternative && chapters.find(item => item.chapter_number === 10)?.id) || chapters[0].id);
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
    $("#save-alternative").addEventListener("click",saveAlternative);
    $("#compare-version").addEventListener("click",compareVersion);
    $("#restore-version").addEventListener("click",restoreVersion);
    $("#close-version").addEventListener("click",clearComparison);
    $("#version-select").addEventListener("change",clearComparison);
    $("#close-preview").addEventListener("click",closePreview);
    $("#print").addEventListener("click",() => window.print());
    window.addEventListener("beforeunload",e => {
      if(dirty){e.preventDefault();e.returnValue="";}
    });
    start();
  });
})();
