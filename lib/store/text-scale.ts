/**
 * Global text scale for accessibility.
 * Scales the root rem so Tailwind text utilities grow together.
 */

export type TextScale = 'md' | 'lg' | 'xl' | 'xxl';

export const TEXT_SCALE_STORAGE_KEY = 'salvazion_text_scale';

export const TEXT_SCALE_OPTIONS: {
  id: TextScale;
  label: string;
  labelEn: string;
  labelPt: string;
  /** Root font-size in px */
  px: number;
  /** Preview letter size class hint */
  sample: string;
}[] = [
  { id: 'md', label: 'Normal', labelEn: 'Normal', labelPt: 'Normal', px: 16, sample: 'Aa' },
  { id: 'lg', label: 'Grande', labelEn: 'Large', labelPt: 'Grande', px: 18, sample: 'Aa' },
  { id: 'xl', label: 'Muy grande', labelEn: 'Extra large', labelPt: 'Muito grande', px: 20, sample: 'Aa' },
  { id: 'xxl', label: 'Máxima', labelEn: 'Maximum', labelPt: 'Máxima', px: 22, sample: 'Aa' },
];

export function isTextScale(v: unknown): v is TextScale {
  return v === 'md' || v === 'lg' || v === 'xl' || v === 'xxl';
}

export function loadTextScale(): TextScale {
  if (typeof window === 'undefined') return 'md';
  try {
    const raw = localStorage.getItem(TEXT_SCALE_STORAGE_KEY);
    if (isTextScale(raw)) return raw;
  } catch {
    // ignore
  }
  return 'md';
}

export function saveTextScale(scale: TextScale): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TEXT_SCALE_STORAGE_KEY, scale);
  } catch {
    // ignore
  }
  applyTextScale(scale);
}

/** Apply scale to <html> (dataset + CSS variable). */
export function applyTextScale(scale: TextScale): void {
  if (typeof document === 'undefined') return;
  const opt = TEXT_SCALE_OPTIONS.find((o) => o.id === scale) || TEXT_SCALE_OPTIONS[0];
  document.documentElement.dataset.textScale = scale;
  document.documentElement.style.setProperty('--app-text-scale', String(opt.px / 16));
  document.documentElement.style.fontSize = `${opt.px}px`;
}

export function getTextScaleMeta(scale: TextScale) {
  return TEXT_SCALE_OPTIONS.find((o) => o.id === scale) || TEXT_SCALE_OPTIONS[0];
}
