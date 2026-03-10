import ru from '@/i18n/ru.json';
import uz from '@/i18n/uz.json';
import en from '@/i18n/en.json';

export type Lang = 'ru' | 'uz' | 'en';

const translations: Record<Lang, Record<string, string>> = { ru, uz, en };

export function t(key: string, lang: Lang): string {
  return translations[lang]?.[key] ?? translations['ru']?.[key] ?? key;
}

export const LANG_LABELS: Record<Lang, string> = {
  ru: 'Русский',
  uz: "O'zbek",
  en: 'English',
};

export const LANG_FLAGS: Record<Lang, string> = {
  ru: '🇷🇺',
  uz: '🇺🇿',
  en: '🇬🇧',
};

/** Detect browser language and map to supported Lang */
export function detectBrowserLang(): Lang {
  const nav = navigator.language?.toLowerCase() || '';
  if (nav.startsWith('uz')) return 'uz';
  if (nav.startsWith('en')) return 'en';
  return 'ru';
}
