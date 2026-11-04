-- Auditoria editorial geográfica 04/11/2026. Não altera coordenadas, estado de publicação nem conteúdo narrativo.
begin;
with evidence as (
 select l.id,
  (select e->>'url' from jsonb_array_elements(coalesce(d.documentos,g.fontes,'[]'::jsonb)) as e
   where e->>'url' like 'http%' limit 1) article_url
 from public.case_atlas_locations l
 left join public."Casos" d on d.id=l.dossier_id
 left join public.casos_diarios g on g.id=l.daily_id
 where l.id not in (1,3,4,21,22,24)
)
update public.case_atlas_locations l
set review_reference='Fonte geral citada no artigo (localidade documentada na ficha): '||e.article_url,
    review_note='Auditoria 2026-11-04: cidade e ano coerentes com o cadastro editorial do artigo. A fonte listada é referência geral; ainda não foi conferida individualmente como prova específica da localidade.',
    updated_at=now()
from evidence e
where l.id=e.id and e.article_url is not null;
update public.case_atlas_locations
set review_reference='Fonte externa geográfica conferida: Fall River Historical Society — Arquivo Hilliard (1892) — https://fallriverhistorical.org/lizzie-borden-collections/hilliard-papers/',
    review_note='Auditoria 2026-11-04: Arquivo histórico contém depoimentos policiais do caso em Fall River, 1892. Coordenada permanece representativa do centro urbano, não endereço da ocorrência.',
    reviewed_at=now(),updated_at=now()
where id=1 and dossier_id=4;
update public."Casos"
set documentos=coalesce(documentos,'[]'::jsonb)||jsonb_build_array(
 jsonb_build_object('titulo','Fall River Historical Society — Arquivo Hilliard (1892)','tipo','fonte institucional/judicial','url','https://fallriverhistorical.org/lizzie-borden-collections/hilliard-papers/','nota','Referência geográfica e temporal do caso. Arquivo histórico contém depoimentos policiais do caso em Fall River, 1892.','exibicao','cartao_documento')
)
where id=4 and jsonb_array_length(coalesce(documentos,'[]'::jsonb))=0;
update public.case_atlas_locations
set review_reference='Fonte externa geográfica conferida: Boulder Police Department — investigação JonBenét Ramsey (1996) — https://bouldercolorado.gov/jonbenet-ramsey-homicide',
    review_note='Auditoria 2026-11-04: Polícia de Boulder identifica a ocorrência em 26/12/1996 na cidade. Coordenada permanece representativa do centro urbano, não endereço da ocorrência.',
    reviewed_at=now(),updated_at=now()
where id=3 and dossier_id=7;
update public."Casos"
set documentos=coalesce(documentos,'[]'::jsonb)||jsonb_build_array(
 jsonb_build_object('titulo','Boulder Police Department — investigação JonBenét Ramsey (1996)','tipo','fonte institucional/judicial','url','https://bouldercolorado.gov/jonbenet-ramsey-homicide','nota','Referência geográfica e temporal do caso. Polícia de Boulder identifica a ocorrência em 26/12/1996 na cidade.','exibicao','cartao_documento')
)
where id=7 and jsonb_array_length(coalesce(documentos,'[]'::jsonb))=0;
update public.case_atlas_locations
set review_reference='Fonte externa geográfica conferida: Polícia Judiciária de Portugal — comunicação oficial de maio de 2007 — https://www.policiajudiciaria.pt/informacao-sobre-desaparecimento-de-crianca-3/',
    review_note='Auditoria 2026-11-04: PJ identifica a Praia da Luz em 03/05/2007. Coordenada permanece representativa do centro urbano, não endereço da ocorrência.',
    reviewed_at=now(),updated_at=now()
