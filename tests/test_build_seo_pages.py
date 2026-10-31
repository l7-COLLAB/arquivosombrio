import importlib.util
from pathlib import Path
from unittest import TestCase,main
import xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parent.parent
path=ROOT/"scripts/build-seo-pages.py"
spec=importlib.util.spec_from_file_location("seo_pages",path)
pages=importlib.util.module_from_spec(spec)
spec.loader.exec_module(pages)

def record(identifier,title="Arquivo publicado",status="publicado",text="Narrativa documental"):
 return {"id":identifier,"titulo":title,"resumo":"Descrição pública do registro","historia":text,"conteudo":text,"historia_tecnica":text,"status_publicacao":status,"created_at":"2026-10-19T00:00:00Z"}
class SeoPagesTests(TestCase):
 def test_five_static_html_pages_and_original_links(self):
  data={table:[record(1,title=f"Teste {table}")] for table in pages.PUBLIC_TABLES}
  output=pages.build_all(ROOT,data)
  self.assertEqual(len(output),5)
  for table,(route,_,__,___) in pages.PUBLIC_TABLES.items():
   name="arquivo/"+route.replace(".html","")+"-1.html"
   html=output[name].decode("utf-8")
   self.assertIn('<script type="application/ld+json">',html)
   self.assertIn('<link rel="canonical" href="https://arquivosombrio.net.br/'+name+'">',html)
   self.assertIn(route+"?id=1",html)
 def test_escape_untrusted_editorial_html_and_script(self):
  value='Texto <script>alert("x")</script> & detalhes'
  html=pages.render_page("Casos",record(1,title='Título <x> & y',text=value)).decode()
  self.assertNotIn('<script>alert("x")</script>',html)
  self.assertNotIn('<x>',html)
  self.assertIn('Título &amp; y',html)
  self.assertIn('&amp;',html)
  self.assertIn('Texto alert',html)
 def test_no_drafts_or_invalid_ids_in_generator(self):
  data={table:[record(1)] for table in pages.PUBLIC_TABLES}
  data['Casos']=[record(1,status='rascunho')]
  with self.assertRaises(ValueError):pages.build_all(ROOT,data)
  data['Casos']=[record('../admin')]
  with self.assertRaises(ValueError):pages.build_all(ROOT,data)
 def test_bad_catalog_aborts_generation(self):
  data={table:[record(1)] for table in pages.PUBLIC_TABLES}
  del data['pericias']
  with self.assertRaises(ValueError):pages.build_all(ROOT,data)
 def test_semantic_paragraphs_headings_and_lists(self):
  row=record(15,text="INTRODUÇÃO AO CASO\n\nPrimeiro parágrafo.\n\nSegundo parágrafo.\n\n## Evidências\n\n- Vestígio A\n- Vestígio B")
  html=pages.render_page("Casos",row).decode()
  self.assertIn("<h2>INTRODUÇÃO AO CASO</h2>",html)
  self.assertIn("<p>Primeiro parágrafo.</p>",html)
  self.assertIn("<p>Segundo parágrafo.</p>",html)
  self.assertIn("<h2>Evidências</h2>",html)
  self.assertIn("<ul><li>Vestígio A</li><li>Vestígio B</li></ul>",html)
  self.assertNotIn('Primeiro parágrafo. Segundo parágrafo.',html)
 def test_sanitizes_untrusted_article_and_reference_html(self):
  row=record(4,text='ALERTA IMPORTANTE\n\nTexto <img src=x onerror=alert(1)> com <script>alert(2)</script> & detalhes')
  row["fontes"]=[
   {"titulo":"Fonte <script>ruim</script>", "url":"https://example.org/fonte?x=1&y=2"},
   {"titulo":"Injetado", "url":"javascript:alert(1)"},
   {"titulo":"Injetado", "url":"//example.org/redirect"},
  ]
  html=pages.render_page("casos_diarios",row).decode()
  self.assertNotIn("<img src=x",html)
  self.assertNotIn("<script>alert(2)</script>",html)
  self.assertNotIn("javascript:alert",html)
  self.assertNotIn("Injetado</a>",html)
  self.assertIn("Fonte &lt;script&gt;ruim&lt;/script&gt;",html)
  self.assertIn('href="https://example.org/fonte?x=1&amp;y=2"',html)
  self.assertIn("<h2>ALERTA IMPORTANTE</h2>",html)
 def test_structured_sources_plain_bibliography_and_no_sources(self):
  structured=pages.article_format.render_references([
   {"url":"https://example.org/report.pdf","titulo":"Relatório pericial"},
   {"url":"https://example.org/report.pdf","titulo":"Duplicata"},
  ])
  self.assertEqual(structured.count('href="https://example.org/report.pdf"'),1)
  self.assertIn("Relatório pericial",structured)
  plain=pages.article_format.render_references("Pesquisa oficial\nhttps://example.edu/report\n\n2. Artigo: https://example.org/article")
  self.assertIn(">Pesquisa oficial</a>",plain)
  self.assertIn(">Artigo</a>",plain)
  self.assertEqual(pages.article_format.render_references(None,[],""),"")
 def test_image_metadata_and_editorial_cover(self):
  row=record(2)
  row["imagem"]="/img/dossies/foto-publica.webp"
  row["published_at"]="2026-10-26T20:00:00-03:00"
  html=pages.render_page("Casos",row).decode()
  url="https://arquivosombrio.net.br/img/dossies/foto-publica.webp"
  self.assertIn(f'<meta property="og:image" content="{url}">',html)
  self.assertIn(f'<meta name="twitter:image" content="{url}">',html)
  self.assertIn('name="twitter:card" content="summary_large_image"',html)
  self.assertIn(f'<figure class="article-cover"><img src="{url}"',html)
  self.assertIn('"datePublished": "2026-10-26T20:00:00-03:00"',html)
  self.assertIn('"image": ["'+url+'"]',html)
  fallback=pages.render_page("Casos",record(3)).decode()
  self.assertIn('content="https://arquivosombrio.net.br/imagem-compartilhamento.jpg"',fallback)
  self.assertNotIn('<figure class="article-cover">',fallback)
 def test_pericia_sources_image_caption_and_full_text(self):
  row=record(8,text="INTRODUÇÃO METODOLÓGICA\n\nConteúdo técnico.")
  row["fontes"]="Documento oficial do NIST\nhttps://www.nist.gov/report"
  row["imagem"]="https://cdn.example.com/forense.jpg"
  row["legenda_imagem"]="Fotografia ilustrativa (NIST)"
  html=pages.render_page("pericias",row).decode()
  self.assertIn('<figcaption>Fotografia ilustrativa (NIST)</figcaption>',html)
  self.assertIn('href="https://www.nist.gov/report"',html)
  self.assertIn("<h2>Fontes e documentos consultados</h2>" if False else '<h2 id="article-references-title">Fontes e documentos consultados</h2>',html)
 def test_does_not_cut_narrative_into_1900_character_blocks(self):
  row=record(9,text="Primeira parte de leitura.\n\n"+"continuação "*450)
  html=pages.render_page("Casos",row).decode()
  self.assertEqual(html.count('<article aria-label="Texto público do arquivo">'),1)
  self.assertIn('<p>Primeira parte de leitura.</p>',html)
  self.assertIn('<p>'+"continuação "*449+"continuação</p>",html)
 def test_safe_cover_url_only(self):
  self.assertEqual(pages.article_format.cover_url("javascript:alert(1)"),pages.article_format.FALLBACK_COVER)
  self.assertEqual(pages.article_format.cover_url("//evil.com/x"),pages.article_format.FALLBACK_COVER)
  self.assertEqual(pages.article_format.cover_url("data:image/png;base64,xyz"),pages.article_format.FALLBACK_COVER)
if __name__=="__main__":main()
