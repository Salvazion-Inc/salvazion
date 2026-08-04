'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  X_ARTICLES_COUNT,
  formatArticleDate,
  getArticleProgress,
  getBlogArticles,
  getBlogPillarCounts,
  localizeArticle,
  markArticleRead,
  type ArticlePillar,
  type XArticle,
} from '@/lib/freedom/x-articles';
import { markContentComplete } from '@/lib/freedom/engine';
import { logAction } from '@/lib/scoring/engine';
import { useI18n } from '@/components/I18nProvider';
import { PILLAR_COLORS, type PillarId } from '@/lib/theme/pillars';
import { textWithXLogo } from '@/components/ui/XLogo';

type BlogFilter = 'all' | ArticlePillar;

interface Props {
  focus?: string[];
  /** @deprecated Catalog is full library with pillar filters */
  limit?: number;
  /** @deprecated Filters are always shown (landing format) */
  showFilters?: boolean;
  className?: string;
  onScored?: () => void;
}

const FILTERS: BlogFilter[] = ['all', 'salvation', 'health', 'freedom'];

const PILLAR_ACCENT: Record<PillarId, string> = {
  salvation: PILLAR_COLORS.salvation.solid,
  health: PILLAR_COLORS.health.solid,
  freedom: PILLAR_COLORS.freedom.text,
};

/** Card width — matches landing blog track */
const CARD_WIDTH = 'min(78vw, 280px)';

function ArticleCard({
  article,
  lang,
  readOnX,
  isRead,
  readLabel,
  onSelect,
}: {
  article: XArticle;
  lang: 'en' | 'es';
  readOnX: string;
  isRead: boolean;
  readLabel: string;
  onSelect: (article: XArticle) => void;
}) {
  const accent = PILLAR_ACCENT[article.pillar];
  const date = formatArticleDate(article.createdAt, lang);
  const { title, preview } = localizeArticle(article, lang);

  return (
    <article
      className={`group flex flex-col card-soft card-lift overflow-hidden h-full snap-start shrink-0 ${
        isRead ? 'opacity-85' : ''
      }`}
      style={{
        borderTopWidth: 2,
        borderTopColor: accent,
        width: CARD_WIDTH,
        maxWidth: 280,
      }}
    >
      <button
        type="button"
        onClick={() => onSelect(article)}
        className="flex flex-col flex-1 min-h-0 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      >
        <div className="relative aspect-[16/10] bg-[#0a0a0a] overflow-hidden shrink-0 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.image}
            alt=""
            className="absolute inset-0 m-auto max-w-full max-h-full w-full h-full object-contain object-center transition duration-300 group-hover:scale-[1.02]"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.src = '/logo-icon.png';
              e.currentTarget.className =
                'absolute inset-0 m-auto max-w-[40%] max-h-[40%] w-auto h-auto object-contain object-center opacity-80';
            }}
          />
          <span
            className="absolute top-2 left-2 text-[9px] uppercase tracking-[0.14em] font-semibold px-2 py-0.5 rounded-full border backdrop-blur-sm"
            style={{
              color: accent,
              borderColor: `${accent}66`,
              background: 'rgba(4,4,4,0.72)',
            }}
          >
            {article.pillar}
          </span>
          {isRead ? (
            <span className="absolute top-2 right-2 text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border border-[var(--accent)]/50 bg-[rgba(4,4,4,0.72)] text-[var(--accent)] backdrop-blur-sm">
              {readLabel}
            </span>
          ) : null}
        </div>

        <div className="flex flex-col flex-1 p-3.5">
          <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
            {title}
          </h3>
          {date ? (
            <time
              className="mt-1.5 text-[10px] text-[var(--sage)]/70"
              dateTime={article.createdAt || undefined}
            >
              {date}
            </time>
          ) : null}
          <p className="mt-2 text-xs text-[var(--sage)] leading-relaxed line-clamp-3 flex-1">
            {preview}
          </p>
          <p className="mt-3 text-[11px] font-medium text-[var(--accent)] inline-flex items-center gap-1">
            {textWithXLogo(readOnX)}
            <span aria-hidden>↗</span>
          </p>
        </div>
      </button>
    </article>
  );
}

