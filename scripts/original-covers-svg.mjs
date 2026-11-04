/**
 * Original offline-generated editorial vector artwork for documentary cover fallbacks.
 * No remote imagery, fonts, copyrighted photography or identifiable persons.
 * Usage: createCover(record, 'cover'|'story'). Does not access the network.
 */
export function createCover(record, format = 'cover') {
  if (!record || !['cover', 'story'].includes(format)) throw new Error('Formato inválido');
  const escape = v => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  const story = format === 'story';
  const W = story ? 1080 : 900, H = story ? 1920 : 1200;
  const pad = story ? 88 : 72;
  const title = record.display_title || record.original_title;
  const words = String(title).trim().split(/\s+/);
  const lineMax = story ? 18 : 24;
  const lines = [], sentence = [];
  for (const word of words) {
    const next = [...sentence, word].join(' ');
    if (next.length > lineMax && sentence.length && lines.length < 3) {
      lines.push(sentence.join(' ')); sentence.length = 0;
    }
    sentence.push(word);
  }
  if (sentence.length) lines.push(sentence.join(' '));
  if (lines.length > 4) throw new Error('Texto excessivamente longo: ' + title);
  const longest = Math.max(...lines.map(x => x.length));
  const fontSize = story ? (longest > 17 ? 66 : 79) : (longest > 20 ? 53 : longest > 16 ? 61 : 71);
  const lineHeight = story ? 102 : 90;
  const colors = ({
    Casos: ['#22252d', '#12151c', '#bd8d75', '#eddfce'],
    casos_diarios: ['#222a32', '#10151b', '#b7a18b', '#ede6db'],
    pericias: ['#1b2c34', '#111d23', '#94b4b8', '#e5eced'],
    creepypastas: ['#1d2931', '#090e14', '#a2b3a1', '#e1e7d8'],
    novels: ['#343029', '#151715', '#cbb596', '#f1e9d7']
  })[record.editoria] || ['#22252d','#111820','#be9f89','#eae2d6'];
  const [top, bottom, gold, white] = colors;
  const cx = W / 2, cy = story ? 700 : 400;
  const stroke = gold, marker = record.motif || 'arquivo';
  const sym = {
    arquivo: '<path d="M-122-150H70L150-70V150H-122Z M70-150V-70H150 M-80-40H103 M-80 15H106 M-80 70H55" fill="none" stroke="'+stroke+'" stroke-width="10" stroke-linejoin="round" opacity=".85"/>',
    documento: '<path d="M-110-160H95L160-82V156H-110Z M-80-50H118 M-80 8H123 M-80 70H80" fill="none" stroke="'+stroke+'" stroke-width="11" opacity=".8"/>',
    livro: '<path d="M0-122Q-85-171-166-123V119Q-84 74 0 120Q84 74 166 119V-123Q84-171 0-122Z M0-122V120" fill="none" stroke="'+stroke+'" stroke-width="12" stroke-linejoin="round"/><path d="M-135-73Q-77-98-23-76 M30-76Q83-98 137-73 M-135-12Q-77-37-23-15 M30-15Q83-37 137-12" fill="none" stroke="'+stroke+'" stroke-width="4" opacity=".6"/>',
    vestigios: '<circle r="132" fill="none" stroke="'+stroke+'" stroke-width="10"/><circle r="69" fill="none" stroke="'+stroke+'" stroke-width="8"/><path d="M-190 0H190M0-192V192" stroke="'+stroke+'" stroke-width="4" stroke-dasharray="11 18"/><circle cx="-77" cy="-85" r="16" fill="#9b5954"/><circle cx="83" cy="58" r="13" fill="#9b5954"/>',
    caverna: '<path d="M-175 120Q-155-150-30-158Q115-160 181 120Z M-102 120Q-88-55-14-60Q63-60 100 120Z" stroke="'+stroke+'" stroke-width="11" fill="none"/><path d="M-13-55V120" stroke="'+stroke+'" stroke-width="5" opacity=".45"/>',
    caminho: '<path d="M-170 127L-92 63L-23 84L77-103L175-153" stroke="'+stroke+'" stroke-width="13" stroke-dasharray="22 14" fill="none"/><circle cx="175" cy="-153" r="37" stroke="'+stroke+'" stroke-width="10" fill="none"/>',
    mapa: '<path d="M-150-148L-57-125L62-155L157-121V130L62 97L-57 127L-150 98Z M-57-125V127 M62-155V97" stroke="'+stroke+'" stroke-width="10" fill="none"/><circle cx="18" cy="-40" r="26" fill="none" stroke="#bb7770" stroke-width="9"/>',
    relogio: '<circle r="155" stroke="'+stroke+'" stroke-width="11" fill="none"/><path d="M0-124V10L88 65" stroke="'+stroke+'" stroke-width="16" fill="none" stroke-linecap="round"/>',
    historico: '<path d="M-160-70H180 M-160 40H180 M-160 150H180" stroke="'+stroke+'" stroke-width="7" opacity=".65"/><circle cx="-80" cy="-70" r="17" fill="#ac6c60"/><circle cx="35" cy="40" r="17" fill="#ac6c60"/><circle cx="118" cy="150" r="17" fill="#ac6c60"/>',
    relato: '<path d="M-150-150H150V100H-80L-144 155V100H-150Z" stroke="'+stroke+'" stroke-width="10" fill="none"/><path d="M-100-70H103M-100-22H103M-100 27H70" stroke="'+stroke+'" stroke-width="8" opacity=".6"/>'
  }[marker] || '';
  const motifMarkup = '<g transform="translate('+cx+' '+cy+')">'+sym+'</g>';
  const txtY = story ? 1230 : 790;
  const maxHeight = story ? 1600 : 1053;
  const titles = lines.map((line, i) => '<text x="'+pad+'" y="'+(txtY+i*lineHeight)+'" font-family="Georgia,serif" font-weight="bold" font-size="'+fontSize+'" fill="'+white+'">'+escape(line)+'</text>').join('');
  const author = record.author ? '<text x="'+pad+'" y="'+Math.min(maxHeight-43, txtY + lines.length * lineHeight + 18)+'" font-family="Arial,sans-serif" font-size="'+(story?32:22)+'" letter-spacing="2" fill="'+gold+'">'+escape(String(record.author).toUpperCase())+'</text>' : '';
  const subtitle = story ? 'STORY EDITORIAL · NÃO É UMA FOTOGRAFIA' : (record.editoria === 'novels' ? 'CAPA ORIGINAL DE OBRA LITERÁRIA' : 'ILUSTRAÇÃO EDITORIAL · SEM RETRATO REAL');
  const footer = story ? 'LEIA O ARQUIVO COMPLETO · ARQUIVOSOMBRIO.NET.BR' : 'NÃO É FOTOGRAFIA, DOCUMENTO OU EVIDÊNCIA';
  return '<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" role="img" aria-labelledby="title desc">'+
  '<title id="title">'+escape(title)+' — arte editorial original</title>'+
  '<desc id="desc">Ilustração vetorial original e simbólica do Arquivo Sombrio, sem pessoa real, fotografia, imagem de terceiro ou vestígio do caso.</desc>'+
  '<defs><linearGradient id="bg" x1="0" y1="0" x2="0.9" y2="1"><stop stop-color="'+top+'"/><stop offset="1" stop-color="'+bottom+'"/></linearGradient><pattern id="lines" width="47" height="47" patternUnits="userSpaceOnUse"><path d="M47 0H0V47" fill="none" stroke="'+gold+'" opacity=".07"/></pattern></defs>'+
  '<rect width="'+W+'" height="'+H+'" fill="url(#bg)"/><rect width="'+W+'" height="'+H+'" fill="url(#lines)"/>'+
  '<rect x="40" y="40" width="'+(W-80)+'" height="'+(H-80)+'" fill="none" stroke="'+gold+'" stroke-width="2" opacity=".65"/>'+
  '<text x="'+pad+'" y="'+(story?156:137)+'" fill="'+white+'" font-size="'+(story?44:37)+'" font-family="Georgia,serif" letter-spacing="4">ARQUIVO SOMBRIO</text>'+
  '<path d="M'+pad+' '+(story?183:164)+'H'+(W-pad)+'" stroke="'+gold+'" stroke-width="2"/>'+
  '<text x="'+pad+'" y="'+(story?244:216)+'" fill="'+gold+'" font-size="'+(story?26:22)+'" font-family="Arial,sans-serif" letter-spacing="3">'+escape(record.category)+'</text>'+
  motifMarkup+
  '<rect x="0" y="'+(story?1100:681)+'" width="'+W+'" height="'+(story?621:360)+'" fill="'+bottom+'" opacity=".93"/>'+
  '<path d="M'+pad+' '+(story?1170:727)+'H'+(pad+110)+'" stroke="#aa635a" stroke-width="8"/>'+
  titles+author+
  '<path d="M'+pad+' '+(story?1695:1065)+'H'+(W-pad)+'" stroke="'+gold+'" stroke-width="3" opacity=".85"/>'+
  '<text x="'+pad+'" y="'+(story?1754:1103)+'" font-family="Arial,sans-serif" font-size="'+(story?22:17)+'" fill="'+gold+'" letter-spacing="1">'+escape(subtitle)+'</text>'+
  '<text x="'+pad+'" y="'+(story?1818:1134)+'" font-family="Arial,sans-serif" font-size="'+(story?23:16)+'" fill="'+gold+'" letter-spacing="1">'+escape(footer)+'</text>'+
  '</svg>\n';
}
