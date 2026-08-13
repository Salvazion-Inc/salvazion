'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/components/I18nProvider';
import {
  formatLocation,
  loadProfile,
  saveProfile,
  subscribeProfileUpdated,
} from '@/lib/store/profile';
import { logAction } from '@/lib/scoring/engine';
import { getFreedomPoints } from '@/lib/freedom/engine';
import { PILLAR_COLORS } from '@/lib/theme/pillars';
import {
  type ChurchDenomFamily,
  type ChurchPlace,
  DENOM_FAMILIES,
  SEARCH_RADIUS_M,
  denomFamilyLabel,
  directionsUrl,
  formatDistance,
  placeUrl,
} from '@/lib/freedom/churches';

type Geo = {
  lat: number;
  lon: number;
  label: string;
  source: 'gps' | 'city';
};

type Props = {
  className?: string;
  onScored?: () => void;
};

const FREEDOM = PILLAR_COLORS.freedom;

function requestGps(): Promise<{ lat: number; lon: number } | null> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
      },
      () => resolve(null),
      {
        enableHighAccuracy: true,
        timeout: 18_000,
        maximumAge: 30_000,
      }
    );
  });
}

/**
 * Persist city/country from reverse geocode into the user profile
 * (localStorage + Supabase when logged in). Always emits profile update.
 */
async function syncProfileLocation(
  city: string,
  country: string
): Promise<{ city: string; country: string; saved: boolean }> {
  let c = (city || '').trim();
  let co = (country || '').trim();
  // Sometimes only "City, Country" arrives as a single field
  if (c && !co && c.includes(',')) {
    const parts = c.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      c = parts[0];
      co = parts.slice(1).join(', ');
    }
  }
  if (!c && !co) return { city: '', country: '', saved: false };
  const current = loadProfile();
  const same =
    (current.city || '').trim() === c && (current.country || '').trim() === co;
  if (!same) {
    await saveProfile({ city: c, country: co });
  }
  return { city: c, country: co, saved: !same };
}

/** Dedicated reverse-geocode call so profile updates even if Overpass is slow/fails. */
async function reverseGeocodeClient(
  lat: number,
  lon: number
): Promise<{ city: string; country: string; label: string } | null> {
  try {
    const res = await fetch('/api/geo/geocode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lon }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      city?: string;
      country?: string;
      label?: string;
    };
    const city = (data.city || '').trim();
    const country = (data.country || '').trim();
    const label =
      (data.label || '').trim() ||
      [city, country].filter(Boolean).join(', ');
    if (!city && !country && !label) return null;
    return { city, country, label };
  } catch {
    return null;
  }
}

