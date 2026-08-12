'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  PrayerMotive,
  PrayerMotiveStatus,
  addPrayerMotive,
  loadPrayerMotives,
  markAnswered,
  markPrayed,
  removePrayerMotive,
  reopenMotive,
} from '@/lib/salvation/prayer-motives';

type Props = {
  lang?: 'es' | 'en' | 'pt';
  onPrayed?: () => void;
};

const FILTERS: { id: 'all' | PrayerMotiveStatus; es: string; en: string }[] = [
  { id: 'all', es: 'Todos', en: 'All' },
  { id: 'open', es: 'Abiertos', en: 'Open' },
  { id: 'prayed', es: 'Orados', en: 'Prayed' },
  { id: 'answered', es: 'Respondidos', en: 'Answered' },
];

export default function PrayerMotivesPanel({ lang = 'es', onPrayed }: Props) {
  const es = lang !== 'en';
  const [list, setList] = useState<PrayerMotive[]>([]);
  const [text, setText] = useState('');
  const [forWhom, setForWhom] = useState('');
  const [filter, setFilter] = useState<'all' | PrayerMotiveStatus>('open');
  const [msg, setMsg] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setList(loadPrayerMotives());
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => refresh());
    return () => cancelAnimationFrame(id);
  }, [refresh]);

  const toast = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(null), 2200);
  };

  const handleAdd = () => {
    if (!text.trim()) return;
    addPrayerMotive(text, forWhom);
    setText('');
    setForWhom('');
    refresh();
    toast(es ? 'Motivo guardado' : 'Request saved');
  };

  const handlePrayed = (id: string) => {
    markPrayed(id);
    refresh();
    onPrayed?.();
    toast(es ? 'Marcado como orado · Salvation' : 'Marked as prayed · Salvation');
  };

  const filtered =
    filter === 'all' ? list : list.filter((m) => m.status === filter);

  const statusLabel = (s: PrayerMotiveStatus) => {
    const map = {
      open: es ? 'Abierto' : 'Open',
      prayed: es ? 'Orado' : 'Prayed',
      answered: es ? 'Respondido' : 'Answered',
      archived: es ? 'Archivado' : 'Archived',
    };
    return map[s];
  };

  return (
    <div className="flex flex-col h-full min-h-0 max-w-lg mx-auto w-full">
      <div className="glass rounded-2xl p-4 border border-[var(--border-soft)] mb-4 shrink-0 space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-white">
            {es ? 'Motivos de oración' : 'Prayer requests'}
          </h2>
          <p className="text-[11px] text-[var(--sage)]/85 mt-1 leading-relaxed">
            {es
              ? 'Escribe por quién o por qué orar. Forma parte del pilar Salvation.'
              : 'Write who or what you pray for. Part of the Salvation pillar.'}
          </p>
        </div>

        <div>
          <label className="block text-[11px] text-[var(--sage)] mb-1">
            {es ? 'Motivo' : 'Request'}
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder={
              es
                ? 'Ej: Sanidad para mi madre, sabiduría en el trabajo…'
                : 'E.g. Healing for my mother, wisdom at work…'
            }
            className="input-soft py-2.5 text-sm resize-none"
          />
        </div>
        <div>
          <label className="block text-[11px] text-[var(--sage)] mb-1">
            {es ? 'Para (opcional)' : 'For (optional)'}
          </label>
          <input
            type="text"
            value={forWhom}
            onChange={(e) => setForWhom(e.target.value)}
            maxLength={120}
            placeholder={es ? 'Persona, familia, nación…' : 'Person, family, nation…'}
            className="input-soft py-2.5 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!text.trim()}
          className="btn-primary py-2.5 text-sm disabled:opacity-40"
        >
          {es ? 'Añadir motivo' : 'Add request'}
        </button>
        {msg && (
          <p className="text-center text-xs text-[var(--accent)]">{msg}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3 shrink-0">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`pill-soft text-[10px] ${filter === f.id ? 'pill-soft-active' : ''}`}
          >
            {es ? f.es : f.en}
            {f.id !== 'all' && (
              <span className="ml-1 opacity-70">
                {list.filter((m) => m.status === f.id).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pb-4">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-[var(--sage)]/70 text-sm">
            {es
              ? 'Aún no hay motivos en este filtro. Escribe el primero arriba.'
              : 'No requests in this filter yet. Add one above.'}
          </div>
        ) : (
          filtered.map((m) => (
            <article
              key={m.id}
              className="glass rounded-xl border border-[var(--border-soft)] p-3.5 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  {m.forWhom && (
                    <p className="text-[10px] uppercase tracking-wider text-[var(--accent)] mb-0.5">
                      {m.forWhom}
                    </p>
                  )}
                  <p className="text-sm text-[#D8E1D9] leading-relaxed whitespace-pre-wrap">
                    {m.text}
                  </p>
                  <p className="text-[10px] text-[var(--sage)]/70 mt-1.5 tabular-nums">
                    {statusLabel(m.status)} · {m.createdAt.slice(0, 10)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {m.status === 'open' && (
                  <button
                    type="button"
                    onClick={() => handlePrayed(m.id)}
                    className="pill-soft pill-soft-active text-[10px]"
                  >
                    {es ? '✓ Oré por esto' : '✓ I prayed'}
                  </button>
                )}
                {(m.status === 'open' || m.status === 'prayed') && (
                  <button
                    type="button"
                    onClick={() => {
                      markAnswered(m.id);
                      refresh();
                      toast(es ? '¡Gloria a Dios!' : 'Glory to God!');
                    }}
                    className="pill-soft text-[10px]"
                  >
                    {es ? 'Respondido' : 'Answered'}
                  </button>
                )}
                {m.status !== 'open' && (
                  <button
                    type="button"
                    onClick={() => {
                      reopenMotive(m.id);
                      refresh();
                    }}
                    className="pill-soft text-[10px]"
                  >
                    {es ? 'Reabrir' : 'Reopen'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    removePrayerMotive(m.id);
                    refresh();
                  }}
                  className="pill-soft text-[10px] text-red-300/80 border-red-500/20"
                >
                  {es ? 'Eliminar' : 'Delete'}
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
