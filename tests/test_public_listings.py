import importlib.util
import json
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from unittest import TestCase, main

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('listings', ROOT/'scripts/build-public-listings.py')
listing = importlib.util.module_from_spec(spec)
spec.loader.exec_module(listing)

class Parsed(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.links, self.images = [], []
        self.feed(html)
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'a': self.links.append(attrs.get('href'))
        if tag == 'img': self.images.append(attrs)

def row(ident, **extra):
    return dict(id=ident, titulo=f'Caso {ident}', resumo='Resumo público', categoria='MISTÉRIO', status_publicacao='publicado', created_at='2026-10-01T00:00:00Z', **extra)

class PublicListings(TestCase):
    def setUp(self):
        self.data = {table: [row(i) for i in range(1, 13)] for table in listing.ROUTES}
    def test_real_templates_have_complete_readable_grids_and_matching_counts(self):
        edits = listing.prepare(ROOT, self.data)
        self.assertEqual(len(edits), 5)
        for filename, ident in [('index.html','grid-casos'), ('dossies.html','grid-casos'), ('garimpo.html','daily-archive-grid'), ('lendas.html','literary-grid'), ('creepypastas.html','literary-grid')]:
            html = edits[filename]
            start, end = listing.ElementSpan(html, ident).spans[0]
            doc = Parsed(html[start:end])
            self.assertEqual(len(doc.links), 12)
            self.assertTrue(all(link.startswith('/arquivo/') for link in doc.links))
            self.assertTrue(all('alt' in img and 'width' in img and 'height' in img for img in doc.images))
            self.assertNotIn('Consultando', html[start:end])
            self.assertNotIn('Abrindo arquivos', html[start:end])
            if ident == 'grid-casos':
                a,b=listing.ElementSpan(html,'contador-casos').spans[0]
                self.assertEqual(html[a:b], '12')
        a,b=listing.ElementSpan(edits['index.html'],'home-daily-feed').spans[0]
        self.assertEqual(len(Parsed(edits['index.html'][a:b]).links), 6)
    def test_excludes_other_editorias_without_deleting_their_articles(self):
        rows=[row(1),row(2),row(3)]
        rows[1]['categoria']='PERÍCIA FORENSE';rows[2]['categoria']='ESPECIAL HALLOWEEN'
        self.assertEqual([r['id'] for r in listing.collection_rows('casos_diarios',rows)],[1])
        self.assertEqual(len(rows),3)
    def test_publication_cutoff_handles_brasilia_and_drafts(self):
        now=datetime(2026,10,31,23,0,tzinfo=timezone.utc)
        self.assertTrue(listing.published(row(1,publicado_em='2026-10-31T20:00:00-03:00'),now))
        self.assertFalse(listing.published(row(1,published_at='2026-10-31T20:01:00-03:00'),now))
        draft=row(1);draft['status_publicacao']='agendado'
        self.assertFalse(listing.published(draft,now))
        with self.assertRaises(ValueError):listing.published(row(1,publicado_em='invalid'),now)
    def test_snapshot_excludes_bodies_and_cannot_close_script(self):
        self.data['Casos'][0].update(titulo='</script><script>alert(1)</script>', historia='BODY SECRET', imagem='javascript:alert(1)')
        html=listing.prepare(ROOT,self.data)['index.html']
        a,b=listing.ElementSpan(html,'as-public-listings').spans[0]
        payload=html[a:b]
        self.assertNotIn('<',payload)
        self.assertNotIn('historia',json.loads(payload)['Casos'][0])
        self.assertNotIn('BODY SECRET',html)
        self.assertNotIn('src="javascript:',html)
        self.assertNotIn('<script>alert(1)</script>',html)
    def test_missing_or_duplicate_container_aborts(self):
        for html in ['<main></main>','<div id="x"></div><div id="x"></div>']:
            with self.assertRaises(ValueError):listing.replace_contents(html,'x','content')
    def test_empty_collection_has_honest_empty_state(self):
        self.data['Casos']=[]
        html=listing.prepare(ROOT,self.data)['dossies.html']
        self.assertIn('Nenhum arquivo publicado nesta coleção.',html)
        a,b=listing.ElementSpan(html,'contador-casos').spans[0]
        self.assertEqual(html[a:b],'0')

if __name__ == '__main__': main()
