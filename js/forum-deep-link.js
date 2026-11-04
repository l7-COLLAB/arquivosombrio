"use strict";
(function () {
    const id = new URLSearchParams(location.search).get("post");
    if (!id || !/^\\d{1,20}$/.test(id)) return;

    function locate() {
        const card = Array.from(document.querySelectorAll(".forum-post-card[data-post-id]"))
            .find(el => el.dataset.postId === id);
        if (!card) return false;
        card.classList.add("forum-post-targeted");
        card.setAttribute("tabindex", "-1");
        card.scrollIntoView({behavior: "smooth", block: "center"});
        card.focus({preventScroll: true});
        return true;
    }

    function start() {
        if (locate()) return;
        const observer = new MutationObserver(() => {
            if (locate()) observer.disconnect();
        });
        observer.observe(document.body, {childList: true, subtree: true});
        window.setTimeout(() => observer.disconnect(), 20000);
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",start,{once:true});
    else start();
})();
