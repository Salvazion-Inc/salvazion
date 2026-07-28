'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  bookCoverCandidates,
  bookCoverSearchQuery,
  type RecommendedBook,
} from '@/lib/freedom/books';

type Props = {
  book: RecommendedBook;
  className?: string;
};

type LookupState =
  | { status: 'idle' | 'loading' }
  | { status: 'ready'; url: string }
  | { status: 'fail' };

/**
 * Book cover with multi-source fallback:
 * 1) Amazon ASIN product images
 * 2) Open Library cover search
 * 3) Accent + mark placeholder
 */
export default function BookCover({ book, className = '' }: Props) {
  const candidates = useMemo(() => bookCoverCandidates(book), [book]);
  const [idx, setIdx] = useState(0);
  const [lookup, setLookup] = useState<LookupState>({ status: 'idle' });

  const active =
    lookup.status === 'ready'
      ? lookup.url
      : idx < candidates.length
        ? candidates[idx]
        : null;

  // When Amazon candidates are exhausted, try Open Library once
  useEffect(() => {
    if (active || lookup.status !== 'idle') return;
    if (candidates.length > 0 && idx < candidates.length) return;

    let cancelled = false;
    setLookup({ status: 'loading' });

    const q = bookCoverSearchQuery(book);
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(
      q
    )}&limit=1&fields=cover_i,isbn,title`;

    (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('ol');
        const data = (await res.json()) as {
          docs?: Array<{ cover_i?: number; isbn?: string[] }>;
        };
        const doc = data.docs?.[0];
        let cover: string | null = null;
        if (doc?.cover_i) {
          cover = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
        } else if (doc?.isbn?.[0]) {
          cover = `https://covers.openlibrary.org/b/isbn/${doc.isbn[0]}-L.jpg`;
        }
        if (!cancelled) {
          if (cover) setLookup({ status: 'ready', url: cover });
          else setLookup({ status: 'fail' });
        }
      } catch {
        if (!cancelled) setLookup({ status: 'fail' });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [active, candidates.length, idx, book, lookup.status]);

  const showImg = !!active && lookup.status !== 'fail';

  return (
    <div
      className={`relative overflow-hidden bg-[#0a0a0a] ${className}`}
      style={{
        background: showImg
          ? '#0a0a0a'
          : `linear-gradient(145deg, ${book.accent}44, #0a0a0a 75%)`,
      }}
    >
      {active ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={active}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-top"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => {
            if (lookup.status === 'ready') {
              setLookup({ status: 'fail' });
              return;
            }
            if (idx + 1 < candidates.length) {
              setIdx((i) => i + 1);
            } else {
              setLookup({ status: 'idle' });
              setIdx(candidates.length);
            }
          }}
        />
      ) : null}

      {!active && lookup.status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-[var(--border-soft)] border-t-[var(--accent)] animate-spin" />
        </div>
      )}

      {(!active || lookup.status === 'fail') && lookup.status !== 'loading' && (
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

      {/* Soft vignette so text overlays stay readable if any */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/50 to-transparent"
        aria-hidden
      />
    </div>
  );
}
