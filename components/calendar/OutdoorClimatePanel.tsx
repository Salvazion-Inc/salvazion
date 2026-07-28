'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  buildOutdoorAdvice,
  daylightLabel,
  daylightRemainingMinutes,
  fetchOutdoorSnapshot,
  formatHmFromIso,
  isNaturalLightNow,
  requestUserCoords,
  type OutdoorActionKind,
  type OutdoorAdvice,
  type OutdoorSnapshot,
} from '@/lib/calendar/outdoor-climate';
import { useI18n } from '@/components/I18nProvider';
import { PILLAR_COLORS } from '@/lib/theme/pillars';

type Props = {
  className?: string;
};

const KIND_ORDER: OutdoorActionKind[] = [
  'circadian_morning',
  'outdoor',
  'exercise',
  'sport',
  'circadian_evening',
];

function scoreColor(score: number): string {
  if (score >= 75) return PILLAR_COLORS.freedom.solid;
  if (score >= 50) return '#E8C468';
  if (score >= 30) return '#E89B5C';
  return '#C75B5B';
}

export default function OutdoorClimatePanel({ className = '' }: Props) {
  const { t, lang } = useI18n();
  const [snapshot, setSnapshot] = useState<OutdoorSnapshot | null>(null);
  const [advice, setAdvice] = useState<OutdoorAdvice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  const load = useCallback(async (forceGeo = false) => {
    setLoading(true);
    setError(null);
    try {
      const coords = forceGeo ? await requestUserCoords() : undefined;
      const data = await fetchOutdoorSnapshot(coords);
      setSnapshot(data);
      setAdvice(buildOutdoorAdvice(data, new Date()));
    } catch {
      setError(t('outdoorClimate.error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load(true);
  }, [load]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const n = new Date();
      setNow(n);
      if (snapshot) setAdvice(buildOutdoorAdvice(snapshot, n));
    }, 60_000);
    return () => window.clearInterval(id);
  }, [snapshot]);

  const lightOn = useMemo(
    () => (snapshot ? isNaturalLightNow(snapshot, now) : false),
    [snapshot, now]
  );

  const remaining = useMemo(
    () => (snapshot ? daylightRemainingMinutes(snapshot, now) : 0),
    [snapshot, now]
  );

  const remainingLabel = useMemo(() => {
    if (!lightOn) return t('outdoorClimate.night');
    const h = Math.floor(remaining / 60);
    const m = remaining % 60;
    if (lang === 'en') return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
    return h > 0 ? `${h} h ${m} min restantes` : `${m} min restantes`;
  }, [lightOn, remaining, t, lang]);

  const kindLabel = (kind: OutdoorActionKind) => t(`outdoorClimate.kinds.${kind}`);

  return (
    <section
      className={`card-soft border border-[var(--border-soft)] overflow-hidden ${className}`}
      aria-label={t('outdoorClimate.title')}
    >
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-[var(--sage)]/70">
              {t('outdoorClimate.section')}
            </p>
            <h2 className="text-base font-semibold text-[var(--accent)] leading-tight">
              {t('outdoorClimate.title')}
            </h2>
            <p className="text-[11px] text-[var(--sage)]/80 mt-0.5">
              {t('outdoorClimate.subtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load(true)}
            className="btn-outline-sm text-[10px] min-h-[32px] shrink-0"
            disabled={loading}
          >
            {loading ? t('common.loading') : t('outdoorClimate.refresh')}
          </button>
        </div>

        {error && (
          <p className="text-[11px] text-amber-400/90 mt-2">{error}</p>
        )}

        {loading && !snapshot && (
          <p className="text-sm text-[var(--sage)] animate-pulse mt-3">
            {t('outdoorClimate.loading')}
          </p>
        )}

        {snapshot && advice && (
          <>
            {/* Light + weather strip */}
            <div
              className="mt-3 rounded-xl border p-3 transition-colors duration-700"
              style={{
                borderColor: lightOn
                  ? 'color-mix(in srgb, #E8C468 45%, transparent)'
                  : 'var(--border-soft)',
                background: lightOn
                  ? 'color-mix(in srgb, #E8C468 10%, #040404)'
                  : 'color-mix(in srgb, #4A6FA5 8%, #040404)',
              }}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-xs font-medium text-white">
                  {lightOn
                    ? t('outdoorClimate.naturalLightOn')
                    : t('outdoorClimate.naturalLightOff')}
                </p>
                <span
                  className="text-[10px] font-semibold tabular-nums px-2 py-0.5 rounded-full"
                  style={{
                    color: scoreColor(advice.outdoorScore),
                    background: `color-mix(in srgb, ${scoreColor(advice.outdoorScore)} 18%, transparent)`,
                  }}
                >
                  {t('outdoorClimate.outdoorScore')} {advice.outdoorScore}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <Metric
                  label={t('outdoorClimate.sunrise')}
                  value={formatHmFromIso(snapshot.daily.sunrise)}
                />
                <Metric
                  label={t('outdoorClimate.sunset')}
                  value={formatHmFromIso(snapshot.daily.sunset)}
                />
                <Metric
                  label={t('outdoorClimate.daylight')}
                  value={daylightLabel(
                    snapshot.daily.daylightSeconds,
                    lang === 'es' ? 'es' : 'en'
                  )}
                />
                <Metric label={t('outdoorClimate.remaining')} value={remainingLabel} />
              </div>
            </div>

            {/* Current weather */}
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Stat
                label={t('outdoorClimate.temp')}
                value={`${Math.round(snapshot.current.tempC)}°`}
              />
              <Stat
                label={t('outdoorClimate.condition')}
                value={t(`outdoorClimate.conditions.${advice.conditionKey}`)}
              />
              <Stat
                label={t('outdoorClimate.uv')}
                value={`${snapshot.daily.uvMax.toFixed(1)} · ${t(
                  `outdoorClimate.uvLevels.${advice.uvLevel}`
                )}`}
              />
              <Stat
                label={t('outdoorClimate.clouds')}
                value={`${Math.round(snapshot.current.cloudCover)}%`}
              />
              <Stat
                label={t('outdoorClimate.wind')}
                value={`${Math.round(snapshot.current.windKmh)} km/h`}
              />
              <Stat
                label={t('outdoorClimate.humidity')}
                value={`${Math.round(snapshot.current.humidity)}%`}
              />
            </div>

            <p className="text-[10px] text-[var(--sage)]/65 mt-2">
              {snapshot.coords.source === 'geo' || snapshot.coords.source === 'cached'
                ? t('outdoorClimate.locationOn')
                : t('outdoorClimate.locationFallback')}
              {' · '}
              {snapshot.timezone}
            </p>

            {/* Planning windows */}
            <div className="mt-4">
              <p className="text-[10px] uppercase tracking-wider text-[var(--sage)]/70 mb-2">
                {t('outdoorClimate.windowsTitle')}
              </p>
              <ul className="space-y-1.5">
                {KIND_ORDER.map((kind) => {
                  const w = advice.windows.find((x) => x.kind === kind);
                  if (!w) return null;
                  return (
                    <li
                      key={kind}
                      className="flex items-center gap-2 rounded-lg px-2.5 py-2 border border-[var(--border-soft)] bg-[var(--true-black)]/40"
                    >
                      <span
                        className="w-1.5 h-8 rounded-full shrink-0"
                        style={{ background: scoreColor(w.score) }}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-medium text-[var(--off-white)] leading-tight">
                          {kindLabel(kind)}
                        </p>
                        <p className="text-[10px] text-[var(--sage)]/80">
                          {t(`outdoorClimate.reasons.${w.reasonKey}`)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[12px] font-semibold tabular-nums text-white">
                          {w.start}–{w.end}
                        </p>
                        <p
                          className="text-[10px] tabular-nums"
                          style={{ color: scoreColor(w.score) }}
                        >
                          {w.score}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Tips */}
            <div className="mt-3 space-y-1.5">
              {advice.tips.map((tip) => (
                <p
                  key={tip}
                  className="text-[11px] leading-relaxed text-[var(--off-white)]/80 pl-2 border-l-2 border-[var(--accent)]/40"
                >
                  {t(`outdoorClimate.tips.${tip}`)}
                </p>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-wide text-[var(--sage)]/70">{label}</p>
      <p className="text-[12px] font-semibold text-white tabular-nums">{value}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--true-black)]/50 px-2 py-1.5">
      <p className="text-[9px] text-[var(--sage)]/70 truncate">{label}</p>
      <p className="text-[11px] font-semibold text-[var(--off-white)] leading-tight mt-0.5 line-clamp-2">
        {value}
      </p>
    </div>
  );
}
