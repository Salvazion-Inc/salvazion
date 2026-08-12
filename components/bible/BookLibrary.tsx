'use client';

import { BibleBook, bookDisplayName } from '@/lib/bible/types';
import type { Language } from '@/lib/types';
import BookCover from './BookCover';

type Props = {
  books: BibleBook[];
  selectedBookId: string;
  uiLang: Language;
  otLabel: string;
  ntLabel: string;
  onSelect: (bookId: string) => void;
};

export default function BookLibrary({
  books,
  selectedBookId,
  uiLang,
  otLabel,
  ntLabel,
  onSelect,
}: Props) {
  const ot = books.filter((b) => b.testament === 'OT');
  const nt = books.filter((b) => b.testament === 'NT');

  const Section = ({
    title,
    list,
  }: {
    title: string;
    list: BibleBook[];
  }) => (
    <section className="mb-5">
      <div className="flex items-center gap-2 mb-2.5 px-0.5">
        <h3 className="text-[10px] uppercase tracking-[0.14em] text-[var(--accent)] font-medium">
          {title}
        </h3>
        <div className="h-px flex-1 bg-[var(--border-soft)]" />
        <span className="text-[10px] text-[var(--sage)]/70 tabular-nums">{list.length}</span>
      </div>
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
        {list.map((b) => {
          const name = bookDisplayName(b, uiLang);
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => onSelect(b.id)}
              className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8FD99A]/40 rounded-[var(--radius-md)]"
              aria-pressed={selectedBookId === b.id}
              aria-label={name}
            >
              <BookCover
                bookId={b.id}
                name={name}
                testament={b.testament}
                chapters={b.chapters}
                selected={selectedBookId === b.id}
                variant="tile"
              />
            </button>
          );
        })}
      </div>
    </section>
  );

  return (
    <div className="space-y-1">
      <Section title={otLabel} list={ot} />
      <Section title={ntLabel} list={nt} />
    </div>
  );
}
