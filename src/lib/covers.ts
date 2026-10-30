// ===== Cores e capas genéricas (SVG) de audiobooks e textos =====
import React from 'react';
import { languageNamePt } from '../data/voices';

// Paleta das capas genéricas e dos destaques de fundo (as 24 primeiras são as mesmas do Audiobook Player)
export interface GenericCoverColor {
  id: string;
  name: string;
  hex: string;
}

export const GENERIC_COVER_COLORS: GenericCoverColor[] = [
  { id: 'orange', name: 'Laranja', hex: '#F97316' }, // Padrão igual à imagem do usuário
  { id: 'amber', name: 'Âmbar', hex: '#F59E0B' },
  { id: 'yellow', name: 'Amarelo', hex: '#FACC15' },
  { id: 'lime', name: 'Lima', hex: '#84CC16' },
  { id: 'emerald', name: 'Esmeralda', hex: '#10B981' },
  { id: 'teal', name: 'Verde Petróleo', hex: '#0D9488' },
  { id: 'cyan', name: 'Ciano', hex: '#06B6D4' },
  { id: 'sky', name: 'Azul Céu', hex: '#38BDF8' },
  { id: 'blue', name: 'Azul', hex: '#2563EB' },
  { id: 'indigo', name: 'Índigo', hex: '#4F46E5' },
  { id: 'violet', name: 'Violeta', hex: '#7C3AED' },
  { id: 'purple', name: 'Roxo', hex: '#9333EA' },
  { id: 'pink', name: 'Rosa', hex: '#EC4899' },
  { id: 'rose', name: 'Coral Rose', hex: '#F43F5E' },
  { id: 'red', name: 'Vermelho', hex: '#DC2626' },
  { id: 'crimson', name: 'Bordô', hex: '#991B1B' },
  { id: 'darkblue', name: 'Azul Noite', hex: '#1E3A8A' },
  { id: 'darkgreen', name: 'Verde Escuro', hex: '#14532D' },
  { id: 'charcoal', name: 'Carvão', hex: '#1E293B' },
  { id: 'slate', name: 'Ardósia', hex: '#475569' },
  { id: 'cream', name: 'Creme', hex: '#FDE68A' },
  { id: 'mint', name: 'Menta', hex: '#A7F3D0' },
  { id: 'lavender', name: 'Lavanda', hex: '#DDD6FE' },
  { id: 'peach', name: 'Pêssego', hex: '#FED7AA' },
  // Cores a mais (só aparecem quando escolhidas; a cor automática continua entre as 24 primeiras)
  { id: 'terracotta', name: 'Terracota', hex: '#C2410C' },
  { id: 'brown', name: 'Marrom', hex: '#78350F' },
  { id: 'mustard', name: 'Mostarda', hex: '#CA8A04' },
  { id: 'sand', name: 'Areia', hex: '#D6C7A1' },
  { id: 'olive', name: 'Oliva', hex: '#4D7C0F' },
  { id: 'pistachio', name: 'Pistache', hex: '#D9F99D' },
  { id: 'sage', name: 'Sálvia', hex: '#84A98C' },
  { id: 'aqua', name: 'Água-marinha', hex: '#2DD4BF' },
  { id: 'ocean', name: 'Oceano', hex: '#0E7490' },
  { id: 'ice', name: 'Gelo', hex: '#BAE6FD' },
  { id: 'periwinkle', name: 'Pervinca', hex: '#818CF8' },
  { id: 'plum', name: 'Ameixa', hex: '#701A75' },
  { id: 'magenta', name: 'Magenta', hex: '#C026D3' },
  { id: 'blush', name: 'Rosa-claro', hex: '#FBCFE8' },
  { id: 'raspberry', name: 'Framboesa', hex: '#BE123C' },
  { id: 'wine', name: 'Vinho', hex: '#4C0519' },
  { id: 'silver', name: 'Prata', hex: '#CBD5E1' },
  { id: 'graphite', name: 'Grafite', hex: '#27272A' },
];

// Cor automática de quem não escolheu nenhuma: sempre entre as 24 originais, para os livros que já existem
// não mudarem de cor quando a paleta cresce
const AUTO_COVER_COLORS = GENERIC_COVER_COLORS.slice(0, 24);

