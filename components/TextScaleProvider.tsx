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
  applyTextScale,
  loadTextScale,
  saveTextScale,
  type TextScale,
} from '@/lib/store/text-scale';

interface TextScaleContextValue {
  scale: TextScale;
  setScale: (s: TextScale) => void;
}

const TextScaleContext = createContext<TextScaleContextValue>({
  scale: 'md',
  setScale: () => {},
});

export function useTextScale() {
  return useContext(TextScaleContext);
}

/**
 * Restores and applies the user's preferred text size across the app.
 */
export default function TextScaleProvider({ children }: { children: ReactNode }) {
  const [scale, setScaleState] = useState<TextScale>('md');

  useEffect(() => {
    const s = loadTextScale();
    setScaleState(s);
    applyTextScale(s);
  }, []);

  const setScale = useCallback((s: TextScale) => {
    setScaleState(s);
    saveTextScale(s);
  }, []);

  const value = useMemo(() => ({ scale, setScale }), [scale, setScale]);

  // Avoid blocking render; scale applies as soon as effect runs
  return (
    <TextScaleContext.Provider value={value}>{children}</TextScaleContext.Provider>
  );
}
