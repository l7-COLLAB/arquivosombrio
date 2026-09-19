"use strict";

(() => {
    const SITE_URL = "https://l7-collab.github.io/arquivosombrio/";
    const SITE_NAME = "Arquivo Sombrio";

    function texto(valor, limite = 160) {
        const limpo = String(valor || "")
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        if (limpo.length <= limite) return limpo;
        return `${limpo.slice(0, limite - 1).trim()}…`;
    }

    function definirMeta(seletor, atributo, valor) {
        if (!valor) return;

        let elemento = document.head.querySelector(seletor);

        if (!elemento) {
            elemento = document.createElement("meta");
            const correspondencia = seletor.match(/meta\[(name|property)="([^"]+)"\]/);

            if (!correspondencia) return;

            elemento.setAttribute(correspondencia[1], correspondencia[2]);
            document.head.appendChild(elemento);
        }

        elemento.setAttribute(atributo, valor);
    }

    function definirCanonical(url) {
        let canonical = document.head.querySelector('link[rel="canonical"]');

        if (!canonical) {
            canonical = document.createElement("link");
            canonical.rel = "canonical";
            document.head.appendChild(canonical);
        }

        canonical.href = url;
    }

    function dataISO(valor) {
        if (!valor) return undefined;
        const data = new Date(valor);
        return Number.isNaN(data.getTime()) ? undefined : data.toISOString();
    }

    function aplicar(configuracao = {}) {
        const titulo = texto(configuracao.titulo, 110);
        const descricao = texto(configuracao.descricao || configuracao.resumo, 160);
        const imagem = configuracao.imagem || `${SITE_URL}icon-512.png`;
        const caminho = String(configuracao.caminho || location.pathname.split("/").pop() || "");
        const id = configuracao.id == null ? "" : String(configuracao.id);
        const url = new URL(caminho, SITE_URL);

        if (id) url.searchParams.set("id", id);

        const canonical = url.href;
        const tituloCompleto = titulo ? `${titulo} — ${SITE_NAME}` : SITE_NAME;

        document.title = tituloCompleto;
        definirCanonical(canonical);
        definirMeta('meta[name="description"]', "content", descricao);
        definirMeta('meta[name="robots"]', "content", "index, follow, max-image-preview:large");
        definirMeta('meta[property="og:locale"]', "content", "pt_BR");
        definirMeta('meta[property="og:type"]', "content", "article");
        definirMeta('meta[property="og:site_name"]', "content", SITE_NAME);
        definirMeta('meta[property="og:title"]', "content", tituloCompleto);
        definirMeta('meta[property="og:description"]', "content", descricao);
        definirMeta('meta[property="og:url"]', "content", canonical);
        definirMeta('meta[property="og:image"]', "content", imagem);
        definirMeta('meta[name="twitter:card"]', "content", "summary_large_image");
        definirMeta('meta[name="twitter:title"]', "content", tituloCompleto);
        definirMeta('meta[name="twitter:description"]', "content", descricao);
        definirMeta('meta[name="twitter:image"]', "content", imagem);

        const publicado = dataISO(configuracao.publicadoEm || configuracao.createdAt);
        const modificado = dataISO(configuracao.modificadoEm || configuracao.updatedAt || configuracao.publicadoEm || configuracao.createdAt);

        const schema = {
            "@context": "https://schema.org",
            "@type": configuracao.schemaType || "Article",
            headline: titulo,
            description: descricao,
            image: [imagem],
            mainEntityOfPage: {
                "@type": "WebPage",
                "@id": canonical
            },
            author: {
                "@type": "Organization",
                name: SITE_NAME,
                url: SITE_URL
            },
            publisher: {
                "@type": "Organization",
                name: SITE_NAME,
                url: SITE_URL,
                logo: {
                    "@type": "ImageObject",
                    url: `${SITE_URL}icon-512.png`
                }
            },
            inLanguage: "pt-BR"
        };

        if (publicado) schema.datePublished = publicado;
        if (modificado) schema.dateModified = modificado;
        if (configuracao.secao) schema.articleSection = configuracao.secao;

        let dadosEstruturados = document.head.querySelector('script[data-arquivo-seo="publicacao"]');

        if (!dadosEstruturados) {
            dadosEstruturados = document.createElement("script");
            dadosEstruturados.type = "application/ld+json";
            dadosEstruturados.dataset.arquivoSeo = "publicacao";
            document.head.appendChild(dadosEstruturados);
        }

        dadosEstruturados.textContent = JSON.stringify(schema);
    }

    window.ArquivoSEO = Object.freeze({ aplicar });
})();
