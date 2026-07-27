'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import BottomNav from '@/components/BottomNav';
import { loadProfile, getLifeStageLabel, saveProfile } from '@/lib/store/profile';
import { UserProfile, BiologicalSex } from '@/lib/types';
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
import PhoneSensorsPanel from '@/components/health/PhoneSensorsPanel';
import WearablesPanel from '@/components/health/WearablesPanel';
import CloudNativeSyncPanel from '@/components/health/CloudNativeSyncPanel';
import WomenHealthPanel from '@/components/health/WomenHealthPanel';
import BiomarkersPanel from '@/components/health/BiomarkersPanel';
import ClinicalRecordPanel from '@/components/health/ClinicalRecordPanel';

export default function HealthPage() {
  const [profile, setProfile] = useState<Partial<UserProfile> | null>(null);
  const [scores, setScores] = useState<ComputedScores | null>(null);
  const [coach, setCoach] = useState<CoachMessage | null>(null);
  const [actions, setActions] = useState<HealthActionDef[]>([]);
  const [loggedToday, setLoggedToday] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [healthRefreshKey, setHealthRefreshKey] = useState(0);

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
    // Defer so we don't sync-setState inside the effect body (React 19 lint).
    const id = requestAnimationFrame(() => refresh());
    return () => cancelAnimationFrame(id);
  }, [refresh]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const bumpHealthData = () => setHealthRefreshKey((k) => k + 1);

  const handleLog = (actionType: string, label: string) => {
    const result = logAction(actionType);
    if (result) {
      setScores(result);
      setLoggedToday(prev => new Set([...prev, actionType]));
      if (profile) setCoach(generateCoachGuidance(profile, result));
      showToast(`+${getHealthPointsPreview(actionType)} Health · ${label}`);
      bumpHealthData();
    }
  };

  const handleSetSex = (sex: BiologicalSex) => {
    saveProfile({ sex });
    const p = loadProfile();
    setProfile(p);
    bumpHealthData();
    showToast(
      sex === 'female'
        ? 'Perfil: salud femenina habilitada'
        : sex === 'male'
          ? 'Sexo biológico actualizado'
          : 'Sexo no especificado'
    );
  };

  const handleSaveSleep = () => {
    const entry = saveSleepEntry(bedTime, wakeTime);
    setTodaySleep(entry);
    setRegularity(getSleepRegularity());
    bumpHealthData();

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
    bumpHealthData();
    if (next.glasses >= next.goal && !loggedToday.has('hydration_daily')) {
      handleLog('hydration_daily', 'Hidratación diaria completada');
    }
  };

  if (!scores || !hydration || !nutrition) {
    return (
      <div className="min-h-screen bg-[#040404] flex items-center justify-center">
        <div className="text-[#8FD99A] animate-pulse">Cargando Health...</div>
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
      <header className="page-header px-5 pt-6 pb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link href="/hub/dashboard" className="back-btn" aria-label="Volver">
              ←
            </Link>
            <div className="w-9 h-9 rounded-full border border-[var(--border-soft)] flex items-center justify-center lion-glow overflow-hidden bg-[#040404] shrink-0">
              <Image src="/logo-icon.png" alt="Salvazion" width={36} height={36} className="object-cover" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-[var(--accent)] font-medium">
                Health
              </p>
              <h1 className="text-lg font-bold text-[var(--accent)] leading-tight">Hub</h1>
              <p className="text-[10px] text-[var(--sage)]/80 truncate">
                {profile?.name} · {stageLabel}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-[var(--accent)]">{healthScore}</p>
            <p className="text-[10px] text-[var(--sage)]/80">
              {healthStreak > 0 ? `${healthStreak}d · ×${healthMult.toFixed(2)}` : 'Score'}
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 pt-4 pb-32 overflow-y-auto">
        <div className="glass rounded-xl px-4 py-3 mb-5 flex items-start gap-3 border border-[var(--border-soft)]">
          <div className="w-9 h-9 rounded-full border border-[var(--border-strong)] flex items-center justify-center flex-shrink-0 lion-glow overflow-hidden bg-[#040404]">
            <Image src="/logo-icon.png" alt="León Verde" width={36} height={36} className="object-cover" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[#8FD99A] mb-0.5">León Verde</p>
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
              <circle cx="50" cy="50" r="42" fill="none" stroke="#6B8F6E" strokeWidth="6" opacity="0.25" />
              <circle
                cx="50" cy="50" r="42" fill="none" stroke="#8FD99A" strokeWidth="6"
                strokeDasharray={`${Math.min(healthScore, 100) * 2.64} 264`}
                strokeLinecap="round"
                className="ring-glow transition-all duration-700"
              />
            </svg>
            <div className="text-center z-10">
              <div className="text-2xl font-bold text-white">{healthScore}</div>
              <div className="text-[9px] text-[var(--sage)] uppercase">Health</div>
            </div>
          </div>
        </div>

        {/* BIOMARCADORES desde sensores + hábitos */}
        <BiomarkersPanel
          isFemale={profile?.sex === 'female'}
          lang={profile?.language === 'en' ? 'en' : 'es'}
          refreshKey={healthRefreshKey}
        />

        {/* PHONE SENSORS — steps, activity, GPS, rest/sleep */}
        <PhoneSensorsPanel
          loggedToday={loggedToday}
          onAutoLog={(actionType, label) => handleLog(actionType, label)}
          onSleepSynced={(bed, wake) => {
            setBedTime(bed);
            setWakeTime(wake);
            setTodaySleep(getTodaySleep());
            setRegularity(getSleepRegularity());
            bumpHealthData();
          }}
        />

        <WearablesPanel
          onAutoLog={(actionType, label) => handleLog(actionType, label)}
          onSleepSynced={(bed, wake) => {
            setBedTime(bed);
            setWakeTime(wake);
            setTodaySleep(getTodaySleep());
            setRegularity(getSleepRegularity());
            bumpHealthData();
          }}
        />

        <Suspense fallback={null}>
          <CloudNativeSyncPanel
            onAutoLog={(actionType, label) => handleLog(actionType, label)}
            onSleepSynced={(bed, wake) => {
              setBedTime(bed);
              setWakeTime(wake);
              setTodaySleep(getTodaySleep());
              setRegularity(getSleepRegularity());
              bumpHealthData();
            }}
          />
        </Suspense>

        {/* Sexo biológico — habilita salud femenina */}
        {profile?.sex !== 'female' && profile?.sex !== 'male' && (
          <section className="mb-6">
            <div className="glass rounded-2xl p-4 border border-[var(--border-soft)] space-y-3">
              <h2 className="text-sm font-semibold text-white">
                Personaliza Health
              </h2>
              <p className="text-[11px] text-[var(--sage)]/85 leading-relaxed">
                Indica tu sexo biológico para activar módulos de salud (p. ej. ciclo menstrual
                y biomarcadores adaptados). Se guarda en tu perfil.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSetSex('female')}
                  className="btn-secondary flex-1 py-2.5 text-sm"
                >
                  Mujer
                </button>
                <button
                  type="button"
                  onClick={() => handleSetSex('male')}
                  className="btn-secondary flex-1 py-2.5 text-sm"
                >
                  Hombre
                </button>
              </div>
            </div>
          </section>
        )}

        {/* SALUD FEMENINA — solo perfiles mujer */}
        {profile?.sex === 'female' && (
          <WomenHealthPanel
            lang={profile?.language === 'en' ? 'en' : 'es'}
            onLogged={() => {
              if (!loggedToday.has('cycle_log')) {
                handleLog('cycle_log', 'Registro de ciclo / salud femenina');
              } else {
                bumpHealthData();
                showToast('Ciclo actualizado');
              }
            }}
          />
        )}

        {/* Ficha clínica FHIR */}
        <ClinicalRecordPanel
          profile={profile}
          lang={profile?.language === 'en' ? 'en' : 'es'}
          refreshKey={healthRefreshKey}
        />

        {/* SUEÑO CIRCADIANO */}
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-[var(--sage)] mb-3 flex items-center gap-2">
            <span>🌙</span> Sueño circadiano
          </h2>
          <div className="glass rounded-2xl p-4 border border-[var(--border-soft)] space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-[var(--sage)] mb-1">Hora de dormir</label>
                <input
                  type="time"
                  value={bedTime}
                  onChange={e => setBedTime(e.target.value)}
                  className="input-soft py-2.5"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[var(--sage)] mb-1">Hora de despertar</label>
                <input
                  type="time"
                  value={wakeTime}
                  onChange={e => setWakeTime(e.target.value)}
                  className="input-soft py-2.5"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-[#D8E1D9]/70">
                Duración: <strong className="text-white">{durationH} h</strong>
                <span className="text-[var(--sage)]/80"> (ideal {ideal.min}–{ideal.max} h)</span>
              </span>
              <span className={sleepIdealNow ? 'text-[#8FD99A]' : 'text-amber-400/80'}>
                {sleepIdealNow ? '✓ Ventana ideal' : 'Fuera de ventana'}
              </span>
            </div>

            <div className="bg-[#040404]/60 rounded-xl px-3 py-2.5 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-[var(--sage)]">Regularidad (7 días)</p>
                <p className="text-sm text-white">
                  {regularity.samples < 2
                    ? 'Necesitas más registros'
                    : `±${regularity.avgDeviationMinutes} min · ${regularity.score}/100`}
                </p>
              </div>
              <p className="text-lg font-bold text-[#8FD99A]">{regularity.score || '—'}</p>
            </div>

            <button
              onClick={handleSaveSleep}
              className="btn-primary"
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
          <h2 className="text-sm font-semibold text-[var(--sage)] mb-3 flex items-center gap-2">
            <span>💧</span> Hidratación
          </h2>
          <div className="glass rounded-2xl p-4 border border-[var(--border-soft)]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-white font-medium">
                  {hydration.glasses} / {hydration.goal} vasos
                </p>
                <p className="text-[11px] text-[var(--sage)]/80">
                  ≈ {hydration.glasses * 250} ml · meta {hydration.goal * 250} ml
                </p>
              </div>
              {isHydrationComplete(stage) && (
                <span className="text-xs text-[#8FD99A] font-medium">✓ Meta</span>
              )}
            </div>

            <div className="h-2 rounded-full bg-[var(--surface-muted)] mb-4 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#7BC98A] transition-all duration-500"
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
                      ? 'bg-[#7BC98A]/20 border-[#8FD99A] text-[#8FD99A]'
                      : 'border-[var(--border-soft)] text-[var(--sage)]/60'
                  }`}
                >
                  💧
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleHydration(-1)}
                disabled={hydration.glasses <= 0}
                className="btn-secondary flex-1 py-2.5 text-sm"
              >
                −1
              </button>
              <button
                type="button"
                onClick={() => handleHydration(1)}
                className="btn-secondary flex-1 py-2.5 text-sm"
              >
                +1 vaso
              </button>
            </div>
          </div>
        </section>


        {/* ALIMENTACIÓN */}
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-[var(--sage)] mb-3 flex items-center gap-2">
            <span>🥗</span> Alimentación
          </h2>
          <div className="glass rounded-2xl p-4 border border-[var(--border-soft)] space-y-4">
            <p className="text-[11px] text-[var(--sage)]/80 leading-relaxed">
              Enfoque bio-conservador: comida real, ventana de alimentación y ayuno consciente.
              Las calorías son opcionales, no el centro.
            </p>

            {/* Resumen del día */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-[#040404]/60 rounded-xl py-2.5 px-1">
                <p className="text-lg font-bold text-white">{nutrition.meals.length}</p>
                <p className="text-[10px] text-[var(--sage)]/80">Comidas</p>
              </div>
              <div className="bg-[#040404]/60 rounded-xl py-2.5 px-1">
                <p className="text-lg font-bold text-white">
                  {nutrition.eatingWindowHours != null ? `${nutrition.eatingWindowHours}h` : '—'}
                </p>
                <p className="text-[10px] text-[var(--sage)]/80">Ventana</p>
              </div>
              <div className="bg-[#040404]/60 rounded-xl py-2.5 px-1">
                <p className="text-lg font-bold text-[#8FD99A]">
                  {totalEstimatedKcal(nutrition) > 0 ? totalEstimatedKcal(nutrition) : '—'}
                </p>
                <p className="text-[10px] text-[var(--sage)]/80">kcal est.</p>
              </div>
            </div>

            {nutrition.fastingHours != null && (
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-[#D8E1D9]/70">
                  Ayuno nocturno aprox: <strong className="text-white">{nutrition.fastingHours} h</strong>
                </span>
                {isFastingWindowGood(nutrition, stage) && (
                  <span className="text-[#8FD99A]">✓ Ventana saludable</span>
                )}
              </div>
            )}

            {/* Calidad */}
            {nutrition.meals.length > 0 && (
              <div className="flex gap-2 text-[11px]">
                <span className="text-[#8FD99A]">Real {qualitySummary(nutrition).whole}</span>
                <span className="text-[var(--sage)]">Mixta {qualitySummary(nutrition).mixed}</span>
                <span className="text-amber-400/70">Procesada {qualitySummary(nutrition).processed}</span>
              </div>
            )}

            {/* Lista de comidas */}
            {nutrition.meals.length > 0 && (
              <div className="space-y-1.5">
                {nutrition.meals.map((m, idx) => (
                  <div key={`${m.slot}-${m.time}-${idx}`} className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg bg-[#040404]/50">
                    <span>
                      <span className="text-[var(--sage)] mr-2">{m.time}</span>
                      {MEAL_SLOT_LABELS[m.slot]}
                      <span className="ml-2 text-[#D8E1D9]/50">
                        {m.quality === 'whole' ? '· real' : m.quality === 'mixed' ? '· mixta' : '· procesada'}
                      </span>
                      {m.estimatedKcal ? <span className="ml-1 text-[#8FD99A]/70">{m.estimatedKcal} kcal</span> : null}
                    </span>
                    <button
                      onClick={() => setNutrition(removeMeal(m.slot, m.time))}
                      className="text-[var(--sage)]/70 hover:text-red-400 text-[10px]"
                    >
                      quitar
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Formulario agregar comida */}
            <div className="border-t border-[var(--border-soft)] pt-3 space-y-3">
              <p className="text-[11px] text-[var(--sage)]">Registrar comida</p>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={mealSlot}
                  onChange={e => setMealSlot(e.target.value as MealSlot)}
                  className="bg-[#040404] border border-[var(--border-soft)] rounded-xl px-3 py-2.5 text-sm"
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
                  className="bg-[#040404] border border-[var(--border-soft)] rounded-xl px-3 py-2.5 text-sm"
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
                        ? 'border-[#8FD99A] text-[#8FD99A] bg-[var(--surface-active)]'
                        : 'border-[var(--border-soft)] text-[#D8E1D9]/50'
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
                  className="flex-1 bg-[#040404] border border-[var(--border-soft)] rounded-xl px-3 py-2.5 text-sm"
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
                  className="btn-sm px-4 py-2.5 text-sm"
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
            <h2 className="text-sm font-semibold text-[var(--sage)] flex items-center gap-2">
              <span>🏟️</span> Mis deportes
            </h2>
            <button
              onClick={() => setShowSportForm(!showSportForm)}
              className="text-[10px] px-2.5 py-1 rounded-lg border border-[var(--border-strong)] text-[#8FD99A]"
            >
              {showSportForm ? 'Cerrar' : '+ Deporte'}
            </button>
          </div>

          {showSportForm && (
            <div className="glass rounded-2xl p-4 mb-3 border border-[var(--border-strong)] space-y-3">
              <input
                type="text"
                placeholder="Nombre del deporte"
                value={sportName}
                onChange={e => setSportName(e.target.value)}
                className="w-full bg-[#040404] border border-[var(--border-soft)] rounded-xl px-3 py-2.5 text-sm"
              />
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_SPORTS.slice(0, 8).map(s => (
                  <button
                    key={s.name}
                    onClick={() => { setSportName(s.name); setSportEnv(s.environment); }}
                    className="text-[10px] px-2 py-1 rounded-full border border-[var(--border-soft)] text-[var(--sage)]"
                  >
                    {s.name}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <select
                  value={sportEnv}
                  onChange={e => setSportEnv(e.target.value as SportEnvironment)}
                  className="flex-1 bg-[#040404] border border-[var(--border-soft)] rounded-xl px-3 py-2.5 text-sm"
                >
                  <option value="outdoor">Outdoor</option>
                  <option value="indoor">Indoor</option>
                </select>
                <select
                  value={sportFreq}
                  onChange={e => setSportFreq(e.target.value as SportFrequency)}
                  className="flex-1 bg-[#040404] border border-[var(--border-soft)] rounded-xl px-3 py-2.5 text-sm"
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
                className="btn-primary py-2.5 text-sm"
              >
                Guardar deporte
              </button>
            </div>
          )}

          {sports.length === 0 && !showSportForm && (
            <p className="text-xs text-[var(--sage)]/70 mb-2">
              Añade los deportes que practicas (indoor o outdoor, diario o semanal).
            </p>
          )}

          <div className="space-y-2.5">
            {sports.map(sport => {
              const prog = sportProgress(sport);
              return (
                <div key={sport.id} className="glass rounded-xl p-4 border border-[var(--border-soft)]">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-white">{sport.name}</p>
                      <p className="text-[11px] text-[var(--sage)]/80 mt-0.5">
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
                        className="btn-sm"
                      >
                        Registrar sesión
                      </button>
                      <button
                        onClick={() => {
                          removeSport(sport.id);
                          setSports(loadSports());
                        }}
                        className="text-[10px] text-[var(--sage)]/60"
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
              <h2 className="text-sm font-semibold text-[var(--sage)] mb-3 flex items-center gap-2">
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
                        done ? 'border-[var(--border-strong)] bg-[var(--surface-active)]' : 'border-[var(--border-soft)]'
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
                          <p className="text-xs text-[#8FD99A] font-medium mb-1.5">+{pts}</p>
                          <button
                            onClick={() => !done && handleLog(action.actionType, action.label)}
                            disabled={done}
                            className="btn-sm"
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

        <p className="text-[10px] text-[var(--sage)]/60 text-center leading-relaxed px-2 mb-4">
          Fase B: sensores · Fase C: BLE/manual · Fase D: OAuth (Fitbit/Oura/WHOOP/Garmin) + HealthKit / Health Connect nativo.
        </p>
      </main>

      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 toast-soft">
          {toast}
        </div>
      )}

      <BottomNav variant="default" />
    </div>
  );
}
