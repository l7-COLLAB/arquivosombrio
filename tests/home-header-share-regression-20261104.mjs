import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const share = readFileSync(new URL('../js/public-share.js', import.meta.url), 'utf8');

test('home header has no escaped newline text in navigation', () => {
  const nav = html.match(/<nav\b[^>]*class="nav-menu"[\s\S]*?<\/nav>/);
  assert.ok(nav, 'main navigation should exist');
  assert.equal(nav[0].includes(String.raw`\n`), false);
  assert.match(nav[0], /href="edicoes\/"[\s\S]*href="#livros"/);
  assert.match(nav[0], /href="novels.html"[\s\S]*href="edicoes\//);
});

test('share button is mounted after hero actions, not in the header', () => {
  assert.match(share, /document\.body\.classList\.contains\('home-page'\)/);
  assert.match(share, /homeActions\.insertAdjacentElement\('afterend',widget\)/);
  assert.doesNotMatch(share, /\.main-header \.header-content/);
  assert.match(html, /public-share\.js\?v=20261104-home-header/);
});
