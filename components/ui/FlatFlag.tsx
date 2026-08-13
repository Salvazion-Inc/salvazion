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
 * Rectangular 3:2 flag chips — same outer size for USA / Chile / Brazil.
 */
const SIZE: Record<Size, string> = {
  sm: 'h-5 w-[1.875rem]', // 20×30
  md: 'h-7 w-[2.625rem] sm:h-8 sm:w-12', // 28×42 / 32×48
  lg: 'h-10 w-[3.75rem]', // 40×60
};

const INTRINSIC: Record<Size, { w: number; h: number }> = {
  sm: { w: 30, h: 20 },
  md: { w: 48, h: 32 },
  lg: { w: 60, h: 40 },
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
      className={`block object-cover object-center ${SIZE[size]} ${className}`}
      draggable={false}
    />
  );
}

export { FLAGS };
