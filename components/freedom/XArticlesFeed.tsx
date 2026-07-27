'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getArticleFeed,
  getArticleProgress,
  markArticleRead,
  formatArticleDate,
  type XArticle,
} from '@/lib/freedom/x-articles';
import { markContentComplete } from '@/lib/freedom/engine';
import { logAction } from '@/lib/scoring/engine';
import { useI18n } from '@/components/I18nProvider';

interface Props {
  focus?: string[];
  /** Max cards; omit for full list */
  limit?: number;
  showFilters?: boolean;
  className?: string;
  onScored?: () => void;
}

type FilterMode = 'for_you' | 'unread' | 'all';

const PAGE_SIZE = 24;

/**
 * @salvazion_ X Articles — image + title, open on X, unread + interest ranking.
 */
export default function XArticlesFeed({
  focus = [],
  limit,
  showFilters = true,
  className = '',
  onScored,
}: Props) {
  const { t, lang } = useI18n();
  const [filter, setFilter] = useState<FilterMode>('for_you');
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<XArticle | null>(null);
  const [progress, setProgress] = useState({ read: 0, total: 0 });
  const [toast, setToast] = useState<string | null>(null);
  const [visible, setVisible] = useState(limit || PAGE_SIZE);

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

  const articlesAll = useMemo(() => {
    if (filter === 'unread') {
      return getArticleFeed({ focus, unreadOnly: true, unreadFirst: true });
    }
    if (filter === 'all') {
      return getArticleFeed({ focus: [], unreadFirst: true });
    }
    // for_you: interest + unread first
    return getArticleFeed({ focus, unreadFirst: true });
  }, [filter, focus, readIds]);

  const articles = useMemo(() => {
    const cap = limit ?? visible;
    return articlesAll.slice(0, cap);
  }, [articlesAll, limit, visible]);

  useEffect(() => {
    setVisible(limit || PAGE_SIZE);
  }, [filter, limit]);

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

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-[var(--sage)]">
            {t('articles.title')}
          </h2>
          <p className="text-[10px] text-[var(--sage)]/70 mt-0.5">
            {t('articles.subtitle')} · {progress.read}/{progress.total}{' '}
            {t('articles.readCount')}
          </p>
        </div>
        <a
          href="https://x.com/salvazion_"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-[var(--accent)] hover:underline shrink-0"
        >
          @salvazion_ ↗
        </a>
      </div>

      {showFilters && (
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {(
            [
              { id: 'for_you' as const, label: t('articles.forYou') },
              { id: 'unread' as const, label: t('articles.unread') },
              { id: 'all' as const, label: t('articles.all') },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] border transition ${
                filter === f.id
                  ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--surface-active)]'
                  : 'border-[var(--border-soft)] text-[var(--sage)]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {focus.length > 0 && filter === 'for_you' && (
        <p className="text-[10px] text-[var(--sage)]/60">
          {t('articles.basedOnInterests')}: {focus.join(' · ')}
        </p>
      )}

      {articles.length === 0 ? (
        <p className="text-xs text-[var(--sage)]/60 py-4 text-center">
          {t('articles.emptyUnread')}
        </p>
      ) : (
        <ul className="space-y-2.5">
          {articles.map((article) => {
            const done = readIds.has(article.id);
            return (
              <li key={article.id}>
                <button
                  type="button"
                  onClick={() => setSelected(article)}
                  className={`w-full text-left glass rounded-xl overflow-hidden border transition ${
                    done
                      ? 'border-[var(--border-strong)] opacity-80'
                      : 'border-[var(--border-soft)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <div className="flex gap-0 min-h-[5.5rem]">
                    <div className="relative w-[5.5rem] shrink-0 bg-[var(--true-black)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={article.image}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = '/logo-icon.png';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0 p-3 flex flex-col justify-center">
                      <div className="flex items-center gap-1.5 mb-1">
                        {done ? (
                          <span className="text-[9px] text-[var(--accent)] uppercase tracking-wider">
                            {t('articles.read')}
                          </span>
                        ) : (
                          <span className="text-[9px] text-amber-400/90 uppercase tracking-wider">
                            {t('articles.unreadBadge')}
                          </span>
                        )}
                        {article.verified && (
                          <span className="text-[9px] text-[var(--sage)]/50">· X</span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-white line-clamp-2 leading-snug">
                        {article.title}
                      </p>
                      <p className="text-[10px] text-[var(--sage)]/70 mt-1">
                        {formatArticleDate(article.createdAt, lang === 'en' ? 'en' : 'es') ||
                          article.source}
                        {' · '}
                        {article.readMin} min
                      </p>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {!limit && articlesAll.length > articles.length && (
        <button
          type="button"
          onClick={() => setVisible((v) => v + PAGE_SIZE)}
          className="w-full py-2.5 rounded-xl border border-[var(--border-soft)] text-xs text-[var(--accent)] hover:border-[var(--border-strong)]"
        >
          {t('articles.loadMore')} ({articles.length}/{articlesAll.length})
        </button>
      )}

      <p className="text-[10px] text-[var(--sage)]/50 text-center leading-relaxed pt-1">
        {t('articles.catalogNote')}{' '}
        <a
          href="https://x.com/salvazion_/articles"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--accent)] hover:underline"
        >
          x.com/salvazion_/articles
        </a>
      </p>

      {selected && (
        <div className="fixed inset-0 z-50 bg-[#040404]/95 flex flex-col">
          <div className="px-5 pt-6 pb-3 border-b border-[var(--border-soft)] flex justify-between items-center">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-[var(--sage)] text-sm"
            >
              ← {t('common.close')}
            </button>
            <span className="text-[10px] text-[var(--sage)]/80">{selected.source}</span>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-5 max-w-lg mx-auto w-full">
            <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden border border-[var(--border-soft)] mb-4 bg-[var(--true-black)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selected.image}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/logo-icon.png';
                }}
              />
            </div>
            <h2 className="font-display text-xl font-bold text-white mb-2 leading-snug">
              {selected.title}
            </h2>
            <p className="text-xs text-[var(--sage)] mb-3">
              {formatArticleDate(selected.createdAt, lang === 'en' ? 'en' : 'es')}
              {' · ~'}
              {selected.readMin} min
            </p>
            <p className="text-sm text-[var(--off-white)]/85 leading-relaxed mb-6">
              {selected.preview}
            </p>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleOpenX(selected)}
                className="btn-primary w-full"
              >
                {t('articles.readOnX')} ↗
              </button>
              <button
                type="button"
                onClick={() => handleMarkRead(selected)}
                disabled={readIds.has(selected.id)}
                className="btn-secondary w-full"
              >
                {readIds.has(selected.id)
                  ? `✓ ${t('articles.read')}`
                  : t('articles.markRead')}
              </button>
              <p className="text-[11px] text-[var(--sage)]/70 text-center leading-relaxed">
                {t('articles.openHint')}
              </p>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[60] toast-soft">
          {toast}
        </div>
      )}
    </div>
  );
}
