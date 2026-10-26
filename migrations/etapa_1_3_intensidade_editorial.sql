-- Etapa 1.3: metadados editoriais de sensibilidade.
-- Todas as classificações começam NULL: nenhuma atribuição automática.
-- Executar antes de ativar a nova busca no ambiente público.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['Casos','casos_diarios','pericias','lendas','creepypastas'] LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS intensidade_conteudo text',t);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS avisos_conteudo text[] DEFAULT ARRAY[]::text[]',t);
    IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'ck_'||lower(t)||'_intensidade_conteudo') THEN
      EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I CHECK (intensidade_conteudo IS NULL OR intensidade_conteudo IN (''leve'',''moderado'',''pesado'',''restrito''))',t,'ck_'||lower(t)||'_intensidade_conteudo');
    END IF;
  END LOOP;
END $$;
-- Conferir políticas RLS existentes antes de integrar edição pela V2.
