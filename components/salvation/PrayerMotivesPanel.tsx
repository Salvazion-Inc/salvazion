'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  PrayerCategory,
  PrayerMotive,
  PrayerMotiveStatus,
  PRAYER_CATEGORIES,
  addPrayerMotive,
  getPrayerStreak,
  loadPrayerMotives,
  markAnswered,
  markPrayed,
  prayedToday,
  removePrayerMotive,
  reopenMotive,
  reorderPrayerMotives,
  updatePrayerMotive,
} from '@/lib/salvation/prayer-motives';
import { getVerseOfTheDay } from '@/lib/salvation/verse-of-the-day';
import { tx3 } from '@/lib/i18n/locale';
import PrayerSessionOverlay from './PrayerSessionOverlay';

type Props = {
  lang?: 'es' | 'en' | 'pt' | string;
  onPrayed?: () => void;
  autoStartSession?: boolean;
};

const FILTERS: { id: 'all' | PrayerMotiveStatus; es: string; en: string; pt: string }[] = [
  { id: 'open', es: 'Abiertos', en: 'Open', pt: 'Abertos' },
  { id: 'prayed', es: 'Orados', en: 'Prayed', pt: 'Orados' },
  { id: 'answered', es: 'Respondidos', en: 'Answered', pt: 'Respondidos' },
  { id: 'all', es: 'Todos', en: 'All', pt: 'Todos' },
];

const CATEGORY_LABEL: Record<PrayerCategory, { es: string; en: string; pt: string }> = {
  family: { es: 'Familia', en: 'Family', pt: 'Família' },
  health: { es: 'Salud', en: 'Health', pt: 'Saúde' },
  nation: { es: 'Nación', en: 'Nation', pt: 'Nação' },
  church: { es: 'Iglesia', en: 'Church', pt: 'Igreja' },
  work: { es: 'Trabajo', en: 'Work', pt: 'Trabalho' },
  personal: { es: 'Personal', en: 'Personal', pt: 'Pessoal' },
  world: { es: 'El mundo', en: 'The world', pt: 'O mundo' },
};

type DragState = {
  id: string;
  pointerId: number;
  startY: number;
  offsetY: number;
  height: number;
};

