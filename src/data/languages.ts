// ===== Idiomas que o app conhece =====
// `name` é o nome guardado no e-book (o mesmo que normalizeLanguageName devolve); `code` é o código de
// duas letras usado pelas vozes e pela tradução. Os idiomas da interface do app vêm marcados (`app`).
import { VOICES } from './voices';

export interface LanguageInfo {
  code: string;
  name: string;
  native: string;
  flag: string;
  app?: boolean;
}

export const LANGUAGES: LanguageInfo[] = [
  { code: 'pt', name: 'Português (Brasil)', native: 'Português', flag: '🇧🇷', app: true },
  { code: 'pt', name: 'Português (Portugal)', native: 'Português europeu', flag: '🇵🇹' },
  { code: 'en', name: 'Inglês', native: 'English', flag: '🇺🇸', app: true },
  { code: 'en', name: 'Inglês (Reino Unido)', native: 'British English', flag: '🇬🇧' },
  { code: 'es', name: 'Espanhol', native: 'Español', flag: '🇪🇸', app: true },
  { code: 'ar', name: 'Árabe', native: 'العربية', flag: '🇸🇦', app: true },
  { code: 'ru', name: 'Russo', native: 'Русский', flag: '🇷🇺', app: true },
  { code: 'fr', name: 'Francês', native: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Alemão', native: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', native: 'Italiano', flag: '🇮🇹' },
  { code: 'nl', name: 'Holandês', native: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl', name: 'Polonês', native: 'Polski', flag: '🇵🇱' },
  { code: 'tr', name: 'Turco', native: 'Türkçe', flag: '🇹🇷' },
  { code: 'ja', name: 'Japonês', native: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: 'Chinês', native: '中文', flag: '🇨🇳' },
  { code: 'ko', name: 'Coreano', native: '한국어', flag: '🇰🇷' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
];

/** Idioma da interface (pt-BR, en-US...) -> código de duas letras */
export const appLangCode = (interfaceLang: string) => (interfaceLang || 'pt').slice(0, 2).toLowerCase();

/** Dados de um idioma pelo nome guardado no e-book */
export const languageByName = (name?: string) => LANGUAGES.find(l => l.name === name);

/**
 * Idiomas para os quais dá para traduzir: os idiomas do app que têm voz para narrar, um por código,
 * sem o idioma do livro, começando pelo que está em uso na interface.
 */
export function translationTargets(bookCode: string, interfaceLang: string): LanguageInfo[] {
  const inUse = appLangCode(interfaceLang);
  const seen = new Set<string>();
  return LANGUAGES
    .filter(l => {
      if (!l.app || seen.has(l.code) || l.code === bookCode || !VOICES.some(v => v.lang === l.code)) return false;
      seen.add(l.code);
      return true;
    })
    .sort((a, b) => Number(b.code === inUse) - Number(a.code === inUse));
}

/** Nome curto de um idioma para tradução ("Português", "Inglês"...) */
export const targetLanguageName = (code?: string) => {
  const l = LANGUAGES.find(x => x.code === code);
  return l ? l.name.replace(/\s*\(.*\)$/, '') : (code || '').toUpperCase();
};
