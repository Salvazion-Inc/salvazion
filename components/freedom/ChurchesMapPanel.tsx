'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/components/I18nProvider';
import { loadProfile } from '@/lib/store/profile';
import { logAction } from '@/lib/scoring/engine';
import { getFreedomPoints } from '@/lib/freedom/engine';
import { PILLAR_COLORS } from '@/lib/theme/pillars';
import {
  type ChurchDenomFamily,
  type ChurchPlace,
  DENOM_FAMILIES,
  MAX_RESULTS,
  SEARCH_RADIUS_M,
  buildOverpassQuery,
  classifyDenomFamily,
  denomFamilyLabel,
  directionsUrl,
  formatDistance,
  haversineMeters,
  humanizeDenomination,
  isChristianAssemblyOrEvangelical,
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
        timeout: 15_000,
        maximumAge: 60_000,
      }
    );
  });
}

async function reverseGeocodeLabel(
  lat: number,
  lon: number,
  fallback: string
): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return fallback;
    const data = (await res.json()) as {
      address?: {
        suburb?: string;
        neighbourhood?: string;
        city?: string;
        town?: string;
        village?: string;
        municipality?: string;
        state?: string;
        country?: string;
      };
      display_name?: string;
    };
    const a = data.address || {};
    const locality =
      a.suburb ||
      a.neighbourhood ||
      a.city ||
      a.town ||
      a.village ||
      a.municipality;
    const parts = [locality, a.state, a.country].filter(Boolean);
    if (parts.length) return parts.join(', ');
    return data.display_name || fallback;
  } catch {
    return fallback;
  }
}

