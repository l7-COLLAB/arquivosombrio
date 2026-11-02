-- Restrictive SELECT gate for publication dates. PostgreSQL combines
-- permissive RLS policies with OR; a permissive publication-time policy alone
-- does not prevent another public SELECT policy from exposing future chapters.
-- Retain the pre-existing admin exception for editorial operations.
DROP POLICY IF EXISTS novel_chapters_restrictive_release_gate ON public.novel_capitulos;
CREATE POLICY novel_chapters_restrictive_release_gate
ON public.novel_capitulos AS RESTRICTIVE
FOR SELECT TO anon, authenticated
USING (
  (SELECT public.is_arquivo_sombrio_admin())
  OR (
    status_publicacao = 'publicado'
    AND (publicado_em IS NULL OR publicado_em <= now())
    AND (agendado_para IS NULL OR agendado_para <= now())
    AND EXISTS (
      SELECT 1 FROM public.novels n
      WHERE n.id = novel_capitulos.novel_id
        AND n.status_publicacao = 'publicado'
        AND (n.publicado_em IS NULL OR n.publicado_em <= now())
    )
  )
);
