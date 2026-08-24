/**
 * Salvazion aesthetic themes — always dark + constellation DNA.
 * Presets only shift accent hues within brand-safe ranges.
 */

export type ThemeId = 'classic' | 'emerald' | 'aurora' | 'kingdom' | 'frost' | 'midnight';

export const THEME_STORAGE_KEY = 'salvazion_theme';

export interface ThemePreset {
  id: ThemeId;
  label: string;
  labelEn: string;
  labelPt: string;
  hint: string;
  hintEn: string;
  hintPt: string;
  /** Swatch for the picker UI */
  swatch: string;
  swatchSecondary: string;
  vars: {
    neonPrimary: string;
    neonPrimarySoft: string;
    accent: string;
    accentFill: string;
    accentHover: string;
    darkGreen: string;
    softGreen: string;
    sage: string;
    sageDim: string;
    offWhite: string;
    trueBlack: string;
    surface: string;
    iconActive: string;
    iconIdle: string;
    borderSoft: string;
    borderStrong: string;
    surfaceActive: string;
    surfaceMuted: string;
  };
}

/** Classic Salvazion mint — default brand */
const classicVars: ThemePreset['vars'] = {
  neonPrimary: '#6BCF78',
  neonPrimarySoft: '#8FD99A',
  accent: '#8FD99A',
  accentFill: '#7BC98A',
  accentHover: '#A8D4AE',
  darkGreen: '#3D8A48',
  softGreen: '#A8D4AE',
  sage: '#8AAB8E',
  sageDim: '#6B8F6E',
  offWhite: '#D8E1D9',
  trueBlack: '#040404',
  surface: '#0a0a0a',
  iconActive: '#8FD99A',
  iconIdle: '#8AAB8E',
  borderSoft: 'rgba(138, 171, 142, 0.16)',
  borderStrong: 'rgba(143, 217, 154, 0.28)',
  surfaceActive: 'rgba(143, 217, 154, 0.09)',
  surfaceMuted: 'rgba(4, 4, 4, 0.55)',
};

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'classic',
    label: 'Clásico',
    labelEn: 'Classic',
    labelPt: 'Clássico',
    hint: 'Menta Salvazion — la firma original',
    hintEn: 'Salvazion mint — the original signature',
    hintPt: 'Menta Salvazion — a assinatura original',
    swatch: '#8FD99A',
    swatchSecondary: '#6BCF78',
    vars: classicVars,
  },
  {
    id: 'emerald',
    label: 'Esmeralda',
    labelEn: 'Emerald',
    labelPt: 'Esmeralda',
    hint: 'Verde más profundo, solemne y firme',
    hintEn: 'Deeper green — solemn and firm',
    hintPt: 'Verde mais profundo, solene e firme',
    swatch: '#4ECF7A',
    swatchSecondary: '#2A9B52',
    vars: {
      neonPrimary: '#3DBF66',
      neonPrimarySoft: '#5FD98A',
      accent: '#5FD98A',
      accentFill: '#3DBF66',
      accentHover: '#7AE6A0',
      darkGreen: '#1F7A3E',
      softGreen: '#8FDEB0',
      sage: '#6FA882',
      sageDim: '#4A7A5C',
      offWhite: '#D4E5D9',
      trueBlack: '#030503',
      surface: '#080c09',
      iconActive: '#5FD98A',
      iconIdle: '#6FA882',
      borderSoft: 'rgba(95, 217, 138, 0.14)',
      borderStrong: 'rgba(95, 217, 138, 0.30)',
      surfaceActive: 'rgba(95, 217, 138, 0.10)',
      surfaceMuted: 'rgba(3, 5, 3, 0.55)',
    },
  },
  {
    id: 'aurora',
    label: 'Aurora',
    labelEn: 'Aurora',
    labelPt: 'Aurora',
    hint: 'Teal luminoso — tech y esperanza',
    hintEn: 'Luminous teal — tech and hope',
    hintPt: 'Teal luminoso — tech e esperança',
    swatch: '#5ED4B8',
    swatchSecondary: '#3AB89A',
    vars: {
      neonPrimary: '#3AB89A',
      neonPrimarySoft: '#5ED4B8',
      accent: '#5ED4B8',
      accentFill: '#3AB89A',
      accentHover: '#7FE4CC',
      darkGreen: '#1F7A68',
      softGreen: '#A0E8D6',
      sage: '#7AADA0',
      sageDim: '#558A7C',
      offWhite: '#D4E6E1',
      trueBlack: '#030506',
      surface: '#070b0c',
      iconActive: '#5ED4B8',
      iconIdle: '#7AADA0',
      borderSoft: 'rgba(94, 212, 184, 0.15)',
      borderStrong: 'rgba(94, 212, 184, 0.30)',
      surfaceActive: 'rgba(94, 212, 184, 0.10)',
      surfaceMuted: 'rgba(3, 5, 6, 0.55)',
    },
  },
  {
    id: 'kingdom',
    label: 'Reino',
    labelEn: 'Kingdom',
    labelPt: 'Reino',
    hint: 'Oro real con acento verde Salvazion',
    hintEn: 'Royal gold with Salvazion green accent',
    hintPt: 'Ouro real com acento verde Salvazion',
    swatch: '#D4B86A',
    swatchSecondary: '#8FD99A',
    vars: {
      neonPrimary: '#C9A84A',
      neonPrimarySoft: '#D4B86A',
      accent: '#D4B86A',
      accentFill: '#C9A84A',
      accentHover: '#E4CC88',
      darkGreen: '#6B8F3A',
      softGreen: '#C5D4A0',
      sage: '#A8B88A',
      sageDim: '#7A8A5C',
      offWhite: '#E8E4D4',
      trueBlack: '#060504',
      surface: '#0c0a08',
      iconActive: '#D4B86A',
      iconIdle: '#A8B88A',
      borderSoft: 'rgba(212, 184, 106, 0.16)',
      borderStrong: 'rgba(212, 184, 106, 0.32)',
      surfaceActive: 'rgba(212, 184, 106, 0.10)',
      surfaceMuted: 'rgba(6, 5, 4, 0.55)',
    },
  },
  {
    id: 'frost',
    label: 'Escarcha',
    labelEn: 'Frost',
    labelPt: 'Geada',
    hint: 'Salvia plateada — calma y claridad',
    hintEn: 'Silver sage — calm and clarity',
    hintPt: 'Sálvia prateada — calma e clareza',
    swatch: '#A8C4B0',
    swatchSecondary: '#7A9E88',
    vars: {
      neonPrimary: '#7A9E88',
      neonPrimarySoft: '#A8C4B0',
      accent: '#A8C4B0',
      accentFill: '#8AAD98',
      accentHover: '#C0D8C8',
      darkGreen: '#4A6B58',
      softGreen: '#C0D4C8',
      sage: '#8A9E90',
      sageDim: '#667A70',
      offWhite: '#DCE4DE',
      trueBlack: '#050606',
      surface: '#0a0c0b',
      iconActive: '#A8C4B0',
      iconIdle: '#8A9E90',
      borderSoft: 'rgba(168, 196, 176, 0.16)',
      borderStrong: 'rgba(168, 196, 176, 0.28)',
      surfaceActive: 'rgba(168, 196, 176, 0.09)',
      surfaceMuted: 'rgba(5, 6, 6, 0.55)',
    },
  },
  {
    id: 'midnight',
    label: 'Medianoche',
    labelEn: 'Midnight',
    labelPt: 'Meia-noite',
    hint: 'Violeta profundo con menta suave',
    hintEn: 'Deep violet with soft mint',
    hintPt: 'Violeta profundo com menta suave',
    swatch: '#9B8FD9',
    swatchSecondary: '#8FD99A',
    vars: {
      neonPrimary: '#8A7ECF',
      neonPrimarySoft: '#A89FD9',
      accent: '#A89FD9',
      accentFill: '#8A7ECF',
      accentHover: '#C0B8E8',
      darkGreen: '#5A4A8A',
      softGreen: '#B8C4A8',
      sage: '#9A9AB0',
      sageDim: '#6A6A88',
      offWhite: '#DCD8E8',
      trueBlack: '#050408',
      surface: '#0a0810',
      iconActive: '#A89FD9',
      iconIdle: '#9A9AB0',
      borderSoft: 'rgba(168, 159, 217, 0.16)',
      borderStrong: 'rgba(168, 159, 217, 0.30)',
      surfaceActive: 'rgba(168, 159, 217, 0.10)',
      surfaceMuted: 'rgba(5, 4, 8, 0.55)',
    },
  },
];

