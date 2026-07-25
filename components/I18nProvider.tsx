'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Language } from '@/lib/types';
import { translate } from '@/lib/i18n/dictionary';
import { applyDocumentLang, loadLocale, saveLocale } from '@/lib/i18n/locale';
import { loadProfile, saveProfile } from '@/lib/store/profile';

interface I18nContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue>({
  lang: 'es',
  setLang: () => {},
  t: (key) => key,
});

export function useI18n() {
  return useContext(I18nContext);
}

/**
 * Global language (ES/EN) for the whole app.
 * Preference: localStorage → profile.language → browser.
 */
export default function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('es');

  useEffect(() => {
    const fromStore = loadLocale();
    // Prefer profile language if set
    const profile = loadProfile();
    const initial =
      profile.language === 'en' || profile.language === 'es'
        ? profile.language
        : fromStore;
    setLangState(initial);
    applyDocumentLang(initial);
    saveLocale(initial);
  }, []);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    saveLocale(next);
    // Persist on profile when available (non-blocking)
    try {
      const profile = loadProfile();
      void saveProfile({ ...profile, language: next });
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
