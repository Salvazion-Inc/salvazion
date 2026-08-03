'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  bookCoverCandidates,
  bookCoverSearchQueries,
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
 *
 * Rejects Amazon 1×1 / tiny placeholder GIFs that report HTTP 200.
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

  const advance = () => {
    if (remoteUrl && active === remoteUrl) {
      setRemoteUrl(null);
      setFailed(true);
      return;
    }
    if (idx + 1 < candidates.length) {
      setIdx((i) => i + 1);
    } else {
      // Exhaust static candidates → remote lookup
      setIdx(candidates.length);
    }
  };

  // Look up a real cover when static candidates fail OR when we only have a
  // generated placeholder (ui-avatars) and can upgrade to a publisher image.
  useEffect(() => {
    if (remoteDone || remoteUrl) return;
    const onlyPlaceholder =
      candidates.length > 0 &&
      candidates.every((u) => /ui-avatars\.com/i.test(u));
    if (candidates.length > 0 && idx < candidates.length && !onlyPlaceholder) {
      return;
    }

    let cancelled = false;
    const queries = bookCoverSearchQueries(book);

    (async () => {
      // 1) Open Library — try ES title first, then EN
      for (const q of queries) {
        try {
          const olRes = await fetch(
            `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=4&fields=cover_i,isbn,title,author_name`
          );
          if (!olRes.ok) continue;
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
        } catch {
          /* next query */
        }
      }

      // 2) Google Books — title + author (EN then ES)
      for (const title of [book.title, book.titleEs]) {
        try {
          const gq = encodeURIComponent(
            `intitle:${title}+inauthor:${book.author}`
          );
          const gRes = await fetch(
            `https://www.googleapis.com/books/v1/volumes?q=${gq}&maxResults=3&printType=books&fields=items(volumeInfo/imageLinks,volumeInfo/title)`
          );
          if (!gRes.ok) continue;
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
        } catch {
          /* next */
        }
      }

      if (!cancelled) {
        setRemoteDone(true);
        // Keep showing static candidates (e.g. branded placeholder) if any remain
        if (candidates.length === 0 || idx >= candidates.length) {
          setFailed(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [book, candidates, candidates.length, idx, remoteDone, remoteUrl]);

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
          className="absolute inset-0 w-full h-full object-cover object-center"
          loading="lazy"
          referrerPolicy="no-referrer"
          onLoad={(e) => {
            const img = e.currentTarget;
            // Amazon often returns a 1×1 transparent GIF with HTTP 200
            if (img.naturalWidth <= 2 || img.naturalHeight <= 2) {
              advance();
            }
          }}
          onError={() => advance()}
        />
      ) : null}

      {!showImg && !remoteDone && (
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
