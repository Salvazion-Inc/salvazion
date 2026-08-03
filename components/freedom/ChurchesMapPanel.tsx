'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/components/I18nProvider';
import { loadProfile } from '@/lib/store/profile';

type Church = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  denomination?: string;
  address?: string;
  distanceM?: number;
};

type Geo = {
  lat: number;
  lon: number;
  label: string;
  source: 'gps' | 'city';
};

const SEARCH_RADIUS_M = 10_000;
const MAX_RESULTS = 30;

/** Denominations treated as Catholic (excluded). */
const CATHOLIC_DENOM =
  /^(roman_?)?catholic$|greek_catholic|ukrainian_catholic|maronite|melkite|chaldean|syro.?malabar|syro.?malankara|coptic_catholic|armenian_catholic|byzantine_catholic/i;

/** Name patterns that strongly indicate a Catholic parish/cathedral. */
const CATHOLIC_NAME =
  /\b(cat[oó]lic[ao]s?|catholic|catedral|cathedral|bas[ií]lica|basilica|sagrado\s+coraz[oó]n|inmaculada\s+concepci[oó]n|nuestra\s+se[nñ]ora|parroquia\s+(san|santa|nuestra)|iglesia\s+parroquial)\b/i;

/** Explicit non-Christian religions (excluded). */
const NON_CHRISTIAN_RELIGION =
  /^(muslim|islam|islamic|jewish|judaism|buddhist|buddhism|hindu|hinduism|sikh|shinto|taoist|bahai|bahá.?í|pagan|jain|zoroastrian|scientology)$/i;

/** Groups often tagged under christian but not “Iglesias/Asambleas cristianas” for this map. */
const EXCLUDED_DENOM =
  /mormon|latter.?day|lds|jehovah|testigo|unitarian|scientology|catholic/i;

/**
 * Christian (non-Catholic) denominations we want to surface.
 * Assemblies of God / Christian Assemblies are especially relevant in LATAM.
 */
const CHRISTIAN_DENOM =
  /protestant|evangelical|evangelic|baptist|pentecostal|methodist|presbyterian|lutheran|anglican|adventist|assemblies?_of_god|asamblea|nondenominational|non.?denominational|reformed|charismatic|holiness|brethren|anabaptist|mennonite|quaker|orthodox|coptic|armenian_apostolic|assyrian|wesleyan|episcopal|congregational|free_church|independent|full_gospel|foursquare|calvary|vineyard|christian|iglesia|asambleas/i;

const CHRISTIAN_NAME =
  /\b(iglesia|asamblea|asambleas|evangelic|evang[eé]lic|cristian|christian|templo|assembly|assemblies|pentecost|bautista|adventist|metodista|presbiterian|luteran|anglican|reformad|carism[aá]tic|nazareno|alianza|vi[nñ]a|calvary|foursquare|dios\s+es\s+amor|universal|bethel|ebenezer|peniel|shalom)\b/i;

function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function formatDistance(m: number, es: boolean): string {
  if (m < 1000) return es ? `${Math.round(m)} m` : `${Math.round(m)} m`;
  const km = m / 1000;
  return es ? `${km.toFixed(1)} km` : `${km.toFixed(1)} km`;
}

function isCatholic(tags: Record<string, string>, name: string): boolean {
  const denom = (tags.denomination || '').trim();
  const religion = (tags.religion || '').trim();
  if (denom && CATHOLIC_DENOM.test(denom)) return true;
  if (religion && /catholic/i.test(religion)) return true;
  if (CATHOLIC_NAME.test(name)) return true;
  // Common OSM operator for Catholic dioceses
  if (
    /cathol|di[oó]cesis|archidi[oó]cesis|obispado|vaticano/i.test(
      tags.operator || ''
    )
  ) {
    return true;
  }
  return false;
}

function isExcludedDenom(tags: Record<string, string>, name: string): boolean {
  const denom = (tags.denomination || '').trim();
  if (denom && EXCLUDED_DENOM.test(denom)) return true;
  if (/\b(mormon|testigos?\s+de\s+jehov[aá]|jehovah|latter.?day|lds)\b/i.test(name)) {
    return true;
  }
  return false;
}