// Ordem do seletor: cores vivas pelo tom (do vermelho ao rosa), da mais clara à mais escura; neutras no fim
export const COVER_COLOR_PICKER: GenericCoverColor[] = (() => {
  const hsl = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
    const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    let h = 0;
    if (d) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return { h: (h * 60 + 360) % 360, s, l };
  };
  const neutral = (c: GenericCoverColor) => { const { s, l } = hsl(c.hex); return s < 0.2 || l < 0.12; };
  const vivid = GENERIC_COVER_COLORS.filter(c => !neutral(c))
    .sort((a, b) => Math.round(hsl(a.hex).h / 20) - Math.round(hsl(b.hex).h / 20) || hsl(b.hex).l - hsl(a.hex).l);
  const neutrals = GENERIC_COVER_COLORS.filter(neutral).sort((a, b) => hsl(b.hex).l - hsl(a.hex).l);
  return [...vivid, ...neutrals];
})();

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const c = hex.replace('#', '');
  const r = (parseInt(c.substring(0, 2), 16) || 0) / 255;
  const g = (parseInt(c.substring(2, 4), 16) || 0) / 255;
  const b = (parseInt(c.substring(4, 6), 16) || 0) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h = Math.round(h * 60);
  }
  return { h, s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function normalizeLanguageName(lang?: string): string {
  if (!lang || !lang.trim()) return 'Português (Brasil)';
  const cleaned = lang.trim().toLowerCase().replace(/_/g, '-');
  if (['unknown', 'desconhecido', 'und', '', 'none'].includes(cleaned)) return 'Português (Brasil)';
  
  // Português (Brasil e variações comuns como pt, br, pt-br)
  if (['pt', 'pt-br', 'br', 'por', 'portugues', 'português', 'pt-brasil', 'portugues (brasil)', 'português (brasil)'].includes(cleaned)) {
    return 'Português (Brasil)';
  }
  // Português (Portugal)
  if (['pt-pt', 'portugues (portugal)', 'português (portugal)'].includes(cleaned)) {
    return 'Português (Portugal)';
  }
  // Inglês
  if (['en', 'en-us', 'eng', 'english', 'ingles', 'inglês'].includes(cleaned)) {
    return 'Inglês';
  }
  if (['en-gb', 'english (uk)', 'inglês (reino unido)'].includes(cleaned)) {
    return 'Inglês (Reino Unido)';
  }
  // Espanhol
  if (['es', 'es-es', 'es-la', 'spa', 'espanhol', 'español', 'spanish'].includes(cleaned)) {
    return 'Espanhol';
  }
  // Francês
  if (['fr', 'fra', 'fre', 'frances', 'francês', 'français', 'french'].includes(cleaned)) {
    return 'Francês';
  }
  // Alemão
  if (['de', 'deu', 'ger', 'alemao', 'alemão', 'deutsch', 'german'].includes(cleaned)) {
    return 'Alemão';
  }
  // Italiano
  if (['it', 'ita', 'italiano', 'italian'].includes(cleaned)) {
    return 'Italiano';
  }
  // Russo
  if (['ru', 'ru-ru', 'rus', 'russo', 'russian', 'русский'].includes(cleaned)) {
    return 'Russo';
  }
  // Árabe
  if (['ar', 'ar-sa', 'ara', 'arabe', 'árabe', 'arabic', 'العربية'].includes(cleaned)) {
    return 'Árabe';
  }
  // Japonês
  if (['ja', 'jpn', 'japones', 'japonês', 'japanese'].includes(cleaned)) {
    return 'Japonês';
  }
  // Chinês
  if (['zh', 'zh-cn', 'chi', 'zho', 'chines', 'chinês', 'chinese', '中文'].includes(cleaned)) {
    return 'Chinês';
  }
  if (['nl', 'nl-nl', 'nld', 'dut', 'holandes', 'holandês', 'dutch', 'nederlands'].includes(cleaned)) return 'Holandês';
  if (['pl', 'pl-pl', 'pol', 'polones', 'polonês', 'polish', 'polski'].includes(cleaned)) return 'Polonês';
  if (['tr', 'tr-tr', 'tur', 'turco', 'turkish', 'türkçe'].includes(cleaned)) return 'Turco';
  if (['ko', 'ko-kr', 'kor', 'coreano', 'korean', '한국어'].includes(cleaned)) return 'Coreano';
  if (['hi', 'hi-in', 'hin', 'hindi', 'हिन्दी'].includes(cleaned)) return 'Hindi';
  // Outros idiomas com voz da Microsoft: código ("el", "sv-SE") vira o nome em português ("Grego", "Sueco")
  const codigo = cleaned.match(/^([a-z]{2,3})(?:-[a-z0-9]{2,4})?$/);
  if (codigo) {
    const nome = languageNamePt(codigo[1]);
    if (nome && nome.toLowerCase() !== codigo[1]) return nome;
  }

  return lang.trim();
}

export function hslToHex(h: number, s: number, l: number): string {
  const sNorm = Math.max(0, Math.min(100, s)) / 100;
  const lNorm = Math.max(0, Math.min(100, l)) / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sNorm * Math.min(lNorm, 1 - lNorm);
  const f = (n: number) => lNorm - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
  return '#' + toHex(f(0)) + toHex(f(8)) + toHex(f(4));
}

export function isColorLight(hex: string): boolean {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return brightness > 0.52;
}

export function getCoverTones(hex: string): {
  isLight: boolean;
  textColor: string;
  gradStart: string;
  gradMid: string;
  gradEnd: string;
  iconHex: string;
} {
  const { h, s, l } = hexToHsl(hex);
  const isLight = isColorLight(hex);

  let textColor: string;
  let gradStart: string;
  const gradMid = hex;
  let gradEnd: string;
  let iconHex: string;

  if (l >= 72) {
    gradStart = hslToHex((h - 8 + 360) % 360, Math.min(100, s + 6), Math.min(97, l + 10));
    gradEnd = hslToHex((h + 10) % 360, Math.min(100, s + 16), Math.max(48, l - 22));
    textColor = hslToHex(h, Math.min(100, Math.max(45, s + 15)), 18);
    iconHex = hslToHex(h, Math.min(100, Math.max(40, s + 10)), 44);
  } else if (isLight) {
    gradStart = hslToHex((h - 8 + 360) % 360, Math.min(100, s + 6), Math.min(92, l + 18));
    gradEnd = hslToHex((h + 10) % 360, Math.min(100, s + 8), Math.max(44, l - 18));
    textColor = hslToHex(h, Math.min(100, Math.max(50, s + 10)), 14);
    iconHex = hslToHex(h, Math.min(100, Math.max(45, s)), 33);
  } else if (l <= 32) {
    gradStart = hslToHex((h - 8 + 360) % 360, Math.min(100, s + 10), Math.min(62, l + 22));
    gradEnd = hslToHex((h + 8) % 360, Math.min(100, s + 6), Math.max(6, l - 12));
    textColor = hslToHex(h, Math.min(100, Math.max(38, s + 15)), 86);
    iconHex = hslToHex(h, Math.min(100, Math.max(35, s + 10)), 56);
  } else {
    gradStart = hslToHex((h - 8 + 360) % 360, Math.min(100, s + 6), Math.min(68, l + 16));
    gradEnd = hslToHex((h + 10) % 360, Math.min(100, s + 8), Math.max(14, l - 22));
    textColor = hslToHex(h, Math.min(100, Math.max(38, s + 12)), 88);
    iconHex = hslToHex(h, Math.min(100, Math.max(35, s)), 66);
  }

  return { isLight, textColor, gradStart, gradMid, gradEnd, iconHex };
}

export function getCoverAmbientStyle(
  coverHex: string,
  isDark: boolean,
  isError: boolean = false
): React.CSSProperties {
  const hex = coverHex || '#0086F0';
  const { h, s } = hexToHsl(hex);

  const isLowSat = s < 12;
  const baseS = isLowSat ? s : Math.min(100, Math.max(30, s));

  if (isDark) {
    // No modo escuro: tom da cor da capa mais forte e profundo, como no miniplayer do audiobook player
    const darkBg1 = hslToHex(h, Math.min(65, Math.max(20, baseS * 0.7)), 12);
    const darkBg2 = hslToHex(h, Math.min(60, Math.max(18, baseS * 0.65)), 8);
    const darkBorder = hslToHex(h, Math.min(70, Math.max(22, baseS * 0.75)), 22);

    return {
      background: `linear-gradient(135deg, ${darkBg1}F0, ${darkBg2}F5)`,
      borderColor: isError ? undefined : `${darkBorder}80`,
      boxShadow: 'none',
      transition: 'background 0.45s ease, border-color 0.45s ease',
    };
  } else {
    // No modo claro: tom visível e elegante da cor da capa, mantendo harmonia e ótima legibilidade
    const lightSat = isLowSat ? s : Math.min(75, Math.max(28, baseS * 0.72));
    const lightBg1 = hslToHex(h, lightSat, 86);
    const lightBg2 = hslToHex(h, Math.min(80, lightSat + 4), 78);
    const lightBorder = hslToHex(h, Math.min(85, lightSat + 10), 68);

    return {
      background: `linear-gradient(135deg, ${lightBg1}F5, ${lightBg2}EE)`,
      borderColor: isError ? undefined : `${lightBorder}B3`,
      boxShadow: 'none',
      transition: 'background 0.45s ease, border-color 0.45s ease',
    };
  }
}

export function getCoverProgressStyle(coverHex: string, isDark: boolean) {
  const hex = coverHex || '#0086F0';
  const { h, s } = hexToHsl(hex);
  const isLowSat = s < 12;
  const baseS = isLowSat ? s : Math.min(100, Math.max(35, s));

  if (isDark) {
    // Modo escuro: barra com a mesma cor do destaque, porém com tom mais vivo, luminoso e brilhante
    const barColor1 = hslToHex(h, Math.min(100, Math.max(50, Math.round(baseS * 1.15))), 54);
    const barColor2 = hslToHex(h, Math.min(100, Math.max(60, Math.round(baseS * 1.25))), 64);
    const trackBg = hslToHex(h, Math.min(45, Math.round(baseS * 0.4)), 16);
    return {
      barFill: `linear-gradient(90deg, ${barColor1}, ${barColor2})`,
      barShadow: `0 0 14px ${barColor1}90, 0 0 5px ${barColor2}`,
      trackBg: `${trackBg}CC`,
      barColor: barColor1
    };
  } else {
    // Modo claro: a barra é uma tonalidade mais encorpada, profunda e saturada do que o fundo claro/pastel
    const barColor1 = hslToHex(h, Math.min(95, Math.max(55, Math.round(baseS * 1.2))), 45);
    const barColor2 = hslToHex(h, Math.min(100, Math.max(65, Math.round(baseS * 1.3))), 54);
    const trackBg = hslToHex(h, Math.min(35, Math.round(baseS * 0.35)), 72);
    return {
      barFill: `linear-gradient(90deg, ${barColor1}, ${barColor2})`,
      barShadow: `0 0 14px ${barColor1}80, 0 0 5px ${barColor2}`,
      trackBg: `${trackBg}99`,
      barColor: barColor1
    };
  }
}


export function getGenericCoverColor(coverUrl?: string, title?: string, author?: string): string {
  if (coverUrl && coverUrl.startsWith('data:image/svg')) {
    try {
      const decoded = decodeURIComponent(coverUrl);
      const dataColorMatch = decoded.match(/data-color=["'](#[0-9a-fA-F]{6})["']/i);
      if (dataColorMatch) return dataColorMatch[1];
      const rectMatch = decoded.match(/<rect[^>]*fill=["'](#[0-9a-fA-F]{6})/i);
      if (rectMatch) return rectMatch[1];
    } catch {}
  }
  if (title || author) {
    let hash = 0;
    const str = (title || '') + (author || '');
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % AUTO_COVER_COLORS.length;
    return AUTO_COVER_COLORS[index].hex;
  }
  return GENERIC_COVER_COLORS[0].hex;
}

export function wrapTitleForCover(title: string, maxCharsPerLine = 18, maxLines = 3): string[] {
  const clean = (title || 'Audiobook').trim();
  const words = clean.split(/\s+/);
  const lines: string[] = [];
  let cur = '';

  for (const w of words) {
    if (!cur) {
      cur = w;
    } else if ((cur + ' ' + w).length <= maxCharsPerLine) {
      cur += ' ' + w;
    } else {
      lines.push(cur);
      cur = w;
      if (lines.length === maxLines - 1) {
        break;
      }
    }
  }
  if (cur) {
    lines.push(cur);
  }
  if (lines.length === maxLines && words.length > lines.flatMap(l => l.split(' ')).length) {
    lines[maxLines - 1] = lines[maxLines - 1].replace(/\.*$/, '') + '...';
  }
  return lines;
}

// Gerador determinístico de Capa de E-book SVG de alta resolução (Idêntico ao Audiobook Player)
export function getGenericBookCover(title?: string, author?: string, colorOrIndex?: string | number): string {
  let bgHex = '#F97316';

  if (typeof colorOrIndex === 'string' && /^#[0-9a-fA-F]{6}$/i.test(colorOrIndex)) {
    bgHex = colorOrIndex;
  } else if (typeof colorOrIndex === 'number' && !isNaN(colorOrIndex)) {
    bgHex = AUTO_COVER_COLORS[Math.abs(colorOrIndex) % AUTO_COVER_COLORS.length].hex;
  } else {
    let hash = 0;
    const str = (title || '') + (author || '');
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % AUTO_COVER_COLORS.length;
    bgHex = AUTO_COVER_COLORS[index].hex;
  }

  const { isLight, textColor, gradStart, gradMid, gradEnd, iconHex } = getCoverTones(bgHex);
  const lines = wrapTitleForCover(title || 'Audiobook', 18, 3);

  const fontSize = lines.length >= 3 ? 32 : 36;
  const lineHeight = fontSize + 10;

  const edgeMargin = 100;
  const titleCapHeight = Math.round(fontSize * 0.72);
  const startY = edgeMargin + titleCapHeight;
  const authorY = 800 - edgeMargin;

  const escapeXml = (s: string) =>
    (s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const titleSvg = lines.map((line, idx) => {
    const escaped = escapeXml(line);
    return `<text x="250" y="${Math.round(startY + idx * lineHeight)}" text-anchor="middle" font-family="Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="${fontSize}" font-weight="800" fill="${textColor}">${escaped}</text>`;
  }).join('\n  ');

  const cleanAuthor = (author && author.trim().length > 0 ? author.trim() : 'Autor Desconhecido');
  const dispAuthor = cleanAuthor.length > 28 ? cleanAuthor.slice(0, 26) + '...' : cleanAuthor;
  const escapedAuthor = escapeXml(dispAuthor);

  const iconOpacity = isLight ? '0.18' : '0.22';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 800" width="500" height="800" data-cover-v="4" data-color="${bgHex}">
  <defs>
    <linearGradient id="bg_grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${gradStart}"/>
      <stop offset="50%" stop-color="${gradMid}"/>
      <stop offset="100%" stop-color="${gradEnd}"/>
    </linearGradient>
  </defs>

  <!-- Fundo com gradiente -->
  <rect width="500" height="800" fill="url(#bg_grad)"/>

  <!-- Ícone genérico de livro com zoom enorme no fundo, parcialmente cortado pela borda, transparente e atrás do texto -->
  <g transform="translate(-20, 16) scale(32)" opacity="${iconOpacity}" stroke="${iconHex}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" fill="${iconHex}" fill-opacity="0.32"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" fill="${iconHex}" fill-opacity="0.32"/>
    <line x1="5" y1="7" x2="9" y2="7" stroke="${iconHex}" stroke-width="1.2"/>
    <line x1="5" y1="11" x2="9" y2="11" stroke="${iconHex}" stroke-width="1.2"/>
    <line x1="15" y1="7" x2="19" y2="7" stroke="${iconHex}" stroke-width="1.2"/>
    <line x1="15" y1="11" x2="19" y2="11" stroke="${iconHex}" stroke-width="1.2"/>
  </g>

  <!-- Título centralizado no topo -->
  ${titleSvg}

  <!-- Nome do autor centralizado na base (mesma distância da borda inferior que o título da borda superior) -->
  <text x="250" y="${authorY}" text-anchor="middle" font-family="Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="28" font-weight="800" fill="${textColor}">
    ${escapedAuthor}
  </text>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Gerador determinístico de Capa de Texto Quadrada SVG de alta resolução
export function getGenericTextCover(
  title?: string, 
  author?: string, 
  colorOrAudiobookCover?: string | number
): string {
  let bgHex = '#F97316';

  if (typeof colorOrAudiobookCover === 'string' && /^#[0-9a-fA-F]{6}$/i.test(colorOrAudiobookCover)) {
    bgHex = colorOrAudiobookCover;
  } else if (typeof colorOrAudiobookCover === 'string' && colorOrAudiobookCover.startsWith('data:image/svg')) {
    bgHex = getGenericCoverColor(colorOrAudiobookCover, title, author);
  } else if (typeof colorOrAudiobookCover === 'number' && !isNaN(colorOrAudiobookCover)) {
    bgHex = AUTO_COVER_COLORS[Math.abs(colorOrAudiobookCover) % AUTO_COVER_COLORS.length].hex;
  } else {
    let hash = 0;
    const str = (title || '') + (author || '');
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % AUTO_COVER_COLORS.length;
    bgHex = AUTO_COVER_COLORS[index].hex;
  }

  const { isLight, textColor, gradStart, gradMid, gradEnd, iconHex } = getCoverTones(bgHex);
  const lines = wrapTitleForCover(title || 'Texto', 18, 3);

  const fontSize = lines.length >= 3 ? 32 : 36;
  const lineHeight = fontSize + 10;

  // Capa quadrada: 600 x 600
  const edgeMargin = 85;
  const titleCapHeight = Math.round(fontSize * 0.72);
  const startY = edgeMargin + titleCapHeight;
  const authorY = 600 - edgeMargin;

  const escapeXml = (s: string) =>
    (s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const titleSvg = lines.map((line, idx) => {
    const escaped = escapeXml(line);
    return `<text x="300" y="${Math.round(startY + idx * lineHeight)}" text-anchor="middle" font-family="Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="${fontSize}" font-weight="800" fill="${textColor}">${escaped}</text>`;
  }).join('\n  ');

  const cleanAuthor = (author && author.trim().length > 0 ? author.trim() : 'Autor Desconhecido');
  const dispAuthor = cleanAuthor.length > 28 ? cleanAuthor.slice(0, 26) + '...' : cleanAuthor;
  const escapedAuthor = escapeXml(dispAuthor);

  const iconOpacity = isLight ? '0.18' : '0.22';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600" data-cover-v="4" data-cover-type="text" data-color="${bgHex}">
  <defs>
    <linearGradient id="bg_text_grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${gradStart}"/>
      <stop offset="50%" stop-color="${gradMid}"/>
      <stop offset="100%" stop-color="${gradEnd}"/>
    </linearGradient>
  </defs>

  <!-- Fundo quadrado com gradiente harmônico -->
  <rect width="600" height="600" fill="url(#bg_text_grad)"/>

  <!-- Ícone genérico de texto/documento com zoom no fundo, transparente e atrás do texto -->
  <g transform="translate(-18, -10) scale(26)" opacity="${iconOpacity}" stroke="${iconHex}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="${iconHex}" fill-opacity="0.32"/>
    <path d="M14 2v6h6" fill="none"/>
    <line x1="8" y1="12" x2="16" y2="12" stroke="${iconHex}" stroke-width="1.3"/>
    <line x1="8" y1="15.5" x2="16" y2="15.5" stroke="${iconHex}" stroke-width="1.3"/>
    <line x1="8" y1="19" x2="13" y2="19" stroke="${iconHex}" stroke-width="1.3"/>
    <line x1="8" y1="8.5" x2="11" y2="8.5" stroke="${iconHex}" stroke-width="1.3"/>
  </g>

  <!-- Título centralizado no topo -->
  ${titleSvg}

  <!-- Nome do autor centralizado na base (mesma distância da borda inferior que o título da borda superior) -->
  <text x="300" y="${authorY}" text-anchor="middle" font-family="Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="28" font-weight="800" fill="${textColor}">
    ${escapedAuthor}
  </text>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Tons derivados da cor da capa para o fundo animado dos cards (mesma paleta do player em tela cheia)
export interface CoverAmbientTones {
  tonePrimary: string;
  toneLight: string;
  toneVeryLight: string;
  toneMedium: string;
  toneDeep: string;
  toneVeryDark: string;
  tonePastel: string;
  toneWhiteTint: string;
}

export function getCoverAmbientTones(coverHex: string): CoverAmbientTones {
  const { h, s } = hexToHsl(coverHex || '#0086F0');
  const sat = s < 12 ? s : Math.min(90, Math.max(40, s));
  return {
    tonePrimary: hslToHex(h, sat, 48),
    toneLight: hslToHex(h, Math.min(95, sat + 8), 64),
    toneVeryLight: hslToHex(h, Math.min(95, sat + 10), 80),
    toneMedium: hslToHex(h, sat, 56),
    toneDeep: hslToHex(h, Math.min(90, sat + 5), 26),
    toneVeryDark: hslToHex(h, Math.max(10, sat * 0.8), 12),
    tonePastel: hslToHex(h, Math.max(10, sat * 0.7), 86),
    toneWhiteTint: hslToHex(h, Math.max(8, sat * 0.4), 95),
  };
}
