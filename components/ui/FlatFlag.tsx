/**
 * Flat (non-wrinkled) national flags as SVG —
 * USA = English, Chile = Spanish, Brazil = Portuguese.
 * Used on landing and in-app language controls.
 */
import type { Language } from '@/lib/types';

const FLAGS: Record<
  Language,
  { src: string; alt: string; label: string }
> = {
  en: {
    src: '/flags/usa.svg',
    alt: 'United States',
    label: 'English',
  },
  es: {
    src: '/flags/chile.svg',
    alt: 'Chile',
    label: 'Español',
  },
  pt: {
    src: '/flags/brazil.svg',
    alt: 'Brasil',
    label: 'Português',
  },
};

type Size = 'sm' | 'md' | 'lg';

/**
 * Rectangular flag chips (list cards, profile, language switch).
 * Default object-contain so USA stars / Chile star are not cropped.
 */
const SIZE: Record<Size, string> = {
  sm: 'h-5 w-8',
  md: 'h-7 w-11 sm:h-8 sm:w-12',
  lg: 'h-10 w-16',
};

const INTRINSIC: Record<Size, { w: number; h: number }> = {
  sm: { w: 32, h: 20 },
  md: { w: 48, h: 32 },
  lg: { w: 64, h: 40 },
};

export default function FlatFlag({
  lang,
  size = 'md',
  className = '',
}: {
  lang: Language;
  size?: Size;
  className?: string;
}) {
  const f = FLAGS[lang];
  const dim = INTRINSIC[size];
  return (
    // eslint-disable-next-line @next/next/no-img-element -- flat SVG asset, no optimization needed
    <img
      src={f.src}
      alt={f.alt}
      width={dim.w}
      height={dim.h}
      className={`block object-contain object-center ${SIZE[size]} ${className}`}
      draggable={false}
    />
  );
}

export { FLAGS };
