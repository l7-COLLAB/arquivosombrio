import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const script = fs.readFileSync(new URL('admin-v2/js/campanhas-editor.js', root), 'utf8');
const html = fs.readFileSync(new URL('admin-v2/campanhas.html', root), 'utf8');

class Element {
  constructor(tag = 'div') {
    this.tag = tag;
    this.children = [];
    this.handlers = {};
    this.style = {};
    this.value = '';
    this.files = [];
    this.checked = false;
    this.hidden = false;
    this.textContent = '';
  }
  setAttribute(key, value) { this[key] = value; }
  appendChild(child) { this.children.push(child); return child; }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  addEventListener(name, callback) { this.handlers[name] = callback; }
  querySelector(selector) { return selector.startsWith('option[') ? {} : null; }
}
async function setup() {
  const nodes = new Map();
  const el = id => {
    if (!nodes.has(id)) nodes.set(id, new Element(id));
    return nodes.get(id);
  };
  const campaign = {
    id: 'campaign-test', slug: 'campaign-test', theme: 'halloween',
    title: 'Teste de campanha', subtitle: 'Teste', start: '2026-10-30',
    end: '2099-01-04', status: 'scheduled', heroImage: 'staging:campaign-test/hero.png',
    cardImage: 'staging:campaign-test/card.png', days: [], overlay: 55,
    heroPosition: 65, accent: '#de8c47'
  };
  const calls = { signed: [], uploads: [], published: [], functions: [] };
  let currentPublished = null;
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: 'admin-fixture' } }, error: null }) },
    from(table) {
      if (table === 'editorial_campaigns') {
        return { select: async () => ({ data: [], error: null }) };
      }
      if (table === 'published_campaigns') {
        return {
          upsert: async data => { calls.published.push(data); currentPublished = data; return { error: null }; },
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: currentPublished ? {
                  payload: { ...currentPublished.payload, heroImage: 'https://iuhotznurbyujzbyhizf.supabase.co/storage/v1/object/public/campaign-images/campaign-test/hero.png' }
                } : null,
                error: null
              })
            })
          })
        };
      }
      throw Error('Tabela inesperada: ' + table);
    },
    storage: {
      from(bucket) {
        return {
          createSignedUrl: async (path, ttl) => {
            calls.signed.push({ bucket, path, ttl });
            return {
              error: null,
              data: { signedUrl: 'https://iuhotznurbyujzbyhizf.supabase.co/storage/v1/object/sign/campaign-covers-staging/' + path + '?token=fixture' }
            };
          },
          upload: async path => { calls.uploads.push({ bucket, path }); return { error: null }; }
        };
      }
    },
    functions: {
      invoke: async name => { calls.functions.push(name); return { data: { ok: true }, error: null }; }
    }
  };
  const context = {
    document: { getElementById: el, createElement: tag => new Element(tag) },
    sessionStorage: { getItem: key => key === 'arquivo-admin-verified-at' ? String(Date.now()) : 'admin-fixture' },
    obterSessaoAdminIsolada: async () => ({ user: { id: 'admin-fixture' } }),
    obterClienteAdminIsolado: () => client,
    fetch: async () => ({ ok: true, json: async () => ({ campaigns: [campaign] }) }),
    location: { replace: () => { throw Error('Redirecionamento inesperado'); } },
    confirm: () => true,
    URL, Blob
  };
  await vm.runInNewContext(script, context, { filename: 'campanhas-editor.js' });
  return { el, calls };
}

test('o HTML carrega a versão corrigida do editor', () => {
  assert.match(html, /campanhas-editor\.js\?v=18-campaign-diagnostics-20261101/);
});

test('prévia privada usa URLs assinadas de curta duração para hero e card', async () => {
  const { el, calls } = await setup();
  await el('preview').handlers.click();
  assert.equal(calls.signed.length, 2);
  assert(calls.signed.every(item => item.bucket === 'campaign-covers-staging' && item.ttl === 300));
  const [hero, card] = el('campaign-preview').children;
  assert.match(hero.style.backgroundImage, /\/object\/sign\/campaign-covers-staging\//);
  assert.match(card.children.find(child => child.tag === 'img').src, /\/object\/sign\/campaign-covers-staging\//);
});

test('upload privado e agendamento futuro não divulgam a capa', async () => {
  const { el, calls } = await setup();
  el('local-image').files = [{ type: 'image/png', size: 1200, name: 'capa.png' }];
  await el('upload-hero').handlers.click();
  assert.equal(calls.uploads.length, 1);
  assert.equal(calls.uploads[0].bucket, 'campaign-covers-staging');
  assert.match(el('hero-image').value, /^staging:campaign-test\/[a-z0-9-]+-hero\.png$/);
  el('publish-at').value = '2099-01-02T12:00';
  await el('publish-db').handlers.click();
  assert.equal(calls.published.length, 1);
  assert.equal(calls.published[0].publish_at, '2099-01-02T15:00:00.000Z');
  assert.match(calls.published[0].payload.heroImage, /^staging:/);
  assert.deepEqual(calls.functions, []);
});

test('publicação imediata promove capa privada e atualiza a referência visível', async () => {
  const { el, calls } = await setup();
  el('publish-at').value = '';
  await el('publish-db').handlers.click();
  assert.equal(calls.published.length, 1);
  assert.deepEqual(calls.functions, ['promote-campaign-covers']);
  assert.match(el('hero-image').value, /\/storage\/v1\/object\/public\/campaign-images\//);
});

test('agendamento com data inválida não é gravado', async () => {
  const { el, calls } = await setup();
  el('publish-at').value = 'data-errada';
  await el('publish-db').handlers.click();
  assert.equal(calls.published.length, 0);
  assert.match(el('status').textContent, /Informe data e hora válidas/);
});
