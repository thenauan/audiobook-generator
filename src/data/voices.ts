// ===== Vozes neurais disponíveis (Microsoft Edge TTS) =====
// Todas as vozes da Microsoft (75 idiomas): a interface tem 5 idiomas, mas dá para narrar em qualquer um.
// As listas mostram as vozes do idioma do livro; idioma não reconhecido: todas, agrupadas por idioma.
// Vozes escolhidas à mão vêm primeiro (nomes revisados); as demais vêm do catálogo (edgeVoices.json).
import CATALOGO from './edgeVoices.json';
import AMOSTRAS from './voiceSamples.json';

export interface Voice {
  code: string;
  lang: string;   // código de duas letras (pt, en, es, ar, ru...)
  label: string;  // "Português (BR) - Antônio (Masculino)"
  flag: string;
}

const ESCOLHIDAS: Voice[] = [
  { code: 'pt-BR-AntonioNeural', lang: 'pt', label: 'Português (BR) - Antônio (Masculino)', flag: '🇧🇷' },
  { code: 'pt-BR-FranciscaNeural', lang: 'pt', label: 'Português (BR) - Francisca (Feminino)', flag: '🇧🇷' },
  { code: 'pt-BR-ThalitaMultilingualNeural', lang: 'pt', label: 'Português (BR) - Thalita (Feminino)', flag: '🇧🇷' },
  { code: 'pt-PT-DuarteNeural', lang: 'pt', label: 'Português (PT) - Duarte (Masculino)', flag: '🇵🇹' },
  { code: 'pt-PT-RaquelNeural', lang: 'pt', label: 'Português (PT) - Raquel (Feminino)', flag: '🇵🇹' },
  { code: 'en-US-AndrewNeural', lang: 'en', label: 'English (US) - Andrew (Male)', flag: '🇺🇸' },
  { code: 'en-US-AvaNeural', lang: 'en', label: 'English (US) - Ava (Female)', flag: '🇺🇸' },
  { code: 'en-US-GuyNeural', lang: 'en', label: 'English (US) - Guy (Male)', flag: '🇺🇸' },
  { code: 'en-US-JennyNeural', lang: 'en', label: 'English (US) - Jenny (Female)', flag: '🇺🇸' },
  { code: 'en-GB-RyanNeural', lang: 'en', label: 'English (UK) - Ryan (Male)', flag: '🇬🇧' },
  { code: 'en-GB-SoniaNeural', lang: 'en', label: 'English (UK) - Sonia (Female)', flag: '🇬🇧' },
  { code: 'es-ES-AlvaroNeural', lang: 'es', label: 'Español (ES) - Álvaro (Masculino)', flag: '🇪🇸' },
  { code: 'es-ES-ElviraNeural', lang: 'es', label: 'Español (ES) - Elvira (Femenino)', flag: '🇪🇸' },
  { code: 'es-MX-JorgeNeural', lang: 'es', label: 'Español (MX) - Jorge (Masculino)', flag: '🇲🇽' },
  { code: 'es-MX-DaliaNeural', lang: 'es', label: 'Español (MX) - Dalia (Femenino)', flag: '🇲🇽' },
  { code: 'ru-RU-DmitryNeural', lang: 'ru', label: 'Русский - Дмитрий (мужской)', flag: '🇷🇺' },
  { code: 'ru-RU-SvetlanaNeural', lang: 'ru', label: 'Русский - Светлана (женский)', flag: '🇷🇺' },
  { code: 'ar-SA-HamedNeural', lang: 'ar', label: 'العربية - حامد (ذكر)', flag: '🇸🇦' },
  { code: 'ar-SA-ZariyahNeural', lang: 'ar', label: 'العربية - زارية (أنثى)', flag: '🇸🇦' },
  { code: 'fr-FR-HenriNeural', lang: 'fr', label: 'Français - Henri (Masculin)', flag: '🇫🇷' },
  { code: 'fr-FR-DeniseNeural', lang: 'fr', label: 'Français - Denise (Féminin)', flag: '🇫🇷' },
  { code: 'de-DE-ConradNeural', lang: 'de', label: 'Deutsch - Conrad (Männlich)', flag: '🇩🇪' },
  { code: 'de-DE-KatjaNeural', lang: 'de', label: 'Deutsch - Katja (Weiblich)', flag: '🇩🇪' },
  { code: 'it-IT-DiegoNeural', lang: 'it', label: 'Italiano - Diego (Maschile)', flag: '🇮🇹' },
  { code: 'it-IT-ElsaNeural', lang: 'it', label: 'Italiano - Elsa (Femminile)', flag: '🇮🇹' },
  { code: 'nl-NL-MaartenNeural', lang: 'nl', label: 'Nederlands - Maarten (Man)', flag: '🇳🇱' },
  { code: 'nl-NL-ColetteNeural', lang: 'nl', label: 'Nederlands - Colette (Vrouw)', flag: '🇳🇱' },
  { code: 'pl-PL-MarekNeural', lang: 'pl', label: 'Polski - Marek (Mężczyzna)', flag: '🇵🇱' },
  { code: 'pl-PL-ZofiaNeural', lang: 'pl', label: 'Polski - Zofia (Kobieta)', flag: '🇵🇱' },
  { code: 'tr-TR-AhmetNeural', lang: 'tr', label: 'Türkçe - Ahmet (Erkek)', flag: '🇹🇷' },
  { code: 'tr-TR-EmelNeural', lang: 'tr', label: 'Türkçe - Emel (Kadın)', flag: '🇹🇷' },
  { code: 'ja-JP-KeitaNeural', lang: 'ja', label: '日本語 - Keita (男性)', flag: '🇯🇵' },
  { code: 'ja-JP-NanamiNeural', lang: 'ja', label: '日本語 - Nanami (女性)', flag: '🇯🇵' },
  { code: 'zh-CN-YunxiNeural', lang: 'zh', label: '中文 - Yunxi (男)', flag: '🇨🇳' },
  { code: 'zh-CN-XiaoxiaoNeural', lang: 'zh', label: '中文 - Xiaoxiao (女)', flag: '🇨🇳' },
  { code: 'ko-KR-InJoonNeural', lang: 'ko', label: '한국어 - InJoon (남성)', flag: '🇰🇷' },
  { code: 'ko-KR-SunHiNeural', lang: 'ko', label: '한국어 - SunHi (여성)', flag: '🇰🇷' },
  { code: 'hi-IN-MadhurNeural', lang: 'hi', label: 'हिन्दी - Madhur (पुरुष)', flag: '🇮🇳' },
  { code: 'hi-IN-SwaraNeural', lang: 'hi', label: 'हिन्दी - Swara (महिला)', flag: '🇮🇳' },
];