export function isThemeId(v: unknown): v is ThemeId {
  return (
    v === 'classic' ||
    v === 'emerald' ||
    v === 'aurora' ||
    v === 'kingdom' ||
    v === 'frost' ||
    v === 'midnight'
  );
}

export function getThemePreset(id: ThemeId): ThemePreset {
  return THEME_PRESETS.find((t) => t.id === id) || THEME_PRESETS[0];
}

export function loadTheme(): ThemeId {
  if (typeof window === 'undefined') return 'classic';
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (isThemeId(raw)) return raw;
  } catch {
    // ignore
  }
  return 'classic';
}

export function saveTheme(id: ThemeId): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, id);
  } catch {
    // ignore
  }
  applyTheme(id);
}

const THEME_CSS_KEYS: Array<[keyof ThemePreset['vars'], string]> = [
  ['neonPrimary', '--neon-primary'],
  ['neonPrimarySoft', '--neon-primary-soft'],
  ['accent', '--accent'],
  ['accentFill', '--accent-fill'],
  ['accentHover', '--accent-hover'],
  ['darkGreen', '--dark-green'],
  ['softGreen', '--soft-green'],
  ['sage', '--sage'],
  ['sageDim', '--sage-dim'],
  ['offWhite', '--off-white'],
  ['trueBlack', '--true-black'],
  ['surface', '--surface'],
  ['iconActive', '--icon-active'],
  ['iconIdle', '--icon-idle'],
  ['borderSoft', '--border-soft'],
  ['borderStrong', '--border-strong'],
  ['surfaceActive', '--surface-active'],
  ['surfaceMuted', '--surface-muted'],
];

