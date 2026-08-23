'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  getPrayerStreak,
  getTopOpenMotive,
  type PrayerMotive,
} from '@/lib/salvation/prayer-motives';
import { tx3 } from '@/lib/i18n/locale';
import { useI18n } from '@/components/I18nProvider';

export default function TodayPrayerCard({ className = '' }: { className?: string }) {
  const { lang } = useI18n();
  const tx = (en: string, es: string, pt: string) => tx3(lang, en, es, pt);
  const [motive, setMotive] = useState<PrayerMotive | null>(null);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setMotive(getTopOpenMotive());
      setStreak(getPrayerStreak());
    });
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <section className={`prayer-today-card ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--accent)]">
            {tx('Priority 1 · Prayer', 'Prioridad 1 · Oración', 'Prioridade 1 · Oração')}
          </p>
          {motive ? (
            <>
              {motive.forWhom && (
                <p className="text-[11px] text-[var(--sage)] mt-1.5 truncate">{motive.forWhom}</p>
              )}
              <p className="text-[13px] text-white leading-snug mt-1 line-clamp-2 text-pretty">
                {motive.text}
              </p>
            </>
          ) : (
            <p className="text-[13px] text-[var(--sage)] mt-1.5 leading-relaxed">
              {tx(
                'No open request yet. Write the first one on the altar.',
                'Aún no hay un motivo abierto. Escribe el primero en el altar.',
                'Ainda não há um motivo aberto. Escreva o primeiro no altar.'
              )}
            </p>
          )}
        </div>
        {streak > 0 && (
          <div className="shrink-0 text-right">
            <p className="font-display text-xl font-bold text-white tabular-nums leading-none">
              {streak}
            </p>
            <p className="text-[9px] uppercase tracking-wider text-[var(--sage)] mt-1">
              {tx('streak', 'racha', 'sequência')}
            </p>
          </div>
        )}
      </div>
      <div className="mt-3 flex gap-2">
        <Link
          href={
            motive ? '/hub/bible?tab=prayer&session=1' : '/hub/bible?tab=prayer'
          }
          className="btn-sm flex-1 text-center"
        >
          {motive
            ? tx('Pray now', 'Orar ahora', 'Orar agora')
            : tx('Add request', 'Añadir motivo', 'Adicionar motivo')}
        </Link>
        <Link href="/hub/bible?tab=prayer" className="btn-outline-sm shrink-0">
          {tx('List', 'Lista', 'Lista')}
        </Link>
      </div>
    </section>
  );
}
