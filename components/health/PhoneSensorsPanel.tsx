'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DaySensorIndicators,
  LiveSensorSession,
  SensorCapabilities,
  detectSensorCapabilities,
  endRestMode,
  evaluateSensorScoreHints,
  formatIndicators,
  getPhoneSensorTracker,
  hasAutoLogged,
  loadActiveRest,
  loadDayIndicators,
  markAutoLogged,
  requestGeolocationPermission,
  requestMotionPermission,
  startRestMode,
  type ActiveRestState,
  type FinishedSensorSession,
} from '@/lib/health/phone-sensors';
import { idealSleepHours, saveSleepEntry } from '@/lib/health/biomarkers';
import { getCurrentHealthStage } from '@/lib/health/engine';
import { useI18n } from '@/components/I18nProvider';

interface Props {
  /** Called when user should receive points for a health action */
  onAutoLog: (actionType: string, label: string) => void;
  /** Refresh parent biomarkers (sleep form etc.) */
  onSleepSynced?: (bedTime: string, wakeTime: string) => void;
  loggedToday: Set<string>;
}

export default function PhoneSensorsPanel({
  onAutoLog,
  onSleepSynced,
  loggedToday,
}: Props) {
  const { t, lang } = useI18n();
  const [caps, setCaps] = useState<SensorCapabilities | null>(null);
  const [day, setDay] = useState<DaySensorIndicators | null>(null);
  const [live, setLive] = useState<LiveSensorSession | null>(null);
  const [rest, setRest] = useState<ActiveRestState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const refreshDay = useCallback(() => {
    setDay(loadDayIndicators());
    setRest(loadActiveRest());
  }, []);

  useEffect(() => {
    setCaps(detectSensorCapabilities());
    refreshDay();
    const tracker = getPhoneSensorTracker();
    setLive(tracker.current);
    const unsub = tracker.subscribe((s) => setLive(s));
    return () => {
      unsub();
    };
  }, [refreshDay]);

  const stage = getCurrentHealthStage();
  const ideal = idealSleepHours(stage);
  const hints = useMemo(
    () => (day ? evaluateSensorScoreHints(day, ideal) : null),
    [day, ideal]
  );
  const fmt = day ? formatIndicators(day) : null;

  const tryAutoLog = useCallback(
    (actionType: string, label: string) => {
      if (loggedToday.has(actionType) || hasAutoLogged(actionType)) return false;
      markAutoLogged(actionType);
      onAutoLog(actionType, label);
      return true;
    },
    [loggedToday, onAutoLog]
  );

  const applySessionRewards = useCallback(
    (finished: FinishedSensorSession | null, nextDay: DaySensorIndicators) => {
      if (!finished) return;
      const h = evaluateSensorScoreHints(nextDay, ideal);

      if (
        (finished.kind === 'activity' || finished.kind === 'steps') &&
        h.canLogHit
      ) {
        if (
          tryAutoLog(
            'hit_15min',
            lang === 'en'
              ? 'Phone activity ≥ 15 min'
              : lang === 'pt'
                ? 'Atividade do celular ≥ 15 min'
                : 'Actividad del celular ≥ 15 min'
          )
        ) {
          setNote(
            lang === 'en'
              ? 'Logged HIT / training from phone sensors'
              : 'Registrado HIT / entrenamiento desde sensores'
          );
        }
      }

      if (finished.kind === 'outdoor' && h.canLogOutdoor) {
        if (
          tryAutoLog(
            'outdoor_sun_20min',
            lang === 'en'
              ? 'Outdoor walk (GPS)'
              : lang === 'pt'
                ? 'Caminhada ao ar livre (GPS)'
                : 'Caminata exterior (GPS)'
          )
        ) {
          setNote(
            lang === 'en'
              ? 'Logged outdoor + sun from GPS'
              : 'Registrado aire libre + sol desde GPS'
          );
        }
      }

      if (finished.kind === 'rest' && finished.bedTime && finished.wakeTime) {
        saveSleepEntry(finished.bedTime, finished.wakeTime);
        onSleepSynced?.(finished.bedTime, finished.wakeTime);
        if (h.canLogSleep) {
          if (
            tryAutoLog(
              'sleep_ideal',
              lang === 'en'
                ? 'Sleep from rest mode'
                : lang === 'pt'
                  ? 'Sono a partir do modo repouso'
                  : 'Sueño desde modo reposo'
            )
          ) {
            setNote(
              lang === 'en'
                ? 'Logged circadian sleep from rest mode'
                : 'Registrado sueño circadiano desde modo reposo'
            );
          }
        }
      }
    },
    [ideal, lang, onSleepSynced, tryAutoLog]
  );

  const startSession = async (kind: 'steps' | 'activity' | 'outdoor') => {
    setError(null);
    setNote(null);
    setBusy(true);
    try {
      const tracker = getPhoneSensorTracker();
      const s = await tracker.start(kind);
      setLive(s);
      setNote(
        kind === 'outdoor'
          ? t('sensors.outdoorRunning')
          : kind === 'activity'
            ? t('sensors.activityRunning')
            : t('sensors.stepsRunning')
      );
    } catch (e) {
      const code = e instanceof Error ? e.message : 'ERR';
      if (code === 'GPS_DENIED') setError(t('sensors.gpsDenied'));
      else if (code === 'MOTION_DENIED') setError(t('sensors.motionDenied'));
      else setError(t('sensors.startError'));
    } finally {
      setBusy(false);
    }
  };

  const stopSession = async () => {
    setBusy(true);
    setError(null);
    try {
      const finished = await getPhoneSensorTracker().stop();
      setLive(null);
      const next = loadDayIndicators();
      setDay(next);
      applySessionRewards(finished, next);
      setNote(t('sensors.sessionSaved'));
    } finally {
      setBusy(false);
    }
  };

  const enableMotion = async () => {
    const res = await requestMotionPermission();
    setCaps(detectSensorCapabilities());
    setNote(
      res === 'granted'
        ? t('sensors.motionGranted')
        : res === 'denied'
          ? t('sensors.motionDenied')
          : t('sensors.motionUnsupported')
    );
  };

  const enableGps = async () => {
    const res = await requestGeolocationPermission();
    setCaps(detectSensorCapabilities());
    setNote(res === 'granted' ? t('sensors.gpsGranted') : t('sensors.gpsDenied'));
  };

  const toggleRest = () => {
    setError(null);
    if (rest) {
      const finished = endRestMode();
      setRest(null);
      const next = loadDayIndicators();
      setDay(next);
      applySessionRewards(finished, next);
      setNote(t('sensors.restEnded'));
    } else {
      const state = startRestMode();
      setRest(state);
      setNote(t('sensors.restStarted'));
    }
  };

  if (!caps || !day || !fmt) {
    return (
      <div className="card-soft p-4 mb-6 animate-pulse">
        <p className="text-xs text-[var(--sage)]">{t('sensors.loading')}</p>
      </div>
    );
  }

  const intensityLabel: Record<string, string> = {
    still: t('sensors.intensityStill'),
    light: t('sensors.intensityLight'),
    moderate: t('sensors.intensityModerate'),
    vigorous: t('sensors.intensityVigorous'),
  };

  return (
    <section className="mb-6">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-[var(--sage)] flex items-center gap-2">
          <span>📡</span> {t('sensors.title')}
        </h2>
        <p className="text-[11px] text-[var(--sage)]/80 mt-0.5">{t('sensors.subtitle')}</p>
      </div>

      <div className="card-soft p-4 space-y-4">
        {/* Capability chips */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={enableMotion}
            className={`pill-soft ${caps.motion ? 'pill-soft-active' : ''}`}
          >
            {caps.motion ? '✓' : '·'} {t('sensors.motion')}
          </button>
          <button
            type="button"
            onClick={enableGps}
            className={`pill-soft ${caps.geolocation ? 'pill-soft-active' : ''}`}
          >
            {caps.geolocation ? '✓' : '·'} {t('sensors.gps')}
          </button>
          {!caps.isSecureContext && (
            <span className="pill-soft text-amber-400/80">{t('sensors.needHttps')}</span>
          )}
        </div>

        {/* Indicators grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <IndicatorCell label={t('sensors.steps')} value={String(fmt.steps)} />
          <IndicatorCell
            label={t('sensors.activeMin')}
            value={`${fmt.activeMinutes}`}
          />
          <IndicatorCell
            label={t('sensors.distance')}
            value={`${fmt.distanceKm.toFixed(2)} km`}
          />
          <IndicatorCell
            label={t('sensors.outdoorMin')}
            value={`${fmt.outdoorMinutes}`}
          />
        </div>

        {(fmt.restHours != null || rest) && (
          <div className="bg-[var(--surface)] rounded-2xl px-3 py-2.5 border border-[var(--border-soft)]">
            <p className="text-[11px] text-[var(--sage)]">{t('sensors.restLabel')}</p>
            {rest ? (
              <p className="text-sm text-[var(--accent)] font-medium">
                {t('sensors.restActive', { time: rest.bedTime })}
              </p>
            ) : (
              <p className="text-sm text-white">
                {fmt.restBedTime} → {fmt.restWakeTime}
                {fmt.restHours != null && (
                  <span className="text-[var(--accent)] ml-2">{fmt.restHours} h</span>
                )}
              </p>
            )}
          </div>
        )}

        {/* Live session */}
        {live && (
          <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-active)] p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-[var(--accent)]">
                {live.kind === 'outdoor'
                  ? t('sensors.liveOutdoor')
                  : live.kind === 'activity'
                    ? t('sensors.liveActivity')
                    : t('sensors.liveSteps')}
              </p>
              <span className="text-[10px] text-[var(--sage)]">
                {intensityLabel[live.lastIntensity]}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-white">{live.steps}</p>
                <p className="text-[10px] text-[var(--sage)]">{t('sensors.steps')}</p>
              </div>
              <div>
                <p className="text-lg font-bold text-white">
                  {Math.round(live.activeSeconds / 60)}
                </p>
                <p className="text-[10px] text-[var(--sage)]">{t('sensors.activeMin')}</p>
              </div>
              <div>
                <p className="text-lg font-bold text-white">
                  {(live.distanceMeters / 1000).toFixed(2)}
                </p>
                <p className="text-[10px] text-[var(--sage)]">km</p>
              </div>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={stopSession}
              className="btn-primary py-2.5 text-sm"
            >
              {t('sensors.stopSave')}
            </button>
          </div>
        )}

        {/* Actions */}
        {!live && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              disabled={busy || !!rest}
              onClick={() => startSession('steps')}
              className="btn-secondary py-2.5 text-xs"
            >
              {t('sensors.startSteps')}
            </button>
            <button
              type="button"
              disabled={busy || !!rest}
              onClick={() => startSession('activity')}
              className="btn-secondary py-2.5 text-xs"
            >
              {t('sensors.startActivity')}
            </button>
            <button
              type="button"
              disabled={busy || !!rest}
              onClick={() => startSession('outdoor')}
              className="btn-secondary py-2.5 text-xs"
            >
              {t('sensors.startOutdoor')}
            </button>
          </div>
        )}

        <button
          type="button"
          disabled={busy || !!live}
          onClick={toggleRest}
          className={rest ? 'btn-primary py-2.5 text-sm' : 'btn-secondary py-2.5 text-sm'}
        >
          {rest ? t('sensors.endRest') : t('sensors.startRest')}
        </button>

        {/* Score hints */}
        {hints && (
          <div className="space-y-1.5 text-[11px] text-[var(--sage)]">
            <p>
              <span className={hints.canLogHit ? 'text-[var(--accent)]' : ''}>
                {hints.canLogHit ? '✓' : '○'} HIT
              </span>
              {' · '}
              {hints.reasonHit}
            </p>
            <p>
              <span className={hints.canLogOutdoor ? 'text-[var(--accent)]' : ''}>
                {hints.canLogOutdoor ? '✓' : '○'} Outdoor
              </span>
              {' · '}
              {hints.reasonOutdoor}
            </p>
            <p>
              <span className={hints.canLogSleep ? 'text-[var(--accent)]' : ''}>
                {hints.canLogSleep ? '✓' : '○'} Sleep
              </span>
              {' · '}
              {hints.reasonSleep}
            </p>
          </div>
        )}

        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 rounded-xl px-3 py-2">{error}</p>
        )}
        {note && !error && (
          <p className="text-xs text-[var(--accent)] bg-[var(--surface-active)] rounded-xl px-3 py-2">
            {note}
          </p>
        )}

      </div>
    </section>
  );
}

function IndicatorCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--surface)] rounded-2xl py-2.5 px-2 text-center border border-[var(--border-soft)]">
      <p className="text-base font-bold text-white tabular-nums leading-tight">{value}</p>
      <p className="text-[10px] text-[var(--sage)] mt-0.5">{label}</p>
    </div>
  );
}