function isNonChristianReligion(tags: Record<string, string>): boolean {
  const religion = (tags.religion || '').trim();
  if (!religion) return false;
  if (/^christian$/i.test(religion)) return false;
  return NON_CHRISTIAN_RELIGION.test(religion) || !/christian/i.test(religion);
}

/**
 * Keep only Christian churches / assemblies that are not Catholic
 * and not another religion.
 */
function isChristianNonCatholic(
  tags: Record<string, string>,
  name: string
): boolean {
  if (isCatholic(tags, name)) return false;
  if (isExcludedDenom(tags, name)) return false;
  if (isNonChristianReligion(tags)) return false;

  const religion = (tags.religion || '').trim().toLowerCase();
  const denom = (tags.denomination || '').trim();
  const amenity = (tags.amenity || '').trim();
  const building = (tags.building || '').trim();

  // Explicit Christian religion (already non-Catholic / non-excluded)
  if (religion === 'christian') return true;

  // Known Christian denomination without religion tag
  if (denom && CHRISTIAN_DENOM.test(denom) && !CATHOLIC_DENOM.test(denom)) {
    return true;
  }

  // Name strongly suggests evangelical / assembly / Christian church
  if (CHRISTIAN_NAME.test(name) && !CATHOLIC_NAME.test(name)) {
    // Avoid bare "templo" alone for non-Christian temples
    if (/^\s*templo\s*$/i.test(name) && religion && religion !== 'christian') {
      return false;
    }
    return true;
  }

  // place_of_worship without religion/denomination is often Catholic in LATAM —
  // only keep if name looks Christian non-Catholic (handled above).
  if (amenity === 'place_of_worship' && !religion && !denom) {
    return false;
  }

  // building=church alone is too noisy (many Catholic) — require name signal
  if (building === 'church' && !religion) {
    return CHRISTIAN_NAME.test(name) && !CATHOLIC_NAME.test(name);
  }

  return false;
}

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

/**
 * Christian churches & assemblies near the user (Freedom · Connect).
 * GPS-first; OpenStreetMap Overpass — free, no API key.
 * Excludes Catholic and non-Christian places of worship.
 */
