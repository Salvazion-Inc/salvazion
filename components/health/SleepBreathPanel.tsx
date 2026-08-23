'use client';

import { useEffect, useState } from 'react';
import { tx3 } from '@/lib/i18n/locale';

type Phase = 'inhale' | 'hold' | 'exhale' | 'rest';

const CYCLE: { phase: Phase; seconds: number }[] = [
  { phase: 'inhale', seconds: 4 },
  { phase: 'hold', seconds: 7 },
  { phase: 'exhale', seconds: 8 },
];

type Props = {
  lang?: 'es' | 'en' | 'pt' | string;
};

/**
 * 4-7-8 wind-down for sleep — body as temple, not emptying of the mind.
 * Pioneer pattern: Oura/Huberman physiological downshift before rest.
 */
export default function SleepBreathPanel({ lang = 'en' }: Props) {
  const tx = (en: string, es: string, pt: string) => tx3(lang, en, es, pt);
  const [active, setActive] = useState(false);
  const [cycle, setCycle] = useState(0);
  const [step, setStep] = useState(0);
  const [left, setLeft] = useState(CYCLE[0].seconds);
  const totalCycles = 4;

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => {
      setLeft((s) => {
        if (s > 1) return s - 1;
        const nextStep = step + 1;
        if (nextStep >= CYCLE.length) {
          const nextCycle = cycle + 1;
          if (nextCycle >= totalCycles) {
            setActive(false);
            setCycle(0);
            setStep(0);
            return CYCLE[0].seconds;
          }
          setCycle(nextCycle);
          setStep(0);
          return CYCLE[0].seconds;
        }
        setStep(nextStep);
        return CYCLE[nextStep].seconds;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [active, step, cycle]);

  const phase = CYCLE[step].phase;
  const label =
    phase === 'inhale'
      ? tx('Inhale', 'Inhala', 'Inspire')
      : phase === 'hold'
        ? tx('Hold', 'Retén', 'Segure')
        : tx('Exhale', 'Exhala', 'Expire');

  const scale =
    phase === 'inhale' ? 1.18 : phase === 'hold' ? 1.18 : phase === 'exhale' ? 0.78 : 0.78;

  return (
    <section className="mb-6">
      <h2 className="text-sm font-semibold text-[var(--sage)] mb-3">
        {tx('Wind-down breath', 'Respiración para descansar', 'Respiração para descansar')}
      </h2>
      <div className="glass rounded-2xl p-4 border border-[var(--border-soft)]">
        <p className="text-[12px] text-[var(--sage)] leading-relaxed text-pretty">
          {tx(
            '4-7-8 downshift to fall asleep. It prepares the body God gave you — it does not replace prayer.',
            'Descenso 4-7-8 para dormir. Prepara el cuerpo que Dios te dio — no reemplaza la oración.',
            'Descida 4-7-8 para dormir. Prepara o corpo que Deus te deu — não substitui a oração.'
          )}
        </p>

        <div className="flex flex-col items-center py-5">
          <div
            className={`breath-orb ${active ? 'breath-orb-live' : ''}`}
            style={{ transform: active ? `scale(${scale})` : undefined }}
            aria-hidden
          />
          <p className="mt-4 font-display text-lg text-white">
            {active
              ? `${label} · ${left}s`
              : tx('4 cycles · 4-7-8', '4 ciclos · 4-7-8', '4 ciclos · 4-7-8')}
          </p>
          {active && (
            <p className="text-[11px] text-[var(--sage)] mt-1 tabular-nums">
              {tx('Cycle', 'Ciclo', 'Ciclo')} {cycle + 1}/{totalCycles}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            if (active) {
              setActive(false);
              setCycle(0);
              setStep(0);
              setLeft(CYCLE[0].seconds);
            } else {
              setCycle(0);
              setStep(0);
              setLeft(CYCLE[0].seconds);
              setActive(true);
            }
          }}
          className={active ? 'btn-outline-sm w-full py-2.5' : 'btn-primary py-2.5 text-sm'}
        >
          {active
            ? tx('Stop', 'Detener', 'Parar')
            : tx('Begin wind-down', 'Iniciar descenso', 'Iniciar descida')}
        </button>
      </div>
    </section>
  );
}
