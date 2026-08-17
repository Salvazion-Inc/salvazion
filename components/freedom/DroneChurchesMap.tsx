'use client';

import { useEffect, useRef, useState } from 'react';
import type { Map as MapLibreMap, Marker } from 'maplibre-gl';
import { PILLAR_COLORS } from '@/lib/theme/pillars';

const MAPLIBRE_VER = '5.6.2';
const MAPLIBRE_CSS = `https://cdn.jsdelivr.net/npm/maplibre-gl@${MAPLIBRE_VER}/dist/maplibre-gl.css`;
const MAPLIBRE_JS = `https://cdn.jsdelivr.net/npm/maplibre-gl@${MAPLIBRE_VER}/dist/maplibre-gl.js`;

type MapLibreNS = typeof import('maplibre-gl');

function loadMapLibre(): Promise<MapLibreNS> {
  const w = window as Window & { maplibregl?: MapLibreNS };
  if (w.maplibregl) return Promise.resolve(w.maplibregl);

  return new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${MAPLIBRE_CSS}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = MAPLIBRE_CSS;
      document.head.appendChild(link);
    }
    const existing = document.querySelector(`script[src="${MAPLIBRE_JS}"]`);
    if (existing) {
      existing.addEventListener('load', () => {
        if (w.maplibregl) resolve(w.maplibregl);
        else reject(new Error('maplibre_missing'));
      });
      existing.addEventListener('error', () => reject(new Error('maplibre_script')));
      return;
    }
    const script = document.createElement('script');
    script.src = MAPLIBRE_JS;
    script.async = true;
    script.onload = () => {
      if (w.maplibregl) resolve(w.maplibregl);
      else reject(new Error('maplibre_missing'));
    };
    script.onerror = () => reject(new Error('maplibre_script'));
    document.head.appendChild(script);
  });
}
import {
  type ChurchPlace,
  denomFamilyLabel,
  directionsUrl,
  formatDistance,
} from '@/lib/freedom/churches';

export type DroneGeo = {
  lat: number;
  lon: number;
  label: string;
  source: 'gps' | 'city';
};

type Props = {
  geo: DroneGeo;
  churches: ChurchPlace[];
  lang: 'es' | 'en' | 'pt';
  selectedId?: string | null;
  onSelect?: (church: ChurchPlace | null) => void;
  onWebGLUnavailable?: () => void;
};

const FREEDOM = PILLAR_COLORS.freedom;
const DRONE_PITCH = 68;
const DRONE_ZOOM = 15.4;
const CHURCH_ZOOM = 17.15;

export function canUseWebGL(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')
    );
  } catch {
    return false;
  }
}

function droneStyle(): Record<string, unknown> {
  return {
    version: 8,
    sources: {
      esri: {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        maxzoom: 19,
        attribution: 'Esri, Maxar, Earthstar Geographics',
      },
      hillshade: {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        maxzoom: 16,
      },
      places: {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        maxzoom: 19,
      },
      terrain: {
        type: 'raster-dem',
        tiles: [
          'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
        ],
        encoding: 'terrarium',
        tileSize: 256,
        maxzoom: 15,
      },
    },
    layers: [
      { id: 'sat', type: 'raster', source: 'esri' },
      {
        id: 'hs',
        type: 'raster',
        source: 'hillshade',
        paint: { 'raster-opacity': 0.28 },
      },
      { id: 'labels', type: 'raster', source: 'places' },
    ],
  };
}

function makeYouEl(label: string): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'salv-drone-you';
  el.setAttribute('aria-label', label);
  el.innerHTML =
    '<span class="salv-drone-you-pulse"></span><span class="salv-drone-you-core"></span>';
  return el;
}

function makeChurchEl(selected: boolean, name: string): HTMLButtonElement {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = `salv-drone-pin${selected ? ' is-selected' : ''}`;
  el.setAttribute('aria-label', name);
  el.innerHTML = '<span aria-hidden="true"><b>✝</b></span>';
  return el;
}

/**
 * Interactive 360° drone-tilt satellite map of nearby churches.
 */
