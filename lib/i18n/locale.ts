import type { Language } from '@/lib/types';

export const LOCALE_STORAGE_KEY = 'salvazion_locale';

export function isLanguage(v: unknown): v is Language {
  return v === 'es' || v === 'en';
}

export function loadLocale(): Language {
  if (typeof window === 'undefined') return 'es';
  try {
    const raw = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLanguage(raw)) return raw;
    // browser preference
    const nav = navigator.language?.toLowerCase() || '';
    if (nav.startsWith('en')) return 'en';
  } catch {
    // ignore
  }
  return 'es';
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
  document.documentElement.lang = lang;
  document.documentElement.dataset.locale = lang;
}
