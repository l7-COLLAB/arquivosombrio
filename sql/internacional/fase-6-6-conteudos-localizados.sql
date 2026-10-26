-- FASE 6.6 — PROPOSTA PARA REVISÃO. NÃO APLICAR EM PRODUÇÃO SEM QA.
-- Fonte de verdade: public."Casos" (dossiês), public.casos_diarios (Garimpo).
-- Não modifica nem migra dados das tabelas brasileiras.
BEGIN;

CREATE TABLE IF NOT EXISTS public.international_content_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL CHECK (source_type IN ('dossie','garimpo')),
  dossier_id bigint REFERENCES public."Casos"(id) ON DELETE RESTRICT,
  daily_case_id bigint REFERENCES public.casos_diarios(id) ON DELETE RESTRICT,
  locale text NOT NULL CHECK (locale IN ('en-US','es-ES','fr-FR')),
  editorial_status text NOT NULL DEFAULT 'draft'
    CHECK (editorial_status IN ('draft','in_review','approved','published','archived')),
  source_updated_at timestamptz NOT NULL,
  source_revision text NOT NULL CHECK (length(trim(source_revision)) > 0),
  translated_title text NOT NULL DEFAULT '',
  translated_summary text NOT NULL DEFAULT '',
  body_blocks jsonb NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(body_blocks)='array'),
  translated_sources jsonb NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(translated_sources)='array'),
  translated_slug text,
  translator_user_id uuid REFERENCES auth.users(id),
  reviewer_user_id uuid REFERENCES auth.users(id),
  fact_checked boolean NOT NULL DEFAULT false,
  image_rights_checked boolean NOT NULL DEFAULT false,
  legal_review_checked boolean NOT NULL DEFAULT false,
  approved_at timestamptz,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (source_type='dossie' AND dossier_id IS NOT NULL AND daily_case_id IS NULL)
    OR (source_type='garimpo' AND daily_case_id IS NOT NULL AND dossier_id IS NULL)
  ),
  CHECK (translated_slug IS NULL OR translated_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CHECK (editorial_status <> 'published' OR (
    length(trim(translated_title)) > 2
    AND length(trim(translated_summary)) > 19
    AND jsonb_array_length(body_blocks)>0
    AND jsonb_array_length(translated_sources)>0
    AND fact_checked AND image_rights_checked AND legal_review_checked
    AND translator_user_id IS NOT NULL AND reviewer_user_id IS NOT NULL
    AND approved_at IS NOT NULL AND published_at IS NOT NULL
    AND translated_slug IS NOT NULL
  ))
);

CREATE UNIQUE INDEX IF NOT EXISTS international_content_dossier_locale_unique
 ON public.international_content_versions (dossier_id,locale) WHERE dossier_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS international_content_daily_locale_unique
 ON public.international_content_versions (daily_case_id,locale) WHERE daily_case_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS international_content_locale_slug_unique
 ON public.international_content_versions (locale,translated_slug) WHERE translated_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS international_content_review_queue
 ON public.international_content_versions (editorial_status,updated_at DESC);

ALTER TABLE public.international_content_versions ENABLE ROW LEVEL SECURITY;
-- Nesta etapa, nenhum SELECT/INSERT/UPDATE/DELETE público. Mesmo itens marcados
-- 'published' permanecem privados até haver rotas internacionais completas.
REVOKE ALL ON TABLE public.international_content_versions FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.international_content_versions TO authenticated;

DROP POLICY IF EXISTS international_editor_select ON public.international_content_versions;
CREATE POLICY international_editor_select ON public.international_content_versions
FOR SELECT TO authenticated
USING ((select public.is_arquivo_sombrio_admin()));

DROP POLICY IF EXISTS international_editor_insert ON public.international_content_versions;
CREATE POLICY international_editor_insert ON public.international_content_versions
FOR INSERT TO authenticated
WITH CHECK ((select public.is_arquivo_sombrio_admin()) AND editorial_status <> 'published');

DROP POLICY IF EXISTS international_editor_update ON public.international_content_versions;
CREATE POLICY international_editor_update ON public.international_content_versions
FOR UPDATE TO authenticated
USING ((select public.is_arquivo_sombrio_admin()))
WITH CHECK ((select public.is_arquivo_sombrio_admin()) AND editorial_status <> 'published');

DROP POLICY IF EXISTS international_editor_delete ON public.international_content_versions;
CREATE POLICY international_editor_delete ON public.international_content_versions
FOR DELETE TO authenticated
USING ((select public.is_arquivo_sombrio_admin()) AND editorial_status='draft');

COMMENT ON TABLE public.international_content_versions IS
'Fase 6.6: traduções editoriais administradas; sem acesso público ou publicação automática.';

COMMIT;
