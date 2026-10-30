// ===== Opções de voz para os pop-ups de seleção =====
// Agrupadas por idioma (o da interface primeiro) e com o botão de ouvir a amostra quando a voz tem uma.
import React from 'react';
import { Globe2 } from 'lucide-react';
import type { SettingSelectorOption } from '../app/types';
import { VOICES, hasSample, languageNamePt, voiceLang, type Voice } from './voices';

const flagIcon = (v: Voice) => <span className="text-sm leading-none">{v.flag}</span>;

/** Opções de uma lista de vozes; com mais de um idioma, cada idioma vira uma seção */
export function voiceOptions(list: Voice[], firstLang?: string): SettingSelectorOption[] {
  const langs = new Set(list.map(v => v.lang));
  const ordered = langs.size > 1
    ? [...list].sort((a, b) => {
        if (a.lang !== b.lang) {
          if (a.lang === firstLang) return -1;
          if (b.lang === firstLang) return 1;
          return languageNamePt(a.lang).localeCompare(languageNamePt(b.lang), 'pt-BR');
        }
        return list.indexOf(a) - list.indexOf(b);
      })
    : list;
  return ordered.map(v => ({
    value: v.code,
    label: v.label,
    icon: flagIcon(v),
    sampleCode: hasSample(v.code) ? v.code : undefined,
    section: langs.size > 1 ? languageNamePt(v.lang) : undefined,
  }));
}

/**
 * Vozes do idioma da interface (e a voz atual, se for de outro idioma) e, no fim, "Vozes de outros idiomas":
 * uma segunda página com todas as demais vozes da Microsoft, agrupadas por idioma.
 */
export function voicePickerOptions(uiLang: string, currentVoice: string, onSelect: (code: string) => void): SettingSelectorOption[] {
  const lang = (uiLang || 'pt').slice(0, 2).toLowerCase();
  const own = VOICES.filter(v => v.lang === lang);
  const current = VOICES.find(v => v.code === currentVoice);
  const main = current && current.lang !== lang ? [current, ...own] : own;
  const others = VOICES.filter(v => v.lang !== lang);
  const otherLangs = new Set(others.map(v => v.lang)).size;
  return [
    ...voiceOptions(main.length > 0 ? main : VOICES.slice(0, 10)),
    {
      value: '__other_languages__',
      label: 'Vozes de outros idiomas',
      icon: <Globe2 size={14} />,
      hint: `${otherLangs} idiomas`,
      selected: false,
      subpage: {
        title: 'Outros idiomas',
        currentValue: currentVoice,
        options: voiceOptions(others),
        onSelect,
      },
    },
  ];
}

/** Idioma da voz em português ("Grego (Grécia)" vira "Grego") */
export const voiceLanguageName = (code: string) => languageNamePt(voiceLang(code));
