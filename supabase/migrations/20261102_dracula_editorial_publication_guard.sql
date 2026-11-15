
-- 2026-11-02 - Drácula: trava editorial de integridade para impedir publicação de rascunhos.
-- Aplicado primeiro ao projeto de produção pela migration dracula_integral_editorial_publication_guard.
-- Este arquivo espelha a proteção no controle de versão. Idempotente em nova execução.
-- Só afeta a novel cujo slug é 'dracula'.

CREATE TABLE IF NOT EXISTS private.dracula_revisao_editorial (
    novel_id uuid NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
    capitulo_numero integer NOT NULL CHECK (capitulo_numero BETWEEN 1 AND 27),
    estado text NOT NULL DEFAULT 'pendente' CHECK (estado IN ('pendente','em_revisao','aprovado')),
    cotejo_original_completo boolean NOT NULL DEFAULT false,
    passagem_integral_restituida boolean NOT NULL DEFAULT false,
    prova_literaria_concluida boolean NOT NULL DEFAULT false,
    hash_conteudo_aprovado text,
    observacoes text NOT NULL DEFAULT '',
    atualizado_em timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (novel_id, capitulo_numero),
    CONSTRAINT aprovacao_requires_evidence CHECK (
      estado <> 'aprovado' OR (
        cotejo_original_completo AND passagem_integral_restituida
        AND prova_literaria_concluida
        AND hash_conteudo_aprovado ~ '^[a-f0-9]{32}$'
      )
    )
);
REVOKE ALL ON TABLE private.dracula_revisao_editorial FROM PUBLIC, anon, authenticated;

INSERT INTO private.dracula_revisao_editorial(novel_id,capitulo_numero,estado,observacoes)
SELECT c.novel_id, c.numero,
       CASE WHEN c.numero=5 THEN 'em_revisao' ELSE 'pendente' END,
       CASE WHEN c.numero=5 THEN 'Primeiro cotejo e limpeza editorial efetuados; ainda requer aprovação independente e confirmação integral.'
            WHEN c.numero>=12 THEN 'Versão condensada; restituir passagens integralmente e cotejar com Dracula (1897).'
            ELSE 'Revisão de fidelidade integral com o original pendente.' END
FROM public.novel_capitulos c
WHERE c.novel_id = (SELECT id FROM public.novels WHERE slug='dracula' LIMIT 1)
ON CONFLICT (novel_id,capitulo_numero) DO NOTHING;

CREATE OR REPLACE FUNCTION private.guardar_publicacao_dracula()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE qtd integer; pendentes integer;
BEGIN
 IF NEW.slug <> 'dracula' OR NEW.status_publicacao IS DISTINCT FROM 'publicado' THEN RETURN NEW; END IF;
 SELECT count(*),
        count(*) FILTER (
          WHERE r.estado IS DISTINCT FROM 'aprovado'
            OR r.cotejo_original_completo IS DISTINCT FROM TRUE
            OR r.passagem_integral_restituida IS DISTINCT FROM TRUE
            OR r.prova_literaria_concluida IS DISTINCT FROM TRUE
            OR r.hash_conteudo_aprovado IS DISTINCT FROM md5(c.conteudo)
            OR c.conteudo ILIKE '%[FIM DO CAPÍTULO%'
            OR coalesce(length(trim(c.conteudo)),0) < 1000
        )
 INTO qtd,pendentes
 FROM public.novel_capitulos c
 LEFT JOIN private.dracula_revisao_editorial r
   ON r.novel_id=c.novel_id AND r.capitulo_numero=c.numero
 WHERE c.novel_id=NEW.id;
 IF qtd<>27 OR pendentes<>0 OR (
    SELECT count(DISTINCT numero) FROM public.novel_capitulos WHERE novel_id=NEW.id
  )<>27 THEN
   RAISE EXCEPTION 'Publicação bloqueada: Drácula exige 27 capítulos integrais, aprovados e com hash de conteúdo correspondente (aprovados: % de %).',
     (qtd-pendentes),qtd USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION private.guardar_capitulo_dracula()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE ok boolean;
BEGIN
 IF NEW.status_publicacao IS DISTINCT FROM 'publicado'
    OR NOT EXISTS (SELECT 1 FROM public.novels WHERE id=NEW.novel_id AND slug='dracula')
 THEN RETURN NEW; END IF;
 SELECT (
   r.estado='aprovado'
   AND r.cotejo_original_completo
   AND r.passagem_integral_restituida
   AND r.prova_literaria_concluida
   AND r.hash_conteudo_aprovado=md5(NEW.conteudo)
   AND NEW.conteudo NOT ILIKE '%[FIM DO CAPÍTULO%'
 ) INTO ok
 FROM private.dracula_revisao_editorial r
 WHERE r.novel_id=NEW.novel_id AND r.capitulo_numero=NEW.numero;
 IF ok IS DISTINCT FROM TRUE THEN
   RAISE EXCEPTION 'Publicação do capítulo % de Drácula bloqueada: falta aprovação editorial integral vinculada ao texto atual.',
    NEW.numero USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;

REVOKE ALL ON FUNCTION private.guardar_publicacao_dracula() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION private.guardar_capitulo_dracula() FROM PUBLIC,anon,authenticated;

DROP TRIGGER IF EXISTS trg_guardar_publicacao_dracula ON public.novels;
CREATE TRIGGER trg_guardar_publicacao_dracula
BEFORE INSERT OR UPDATE OF status_publicacao ON public.novels
FOR EACH ROW EXECUTE FUNCTION private.guardar_publicacao_dracula();

DROP TRIGGER IF EXISTS trg_guardar_capitulo_dracula ON public.novel_capitulos;
CREATE TRIGGER trg_guardar_capitulo_dracula
BEFORE INSERT OR UPDATE OF status_publicacao, conteudo ON public.novel_capitulos
FOR EACH ROW EXECUTE FUNCTION private.guardar_capitulo_dracula();