/** Compact Salvazion mini-map: user + church pins in Freedom green. */
function PinMap({
  geo,
  churches,
  lang,
}: {
  geo: Geo;
  churches: ChurchPlace[];
  lang: 'es' | 'en' | 'pt';
}) {
  const tx = (en: string, es: string, pt: string) =>
    lang === 'pt' ? pt : lang === 'es' ? es : en;
  const W = 320;
  const H = 180;
  const pad = 18;

  const bounds = useMemo(() => {
    const lats = [geo.lat, ...churches.map((c) => c.lat)];
    const lons = [geo.lon, ...churches.map((c) => c.lon)];
    let minLat = Math.min(...lats);
    let maxLat = Math.max(...lats);
    let minLon = Math.min(...lons);
    let maxLon = Math.max(...lons);
    const latPad = Math.max((maxLat - minLat) * 0.15, 0.008);
    const lonPad = Math.max((maxLon - minLon) * 0.15, 0.01);
    minLat -= latPad;
    maxLat += latPad;
    minLon -= lonPad;
    maxLon += lonPad;
    return { minLat, maxLat, minLon, maxLon };
  }, [geo, churches]);

  const project = (lat: number, lon: number) => {
    const x =
      pad +
      ((lon - bounds.minLon) / Math.max(bounds.maxLon - bounds.minLon, 1e-9)) *
        (W - pad * 2);
    const y =
      pad +
      (1 - (lat - bounds.minLat) / Math.max(bounds.maxLat - bounds.minLat, 1e-9)) *
        (H - pad * 2);
    return { x, y };
  };

  const you = project(geo.lat, geo.lon);

  return (
    <div
      className="relative rounded-xl overflow-hidden border aspect-[16/9]"
      style={{
        borderColor: FREEDOM.border,
        background:
          'radial-gradient(ellipse at 50% 40%, rgba(123,201,138,0.12) 0%, #0a0f0b 55%, #040404 100%)',
      }}
      role="img"
      aria-label={tx(
        `Map with ${churches.length} churches nearby`,
        `Mapa con ${churches.length} iglesias cerca`,
        `Mapa com ${churches.length} igrejas perto`
      )}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id="salv-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path
              d="M 24 0 L 0 0 0 24"
              fill="none"
              stroke="rgba(143,217,154,0.06)"
              strokeWidth="1"
            />
          </pattern>
          <radialGradient id="you-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={FREEDOM.solid} stopOpacity="0.45" />
            <stop offset="100%" stopColor={FREEDOM.solid} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width={W} height={H} fill="url(#salv-grid)" />
        <circle cx={you.x} cy={you.y} r={36} fill="url(#you-glow)" />
        <circle
          cx={you.x}
          cy={you.y}
          r={28}
          fill="none"
          stroke={FREEDOM.solid}
          strokeOpacity="0.2"
          strokeWidth="1"
          strokeDasharray="3 4"
        />
        {churches.map((c) => {
          const p = project(c.lat, c.lon);
          return (
            <g key={c.id}>
              <line
                x1={you.x}
                y1={you.y}
                x2={p.x}
                y2={p.y}
                stroke={FREEDOM.solid}
                strokeOpacity="0.12"
                strokeWidth="1"
              />
              <circle
                cx={p.x}
                cy={p.y}
                r={5.5}
                fill={FREEDOM.solid}
                stroke="#041008"
                strokeWidth="1.5"
              />
              <circle cx={p.x} cy={p.y - 0.5} r={1.4} fill="#041008" opacity="0.55" />
            </g>
          );
        })}
        <circle
          cx={you.x}
          cy={you.y}
          r={7}
          fill="#F5F7F5"
          stroke={FREEDOM.solid}
          strokeWidth="2.2"
        />
        <circle cx={you.x} cy={you.y} r={2.2} fill={FREEDOM.solid} />
      </svg>
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2 pointer-events-none">
        <span
          className="text-[9px] font-medium px-2 py-0.5 rounded-full border"
          style={{
            color: FREEDOM.text,
            borderColor: FREEDOM.border,
            background: 'rgba(4,4,4,0.72)',
          }}
        >
          {tx('You', 'Tú', 'Você')} · {churches.length}{' '}
          {tx('churches', 'iglesias', 'igrejas')}
        </span>
        <span
          className="text-[9px] px-2 py-0.5 rounded-full"
          style={{ color: FREEDOM.muted, background: 'rgba(4,4,4,0.55)' }}
        >
          ~{Math.round(SEARCH_RADIUS_M / 1000)} km
        </span>
      </div>
    </div>
  );
}

/**
 * Christian Assemblies & Evangelical churches (Freedom · Connect).
 * Uses /api/geo/* (server User-Agent for Overpass/Nominatim).
 * GPS updates profile city + country.
 */
