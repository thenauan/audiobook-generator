// ===== Textos dos componentes da interface =====
// Os componentes do esqueleto (pop-ups, cabeçalho, folhas) usam t('chave') com poucas chaves próprias.
// O idioma é o mesmo escolhido nos Ajustes do app: App.tsx chama setUiLanguage() quando ele muda.
import { useSyncExternalStore } from 'react';

const DICTIONARY: Record<string, Record<string, string>> = {
  'pt-BR': { back: 'Voltar', cancel: 'Cancelar', confirm: 'Confirmar', delete: 'Excluir', more_options: 'Mais opções', see_all: 'Ver tudo' },
  'en-US': { back: 'Back', cancel: 'Cancel', confirm: 'Confirm', delete: 'Delete', more_options: 'More options', see_all: 'See all' },
  'es-ES': { back: 'Volver', cancel: 'Cancelar', confirm: 'Confirmar', delete: 'Eliminar', more_options: 'Más opciones', see_all: 'Ver todo' },
  'ar-SA': { back: 'رجوع', cancel: 'إلغاء', confirm: 'تأكيد', delete: 'حذف', more_options: 'خيارات أخرى', see_all: 'عرض الكل' },
  'ru-RU': { back: 'Назад', cancel: 'Отмена', confirm: 'Подтвердить', delete: 'Удалить', more_options: 'Ещё', see_all: 'Показать все' },
};

let language = (() => {
  try { return localStorage.getItem('app_interface_lang') || 'pt-BR'; } catch { return 'pt-BR'; }
})();
const listeners = new Set<() => void>();

export function setUiLanguage(lang: string) {
  if (lang === language) return;
  language = lang;
  listeners.forEach(l => l());
}

export function translate(lang: string, key: string, params?: Record<string, string | number>): string {
  let text = DICTIONARY[lang]?.[key] ?? DICTIONARY['pt-BR'][key] ?? key;
  if (params) for (const [k, v] of Object.entries(params)) text = text.replace(`{${k}}`, String(v));
  return text;
}

export function useI18n() {
  const lang = useSyncExternalStore(
    (l) => { listeners.add(l); return () => { listeners.delete(l); }; },
    () => language,
    () => language,
  );
  return { language: lang, t: (key: string, params?: Record<string, string | number>) => translate(lang, key, params) };
}
