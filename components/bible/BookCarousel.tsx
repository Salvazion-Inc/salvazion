'use client';

import { useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { BibleBook } from '@/lib/bible/types';
import { getBookCoverSrc } from '@/lib/bible/covers';

type Props = {
  books: BibleBook[];
  selectedBookId: string;
  uiLang: 'es' | 'en';
  onSelect: (bookId: string) => void;
  /** Compact strip for sticky header vs larger reader carousel */
  size?: 'sm' | 'md';
  className?: string;
};

export default function BookCarousel({
  books,
  selectedBookId,
  uiLang,
  onSelect,
  size = 'md',
  className = '',
}: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const skipScrollRef = useRef(false);

  const scrollToSelected = useCallback(
    (behavior: ScrollBehavior = 'smooth') => {
      const scroller = scrollerRef.current;
      const el = itemRefs.current.get(selectedBookId);
      if (!scroller || !el) return;

      const scrollerRect = scroller.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const offset =
        elRect.left -
        scrollerRect.left -
        scrollerRect.width / 2 +
        elRect.width / 2 +
        scroller.scrollLeft;

      scroller.scrollTo({ left: Math.max(0, offset), behavior });
    },
    [selectedBookId]
  );

  useEffect(() => {
    // Center active cover when selection changes
    const t = requestAnimationFrame(() => {
      scrollToSelected(skipScrollRef.current ? 'auto' : 'smooth');
      skipScrollRef.current = false;
    });
    return () => cancelAnimationFrame(t);
  }, [selectedBookId, scrollToSelected]);

  // Initial center without animation
  useEffect(() => {
    skipScrollRef.current = true;
    scrollToSelected('auto');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isSm = size === 'sm';
  const cardW = isSm ? 'w-[3.35rem]' : 'w-[4.5rem]';
  const cardH = isSm ? 'h-[4.5rem]' : 'h-[6.1rem]';

  return (
    <div className={`relative ${className}`}>
      {/* Soft edge fades */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-[#040404] to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-[#040404] to-transparent"
        aria-hidden
      />

      <div
        ref={scrollerRef}
        className="bible-carousel flex gap-2.5 overflow-x-auto px-4 py-1 scroll-smooth snap-x snap-mandatory"
        role="listbox"
        aria-label="Bible books"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {books.map((b, i) => {
          const name = uiLang === 'en' ? b.name : b.nameEs;
          const selected = b.id === selectedBookId;
          const src = getBookCoverSrc(b.id);

          return (
            <button
              key={b.id}
              type="button"
              role="option"
              aria-selected={selected}
              aria-label={name}
              ref={(el) => {
                if (el) itemRefs.current.set(b.id, el);
                else itemRefs.current.delete(b.id);
              }}
              onClick={() => onSelect(b.id)}
              className={`bible-carousel-item group relative shrink-0 snap-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8FD99A]/45 rounded-xl ${cardW}`}
              style={{ animationDelay: `${Math.min(i, 12) * 18}ms` }}
            >
              <div
                className={`${cardH} relative overflow-hidden rounded-xl border transition-all duration-300 ease-out ${
                  selected
                    ? 'border-[var(--border-strong)] scale-105 shadow-[0_0_0_1px_rgba(143,217,154,0.28),0_0_22px_rgba(143,217,154,0.18)]'
                    : 'border-[var(--border-soft)] opacity-75 scale-95 group-hover:opacity-95 group-hover:scale-100 group-hover:border-[rgba(143,217,154,0.28)]'
                }`}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  className="object-cover"
                  sizes={isSm ? '54px' : '72px'}
                  priority={selected || i < 8}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#040404]/95 via-[#040404]/25 to-transparent" />
                {selected && (
                  <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_8px_rgba(143,217,154,0.85)] bible-pulse" />
                )}
              </div>
              <p
                className={`mt-1 text-center leading-tight line-clamp-2 px-0.5 transition-colors duration-200 ${
                  isSm ? 'text-[8px]' : 'text-[9px]'
                } ${selected ? 'text-[var(--accent)] font-semibold' : 'text-[var(--sage)]/80'}`}
              >
                {name}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
