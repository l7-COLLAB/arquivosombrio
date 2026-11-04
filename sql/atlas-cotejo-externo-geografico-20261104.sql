-- Cotejo geográfico documental com fontes públicas externas (04/11/2026).
-- Pinos são centros urbanos aproximados; não foram alterados.
-- Fontes institucionais, judiciais ou imprensa contemporânea usadas apenas para confirmar município e ano.
BEGIN;
WITH confirmed(map_id, url, justification) AS (
  VALUES
  (2,'https://law.justia.com/cases/kansas/supreme-court/2018/108625.html','Decisão da Suprema Corte do Kansas identifica investigação em Topeka em 2002.'),
(5,'https://law.justia.com/cases/california/supreme-court/4th/3/435.html','Decisão da Suprema Corte da Califórnia situa o homicídio em Beverly Hills em 20/08/1989.'),
(6,'https://www.fbi.gov/history/field-office-histories/kansascity','Histórico institucional FBI confirma Wichita e início dos homicídios do BTK em 1974.'),
(8,'https://www.minicounsel.ca/scj/2014/4056','Decisão da Suprema Corte de Ontário situa ataque à família Pan em Markham em novembro de 2010.'),
(9,'https://indyencyclopedia.org/sylvia-likens-murder-case/','Enciclopédia histórica de Indianápolis situa o caso na cidade em 1965.'),
(10,'https://www.justice.gov/archives/opa/pr/justice-department-releases-report-its-critical-incident-review-response-mass-shooting-robb','Departamento de Justiça dos EUA confirma ocorrência em Uvalde em 24/05/2022.'),
(11,'https://toronto.citynews.ca/2018/02/23/timeline-of-events-in-the-case-of-alleged-toronto-serial-killer-bruce-mcarthur/','Cronologia Canadian Press registra desaparecimentos em Toronto desde setembro de 2010.'),
(12,'https://hudoc.echr.coe.int/eng?i=001-172660','Julgamento do TEDH sobre Beslan confirma a tomada de reféns em setembro de 2004.'),
(14,'https://oac.cdlib.org/findaid/ark:/13030/c8b85fn5','Acervo do Centro de História de Sacramento situa crimes associados a Puente em Sacramento de 1982 a 1988.'),
(17,'https://www.latimes.com/local/lanow/la-xpm-2013-jun-20-la-me-ln-canadian-tourist-elisa-lams-death-ruled-accidental-20130620-story.html','Los Angeles Times registra o caso Elisa Lam em hotel de Los Angeles, em 2013.'),
(18,'https://www.the-independent.com/news/uk/stabbing-haunts-the-safe-beauty-spot-1533636.html','Cobertura contemporânea localiza o homicídio de Rachel Nickell no Wimbledon Common, Londres, em julho de 1992.'),
(19,'https://law.justia.com/cases/california/court-of-appeal/2015/b241172.html','Acórdão People v. Lazarus documenta morte de Sherri Rasmussen em Los Angeles em 1986.'),
(25,'https://www.fbi.gov/contact-us/field-offices/sacramento/news/press-releases/man-charged-with-kidnapping-may-have-committed-other-similar-offenses','FBI confirma o sequestro em residência de Vallejo em março de 2015.'),
(26,'https://www.nebraska.gov/apps-courts-epub/public/viewCertified?docId=N00011293PUB','Suprema Corte de Nebraska situa o desaparecimento de Cari Farver em Omaha em novembro de 2012.'),
(27,'https://www.washingtonpost.com/archive/politics/2004/09/19/questions-linger-a-year-after-pizza-deliverymans-death/3d48b9d2-e003-4205-9b73-8476ffce908c/','Cobertura contemporânea situa o caso Brian Wells na região de Erie em 2003.'),
(28,'https://law.justia.com/cases/iowa/supreme-court/1990/88-1899-0.html','Acórdão State v. Siemer cita salvamento de Tracey em Des Moines e fatos iniciados em dezembro de 1987.'),
(29,'https://www.cleveland19.com/2025/10/04/seeking-justice-cleveland-woman-found-murdered-just-before-plans-move-across-country/','Reportagem local com documentos policiais situa desaparecimento de Kittrina Bowden em Cleveland em maio de 2019.'),
(30,'https://www.cps.gov.uk/east-england/news/man-convicted-murdering-retired-postmistress-2013','Promotoria britânica confirma homicídio de Una Crown em Wisbech em janeiro de 2013.'),
(31,'https://missing.dc.gov/fr/biography/relisha-t-rudd','Polícia Metropolitana de Washington identifica último avistamento de Relisha Rudd em Washington em março de 2014.'),
(32,'https://www.wbtv.com/story/15473441/district-attorney-outlines-reasons-for-plea-deal-with-elisa-baker/','Comunicado da Promotoria reproduzido por TV local registra caso Zahra Baker em Hickory em 2010.'),
(38,'https://portal.ct.gov/dcj/latest-news/sandy-hook-investigation/danbury-states-attorney-releases-report-on-sandy-hook-investigation','Promotoria de Connecticut confirma ataques em Newtown em 14/12/2012.'),
(39,'https://law.justia.com/cases/indiana/supreme-court/1994/39s00-9304-cr-440-4.html','Suprema Corte de Indiana identifica Jeffersonville como local inicial de encontro/sequestro em janeiro de 1992, não como ponto exato do homicídio.'),
(42,'https://innocenceproject.org/cases/ronald-cotton/','Innocence Project registra o crime de Burlington em julho de 1984 e posterior absolvição de Ronald Cotton.'),
(43,'https://www.justice.gov/usao-edca/pr/sherri-papini-sentenced-18-months-prison-lying-federal-agents-about-being-kidnapped-and','Departamento de Justiça identifica Sherri Papini com residência em Redding e falso sequestro de 2016.'),
(44,'https://www.dps.texas.gov/apps/mpch/MissingPerson/mpPoster/M10-15-200112-31-49PM','Departamento de Segurança Pública do Texas informa San Antonio como último local visto em 13/06/1994.'),
(45,'https://law.justia.com/cases/minnesota/supreme-court/2021/a18-0846.html','Suprema Corte de Minnesota confirma atuação da polícia de Cottage Grove e homicídio de Amy Allwine em novembro de 2016.'),
(46,'https://law.justia.com/cases/new-jersey/appellate-division-published/1990/270-n-j-super-252-0.html','Tribunal de Nova Jersey situa homicídios da família List em Westfield em novembro de 1971.'),
(48,'https://www.keishicho.metro.tokyo.lg.jp/multilingual/english/safe_society/wanted/seijo.html','Polícia Metropolitana de Tóquio confirma Setagaya como local e dezembro de 2000 como data do crime.'),
(51,'https://www.sfchronicle.com/bayarea/article/NAPA-2-women-26-fatally-stabbed-at-home-IDd-2677304.php','Notícia contemporânea identifica morte de Leslie Mazzara e Adriane Insogna em Napa em novembro de 2004.')
)
UPDATE public.case_atlas_locations AS a
SET review_reference = 'Fonte externa geográfica conferida (cidade/ano): ' || confirmed.url,
    review_note = left('Cotejo externo 2026-11-04: ' || confirmed.justification ||
                       ' Referência geral anterior preservada na auditoria versionada. ' ||
                       coalesce(a.review_note,''), 1900),
    reviewed_at = now(),
    updated_at = now()
FROM confirmed
WHERE a.id=confirmed.map_id
AND a.review_reference LIKE 'Fonte geral citada no artigo%';
COMMIT;
SELECT count(*) as total,
count(*) FILTER (WHERE review_reference LIKE 'Fonte externa geográfica conferida%') AS external_confirmed,
count(*) FILTER (WHERE review_reference LIKE 'Fonte geral citada no artigo%') AS article_only
FROM public.case_atlas_locations;
