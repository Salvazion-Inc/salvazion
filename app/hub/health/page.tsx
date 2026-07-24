'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { loadProfile, getLifeStageLabel } from '@/lib/store/profile';
import { UserProfile } from '@/lib/types';
import { computeScores, logAction } from '@/lib/scoring/engine';
import { ComputedScores } from '@/lib/scoring/types';
import {
  getHealthActionsForStage,
  getCurrentHealthStage,
  getHealthPointsPreview,
  HealthActionDef
} from '@/lib/health/engine';
import {
  loadSports,
  addSport,
  removeSport,
  logSportSession,
  sportProgress,
  SUGGESTED_SPORTS,
  UserSport,
  SportEnvironment,
  SportFrequency
} from '@/lib/health/sports';
import {
  saveSleepEntry,
  getTodaySleep,
  calcSleepDuration,
  isSleepIdeal,
  getSleepRegularity,
  getTodayHydration,
  setHydrationGlasses,
  isHydrationComplete,
  idealSleepHours,
  SleepEntry,
  HydrationEntry,
  getTodayNutrition,
  addMeal,
  removeMeal,
  isFastingWindowGood,
  totalEstimatedKcal,
  qualitySummary,
  MEAL_SLOT_LABELS,
  NutritionEntry,
  MealSlot,
  MealLog
} from '@/lib/health/biomarkers';
import { generateCoachGuidance, CoachMessage, getLionShortNudge } from '@/lib/coach/engine';