export default function ChurchesMapPanel({ className = '' }: { className?: string }) {
  const { lang } = useI18n();
  const es = lang !== 'en';
  const [geo, setGeo] = useState<Geo | null>(null);
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [queryCity, setQueryCity] = useState('');
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'locating' | 'ok' | 'denied'>(
    'idle'
  );

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

      try {
        // Overpass: Christian worship + assemblies; client filters out Catholic.
        const radius = SEARCH_RADIUS_M;
        const overpass = `
[out:json][timeout:25];
(
  node["amenity"="place_of_worship"]["religion"="christian"](around:${radius},${lat},${lon});
  way["amenity"="place_of_worship"]["religion"="christian"](around:${radius},${lat},${lon});
  relation["amenity"="place_of_worship"]["religion"="christian"](around:${radius},${lat},${lon});
  node["amenity"="place_of_worship"]["denomination"~"protestant|evangelical|evangelic|baptist|pentecostal|methodist|presbyterian|lutheran|anglican|adventist|assemblies_of_god|nondenominational|non-denominational|reformed|charismatic|orthodox|wesleyan|episcopal|congregational|full_gospel|foursquare",i](around:${radius},${lat},${lon});
  way["amenity"="place_of_worship"]["denomination"~"protestant|evangelical|evangelic|baptist|pentecostal|methodist|presbyterian|lutheran|anglican|adventist|assemblies_of_god|nondenominational|non-denominational|reformed|charismatic|orthodox|wesleyan|episcopal|congregational|full_gospel|foursquare",i](around:${radius},${lat},${lon});
  node["amenity"="place_of_worship"]["name"~"asamblea|asambleas|evangelic|evang[eé]lic|iglesia cristiana|assembly of god|assemblies of god|pentecost|bautista|adventist",i](around:${radius},${lat},${lon});
  way["amenity"="place_of_worship"]["name"~"asamblea|asambleas|evangelic|evang[eé]lic|iglesia cristiana|assembly of god|assemblies of god|pentecost|bautista|adventist",i](around:${radius},${lat},${lon});
);
out center 80;
`;
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

        const list: Church[] = [];
        for (const el of op.elements || []) {
          const clat = el.lat ?? el.center?.lat;
          const clon = el.lon ?? el.center?.lon;
          if (clat == null || clon == null) continue;
          const tags = el.tags || {};
          const name =
            tags.name ||
            tags['name:es'] ||
            tags['name:en'] ||
            (es ? 'Iglesia cristiana' : 'Christian church');

          if (!isChristianNonCatholic(tags, name)) continue;

          // Skip if denomination explicitly catholic (extra safety)
          if (tags.denomination && CATHOLIC_DENOM.test(tags.denomination)) continue;

          list.push({
            id: `${el.type}-${el.id}`,
            name,
            lat: clat,
            lon: clon,
            denomination:
              tags.denomination ||
              (tags.religion === 'christian'
                ? es
                  ? 'cristiana'
                  : 'christian'
                : undefined),
            address:
              [tags['addr:street'], tags['addr:housenumber'], tags['addr:city']]
                .filter(Boolean)
                .join(' ')
                .trim() || undefined,
            distanceM: haversineMeters(lat, lon, clat, clon),
          });
        }

        // Dedupe by name + rounded coords
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
              ? 'No hay iglesias ni asambleas cristianas indexadas cerca. Abre el mapa para buscar manualmente.'
              : 'No Christian churches or assemblies indexed nearby. Open the map to search manually.'
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
            ? 'Activa el GPS o indica tu ciudad para buscar iglesias.'
            : 'Enable GPS or enter your city to find churches.'
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
        const lat = parseFloat(nom[0].lat);
        const lon = parseFloat(nom[0].lon);
        const label = nom[0].display_name || q;
        await fetchChurchesNear(lat, lon, label, 'city');
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
      // Fall back to profile / city field
      const place = queryCity.trim() || profilePlace;
      if (place) {
        setError(
          es
            ? 'No se pudo usar el GPS. Buscando por ciudad…'
            : 'Could not use GPS. Searching by city…'
        );
        await searchByCity(place);
      } else {
        setError(
          es
            ? 'Activa el GPS del celular o escribe tu ciudad para encontrar iglesias cristianas cerca.'
            : 'Enable phone GPS or enter your city to find Christian churches nearby.'
        );
      }
      return;
    }
    setGpsStatus('ok');
    const label = await reverseGeocodeLabel(
      coords.lat,
      coords.lon,
      es ? 'Tu ubicación GPS' : 'Your GPS location'
    );
    await fetchChurchesNear(coords.lat, coords.lon, label, 'gps');
  }, [es, fetchChurchesNear, profilePlace, queryCity, searchByCity]);

  // Auto: GPS first, then profile city
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
          es ? 'Tu ubicación GPS' : 'Your GPS location'
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
            ? 'Activa el GPS del celular o escribe tu ciudad para encontrar iglesias y asambleas cristianas.'
            : 'Enable phone GPS or enter your city to find Christian churches and assemblies.'
        );
      }
    })();
    // Only on mount / language / profile place
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profilePlace, es]);

  const mapEmbed =
    geo &&
    `https://www.openstreetmap.org/export/embed.html?bbox=${
      geo.lon - 0.05
    }%2C${geo.lat - 0.035}%2C${geo.lon + 0.05}%2C${
      geo.lat + 0.035
    }&layer=mapnik&marker=${geo.lat}%2C${geo.lon}`;

  const mapLink = geo
    ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(
        es
          ? `iglesia cristiana OR asamblea cristiana`
          : `christian church OR christian assembly`
      )}#map=14/${geo.lat}/${geo.lon}`
    : `https://www.openstreetmap.org/search?query=${encodeURIComponent(
        es
          ? `iglesia cristiana ${queryCity || profilePlace}`
          : `christian church ${queryCity || profilePlace}`
      )}`;

  const locationHint =
    geo?.source === 'gps'
      ? es
        ? 'Ubicación exacta por GPS del celular'
        : 'Exact location from phone GPS'
      : es
        ? 'Ubicación por ciudad · puedes activar el GPS'
        : 'Location by city · you can enable GPS';

  return (
    <section
      className={`space-y-2.5 ${className}`}
      aria-label={es ? 'Iglesias y asambleas cristianas' : 'Christian churches and assemblies'}
    >
      <div className="px-0.5">
        <h2 className="text-sm font-semibold text-[var(--sage)]">
          {es ? 'Iglesias y asambleas cristianas cerca' : 'Christian churches & assemblies nearby'}
        </h2>
        <p className="text-[10px] text-[var(--sage)]/70 mt-0.5 leading-relaxed">
          {es
            ? `${locationHint} · Solo cristianas (no católicas ni otras religiones) · OpenStreetMap`
            : `${locationHint} · Christian only (not Catholic or other religions) · OpenStreetMap`}
        </p>
      </div>

      <div className="card-soft p-3 space-y-3 border border-[var(--border-soft)]">
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            className="btn-primary px-3 text-xs min-h-[40px] shrink-0 flex-1 sm:flex-none"
            onClick={() => void locateWithGps()}
            disabled={loading && gpsStatus === 'locating'}
          >
            {gpsStatus === 'locating'
              ? es
                ? 'Obteniendo GPS…'
                : 'Getting GPS…'
              : gpsStatus === 'ok'
                ? es
                  ? '↻ Actualizar GPS'
                  : '↻ Refresh GPS'
                : es
                  ? '📍 Usar mi ubicación'
                  : '📍 Use my location'}
          </button>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={queryCity}
            onChange={(e) => setQueryCity(e.target.value)}
            placeholder={
              es ? 'Ciudad, País (si no hay GPS)' : 'City, Country (if no GPS)'
            }
            className="input-soft flex-1 text-sm py-2 min-h-[40px]"
          />
          <button
            type="button"
            className="btn-secondary px-3 text-xs min-h-[40px] shrink-0"
            onClick={() => void searchByCity(queryCity)}
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
          <p className="text-[10px] text-[var(--sage)]/80 leading-relaxed">
            {geo.source === 'gps' ? '📍 ' : '🏙 '}
            {geo.label}
            <span className="opacity-70">
              {' '}
              · {geo.lat.toFixed(5)}, {geo.lon.toFixed(5)}
            </span>
          </p>
        )}

        {geo && mapEmbed && (
          <div className="rounded-xl overflow-hidden border border-[var(--border-soft)] aspect-[16/10] bg-black">
            <iframe
              title={es ? 'Mapa de iglesias cristianas' : 'Christian churches map'}
              src={mapEmbed}
              className="w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        )}

        {loading && (
          <p className="text-xs text-[var(--sage)] text-center py-2">
            {gpsStatus === 'locating'
              ? es
                ? 'Obteniendo tu ubicación exacta…'
                : 'Getting your exact location…'
              : es
                ? 'Buscando iglesias y asambleas cristianas…'
                : 'Finding Christian churches and assemblies…'}
          </p>
        )}

        {error && !loading && (
          <p className="text-[11px] text-[var(--sage)] leading-relaxed">{error}</p>
        )}

        {churches.length > 0 && (
          <ul className="space-y-1.5 max-h-56 overflow-y-auto">
            {churches.map((c) => (
              <li key={c.id}>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${c.lat}&mlon=${c.lon}#map=17/${c.lat}/${c.lon}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 rounded-lg border border-[var(--border-soft)] px-2.5 py-2 hover:border-[var(--border-strong)] transition"
                >
                  <span className="text-[var(--accent)] text-sm shrink-0" aria-hidden>
                    ✝
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-white leading-snug">
                      {c.name}
                    </p>
                    <p className="text-[10px] text-[var(--sage)]/80 mt-0.5 line-clamp-2">
                      {[
                        c.distanceM != null
                          ? formatDistance(c.distanceM, es)
                          : null,
                        c.denomination,
                        c.address,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  <span className="text-[var(--sage)] text-xs shrink-0">↗</span>
                </a>
              </li>
            ))}
          </ul>
        )}

        <a
          href={mapLink}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary w-full text-center text-xs py-2.5 min-h-[40px]"
        >
          {es ? 'Abrir mapa completo ↗' : 'Open full map ↗'}
        </a>
      </div>
    </section>
  );
}
