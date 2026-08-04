'use client';

import {
  RECOMMENDED_BOOKS,
  bookAmazonUrl,
  type RecommendedBook,
} from '@/lib/freedom/books';
import { useI18n } from '@/components/I18nProvider';
import BookCover from '@/components/freedom/BookCover';

type Props = {
  className?: string;
};

/**
 * Horizontal book carousel — Amazon affiliate + covers.
 * Fixed card height so buttons align across the row.
 */
export default function BookStoreCarousel({ className = '' }: Props) {
  const { t, lang } = useI18n();

  return (
    <section className={`space-y-2 ${className}`} aria-label={t('books.title')}>
      <div className="px-0.5">
        <h2 className="text-sm font-semibold text-[var(--sage)]">{t('books.title')}</h2>
        <p className="text-[10px] text-[var(--sage)]/70 mt-0.5">
          {t('books.subtitle')}
        </p>
      </div>

      <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory">
        {RECOMMENDED_BOOKS.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            lang={lang === 'en' ? 'en' : 'es'}
            t={t}
          />
        ))}
      </div>

      <p className="text-[9px] text-[var(--sage)]/50 px-0.5 leading-relaxed">
        {t('books.affiliateNote')}
      </p>
    </section>
  );
}

function BookCard({
  book,
  lang,
  t,
}: {
  book: RecommendedBook;
  lang: 'en' | 'es';
  t: (key: string) => string;
}) {
  const title = lang === 'es' ? book.titleEs : book.title;

  return (
    <article
      className="snap-start shrink-0 w-[10.5rem] h-[17.5rem] card-soft overflow-hidden flex flex-col border"
      style={{ borderColor: `${book.accent}55` }}
    >
      <div className="h-[8.5rem] w-full shrink-0">
        <BookCover book={book} />
      </div>
      <div className="p-2.5 flex flex-col flex-1 min-h-0 gap-1">
        <h3 className="text-[12px] font-semibold text-white leading-snug line-clamp-2 min-h-[2rem]">
          {title}
        </h3>
        <p className="text-[10px] text-[var(--sage)] truncate">{book.author}</p>
        <a
          href={bookAmazonUrl(book)}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="btn-outline-sm mt-auto w-full"
          style={{
            borderColor: 'rgba(255,153,0,0.4)',
            color: '#FFB84D',
          }}
        >
          {t('books.buyAmazon')} ↗
        </a>
      </div>
    </article>
  );
}
