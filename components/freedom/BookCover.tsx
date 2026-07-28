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

/**
 * Book cover with multi-source fallback:
 * 1) Explicit coverUrl / Amazon ASIN
 * 2) Open Library + Google Books lookup
 * 3) Accent + mark placeholder
 */
export default function BookCover({ book, className = '' }: Props) {
  const candidates = useMemo(() => bookCoverCandidates(book), [book]);
  const [idx, setIdx] = useState(0);
  const [remoteUrl, setRemoteUrl] = useState<string | null>(null);
  const [remoteDone, setRemoteDone] = useState(false);
  const [failed, setFailed] = useState(false);

  const active =
    !failed && remoteUrl
      ? remoteUrl
      : !failed && idx < candidates.length
        ? candidates[idx]
        : null;

  // When static candidates are exhausted (or none), look up a real cover
  useEffect(() => {
    if (remoteDone || remoteUrl) return;
    if (candidates.length > 0 && idx < candidates.length) return;

    let cancelled = false;
    const q = bookCoverSearchQuery(book);

    (async () => {
      // 1) Open Library
      try {
        const olRes = await fetch(
          `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=3&fields=cover_i,isbn,title,author_name`
        );
        if (olRes.ok) {
          const data = (await olRes.json()) as {
            docs?: Array<{ cover_i?: number; isbn?: string[] }>;
          };
          for (const doc of data.docs || []) {
            if (doc.cover_i) {
              const cover = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
              if (!cancelled) {
                setRemoteUrl(cover);
                setRemoteDone(true);
                return;
              }
            }
            if (doc.isbn?.[0]) {
              const cover = `https://covers.openlibrary.org/b/isbn/${doc.isbn[0]}-L.jpg`;
              if (!cancelled) {
                setRemoteUrl(cover);
                setRemoteDone(true);
                return;
              }
            }
          }
        }
      } catch {
        /* try Google */
      }

      // 2) Google Books
      try {
        const gq = encodeURIComponent(
          `intitle:${book.title}+inauthor:${book.author}`
        );
        const gRes = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=${gq}&maxResults=3&printType=books&fields=items(volumeInfo/imageLinks,volumeInfo/title)`
        );
        if (gRes.ok) {
          const data = (await gRes.json()) as {
            items?: Array<{
              volumeInfo?: {
                imageLinks?: { thumbnail?: string; smallThumbnail?: string };
              };
            }>;
          };
          for (const item of data.items || []) {
            const links = item.volumeInfo?.imageLinks;
            const raw = links?.thumbnail || links?.smallThumbnail;
            if (raw) {
              // Prefer https + larger size
              const cover = raw
                .replace('http://', 'https://')
                .replace('zoom=1', 'zoom=2')
                .replace('&edge=curl', '');
              if (!cancelled) {
                setRemoteUrl(cover);
                setRemoteDone(true);
                return;
              }
            }
          }
        }
      } catch {
        /* fail */
      }

      if (!cancelled) {
        setRemoteDone(true);
        setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [book, candidates.length, idx, remoteDone, remoteUrl]);

  const showImg = !!active && !failed;

  return (
    <div
      className={`relative overflow-hidden bg-[#0a0a0a] ${className}`}
      style={{
        background: showImg
          ? '#0a0a0a'
          : `linear-gradient(145deg, ${book.accent}44, #0a0a0a 75%)`,
      }}
    >
      {active && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={active}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-top"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => {
            if (remoteUrl && active === remoteUrl) {
              setRemoteUrl(null);
              setFailed(true);
              return;
            }
            if (idx + 1 < candidates.length) {
              setIdx((i) => i + 1);
            } else {
              // Trigger remote lookup by moving past candidates
              setIdx(candidates.length);
            }
          }}
        />
      ) : null}

      {!showImg && !remoteDone && candidates.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-[var(--border-soft)] border-t-[var(--accent)] animate-spin" />
        </div>
      )}

      {!showImg && (failed || (remoteDone && !remoteUrl)) && (
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
        className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/50 to-transparent"
        aria-hidden
      />
    </div>
  );
}
