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
};

type Geo = { lat: number; lon: number; label: string };

/**
 * Christian churches near the user's city (Freedom · Connect).
 * Uses Nominatim + Overpass (OpenStreetMap) — free, no API key.
 */
export default function ChurchesMapPanel({ className = '' }: { className?: string }) {
  const { lang } = useI18n();
  const es = lang !== 'en';
  const [geo, setGeo] = useState<Geo | null>(null);
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [queryCity, setQueryCity] = useState('');

  const profilePlace = useMemo(() => {
    const p = loadProfile();
    const parts = [p?.city, p?.country].filter(Boolean);
    return parts.join(', ');
  }, []);

  const search = useCallback(async (place: string) => {
    const q = place.trim();
    if (!q) {
      setError(
        es
          ? 'Indica tu ciudad en el perfil para buscar iglesias.'
          : 'Set your city in the profile to find churches.'
      );
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setChurches([]);
    try {
      // 1) Geocode city
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
      setGeo({ lat, lon, label });

      // 2) Overpass: Christian places of worship within ~8km
      const radius = 8000;
      const overpass = `
[out:json][timeout:25];
(
  node["amenity"="place_of_worship"]["religion"="christian"](around:${radius},${lat},${lon});
  way["amenity"="place_of_worship"]["religion"="christian"](around:${radius},${lat},${lon});
  node["amenity"="place_of_worship"]["religion"~"christian|catholic|protestant|evangelical|orthodox",i](around:${radius},${lat},${lon});
  way["building"="church"](around:${radius},${lat},${lon});
);
out center 40;
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
        list.push({
          id: `${el.type}-${el.id}`,
          name,
          lat: clat,
          lon: clon,
          denomination:
            tags.denomination || tags.religion || tags.operator || undefined,
          address: [tags['addr:street'], tags['addr:housenumber'], tags['addr:city']]
            .filter(Boolean)
            .join(' ')
            .trim() || undefined,
        });
      }
      // Dedupe by name+rounded coords
      const seen = new Set<string>();
      const unique = list.filter((c) => {
        const k = `${c.name}|${c.lat.toFixed(4)}|${c.lon.toFixed(4)}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      setChurches(unique.slice(0, 25));
      if (unique.length === 0) {
        setError(
          es
            ? 'No hay iglesias indexadas cerca. Abre el mapa para buscar manualmente.'
            : 'No churches indexed nearby. Open the map to search manually.'
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
  }, [es]);

  useEffect(() => {
    setQueryCity(profilePlace);
    void search(profilePlace || '');
  }, [profilePlace, search]);

  const mapEmbed =
    geo &&
    `https://www.openstreetmap.org/export/embed.html?bbox=${
      geo.lon - 0.06
    }%2C${geo.lat - 0.04}%2C${geo.lon + 0.06}%2C${
      geo.lat + 0.04
    }&layer=mapnik&marker=${geo.lat}%2C${geo.lon}`;

  const mapLink = geo
    ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(
        `church ${queryCity || geo.label}`
      )}#map=13/${geo.lat}/${geo.lon}`
    : `https://www.openstreetmap.org/search?query=${encodeURIComponent(
        `iglesia cristiana ${queryCity || profilePlace}`
      )}`;

  return (
    <section
      className={`space-y-2.5 ${className}`}
      aria-label={es ? 'Iglesias cristianas' : 'Christian churches'}
    >
      <div className="px-0.5">
        <h2 className="text-sm font-semibold text-[var(--sage)]">
          {es ? 'Iglesias cristianas cerca' : 'Christian churches nearby'}
        </h2>
        <p className="text-[10px] text-[var(--sage)]/70 mt-0.5 leading-relaxed">
          {es
            ? 'Mapa según tu ciudad del perfil · OpenStreetMap'
            : 'Map based on your profile city · OpenStreetMap'}
        </p>
      </div>

      <div className="card-soft p-3 space-y-3 border border-[var(--border-soft)]">
        <div className="flex gap-2">
          <input
            type="text"
            value={queryCity}
            onChange={(e) => setQueryCity(e.target.value)}
            placeholder={
              es ? 'Ciudad, País (ej. Santiago, Chile)' : 'City, Country'
            }
            className="input-soft flex-1 text-sm py-2 min-h-[40px]"
          />
          <button
            type="button"
            className="btn-primary px-3 text-xs min-h-[40px] shrink-0"
            onClick={() => void search(queryCity)}
            disabled={loading}
          >
            {loading
              ? es
                ? '…'
                : '…'
              : es
                ? 'Buscar'
                : 'Search'}
          </button>
        </div>

        {geo && mapEmbed && (
          <div className="rounded-xl overflow-hidden border border-[var(--border-soft)] aspect-[16/10] bg-black">
            <iframe
              title={es ? 'Mapa de iglesias' : 'Churches map'}
              src={mapEmbed}
              className="w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        )}

        {loading && (
          <p className="text-xs text-[var(--sage)] text-center py-2">
            {es ? 'Buscando iglesias…' : 'Finding churches…'}
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
                    {(c.denomination || c.address) && (
                      <p className="text-[10px] text-[var(--sage)]/80 mt-0.5 line-clamp-2">
                        {[c.denomination, c.address].filter(Boolean).join(' · ')}
                      </p>
                    )}
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
