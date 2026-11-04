"use strict";
/* Meu Arquivo — comunidade com publicação por consentimento e tags privadas. */
(function () {
    const actor = async () => {
        const client = await obterSupabaseMeuArquivo();
        const result = await client.auth.getUser();
        if (result.error || !result.data?.user) throw new Error("Entre na sua conta.");
        return { client, user: result.data.user };
    };
    const elem = (tag, text, cls) => {
        const el = document.createElement(tag);
        if (text != null) el.textContent = String(text);
        if (cls) el.className = cls;
        return el;
    };
    const action = (text, callback, secondary = true) => {
        const button = elem("button", text, "arquivo-button" + (secondary ? " arquivo-button-secondary" : ""));
        button.type = "button";
        button.addEventListener("click", async () => {
            if (button.disabled) return;
            button.disabled = true;
            try { await callback(); } catch (error) { console.error("Meu Arquivo:", error); window.alert(error.message || "Não foi possível concluir a ação."); }
            finally { if (button.isConnected) button.disabled = false; }
        });
        return button;
    };
    const containerModal = (title, desc) => {
        abrirModalArquivo(title, '<div id="arquivo-community-modal" class="arquivo-form" aria-live="polite"></div>');
        const host = document.getElementById("arquivo-community-modal");
        host.append(elem("p", desc, "arquivo-form-intro"));
        return host;
    };
    const verify = (response, text) => {
        if (response?.error) throw new Error(text || response.error.message || "Operação não concluída.");
        return response?.data;
    };
    const profileName = user => String(user?.user_metadata?.display_name || user?.user_metadata?.name || "Investigador").trim().slice(0, 80);
    const notifyError = (host, error) => {
        console.error(error);
        const p = elem("p", "Não foi possível concluir: " + (error?.message || "erro de conexão"), "arquivo-community-error");
        p.setAttribute("role", "alert");
        host.append(p);
    };

    async function privacy() {
        const host = containerModal("Privacidade e perfil público",
            "Seu perfil é privado por padrão. Publicá-lo permite que outros membros autenticados vejam apenas o nome e a biografia que você informar; observações, leituras, marcadores e murais continuam privados.");
        try {
            const { client, user } = await actor();
            const response = await client.from("member_profiles").select("user_id,display_name,bio,published")
                .eq("user_id", user.id).maybeSingle();
            const current = verify(response) || {};
            const form = elem("form", null, "arquivo-form");
            const nameLabel = elem("label", "Nome exibido na comunidade");
            const name = elem("input");
            name.id = "member-profile-display";
            name.maxLength = 80;
            name.required = true;
            name.value = current.display_name || profileName(user);
            nameLabel.htmlFor = name.id;

            const bioLabel = elem("label", "Biografia pública (opcional)");
            const bio = elem("textarea");
            bio.id = "member-profile-bio";
            bio.maxLength = 500;
            bio.value = current.bio || "";
            bioLabel.htmlFor = bio.id;

            const visibilityLabel = elem("label", "Visibilidade");
            const visibility = elem("select");
            visibility.id = "member-profile-visibility";
            for (const [value, title] of [["private","Privado"],["community","Visível apenas a membros autenticados"]]) {
                const option = elem("option", title);
                option.value = value;
                visibility.append(option);
            }
            visibility.value = current.published ? "community" : "private";
            visibilityLabel.htmlFor = visibility.id;

            const warning = elem("p",
                "A publicação exige sua decisão explícita. Bloquear uma pessoa impede que ela encontre seu perfil no diretório. Publicações anteriores do Fórum continuam sujeitas às regras próprias do Fórum.",
                "arquivo-community-note");
            const status = elem("p");
            status.setAttribute("role", "status");
            const save = elem("button", "Salvar configurações", "arquivo-button");
            save.type = "submit";
            form.append(nameLabel,name,bioLabel,bio,visibilityLabel,visibility,warning,status,save);
            host.append(form);

            form.addEventListener("submit", async e => {
                e.preventDefault();
                if (save.disabled) return;
                save.disabled = true;
                status.textContent = "Salvando…";
                try {
                    const publicar = visibility.value === "community";
                    const display = name.value.trim();
                    if (display.length < 2 || display.length > 80) throw new Error("Informe um nome de 2 a 80 caracteres.");
                    const currentPrefs = meuArquivoState.preferencias || {};
                    const prefs = {
                        user_id: user.id,
                        profile_visibility: publicar ? "community" : "private",
                        show_bio: publicar && Boolean(bio.value.trim()),
                        show_activity: false,
                        notify_comments: currentPrefs.notify_comments ?? true,
                        notify_replies: currentPrefs.notify_replies ?? true,
                        notify_case_updates: currentPrefs.notify_case_updates ?? true,
                        notify_admin: currentPrefs.notify_admin ?? true,
                        updated_at: new Date().toISOString()
                    };
                    const profile = {user_id:user.id, display_name:display, bio:bio.value.trim(), published:publicar, updated_at:new Date().toISOString()};
                    const savePrefs = async () => {
                        const value = verify(await client.from("user_preferences").upsert(prefs,{onConflict:"user_id"}).select().single());
                        meuArquivoState.preferencias = value;
                    };
                    const saveProfile = async () => verify(await client.from("member_profiles")
                        .upsert(profile,{onConflict:"user_id"}).select().single());
                    // Ao esconder, a remoção da exposição vem antes de qualquer preferência.
                    // Ao tornar público, a publicação ocorre apenas após registrar o consentimento.
                    if (publicar) { await savePrefs(); await saveProfile(); }
                    else { await saveProfile(); await savePrefs(); }
                    status.textContent = publicar ? "Perfil publicado para membros." : "Perfil privado confirmado.";
                } catch(error) {
                    console.error("Falha ao salvar privacidade:", error);
                    status.textContent = "Não foi possível concluir. " + error.message;
                } finally { save.disabled = false; }
            });
        } catch(error) { notifyError(host,error); }
    }

    async function follows() {
        const host = containerModal("Investigadores seguidos", "Acompanhe os perfis que optaram por aparecer na comunidade.");
        try {
            const {client,user}=await actor();
            const entries=verify(await client.from("user_follows")
                .select("id,followed_id,display_name").eq("follower_id",user.id).order("created_at",{ascending:false})) || [];
            if (!entries.length) {host.append(elem("p","Você ainda não segue investigadores."));return;}
            for(const follow of entries){
                const row=elem("article",null,"arquivo-community-person");
                row.append(elem("strong",follow.display_name||"Investigador"));
                row.append(action("Deixar de seguir", async () => {
                    verify(await client.from("user_follows").delete().eq("id",follow.id).eq("follower_id",user.id));
                    await carregarSeguidosUsuario();
                    row.remove();
                }));
                host.append(row);
            }
        }catch(error){notifyError(host,error);}
    }

    async function blocks() {
        const host=containerModal("Usuários bloqueados","Você pode remover um bloqueio a qualquer momento. O bloqueio encerra acompanhamentos entre as duas contas.");
        try{
            const {client,user}=await actor();
            const entries=verify(await client.from("user_blocks")
                .select("id,blocked_name,blocked_user_id").eq("user_id",user.id).order("created_at",{ascending:false}))||[];
            if(!entries.length){host.append(elem("p","Nenhum usuário bloqueado."));return;}
            for(const block of entries){
                const row=elem("article",null,"arquivo-community-person");
                row.append(elem("strong",block.blocked_name||"Usuário bloqueado"));
                row.append(action("Desbloquear",async()=>{
                    verify(await client.from("user_blocks").delete().eq("id",block.id).eq("user_id",user.id));
                    await carregarBloqueadosUsuario();
                    row.remove();
                }));
                host.append(row);
            }
        }catch(error){notifyError(host,error);}
    }

    async function directory() {
        const host=containerModal("Descobrir investigadores",
            "Somente membros que publicaram voluntariamente seu perfil aparecem aqui. Seus bloqueios são aplicados à consulta pelo banco de dados.");
        try{
            const {client,user}=await actor();
            const [profilesResponse,followsResponse,blocksResponse]=await Promise.all([
                client.from("member_profiles").select("user_id,display_name,bio,published").eq("published",true).limit(50),
                client.from("user_follows").select("followed_id").eq("follower_id",user.id),
                client.from("user_blocks").select("blocked_user_id").eq("user_id",user.id)
            ]);
            const profiles=verify(profilesResponse), follows=verify(followsResponse), blocks=verify(blocksResponse);
            const followed=new Set((follows||[]).map(x=>x.followed_id));
            const blocked=new Set((blocks||[]).map(x=>x.blocked_user_id));
            const people=(profiles||[]).filter(p=>p.user_id!==user.id&&!blocked.has(p.user_id));
            if(!people.length){host.append(elem("p","Ainda não há perfis públicos disponíveis para sua conta."));return;}
            for(const p of people){
                const row=elem("article",null,"arquivo-community-person");
                row.append(elem("strong",p.display_name));
                if(p.bio)row.append(elem("p",p.bio));
                const controls=elem("div",null,"arquivo-community-actions");
                const followedNow=followed.has(p.user_id);
                controls.append(action(followedNow?"Deixar de seguir":"Seguir",async()=>{
                    if(followed.has(p.user_id)){
                        verify(await client.from("user_follows").delete()
                            .eq("follower_id",user.id).eq("followed_id",p.user_id));
                        followed.delete(p.user_id);
                    }else{
                        verify(await client.from("user_follows").insert({
                            follower_id:user.id,followed_id:p.user_id,display_name:p.display_name
                        }));
                        followed.add(p.user_id);
                    }
                    await carregarSeguidosUsuario();
                    const buttons=controls.querySelectorAll("button");
                    if(buttons[0])buttons[0].textContent=followed.has(p.user_id)?"Deixar de seguir":"Seguir";
                }));
                controls.append(action("Bloquear",async()=>{
                    if(!window.confirm("Bloquear este investigador? O acompanhamento entre vocês será interrompido."))return;
                    verify(await client.from("user_blocks").insert({
                        user_id:user.id,blocked_user_id:p.user_id,blocked_name:p.display_name
                    }));
                    await Promise.all([carregarBloqueadosUsuario(),carregarSeguidosUsuario()]);
                    row.remove();
                }));
                row.append(controls);
                host.append(row);
            }
        }catch(error){notifyError(host,error);}
    }

    async function shareTheory() {
        const host=containerModal("Compartilhar uma teoria",
            "Uma hipótese pessoal não é prova nem conclusão oficial. Envie apenas textos respeitosos, sem acusações não verificadas; sua teoria ficará aguardando revisão editorial, sem publicação automática.");
        try{
            const {client,user}=await actor();
            const theories=verify(await client.from("user_theories").select("id,title,content")
                .eq("user_id",user.id).order("created_at",{ascending:false}).limit(50))||[];
            if(!theories.length){host.append(elem("p","Crie primeiro uma teoria privada em seu Caderno."));return;}
            const form=elem("form",null,"arquivo-form");
            const label=elem("label","Teoria privada a enviar");
            const select=elem("select");
            for(const theory of theories){
                const option=elem("option",theory.title); option.value=theory.id; select.append(option);
            }
            const preview=elem("p",null,"arquivo-community-note");
            const consent=elem("label");
            const check=elem("input");
            check.type="checkbox";check.required=true;
            consent.append(check,document.createTextNode(" Li e concordo que este texto será enviado para revisão e poderá ser exibido publicamente somente após aprovação."));
            const status=elem("p");status.setAttribute("role","status");
            const submit=elem("button","Enviar para análise editorial","arquivo-button");
            submit.type="submit";
            const change=()=>{
                const t=theories.find(x=>x.id===select.value);
                preview.textContent=t?String(t.content||"").slice(0,1000):"";
            };
            select.addEventListener("change",change);change();
            form.append(label,select,preview,consent,status,submit);host.append(form);
            form.addEventListener("submit",async e=>{
                e.preventDefault();
                if(!check.checked||submit.disabled)return;
                const t=theories.find(x=>x.id===select.value);
                if(!t)return;
                if(!window.confirm("Enviar esta teoria para revisão editorial? Ela não ficará pública agora."))return;
                submit.disabled=true;
                try{
                    const texto=String(t.content||"").trim();
                    if(!texto||texto.length>8000)throw new Error("Texto inválido.");
                    const posted=await client.from("forum_posts").insert({
                        user_id:user.id,
                        author_name:profileName(user),
                        title:("Hipótese pessoal: "+String(t.title||"")).slice(0,140),
                        content:"HIPÓTESE PESSOAL — NÃO VERIFICADA.\n\n"+texto,
                        category:"Teorias",
                        status:"pendente"
                    }).select("id").single();
                    verify(posted);
                    status.textContent="Enviado. O texto não está público e aguarda avaliação editorial.";
                    submit.disabled=true;
                }catch(error){console.error(error);status.textContent="Não foi possível enviar: "+error.message;submit.disabled=false;}
            });
        }catch(error){notifyError(host,error);}
    }

    async function tags(itemType,itemId,itemTitle) {
        const host=containerModal("Marcadores do conteúdo",String(itemTitle||"Registro")+" — selecione as etiquetas para organizar este item.");
        try{
            const {client,user}=await actor();
            const [tagsResponse,assignedResponse]=await Promise.all([
                client.from("user_tags").select("id,name").eq("user_id",user.id).order("name",{ascending:true}),
                client.from("user_item_tags").select("id,tag_id").eq("user_id",user.id)
                    .eq("item_type",itemType).eq("item_id",String(itemId))
            ]);
            const all=verify(tagsResponse)||[];
            const saved=new Map((verify(assignedResponse)||[]).map(x=>[x.tag_id,x.id]));
            if(!all.length){host.append(elem("p","Crie marcadores na seção Investigações antes de organizar um conteúdo."));return;}
            const status=elem("p");status.setAttribute("role","status");
            for(const tag of all){
                const row=elem("label",null,"arquivo-community-tag");
                const check=elem("input");check.type="checkbox";check.checked=saved.has(tag.id);
                row.append(check,document.createTextNode(" "+tag.name));host.append(row);
                check.addEventListener("change",async()=>{
                    check.disabled=true;
                    try{
                        if(check.checked){
                            verify(await client.from("user_item_tags").insert({
                                user_id:user.id,tag_id:tag.id,item_type:itemType,item_id:String(itemId)
                            }));
                            saved.set(tag.id,true);
                        }else{
                            verify(await client.from("user_item_tags").delete()
                                .eq("user_id",user.id).eq("tag_id",tag.id)
                                .eq("item_type",itemType).eq("item_id",String(itemId)));
                            saved.delete(tag.id);
                        }
                        status.textContent="Marcadores atualizados.";
                    }catch(error){
                        check.checked=!check.checked;
                        status.textContent="Falha ao salvar o marcador: "+error.message;
                    }finally{check.disabled=false;}
                });
            }
            host.append(status);
        }catch(error){notifyError(host,error);}
    }

    async function viewTag(tagId) {
        const tag=meuArquivoState.marcadores.find(x=>String(x.id)===String(tagId));
        if(!tag)return;
        const host=containerModal("Conteúdos do marcador",tag.name||"Marcador");
        try{
            const {client,user}=await actor();
            const assignments=verify(await client.from("user_item_tags")
                .select("item_type,item_id").eq("user_id",user.id).eq("tag_id",tag.id))||[];
            if(!assignments.length){host.append(elem("p","Nenhum conteúdo associado a este marcador."));return;}
            for(const item of assignments){
                let name="Registro não disponível";
                let href="";
                if(item.item_type==="dossier"){
                    const dossier=meuArquivoState.dossies.find(x=>String(x.id)===String(item.item_id));
                    if(dossier){
                        name=dossier.title||"Dossiê";
                        href=normalizarLinkMeuArquivo(dossier.target_url||("caso.html?id="+encodeURIComponent(dossier.case_id)));
                    }
                }else if(item.item_type==="favorite"){
                    const favorite=meuArquivoState.favoritos.find(x=>String(x.id)===String(item.item_id));
                    if(favorite){name=favorite.title||"Favorito";href=normalizarLinkMeuArquivo(favorite.target_url);}
                }else if(item.item_type==="novel"){
                    const tagButton=Array.from(document.querySelectorAll('[data-archive-tag="novel"]'))
                        .find(button=>button.dataset.tagItemId===String(item.item_id));
                    const link=tagButton?.closest(".novel-library-entry")?.querySelector("a.novel-library-item");
                    if(link){name=link.querySelector("strong")?.textContent||"Novel";href=link.getAttribute("href")||"";}
                }
                const row=elem("article",null,"arquivo-community-person");
                if(href&&href!=="#"){
                    const link=elem("a",name);link.href=href;row.append(link);
                }else row.append(elem("span",name));
                host.append(row);
            }
        }catch(error){notifyError(host,error);}
    }

    function install() {
        const following=document.getElementById("abrir-seguidos");
        if(following){
            const browse=action("Descobrir investigadores",directory);
            browse.id="descobrir-investigadores";
            browse.style.marginTop=".55rem";
            following.insertAdjacentElement("afterend",browse);
        }
        const theorySection=document.getElementById("compartilhar-teoria");
        if(theorySection){
            const share=action("Enviar teoria para revisão",shareTheory,false);
            share.id="abrir-compartilhamento-teoria";
            theorySection.querySelector(".compartilhar-teoria-content")?.append(share);
        }

        // Captura impede que mensagens-legado substituam os fluxos reais.
        document.addEventListener("click",event=>{
            const target=event.target.closest("button,[data-profile-action]");
            if(!target)return;
            const id=target.id, profileAction=target.dataset.profileAction;
            let handler=null;
            if(id==="configurar-privacidade"||id==="preferencias-abrir-privacidade"||profileAction==="privacy")handler=privacy;
            else if(id==="abrir-seguidos")handler=follows;
            else if(id==="abrir-bloqueados")handler=blocks;
            else if(id==="abrir-compartilhamento-teoria")handler=shareTheory;
            if(handler){
                event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
                void handler();
                return;
            }
            if(target.dataset.viewTag){
                event.preventDefault();event.stopPropagation();
                void viewTag(target.dataset.viewTag);
                return;
            }
            if(target.dataset.archiveTag){
                event.preventDefault();event.stopPropagation();
                const kind=target.dataset.archiveTag, itemId=target.dataset.tagItemId;
                const item=kind==="dossier"?meuArquivoState.dossies.find(x=>String(x.id)===itemId)
                    :kind==="favorite"?meuArquivoState.favoritos.find(x=>String(x.id)===itemId):null;
                const title=kind==="novel"?
                    target.closest(".novel-library-entry")?.querySelector("strong")?.textContent:
                    item?.title;
                void tags(kind,itemId,title||"Conteúdo");
            }
        },true);

        const enhance=()=>{
            for(const [index,card] of Array.from(document.querySelectorAll("#lista-marcadores .marcador-card")).entries()){
                if(card.querySelector("[data-view-tag]"))continue;
                const tag=meuArquivoState.marcadores[index];
                if(!tag)continue;
                const view=elem("button","Ver conteúdos","arquivo-button arquivo-button-secondary");
                view.type="button";
                view.dataset.viewTag=String(tag.id);
                card.querySelector(".arquivo-form-actions")?.prepend(view);
            }
            for(const button of document.querySelectorAll("#lista-meus-dossies [data-arquivo-item-id]")){
                const article=button.closest(".arquivo-item-card");
                if(!article||article.querySelector("[data-archive-tag]"))continue;
                const tagButton=elem("button","Marcadores","arquivo-button arquivo-button-secondary");
                tagButton.type="button";tagButton.dataset.archiveTag="dossier";
                tagButton.dataset.tagItemId=button.dataset.arquivoItemId;
                tagButton.style.marginRight=".45rem";
                button.before(tagButton);
            }
            for(const remove of document.querySelectorAll("[data-remove-favorite]")){
                const parent=remove.closest(".arquivo-favorite-actions");
                if(!parent||parent.querySelector("[data-archive-tag]"))continue;
                const tagButton=elem("button","Marcadores","arquivo-button arquivo-button-secondary");
                tagButton.type="button";tagButton.dataset.archiveTag="favorite";
                tagButton.dataset.tagItemId=remove.dataset.removeFavorite;
                remove.before(tagButton);
            }
        };
        const panel=document.querySelector(".arquivo-dashboard");
        if(panel){
            const observer=new MutationObserver(enhance);
            observer.observe(panel,{childList:true,subtree:true});
            enhance();
        }
    }
    window.ArquivoComunidade={privacy,directory,follows,blocks,shareTheory,tags};
    if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});
    else install();
})();