/**
 * @salvazion_ X Articles — same card + carousel format as the landing blog,
 * with pillar filters and Freedom mark-as-read scoring.
 */
export default function XArticlesFeed({
  className = '',
  onScored,
}: Props) {
  const { t, lang } = useI18n();
  const locale = lang === 'en' ? 'en' : 'es';
  const [filter, setFilter] = useState<BlogFilter>('all');
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<XArticle | null>(null);
  const [progress, setProgress] = useState({ read: 0, total: 0 });
  const [toast, setToast] = useState<string | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const counts = useMemo(() => getBlogPillarCounts(), []);

  const refresh = useCallback(() => {
    try {
      const raw = localStorage.getItem('salvazion_x_articles_read');
      setReadIds(new Set(raw ? JSON.parse(raw) : []));
    } catch {
      setReadIds(new Set());
    }
    setProgress(getArticleProgress());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => getBlogArticles(filter), [filter]);

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < max - 4);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [filtered, updateScrollState]);

  const onFilter = (next: BlogFilter) => {
    setFilter(next);
    requestAnimationFrame(() => {
      const el = scrollerRef.current;
      if (el) el.scrollTo({ left: 0, behavior: 'smooth' });
      updateScrollState();
    });
  };

  const scrollByDir = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const step = Math.min(el.clientWidth * 0.85, 300);
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  const handleOpenX = (article: XArticle) => {
    window.open(article.url, '_blank', 'noopener,noreferrer');
  };

  const handleMarkRead = (article: XArticle) => {
    markArticleRead(article.id);
    markContentComplete(`x-article-${article.id}`);
    logAction('learn_article_video');
    refresh();
    setSelected(null);
    setToast(t('articles.markedRead'));
    setTimeout(() => setToast(null), 2200);
    onScored?.();
  };

  const filterLabel = (key: BlogFilter) => {
    if (key === 'all') return t('articles.filterAll');
    if (key === 'salvation') return t('articles.filterSalvation');
    if (key === 'health') return t('articles.filterHealth');
    return t('articles.filterFreedom');
  };

  const selectedLoc = selected ? localizeArticle(selected, locale) : null;

  return (
    <section className={`space-y-3 ${className}`} aria-labelledby="x-articles-heading">
      <div className="flex items-end justify-between gap-2 px-0.5">
        <div>
          <h2
            id="x-articles-heading"
            className="text-sm font-semibold text-[var(--sage)]"
          >
            {textWithXLogo(t('articles.title'))}
          </h2>
          <p className="text-[10px] text-[var(--sage)]/70 mt-0.5">
            {textWithXLogo(t('articles.subtitle'))} · {progress.read}/
            {progress.total} {t('articles.readCount')}
          </p>
        </div>
        <a
          href="https://x.com/salvazion_/articles"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-[var(--accent)] hover:underline shrink-0"
        >
          @salvazion_ ↗
        </a>
      </div>

      {/* Pillar filters — same UX as landing blog */}
      <div
        className="flex flex-wrap gap-1.5"
        role="tablist"
        aria-label={t('articles.filterAria')}
      >
        {FILTERS.map((key) => {
          const active = filter === key;
          const accent =
            key === 'all' ? 'var(--accent)' : PILLAR_ACCENT[key as PillarId];
          const count = counts[key];
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onFilter(key)}
              className={`px-2.5 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border transition ${
                active
                  ? 'text-[#0a120c]'
                  : 'text-[var(--sage)] hover:text-white border-[var(--border-soft)] bg-transparent hover:border-[var(--border-strong)]'
              }`}
              style={
                active
                  ? {
                      background: accent,
                      borderColor: accent,
                      color: key === 'salvation' ? '#0a120c' : undefined,
                    }
                  : undefined
              }
            >
              {filterLabel(key)}
              <span
                className={`ml-1 tabular-nums ${
                  active ? 'opacity-80' : 'opacity-60'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-[10px] text-[var(--sage)]/75 px-0.5">
        {t('articles.showing')}{' '}
        <strong className="text-white font-medium">{filtered.length}</strong>{' '}
        {t('articles.of')} {X_ARTICLES_COUNT}
        <span className="text-[var(--sage)]/55">
          {' '}
          · {t('articles.swipeHint')}
        </span>
      </p>

      {filtered.length === 0 ? (
        <p className="text-xs text-[var(--sage)]/60 py-6 text-center">
          {t('articles.empty')}
        </p>
      ) : (
        <div className="relative">
          <button
            type="button"
            onClick={() => scrollByDir(-1)}
            disabled={!canPrev}
            aria-label={t('articles.prev')}
            className="carousel-btn left-0"
            style={{ top: '42%', transform: 'translateY(-50%)' }}
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => scrollByDir(1)}
            disabled={!canNext}
            aria-label={t('articles.next')}
            className="carousel-btn right-0"
            style={{ top: '42%', transform: 'translateY(-50%)' }}
          >
            ›
          </button>

          <div
            ref={scrollerRef}
            className="carousel-track gap-2.5 px-0.5"
            role="region"
            aria-roledescription="carousel"
            aria-label={t('articles.carouselAria')}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') {
                e.preventDefault();
                scrollByDir(-1);
              } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                scrollByDir(1);
              }
            }}
          >
            {filtered.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                lang={locale}
                readOnX={t('articles.readOnX')}
                isRead={readIds.has(article.id)}
                readLabel={t('articles.read')}
                onSelect={setSelected}
              />
            ))}
          </div>
        </div>
      )}

      <div className="px-0.5">
        <a
          href="https://x.com/salvazion_/articles"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-medium text-[var(--accent)] hover:underline inline-flex items-center gap-1"
        >
          {textWithXLogo(t('articles.viewAllOnX'))}
          <span aria-hidden>↗</span>
        </a>
      </div>

      {selected && selectedLoc && (
        <div className="fixed inset-0 z-50 bg-[#040404]/95 flex flex-col">
          <div className="px-5 pt-6 pb-3 border-b border-[var(--border-soft)] flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="back-btn"
              aria-label={t('common.close')}
            >
              ←
            </button>
            <span className="text-[10px] text-[var(--sage)]/80 truncate">
              {selected.source}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-5 max-w-lg mx-auto w-full">
            <div
              className="relative w-full aspect-[16/10] rounded-xl overflow-hidden border border-[var(--border-soft)] mb-4 bg-[var(--true-black)] flex items-center justify-center"
              style={{
                borderTopWidth: 2,
                borderTopColor: PILLAR_ACCENT[selected.pillar],
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selected.image}
                alt=""
                className="absolute inset-0 m-auto max-w-full max-h-full w-full h-full object-contain object-center"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = '/logo-icon.png';
                  e.currentTarget.className =
                    'absolute inset-0 m-auto max-w-[40%] max-h-[40%] w-auto h-auto object-contain object-center opacity-80';
                }}
              />
              <span
                className="absolute top-2 left-2 text-[9px] uppercase tracking-[0.14em] font-semibold px-2 py-0.5 rounded-full border backdrop-blur-sm"
                style={{
                  color: PILLAR_ACCENT[selected.pillar],
                  borderColor: `${PILLAR_ACCENT[selected.pillar]}66`,
                  background: 'rgba(4,4,4,0.72)',
                }}
              >
                {selected.pillar}
              </span>
            </div>
            <h2 className="font-display text-xl font-bold text-white mb-2 leading-snug">
              {selectedLoc.title}
            </h2>
            <p className="text-xs text-[var(--sage)] mb-3">
              {formatArticleDate(selected.createdAt, locale)}
            </p>
            <p className="text-sm text-[var(--off-white)]/85 leading-relaxed mb-2">
              {selectedLoc.preview}
            </p>
            <p className="text-[11px] text-[var(--sage)]/70 mb-6">
              {textWithXLogo(t('articles.openHint'))}
            </p>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleOpenX(selected)}
                className="btn-primary inline-flex items-center justify-center gap-1.5"
              >
                {textWithXLogo(t('articles.readOnX'), 'w-3.5 h-3.5 shrink-0')}
                <span aria-hidden>↗</span>
              </button>
              <button
                type="button"
                onClick={() => handleMarkRead(selected)}
                disabled={readIds.has(selected.id)}
                className="btn-secondary"
              >
                {readIds.has(selected.id)
                  ? `✓ ${t('articles.read')}`
                  : t('articles.markRead')}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[60] toast-soft">
          {toast}
        </div>
      )}
    </section>
  );
}
