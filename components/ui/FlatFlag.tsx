/**
 * Flat (non-wrinkled) national flags as SVG — USA = English, Chile = Spanish.
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
};

type Size = 'sm' | 'md' | 'lg';

const SIZE: Record<Size, string> = {
  sm: 'h-5 w-8',
  md: 'h-7 w-[44px] sm:h-8 sm:w-[51px]',
  lg: 'h-10 w-16',
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
  return (
    // eslint-disable-next-line @next/next/no-img-element -- flat SVG asset, no optimization needed
    <img
      src={f.src}
      alt={f.alt}
      width={size === 'lg' ? 64 : size === 'sm' ? 32 : 51}
      height={size === 'lg' ? 40 : size === 'sm' ? 20 : 32}
      className={`block object-cover ${SIZE[size]} ${className}`}
      draggable={false}
    />
  );
}

export { FLAGS };
