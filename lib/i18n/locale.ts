import type { BibleVersion, Language } from '@/lib/types';

export const LOCALE_STORAGE_KEY = 'salvazion_locale';

export const SUPPORTED_LANGUAGES: Language[] = ['en', 'es', 'pt'];

export function isLanguage(v: unknown): v is Language {
  return v === 'es' || v === 'en' || v === 'pt';
}

/** BCP 47 tag for dates, SEO, and `document.documentElement.lang`. */
export function localeTag(lang: Language | string | undefined): string {
  if (lang === 'es') return 'es';
  if (lang === 'pt') return 'pt-BR';
  return 'en';
}

/** Pick a localized value. English is the fallback. */
export function pickLang<T>(
  lang: Language | string | undefined,
  map: { en: T; es: T; pt: T }
): T {
  if (lang === 'es') return map.es;
  if (lang === 'pt') return map.pt;
  return map.en;
}

/** EN / ES / PT string helper — English is principal. */
export function tx3(
  lang: Language | string | undefined,
  en: string,
  es: string,
  pt: string
): string {
  return pickLang(lang, { en, es, pt });
}

export function defaultBibleVersion(lang: Language | string | undefined): BibleVersion {
  // Stored id remains rv1960 for existing profiles; the text is Reina Valera 1909.
  if (lang === 'es') return 'rv1960';
  if (lang === 'pt') return 'arc';
  return 'kjv';
}

/**
 * English is principal. Default: saved locale → browser → `en`.
 */
export function loadLocale(): Language {
  if (typeof window === 'undefined') return 'en';
  try {
    const raw = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLanguage(raw)) return raw;
    const nav = navigator.language?.toLowerCase() || '';
    if (nav.startsWith('es')) return 'es';
    if (nav.startsWith('pt')) return 'pt';
  } catch {
    // ignore
  }
  return 'en';
}

export function saveLocale(lang: Language): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, lang);
  } catch {
    // ignore
  }
  applyDocumentLang(lang);
}

export function applyDocumentLang(lang: Language): void {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = localeTag(lang);
  document.documentElement.dataset.locale = lang;
}