export default function DroneChurchesMap({
  geo,
  churches,
  lang,
  selectedId = null,
  onSelect,
  onWebGLUnavailable,
}: Props) {
  const tx = (en: string, es: string, pt: string) =>
    lang === 'pt' ? pt : lang === 'es' ? es : en;
  const es = lang === 'es';
  const hostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const youMarkerRef = useRef<Marker | null>(null);
  const orbitRaf = useRef<number | 0>(0);
  const readyRef = useRef(false);
  const selectedRef = useRef(selectedId);
  const churchesRef = useRef(churches);
  const onSelectRef = useRef(onSelect);
  const [orbiting, setOrbiting] = useState(false);
  const [ready, setReady] = useState(false);
  const [bearing, setBearing] = useState(-18);

  selectedRef.current = selectedId;
  churchesRef.current = churches;
  onSelectRef.current = onSelect;

  const stopOrbit = () => {
    if (orbitRaf.current) {
      cancelAnimationFrame(orbitRaf.current);
      orbitRaf.current = 0;
    }
    setOrbiting(false);
  };

  const startOrbit = () => {
    const map = mapRef.current;
    if (!map) return;
    stopOrbit();
    setOrbiting(true);
    const tick = () => {
      const m = mapRef.current;
      if (!m) return;
      const next = m.getBearing() + 0.22;
      m.setBearing(next);
      setBearing(next);
      orbitRaf.current = requestAnimationFrame(tick);
    };
    orbitRaf.current = requestAnimationFrame(tick);
  };

  const flyHome = () => {
    const map = mapRef.current;
    if (!map) return;
    stopOrbit();
    onSelectRef.current?.(null);
    map.flyTo({
      center: [geo.lon, geo.lat],
      zoom: DRONE_ZOOM,
      pitch: DRONE_PITCH,
      bearing: -18,
      duration: 1400,
      essential: true,
    });
  };

  useEffect(() => {
    let cancelled = false;
    let map: MapLibreMap | null = null;
    let ro: ResizeObserver | undefined;
    let removeDragListener: (() => void) | undefined;

    (async () => {
      if (!hostRef.current) return;
      if (!canUseWebGL()) {
        onWebGLUnavailable?.();
        return;
      }

      let maplibregl: MapLibreNS;
      try {
        maplibregl = await loadMapLibre();
      } catch {
        if (!cancelled) onWebGLUnavailable?.();
        return;
      }
      if (cancelled || !hostRef.current) return;

      const created = new maplibregl.Map({
        container: hostRef.current,
        style: droneStyle() as never,
        center: [geo.lon, geo.lat],
        zoom: DRONE_ZOOM,
        pitch: DRONE_PITCH,
        bearing: -18,
        maxPitch: 80,
        minZoom: 10,
        maxZoom: 19,
        attributionControl: false,
        cooperativeGestures: false,
        dragRotate: true,
        touchPitch: true,
      });
      if (cancelled) {
        created.remove();
        return;
      }
      map = created;
      mapRef.current = created;

      created.addControl(
        new maplibregl.NavigationControl({
          visualizePitch: true,
          showZoom: true,
          showCompass: true,
        }),
        'top-right'
      );
      created.addControl(
        new maplibregl.AttributionControl({ compact: true }),
        'bottom-right'
      );

      const onDrag = () => stopOrbit();
      created.on('dragstart', onDrag);
      created.on('rotatestart', onDrag);
      created.on('pitchstart', onDrag);
      created.on('move', () => {
        const m = mapRef.current;
        if (m) setBearing(m.getBearing());
      });
      removeDragListener = () => {
        created.off('dragstart', onDrag);
        created.off('rotatestart', onDrag);
        created.off('pitchstart', onDrag);
      };

      created.on('load', () => {
        if (cancelled) return;
        try {
          created.setTerrain({ source: 'terrain', exaggeration: 1.35 });
        } catch {
          /* DEM optional */
        }
        created.resize();
        const nearby = [...churchesRef.current]
          .sort((a, b) => (a.distanceM ?? 9e9) - (b.distanceM ?? 9e9))
          .slice(0, 6);
        if (nearby.length) {
          let minLat = geo.lat;
          let maxLat = geo.lat;
          let minLon = geo.lon;
          let maxLon = geo.lon;
          for (const c of nearby) {
            minLat = Math.min(minLat, c.lat);
            maxLat = Math.max(maxLat, c.lat);
            minLon = Math.min(minLon, c.lon);
            maxLon = Math.max(maxLon, c.lon);
          }
          created.fitBounds(
            [
              [minLon, minLat],
              [maxLon, maxLat],
            ],
            {
              padding: 64,
              pitch: DRONE_PITCH,
              bearing: -18,
              maxZoom: 16.2,
              duration: 0,
            }
          );
        }
        readyRef.current = true;
        setReady(true);
      });

      ro = new ResizeObserver(() => created.resize());
      ro.observe(hostRef.current);
    })();

    return () => {
      cancelled = true;
      stopOrbit();
      removeDragListener?.();
      ro?.disconnect();
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      youMarkerRef.current?.remove();
      youMarkerRef.current = null;
      map?.remove();
      mapRef.current = null;
      readyRef.current = false;
    };
    // Recreate only when the search origin changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo.lat, geo.lon]);

  // You + church markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    let cancelled = false;

    (async () => {
      const maplibregl = await loadMapLibre();
      if (cancelled || !mapRef.current) return;

      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      youMarkerRef.current?.remove();

      const you = new maplibregl.Marker({
        element: makeYouEl(tx('You', 'Tú', 'Você')),
        anchor: 'center',
      })
        .setLngLat([geo.lon, geo.lat])
        .addTo(map);
      youMarkerRef.current = you;

      const next: Marker[] = [];
      for (const church of churches) {
        const el = makeChurchEl(church.id === selectedId, church.name);
        el.addEventListener('click', (ev) => {
          ev.stopPropagation();
          onSelectRef.current?.(church);
        });
        const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([church.lon, church.lat])
          .addTo(map);
        next.push(marker);
      }
      markersRef.current = next;
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, churches, selectedId, geo.lat, geo.lon, lang]);

  // Fly the drone to the selected church
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !selectedId) return;
    const church = churchesRef.current.find((c) => c.id === selectedId);
    if (!church) return;
    stopOrbit();
    map.flyTo({
      center: [church.lon, church.lat],
      zoom: CHURCH_ZOOM,
      pitch: 72,
      bearing: map.getBearing(),
      duration: 1500,
      essential: true,
    });
  }, [selectedId, ready]);

  const selected = churches.find((c) => c.id === selectedId) || null;

  return (
    <div className="salv-drone-wrap relative overflow-hidden rounded-xl border aspect-auto">
      <div
        ref={hostRef}
        className="salv-drone-canvas w-full"
        style={{ height: 'min(46vh, 420px)', minHeight: 280 }}
        role="application"
        aria-label={tx(
          'Drone map of nearby churches, rotate 360 degrees',
          'Mapa dron de iglesias cercanas, gira 360 grados',
          'Mapa drone de igrejas próximas, gire 360 graus'
        )}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/45 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/55 to-transparent" />

      <div className="absolute top-2 left-2 right-14 flex items-start justify-between gap-2">
        <span
          className="text-[9px] font-semibold uppercase tracking-[0.12em] px-2 py-1 rounded-full border"
          style={{
            color: FREEDOM.text,
            borderColor: FREEDOM.border,
            background: 'rgba(4,4,4,0.72)',
          }}
        >
          {tx('Drone 360°', 'Dron 360°', 'Drone 360°')}
        </span>
        <span
          className="text-[9px] px-2 py-1 rounded-full tabular-nums"
          style={{ color: FREEDOM.muted, background: 'rgba(4,4,4,0.62)' }}
        >
          {Math.round(((bearing % 360) + 360) % 360)}°
        </span>
      </div>

      <div className="absolute bottom-2 left-2 right-2 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          className="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg min-h-[30px]"
          style={{
            background: orbiting ? FREEDOM.solid : 'rgba(4,4,4,0.78)',
            color: orbiting ? '#041008' : FREEDOM.text,
            border: `1px solid ${FREEDOM.border}`,
          }}
          onClick={() => (orbiting ? stopOrbit() : startOrbit())}
        >
          {orbiting
            ? tx('Stop orbit', 'Detener órbita', 'Parar órbita')
            : tx('Orbit 360°', 'Órbita 360°', 'Órbita 360°')}
        </button>
        <button
          type="button"
          className="text-[10px] font-medium px-2.5 py-1.5 rounded-lg min-h-[30px]"
          style={{
            background: 'rgba(4,4,4,0.78)',
            color: FREEDOM.text,
            border: `1px solid ${FREEDOM.border}`,
          }}
          onClick={flyHome}
        >
          {tx('Recenter', 'Centrar', 'Centralizar')}
        </button>
        <span
          className="ml-auto text-[9px] px-2 py-1 rounded-full"
          style={{ color: FREEDOM.muted, background: 'rgba(4,4,4,0.62)' }}
        >
          {tx(
            'Two fingers to spin',
            'Dos dedos para girar',
            'Dois dedos para girar'
          )}
        </span>
      </div>

      {selected ? (
        <div
          className="absolute left-2 right-14 top-10 rounded-lg border px-2.5 py-2"
          style={{
            borderColor: FREEDOM.border,
            background: 'rgba(4,8,5,0.88)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <p className="text-[12px] font-semibold text-white leading-snug">
            {selected.name}
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: FREEDOM.muted }}>
            {[
              selected.distanceM != null
                ? formatDistance(selected.distanceM)
                : null,
              selected.denomination || denomFamilyLabel(selected.family, es),
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
          <a
            href={directionsUrl(selected.lat, selected.lon, selected.name)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex mt-1.5 text-[10px] font-semibold px-2 py-1 rounded-md"
            style={{ background: FREEDOM.solid, color: '#041008' }}
          >
            {tx('Directions', 'Cómo llegar', 'Como chegar')}
          </a>
        </div>
      ) : null}
    </div>
  );
}
