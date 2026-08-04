'use client';

/**
 * Equal-size EN / ES language control (USA · Chile flags).
 * Rectangular chips (not circles) so stars/cantons stay fully visible.
 */
import FlatFlag from '@/components/ui/FlatFlag';
import type { Language } from '@/lib/types';

const OPTIONS: { id: Language; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'es', label: 'Español' },
];

type Size = 'sm' | 'md';

/**
 * Fixed flag frame — same box for both nations (≈ 3:2).
 * object-contain keeps USA stars + Chile star fully inside the frame.
 */
const FRAME: Record<Size, string> = {
  sm: 'h-5 w-8', // 20×32
  md: 'h-7 w-11 sm:h-8 sm:w-12', // 28×44 / 32×48
};

interface Props {
  value: Language;
  onChange: (lang: Language) => void;
  /** Accessible group label */
  ariaLabel: string;
  size?: Size;
  className?: string;
}

export default function LanguageFlagSwitch({
  value,
  onChange,
  ariaLabel,
  size = 'md',
  className = '',
}: Props) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 p-1 rounded-full border border-[var(--border-soft)] bg-black/30 ${className}`}
      role="group"
      aria-label={ariaLabel}
    >
      {OPTIONS.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={[
              /* Softer corners (~8px) without circle-cropping the stars */
              'relative shrink-0 overflow-hidden rounded-lg',
              'bg-[#0a0a0a]',
              'transition-[box-shadow,opacity,transform] duration-200 ease-out',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
              FRAME[size],
              active
                ? 'opacity-100 ring-2 ring-[var(--accent)] ring-offset-1 ring-offset-[#040404]'
                : 'opacity-70 hover:opacity-100',
            ].join(' ')}
            aria-pressed={active}
            aria-label={opt.label}
            title={opt.label}
          >
            {/* Inset keep stars clear of rounded corner clip */}
            <span
              className="absolute inset-0 flex items-center justify-center p-[2px] sm:p-[3px]"
              aria-hidden
            >
              <FlatFlag
                lang={opt.id}
                size="sm"
                className="!h-full !w-full !max-w-none object-contain object-center rounded-md"
              />
            </span>
          </button>
        );
      })}
    </div>
  );
}