export default function ChurchesMapPanel({ className = '', onScored }: Props) {
  const { lang } = useI18n();
  const tx = (en: string, es: string, pt: string) =>
    lang === 'pt' ? pt : lang === 'es' ? es : en;
  const es = lang === 'es';
  const [geo, setGeo] = useState<Geo | null>(null);
  const [churches, setChurches] = useState<ChurchPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [queryCity, setQueryCity] = useState('');
  const [profilePlace, setProfilePlace] = useState('');
  const [profileSynced, setProfileSynced] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'locating' | 'ok' | 'denied'>(
    'idle'
  );
  const [familyFilter, setFamilyFilter] = useState<ChurchDenomFamily | 'all'>('all');
  const [connected, setConnected] = useState<Set<string>>(() => new Set());

  const readProfilePlace = useCallback(() => {
    const p = loadProfile();
    return formatLocation(p?.city, p?.country);
  }, []);

  useEffect(() => {
    setProfilePlace(readProfilePlace());
    setQueryCity(readProfilePlace());
    return subscribeProfileUpdated(() => {
      const place = readProfilePlace();
      setProfilePlace(place);
      setQueryCity((q) => (q.trim() ? q : place));
    });
  }, [readProfilePlace]);

  const applyLocationToProfile = useCallback(
    async (city: string, country: string, label?: string) => {
      let c = (city || '').trim();
      let co = (country || '').trim();
      if ((!c || !co) && label) {
        const parts = label
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        if (!c && parts[0]) c = parts[0];
        if (!co && parts.length > 1) co = parts[parts.length - 1];
      }
      const result = await syncProfileLocation(c, co);
      if (result.city || result.country) {
        const place = formatLocation(result.city, result.country);
        if (place) {
          setProfilePlace(place);
          setQueryCity(place);
          setProfileSynced(true);
        }
        return true;
      }
      return false;
    },
    []
  );

  const fetchChurchesNear = useCallback(
    async (
      lat: number,
      lon: number,
      opts: {
        source: Geo['source'];
        labelFallback: string;
        /** When true, write reverse-geocoded city/country into profile */
        updateProfile: boolean;
      }
    ) => {
      setLoading(true);
      setError(null);
      setChurches([]);
      setFamilyFilter('all');
      setGeo({
        lat,
        lon,
        label: opts.labelFallback,
        source: opts.source,
      });

      // GPS path: reverse-geocode immediately so profile updates even if Overpass is slow/fails.
      let profilePromise: Promise<boolean> = Promise.resolve(false);
      if (opts.updateProfile) {
        profilePromise = (async () => {
          const rev = await reverseGeocodeClient(lat, lon);
          if (!rev) return false;
          return applyLocationToProfile(rev.city, rev.country, rev.label);
        })();
      }

      try {
        const res = await fetch('/api/geo/nearby-churches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lat,
            lon,
            radiusM: SEARCH_RADIUS_M,
            lang,
            reverse: true,
          }),
        });
        const data = (await res.json()) as {
          churches?: ChurchPlace[];
          label?: string | null;
          city?: string | null;
          country?: string | null;
          error?: string;
        };

        // Even on partial failure, apply reverse fields if present
        if (opts.updateProfile && (data.city || data.country || data.label)) {
          await applyLocationToProfile(
            data.city || '',
            data.country || '',
            data.label || undefined
          );
        } else if (opts.updateProfile) {
          await profilePromise;
        }

        if (!res.ok) throw new Error(data.error || 'geo_failed');

        const list = data.churches || [];
        const label =
          data.label ||
          opts.labelFallback ||
          tx('Your location', 'Tu ubicación', 'Sua localização');

        setGeo({ lat, lon, label, source: opts.source });
        setChurches(list);

        if (list.length === 0) {
          setError(
            es
              ? 'No hay asambleas ni iglesias evangélicas indexadas cerca. Prueba otra ciudad o amplía la búsqueda.'
              : 'No assemblies or evangelical churches indexed nearby. Try another city.'
          );
        }
      } catch {
        // Profile may already be updated via reverseGeocodeClient
        if (opts.updateProfile) await profilePromise;
        setError(
          es
            ? 'No se pudo cargar el mapa. Revisa tu conexión e intenta de nuevo.'
            : 'Could not load the map. Check your connection and try again.'
        );
      } finally {
        setLoading(false);
      }
    },
    [applyLocationToProfile, es]
  );

  const searchByCity = useCallback(
    async (place: string, updateProfile = false) => {
      const q = place.trim();
      if (!q) {
        setError(
          es
            ? 'Activa el GPS o indica tu ciudad.'
            : 'Enable GPS or enter your city.'
        );
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      setChurches([]);
      try {
        const geoRes = await fetch('/api/geo/geocode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ q }),
        });
        if (geoRes.status === 404) {
          setError(
            es
              ? 'No encontramos esa ciudad. Prueba “Ciudad, País”.'
              : 'City not found. Try “City, Country”.'
          );
          setLoading(false);
          return;
        }
        if (!geoRes.ok) throw new Error('geocode');
        const hit = (await geoRes.json()) as {
          lat: number;
          lon: number;
          label: string;
          city: string;
          country: string;
        };
        if (updateProfile && (hit.city || hit.country || hit.label)) {
          await applyLocationToProfile(
            hit.city || '',
            hit.country || '',
            hit.label
          );
        }
        await fetchChurchesNear(hit.lat, hit.lon, {
          source: 'city',
          labelFallback: hit.label || q,
          updateProfile: false,
        });
      } catch {
        setError(
          es
            ? 'No se pudo cargar el mapa. Revisa tu conexión e intenta de nuevo.'
            : 'Could not load the map. Check your connection and try again.'
        );
        setLoading(false);
      }
    },
    [applyLocationToProfile, es, fetchChurchesNear]
  );

  const locateWithGps = useCallback(async () => {
    setGpsStatus('locating');
    setLoading(true);
    setError(null);
    setProfileSynced(false);
    const coords = await requestGps();
    if (!coords) {
      setGpsStatus('denied');
      setLoading(false);
      const place = queryCity.trim() || profilePlace;
      if (place) {
        await searchByCity(place, false);
      } else {
        setError(
          es
            ? 'Activa el GPS o escribe tu ciudad para encontrar asambleas e iglesias evangélicas.'
            : 'Enable GPS or enter your city to find assemblies and evangelical churches.'
        );
      }
      return;
    }
    setGpsStatus('ok');
    await fetchChurchesNear(coords.lat, coords.lon, {
      source: 'gps',
      labelFallback: tx('Your GPS location', 'Tu ubicación GPS', 'Sua localização GPS'),
      updateProfile: true,
    });
  }, [es, fetchChurchesNear, profilePlace, queryCity, searchByCity]);

  // Auto: GPS first (updates profile), then profile city
  useEffect(() => {
    void (async () => {
      setGpsStatus('locating');
      setLoading(true);
      const coords = await requestGps();
      if (coords) {
        setGpsStatus('ok');
        await fetchChurchesNear(coords.lat, coords.lon, {
          source: 'gps',
          labelFallback: tx('Your GPS location', 'Tu ubicación GPS', 'Sua localização GPS'),
          updateProfile: true,
        });
        return;
      }
      setGpsStatus('denied');
      const place = readProfilePlace();
      if (place) {
        await searchByCity(place, false);
      } else {
        setLoading(false);
        setError(
          es
            ? 'Activa el GPS o escribe tu ciudad para encontrar asambleas e iglesias evangélicas cerca.'
            : 'Enable GPS or enter your city to find assemblies and evangelical churches nearby.'
        );
      }
    })();
    // only on mount / language
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [es]);

  const familyCounts = useMemo(() => {
    const counts = new Map<ChurchDenomFamily, number>();
    for (const c of churches) {
      counts.set(c.family, (counts.get(c.family) || 0) + 1);
    }
    return counts;
  }, [churches]);

  const activeFamilies = useMemo(
    () => DENOM_FAMILIES.filter((f) => (familyCounts.get(f) || 0) > 0),
    [familyCounts]
  );

  const filtered = useMemo(() => {
    if (familyFilter === 'all') return churches;
    return churches.filter((c) => c.family === familyFilter);
  }, [churches, familyFilter]);

  const markConnect = (church: ChurchPlace) => {
    if (connected.has(church.id)) return;
    logAction('connect_real');
    setConnected((prev) => new Set([...prev, church.id]));
    onScored?.();
  };

  const pts = getFreedomPoints('connect_real');

  return (
    <section
      className={`space-y-2.5 ${className}`}
      aria-label={
        es
          ? 'Asambleas cristianas e iglesias evangélicas'
          : 'Christian assemblies and evangelical churches'
      }
    >
      <div className="px-0.5">
        <h2 className="text-sm font-semibold text-[var(--sage)]">
          {es
            ? 'Asambleas e iglesias evangélicas cerca'
            : 'Assemblies & evangelical churches nearby'}
        </h2>
        <p className="text-[10px] text-[var(--sage)]/70 mt-0.5 leading-relaxed">
          {es
            ? 'Conecta en persona · GPS actualiza tu ubicación del perfil'
            : 'Connect in person · GPS updates your profile location'}
        </p>
      </div>

      <div
        className="card-soft overflow-hidden border"
        style={{ borderColor: `${FREEDOM.solid}44` }}
      >
        <div
          className="px-3.5 pt-3.5 pb-3 space-y-3"
          style={{
            background: `linear-gradient(135deg, ${FREEDOM.soft} 0%, transparent 60%)`,
          }}
        >
          {/* Fixed-height row: GPS full-width (primary action) */}
          <button
            type="button"
            className="btn-primary w-full text-xs sm:text-sm"
            onClick={() => void locateWithGps()}
            disabled={loading && gpsStatus === 'locating'}
          >
            {gpsStatus === 'locating'
              ? es
                ? 'Obteniendo GPS…'
                : 'Getting GPS…'
              : gpsStatus === 'ok'
                ? es
                  ? 'Actualizar GPS'
                  : 'Refresh GPS'
                : es
                  ? 'Usar mi ubicación'
                  : 'Use my location'}
          </button>

          {/* City search — input-inline + btn-inline (same height, no vertical desfase) */}
          <div className="flex items-center gap-2 w-full min-w-0">
            <label className="sr-only" htmlFor="churches-city-search">
              {tx('City', 'Ciudad', 'Cidade')}
            </label>
            <input
              id="churches-city-search"
              type="search"
              value={queryCity}
              onChange={(e) => setQueryCity(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void searchByCity(queryCity, true);
              }}
              placeholder={
                tx('City, Country (if no GPS)', 'Ciudad, País (si no hay GPS)', 'Cidade, País (se não houver GPS)')
              }
              className="input-soft input-inline text-sm min-w-0"
              autoComplete="address-level2"
              aria-label={tx('City', 'Ciudad', 'Cidade')}
            />
            <button
              type="button"
              className="btn-secondary btn-inline text-xs sm:text-sm shrink-0"
              onClick={() => void searchByCity(queryCity, true)}
              disabled={loading}
            >
              {loading && gpsStatus !== 'locating'
                ? '…'
                : es
                  ? 'Buscar'
                  : 'Search'}
            </button>
          </div>

          {geo && (
            <p className="text-[10px] leading-relaxed" style={{ color: FREEDOM.muted }}>
              <span className="text-white/90 font-medium">{geo.label}</span>
              <span className="opacity-70">
                {' '}
                ·{' '}
                {geo.source === 'gps'
                  ? es
                    ? 'GPS del celular'
                    : 'Phone GPS'
                  : es
                    ? 'Por ciudad'
                    : 'By city'}
              </span>
              {profileSynced && geo.source === 'gps' ? (
                <span className="opacity-90" style={{ color: FREEDOM.text }}>
                  {' '}
                  · {tx('Profile updated', 'Perfil actualizado', 'Perfil atualizado')}
                </span>
              ) : null}
            </p>
          )}
        </div>

        <div className="px-3.5 pb-3.5 space-y-3">
          {geo && !loading && churches.length > 0 && (
            <PinMap geo={geo} churches={filtered.slice(0, 40)} lang={lang} />
          )}

          {!loading && activeFamilies.length > 0 && (
            <div
              className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-0.5 px-0.5"
              role="tablist"
              aria-label={tx('Denominations', 'Denominaciones', 'Denominações')}
            >
              <button
                type="button"
                role="tab"
                aria-selected={familyFilter === 'all'}
                onClick={() => setFamilyFilter('all')}
                className="shrink-0 text-[10px] font-medium px-2.5 py-1.5 rounded-full border transition"
                style={{
                  borderColor:
                    familyFilter === 'all' ? FREEDOM.border : 'var(--border-soft)',
                  color: familyFilter === 'all' ? FREEDOM.text : 'var(--sage)',
                  background:
                    familyFilter === 'all' ? FREEDOM.soft : 'transparent',
                }}
              >
                {tx('All', 'Todas', 'Todas')} · {churches.length}
              </button>
              {activeFamilies.map((f) => {
                const active = familyFilter === f;
                const n = familyCounts.get(f) || 0;
                return (
                  <button
                    key={f}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setFamilyFilter(f)}
                    className="shrink-0 text-[10px] font-medium px-2.5 py-1.5 rounded-full border transition"
                    style={{
                      borderColor: active ? FREEDOM.border : 'var(--border-soft)',
                      color: active ? FREEDOM.text : 'var(--sage)',
                      background: active ? FREEDOM.soft : 'transparent',
                    }}
                  >
                    {denomFamilyLabel(f, es)} · {n}
                  </button>
                );
              })}
            </div>
          )}

          {loading && (
            <p
              className="text-xs text-center py-4 animate-pulse"
              style={{ color: FREEDOM.text }}
            >
              {gpsStatus === 'locating'
                ? es
                  ? 'Obteniendo tu ubicación…'
                  : 'Getting your location…'
                : es
                  ? 'Buscando asambleas e iglesias evangélicas…'
                  : 'Finding assemblies and evangelical churches…'}
            </p>
          )}

          {error && !loading && (
            <p className="text-[11px] text-[var(--sage)] leading-relaxed py-1">{error}</p>
          )}

          {filtered.length > 0 && (
            <ul className="space-y-1.5 max-h-72 overflow-y-auto">
              {filtered.map((c) => {
                const done = connected.has(c.id);
                return (
                  <li key={c.id}>
                    <div
                      className="rounded-xl border px-2.5 py-2.5 transition"
                      style={{
                        borderColor: done ? FREEDOM.border : 'var(--border-soft)',
                        background: done ? FREEDOM.soft : 'rgba(0,0,0,0.2)',
                      }}
                    >
                      <div className="flex items-start gap-2.5">
                        <span
                          className="mt-0.5 w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 text-sm font-semibold"
                          style={{
                            borderColor: FREEDOM.border,
                            color: FREEDOM.text,
                            background: 'rgba(4,4,4,0.55)',
                          }}
                          aria-hidden
                        >
                          ✝
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-semibold text-white leading-snug">
                            {c.name}
                          </p>
                          <p
                            className="text-[10px] mt-0.5 leading-relaxed"
                            style={{ color: FREEDOM.muted }}
                          >
                            {[
                              c.distanceM != null
                                ? formatDistance(c.distanceM)
                                : null,
                              c.denomination || denomFamilyLabel(c.family, es),
                              c.address,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            <a
                              href={directionsUrl(c.lat, c.lon, c.name)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => markConnect(c)}
                              className="text-[10px] font-semibold px-2.5 py-1 rounded-lg min-h-[28px] inline-flex items-center"
                              style={{
                                background: FREEDOM.solid,
                                color: '#041008',
                              }}
                            >
                              {tx('Directions', 'Cómo llegar', 'Como chegar')}
                            </a>
                            <a
                              href={placeUrl(c.lat, c.lon, c.name)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] font-medium px-2.5 py-1 rounded-lg min-h-[28px] inline-flex items-center border"
                              style={{
                                borderColor: FREEDOM.border,
                                color: FREEDOM.text,
                              }}
                            >
                              {tx('View map', 'Ver en mapa', 'Ver no mapa')}
                            </a>
                            {c.website ? (
                              <a
                                href={
                                  c.website.startsWith('http')
                                    ? c.website
                                    : `https://${c.website}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] font-medium px-2.5 py-1 rounded-lg min-h-[28px] inline-flex items-center border border-[var(--border-soft)] text-[var(--sage)]"
                              >
                                Web
                              </a>
                            ) : null}
                            {done ? (
                              <span
                                className="text-[10px] font-medium px-2 py-1 inline-flex items-center"
                                style={{ color: FREEDOM.text }}
                              >
                                ✓ +{pts}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {!loading && churches.length > 0 && filtered.length === 0 && (
            <p className="text-[11px] text-[var(--sage)] text-center py-2">
              {es
                ? 'No hay resultados en esta denominación. Elige “Todas”.'
                : 'No results in this denomination. Choose “All”.'}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
