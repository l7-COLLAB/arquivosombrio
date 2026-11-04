# Atlas Criminal — auditoria de localidades e rastreabilidade

**Data de referência:** 04/11/2026. **Abrangência:** 53 localidades, uma por artigo nesta carga.

## Método e limites

1. Para os **53 registros**, foram comparados automaticamente o campo editorial `local` com a cidade catalogada, e o período `ano`/`data_caso` com o ano inicial usado na linha do tempo. Os limites de latitude/longitude e a categoria de precisão também foram verificados.
2. Em **6 Dossiês** cuja lista `documentos` estava vazia, foram consultadas fontes institucionais, policiais, históricas ou judiciais externas e acrescentadas referências ao Dossiê e à curadoria do Atlas. Este nível de conferência é denominado **fonte externa conferida**.
3. Nos outros **47 registros**, as referências rastreáveis já presentes no artigo foram associadas à ficha do Atlas, **sem alegar que cada URL confirma individualmente o município ou o ano**. A confirmação geográfica documental específica permanece pendente nesses casos.
4. Os pinos usam coordenadas **aproximadas do centro de cidade ou da região metropolitana**. Nunca indicam residência de vítimas ou lugar exato da ocorrência.
5. Nenhuma revisão geográfica modifica a narrativa dos artigos, a condição de publicação ou as hipóteses investigativas.

**Atenção:** `reviewed=true` já existia para os 53 itens antes desta auditoria. Não representa necessariamente cotejamento externo da fonte geográfica. A distinção agora está registrada em `review_reference` e `review_note` (campos internos).

## Revisão por localidade

