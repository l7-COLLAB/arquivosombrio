-- Cotejo externo conclusivo: cidade e ano; sem pressupor autoria, morte ou conexões não demonstradas.
BEGIN;
WITH evidence(map_id, source_url, justification) AS (
 VALUES
 (15,'https://www.youtube.com/watch?v=KnC_kBf2tCk','NRK, emissora pública norueguesa, afirma que uma mulher foi encontrada em Isdalen, região de Bergen, em 29/11/1970. A causa e identidade permanecem debatidas.'),
 (16,'https://www.schleswig-holstein.de/DE/landesregierung/ministerien-behoerden/POLIZEI/Fahndungen/fahndungen_vermisstePersonen/pdIZ_LarsMittank_/pdIZ_LarsMittank','Polícia estadual alemã informa local do desaparecimento como aeroporto de Varna, Bulgária, em 08/07/2014. Não sugere crime comprovado.'),
 (23,'https://globalnews.ca/news/231973/woman-who-survived-attack-on-picktons-farm-to-testify-at-public-inquiry-5/','Canadian Press documenta ataque ocorrido em março de 1997 na propriedade de Robert Pickton em Port Coquitlam; o ano de 1997 não deve ser confundido com data judicialmente comprovada de um dos seis homicídios.'),
 (33,'https://abcnews.com/amp/US/family-missing-north-carolina-teen-report-missing-years/story?id=19883502','ABC News/NBC? 2013 atribui à polícia de Rowan County o último avistamento de Erica Parsons na residência em Salisbury em novembro de 2011. Foi notificado desaparecimento somente em 2013.'),
 (34,'https://www.cbsnews.com/news/arrest-heats-up-1990-texas-cold-case/','CBS/AP de outubro de 2009 situa o sequestro de Jennifer Schuett em Dickinson, Texas, em 1990; distingue local de sequestro do local onde foi abandonada.'),
 (40,'https://tmg-uk.org/past-campaigns/victoria-climbie','The Monitoring Group documenta permanência de Victoria Climbié em bairros do norte de Londres em 1999 e morte em fevereiro de 2000. Londres é a localidade ampla, não endereço exato.'),
 (41,'https://www.upi.com/Archives/1988/05/12/Second-skull-found-at-house-identified/1067579412800/','UPI contemporânea situa crimes e buscas da polícia na casa de Berdella em Kansas City; menciona Gerald Howell desaparecido em 1984. Ano inicial é aproximado ao período narrado no artigo.'),
 (47,'https://www.ksl.com/article/news/us/sheriff-woman-accused-of-killing-mom-may-have-faked-illness/35105950','Associated Press de 16/06/2015 confirma corpo de Dee Dee Blanchard localizado em residência da região de Springfield em junho de 2015. Centro da cidade é aproximação metropolitana.'),
 (49,'https://www.chron.com/news/houston-texas/houston/article/Looking-back-at-Houston-s-Candyman-murders-10427611.php','Houston Chronicle documenta Halloween de 1974: o grupo recolheu doces em Pasadena, mas Timothy ingeriu o doce envenenado posteriormente em Deer Park. Pino Pasadena refere-se à coleta, não ao local da morte.'),
 (50,'https://www.explorevenango.com/local/2018/05/09/retired-fbi-agents-long-career-began-with-shauna-howe-case-536756/','Reportagem local com depoimento de ex-agente do FBI situa o sequestro de Shauna Howe em Oil City em 27/10/1992. A descoberta do corpo ocorreu em área rural de Rockland Township.')
)
UPDATE public.case_atlas_locations l SET
 review_reference='Fonte externa geográfica conferida (cidade/ano): '||e.source_url,
 review_note=left('Cotejo externo 2026-11-04: '||e.justification||' '||coalesce(l.review_note,''),1900),
 reviewed_at=now(),updated_at=now()
FROM evidence e
WHERE l.id=e.map_id AND l.review_reference LIKE 'Fonte geral citada no artigo%';
-- Representa a área de Springfield: residência descrita como próxima à cidade, não dentro do município.
UPDATE public.case_atlas_locations SET location_precision='metro',updated_at=now()
WHERE id=47 and city='Springfield' and location_precision='city';
COMMIT;
SELECT count(*) as total,
 count(*) filter(where review_reference like 'Fonte externa geográfica conferida%') as verificadas,
 count(*) filter(where review_reference like 'Fonte geral citada no artigo%') as restantes
 FROM public.case_atlas_locations;