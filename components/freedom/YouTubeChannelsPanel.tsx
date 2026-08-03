'use client';

import { useState } from 'react';
import {
  YOUTUBE_CHANNELS,
  youtubeChannelImage,
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
 * Official YouTube channels — one open action (no duplicate lesson CTA).
 */
export default function YouTubeChannelsPanel({
  className = '',
  onScored,
}: Props) {
  const { lang } = useI18n();
  const es = lang !== 'en';
  const [opened, setOpened] = useState<Set<string>>(() => new Set());
  const [imgFail, setImgFail] = useState<Set<string>>(() => new Set());
  const pts = getFreedomPoints('learn_article_video');

  const openChannel = (ch: YouTubeChannel) => {
    if (!opened.has(ch.id)) {
      logAction('learn_article_video');
      setOpened((prev) => new Set([...prev, ch.id]));
      onScored?.();
    }
  };

  return (
    <section
      className={`space-y-2 ${className}`}
      aria-label={es ? 'Canales de YouTube' : 'YouTube channels'}
    >
      <div className="px-0.5">
        <h2 className="text-sm font-semibold text-[var(--sage)]">
          {es ? 'YouTube' : 'YouTube'}
        </h2>
        <p className="text-[10px] text-[var(--sage)]/70 mt-0.5">
          {es
            ? 'Canales oficiales · +' + pts + ' Freedom al abrir'
            : 'Official channels · +' + pts + ' Freedom on open'}
        </p>
      </div>

      <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory">
        {YOUTUBE_CHANNELS.map((ch) => {
          const done = opened.has(ch.id);
          const img = youtubeChannelImage(ch);
          const showImg = !!img && !imgFail.has(ch.id);
          return (
            <article
              key={ch.id}
              className="snap-start shrink-0 w-[10.5rem] card-soft overflow-hidden flex flex-col border"
              style={{
                borderColor: done
                  ? 'var(--border-strong)'
                  : `${ch.accent}55`,
              }}
            >
              <div
                className="relative w-full aspect-square overflow-hidden"
                style={{
                  background: `linear-gradient(145deg, ${ch.accent}40, #0a0a0a 85%)`,
                }}
              >
                {showImg ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ objectPosition: 'center 18%' }}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setImgFail((prev) => new Set([...prev, ch.id]))
                    }
                  />
                ) : (
                  <span
                    className="absolute inset-0 flex items-center justify-center text-3xl"
                    aria-hidden
                  >
                    {ch.mark}
                  </span>
                )}
              </div>
              <div className="p-2.5 flex flex-col flex-1 gap-1.5 min-h-[7.5rem]">
                <h3 className="text-[12px] font-semibold text-white leading-snug line-clamp-2 min-h-[2rem]">
                  {ch.name}
                </h3>
                {ch.handle ? (
                  <p className="text-[10px] text-[var(--accent)] truncate">
                    {ch.handle}
                  </p>
                ) : null}
                <a
                  href={ch.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => openChannel(ch)}
                  className="btn-outline-sm mt-auto w-full"
                  style={{
                    borderColor: done
                      ? 'var(--border-strong)'
                      : 'rgba(255,0,0,0.35)',
                    color: done ? 'var(--sage)' : '#FF6B6B',
                  }}
                >
                  {done
                    ? es
                      ? '✓ Abierto'
                      : '✓ Opened'
                    : es
                      ? `Abrir · +${pts}`
                      : `Open · +${pts}`}
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
