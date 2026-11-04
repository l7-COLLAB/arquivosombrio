-- Substituir duas fontes de localização cuja acessibilidade não pôde ser confirmada.
-- Verificadas fontes textuais alternativas em 04/11/2026.
-- Não altera ano, município, coordenadas, status de publicação nem narrativas.
BEGIN;
UPDATE public.case_atlas_locations
SET review_reference='Fonte externa geográfica conferida (cidade/ano): https://www.bt.no/nyheter/lokalt/i/d9M7A/har-isdalskvinnens-dna-profil',
    review_note='Fonte substituta acessível: Bergens Tidende, 01/11/2016. Registra descoberta do corpo em Isdalen, Bergen, em 29/11/1970. Não comprova identidade, assassinato ou hipótese de espionagem. Substitui referência anterior de vídeo não verificável. ',
    updated_at=now()
WHERE id=15 AND city='Bergen' AND event_year=1970;
UPDATE public.case_atlas_locations
SET review_reference='Fonte externa geográfica conferida (cidade/ano): https://www.koaa.com/news/covering-colorado/2018/11/19/chris-watts-formal-sentencing-set-to-happen-monday-morning/',
    review_note='Fonte substituta acessível: KOAA News 5 Colorado, 19/11/2018, entrevista e cobertura de sentença. Identifica Frederick, Colorado, e os homicídios de 13/08/2018. A antiga URL da Promotoria de Weld apresentou bloqueio HTTP 403 para consulta automatizada. ',
    updated_at=now()
WHERE id=21 AND dossier_id=11 AND city='Frederick' AND event_year=2018;
UPDATE public."Casos"
SET documentos=(
  SELECT coalesce(jsonb_agg(
      CASE WHEN doc->>'url'='https://www.weldda.com/News/2018-News/Chris-Watts-Admits-to-Killing-Pregnant-Wife-and-Two-Young-Children'
        THEN jsonb_build_object(
         'titulo','KOAA News 5 Colorado — Chris Watts, sentença em 2018',
         'url','https://www.koaa.com/news/covering-colorado/2018/11/19/chris-watts-formal-sentencing-set-to-happen-monday-morning/',
         'tipo','reportagem local contemporânea',
         'nota','Referência verificável de Frederick, Colorado, e 13 de agosto de 2018; não substitui as demais fontes oficiais do processo.',
         'exibicao','cartao_documento')
        ELSE doc END),'[]'::jsonb)
  FROM jsonb_array_elements(coalesce(documentos,'[]'::jsonb)) AS doc
)
WHERE id=11 AND documentos::text LIKE '%www.weldda.com/News/2018-News/Chris-Watts%';
COMMIT;
SELECT id,review_reference FROM public.case_atlas_locations WHERE id IN (15,21) ORDER BY id;
