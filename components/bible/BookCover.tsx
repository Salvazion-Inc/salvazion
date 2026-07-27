'use client';

import Image from 'next/image';
import { getBookCoverSrc, getBookCoverAccent } from '@/lib/bible/covers';

type Props = {
  bookId: string;
  name: string;
  testament: 'OT' | 'NT';
  /** square grid tile | reader hero banner | compact chip */
  variant?: 'tile' | 'hero' | 'chip';
  selected?: boolean;
  chapters?: number;
  /** Optional testament label for hero variant (localized). */
  testamentLabel?: string;
  className?: string;
  priority?: boolean;
};

export default function BookCover({
  bookId,
  name,
  testament,
  variant = 'tile',
  selected = false,
  chapters,
  testamentLabel,
  className = '',
  priority = false,
}: Props) {
  const src = getBookCoverSrc(bookId);
  const accent = getBookCoverAccent(bookId, testament);

  if (variant === 'chip') {
    return (
      <span
        className={`relative inline-flex h-8 w-8 shrink-0 overflow-hidden rounded-lg border ${
          selected
            ? 'border-[var(--border-strong)] ring-1 ring-[#8FD99A]/35'
            : 'border-[var(--border-soft)]'
        } ${className}`}
      >
        <Image
          src={src}
          alt=""
          width={32}
          height={32}
          className="object-cover"
          sizes="32px"
        />
      </span>
    );
  }

  if (variant === 'hero') {
    return (
      <div
        className={`relative w-full overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-soft)] ${className}`}
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${accent}`} />
        <div className="relative aspect-[21/9] w-full sm:aspect-[2.4/1]">
          <Image
            src={src}
            alt={name}
            fill
            priority={priority}
            className="object-cover object-center opacity-95 transition-transform duration-700 ease-out will-change-transform hover:scale-[1.03]"
            sizes="(max-width: 512px) 100vw, 512px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#040404] via-[#040404]/35 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(4,4,4,0.55)_100%)]" />
          <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-[rgba(143,217,154,0.08)] rounded-[var(--radius-lg)]" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 pt-10">
          {testamentLabel ? (
            <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--accent)] font-medium mb-0.5">
              {testamentLabel}
            </p>
          ) : null}
          <h2 className="font-display text-xl font-bold text-white tracking-tight drop-shadow-sm">
            {name}
          </h2>
        </div>
      </div>
    );
  }

  // tile
  return (
    <div
      className={`group relative overflow-hidden rounded-[var(--radius-md)] border transition-all duration-200 ${
        selected
          ? 'border-[var(--border-strong)] shadow-[0_0_0_1px_rgba(143,217,154,0.25),0_8px_28px_rgba(0,0,0,0.45)]'
          : 'border-[var(--border-soft)] hover:border-[rgba(143,217,154,0.28)]'
      } ${className}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${accent}`} />
      <div className="relative aspect-[3/4] w-full">
        <Image
          src={src}
          alt={name}
          fill
          priority={priority}
          className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          sizes="(max-width: 480px) 33vw, 140px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#040404] via-[#040404]/50 to-transparent opacity-95" />
        <div className="absolute inset-x-0 bottom-0 p-2.5">
          <p className="text-[11px] font-semibold text-white leading-tight line-clamp-2">
            {name}
          </p>
          {typeof chapters === 'number' && (
            <p className="text-[9px] text-[var(--sage)]/85 mt-0.5 tabular-nums">
              {chapters} cap.
            </p>
          )}
        </div>
        {selected && (
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[var(--accent)] shadow-[0_0_8px_rgba(143,217,154,0.7)]" />
        )}
      </div>
    </div>
  );
}
