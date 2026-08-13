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
import { tx3 } from '@/lib/i18n/locale';

type Props = {
  lang?: 'es' | 'en' | 'pt';
  onPrayed?: () => void;
};

const FILTERS: { id: 'all' | PrayerMotiveStatus; es: string; en: string; pt: string }[] = [
  { id: 'all', es: 'Todos', en: 'All', pt: 'Todos' },
  { id: 'open', es: 'Abiertos', en: 'Open', pt: 'Abertos' },
  { id: 'prayed', es: 'Orados', en: 'Prayed', pt: 'Orados' },
  { id: 'answered', es: 'Respondidos', en: 'Answered', pt: 'Respondidos' },
];

export default function PrayerMotivesPanel({ lang = 'en', onPrayed }: Props) {
  const tx = (en: string, es: string, pt: string) => tx3(lang, en, es, pt);
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
    toast(tx('Request saved', 'Motivo guardado', 'Motivo salvo'));
  };

  const handlePrayed = (id: string) => {
    markPrayed(id);
    refresh();
    onPrayed?.();
    toast(tx('Marked as prayed · Salvation', 'Marcado como orado · Salvation', 'Marcado como orado · Salvation'));
  };

  const filtered =
    filter === 'all' ? list : list.filter((m) => m.status === filter);

  const statusLabel = (s: PrayerMotiveStatus) => {
    const map = {
      open: tx('Open', 'Abierto', 'Aberto'),
      prayed: tx('Prayed', 'Orado', 'Orado'),
      answered: tx('Answered', 'Respondido', 'Respondido'),
      archived: tx('Archived', 'Archivado', 'Arquivado'),
    };
    return map[s];
  };

  return (
    <div className="flex flex-col h-full min-h-0 max-w-lg mx-auto w-full">
      <div className="glass rounded-2xl p-4 border border-[var(--border-soft)] mb-4 shrink-0 space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-white">
            {tx('Prayer requests', 'Motivos de oración', 'Motivos de oração')}
          </h2>
          <p className="text-[11px] text-[var(--sage)]/85 mt-1 leading-relaxed">
            {tx(
              'Write who or what you pray for. Part of the Salvation pillar.',
              'Escribe por quién o por qué orar. Forma parte del pilar Salvation.',
              'Escreva por quem ou por que orar. Faz parte do pilar Salvation.'
            )}
          </p>
        </div>

        <div>
          <label className="block text-[11px] text-[var(--sage)] mb-1">
            {tx('Request', 'Motivo', 'Motivo')}
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder={tx(
              'E.g. Healing for my mother, wisdom at work…',
              'Ej: Sanidad para mi madre, sabiduría en el trabajo…',
              'Ex.: Cura para minha mãe, sabedoria no trabalho…'
            )}
            className="input-soft py-2.5 text-sm resize-none"
          />
        </div>
        <div>
          <label className="block text-[11px] text-[var(--sage)] mb-1">
            {tx('For (optional)', 'Para (opcional)', 'Para (opcional)')}
          </label>
          <input
            type="text"
            value={forWhom}
            onChange={(e) => setForWhom(e.target.value)}
            maxLength={120}
            placeholder={tx('Person, family, nation…', 'Persona, familia, nación…', 'Pessoa, família, nação…')}
            className="input-soft py-2.5 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!text.trim()}
          className="btn-primary py-2.5 text-sm disabled:opacity-40"
        >
          {tx('Add request', 'Añadir motivo', 'Adicionar motivo')}
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
            {tx(f.en, f.es, f.pt)}
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
            {tx(
              'No requests in this filter yet. Add one above.',
              'Aún no hay motivos en este filtro. Escribe el primero arriba.',
              'Ainda não há motivos neste filtro. Escreva o primeiro acima.'
            )}
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
                    {tx('✓ I prayed', '✓ Oré por esto', '✓ Orei por isto')}
                  </button>
                )}
                {(m.status === 'open' || m.status === 'prayed') && (
                  <button
                    type="button"
                    onClick={() => {
                      markAnswered(m.id);
                      refresh();
                      toast(tx('Glory to God!', '¡Gloria a Dios!', 'Glória a Deus!'));
                    }}
                    className="pill-soft text-[10px]"
                  >
                    {tx('Answered', 'Respondido', 'Respondido')}
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
                    {tx('Reopen', 'Reabrir', 'Reabrir')}
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
                  {tx('Delete', 'Eliminar', 'Excluir')}
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
