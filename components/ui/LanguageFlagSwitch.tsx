'use client';

/**
 * Equal-size EN / ES language control (USA · Chile flags).
 * 2026 pattern: fixed circular hit targets, no scale on active, ring focus.
 */
import FlatFlag from '@/components/ui/FlatFlag';
import type { Language } from '@/lib/types';

const OPTIONS: { id: Language; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'es', label: 'Español' },
];

type Size = 'sm' | 'md';

/** Button diameter — equal for both languages */
const BTN: Record<Size, string> = {
  sm: 'size-8', // 32px
  md: 'size-9', // 36px — compact nav; still ≥32px touch
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
      className={`inline-flex items-center gap-1 p-1 rounded-full border border-[var(--border-soft)] bg-black/30 ${className}`}
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
              'relative shrink-0 overflow-hidden rounded-full',
              'transition-[box-shadow,opacity,background-color] duration-200 ease-out',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
              BTN[size],
              active
                ? 'opacity-100 ring-2 ring-[var(--accent)] ring-offset-1 ring-offset-[#040404]'
                : 'opacity-60 hover:opacity-100',
            ].join(' ')}
            aria-pressed={active}
            aria-label={opt.label}
            title={opt.label}
          >
            {/* Flag fills the fixed circle — same box for EN and ES */}
            <span className="absolute inset-0 block" aria-hidden>
              <FlatFlag
                lang={opt.id}
                size="sm"
                className="!h-full !w-full !max-w-none object-cover"
              />
            </span>
          </button>
        );
      })}
    </div>
  );
}