where id=4 and dossier_id=9;
update public."Casos"
set documentos=coalesce(documentos,'[]'::jsonb)||jsonb_build_array(
 jsonb_build_object('titulo','Polícia Judiciária de Portugal — comunicação oficial de maio de 2007','tipo','fonte institucional/judicial','url','https://www.policiajudiciaria.pt/informacao-sobre-desaparecimento-de-crianca-3/','nota','Referência geográfica e temporal do caso. PJ identifica a Praia da Luz em 03/05/2007.','exibicao','cartao_documento')
)
where id=9 and jsonb_array_length(coalesce(documentos,'[]'::jsonb))=0;
update public.case_atlas_locations
set review_reference='Fonte externa geográfica conferida: Weld County District Attorney — confissão de Chris Watts (2018) — https://www.weldda.com/News/2018-News/Chris-Watts-Admits-to-Killing-Pregnant-Wife-and-Two-Young-Children',
    review_note='Auditoria 2026-11-04: Promotoria documenta processo de 2018; município Frederick também consta na cobertura contemporânea e no artigo. Coordenada permanece representativa do centro urbano, não endereço da ocorrência.',
    reviewed_at=now(),updated_at=now()
where id=21 and dossier_id=11;
update public."Casos"
set documentos=coalesce(documentos,'[]'::jsonb)||jsonb_build_array(
 jsonb_build_object('titulo','Weld County District Attorney — confissão de Chris Watts (2018)','tipo','fonte institucional/judicial','url','https://www.weldda.com/News/2018-News/Chris-Watts-Admits-to-Killing-Pregnant-Wife-and-Two-Young-Children','nota','Referência geográfica e temporal do caso. Promotoria documenta processo de 2018; município Frederick também consta na cobertura contemporânea e no artigo.','exibicao','cartao_documento')
)
where id=11 and jsonb_array_length(coalesce(documentos,'[]'::jsonb))=0;
update public.case_atlas_locations
set review_reference='Fonte externa geográfica conferida: Riverside County District Attorney — declaração de culpa Turpin (2018/2019) — https://rivcoda.org/news/david-and-louise-turpin-plead-guilty',
    review_note='Auditoria 2026-11-04: Promotoria confirma prisão e denúncias ligadas a Perris em janeiro de 2018. Coordenada permanece representativa do centro urbano, não endereço da ocorrência.',
    reviewed_at=now(),updated_at=now()
where id=22 and dossier_id=17;
update public."Casos"
set documentos=coalesce(documentos,'[]'::jsonb)||jsonb_build_array(
 jsonb_build_object('titulo','Riverside County District Attorney — declaração de culpa Turpin (2018/2019)','tipo','fonte institucional/judicial','url','https://rivcoda.org/news/david-and-louise-turpin-plead-guilty','nota','Referência geográfica e temporal do caso. Promotoria confirma prisão e denúncias ligadas a Perris em janeiro de 2018.','exibicao','cartao_documento')
)
where id=17 and jsonb_array_length(coalesce(documentos,'[]'::jsonb))=0;
update public.case_atlas_locations
set review_reference='Fonte externa geográfica conferida: Tennessee Supreme Court — State v. Pike (1998) — https://law.justia.com/cases/tennessee/supreme-court/1998/pike.html',
    review_note='Auditoria 2026-11-04: Acórdão relata fatos ocorridos em Knoxville, em janeiro de 1995. Coordenada permanece representativa do centro urbano, não endereço da ocorrência.',
    reviewed_at=now(),updated_at=now()
where id=24 and dossier_id=21;
update public."Casos"
set documentos=coalesce(documentos,'[]'::jsonb)||jsonb_build_array(
 jsonb_build_object('titulo','Tennessee Supreme Court — State v. Pike (1998)','tipo','fonte institucional/judicial','url','https://law.justia.com/cases/tennessee/supreme-court/1998/pike.html','nota','Referência geográfica e temporal do caso. Acórdão relata fatos ocorridos em Knoxville, em janeiro de 1995.','exibicao','cartao_documento')
)
where id=21 and jsonb_array_length(coalesce(documentos,'[]'::jsonb))=0;
commit;
select count(*) total, count(*) filter(where review_reference like 'Fonte externa geográfica conferida:%') externas,
count(*) filter(where review_reference like 'Fonte geral citada no artigo%') referencias_artigo,
count(*) filter(where review_reference like 'Metadado local%' or review_reference like 'Campo local%') genericas
from public.case_atlas_locations;
select id,jsonb_array_length(coalesce(documentos,'[]'::jsonb)) as docs from public."Casos" where id in (4,7,9,11,17,21) order by id;