// ---------------------------------------------------------------------------------------------
// Catálogo completo
// ---------------------------------------------------------------------------------------------
const nomesPt = typeof Intl !== 'undefined' && (Intl as any).DisplayNames ? new (Intl as any).DisplayNames(['pt-BR'], { type: 'language' }) : null;
const regioesPt = typeof Intl !== 'undefined' && (Intl as any).DisplayNames ? new (Intl as any).DisplayNames(['pt-BR'], { type: 'region' }) : null;
const maiuscula = (t: string) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);

/** Nome do idioma em português ("Grego", "Japonês"...) a partir do código */
export function languageNamePt(code: string): string {
  try { return maiuscula(nomesPt?.of(code) || code); } catch { return code; }
}

function nomeNativo(lang: string): string {
  try { return maiuscula(new (Intl as any).DisplayNames([lang], { type: 'language' }).of(lang) || lang); } catch { return lang; }
}

function bandeira(regiao?: string): string {
  if (!regiao || !/^[A-Z]{2}$/.test(regiao)) return '🌐';
  return String.fromCodePoint(...[...regiao].map(c => 0x1f1e6 + c.charCodeAt(0) - 65));
}

const GENERO: Record<string, [string, string]> = {
  pt: ['Masculino', 'Feminino'], es: ['Masculino', 'Femenino'], en: ['Male', 'Female'], fr: ['Homme', 'Femme'],
  it: ['Maschile', 'Femminile'], de: ['Männlich', 'Weiblich'], ru: ['мужской', 'женский'], ar: ['ذكر', 'أنثى'],
};

const doCatalogo = (CATALOGO as { c: string; l: string; g: string }[])
  .filter(v => !ESCOLHIDAS.some(e => e.code === v.c))
  .map((v): Voice => {
    const lang = v.l.split('-')[0];
    const regiao = v.l.split('-').find(p => /^[A-Z]{2}$/.test(p));
    const nome = v.c.slice(v.l.length + 1).replace(/Neural$/, '').replace(/Multilingual$/, ' Multilingual').trim();
    const [m, f] = GENERO[lang] || GENERO.pt;
    return { code: v.c, lang, label: `${nomeNativo(lang)}${regiao ? ` (${regiao})` : ''} - ${nome} (${v.g === 'F' ? f : m})`, flag: bandeira(regiao) };
  });

/** Todas as vozes: as escolhidas primeiro, depois o catálogo da Microsoft */
export const VOICES: Voice[] = [...ESCOLHIDAS, ...doCatalogo];