/** Apply CSS custom properties to <html> */
export function applyTheme(id: ThemeId): void {
  if (typeof document === 'undefined') return;
  const preset = getThemePreset(id);
  const root = document.documentElement;
  root.dataset.theme = id;
  const v = preset.vars;
  for (const [key, cssVar] of THEME_CSS_KEYS) {
    root.style.setProperty(cssVar, v[key]);
  }
  root.style.setProperty('--theme-glow', v.accent);
}

/**
 * Inline boot script (beforeInteractive) to apply saved theme before paint.
 * Avoids flash of classic mint when user chose another preset.
 */
export function getThemeBootScript(): string {
  const map: Record<string, ThemePreset['vars']> = {};
  for (const p of THEME_PRESETS) {
    map[p.id] = p.vars;
  }
  const json = JSON.stringify(map);
  return `(function(){try{var M=${json};var id=localStorage.getItem('${THEME_STORAGE_KEY}');if(!M[id])return;var v=M[id],r=document.documentElement;r.dataset.theme=id;var pairs=[['neonPrimary','--neon-primary'],['neonPrimarySoft','--neon-primary-soft'],['accent','--accent'],['accentFill','--accent-fill'],['accentHover','--accent-hover'],['darkGreen','--dark-green'],['softGreen','--soft-green'],['sage','--sage'],['sageDim','--sage-dim'],['offWhite','--off-white'],['trueBlack','--true-black'],['surface','--surface'],['iconActive','--icon-active'],['iconIdle','--icon-idle'],['borderSoft','--border-soft'],['borderStrong','--border-strong'],['surfaceActive','--surface-active'],['surfaceMuted','--surface-muted']];for(var i=0;i<pairs.length;i++){r.style.setProperty(pairs[i][1],v[pairs[i][0]]);}r.style.setProperty('--theme-glow',v.accent);}catch(e){}})();`;
}
