'use client';

import {
  RECOMMENDED_BOOKS,
  bookAmazonUrl,
  type RecommendedBook,
} from '@/lib/freedom/books';
import { useI18n } from '@/components/I18nProvider';

type Props = {
  className?: string;
};

/**
 * Horizontal carousel of books defending Western Christian culture
 * and bioconservatism — Amazon Associates affiliate links only.
 */
export default function BookStoreCarousel({ className = '' }: Props) {
  const { t, lang } = useI18n();

  return (
    <section className={`space-y-2.5 ${className}`} aria-label={t('books.title')}>
      <div className="px-0.5">
        <h2 className="text-sm font-semibold text-[var(--sage)]">{t('books.title')}</h2>
        <p className="text-[10px] text-[var(--sage)]/70 mt-0.5 leading-relaxed">
          {t('books.subtitle')}
        </p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-thin">
        {RECOMMENDED_BOOKS.map((book) => (
          <BookCard key={book.id} book={book} lang={lang === 'en' ? 'en' : 'es'} t={t} />
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
  const blurb = lang === 'es' ? book.blurbEs : book.blurbEn;
  const themeLabel =
    book.themes.includes('both')
      ? t('books.themeBoth')
      : book.themes.includes('bioconservatism')
        ? t('books.themeBio')
        : t('books.themeChristian');

  return (
    <article
      className="snap-start shrink-0 w-[11.5rem] card-soft overflow-hidden flex flex-col border"
      style={{ borderColor: `${book.accent}55` }}
    >
      <div
        className="h-24 flex items-center justify-center relative"
        style={{
          background: `linear-gradient(145deg, ${book.accent}33, #0a0a0a 70%)`,
        }}
      >
        <span className="text-3xl opacity-90" aria-hidden>
          {book.mark}
        </span>
        <span
          className="absolute bottom-1.5 left-2 right-2 text-[8px] uppercase tracking-wider truncate"
          style={{ color: book.accent }}
        >
          {themeLabel}
        </span>
      </div>
      <div className="p-2.5 flex flex-col flex-1 gap-1.5">
        <h3 className="text-[12px] font-semibold text-white leading-snug line-clamp-2">
          {title}
        </h3>
        <p className="text-[10px] text-[var(--sage)]">{book.author}</p>
        <p className="text-[10px] text-[var(--sage)]/75 leading-relaxed line-clamp-3 flex-1">
          {blurb}
        </p>
        <a
          href={bookAmazonUrl(book)}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="mt-auto text-center text-[11px] font-medium min-h-[36px] flex items-center justify-center rounded-lg border transition hover:opacity-90"
          style={{
            borderColor: 'rgba(255,153,0,0.45)',
            color: '#FFB84D',
            background: 'rgba(255,153,0,0.08)',
          }}
        >
          {t('books.buyAmazon')} ↗
        </a>
      </div>
    </article>
  );
}
