'use client';

import { useState } from 'react';
import {
  X_COMMUNITIES,
  type XCommunity,
} from '@/lib/freedom/x-communities';
import { logAction } from '@/lib/scoring/engine';
import { getFreedomPoints } from '@/lib/freedom/engine';
import { useI18n } from '@/components/I18nProvider';
import XLogo, { textWithXLogo } from '@/components/ui/XLogo';

type Props = {
  className?: string;
  onScored?: () => void;
};

/**
 * X Communities for Freedom → Connect (e.g. Green Lion Kings).
 */
export default function XCommunitiesPanel({
  className = '',
  onScored,
}: Props) {
  const { lang } = useI18n();
  const es = lang !== 'en';
  const [joined, setJoined] = useState<Set<string>>(() => new Set());

  const markConnect = (c: XCommunity) => {
    if (joined.has(c.id)) return;
    logAction('connect_real');
    setJoined((prev) => new Set([...prev, c.id]));
    onScored?.();
  };

  const pts = getFreedomPoints('connect_real');

  return (
    <section
      className={`space-y-2.5 ${className}`}
      aria-label={es ? 'Comunidades en X' : 'X Communities'}
    >
      <div className="px-0.5">
        <h2 className="text-sm font-semibold text-[var(--sage)] inline-flex items-center gap-1.5">
          {es ? (
            <>
              Comunidad en <XLogo className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              <XLogo className="w-3.5 h-3.5" /> Community
            </>
          )}
        </h2>
        <p className="text-[10px] text-[var(--sage)]/70 mt-0.5 leading-relaxed">
          {textWithXLogo(
            es
              ? 'Conecta con la tribu Salvazion en X · Green Lion Kings'
              : 'Connect with the Salvazion tribe on X · Green Lion Kings'
          )}
        </p>
      </div>

      <div className="space-y-3">
        {X_COMMUNITIES.map((c) => {
          const done = joined.has(c.id);
          const blurb = es ? c.blurbEs : c.blurbEn;
          return (
            <article
              key={c.id}
              className="card-soft overflow-hidden border"
              style={{
                borderColor: done
                  ? 'var(--border-strong)'
                  : `${c.accent}55`,
              }}
            >
              <div
                className="px-4 pt-4 pb-3 flex items-start gap-3"
                style={{
                  background: `linear-gradient(135deg, ${c.accent}22 0%, transparent 55%)`,
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 text-xl font-bold"
                  style={{
                    borderColor: `${c.accent}66`,
                    color: c.accent,
                    background: 'rgba(4,4,4,0.65)',
                  }}
                  aria-hidden
                >
                  <XLogo className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--accent)] font-medium inline-flex items-center gap-1">
                    {textWithXLogo(c.brand)}
                  </p>
                  <h3 className="text-base font-semibold text-white leading-tight mt-0.5">
                    {c.name}
                  </h3>
                  <p className="text-[11px] text-[var(--sage)]/90 mt-1.5 leading-relaxed">
                    {textWithXLogo(blurb)}
                  </p>
                </div>
              </div>

              <div className="px-4 pb-4">
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => markConnect(c)}
                  className="btn-primary inline-flex items-center justify-center gap-1.5"
                >
                  {done ? (
                    <>
                      {es ? 'Abrir en' : 'Open on'}{' '}
                      <XLogo className="w-3.5 h-3.5 shrink-0" />
                    </>
                  ) : es ? (
                    `Unirme · +${pts}`
                  ) : (
                    `Join · +${pts}`
                  )}
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
