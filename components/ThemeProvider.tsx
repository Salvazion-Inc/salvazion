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
import {
  applyTheme,
  loadTheme,
  saveTheme,
  type ThemeId,
} from '@/lib/store/theme';

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'classic',
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

/**
 * Restores and applies the user's preferred aesthetic theme.
 * Always keeps Salvazion dark + constellation DNA.
 */
export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>('classic');

  useEffect(() => {
    const id = loadTheme();
    setThemeState(id);
    applyTheme(id);
  }, []);

  const setTheme = useCallback((id: ThemeId) => {
    setThemeState(id);
    saveTheme(id);
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
