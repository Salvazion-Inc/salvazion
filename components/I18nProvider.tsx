'use client';

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Language } from '@/lib/types';
import { translate } from '@/lib/i18n/dictionary';
import { applyDocumentLang, LOCALE_STORAGE_KEY, resolveClientLocale, saveLocale } from '@/lib/i18n/locale';
import { loadProfile, saveProfile } from '@/lib/store/profile';

interface I18nContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
});

export function useI18n() {
  return useContext(I18nContext);
}

/**
 * Global language (EN principal / ES / PT-BR).
 * The server renders `initialLang` from the salvazion_locale cookie.
 * Profile language still wins on the client, before paint.
 */
export default function I18nProvider({
  children,
  initialLang = 'en',
}: {
  children: ReactNode;
  initialLang?: Language;
}) {
  const [lang, setLangState] = useState<Language>(initialLang);

  useLayoutEffect(() => {
    const profile = loadProfile();
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    } catch {
      stored = null;
    }
    const next = resolveClientLocale({
      profileLanguage: profile.language,
      storedLocale: stored,
      navigatorLanguage: typeof navigator !== 'undefined' ? navigator.language : null,
      fallback: initialLang,
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- apply the saved locale before paint
    setLangState(next);
    applyDocumentLang(next);
    saveLocale(next);
    document.documentElement.classList.remove('locale-pending');
  }, [initialLang]);

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
