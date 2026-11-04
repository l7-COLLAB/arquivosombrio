import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const admin = readFileSync(new URL('../admin-v2/index.html', import.meta.url), 'utf8');

test('Admin V2 preserves Estúdio de livros and Campanhas temáticas in the sidebar', () => {
  assert.match(admin, /className="admin-v2-extra-nav"/);
  assert.match(admin, /href="\.\/editorial\/"[^>]*>[^]*?<span>Estúdio de livros<\/span>/);
  assert.match(admin, /href="\.\/campanhas\.html"[^>]*>[^]*?<span>Campanhas temáticas<\/span>/);
  assert.equal((admin.match(/<span>Estúdio de livros<\/span>/g)||[]).length,1);
  assert.equal((admin.match(/<span>Campanhas temáticas<\/span>/g)||[]).length,1);
});

test('Admin V2 keeps the other eight unused shortcuts hidden without deleting modules', () => {
  const paused = [
    'MoneyPrinterTurbo','Gravador de narrações','Studio de vídeos',
    'Mensagens dos leitores','Expediente e revisões',
    'Originais de ficção','Newsletter editorial','Cadastros de leitores</span>'
  ];
  for (const label of paused) assert.equal(admin.includes(label), false, label);
  assert.doesNotMatch(admin,/ArquivoMoneyPrinter\?\.init\(\)/);
  assert.match(admin, /await abrirPainelAdmin\(sessao\)/);
  assert.match(admin, /await esperarCentralAdmin\(20000\)/);
  assert.match(admin, /overview\.appendChild\(metrics\)/);
  assert.match(admin, /admin_registration_metrics/);
  assert.match(admin, /ArquivoAdminEasyNav\?\.init\(\)/);
});