| # | Registro publicado | Localidade aproximada | Ano | Rastreabilidade |
|---:|---|---|---:|---|
| 1 | [Lizzie Borden: quem matou Andrew e Abby Borden?](/arquivo/caso-4.html) | Fall River · Massachusetts · Estados Unidos | 1892 | [Fonte externa conferida](https://fallriverhistorical.org/lizzie-borden-collections/hilliard-papers/) |
| 2 | [Caso Dana Chandler](/arquivo/caso-5.html) | Topeka · Kansas · Estados Unidos | 2002 | [Fonte citada no artigo](https://law.justia.com/cases/kansas/supreme-court/2018/108625.html) |
| 3 | [Caso JonBenét Ramsey: a carta de resgate, o corpo no porão e 30 anos sem respostas](/arquivo/caso-7.html) | Boulder · Colorado · Estados Unidos | 1996 | [Fonte externa conferida](https://bouldercolorado.gov/jonbenet-ramsey-homicide) |
| 4 | [Caso Madeleine McCann: o desaparecimento, as falhas e o suspeito nunca acusado](/arquivo/caso-9.html) | Praia da Luz · Algarve · Portugal | 2007 | [Fonte externa conferida](https://www.policiajudiciaria.pt/informacao-sobre-desaparecimento-de-crianca-3/) |
| 5 | [Irmãos Menendez: os disparos em Beverly Hills e o julgamento que nunca acabou](/arquivo/caso-13.html) | Beverly Hills · Califórnia · Estados Unidos | 1989 | [Fonte citada no artigo](https://law.justia.com/cases/california/supreme-court/4th/3/435.html) |
| 6 | [Dennis Rader: a identidade por trás do BTK](/arquivo/caso-16.html) | Wichita · Kansas · Estados Unidos | 1974 | [Fonte citada no artigo](https://vault.fbi.gov/dennis-rader/Dennis%20Rader%20Part%2001%20%28Final%29/view) |
| 7 | [Escola Base: a acusação infundada que destruiu vidas](/arquivo/caso-28.html) | São Paulo · São Paulo · Brasil | 1994 | [Fonte citada no artigo](https://www1.folha.uol.com.br/fsp/1994/7/06/cotidiano/38.html) |
| 8 | [Jennifer Pan: a trama familiar e os recursos na Justiça canadense](/arquivo/caso-100.html) | Markham · Ontário · Canadá | 2010 | [Fonte citada no artigo](https://www.minicounsel.ca/oca/2023/362) |
| 9 | [Sylvia Likens: a violência que envolveu uma vizinhança](/arquivo/garimpo-13.html) | Indianápolis · Indiana · Estados Unidos | 1965 | [Fonte citada no artigo](https://indyencyclopedia.org/sylvia-likens-murder-case/) |
| 10 | [Uvalde: os 77 minutos e a resposta que falhou](/arquivo/garimpo-16.html) | Uvalde · Texas · Estados Unidos | 2022 | [Fonte citada no artigo](https://www.justice.gov/archives/opa/pr/justice-department-releases-report-its-critical-incident-review-response-mass-shooting-robb) |
| 11 | [Bruce McArthur: os desaparecidos da comunidade de Toronto](/arquivo/garimpo-22.html) | Toronto · Ontário · Canadá | 2010 | [Fonte citada no artigo](https://www.canlii.org/en/on/onsc/doc/2019/2019onsc963/2019onsc963.html) |
| 12 | [Beslan: três dias de cerco a uma escola](/arquivo/garimpo-24.html) | Beslan · Ossétia do Norte · Rússia | 2004 | [Fonte citada no artigo](https://hudoc.echr.coe.int/eng?i=001-172660) |
| 13 | [Corpos ensacados em São Paulo: investigações e conexões não confirmadas](/arquivo/garimpo-27.html) | São Paulo · São Paulo · Brasil | 2026 | [Fonte citada no artigo](https://tvbrasil.ebc.com.br/reporter-brasil-tarde/2026/10/corpos-encontrados-em-sp-policia-prende-suspeitos-de-envolvimento) |
| 14 | [Dorothea Puente: o que havia sob o jardim](/arquivo/garimpo-30.html) | Sacramento · Califórnia · Estados Unidos | 1982 | [Fonte citada no artigo](https://oac.cdlib.org/findaid/ark:/13030/c8b85fn5) |
| 15 | [A Mulher de Isdal: identidades falsas e uma morte sem nome](/arquivo/garimpo-38.html) | Bergen · Vestland · Noruega | 1970 | [Fonte citada no artigo](https://www.rmv.se/aktuellt/isdalskvinnan-bombpulskurvan/) |
| 16 | [Lars Mittank: o desaparecimento após a fuga do aeroporto](/arquivo/garimpo-42.html) | Varna · Varna · Bulgária | 2014 | [Fonte citada no artigo](https://www.schleswig-holstein.de/DE/landesregierung/ministerien-behoerden/POLIZEI/Fahndungen/startseite_fahndung_vermisstePersonen) |
| 17 | [Elisa Lam: o que o vídeo não pôde revelar](/arquivo/garimpo-43.html) | Los Angeles · Califórnia · Estados Unidos | 2013 | [Fonte citada no artigo](https://www.lapdonline.org/newsroom/detectives-looking-for-missing-canadian-woman-young-womans-disappearance-from-downtown-hotel-is-suspicious-nr13034rf/) |
| 18 | [Rachel Nickell: a investigação que acusou Colin Stagg](/arquivo/garimpo-48.html) | Londres · Inglaterra · Reino Unido | 1992 | [Fonte citada no artigo](https://library.college.police.uk/docs/J_Homicide_MII/J_Homicide_6.1.pdf) |
| 19 | [Sherri Rasmussen: a evidência preservada que reabriu o caso](/arquivo/garimpo-49.html) | Los Angeles · Califórnia · Estados Unidos | 1986 | [Fonte citada no artigo](https://law.justia.com/cases/california/court-of-appeal/2015/b241172.html) |
| 20 | [Barbara Mackle: 83 horas enterrada viva e o sequestro que virou uma caçada nacional](/arquivo/caso-10.html) | Decatur · Geórgia · Estados Unidos | 1968 | [Fonte citada no artigo](https://www.fbi.gov/history/field-office-histories/miami) |
| 21 | [Caso Watts: o desaparecimento da família e a confissão que mudou tudo](/arquivo/caso-11.html) | Frederick · Colorado · Estados Unidos | 2018 | [Fonte externa conferida](https://www.weldda.com/News/2018-News/Chris-Watts-Admits-to-Killing-Pregnant-Wife-and-Two-Young-Children) |
| 22 | [A família Turpin: a ligação que revelou anos de cativeiro](/arquivo/caso-17.html) | Perris · Califórnia · Estados Unidos | 2018 | [Fonte externa conferida](https://rivcoda.org/news/david-and-louise-turpin-plead-guilty) |
| 23 | [Robert Pickton: as mulheres esquecidas e as falhas que permitiram novos crimes](/arquivo/caso-19.html) | Port Coquitlam · Colúmbia Britânica · Canadá | 1997 | [Fonte citada no artigo](https://www2.gov.bc.ca/assets/gov/law-crime-and-justice/about-bc-justice-system/inquiries/forsaken-es.pdf) |
| 24 | [Christa Pike: o assassinato de Colleen Slemmer e a execução que falhou](/arquivo/caso-21.html) | Knoxville · Tennessee · Estados Unidos | 1995 | [Fonte externa conferida](https://law.justia.com/cases/tennessee/supreme-court/1998/pike.html) |
| 25 | [Denise Huskins: o sequestro real que a polícia chamou de fraude](/arquivo/caso-25.html) | Vallejo · Califórnia · Estados Unidos | 2015 | [Fonte citada no artigo](https://www.fbi.gov/contact-us/field-offices/sacramento/news/press-releases/man-charged-with-kidnapping-may-have-committed-other-similar-offenses) |
| 26 | [Cari Farver: a vítima que foi transformada em perseguidora](/arquivo/caso-26.html) | Omaha · Nebraska · Estados Unidos | 2012 | [Fonte citada no artigo](https://www.nebraska.gov/apps-courts-epub/public/viewCertified?docId=N00011293PUB) |
| 27 | [Brian Wells: a bomba no pescoço e a conspiração por trás do assalto](/arquivo/caso-27.html) | Erie · Pensilvânia · Estados Unidos | 2003 | [Fonte citada no artigo](https://www2.ca3.uscourts.gov/opinarch/111601np.pdf) |
| 28 | [Tracey Simmons: o menino que saía do porão para ir à escola](/arquivo/garimpo-2.html) | Des Moines · Iowa · Estados Unidos | 1987 | [Fonte citada no artigo](https://law.justia.com/cases/iowa/supreme-court/1990/88-1899-0.html) |
| 29 | [Kittrina Bowden: o desaparecimento antes de uma mudança planejada](/arquivo/garimpo-3.html) | Cleveland · Ohio · Estados Unidos | 2019 | [Fonte citada no artigo](https://www.cleveland19.com/2025/10/04/seeking-justice-cleveland-woman-found-murdered-just-before-plans-move-across-country/) |
| 30 | [Una Crown: uma prova preservada doze anos antes da condenação](/arquivo/garimpo-4.html) | Wisbech · Inglaterra · Reino Unido | 2013 | [Fonte citada no artigo](https://www.judiciary.uk/wp-content/uploads/2025/02/R-v-David-Newton.pdf) |
| 31 | [Relisha Rudd: a menina que desapareceu diante de todos](/arquivo/garimpo-6.html) | Washington · Distrito de Colúmbia · Estados Unidos | 2014 | [Fonte citada no artigo](https://missing.dc.gov/fr/biography/relisha-t-rudd) |
| 32 | [Zahra Baker: a menina que sobreviveu ao câncer e desapareceu dentro da própria casa](/arquivo/garimpo-8.html) | Hickory · Carolina do Norte · Estados Unidos | 2010 | [Fonte citada no artigo](https://www.wbtv.com/story/15473441/district-attorney-outlines-reasons-for-plea-deal-with-elisa-baker/) |
| 33 | [Erica Parsons: a menina que desapareceu por quase dois anos antes que alguém procurasse a polícia](/arquivo/garimpo-10.html) | Salisbury · Carolina do Norte · Estados Unidos | 2011 | [Fonte citada no artigo](https://www.fbi.gov/contact-us/field-offices/charlotte/news/press-releases/former-rowan-county-couple-sentenced-on-fraud-charges-in-connection-with-disappearance-of-child) |
| 34 | [Jennifer Schuett: dezenove anos até um nome](/arquivo/garimpo-11.html) | Dickinson · Texas · Estados Unidos | 1990 | [Fonte citada no artigo](https://multimedia.fbi.gov/item?id=6529&type=image) |
| 35 | [Hana Williams: a adolescente adotada que morreu após um longo período de abusos e privação](/arquivo/garimpo-12.html) | Sedro-Woolley · Washington · Estados Unidos | 2011 | [Fonte citada no artigo](https://law.justia.com/cases/washington/court-of-appeals-division-i/2015/71193-8.html) |
| 36 | [Dean Corll: os meninos esquecidos de Houston](/arquivo/garimpo-14.html) | Houston · Texas · Estados Unidos | 1970 | [Fonte citada no artigo](https://law.justia.com/cases/texas/court-of-criminal-appeals/1979/56288-3.html) |
| 37 | [Gabriel Fernandez: os avisos antes da morte](/arquivo/garimpo-17.html) | Palmdale · Califórnia · Estados Unidos | 2012 | [Fonte citada no artigo](https://law.justia.com/cases/california/court-of-appeal/2020/b292788.html) |
| 38 | [Sandy Hook: as famílias depois de 14 de dezembro](/arquivo/garimpo-20.html) | Newtown · Connecticut · Estados Unidos | 2012 | [Fonte citada no artigo](https://portal.ct.gov/dcj/-/media/dcj/sandyhookfinalreportpdf.pdf) |
| 39 | [Shanda Sharer: quatro adolescentes e uma noite de violência](/arquivo/garimpo-21.html) | Jeffersonville · Indiana · Estados Unidos | 1992 | [Fonte citada no artigo](https://law.justia.com/cases/indiana/supreme-court/1994/39s00-9304-cr-440-4.html) |
| 40 | [Victoria Climbié: os encontros que não impediram a morte](/arquivo/garimpo-25.html) | Londres · Inglaterra · Reino Unido | 1999 | [Fonte citada no artigo](https://www.gov.uk/government/publications/the-victoria-climbie-inquiry-report-of-an-inquiry-by-lord-laming) |
| 41 | [Robert Berdella: a fuga que revelou seis assassinatos](/arquivo/garimpo-26.html) | Kansas City · Missouri · Estados Unidos | 1984 | [Fonte citada no artigo](https://www.upi.com/Archives/1988/04/05/Police-use-backhoe-to-search-for-clues/1851576216000/) |
| 42 | [Ronald Cotton: a certeza que condenou o homem errado](/arquivo/garimpo-28.html) | Burlington · Carolina do Norte · Estados Unidos | 1984 | [Fonte citada no artigo](https://innocenceproject.org/cases/ronald-cotton/) |
| 43 | [Sherri Papini: os 22 dias que viraram uma fraude](/arquivo/garimpo-29.html) | Redding · Califórnia · Estados Unidos | 2016 | [Fonte citada no artigo](https://www.justice.gov/usao-edca/pr/sherri-papini-sentenced-18-months-prison-lying-federal-agents-about-being-kidnapped-and) |
| 44 | [Nicholas Barclay: o menino que voltou era um impostor](/arquivo/garimpo-31.html) | San Antonio · Texas · Estados Unidos | 1994 | [Fonte citada no artigo](https://www.dps.texas.gov/apps/mpch/MissingPerson/mpPoster/M10-15-200112-31-49PM) |
| 45 | [Amy Allwine: a ameaça que estava dentro de casa](/arquivo/garimpo-34.html) | Cottage Grove · Minnesota · Estados Unidos | 2016 | [Fonte citada no artigo](https://law.justia.com/cases/minnesota/supreme-court/2021/a18-0846.html) |
| 46 | [John List: cinco mortes e uma segunda vida](/arquivo/garimpo-35.html) | Westfield · Nova Jersey · Estados Unidos | 1971 | [Fonte citada no artigo](https://www.upi.com/Archives/1989/06/01/FBI-arrests-man-wanted-for-1971-killing-of-family/5631612676800/) |
| 47 | [Dee Dee e Gypsy Rose Blanchard: o abuso por trás da aparência](/arquivo/garimpo-36.html) | Springfield · Missouri · Estados Unidos | 2015 | [Fonte citada no artigo](https://greenecountymo.gov/files/file.php?id=10449) |
| 48 | [Os assassinatos de Setagaya: quatro vidas e as pistas deixadas na casa](/arquivo/garimpo-39.html) | Tóquio · Tóquio · Japão | 2000 | [Fonte citada no artigo](https://www.japantimes.co.jp/news/2025/12/30/japan/crime-legal/setagaya-murder-search/) |
| 49 | [Halloween de 1974: a origem dos doces que ninguém conseguia explicar](/arquivo/garimpo-53.html) | Pasadena · Texas · Estados Unidos | 1974 | [Fonte citada no artigo](https://law.justia.com/cases/texas/court-of-criminal-appeals/1979/59731-3.html) |
| 50 | [Shauna Howe: a menina que não voltou da festa de Halloween](/arquivo/garimpo-62.html) | Oil City · Pensilvânia · Estados Unidos | 1992 | [Fonte citada no artigo](https://www.pacourts.us/assets/opinions/Superior/out/J-S36014-13m%20-%201014930021665642.pdf) |
| 51 | [Duplo homicídio de Napa: a pista deixada nos cigarros](/arquivo/garimpo-64.html) | Napa · Califórnia · Estados Unidos | 2004 | [Fonte citada no artigo](https://www.napacounty.gov/DocumentCenter/View/41666/DA-Newsletter-April-2026) |
| 52 | [Assassinatos de Pasadena: a emboscada no caminho de casa](/arquivo/garimpo-65.html) | Pasadena · Califórnia · Estados Unidos | 1993 | [Fonte citada no artigo](https://supreme.courts.ca.gov/sites/default/files/supremecourt/default/2022-08/S058734.pdf) |
| 53 | [Luis Andrés Colmenares: a madrugada que permaneceu em disputa](/arquivo/garimpo-66.html) | Bogotá · Bogotá D.C. · Colômbia | 2010 | [Fonte citada no artigo](https://cortesuprema.gov.co/sala-de-casacion-penal-dejo-en-firme-la-absolucion-de-laura-moreno-procesada-por-la-muerte-del-estudiante-luis-andres-colmenares/) |

## Inconsistências e pendências

- Cidades ou anos divergentes dos metadados originais: **0**.
- Dossiês com nova referência institucional/judicial: **6**.
- Referências do acervo a conferir contra a indicação específica da cidade: **47**.
- O Dossiê dos irmãos Menendez apresenta período editorial abrangendo **2027**, posterior à data desta auditoria (04/11/2026). Isso não altera o marcador de 1989, mas deve ser revisado na ficha editorial.
- Eventos que abrangem mais de um município aparecem em um ponto de referência. A inclusão de cidades adicionais deve depender de comprovação específica, não de geocodificação automática.
- Homologação do domínio: não confirmada pelo ambiente de consulta, devido à impossibilidade de resolução de DNS; o CI de pós-publicação deve ser consultado.