export default function HealthPage() {
  const [profile, setProfile] = useState<Partial<UserProfile> | null>(null);
  const [scores, setScores] = useState<ComputedScores | null>(null);
  const [coach, setCoach] = useState<CoachMessage | null>(null);
  const [actions, setActions] = useState<HealthActionDef[]>([]);
  const [loggedToday, setLoggedToday] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [bedTime, setBedTime] = useState('22:30');
  const [wakeTime, setWakeTime] = useState('06:30');
  const [todaySleep, setTodaySleep] = useState<SleepEntry | null>(null);
  const [hydration, setHydration] = useState<HydrationEntry | null>(null);
  const [regularity, setRegularity] = useState({ samples: 0, avgWakeMinutes: null as number | null, avgDeviationMinutes: null as number | null, score: 0 });
  const [nutrition, setNutrition] = useState<NutritionEntry | null>(null);
  const [mealSlot, setMealSlot] = useState<MealSlot>('lunch');
  const [mealTime, setMealTime] = useState('13:00');
  const [mealQuality, setMealQuality] = useState<'whole' | 'mixed' | 'processed'>('whole');
  const [mealKcal, setMealKcal] = useState('');
  const [sports, setSports] = useState<UserSport[]>([]);
  const [showSportForm, setShowSportForm] = useState(false);
  const [sportName, setSportName] = useState('');
  const [sportEnv, setSportEnv] = useState<SportEnvironment>('outdoor');
  const [sportFreq, setSportFreq] = useState<SportFrequency>('weekly');

  const stage = getCurrentHealthStage();
  const stageLabel = getLifeStageLabel(stage);

  const refresh = useCallback(() => {
    const s = computeScores();
    setScores(s);
    const p = loadProfile();
    setProfile(p);
    setActions(getHealthActionsForStage(stage));
    if (p) setCoach(generateCoachGuidance(p, s));

    const todayTypes = new Set(
      s.todayActions.filter(a => a.pillar === 'health').map(a => a.type)
    );
    setLoggedToday(todayTypes);

    const sleep = getTodaySleep();
    setTodaySleep(sleep);
    if (sleep) {
      setBedTime(sleep.bedTime);
      setWakeTime(sleep.wakeTime);
    }
    setHydration(getTodayHydration(stage));
    setRegularity(getSleepRegularity());
    setNutrition(getTodayNutrition());
    setSports(loadSports());
  }, [stage]);

  useEffect(() => {
    setMounted(true);
    refresh();
  }, [refresh]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleLog = (actionType: string, label: string) => {
    const result = logAction(actionType);
    if (result) {
      setScores(result);
      setLoggedToday(prev => new Set([...prev, actionType]));
      if (profile) setCoach(generateCoachGuidance(profile, result));
      showToast(`+${getHealthPointsPreview(actionType)} Health · ${label}`);
    }
  };

  const handleSaveSleep = () => {
    const entry = saveSleepEntry(bedTime, wakeTime);
    setTodaySleep(entry);
    setRegularity(getSleepRegularity());

    if (isSleepIdeal(bedTime, wakeTime, stage) && !loggedToday.has('sleep_ideal')) {
      handleLog('sleep_ideal', 'Sueño circadiano ideal');
    } else if (!isSleepIdeal(bedTime, wakeTime, stage)) {
      showToast('Sueño registrado (fuera de ventana ideal)');
    } else {
      showToast('Sueño actualizado');
    }
  };

  const handleHydration = (delta: number) => {
    if (!hydration) return;
    const next = setHydrationGlasses(hydration.glasses + delta, stage);
    setHydration(next);
    if (next.glasses >= next.goal && !loggedToday.has('hydration_daily')) {
      handleLog('hydration_daily', 'Hidratación diaria completada');
    }
  };

  if (!mounted || !scores || !hydration || !nutrition) {
    return (
      <div className="min-h-screen bg-[#040404] flex items-center justify-center">
        <div className="text-[#00F511] animate-pulse">Cargando Health...</div>
      </div>
    );
  }

  const healthScore = scores.health;
  const healthStreak = scores.streaks.health;
  const healthMult = scores.multipliers.health;
  const ideal = idealSleepHours(stage);
  const durationH = todaySleep
    ? (todaySleep.durationMinutes / 60).toFixed(1)
    : (calcSleepDuration(bedTime, wakeTime) / 60).toFixed(1);
  const sleepIdealNow = isSleepIdeal(bedTime, wakeTime, stage);

  const categories = [
    { id: 'exercise', title: 'Ejercicio y sol', icon: '⚡' },
    { id: 'nutrition', title: 'Alimentación', icon: '🥗' },
    { id: 'sleep', title: 'Sueño', icon: '🌙' }
  ] as const;

  return (
    <div className="min-h-screen bg-[#040404] text-[#D8E1D9] flex flex-col">
      <header className="px-5 pt-6 pb-3 border-b border-[#00B10C]/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Link href="/hub/dashboard" className="text-[#B7F7AC]/60 text-sm">←</Link>
            <div className="w-8 h-8 rounded-full border border-[#00F511]/40 flex items-center justify-center lion-glow">
              <span className="text-sm">🦁</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#00F511]">Health</h1>
              <p className="text-[10px] text-[#B7F7AC]/50">
                {profile?.name} · {stageLabel}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-[#00F511]">{healthScore}</p>
            <p className="text-[10px] text-[#B7F7AC]/50">
              {healthStreak > 0 ? `${healthStreak}d · ×${healthMult.toFixed(2)}` : 'Score'}
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 pt-4 pb-32 overflow-y-auto">
        <div className="glass rounded-xl px-4 py-3 mb-5 flex items-start gap-3 border border-[#00F511]/20">
          <span className="text-lg">🦁</span>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[#00F511] mb-0.5">León Verde</p>
            <p className="text-xs text-[#D8E1D9]/80 leading-relaxed">
              {coach?.pillarFocus === 'health' && coach.body
                ? coach.body
                : getLionShortNudge('health', stage)}
            </p>
          </div>
        </div>

        <div className="flex justify-center mb-6">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#00B10C" strokeWidth="6" opacity="0.25" />
              <circle
                cx="50" cy="50" r="42" fill="none" stroke="#00F511" strokeWidth="6"
                strokeDasharray={`${Math.min(healthScore, 100) * 2.64} 264`}
                strokeLinecap="round"
                className="ring-glow transition-all duration-700"
              />
            </svg>
            <div className="text-center z-10">
              <div className="text-2xl font-bold text-white">{healthScore}</div>
              <div className="text-[9px] text-[#B7F7AC]/60 uppercase">Health</div>
            </div>
          </div>
        </div>

        {/* SUEÑO CIRCADIANO */}
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-[#B7F7AC] mb-3 flex items-center gap-2">
            <span>🌙</span> Sueño circadiano
          </h2>
          <div className="glass rounded-2xl p-4 border border-[#00B10C]/25 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-[#B7F7AC]/60 mb-1">Hora de dormir</label>
                <input
                  type="time"
                  value={bedTime}
                  onChange={e => setBedTime(e.target.value)}
                  className="w-full bg-[#040404] border border-[#00B10C]/40 rounded-xl px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#B7F7AC]/60 mb-1">Hora de despertar</label>
                <input
                  type="time"
                  value={wakeTime}
                  onChange={e => setWakeTime(e.target.value)}
                  className="w-full bg-[#040404] border border-[#00B10C]/40 rounded-xl px-3 py-2.5 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-[#D8E1D9]/70">
                Duración: <strong className="text-white">{durationH} h</strong>
                <span className="text-[#B7F7AC]/50"> (ideal {ideal.min}–{ideal.max} h)</span>
              </span>
              <span className={sleepIdealNow ? 'text-[#00F511]' : 'text-amber-400/80'}>
                {sleepIdealNow ? '✓ Ventana ideal' : 'Fuera de ventana'}
              </span>
            </div>

            <div className="bg-[#040404]/60 rounded-xl px-3 py-2.5 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-[#B7F7AC]/60">Regularidad (7 días)</p>
                <p className="text-sm text-white">
                  {regularity.samples < 2
                    ? 'Necesitas más registros'
                    : `±${regularity.avgDeviationMinutes} min · ${regularity.score}/100`}
                </p>
              </div>
              <p className="text-lg font-bold text-[#00F511]">{regularity.score || '—'}</p>
            </div>

            <button
              onClick={handleSaveSleep}
              className="w-full py-3 rounded-xl bg-[#00F511] text-[#040404] font-semibold text-sm hover:bg-[#B7F7AC] transition-all"
            >
              {todaySleep ? 'Actualizar sueño' : 'Registrar sueño'}
              {sleepIdealNow && !loggedToday.has('sleep_ideal') ? (
                <span className="ml-1">· +{getHealthPointsPreview('sleep_ideal')}</span>
              ) : null}
            </button>
          </div>
        </section>

        {/* HIDRATACIÓN */}
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-[#B7F7AC] mb-3 flex items-center gap-2">
            <span>💧</span> Hidratación
          </h2>
          <div className="glass rounded-2xl p-4 border border-[#00B10C]/25">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-white font-medium">
                  {hydration.glasses} / {hydration.goal} vasos
                </p>
                <p className="text-[11px] text-[#B7F7AC]/50">
                  ≈ {hydration.glasses * 250} ml · meta {hydration.goal * 250} ml
                </p>
              </div>
              {isHydrationComplete(stage) && (
                <span className="text-xs text-[#00F511] font-medium">✓ Meta</span>
              )}
            </div>

            <div className="h-2 rounded-full bg-[#00B10C]/20 mb-4 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#00F511] transition-all duration-500"
                style={{ width: `${Math.min(100, (hydration.glasses / hydration.goal) * 100)}%` }}
              />
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {Array.from({ length: hydration.goal }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    const target = i + 1;
                    const next = setHydrationGlasses(
                      hydration.glasses === target ? target - 1 : target,
                      stage
                    );
                    setHydration(next);
                    if (next.glasses >= next.goal && !loggedToday.has('hydration_daily')) {
                      handleLog('hydration_daily', 'Hidratación diaria completada');
                    }
                  }}
                  className={`w-8 h-8 rounded-lg border text-sm flex items-center justify-center transition-all ${
                    i < hydration.glasses
                      ? 'bg-[#00F511]/20 border-[#00F511] text-[#00F511]'
                      : 'border-[#00B10C]/30 text-[#B7F7AC]/30'
                  }`}
                >
                  💧
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleHydration(-1)}
                disabled={hydration.glasses <= 0}
                className="flex-1 py-2.5 rounded-xl border border-[#00B10C]/40 text-sm disabled:opacity-30"
              >
                −1
              </button>
              <button
                onClick={() => handleHydration(1)}
                className="flex-1 py-2.5 rounded-xl bg-[#00F511]/15 border border-[#00F511]/40 text-[#00F511] text-sm font-medium"
              >
                +1 vaso
              </button>
            </div>
          </div>
        </section>


        {/* ALIMENTACIÓN */}
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-[#B7F7AC] mb-3 flex items-center gap-2">
            <span>🥗</span> Alimentación
          </h2>
          <div className="glass rounded-2xl p-4 border border-[#00B10C]/25 space-y-4">
            <p className="text-[11px] text-[#B7F7AC]/50 leading-relaxed">
              Enfoque bio-conservador: comida real, ventana de alimentación y ayuno consciente.
              Las calorías son opcionales, no el centro.
            </p>

            {/* Resumen del día */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-[#040404]/60 rounded-xl py-2.5 px-1">
                <p className="text-lg font-bold text-white">{nutrition.meals.length}</p>
                <p className="text-[10px] text-[#B7F7AC]/50">Comidas</p>
              </div>
              <div className="bg-[#040404]/60 rounded-xl py-2.5 px-1">
                <p className="text-lg font-bold text-white">
                  {nutrition.eatingWindowHours != null ? `${nutrition.eatingWindowHours}h` : '—'}
                </p>
                <p className="text-[10px] text-[#B7F7AC]/50">Ventana</p>
              </div>
              <div className="bg-[#040404]/60 rounded-xl py-2.5 px-1">
                <p className="text-lg font-bold text-[#00F511]">
                  {totalEstimatedKcal(nutrition) > 0 ? totalEstimatedKcal(nutrition) : '—'}
                </p>
                <p className="text-[10px] text-[#B7F7AC]/50">kcal est.</p>
              </div>
            </div>

            {nutrition.fastingHours != null && (
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-[#D8E1D9]/70">
                  Ayuno nocturno aprox: <strong className="text-white">{nutrition.fastingHours} h</strong>
                </span>
                {isFastingWindowGood(nutrition, stage) && (
                  <span className="text-[#00F511]">✓ Ventana saludable</span>
                )}
              </div>
            )}

            {/* Calidad */}
            {nutrition.meals.length > 0 && (
              <div className="flex gap-2 text-[11px]">
                <span className="text-[#00F511]">Real {qualitySummary(nutrition).whole}</span>
                <span className="text-[#B7F7AC]/60">Mixta {qualitySummary(nutrition).mixed}</span>
                <span className="text-amber-400/70">Procesada {qualitySummary(nutrition).processed}</span>
              </div>
            )}

            {/* Lista de comidas */}
            {nutrition.meals.length > 0 && (
              <div className="space-y-1.5">
                {nutrition.meals.map((m, idx) => (
                  <div key={`${m.slot}-${m.time}-${idx}`} className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg bg-[#040404]/50">
                    <span>
                      <span className="text-[#B7F7AC]/60 mr-2">{m.time}</span>
                      {MEAL_SLOT_LABELS[m.slot]}
                      <span className="ml-2 text-[#D8E1D9]/50">
                        {m.quality === 'whole' ? '· real' : m.quality === 'mixed' ? '· mixta' : '· procesada'}
                      </span>
                      {m.estimatedKcal ? <span className="ml-1 text-[#00F511]/70">{m.estimatedKcal} kcal</span> : null}
                    </span>
                    <button
                      onClick={() => setNutrition(removeMeal(m.slot, m.time))}
                      className="text-[#B7F7AC]/40 hover:text-red-400 text-[10px]"
                    >
                      quitar
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Formulario agregar comida */}
            <div className="border-t border-[#00B10C]/20 pt-3 space-y-3">
              <p className="text-[11px] text-[#B7F7AC]/60">Registrar comida</p>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={mealSlot}
                  onChange={e => setMealSlot(e.target.value as MealSlot)}
                  className="bg-[#040404] border border-[#00B10C]/40 rounded-xl px-3 py-2.5 text-sm"
                >
                  <option value="breakfast">Desayuno</option>
                  <option value="lunch">Almuerzo</option>
                  <option value="dinner">Cena</option>
                  <option value="snack">Snack</option>
                </select>
                <input
                  type="time"
                  value={mealTime}
                  onChange={e => setMealTime(e.target.value)}
                  className="bg-[#040404] border border-[#00B10C]/40 rounded-xl px-3 py-2.5 text-sm"
                />
              </div>

              <div className="flex gap-2">
                {([
                  { id: 'whole' as const, label: 'Comida real' },
                  { id: 'mixed' as const, label: 'Mixta' },
                  { id: 'processed' as const, label: 'Ultraprocesada' }
                ]).map(q => (
                  <button
                    key={q.id}
                    onClick={() => setMealQuality(q.id)}
                    className={`flex-1 py-2 rounded-lg text-[11px] border transition-all ${
                      mealQuality === q.id
                        ? 'border-[#00F511] text-[#00F511] bg-[#00F511]/10'
                        : 'border-[#00B10C]/30 text-[#D8E1D9]/50'
                    }`}
                  >
                    {q.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="kcal (opcional)"
                  value={mealKcal}
                  onChange={e => setMealKcal(e.target.value)}
                  className="flex-1 bg-[#040404] border border-[#00B10C]/40 rounded-xl px-3 py-2.5 text-sm"
                />
                <button
                  onClick={() => {
                    const meal: MealLog = {
                      slot: mealSlot,
                      time: mealTime,
                      quality: mealQuality,
                      estimatedKcal: mealKcal ? Number(mealKcal) : undefined
                    };
                    const entry = addMeal(meal);
                    setNutrition(entry);
                    setMealKcal('');

                    // Si ventana de ayuno saludable y aún no registró fasting hoy
                    if (isFastingWindowGood(entry, stage) && !loggedToday.has('fasting')) {
                      handleLog('fasting', 'Ayuno / ventana de comida saludable');
                    } else {
                      showToast('Comida registrada');
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#00F511] text-[#040404] text-sm font-semibold"
                >
                  Añadir
                </button>
              </div>
            </div>
          </div>
        </section>


        {/* DEPORTES */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#B7F7AC] flex items-center gap-2">
              <span>🏟️</span> Mis deportes
            </h2>
            <button
              onClick={() => setShowSportForm(!showSportForm)}
              className="text-[10px] px-2.5 py-1 rounded-lg border border-[#00F511]/40 text-[#00F511]"
            >
              {showSportForm ? 'Cerrar' : '+ Deporte'}
            </button>
          </div>

          {showSportForm && (
            <div className="glass rounded-2xl p-4 mb-3 border border-[#00F511]/30 space-y-3">
              <input
                type="text"
                placeholder="Nombre del deporte"
                value={sportName}
                onChange={e => setSportName(e.target.value)}
                className="w-full bg-[#040404] border border-[#00B10C]/40 rounded-xl px-3 py-2.5 text-sm"
              />
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_SPORTS.slice(0, 8).map(s => (
                  <button
                    key={s.name}
                    onClick={() => { setSportName(s.name); setSportEnv(s.environment); }}
                    className="text-[10px] px-2 py-1 rounded-full border border-[#00B10C]/30 text-[#B7F7AC]/70"
                  >
                    {s.name}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <select
                  value={sportEnv}
                  onChange={e => setSportEnv(e.target.value as SportEnvironment)}
                  className="flex-1 bg-[#040404] border border-[#00B10C]/40 rounded-xl px-3 py-2.5 text-sm"
                >
                  <option value="outdoor">Outdoor</option>
                  <option value="indoor">Indoor</option>
                </select>
                <select
                  value={sportFreq}
                  onChange={e => setSportFreq(e.target.value as SportFrequency)}
                  className="flex-1 bg-[#040404] border border-[#00B10C]/40 rounded-xl px-3 py-2.5 text-sm"
                >
                  <option value="daily">Diario</option>
                  <option value="weekly">Semanal</option>
                </select>
              </div>
              <button
                onClick={() => {
                  if (!sportName.trim()) return;
                  addSport(sportName, sportEnv, sportFreq, sportFreq === 'daily' ? 1 : 3);
                  setSports(loadSports());
                  setSportName('');
                  setShowSportForm(false);
                  showToast('Deporte añadido');
                }}
                className="w-full py-2.5 rounded-xl bg-[#00F511] text-[#040404] text-sm font-semibold"
              >
                Guardar deporte
              </button>
            </div>
          )}

          {sports.length === 0 && !showSportForm && (
            <p className="text-xs text-[#B7F7AC]/40 mb-2">
              Añade los deportes que practicas (indoor o outdoor, diario o semanal).
            </p>
          )}

          <div className="space-y-2.5">
            {sports.map(sport => {
              const prog = sportProgress(sport);
              return (
                <div key={sport.id} className="glass rounded-xl p-4 border border-[#00B10C]/25">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-white">{sport.name}</p>
                      <p className="text-[11px] text-[#B7F7AC]/50 mt-0.5">
                        {sport.environment === 'outdoor' ? 'Outdoor' : 'Indoor'} ·{' '}
                        {sport.frequency === 'daily' ? 'Diario' : `Semanal (meta ${sport.targetSessions})`}
                      </p>
                      <p className="text-[11px] text-[#D8E1D9]/60 mt-1">
                        Progreso: {prog.done}/{prog.target} {prog.complete ? '✓' : ''}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1.5 items-end">
                      <button
                        onClick={() => {
                          logSportSession(sport, 30);
                          // Suma puntos health según entorno
                          if (sport.environment === 'outdoor') {
                            handleLog('outdoor_sun_20min', `${sport.name} outdoor`);
                          } else {
                            handleLog('hit_15min', `${sport.name} indoor`);
                          }
                          setSports(loadSports());
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#00F511] text-[#040404] text-xs font-medium"
                      >
                        Registrar sesión
                      </button>
                      <button
                        onClick={() => {
                          removeSport(sport.id);
                          setSports(loadSports());
                        }}
                        className="text-[10px] text-[#B7F7AC]/30"
                      >
                        quitar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Otras acciones */}
        {categories.map(cat => {
          const items = actions.filter(a => a.category === cat.id);
          const filtered = items.filter(
            a => a.actionType !== 'sleep_ideal' && a.actionType !== 'hydration_daily' && a.actionType !== 'fasting'
          );
          if (filtered.length === 0) return null;
          return (
            <div key={cat.id} className="mb-6">
              <h2 className="text-sm font-semibold text-[#B7F7AC] mb-3 flex items-center gap-2">
                <span>{cat.icon}</span> {cat.title}
              </h2>
              <div className="space-y-2.5">
                {filtered.map(action => {
                  const pts = getHealthPointsPreview(action.actionType);
                  const done = loggedToday.has(action.actionType);
                  return (
                    <div
                      key={action.id}
                      className={`glass rounded-xl p-4 border transition-all ${
                        done ? 'border-[#00F511]/40 bg-[#00F511]/5' : 'border-[#00B10C]/25'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <span className="text-xl flex-shrink-0">{action.icon}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white">{action.label}</p>
                            <p className="text-xs text-[#D8E1D9]/60 mt-0.5">{action.description}</p>
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-xs text-[#00F511] font-medium mb-1.5">+{pts}</p>
                          <button
                            onClick={() => !done && handleLog(action.actionType, action.label)}
                            disabled={done}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              done
                                ? 'bg-[#00B10C]/20 text-[#B7F7AC]'
                                : 'bg-[#00F511] text-[#040404] hover:bg-[#B7F7AC]'
                            }`}
                          >
                            {done ? '✓ Hecho' : 'Registrar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <p className="text-[10px] text-[#B7F7AC]/30 text-center leading-relaxed px-2 mb-4">
          Fase A: sueño + hidratación. En nativo se conectarán sensores y wearables (Fase B/C).
        </p>
      </main>

      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#00F511] text-[#040404] text-sm font-semibold shadow-lg">
          {toast}
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-[#040404]/95 border-t border-[#00B10C]/25 backdrop-blur-md px-6 py-3">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <NavItem href="/hub/dashboard" label="Home" icon="🏠" />
          <NavItem href="/hub/bible" label="Bible" icon="📖" />
          <NavItem href="/hub/health" label="Health" icon="⚡" active />
          <NavItem href="/hub/devotional" label="Devocional" icon="✝️" />
          <NavItem href="/hub/profile" label="Profile" icon="👤" />
        </div>
      </nav>
    </div>
  );
}

function NavItem({ href, label, icon, active }: { href: string; label: string; icon: string; active?: boolean }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-0.5">
      <span className={`text-xl ${active ? 'opacity-100' : 'opacity-50'}`}>{icon}</span>
      <span className={`text-[10px] ${active ? 'text-[#00F511]' : 'text-[#B7F7AC]/50'}`}>{label}</span>
    </Link>
  );
}
