-- MIANI: histórico de versões por capítulo, sem criar cadastros paralelos de livros.
-- Manter manuscritos originais; versões alternativas ficam ligadas ao capítulo canônico.
ALTER TABLE public.editorial_books
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

CREATE TABLE IF NOT EXISTS public.editorial_chapter_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL REFERENCES public.editorial_chapters(id) ON DELETE RESTRICT,
  version_label text NOT NULL DEFAULT 'Versão anterior'
    CHECK (char_length(version_label) BETWEEN 1 AND 180),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 250),
  body text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'rascunho'
    CHECK (status IN ('planejado','a_importar','rascunho','revisao')),
  source_kind text NOT NULL DEFAULT 'historica'
    CHECK (source_kind IN ('historica','alternativa')),
  source_chapter_id uuid UNIQUE REFERENCES public.editorial_chapters(id) ON DELETE RESTRICT,
  original_updated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS editorial_chapter_versions_chapter_date_idx
  ON public.editorial_chapter_versions (chapter_id,created_at DESC);

ALTER TABLE public.editorial_chapter_versions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.editorial_chapter_versions FROM public, anon, authenticated;
GRANT SELECT, INSERT ON public.editorial_chapter_versions TO authenticated;

CREATE POLICY editorial_chapter_versions_admin_select ON public.editorial_chapter_versions
  FOR SELECT TO authenticated
  USING ((SELECT public.is_arquivo_sombrio_admin()));
CREATE POLICY editorial_chapter_versions_admin_insert ON public.editorial_chapter_versions
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_arquivo_sombrio_admin()));

-- Uma edição autenticada e autorizada salva automaticamente o estado anterior.
-- SECURITY INVOKER mantém as mesmas políticas RLS do editor.
CREATE OR REPLACE FUNCTION public.capture_editorial_chapter_version()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.editorial_chapter_versions
    (chapter_id,version_label,title,body,status,source_kind,original_updated_at)
  VALUES
    (OLD.id,'Antes da edição de ' || to_char(now() AT TIME ZONE 'America/Sao_Paulo','DD/MM/YYYY HH24:MI'),
     OLD.title,OLD.body,OLD.status,'historica',OLD.updated_at);
  RETURN NEW;
END;
$$;

CREATE TRIGGER editorial_chapter_version_on_change
BEFORE UPDATE OF title,body,status ON public.editorial_chapters
FOR EACH ROW
WHEN (OLD.title IS DISTINCT FROM NEW.title
      OR OLD.body IS DISTINCT FROM NEW.body
      OR OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.capture_editorial_chapter_version();

-- Importar a redação alternativa usando a identidade de livro/capítulo, não UUIDs de ambiente.
-- A versão original do capítulo 9 permanece inalterada.
INSERT INTO public.editorial_chapter_versions
  (chapter_id,version_label,title,body,status,source_kind,source_chapter_id,original_updated_at)
SELECT main_chapter.id,
       'V01 alternativa · 17–18/10/2023 (não canônica)',
       alt_chapter.title,
       alt_chapter.body,
       alt_chapter.status,
       'alternativa',
       alt_chapter.id,
       alt_chapter.updated_at
FROM public.editorial_books main_book
JOIN public.editorial_chapters main_chapter
  ON main_chapter.book_id=main_book.id AND main_chapter.chapter_number=10
JOIN public.editorial_books alt_book
  ON alt_book.slug='miani-nora-versoes-alternativas'
JOIN public.editorial_chapters alt_chapter
  ON alt_chapter.book_id=alt_book.id AND alt_chapter.chapter_number=10
WHERE main_book.slug='miani-romance-nora-whitmore'
ON CONFLICT (source_chapter_id) DO NOTHING;

-- Arquivar o cadastro auxiliar, sem apagar as cópias originais.
-- O seletor do editor deve listar somente archived_at IS NULL.
UPDATE public.editorial_books
SET archived_at=COALESCE(archived_at,now()), updated_at=now()
WHERE slug='miani-nora-versoes-alternativas';