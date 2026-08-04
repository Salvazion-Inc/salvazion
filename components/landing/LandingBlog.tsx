'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  X_ARTICLES,
  X_ARTICLES_COUNT,
  formatArticleDate,
  getBlogArticles,
  getBlogPillarCounts,
  localizeArticle,
  type ArticlePillar,
  type XArticle,
} from '@/lib/freedom/x-articles';
import { PILLAR_COLORS, type PillarId } from '@/lib/theme/pillars';
import { textWithXLogo } from '@/components/ui/XLogo';

export type BlogFilter = 'all' | ArticlePillar;

export interface LandingBlogCopy {
  eyebrow: string;
  title: string;
  subtitle: string;
  filters: {
    all: string;
    salvation: string;
    health: string;
    freedom: string;
  };
  readOnX: string;
  showing: string;
  of: string;
  empty: string;
  viewAllOnX: string;
}

interface Props {
  lang: 'en' | 'es';
  copy: LandingBlogCopy;
}

const FILTERS: BlogFilter[] = ['all', 'salvation', 'health', 'freedom'];

const PILLAR_ACCENT: Record<PillarId, string> = {
  salvation: PILLAR_COLORS.salvation.solid,
  health: PILLAR_COLORS.health.solid,
  freedom: PILLAR_COLORS.freedom.text,
};

/** Card width in the horizontal track */
const CARD_WIDTH = 'min(82vw, 300px)';

function ArticleCard({
  article,
  lang,
  readOnX,
}: {
  article: XArticle;
  lang: 'en' | 'es';
  readOnX: string;
}) {
  const accent = PILLAR_ACCENT[article.pillar];
  const date = formatArticleDate(article.createdAt, lang);
  const { title, preview } = localizeArticle(article, lang);

  return (
    <article
      itemScope
      itemType="https://schema.org/BlogPosting"
      className="group flex flex-col card-soft card-lift overflow-hidden h-full snap-start shrink-0"
      style={{
        borderTopWidth: 2,
        borderTopColor: accent,
        width: CARD_WIDTH,
        maxWidth: 300,
      }}
      lang={lang}
    >
      <meta itemProp="author" content="@salvazion_" />
      <meta itemProp="isPartOf" content="Salvazion Blog" />
      <meta itemProp="inLanguage" content={lang === 'es' ? 'es' : 'en'} />
      {article.createdAt ? (
        <meta itemProp="datePublished" content={article.createdAt} />
      ) : null}

      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col flex-1 min-h-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        itemProp="url"
      >
        <div className="relative aspect-[16/10] bg-[#0a0a0a] overflow-hidden shrink-0 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.image}
            alt=""
            itemProp="image"
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
        </div>

        <div className="flex flex-col flex-1 p-4">
          <h3
            itemProp="headline"
            className="text-sm sm:text-[15px] font-semibold text-white leading-snug line-clamp-2 group-hover:text-[var(--accent)] transition-colors"
          >
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
          <p
            itemProp="description"
            className="mt-2 text-xs text-[var(--sage)] leading-relaxed line-clamp-3 flex-1"
          >
            {preview}
          </p>
          <p className="mt-3 text-[11px] font-medium text-[var(--accent)] inline-flex items-center gap-1">
            {textWithXLogo(readOnX)}
            <span aria-hidden>↗</span>
          </p>
        </div>
      </a>
    </article>
  );
}

/**
 * Public marketing blog: all @salvazion_ X Articles, filterable by pillar.
 * Horizontal carousel (left / right) instead of vertical list.
 */
