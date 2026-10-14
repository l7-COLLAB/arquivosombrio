import { withSupabase } from "npm:@supabase/server";

const ALLOWED_CHOICES = new Set(["delete_all", "review_for_anonymization"]);

async function listFilesRecursively(
  client: any,
  bucket: string,
  path: string,
  depth = 0,
): Promise<string[]> {
  if (depth > 12) throw new Error("Estrutura de arquivos excede o limite permitido.");

  const files: string[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await client.storage
      .from(bucket)
      .list(path, { limit: 100, offset, sortBy: { column: "name", order: "asc" } });

    if (error) {
      if (/not found/i.test(error.message || "")) return files;
      throw error;
    }

    const entries = data || [];
    for (const entry of entries) {
      const fullPath = path ? `${path}/${entry.name}` : entry.name;
      if (entry.id) {
        files.push(fullPath);
      } else {
        files.push(...await listFilesRecursively(client, bucket, fullPath, depth + 1));
      }
    }

    if (entries.length < 100) break;
    offset += entries.length;
  }

  return files;
}

async function removeUserFiles(client: any, userId: string) {
  for (const bucket of ["avatars", "mural-private"]) {
    const paths = await listFilesRecursively(client, bucket, userId);
    for (let index = 0; index < paths.length; index += 100) {
      const { error } = await client.storage.from(bucket).remove(paths.slice(index, index + 100));
      if (error) throw error;
    }
  }
}

Deno.serve(
  withSupabase(
    { auth: "user" },
    async (req, ctx) => {
      if (req.method !== "POST") {
        return Response.json({ error: "Método não permitido." }, { status: 405 });
      }

      try {
        const userId = ctx.userClaims?.id;
        if (!userId) {
          return Response.json({ error: "Usuário não autenticado." }, { status: 401 });
        }

        const body = await req.json().catch(() => ({}));
        const contentChoice = String(body?.content_choice || "delete_all");
        if (!ALLOWED_CHOICES.has(contentChoice)) {
          return Response.json({ error: "Escolha de contribuições inválida." }, { status: 400 });
        }

        const { data: requestId, error: requestError } = await ctx.supabase
          .rpc("request_account_deletion", { p_content_choice: contentChoice });

        if (requestError || !requestId) {
          console.error("Erro ao registrar solicitação:", requestError);
          return Response.json(
            { error: "Não foi possível registrar a solicitação de exclusão." },
            { status: 500 },
          );
        }

        // Record the cleanup phase so interrupted requests are distinguishable and retryable.
        const markPhase = async (phase: string, status = "pending") => {
          const { error } = await ctx.supabaseAdmin
            .from("account_deletion_requests")
            .update({ status, admin_notes: "Exclusão automática: " + phase })
            .eq("id", requestId)
            .eq("user_id", userId);
          if (error) throw error;
        };
        try {
          await markPhase("limpeza de arquivos em andamento");
          await removeUserFiles(ctx.supabaseAdmin, userId);
          await markPhase("arquivos processados; aguardando exclusão da conta");
        } catch (cleanupError) {
          console.error("Falha na limpeza dos arquivos da conta:", cleanupError);
          // Keep request open; a subsequent authenticated request reuses the same request ID.
          try { await markPhase("falha na limpeza; nova tentativa necessária"); }
          catch (trackingError) { console.error("Falha ao registrar etapa de limpeza:", trackingError); }
          return Response.json(
            { error: "A solicitação foi registrada, mas a limpeza dos arquivos não foi concluída. Tente novamente.", request_id: requestId, retryable: true },
            { status: 503 },
          );
        }

        const { error: deleteError } =
          await ctx.supabaseAdmin.auth.admin.deleteUser(userId);

        if (deleteError) {
          console.error("Erro ao excluir usuário:", deleteError);
          try { await markPhase("falha ao remover autenticação; nova tentativa necessária"); }
          catch (trackingError) { console.error("Falha ao registrar etapa de autenticação:", trackingError); }
          return Response.json(
            { error: "A solicitação foi registrada, mas a conta ainda não pôde ser excluída. Tente novamente.", request_id: requestId, retryable: true },
            { status: 500 },
          );
        }

        const status = contentChoice === "delete_all" ? "completed" : "under_review";
        const update = {
          status,
          completed_at: contentChoice === "delete_all" ? new Date().toISOString() : null,
        };
        const { error: updateError } = await ctx.supabaseAdmin
          .from("account_deletion_requests")
          .update(update)
          .eq("id", requestId);

        if (updateError) {
          console.error("Conta excluída; falha ao atualizar solicitação:", updateError);
          // The user can no longer authenticate; surface a reconciliation requirement to administrators.
          return Response.json(
            { success: true, request_id: requestId, reconciliation_required: true, message: "A conta foi removida, mas o registro administrativo requer conferência." },
            { status: 200 },
          );
        }

        return Response.json({
          success: true,
          request_id: requestId,
          content_choice: contentChoice,
          message: "Conta excluída com sucesso.",
        });
      } catch (error) {
        console.error("Erro inesperado ao excluir conta:", error);
        return Response.json(
          { error: "Não foi possível concluir a exclusão da conta." },
          { status: 500 },
        );
      }
    },
  ),
);