/** Compact Salvazion mini-map: user + church pins in Freedom green. */
function PinMap({
  geo,
  churches,
  es,
}: {
  geo: Geo;
  churches: ChurchPlace[];
  es: boolean;
}) {
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
    // Minimum span so a single pin isn't stretched edge-to-edge
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
      aria-label={
        es
          ? `Mapa con ${churches.length} iglesias cerca`
          : `Map with ${churches.length} churches nearby`
      }
    >
      {/* Soft grid */}
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

        {/* Radius ring around user */}
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

        {/* You */}
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
          {es ? 'Tú' : 'You'} · {churches.length}{' '}
          {es ? 'iglesias' : 'churches'}
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
 * Salvazion design · GPS · denomination filters · directions.
 */
export default function ChurchesMapPanel({ className = '', onScored }: Props) {
  const { lang } = useI18n();
  const es = lang !== 'en';
  const [geo, setGeo] = useState<Geo | null>(null);
  const [churches, setChurches] = useState<ChurchPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [queryCity, setQueryCity] = useState('');
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'locating' | 'ok' | 'denied'>(
    'idle'
  );
  const [familyFilter, setFamilyFilter] = useState<ChurchDenomFamily | 'all'>('all');
  const [connected, setConnected] = useState<Set<string>>(() => new Set());

  const profilePlace = useMemo(() => {
    const p = loadProfile();
    const parts = [p?.city, p?.country].filter(Boolean);
    return parts.join(', ');
  }, []);

  const fetchChurchesNear = useCallback(
    async (lat: number, lon: number, label: string, source: Geo['source']) => {
      setLoading(true);
      setError(null);
      setChurches([]);
      setGeo({ lat, lon, label, source });
      setFamilyFilter('all');

      try {
        const overpass = buildOverpassQuery(lat, lon, SEARCH_RADIUS_M);
        const opRes = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: overpass,
          headers: { 'Content-Type': 'text/plain' },
        });
        if (!opRes.ok) throw new Error('overpass');
        const op = (await opRes.json()) as {
          elements?: Array<{
            id: number;
            type: string;
            lat?: number;
            lon?: number;
            center?: { lat: number; lon: number };
            tags?: Record<string, string>;
          }>;
        };

        const list: ChurchPlace[] = [];
        for (const el of op.elements || []) {
          const clat = el.lat ?? el.center?.lat;
          const clon = el.lon ?? el.center?.lon;
          if (clat == null || clon == null) continue;
          const tags = el.tags || {};
          const name =
            tags.name ||
            tags['name:es'] ||
            tags['name:en'] ||
            (es ? 'Asamblea / Iglesia cristiana' : 'Christian assembly / church');

          if (!isChristianAssemblyOrEvangelical(tags, name)) continue;

          const family = classifyDenomFamily(tags.denomination, name);
          list.push({
            id: `${el.type}-${el.id}`,
            name,
            lat: clat,
            lon: clon,
            denomination: humanizeDenomination(tags.denomination, es),
            family,
            address:
              [tags['addr:street'], tags['addr:housenumber'], tags['addr:city']]
                .filter(Boolean)
                .join(' ')
                .trim() || undefined,
            distanceM: haversineMeters(lat, lon, clat, clon),
            website: tags.website || tags['contact:website'] || undefined,
            phone: tags.phone || tags['contact:phone'] || undefined,
          });
        }

        const seen = new Set<string>();
        const unique = list
          .filter((c) => {
            const k = `${c.name.toLowerCase()}|${c.lat.toFixed(4)}|${c.lon.toFixed(4)}`;
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
          })
          .sort((a, b) => (a.distanceM ?? 0) - (b.distanceM ?? 0));

        setChurches(unique.slice(0, MAX_RESULTS));
        if (unique.length === 0) {
          setError(
            es
              ? 'No hay asambleas ni iglesias evangélicas indexadas cerca. Prueba otra ciudad o abre cómo llegar en Maps.'
              : 'No assemblies or evangelical churches indexed nearby. Try another city or open directions in Maps.'
          );
        }
      } catch {
        setError(
          es
            ? 'No se pudo cargar el mapa. Revisa tu conexión e intenta de nuevo.'
            : 'Could not load the map. Check your connection and try again.'
        );
      } finally {
        setLoading(false);
      }
    },
    [es]
  );

  const searchByCity = useCallback(
    async (place: string) => {
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
        const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
          q
        )}`;
        const nomRes = await fetch(nomUrl, {
          headers: { Accept: 'application/json' },
        });
        if (!nomRes.ok) throw new Error('geocode');
        const nom = (await nomRes.json()) as Array<{
          lat: string;
          lon: string;
          display_name?: string;
        }>;
        if (!nom[0]) {
          setError(
            es
              ? 'No encontramos esa ciudad. Prueba “Ciudad, País”.'
              : 'City not found. Try “City, Country”.'
          );
          setLoading(false);
          return;
        }
        await fetchChurchesNear(
          parseFloat(nom[0].lat),
          parseFloat(nom[0].lon),
          nom[0].display_name || q,
          'city'
        );
      } catch {
        setError(
          es
            ? 'No se pudo cargar el mapa. Revisa tu conexión e intenta de nuevo.'
            : 'Could not load the map. Check your connection and try again.'
        );
        setLoading(false);
      }
    },
    [es, fetchChurchesNear]
  );

  const locateWithGps = useCallback(async () => {
    setGpsStatus('locating');
    setLoading(true);
    setError(null);
    const coords = await requestGps();
    if (!coords) {
      setGpsStatus('denied');
      setLoading(false);
      const place = queryCity.trim() || profilePlace;
      if (place) {
        await searchByCity(place);
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
    const label = await reverseGeocodeLabel(
      coords.lat,
      coords.lon,
      es ? 'Tu ubicación' : 'Your location'
    );
    await fetchChurchesNear(coords.lat, coords.lon, label, 'gps');
  }, [es, fetchChurchesNear, profilePlace, queryCity, searchByCity]);

  useEffect(() => {
    setQueryCity(profilePlace);
    void (async () => {
      setGpsStatus('locating');
      setLoading(true);
      const coords = await requestGps();
      if (coords) {
        setGpsStatus('ok');
        const label = await reverseGeocodeLabel(
          coords.lat,
          coords.lon,
          es ? 'Tu ubicación' : 'Your location'
        );
        await fetchChurchesNear(coords.lat, coords.lon, label, 'gps');
        return;
      }
      setGpsStatus('denied');
      if (profilePlace) {
        await searchByCity(profilePlace);
      } else {
        setLoading(false);
        setError(
          es
            ? 'Activa el GPS o escribe tu ciudad para encontrar asambleas e iglesias evangélicas cerca.'
            : 'Enable GPS or enter your city to find assemblies and evangelical churches nearby.'
        );
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profilePlace, es]);

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
            ? 'Conecta en persona · Asambleas de Dios, evangélicas y denominaciones cristianas'
            : 'Connect in person · Assemblies of God, evangelical and Christian denominations'}
        </p>
      </div>

      <div
        className="card-soft overflow-hidden border"
        style={{ borderColor: `${FREEDOM.solid}44` }}
      >
        {/* Header band */}
        <div
          className="px-3.5 pt-3.5 pb-3 space-y-3"
          style={{
            background: `linear-gradient(135deg, ${FREEDOM.soft} 0%, transparent 60%)`,
          }}
        >
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-primary px-3 text-xs min-h-[40px] flex-1 sm:flex-none"
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
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={queryCity}
              onChange={(e) => setQueryCity(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void searchByCity(queryCity);
              }}
              placeholder={
                es ? 'Ciudad, País (si no hay GPS)' : 'City, Country (if no GPS)'
              }
              className="input-soft flex-1 text-sm py-2 min-h-[40px]"
              aria-label={es ? 'Ciudad' : 'City'}
            />
            <button
              type="button"
              className="btn-secondary px-3 text-xs min-h-[40px] shrink-0"
              onClick={() => void searchByCity(queryCity)}
              disabled={loading}
            >
              {loading && gpsStatus !== 'locating' ? '…' : es ? 'Buscar' : 'Search'}
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
            </p>
          )}
        </div>

        <div className="px-3.5 pb-3.5 space-y-3">
          {geo && !loading && churches.length > 0 && (
            <PinMap geo={geo} churches={filtered.slice(0, 40)} es={es} />
          )}

          {/* Denomination chips — only families present nearby */}
          {!loading && activeFamilies.length > 0 && (
            <div
              className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-0.5 px-0.5"
              role="tablist"
              aria-label={es ? 'Denominaciones' : 'Denominations'}
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
                {es ? 'Todas' : 'All'} · {churches.length}
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
                          <p className="text-[10px] mt-0.5 leading-relaxed" style={{ color: FREEDOM.muted }}>
                            {[
                              c.distanceM != null ? formatDistance(c.distanceM) : null,
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
                              {es ? 'Cómo llegar' : 'Directions'}
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
                              {es ? 'Ver en mapa' : 'View map'}
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
