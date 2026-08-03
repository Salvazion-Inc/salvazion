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
  /** Max cards; default 7 recommended unread by interest */
  limit?: number;
  /** @deprecated Filters removed — always interest + unread recommendations */
  showFilters?: boolean;
  className?: string;
  onScored?: () => void;
}

const DEFAULT_LIMIT = 7;

/**
 * @salvazion_ X Articles — up to 7 unread pieces ranked by user interests.
 */
export default function XArticlesFeed({
  focus = [],
  limit = DEFAULT_LIMIT,
  className = '',
  onScored,
}: Props) {
  const { t, lang } = useI18n();
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<XArticle | null>(null);
  const [progress, setProgress] = useState({ read: 0, total: 0 });
  const [toast, setToast] = useState<string | null>(null);

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

  const articles = useMemo(() => {
    // Prefer unread + interests; if all caught up, fall back to top interest matches
    const unread = getArticleFeed({
      focus,
      unreadOnly: true,
      unreadFirst: true,
      limit,
    });
    if (unread.length > 0) return unread;
    return getArticleFeed({ focus, unreadFirst: false, limit });
  }, [focus, limit, readIds]);

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
                      </p>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {selected && (
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
            </p>
            <p className="text-sm text-[var(--off-white)]/85 leading-relaxed mb-6">
              {selected.preview}
            </p>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleOpenX(selected)}
                className="btn-primary"
              >
                {t('articles.readOnX')} ↗
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
    </div>
  );
}