export default function LandingBlog({ lang, copy }: Props) {
  const [filter, setFilter] = useState<BlogFilter>('all');
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const counts = useMemo(() => getBlogPillarCounts(), []);

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
      if (el) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      }
      updateScrollState();
    });
  };

  const scrollByDir = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const step = Math.min(el.clientWidth * 0.85, 320);
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  return (
    <section
      id="blog"
      className="section-pad border-t border-[var(--border-soft)] bg-zinc-950/30"
      aria-labelledby="blog-heading"
      itemScope
      itemType="https://schema.org/Blog"
    >
      <meta itemProp="name" content="Salvazion Blog" />
      <meta itemProp="description" content={copy.subtitle} />

      <div className="max-w-6xl mx-auto px-5">
        <header className="text-center mb-10 sm:mb-12 max-w-2xl mx-auto">
          <p className="section-eyebrow mb-3 inline-flex items-center justify-center gap-1.5 flex-wrap">
            {textWithXLogo(copy.eyebrow)}
          </p>
          <h2
            id="blog-heading"
            className="section-title text-3xl sm:text-4xl md:text-[2.65rem]"
            itemProp="headline"
          >
            {textWithXLogo(
              copy.title,
              'inline-block w-[0.75em] h-[0.75em] align-[-0.08em] mx-1'
            )}
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[var(--sage)] leading-relaxed text-pretty">
            {textWithXLogo(copy.subtitle)}
          </p>
        </header>

        {/* Pillar filters — Salvation · Health · Freedom */}
        <div
          className="flex flex-wrap justify-center gap-2 mb-6"
          role="tablist"
          aria-label={lang === 'es' ? 'Filtrar por pilar' : 'Filter by pillar'}
        >
          {FILTERS.map((key) => {
            const active = filter === key;
            const accent =
              key === 'all' ? 'var(--accent)' : PILLAR_ACCENT[key as PillarId];
            const label = copy.filters[key];
            const count = counts[key];
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onFilter(key)}
                className={`px-3.5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider border transition ${
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
                {label}
                <span
                  className={`ml-1.5 tabular-nums ${
                    active ? 'opacity-80' : 'opacity-60'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <p className="text-center text-[11px] text-[var(--sage)]/80 mb-4">
          {copy.showing}{' '}
          <strong className="text-white font-medium">{filtered.length}</strong>{' '}
          {copy.of} {X_ARTICLES_COUNT}
          <span className="text-[var(--sage)]/60">
            {' '}
            · {lang === 'es' ? 'Desliza a los lados' : 'Swipe sideways'}
          </span>
        </p>

        {filtered.length === 0 ? (
          <p className="text-center text-sm text-[var(--sage)] py-12">{copy.empty}</p>
        ) : (
          <div className="relative px-1 sm:px-2">
            <button
              type="button"
              onClick={() => scrollByDir(-1)}
              disabled={!canPrev}
              aria-label={lang === 'es' ? 'Anterior' : 'Previous'}
              className="carousel-btn left-0 sm:left-1"
              style={{ top: '50%', transform: 'translateY(-50%)' }}
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => scrollByDir(1)}
              disabled={!canNext}
              aria-label={lang === 'es' ? 'Siguiente' : 'Next'}
              className="carousel-btn right-0 sm:right-1"
              style={{ top: '50%', transform: 'translateY(-50%)' }}
            >
              ›
            </button>

            <div
              ref={scrollerRef}
              className="carousel-track px-1"
              role="region"
              aria-roledescription="carousel"
              aria-label={
                lang === 'es'
                  ? 'Carrusel de artículos Salvazion'
                  : 'Salvazion articles carousel'
              }
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
                  lang={lang}
                  readOnX={copy.readOnX}
                />
              ))}
            </div>
          </div>
        )}

        {/*
          Permanent crawlable index of every @salvazion_ article → X.
          Always in the DOM (filter-independent) for SEO link equity.
        */}
        <nav
          className="sr-only"
          aria-label={
            lang === 'es'
              ? 'Índice completo de artículos Salvazion en X'
              : 'Full index of Salvazion articles on X'
          }
        >
          <ul>
            {X_ARTICLES.map((a) => {
              const loc = localizeArticle(a, lang);
              return (
                <li key={`index-${a.id}`}>
                  <a href={a.url} rel="noopener noreferrer">
                    {loc.title} — {a.pillar}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <noscript>
          <ul>
            {X_ARTICLES.map((a) => {
              const loc = localizeArticle(a, lang);
              return (
                <li key={`ns-${a.id}`}>
                  <a href={a.url}>
                    {loc.title} ({a.pillar})
                  </a>
                </li>
              );
            })}
          </ul>
        </noscript>

        <div className="mt-10 text-center">
          <a
            href="https://x.com/salvazion_/articles"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary sm:w-auto sm:min-w-[220px] inline-flex items-center gap-1.5"
          >
            {textWithXLogo(copy.viewAllOnX, 'inline-block w-3.5 h-3.5 align-[-0.1em] mx-0.5')}
            <span aria-hidden>↗</span>
          </a>
        </div>
      </div>
    </section>
  );
}
