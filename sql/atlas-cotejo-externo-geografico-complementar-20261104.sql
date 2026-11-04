-- Complemento do cotejo geográfico documental. Não altera textos, coordenadas ou status.
BEGIN;
WITH evidence(map_id, url, justification) AS (
  VALUES
  (7,'https://www1.folha.uol.com.br/fsp/1994/6/17/cotidiano/27.html','Cronologia da Folha de 17/06/1994 situa a Escola Base no bairro Aclimação, São Paulo, em março de 1994. As acusações foram consideradas infundadas e não devem ser reproduzidas como fatos.'),
  (13,'https://www.ssp.sp.gov.br/noticia/60980','Secretaria de Segurança Pública de SP, 23/10/2026, localiza achados na capital e em cidades metropolitanas desde setembro de 2026. A fonte afirma que NÃO há ligação demonstrada entre os casos; o pino é regional, sem presumir série criminal.'),
  (20,'https://www.ajc.com/news/local/ajc-deja-news-emory-coed-mackle-kidnapped-buried-alive-1972/hzCthhhFuoMfTgaEomOXhM/','Atlanta Journal-Constitution situa o sequestro de Barbara Mackle em motel de Decatur, Geórgia, em dezembro de 1968. A área do cativeiro em Gwinnett é distinta.'),
  (35,'https://www.legacy.com/us/obituaries/skagitvalleyherald/name/hana-williams-obituary?id=47981361','Obituário contemporâneo publicado no Skagit Valley Herald em 15/05/2011 informa morte de Hana Williams em Sedro-Woolley em 12/05/2011. O obituário só comprova local/ano, não a dinâmica criminal.'),
  (36,'https://www.chron.com/news/houston-texas/article/dean-corll-candyman-houston-teenagers-21065223.php','Crônica investigativa do Houston Chronicle de 2025 situa a série de Dean Corll na região de Houston iniciada em 1970. O pino representa o centro urbano e não cada local de crime.'),
  (37,'https://www.latimes.com/california/story/2026-03-31/mother-killed-gabriel-fernandez-denied-resentencing-new-california-law','Los Angeles Times, 31/03/2026, documenta abusos contra Gabriel Fernandez no apartamento em Palmdale a partir de outubro de 2012, antes da morte em 2013.'),
  (52,'https://www.latimes.com/archives/la-xpm-1993-11-08-me-54494-story.html','Reportagem contemporânea do Los Angeles Times, 08/11/1993, identifica ataque a adolescentes no Halloween de 1993 em North Wilson Avenue, Pasadena, Califórnia.'),
  (53,'https://cortesuprema.gov.co/corte/index.php/2017/04/19/corte-suprema-encuentra-fundado-impedimento-en-caso-colmenares/','Corte Suprema da Colômbia identifica a morte de Luis Andrés Colmenares em Bogotá em 31/10/2010. Decisões divergiram sobre a causa da morte; não usar o pino como prova de homicídio.')
)
UPDATE public.case_atlas_locations AS l
SET review_reference='Fonte externa geográfica conferida (cidade/ano): '||e.url,
    review_note=left('Cotejo externo 2026-11-04: '||e.justification||' Referência anterior preservada na auditoria versionada. '||coalesce(l.review_note,''),1900),
    reviewed_at=now(),
    updated_at=now()
FROM evidence e
WHERE l.id=e.map_id
 AND l.review_reference LIKE 'Fonte geral citada no artigo%';
COMMIT;
SELECT count(*) as total,
 count(*) FILTER (WHERE review_reference LIKE 'Fonte externa geográfica conferida%') as verificadas,
 count(*) FILTER (WHERE review_reference LIKE 'Fonte geral citada no artigo%') as pendentes
FROM public.case_atlas_locations;