'use client';

import { useState } from 'react';
import {
  YOUTUBE_CHANNELS,
  type YouTubeChannel,
} from '@/lib/freedom/youtube-channels';
import { logAction } from '@/lib/scoring/engine';
import { getFreedomPoints } from '@/lib/freedom/engine';
import { useI18n } from '@/components/I18nProvider';

type Props = {
  className?: string;
  onScored?: () => void;
};

/**
 * YouTube channels of library authors — replaces short video + mini-lesson cards.
 * Opening a channel can score Freedom (article/video or lesson).
 */
export default function YouTubeChannelsPanel({
  className = '',
  onScored,
}: Props) {
  const { t, lang } = useI18n();
  const es = lang !== 'en';
  const [opened, setOpened] = useState<Set<string>>(() => new Set());

  const markWatched = (ch: YouTubeChannel, kind: 'video' | 'lesson') => {
    if (opened.has(ch.id)) return;
    logAction(kind === 'lesson' ? 'learn_lesson' : 'learn_article_video');
    setOpened((prev) => new Set([...prev, ch.id]));
    onScored?.();
  };

  const ptsVideo = getFreedomPoints('learn_article_video');
  const ptsLesson = getFreedomPoints('learn_lesson');

  return (
    <section
      className={`space-y-2.5 ${className}`}
      aria-label={es ? 'Canales de YouTube' : 'YouTube channels'}
    >
      <div className="px-0.5">
        <h2 className="text-sm font-semibold text-[var(--sage)]">
          {es ? 'Canales de YouTube' : 'YouTube channels'}
        </h2>
        <p className="text-[10px] text-[var(--sage)]/70 mt-0.5 leading-relaxed">
          {es
            ? 'Videos cortos y mini-cursos de los mismos autores de la biblioteca · Freedom'
            : 'Short videos and mini-courses from the same library authors · Freedom'}
        </p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
        {YOUTUBE_CHANNELS.map((ch) => {
          const done = opened.has(ch.id);
          const focus = es ? ch.focusEs : ch.focusEn;
          return (
            <article
              key={ch.id}
              className="snap-start shrink-0 w-[13.5rem] card-soft overflow-hidden flex flex-col border"
              style={{
                borderColor: done
                  ? 'var(--border-strong)'
                  : `${ch.accent}55`,
              }}
            >
              <div
                className="h-20 flex items-center justify-center relative"
                style={{
                  background: `linear-gradient(145deg, ${ch.accent}40, #0a0a0a 72%)`,
                }}
              >
                <span className="text-3xl" aria-hidden>
                  {ch.mark}
                </span>
                <span className="absolute bottom-1.5 left-2 text-[9px] font-semibold text-white/90 bg-red-600/90 px-1.5 py-0.5 rounded">
                  YouTube
                </span>
              </div>
              <div className="p-2.5 flex flex-col flex-1 gap-1.5">
                <h3 className="text-[12px] font-semibold text-white leading-snug line-clamp-2">
                  {ch.name}
                </h3>
                {ch.handle ? (
                  <p className="text-[10px] text-[var(--accent)]">{ch.handle}</p>
                ) : null}
                <p className="text-[10px] text-[var(--sage)]/80 leading-relaxed line-clamp-3 flex-1">
                  {focus}
                </p>
                <a
                  href={ch.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => markWatched(ch, 'video')}
                  className="mt-auto text-center text-[11px] font-medium min-h-[36px] flex items-center justify-center rounded-lg border transition hover:opacity-90"
                  style={{
                    borderColor: 'rgba(255,0,0,0.4)',
                    color: '#FF6B6B',
                    background: 'rgba(255,0,0,0.08)',
                  }}
                >
                  {done
                    ? es
                      ? '✓ Abierto'
                      : '✓ Opened'
                    : es
                      ? `Ver canal · +${ptsVideo}`
                      : `Open channel · +${ptsVideo}`}
                </a>
                <button
                  type="button"
                  onClick={() => {
                    markWatched(ch, 'lesson');
                    window.open(ch.url, '_blank', 'noopener,noreferrer');
                  }}
                  className="text-center text-[10px] min-h-[32px] rounded-lg border border-[var(--border-soft)] text-[var(--sage)] hover:border-[var(--border-strong)]"
                >
                  {es
                    ? `Mini-curso / lección · +${ptsLesson}`
                    : `Mini-course / lesson · +${ptsLesson}`}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <p className="text-[9px] text-[var(--sage)]/50 px-0.5 leading-relaxed">
        {es
          ? `Video corto +${ptsVideo} · Lección +${ptsLesson} Freedom al abrir un canal (una vez por canal en esta sesión).`
          : `Short video +${ptsVideo} · Lesson +${ptsLesson} Freedom when you open a channel (once per channel this session).`}
      </p>
    </section>
  );
}
