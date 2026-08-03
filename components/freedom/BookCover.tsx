'use client';

import { useMemo, useState } from 'react';
import {
  bookCoverCandidates,
  type RecommendedBook,
} from '@/lib/freedom/books';

type Props = {
  book: RecommendedBook;
  className?: string;
};

/**
 * Simple reliable book cover:
 * try local/static candidates in order; skip 1×1 placeholders; show mark fallback.
 */
export default function BookCover({ book, className = '' }: Props) {
  const candidates = useMemo(() => bookCoverCandidates(book), [book]);
  const [idx, setIdx] = useState(0);
  const [failed, setFailed] = useState(false);

  const src = !failed && idx < candidates.length ? candidates[idx] : null;

  const next = () => {
    if (idx + 1 < candidates.length) setIdx((i) => i + 1);
    else setFailed(true);
  };

  return (
    <div
      className={`relative overflow-hidden bg-[#0a0a0a] ${className}`}
      style={{
        background: src
          ? '#0a0a0a'
          : `linear-gradient(145deg, ${book.accent}44, #0a0a0a 75%)`,
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
          loading="eager"
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={(e) => {
            const img = e.currentTarget;
            if (img.naturalWidth <= 2 || img.naturalHeight <= 2) next();
          }}
          onError={() => next()}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-2">
          <span className="text-3xl opacity-90" aria-hidden>
            {book.mark}
          </span>
          <span
            className="text-[8px] uppercase tracking-wider text-center line-clamp-2"
            style={{ color: book.accent }}
          >
            {book.author}
          </span>
        </div>
      )}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/45 to-transparent"
        aria-hidden
      />
    </div>
  );
}
