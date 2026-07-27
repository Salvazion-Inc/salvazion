'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  CycleDayLog,
  CycleSnapshot,
  FLOW_LABELS,
  FlowLevel,
  PHASE_LABELS,
  SYMPTOM_LABELS,
  CycleSymptom,
  getCycleLogForDate,
  getCycleSnapshot,
  markPeriodStart,
  saveCycleSettings,
  upsertCycleDayLog,
} from '@/lib/health/cycle';

const FLOWS: FlowLevel[] = ['none', 'spotting', 'light', 'medium', 'heavy'];
const SYMPTOMS: CycleSymptom[] = [
  'cramps',
  'headache',
  'fatigue',
  'bloating',
  'mood',
  'breast_tenderness',
  'back_pain',
  'acne',
  'nausea',
  'cravings',
];

type Props = {
  lang?: 'es' | 'en';
  onLogged?: () => void;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function WomenHealthPanel({ lang = 'es', onLogged }: Props) {
  const es = lang !== 'en';
  const [snap, setSnap] = useState<CycleSnapshot | null>(null);
  const [date, setDate] = useState(todayIso());
  const [flow, setFlow] = useState<FlowLevel>('none');
  const [symptoms, setSymptoms] = useState<CycleSymptom[]>([]);
  const [notes, setNotes] = useState('');
  const [cycleLen, setCycleLen] = useState(28);
  const [periodLen, setPeriodLen] = useState(5);
  const [msg, setMsg] = useState<string | null>(null);

  const refresh = useCallback(() => {
    const s = getCycleSnapshot(lang);
    setSnap(s);
    setCycleLen(s.cycleLength);
    setPeriodLen(s.periodLength);
    const log = getCycleLogForDate(date);
    if (log) {
      setFlow(log.flow);
      setSymptoms(log.symptoms || []);
      setNotes(log.notes || '');
    } else {
      setFlow('none');
      setSymptoms([]);
      setNotes('');
    }
  }, [lang, date]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toast = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(null), 2200);
  };

  const toggleSymptom = (s: CycleSymptom) => {
    setSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const handleSaveDay = () => {
    upsertCycleDayLog({
      date,
      flow,
      symptoms,
      notes: notes.trim() || undefined,
    });
    refresh();
    onLogged?.();
    toast(es ? 'Día del ciclo guardado' : 'Cycle day saved');
  };

  const handlePeriodStart = () => {
    markPeriodStart(date);
    upsertCycleDayLog({
      date,
      flow: flow === 'none' ? 'medium' : flow,
      symptoms,
      notes: notes.trim() || undefined,
    });
    refresh();
    onLogged?.();
    toast(es ? 'Inicio de periodo registrado' : 'Period start logged');
  };

  const handleSaveSettings = () => {
    saveCycleSettings({
      avgCycleLength: Math.min(45, Math.max(21, cycleLen)),
      avgPeriodLength: Math.min(10, Math.max(2, periodLen)),
    });
    refresh();
    toast(es ? 'Ajustes del ciclo actualizados' : 'Cycle settings updated');
  };

  if (!snap) {
    return (
      <section className="mb-6">
        <div className="glass rounded-2xl p-4 border border-[var(--border-soft)] animate-pulse h-40" />
      </section>
    );
  }

  const phaseLabel = PHASE_LABELS[snap.phase][es ? 'es' : 'en'];

  return (
    <section className="mb-6">
      <h2 className="text-sm font-semibold text-[var(--sage)] mb-3 flex items-center gap-2">
        <span>♀</span>
        {es ? 'Salud femenina · Ciclo' : 'Women’s health · Cycle'}
      </h2>

      <div className="glass rounded-2xl p-4 border border-[var(--border-soft)] space-y-4">
        <p className="text-[11px] text-[var(--sage)]/80 leading-relaxed">
          {es
            ? 'Registro privado en tu dispositivo. Úsalo para mayordomía del cuerpo, no como diagnóstico médico.'
            : 'Private on-device log. Body stewardship — not a medical diagnosis.'}
        </p>

        {/* Phase summary */}
        <div className="rounded-xl border border-[var(--border-soft)] bg-[#040404]/55 px-3.5 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--accent)]">
                {es ? 'Fase actual' : 'Current phase'}
              </p>
              <p className="text-lg font-semibold text-white mt-0.5">{phaseLabel}</p>
              <p className="text-xs text-[var(--sage)] mt-0.5">
                {snap.dayInCycle != null
                  ? es
                    ? `Día ${snap.dayInCycle} del ciclo (~${snap.cycleLength} d)`
                    : `Day ${snap.dayInCycle} of cycle (~${snap.cycleLength} d)`
                  : es
                    ? 'Registra el inicio de tu periodo'
                    : 'Log your period start'}
              </p>
            </div>
            <div className="text-right text-[11px] text-[var(--sage)] space-y-1">
              {snap.nextPeriodEstimate && (
                <p>
                  {es ? 'Próx. periodo' : 'Next period'}
                  <br />
                  <span className="text-white tabular-nums">{snap.nextPeriodEstimate}</span>
                </p>
              )}
              {snap.ovulationEstimate && (
                <p>
                  {es ? 'Ovulación est.' : 'Est. ovulation'}
                  <br />
                  <span className="text-white tabular-nums">{snap.ovulationEstimate}</span>
                </p>
              )}
            </div>
          </div>
          {snap.tips[0] && (
            <p className="text-[11px] text-[#D8E1D9]/80 mt-2.5 leading-relaxed border-t border-[var(--border-soft)] pt-2.5">
              {snap.tips[0]}
            </p>
          )}
        </div>

        {/* Daily log */}
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] text-[var(--sage)] mb-1">
              {es ? 'Fecha' : 'Date'}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-soft py-2.5"
            />
          </div>

          <div>
            <p className="text-[11px] text-[var(--sage)] mb-1.5">
              {es ? 'Flujo' : 'Flow'}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {FLOWS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFlow(f)}
                  className={`px-2.5 py-1.5 rounded-full text-[11px] border transition ${
                    flow === f
                      ? 'border-[var(--border-strong)] bg-[var(--surface-active)] text-[var(--accent)]'
                      : 'border-[var(--border-soft)] text-[var(--sage)]'
                  }`}
                >
                  {FLOW_LABELS[f][es ? 'es' : 'en']}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] text-[var(--sage)] mb-1.5">
              {es ? 'Síntomas' : 'Symptoms'}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SYMPTOMS.map((s) => {
                const on = symptoms.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSymptom(s)}
                    className={`px-2.5 py-1.5 rounded-full text-[11px] border transition ${
                      on
                        ? 'border-[var(--border-strong)] bg-[var(--surface-active)] text-[var(--accent)]'
                        : 'border-[var(--border-soft)] text-[var(--sage)]'
                    }`}
                  >
                    {SYMPTOM_LABELS[s][es ? 'es' : 'en']}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-[var(--sage)] mb-1">
              {es ? 'Notas' : 'Notes'}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder={es ? 'Opcional…' : 'Optional…'}
              className="input-soft py-2.5 resize-none text-sm"
            />
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={handleSaveDay} className="btn-primary flex-1 py-2.5 text-sm">
              {es ? 'Guardar día' : 'Save day'}
            </button>
            <button
              type="button"
              onClick={handlePeriodStart}
              className="btn-secondary flex-1 py-2.5 text-sm"
            >
              {es ? 'Inicio de periodo' : 'Period start'}
            </button>
          </div>
        </div>

        {/* Settings */}
        <div className="border-t border-[var(--border-soft)] pt-3 space-y-3">
          <p className="text-[11px] uppercase tracking-wider text-[var(--sage)]">
            {es ? 'Promedios' : 'Averages'}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-[var(--sage)] mb-1">
                {es ? 'Duración ciclo (d)' : 'Cycle length (d)'}
              </label>
              <input
                type="number"
                min={21}
                max={45}
                value={cycleLen}
                onChange={(e) => setCycleLen(Number(e.target.value))}
                className="input-soft py-2.5"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[var(--sage)] mb-1">
                {es ? 'Duración sangrado (d)' : 'Period length (d)'}
              </label>
              <input
                type="number"
                min={2}
                max={10}
                value={periodLen}
                onChange={(e) => setPeriodLen(Number(e.target.value))}
                className="input-soft py-2.5"
              />
            </div>
          </div>
          <button type="button" onClick={handleSaveSettings} className="btn-secondary w-full py-2.5 text-sm">
            {es ? 'Guardar promedios' : 'Save averages'}
          </button>
        </div>

        {snap.recentLogs.length > 0 && (
          <div className="border-t border-[var(--border-soft)] pt-3">
            <p className="text-[11px] text-[var(--sage)] mb-2">
              {es ? 'Últimos registros' : 'Recent logs'}
            </p>
            <ul className="space-y-1.5 max-h-32 overflow-y-auto">
              {snap.recentLogs.slice(0, 8).map((l: CycleDayLog) => (
                <li
                  key={l.date}
                  className="flex items-center justify-between text-[11px] text-[#D8E1D9]/85 px-2 py-1.5 rounded-lg bg-[#040404]/50"
                >
                  <span className="tabular-nums text-[var(--sage)]">{l.date}</span>
                  <span>{FLOW_LABELS[l.flow][es ? 'es' : 'en']}</span>
                  <span className="text-[var(--sage)]/80">
                    {l.symptoms?.length ? `${l.symptoms.length} sínt.` : '—'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {msg && (
          <p className="text-center text-xs text-[var(--accent)]">{msg}</p>
        )}
      </div>
    </section>
  );
}
