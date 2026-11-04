import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const admin = readFileSync(new URL('../admin-v2/index.html', import.meta.url), 'utf8');

test('admin v2 hides ten paused extra navigation entries without removing their modules', () => {
  const abandoned = [
    'MoneyPrinterTurbo', 'Gravador de narrações', 'Studio de vídeos',
    'Mensagens dos leitores', 'Estúdio de livros', 'Expediente e revisões',
    'Originais de ficção', 'Newsletter editorial', 'Campanhas temáticas',
    'Cadastros de leitores</span>'
  ];
  for (const label of abandoned) assert.equal(admin.includes(label), false, label);
  assert.doesNotMatch(admin, /admin-v2-extra-nav|ArquivoMoneyPrinter\?\.init\(\)/);
  assert.match(admin, /await abrirPainelAdmin\(sessao\)/);
  assert.match(admin, /await esperarCentralAdmin\(20000\)/);
  assert.match(admin, /overview\.appendChild\(metrics\)/);
  assert.match(admin, /admin_registration_metrics/);
  assert.match(admin, /ArquivoAdminEasyNav\?\.init\(\)/);
});