function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export default function PrayerMotivesPanel({
  lang = 'en',
  onPrayed,
  autoStartSession = false,
}: Props) {
  const tx = (en: string, es: string, pt: string) => tx3(lang, en, es, pt);
  const [list, setList] = useState<PrayerMotive[]>([]);
  const [text, setText] = useState('');
  const [forWhom, setForWhom] = useState('');
  const [category, setCategory] = useState<PrayerCategory | ''>('');
  const [filter, setFilter] = useState<'all' | PrayerMotiveStatus>('open');
  const [msg, setMsg] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editForWhom, setEditForWhom] = useState('');
  const [editCategory, setEditCategory] = useState<PrayerCategory | ''>('');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [session, setSession] = useState(false);
  const [streak, setStreak] = useState(0);
  const [didPrayToday, setDidPrayToday] = useState(false);
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const orderRef = useRef<string[]>([]);
  const rowRefs = useRef<Map<string, HTMLElement>>(new Map());
  const verse = useMemo(() => getVerseOfTheDay(lang), [lang]);

  const refresh = useCallback(() => {
    setList(loadPrayerMotives());
    setStreak(getPrayerStreak());
    setDidPrayToday(prayedToday());
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => refresh());
    return () => cancelAnimationFrame(id);
  }, [refresh]);

  useEffect(() => {
    if (!autoStartSession) return;
    const id = requestAnimationFrame(() => {
      const loaded = loadPrayerMotives();
      if (loaded.some((m) => m.status === 'open' || m.status === 'prayed')) {
        setSession(true);
      }
    });
    return () => cancelAnimationFrame(id);
  }, [autoStartSession]);

  const toast = (m: string) => {
    setMsg(m);
    window.setTimeout(() => setMsg(null), 2200);
  };

  const filtered =
    filter === 'all' ? list : list.filter((m) => m.status === filter);

  const openCount = list.filter((m) => m.status === 'open').length;
  const answeredCount = list.filter((m) => m.status === 'answered').length;

  const handleAdd = () => {
    if (!text.trim()) return;
    addPrayerMotive(text, forWhom, category || undefined);
    setText('');
    setForWhom('');
    setCategory('');
    setComposerOpen(false);
    refresh();
    toast(tx('Request saved at the top', 'Motivo guardado arriba', 'Motivo salvo no topo'));
  };

  const handlePrayed = (id: string) => {
    markPrayed(id);
    refresh();
    onPrayed?.();
    toast(tx('Marked as prayed · Salvation', 'Marcado como orado · Salvation', 'Marcado como orado · Salvation'));
  };

  const startEdit = (m: PrayerMotive) => {
    setEditingId(m.id);
    setEditText(m.text);
    setEditForWhom(m.forWhom || '');
    setEditCategory(m.category || '');
    setConfirmId(null);
  };

  const saveEdit = () => {
    if (!editingId || !editText.trim()) return;
    updatePrayerMotive(editingId, {
      text: editText,
      forWhom: editForWhom,
      category: editCategory,
    });
    setEditingId(null);
    refresh();
    toast(tx('Request updated', 'Motivo actualizado', 'Motivo atualizado'));
  };

  const persistOrder = (ids: string[]) => {
    orderRef.current = ids;
    reorderPrayerMotives(ids);
    refresh();
  };

  const onHandlePointerDown = (e: React.PointerEvent, id: string) => {
    if (e.button !== 0) return;
    if (editingId) return;
    const el = rowRefs.current.get(id);
    const height = el?.getBoundingClientRect().height ?? 88;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const next: DragState = {
      id,
      pointerId: e.pointerId,
      startY: e.clientY,
      offsetY: 0,
      height,
    };
    orderRef.current = filtered.map((m) => m.id);
    dragRef.current = next;
    setDrag(next);
  };

  const onHandlePointerMove = (e: React.PointerEvent) => {
    const current = dragRef.current;
    if (!current || e.pointerId !== current.pointerId) return;
    const offsetY = e.clientY - current.startY;
    const ids = orderRef.current;
    const from = ids.indexOf(current.id);
    if (from < 0) return;
    const delta = Math.round(offsetY / Math.max(48, current.height));
    const to = Math.max(0, Math.min(ids.length - 1, from + delta));
    if (to !== from) {
      const nextIds = arrayMove(ids, from, to);
      persistOrder(nextIds);
      const moved: DragState = { ...current, startY: e.clientY, offsetY: 0 };
      dragRef.current = moved;
      setDrag(moved);
      return;
    }
    const moved: DragState = { ...current, offsetY };
    dragRef.current = moved;
    setDrag(moved);
  };

  const onHandlePointerUp = (e: React.PointerEvent) => {
    const current = dragRef.current;
    if (!current || e.pointerId !== current.pointerId) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    dragRef.current = null;
    setDrag(null);
  };

  const statusLabel = (s: PrayerMotiveStatus) => {
    const map = {
      open: tx('Open', 'Abierto', 'Aberto'),
      prayed: tx('Prayed', 'Orado', 'Orado'),
      answered: tx('Answered', 'Respondido', 'Respondido'),
      archived: tx('Archived', 'Archivado', 'Arquivado'),
    };
    return map[s];
  };

  const catLabel = (c?: PrayerCategory) => {
    if (!c) return '';
    const l = CATEGORY_LABEL[c];
    return tx(l.en, l.es, l.pt);
  };

  const canReorder = filter === 'open' || filter === 'all';

  return (
    <div className="flex flex-col h-full min-h-0 max-w-lg mx-auto w-full">
      {session && (
        <PrayerSessionOverlay
          lang={lang}
          motives={list}
          onPrayed={handlePrayed}
          onClose={() => setSession(false)}
          onSessionComplete={() => {
            onPrayed?.();
            refresh();
          }}
        />
      )}

      <section className="prayer-hero mb-4 shrink-0">
        <div className="prayer-hero-glow" aria-hidden />
        <p className="relative z-[1] text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]/90">
          {tx('Verse of the day', 'Versículo del día', 'Versículo do dia')}
        </p>
        <p className="relative z-[1] mt-2 font-display text-[1.05rem] leading-snug text-white text-pretty">
          {verse.text}
        </p>
        <p className="relative z-[1] mt-1.5 text-[11px] text-[var(--sage)]">{verse.ref}</p>

        <div className="relative z-[1] mt-4 flex items-end justify-between gap-3">
          <div className="flex gap-4">
            <div>
              <p className="font-display text-2xl font-bold text-white tabular-nums leading-none">
                {streak}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-[var(--sage)] mt-1">
                {tx('Day streak', 'Racha de días', 'Sequência de dias')}
              </p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-white tabular-nums leading-none">
                {openCount}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-[var(--sage)] mt-1">
                {tx('Open', 'Abiertos', 'Abertos')}
              </p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-[var(--accent)] tabular-nums leading-none">
                {answeredCount}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-[var(--sage)] mt-1">
                {tx('Answered', 'Respondidos', 'Respondidos')}
              </p>
            </div>
          </div>
          {didPrayToday && (
            <span className="text-[10px] text-[var(--accent)] font-medium">
              {tx('Prayed today', 'Orado hoy', 'Orado hoje')}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setSession(true)}
          className="btn-primary mt-4 py-2.5 text-sm"
          disabled={list.filter((m) => m.status === 'open' || m.status === 'prayed').length === 0}
        >
          {tx('Pray now · by priority', 'Orar ahora · por prioridad', 'Orar agora · por prioridade')}
        </button>
      </section>

      {!composerOpen ? (
        <button
          type="button"
          onClick={() => setComposerOpen(true)}
          className="mb-3 shrink-0 w-full rounded-2xl border border-dashed border-[var(--border-strong)] px-4 py-3 text-left text-sm text-[var(--sage)] hover:text-white hover:border-[var(--accent)]/50 transition-colors"
        >
          {tx('+ New request', '+ Nuevo motivo', '+ Novo motivo')}
        </button>
      ) : (
        <div className="glass rounded-2xl p-4 border border-[var(--border-soft)] mb-3 shrink-0 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-white">
                {tx('New prayer request', 'Nuevo motivo de oración', 'Novo motivo de oração')}
              </h2>
              <p className="text-[11px] text-[var(--sage)]/85 mt-1 leading-relaxed">
                {tx(
                  'It is saved as priority 1. Drag later to rank what comes first.',
                  'Se guarda como prioridad 1. Luego arrástralo para ordenar lo primero.',
                  'É salvo como prioridade 1. Depois arraste para ordenar o que vem primeiro.'
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setComposerOpen(false)}
              className="text-[var(--sage)] text-lg leading-none px-1"
              aria-label={tx('Close', 'Cerrar', 'Fechar')}
            >
              ×
            </button>
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
              autoFocus
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
          <div className="flex flex-wrap gap-1.5">
            {PRAYER_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory((prev) => (prev === c ? '' : c))}
                className={`pill-soft text-[10px] ${category === c ? 'pill-soft-active' : ''}`}
              >
                {catLabel(c)}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!text.trim()}
            className="btn-primary py-2.5 text-sm disabled:opacity-40"
          >
            {tx('Add request', 'Añadir motivo', 'Adicionar motivo')}
          </button>
        </div>
      )}

      {msg && (
        <p className="text-center text-xs text-[var(--accent)] mb-2 shrink-0">{msg}</p>
      )}

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

      {canReorder && filtered.length > 1 && (
        <p className="text-[10px] text-[var(--sage)]/80 mb-2 shrink-0 px-0.5">
          {tx(
            'Drag the handle or use arrows to rank by priority.',
            'Arrastra el asa o usa las flechas para clasificar por prioridad.',
            'Arraste a alça ou use as setas para classificar por prioridade.'
          )}
        </p>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pb-4">
        {filtered.length === 0 ? (
          <div className="prayer-empty">
            <div className="prayer-empty-flame" aria-hidden />
            <p className="text-sm text-white font-medium">
              {tx('Your altar is quiet.', 'Tu altar está en silencio.', 'O teu altar está em silêncio.')}
            </p>
            <p className="text-[12px] text-[var(--sage)] mt-1.5 leading-relaxed max-w-xs mx-auto">
              {tx(
                'Write who or what you carry. The first request becomes priority 1.',
                'Escribe a quién o qué cargas. El primer motivo será prioridad 1.',
                'Escreva por quem ou o que cargas. O primeiro motivo será prioridade 1.'
              )}
            </p>
            <button
              type="button"
              onClick={() => setComposerOpen(true)}
              className="btn-sm mt-4"
            >
              {tx('Write the first request', 'Escribir el primer motivo', 'Escrever o primeiro motivo')}
            </button>
          </div>
        ) : (
          filtered.map((m, i) => {
            const isDragging = drag?.id === m.id;
            return (
              <article
                key={m.id}
                ref={(el) => {
                  if (el) rowRefs.current.set(m.id, el);
                  else rowRefs.current.delete(m.id);
                }}
                className={`prayer-card ${isDragging ? 'prayer-card-dragging' : ''}`}
                data-priority={i + 1}
                style={
                  isDragging
                    ? { transform: `translateY(${drag.offsetY}px)` }
                    : undefined
                }
              >
                <div className="prayer-card-rail" aria-hidden />
                <div className="flex items-start gap-2">
                  {canReorder && (
                    <div className="flex flex-col items-center gap-0.5 pt-0.5 shrink-0">
                      <button
                        type="button"
                        className="prayer-handle"
                        aria-label={tx('Drag to reorder', 'Arrastrar para reordenar', 'Arrastar para reordenar')}
                        onPointerDown={(e) => onHandlePointerDown(e, m.id)}
                        onPointerMove={onHandlePointerMove}
                        onPointerUp={onHandlePointerUp}
                        onPointerCancel={onHandlePointerUp}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
                          <circle cx="5" cy="3.5" r="1.15" fill="currentColor" />
                          <circle cx="11" cy="3.5" r="1.15" fill="currentColor" />
                          <circle cx="5" cy="8" r="1.15" fill="currentColor" />
                          <circle cx="11" cy="8" r="1.15" fill="currentColor" />
                          <circle cx="5" cy="12.5" r="1.15" fill="currentColor" />
                          <circle cx="11" cy="12.5" r="1.15" fill="currentColor" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="prayer-nudge"
                        disabled={i === 0}
                        aria-label={tx('Move up', 'Subir', 'Subir')}
                        onClick={() => {
                          persistOrder(arrayMove(filtered, i, i - 1).map((x) => x.id));
                        }}
                      >
                        ▴
                      </button>
                      <button
                        type="button"
                        className="prayer-nudge"
                        disabled={i === filtered.length - 1}
                        aria-label={tx('Move down', 'Bajar', 'Descer')}
                        onClick={() => {
                          persistOrder(arrayMove(filtered, i, i + 1).map((x) => x.id));
                        }}
                      >
                        ▾
                      </button>
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="prayer-rank">
                            {tx('P', 'P', 'P')}
                            {i + 1}
                          </span>
                          {m.category && (
                            <span className="text-[10px] uppercase tracking-wider text-[var(--accent)]">
                              {catLabel(m.category)}
                            </span>
                          )}
                        </div>
                        {editingId === m.id ? (
                          <div className="space-y-2 mt-1">
                            <textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              rows={3}
                              maxLength={500}
                              className="input-soft py-2 text-sm resize-none"
                            />
                            <input
                              type="text"
                              value={editForWhom}
                              onChange={(e) => setEditForWhom(e.target.value)}
                              maxLength={120}
                              placeholder={tx('For…', 'Para…', 'Para…')}
                              className="input-soft py-2 text-sm"
                            />
                            <div className="flex flex-wrap gap-1.5">
                              {PRAYER_CATEGORIES.map((c) => (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() =>
                                    setEditCategory((prev) => (prev === c ? '' : c))
                                  }
                                  className={`pill-soft text-[10px] ${editCategory === c ? 'pill-soft-active' : ''}`}
                                >
                                  {catLabel(c)}
                                </button>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="btn-outline-sm"
                              >
                                {tx('Cancel', 'Cancelar', 'Cancelar')}
                              </button>
                              <button
                                type="button"
                                onClick={saveEdit}
                                disabled={!editText.trim()}
                                className="btn-sm"
                              >
                                {tx('Save', 'Guardar', 'Guardar')}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {m.forWhom && (
                              <p className="text-[10px] uppercase tracking-wider text-[var(--accent)] mb-0.5">
                                {m.forWhom}
                              </p>
                            )}
                            <p className="text-sm text-[#D8E1D9] leading-relaxed whitespace-pre-wrap">
                              {m.text}
                            </p>
                            <p className="text-[10px] text-[var(--sage)]/70 mt-1.5 tabular-nums">
                              {statusLabel(m.status)}
                              {m.prayedCount > 0
                                ? ` · ${tx('prayed', 'orado', 'orado')} ${m.prayedCount}×`
                                : ''}
                              {' · '}
                              {m.createdAt.slice(0, 10)}
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {editingId !== m.id && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {m.status !== 'answered' && (
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
                          onClick={() => startEdit(m)}
                          className="pill-soft text-[10px]"
                        >
                          {tx('Edit', 'Editar', 'Editar')}
                        </button>
                        {confirmId === m.id ? (
                          <button
                            type="button"
                            onClick={() => {
                              removePrayerMotive(m.id);
                              setConfirmId(null);
                              refresh();
                            }}
                            className="pill-soft text-[10px] text-red-300/90 border-red-500/30"
                          >
                            {tx('Confirm delete', 'Confirmar borrar', 'Confirmar exclusão')}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmId(m.id)}
                            className="pill-soft text-[10px] text-red-300/80 border-red-500/20"
                          >
                            {tx('Delete', 'Eliminar', 'Excluir')}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
