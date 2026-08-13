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
import { pickLang, tx3 } from '@/lib/i18n/locale';

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
  lang?: 'es' | 'en' | 'pt';
  onLogged?: () => void;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function WomenHealthPanel({ lang = 'es', onLogged }: Props) {
  const tx = (en: string, es: string, pt: string) => tx3(lang, en, es, pt);
  const loc = (m: { en: string; es: string; pt: string }) => pickLang(lang, m);
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
    toast(tx('Cycle day saved', 'Día del ciclo guardado', 'Dia do ciclo salvo'));
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
    toast(tx('Period start logged', 'Inicio de periodo registrado', 'Início do período registrado'));
  };

  const handleSaveSettings = () => {
    saveCycleSettings({
      avgCycleLength: Math.min(45, Math.max(21, cycleLen)),
      avgPeriodLength: Math.min(10, Math.max(2, periodLen)),
    });
    refresh();
    toast(tx('Cycle settings updated', 'Ajustes del ciclo actualizados', 'Ajustes do ciclo atualizados'));
  };

  if (!snap) {
    return (
      <section className="mb-6">
        <div className="glass rounded-2xl p-4 border border-[var(--border-soft)] animate-pulse h-40" />
      </section>
    );
  }

  const phaseLabel = loc(PHASE_LABELS[snap.phase]);

  return (
    <section className="mb-6">
      <h2 className="text-sm font-semibold text-[var(--sage)] mb-3 flex items-center gap-2">
        <span>♀</span>
        {tx('Women’s health · Cycle', 'Salud femenina · Ciclo', 'Saúde feminina · Ciclo')}
      </h2>

      <div className="glass rounded-2xl p-4 border border-[var(--border-soft)] space-y-4">
        <p className="text-[11px] text-[var(--sage)]/80 leading-relaxed">
          {tx(
            'Private on-device log. Body stewardship — not a medical diagnosis.',
            'Registro privado en tu dispositivo. Úsalo para mayordomía del cuerpo, no como diagnóstico médico.',
            'Registro privado no seu dispositivo. Use para mordomia do corpo, não como diagnóstico médico.'
          )}
        </p>

        {/* Phase summary */}
        <div className="rounded-xl border border-[var(--border-soft)] bg-[#040404]/55 px-3.5 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--accent)]">
                {tx('Current phase', 'Fase actual', 'Fase atual')}
              </p>
              <p className="text-lg font-semibold text-white mt-0.5">{phaseLabel}</p>
              <p className="text-xs text-[var(--sage)] mt-0.5">
                {snap.dayInCycle != null
                  ? tx(
                      `Day ${snap.dayInCycle} of cycle (~${snap.cycleLength} d)`,
                      `Día ${snap.dayInCycle} del ciclo (~${snap.cycleLength} d)`,
                      `Dia ${snap.dayInCycle} do ciclo (~${snap.cycleLength} d)`
                    )
                  : tx(
                      'Log your period start',
                      'Registra el inicio de tu periodo',
                      'Registre o início do período'
                    )}
              </p>
            </div>
            <div className="text-right text-[11px] text-[var(--sage)] space-y-1">
              {snap.nextPeriodEstimate && (
                <p>
                  {tx('Next period', 'Próx. periodo', 'Próx. período')}
                  <br />
                  <span className="text-white tabular-nums">{snap.nextPeriodEstimate}</span>
                </p>
              )}
              {snap.ovulationEstimate && (
                <p>
                  {tx('Est. ovulation', 'Ovulación est.', 'Ovulação est.')}
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
              {tx('Date', 'Fecha', 'Data')}
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
              {tx('Flow', 'Flujo', 'Fluxo')}
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
                  {loc(FLOW_LABELS[f])}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] text-[var(--sage)] mb-1.5">
              {tx('Symptoms', 'Síntomas', 'Sintomas')}
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
                    {loc(SYMPTOM_LABELS[s])}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-[var(--sage)] mb-1">
              {tx('Notes', 'Notas', 'Notas')}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder={tx('Optional…', 'Opcional…', 'Opcional…')}
              className="input-soft py-2.5 resize-none text-sm"
            />
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={handleSaveDay} className="btn-primary flex-1 py-2.5 text-sm">
              {tx('Save day', 'Guardar día', 'Salvar dia')}
            </button>
            <button
              type="button"
              onClick={handlePeriodStart}
              className="btn-secondary flex-1 py-2.5 text-sm"
            >
              {tx('Period start', 'Inicio de periodo', 'Início do período')}
            </button>
          </div>
        </div>

        {/* Settings */}
        <div className="border-t border-[var(--border-soft)] pt-3 space-y-3">
          <p className="text-[11px] uppercase tracking-wider text-[var(--sage)]">
            {tx('Averages', 'Promedios', 'Médias')}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-[var(--sage)] mb-1">
                {tx('Cycle length (d)', 'Duración ciclo (d)', 'Duração do ciclo (d)')}
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
                {tx('Period length (d)', 'Duración sangrado (d)', 'Duração do sangramento (d)')}
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
            {tx('Save averages', 'Guardar promedios', 'Salvar médias')}
          </button>
        </div>

        {snap.recentLogs.length > 0 && (
          <div className="border-t border-[var(--border-soft)] pt-3">
            <p className="text-[11px] text-[var(--sage)] mb-2">
              {tx('Recent logs', 'Últimos registros', 'Últimos registros')}
            </p>
            <ul className="space-y-1.5 max-h-32 overflow-y-auto">
              {snap.recentLogs.slice(0, 8).map((l: CycleDayLog) => (
                <li
                  key={l.date}
                  className="flex items-center justify-between text-[11px] text-[#D8E1D9]/85 px-2 py-1.5 rounded-lg bg-[#040404]/50"
                >
                  <span className="tabular-nums text-[var(--sage)]">{l.date}</span>
                  <span>{loc(FLOW_LABELS[l.flow])}</span>
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