const COM_AMOSTRA = new Set<string>(AMOSTRAS as string[]);
/** A voz tem amostra para ouvir antes de escolher (todas as vozes dos idiomas do app têm) */
export const hasSample = (code: string) => COM_AMOSTRA.has(code);

// Nomes de idioma (em português e no próprio idioma) -> código, para reconhecer idiomas digitados ou lidos do livro
const CODIGO_POR_NOME = (() => {
  const mapa = new Map<string, string>();
  for (const v of VOICES) {
    for (const n of [languageNamePt(v.lang), nomeNativo(v.lang)]) {
      const chave = n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (chave && !mapa.has(chave)) mapa.set(chave, v.lang);
    }
  }
  return mapa;
})();

/** Idioma (nome exibido no app ou código) -> código de duas letras. Vazio se não reconhecido. */
export function languageCode(name?: string): string {
  const l = (name || '').trim().toLowerCase();
  if (!l) return '';
  if (l.includes('portug') || /^pt\b|^pt-/.test(l)) return 'pt';
  if (l.includes('ingl') || l.includes('english') || /^en\b|^en-/.test(l)) return 'en';
  if (l.includes('espanh') || l.includes('españ') || l.includes('spanish') || /^es\b|^es-/.test(l)) return 'es';
  if (l.includes('russ') || l.includes('русск') || /^ru\b|^ru-/.test(l)) return 'ru';
  if (l.includes('árab') || l.includes('arab') || l.includes('عرب') || /^ar\b|^ar-/.test(l)) return 'ar';
  if (l.includes('franc') || l.includes('french') || /^fr\b|^fr-/.test(l)) return 'fr';
  if (l.includes('alem') || l.includes('german') || l.includes('deutsch') || /^de\b|^de-/.test(l)) return 'de';
  if (l.includes('italia') || /^it\b|^it-/.test(l)) return 'it';
  if (l.includes('holand') || l.includes('dutch') || l.includes('nederl') || /^nl\b|^nl-/.test(l)) return 'nl';
  if (l.includes('polon') || l.includes('polish') || l.includes('polski') || /^pl\b|^pl-/.test(l)) return 'pl';
  if (l.includes('turc') || l.includes('turk') || l.includes('türk') || /^tr\b|^tr-/.test(l)) return 'tr';
  if (l.includes('japon') || l.includes('japan') || l.includes('日本') || /^ja\b|^ja-/.test(l)) return 'ja';
  if (l.includes('chin') || l.includes('中文') || /^zh\b|^zh-/.test(l)) return 'zh';
  if (l.includes('corean') || l.includes('korean') || l.includes('한국') || /^ko\b|^ko-/.test(l)) return 'ko';
  if (l.includes('hindi') || l.includes('हिन्दी') || /^hi\b|^hi-/.test(l)) return 'hi';
  // Qualquer outro idioma com voz da Microsoft: pelo código ("el", "sv-SE") ou pelo nome ("Grego", "Ελληνικά")
  const codigo = l.match(/^([a-z]{2,3})(?:[-_][a-z0-9]+)*$/);
  if (codigo && VOICES.some(v => v.lang === codigo[1])) return codigo[1];
  const semAcento = l.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s*\(.*\)$/, '');
  return CODIGO_POR_NOME.get(semAcento) || '';
}

export const voiceLang = (code?: string) => (code || '').slice(0, 2).toLowerCase();

/** Vozes de um idioma; se o idioma não tem vozes (ou não foi reconhecido), todas. */
export function voicesFor(lang: string): Voice[] {
  const list = VOICES.filter(v => v.lang === lang);
  return list.length > 0 ? list : VOICES;
}

/**
 * Voz que um livro vai usar: a escolhida nele, se for do idioma narrado; senão a voz padrão (se for desse
 * idioma) ou a primeira voz desse idioma. O idioma narrado é o do livro, ou o da voz padrão quando o
 * livro vai ser traduzido.
 */
export function effectiveVoice(file: { voice?: string; language?: string; requiresTranslation?: boolean; translateTo?: string }, defaultVoice: string): string {
  const lang = narrationLang(file, defaultVoice);
  const options = voicesFor(lang);
  if (file.voice && options.some(v => v.code === file.voice)) return file.voice;
  if (options.some(v => v.code === defaultVoice)) return defaultVoice;
  return options[0]?.code || defaultVoice;
}

/** Idioma cujas vozes aparecem para um livro (vazio = todas). */
export function narrationLang(file: { language?: string; requiresTranslation?: boolean; translateTo?: string }, defaultVoice: string): string {
  return file.requiresTranslation ? (file.translateTo || voiceLang(defaultVoice)) : languageCode(file.language);
}
