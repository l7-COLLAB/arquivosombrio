"use strict";
(function (root) {
  const EDITORIAL_MARKER = /\[\s*FIM DO CAP[ÍI]TULO\b|VERS[ÃA]O PRELIMINAR CONDENSADA|\bN[ÃA]O PUBLICAR\b/i;

  function isReleaseStatus(value) {
    return value === "publicado" || value === "agendado";
  }

  function hasEditorialMarker(content) {
    return EDITORIAL_MARKER.test(String(content || ""));
  }

  function checkChapter(chapter) {
    const errors = [];
    if (!isReleaseStatus(chapter?.status_publicacao)) return errors;
    if (!String(chapter?.titulo || "").trim()) errors.push("Informe o título do capítulo.");
    if (!Number.isInteger(Number(chapter?.numero)) || Number(chapter.numero) < 1) {
      errors.push("O número do capítulo deve ser válido.");
    }
    if (!String(chapter?.conteudo || "").trim()) errors.push("O capítulo está vazio.");
    if (hasEditorialMarker(chapter?.conteudo)) {
      errors.push("O texto ainda contém um aviso interno de revisão ou de não publicação. Finalize o cotejo e retire o aviso somente após a homologação editorial.");
    }
    return errors;
  }

  function checkBook(book, chapters) {
    const errors = [];
    if (!isReleaseStatus(book?.status_publicacao)) return errors;
    // Somente Drácula é uma edição integral bloqueada; outras novels podem sair em capítulos.
    if (String(book?.slug || "").toLowerCase() !== "dracula") return errors;
    if (!Array.isArray(chapters)) return ["Não foi possível conferir todos os capítulos. Publicação bloqueada."];
    const numbers = chapters.map(c => Number(c.numero));
    const complete = chapters.length === 27 && new Set(numbers).size === 27
      && numbers.every(n => Number.isInteger(n) && n >= 1 && n <= 27);
    if (!complete) errors.push("Drácula precisa conter exatamente os 27 capítulos, numerados de I a XXVII sem lacunas.");
    const unfinished = chapters.filter(c =>
      c.status_publicacao !== "publicado" || hasEditorialMarker(c.conteudo)
      || !String(c.titulo || "").trim() || !String(c.conteudo || "").trim());
    if (unfinished.length) {
      errors.push("Capítulos sem liberação editorial: " +
        unfinished.map(c => String(c.numero)).join(", ") + ".");
    }
    return errors;
  }

  const api = Object.freeze({ isReleaseStatus, hasEditorialMarker, checkChapter, checkBook });
  root.ArquivoNovelPublicationGuard = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
