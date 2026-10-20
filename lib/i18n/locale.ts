import type { BibleVersion, Language } from '@/lib/types';

export const LOCALE_STORAGE_KEY = 'salvazion_locale';
export const LOCALE_COOKIE = 'salvazion_locale';

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

/** Cookie value, or a full Cookie header, → language. */
export function parseLocaleCookie(value: string | null | undefined): Language | null {
  if (!value) return null;
  const direct = value.trim();
  if (isLanguage(direct)) return direct;
  const match = direct.match(/(?:^|;\s*)salvazion_locale=(es|en|pt)(?:\s*;|$)/);
  return match ? (match[1] as Language) : null;
}

/**
 * Profile language wins, then the saved locale, then the browser, then fallback.
 * The boot script uses the same order so the first paint can stay hidden
 * instead of flashing English.
 */
export function resolveClientLocale(input: {
  profileLanguage?: string | null;
  storedLocale?: string | null;
  navigatorLanguage?: string | null;
  fallback?: Language;
}): Language {
  if (isLanguage(input.profileLanguage)) return input.profileLanguage;
  if (isLanguage(input.storedLocale)) return input.storedLocale;
  const nav = (input.navigatorLanguage || '').toLowerCase();
  if (nav.startsWith('es')) return 'es';
  if (nav.startsWith('pt')) return 'pt';
  return input.fallback ?? 'en';
}

/**
 * Runs before paint. If the saved profile/locale differs from the SSR cookie
 * language, hide the body until React applies the real language.
 */
export function getLocaleBootScript(): string {
  return `(function(){try{var ssr=document.documentElement.dataset.ssrLocale||'en';var next=ssr;var profileLang=null;var raw=localStorage.getItem('salvazion_profile');if(raw){var parsed=JSON.parse(raw);var data=parsed&&parsed.data?parsed.data:parsed;var pl=data&&data.language;if(pl==='es'||pl==='en'||pl==='pt')profileLang=pl;}if(profileLang)next=profileLang;else{var L=localStorage.getItem('salvazion_locale');if(L==='es'||L==='en'||L==='pt')next=L;else{var nav=(navigator.language||'').toLowerCase();if(nav.indexOf('es')===0)next='es';else if(nav.indexOf('pt')===0)next='pt';}}if(next!==ssr){document.documentElement.classList.add('locale-pending');setTimeout(function(){document.documentElement.classList.remove('locale-pending');},2000);}document.documentElement.lang=next==='pt'?'pt-BR':next;document.documentElement.dataset.locale=next;}catch(e){}})();`;
}

/**
 * English is principal. Default: saved locale → browser → `en`.
 */
export function loadLocale(): Language {
  if (typeof window === 'undefined') return 'en';
  try {
    const raw = localStorage.getItem(LOCALE_STORAGE_KEY);
    const nav = navigator.language || '';
    return resolveClientLocale({ storedLocale: raw, navigatorLanguage: nav });
  } catch {
    return 'en';
  }
}

export function saveLocale(lang: Language): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, lang);
  } catch {
    // ignore
  }
  try {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${LOCALE_COOKIE}=${lang}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
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
