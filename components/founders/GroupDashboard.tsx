'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LiveCapsule, LiveDashboard, LiveYacht } from '@/lib/founders/types';

const VIEWS = ['grupo', 'salvazion', 'kaenz', 'mapucoin'] as const;
type View = (typeof VIEWS)[number];

const LAND_ORDER = [
  'Desiertos',
  'Playas',
  'Viñedos',
  'Volcanes',
  'Ríos',
  'Lagos',
  'Bosques',
  'Nieve',
  'Parques Nacionales',
];

const LAND_COLOR: Record<string, string> = {
  Desiertos: '#e0a15a',
  Playas: '#3ec6ef',
  Viñedos: '#d36b8c',
  Volcanes: '#e07a45',
  Ríos: '#6db3c9',
  Lagos: '#6d8fd6',
  Bosques: '#8fb56a',
  Nieve: '#d5dbe3',
  'Parques Nacionales': '#8fd99a',
};

const PILLARS = [
  { key: 'freedom', name: 'Freedom', color: '#8fd99a' },
  { key: 'salvation', name: 'Salvation', color: '#e4c98a' },
  { key: 'health', name: 'Health', color: '#f0b39a' },
] as const;

const POLAR_CLP = 800_000;

function isPolar(capsule: LiveCapsule): boolean {
  return capsule.price >= POLAR_CLP || /polar/i.test(capsule.name);
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function clp(n: number): string {
  return '$' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function usd(n: number, digits = 0): string {
  const neg = n < 0;
  const [whole, frac] = Math.abs(n).toFixed(digits).split('.');
  const body = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return 'US$' + (neg ? '-' : '') + body + (frac ? ',' + frac : '');
}

function pct(part: number, total: number): string {
  if (total <= 0) return '0,0%';
  return ((part / total) * 100).toFixed(1).replace('.', ',') + '%';
}

function int(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function barWidth(value: number, max: number): string {
  if (max <= 0 || value <= 0) return '0%';
  return `${Math.max(1.2, Math.min(100, (value / max) * 100))}%`;
}

function readStamp(iso: string): string {
  const when = new Date(iso);
  if (Number.isNaN(when.getTime())) return 'Lectura sin fecha';
  const label = new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/Santiago',
  }).format(when);
  return `Leído ahora · ${label}`;
}

function isDashboard(value: unknown): value is LiveDashboard {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<LiveDashboard>;
  return typeof row.fetchedAt === 'string' && Boolean(row.salvazion && row.kaenz && row.mapucoin);
}

export default function GroupDashboard({ initial }: { initial: LiveDashboard }) {
  const [data, setData] = useState(initial);
  const [stale, setStale] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState<View>('grupo');
  const [trips, setTrips] = useState(4);
  const [occupancy, setOccupancy] = useState(40);
  const [landFilter, setLandFilter] = useState('Todos');
  const [hidePolar, setHidePolar] = useState(true);
  const [sortKey, setSortKey] = useState<'price' | 'name' | 'land'>('price');
  const [yachtName, setYachtName] = useState<string | null>(null);
  const [capsuleName, setCapsuleName] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/founders/dashboard', { cache: 'no-store' });
      if (res.status === 401) {
        window.location.assign('/auth/login?next=/dashboard');
        return;
      }
      if (!res.ok) {
        setStale(true);
        return;
      }
      const next: unknown = await res.json();
      if (!isDashboard(next)) {
        setStale(true);
        return;
      }
      setData(next);
      setStale(false);
    } catch {
      setStale(true);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const fromHash = window.location.hash.replace('#', '') as View;
    if (VIEWS.includes(fromHash)) setView(fromHash);
    const onHash = () => {
      const next = window.location.hash.replace('#', '') as View;
      setView(VIEWS.includes(next) ? next : 'grupo');
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    const tick = window.setInterval(() => {
      if (document.visibilityState === 'visible') void reload();
    }, 60_000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void reload();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(tick);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [reload]);

  function openView(next: View) {
    setView(next);
    const hash = `#${next}`;
    if (window.location.hash !== hash) {
      history.replaceState(null, '', hash);
    }
  }

  const fx = data.fx.clpPerUsd;
  const articles = data.salvazion.articles;
  const yachts = data.kaenz.yachts;
  const capsules = data.mapucoin.capsules;
  const monthly = data.salvazion.premiumMonthly;
  const annual = data.salvazion.premiumAnnual;
  const yearAtMonthly = monthly * 12;
  const annualMonth = annual / 12;
  const save = yearAtMonthly - annual;
  const savePct = yearAtMonthly > 0 ? Math.round((save / yearAtMonthly) * 100) : 0;

  const prices = capsules.map((item) => item.price);
  const nightMedian = median(prices);
  const nightSum = prices.reduce((sum, price) => sum + price, 0);
  const nightAvg = prices.length ? nightSum / prices.length : null;
  const withoutPolar = capsules.filter((item) => !isPolar(item));
  const avgNoPolar = withoutPolar.length
    ? withoutPolar.reduce((sum, item) => sum + item.price, 0) / withoutPolar.length
    : null;
  const beds = capsules.reduce((sum, item) => sum + item.guests, 0);
  const yachtSum = yachts.reduce((sum, yacht) => sum + yacht.price, 0);
  const yachtAvg = yachts.length ? yachtSum / yachts.length : null;
  const guestsAtOnce = yachts.reduce((sum, yacht) => sum + yacht.guests, 0);

  const pillarTotal = articles.freedom + articles.salvation + articles.health;
  const donut = useMemo(() => {
    if (pillarTotal <= 0) return 'rgba(244,240,230,0.12)';
    let cursor = 0;
    const stops = PILLARS.map((pillar) => {
      const start = cursor;
      cursor += (articles[pillar.key] / pillarTotal) * 360;
      return `${pillar.color} ${start}deg ${cursor}deg`;
    });
    return `conic-gradient(${stops.join(', ')})`;
  }, [articles, pillarTotal]);

  const lands = useMemo(() => {
    const seen = new Set<string>(LAND_ORDER);
    for (const capsule of capsules) {
      if (!seen.has(capsule.land)) seen.add(capsule.land);
    }
    return [...seen];
  }, [capsules]);

  const landStats = lands.map((land) => {
    const group = capsules.filter((item) => item.land === land);
    return {
      land,
      n: group.length,
      median: median(group.map((item) => item.price)),
    };
  });

  useEffect(() => {
    if (!yachts.length) {
      setYachtName(null);
      return;
    }
    if (!yachts.some((yacht) => yacht.name === yachtName)) {
      const preferred = yachts.find((yacht) => yacht.name === 'Galeon') || yachts[0];
      setYachtName(preferred.name);
    }
  }, [yachts, yachtName]);

  useEffect(() => {
    if (!capsules.length) {
      setCapsuleName(null);
      return;
    }
    if (!capsules.some((item) => item.name === capsuleName)) {
      const preferred =
        capsules.find((item) => item.name === 'Cápsula Atacama Star') || capsules[0];
      setCapsuleName(preferred.name);
    }
  }, [capsules, capsuleName]);

  const yacht = yachts.find((item) => item.name === yachtName) || null;
  const capsule = capsules.find((item) => item.name === capsuleName) || null;

  const visibleCapsules = capsules
    .filter((item) => landFilter === 'Todos' || item.land === landFilter)
    .sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name, 'es');
      if (sortKey === 'land') return a.land.localeCompare(b.land, 'es') || a.price - b.price;
      return a.price - b.price;
    });
  const scaleCapsules = hidePolar
    ? visibleCapsules.filter((item) => !isPolar(item))
    : visibleCapsules;
  const capsuleMax = Math.max(
    ...(scaleCapsules.length ? scaleCapsules : visibleCapsules).map((item) => item.price),
    0
  );

  const floor = capsules.reduce<LiveCapsule | null>(
    (best, item) => (!best || item.price < best.price ? item : best),
    null
  );
  const polarCapsules = capsules.filter(isPolar);
  const polarShare = nightSum > 0 ? polarCapsules.reduce((sum, item) => sum + item.price, 0) / nightSum : 0;
  const parkHomes = capsules.filter((item) => item.land === 'Parques Nacionales');
  const medianRank =
    nightMedian == null
      ? null
      : [...prices].sort((a, b) => a - b).findIndex((price) => price >= nightMedian) + 1;

  const nightUsd = nightMedian != null && fx ? nightMedian / fx : null;
  const premiumMonths =
    nightUsd != null && monthly > 0 ? (nightUsd / monthly).toFixed(1).replace('.', ',') : null;
  const yachtMonths =
    yachtAvg != null && monthly > 0 ? Math.round(yachtAvg / monthly) : null;

  const scaleRows = [
    { label: 'Premium · un mes', value: monthly, cls: 's', text: usd(monthly) },
    nightUsd != null
      ? { label: 'Mapucoin · noche mediana', value: nightUsd, cls: 'm', text: usd(nightUsd) }
      : null,
    yachtAvg != null
      ? { label: 'Kaenz · salida de entrada', value: yachtAvg, cls: 'k', text: usd(yachtAvg) }
      : null,
  ].filter((row): row is { label: string; value: number; cls: string; text: string } => Boolean(row));
  const scaleMax = Math.max(...scaleRows.map((row) => row.value), 0);

  const monthCatalog = nightSum * 30 * (occupancy / 100);
  const smallest = [...PILLARS].sort((a, b) => articles[a.key] - articles[b.key])[0];

  return (
    <div className="founders-dash">
      <div className="wrap">
        <div className="topline" aria-hidden="true">
          <span className="s" />
          <span className="k" />
          <span className="m" />
        </div>
        <header className="mast">
          <div>
            <p className="eyebrow">Salvazion, Inc.</p>
            <h1>Qué está listo para cobrar</h1>
          </div>
          <p className="asof">
            {readStamp(data.fetchedAt)}
            {stale ? ' · la última lectura sigue en pantalla' : ''}
            <br />
            <button className="chip" type="button" onClick={() => void reload()} disabled={refreshing}>
              {refreshing ? 'Leyendo…' : 'Actualizar'}
            </button>
          </p>
        </header>
        <p className="note">
          Salvazion, Kaenz y Mapucoin. Este tablero lee el archivo de Salvazion, las APIs públicas de
          Kaenz y Mapucoin, el dólar observado y el mint en DexScreener. Las visitas están en Web
          Analytics. Las ventas están en Stripe.
        </p>

        <nav className="tabs" aria-label="Plataformas">
          {(
            [
              ['grupo', 'Grupo', ''],
              ['salvazion', 'Salvazion', 's'],
              ['kaenz', 'Kaenz', 'k'],
              ['mapucoin', 'Mapucoin', 'm'],
            ] as const
          ).map(([id, label, tone]) => (
            <button
              key={id}
              className="tab"
              type="button"
              aria-selected={view === id}
              onClick={() => openView(id)}
            >
              {tone ? <i className={`dot ${tone}`} /> : null}
              {label}
            </button>
          ))}
        </nav>

        <section className={view === 'grupo' ? 'panel active' : 'panel'} aria-label="Grupo">
          <div className="hero-nums">
            <article className="plate">
              <span className="kicker">Salvazion · suscripción</span>
              <div className="figure">
                {usd(monthly)}
                <small>/mes</small>
              </div>
              <div className="sub">
                {usd(annual)} al año, {usd(annualMonth)} al mes si se paga el año.
              </div>
            </article>
            <article className="plate">
              <span className="kicker">Mapucoin · noche mediana</span>
              <div className="figure">{nightUsd != null ? usd(nightUsd) : '—'}</div>
              <div className="sub">
                {nightMedian == null
                  ? 'El catálogo de Mapucoin no respondió en esta lectura.'
                  : fx
                    ? `${clp(nightMedian)} CLP. La mitad de las cápsulas cobra eso o menos.`
                    : `${clp(nightMedian)} CLP. El dólar observado no respondió en esta lectura.`}
              </div>
              {premiumMonths ? (
                <div className="multiple">{premiumMonths} meses de Premium equivalen a esa noche.</div>
              ) : null}
            </article>
            <article className="plate">
              <span className="kicker">Kaenz · salida de entrada</span>
              <div className="figure">{yachtAvg != null ? usd(yachtAvg) : '—'}</div>
              <div className="sub">
                {yachtAvg == null
                  ? 'La API de yates no respondió en esta lectura.'
                  : `Promedio del mínimo publicado en ${yachts.length === 1 ? '1 yate' : `${yachts.length} yates`}.`}
              </div>
              {yachtMonths != null ? (
                <div className="multiple">{yachtMonths} meses de Premium equivalen a una salida.</div>
              ) : null}
            </article>
          </div>

          <div className="section">
            <div className="section-head">
              <h2>La misma escala</h2>
              <p>Un mes de Premium, una noche mediana y una salida al precio de entrada. La barra es lineal.</p>
            </div>
            <div className="bars">
              {scaleRows.map((row) => (
                <div className="bar-row" key={row.label} style={{ cursor: 'default' }}>
                  <span className="bar-name">{row.label}</span>
                  <span className="track">
                    <span className={`fill ${row.cls}`} style={{ width: barWidth(row.value, scaleMax) }} />
                  </span>
                  <span className="bar-val">{row.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="cols-3">
            <article className="brand-card">
              <header>
                <h3>
                  <i className="dot s" /> Salvazion
                </h3>
                <a href="https://salvazion.org/" target="_blank" rel="noopener noreferrer">
                  salvazion.org
                </a>
              </header>
              <ul className="stat-list">
                <li>
                  <span>Artículos</span>
                  <strong>{int(articles.total)}</strong>
                </li>
                <li>
                  <span>Freedom en el archivo</span>
                  <strong>{pct(articles.freedom, articles.total || pillarTotal)}</strong>
                </li>
                <li>
                  <span>Health en el archivo</span>
                  <strong>{pct(articles.health, articles.total || pillarTotal)}</strong>
                </li>
                <li>
                  <span>Himnos en el índice</span>
                  <strong>{int(data.salvazion.hymns)}</strong>
                </li>
              </ul>
              <p className="read">
                El producto se sostiene en tres pilares. El archivo publicado se inclina a Freedom.
              </p>
            </article>
            <article className="brand-card">
              <header>
                <h3>
                  <i className="dot k" /> Kaenz
                </h3>
                <a href="https://kaenz.com/fleet" target="_blank" rel="noopener noreferrer">
                  kaenz.com
                </a>
              </header>
              <ul className="stat-list">
                <li>
                  <span>Yates con precio</span>
                  <strong>{data.kaenz.ok ? int(yachts.length) : '—'}</strong>
                </li>
                <li>
                  <span>Huéspedes a la vez</span>
                  <strong>{data.kaenz.ok ? int(guestsAtOnce) : '—'}</strong>
                </li>
                <li>
                  <span>Marinas en el mapa</span>
                  <strong>{data.kaenz.mapHubs != null ? int(data.kaenz.mapHubs) : '—'}</strong>
                </li>
                <li>
                  <span>Marinas en el checkout</span>
                  <strong>{data.kaenz.ok ? int(data.kaenz.checkoutMarinas.length) : '—'}</strong>
                </li>
              </ul>
              <p className="read">
                {data.kaenz.ok
                  ? 'El mapa es mundial. Los yates con precio salen de las marinas del checkout.'
                  : 'Kaenz no respondió en esta lectura.'}
              </p>
            </article>
            <article className="brand-card">
              <header>
                <h3>
                  <i className="dot m" /> Mapucoin
                </h3>
                <a href="https://mapucoin.com/" target="_blank" rel="noopener noreferrer">
                  mapucoin.com
                </a>
              </header>
              <ul className="stat-list">
                <li>
                  <span>Cápsulas con tarifa</span>
                  <strong>{data.mapucoin.ok ? int(capsules.length) : '—'}</strong>
                </li>
                <li>
                  <span>Camas publicadas</span>
                  <strong>{data.mapucoin.ok ? int(beds) : '—'}</strong>
                </li>
                <li>
                  <span>Destinos / áreas protegidas</span>
                  <strong>
                    {data.mapucoin.ok
                      ? `${int(data.mapucoin.destinations)} / ${int(data.mapucoin.parks)}`
                      : '—'}
                  </strong>
                </li>
                <li>
                  <span>Partners aprobados</span>
                  <strong>{data.mapucoin.partners == null ? '—' : int(data.mapucoin.partners)}</strong>
                </li>
              </ul>
              <p className="read">
                {data.mapucoin.ok
                  ? `Hay cápsula en ${lands.filter((land) => capsules.some((item) => item.land === land)).length} paisajes.`
                  : 'Mapucoin no respondió en esta lectura.'}
              </p>
            </article>
          </div>

          <div className="section">
            <div className="section-head">
              <h2>Fuentes de esta lectura</h2>
              <p>Cada cifra sale de la respuesta de ahora. Una fuente caída se queda en blanco.</p>
            </div>
            <div className="ops">
              <article className={data.kaenz.ok ? 'op ok' : 'op warn'}>
                <span>Kaenz</span>
                <b>{data.kaenz.ok ? 'En vivo' : 'Sin respuesta'}</b>
                <span>kaenz.com/api/yachts y /api/marinas</span>
              </article>
              <article className={data.mapucoin.ok ? 'op ok' : 'op warn'}>
                <span>Mapucoin</span>
                <b>{data.mapucoin.ok ? 'En vivo' : 'Sin respuesta'}</b>
                <span>mapucoin.com/api/catalog</span>
              </article>
              <article className={fx ? 'op ok' : 'op warn'}>
                <span>Dólar observado</span>
                <b>{fx ? fx.toFixed(2).replace('.', ',') : 'Sin cotización'}</b>
                <span>mindicador.cl</span>
              </article>
              <article className={data.token.paired ? 'op ok' : 'op warn'}>
                <span>$SALVAZION</span>
                <b>
                  {data.token.paired
                    ? data.token.priceUsd != null
                      ? usd(data.token.priceUsd, 4)
                      : 'Con par'
                    : 'Sin par'}
                </b>
                <span>DexScreener, mint publicado.</span>
              </article>
            </div>
          </div>
        </section>

        <section className={view === 'salvazion' ? 'panel active' : 'panel'} aria-label="Salvazion">
          <div className="section-head">
            <div>
              <p className="eyebrow">Plataforma · salvazion.org</p>
              <h2>Suscripción y archivo</h2>
            </div>
            <p>Free abre los tres pilares con un límite diario de IA. Premium quita el límite y suma wearables en la nube.</p>
          </div>
          <div className="split">
            <article className="brand-card">
              <h3>De qué está hecho el archivo</h3>
              <p className="sub">{int(articles.total)} piezas en la portada, contadas por pilar.</p>
              <div className="donut-wrap" style={{ marginTop: 16 }}>
                <div className="donut" style={{ background: donut }}>
                  <b>{int(articles.total)}</b>
                </div>
                <ul className="legend">
                  {PILLARS.map((pillar) => (
                    <li key={pillar.key}>
                      <i className="sw" style={{ background: pillar.color }} />
                      <span>{pillar.name}</span>
                      <strong>
                        {int(articles[pillar.key])} · {pct(articles[pillar.key], pillarTotal)}
                      </strong>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
            <article className="brand-card">
              <h3>Precio de Premium</h3>
              <div className="price-pair">
                <div>
                  <span className="sub">Mes a mes</span>
                  <div className="figure">{usd(monthly)}</div>
                  <span className="sub">{usd(yearAtMonthly)} si se mantienen 12 meses.</span>
                </div>
                <div>
                  <span className="sub">Año por adelantado</span>
                  <div className="figure">{usd(annual)}</div>
                  <span className="sub">
                    {usd(annualMonth)} al mes. Ahorro de {usd(save)}, un {savePct}%.
                  </span>
                </div>
              </div>
              <ul className="stat-list" style={{ marginTop: 16 }}>
                <li>
                  <span>Idiomas de la interfaz</span>
                  <strong>3</strong>
                </li>
                <li>
                  <span>Biblias</span>
                  <strong>EN, ES, PT, hebreo, griego</strong>
                </li>
                <li>
                  <span>Himnos en el índice</span>
                  <strong>{int(data.salvazion.hymns)}</strong>
                </li>
                <li>
                  <span>Piezas del archivo</span>
                  <strong>{int(articles.total)}</strong>
                </li>
              </ul>
            </article>
          </div>
          <p className="read" style={{ marginTop: 18 }}>
            {smallest.name} es el pilar con menos archivo: {int(articles[smallest.key])} piezas, frente a{' '}
            {PILLARS.filter((pillar) => pillar.key !== smallest.key)
              .map((pillar) => `${int(articles[pillar.key])} de ${pillar.name}`)
              .join(' y ')}
            . El índice de {int(data.salvazion.hymns)} himnos refuerza Salvation por otro canal.
          </p>
        </section>

        <section className={view === 'kaenz' ? 'panel active' : 'panel'} aria-label="Kaenz">
          <div className="section-head">
            <div>
              <p className="eyebrow">Marketplace · kaenz.com</p>
              <h2>
                {data.kaenz.ok
                  ? `${int(yachts.length)} ${yachts.length === 1 ? 'yate' : 'yates'} con precio`
                  : 'Yates con precio'}
              </h2>
            </div>
            <p>Cada uno ofrece Commute, Tour y Special occasion, con capitán y cobro en Stripe. El mínimo publicado es el precio de entrada.</p>
          </div>
          {data.kaenz.ok ? (
            <>
              <div className="cols-2">
                <article className="slider-card">
                  <div className="slider-read">
                    <div>
                      <span className="sub">Escenario de catálogo</span>
                      <div>
                        <strong>{usd(yachtSum * trips)}</strong>
                      </div>
                    </div>
                    <span className="sub">
                      {trips} {trips === 1 ? 'salida por yate' : 'salidas por yate'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={20}
                    value={trips}
                    aria-label="Salidas por yate en el mes"
                    onChange={(event) => setTrips(Number(event.target.value))}
                  />
                  <p className="sub">
                    Si cada yate cierra esas salidas al mínimo publicado. La suma de los mínimos es{' '}
                    {usd(yachtSum)} por vuelta.
                  </p>
                </article>
                <YachtDetail yacht={yacht} />
              </div>
              <div className="section">
                <div className="bars">
                  {yachts.map((item) => (
                    <button
                      key={item.name}
                      className="bar-row"
                      type="button"
                      aria-pressed={item.name === yacht?.name}
                      onClick={() => setYachtName(item.name)}
                    >
                      <span className="bar-name">
                        {item.name}
                        <em>{item.marina}</em>
                      </span>
                      <span className="track">
                        <span
                          className="fill k"
                          style={{ width: barWidth(item.price, yachts[yachts.length - 1]?.price || item.price) }}
                        />
                      </span>
                      <span className="bar-val">{usd(item.price)}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="brand-card">
                <h3>Yield del mínimo publicado</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Yate</th>
                      <th>Base</th>
                      <th className="num">Pies</th>
                      <th className="num">Huéspedes</th>
                      <th className="num">Horas</th>
                      <th className="num">Entrada</th>
                      <th className="num">Por hora</th>
                      <th className="num">Por huésped</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yachts.map((item) => (
                      <tr key={item.name}>
                        <td>{item.name}</td>
                        <td>{item.marina}</td>
                        <td className="num">{item.ft || '—'}</td>
                        <td className="num">{item.guests}</td>
                        <td className="num">{item.hours}</td>
                        <td className="num">{usd(item.price)}</td>
                        <td className="num">{usd(item.price / item.hours)}</td>
                        <td className="num">{usd(item.price / item.guests)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="cols-3" style={{ marginTop: 14 }}>
                <article className="op">
                  <span>Capacidad junta</span>
                  <b>{int(guestsAtOnce)}</b>
                  <span>Huéspedes si los yates con precio salen a la vez.</span>
                </article>
                <article className="op">
                  <span>Checkout</span>
                  <b>
                    {data.kaenz.checkoutMarinas.length}{' '}
                    {data.kaenz.checkoutMarinas.length === 1 ? 'marina' : 'marinas'}
                  </b>
                  <span>{data.kaenz.checkoutMarinas.join(', ') || 'Sin nombres en esta lectura.'}</span>
                </article>
                <article className="op">
                  <span>Mapa</span>
                  <b>{data.kaenz.mapHubs != null ? int(data.kaenz.mapHubs) : '—'}</b>
                  <span>
                    {data.kaenz.mapHubs != null
                      ? 'Marinas y puertos. La oferta con precio sigue en el checkout.'
                      : 'El conteo del mapa no vino en esta lectura.'}
                  </span>
                </article>
              </div>
            </>
          ) : (
            <p className="read">kaenz.com/api/yachts no respondió. Esta pestaña espera la próxima lectura.</p>
          )}
        </section>

        <section className={view === 'mapucoin' ? 'panel active' : 'panel'} aria-label="Mapucoin">
          <div className="section-head">
            <div>
              <p className="eyebrow">Marketplace · mapucoin.com</p>
              <h2>
                {data.mapucoin.ok
                  ? `${int(capsules.length)} ${capsules.length === 1 ? 'cápsula' : 'cápsulas'} con tarifa en CLP`
                  : 'Cápsulas con tarifa en CLP'}
              </h2>
            </div>
            <p>
              {data.mapucoin.ok
                ? `La portada muestra además ${int(data.mapucoin.gastronomy)} platos y tragos y ${int(data.mapucoin.activities)} actividades. Los pagos van por Stripe.`
                : 'La API de catálogo no respondió en esta lectura.'}
            </p>
          </div>
          {data.mapucoin.ok && nightMedian != null && nightAvg != null ? (
            <>
              <div className="hero-nums">
                <article className="plate">
                  <span className="kicker">Mediana</span>
                  <div className="figure">{clp(nightMedian)}</div>
                  <div className="sub">
                    {fx ? `${usd(nightMedian / fx)} · ` : ''}
                    {medianRank ? `${medianRank}ª tarifa de ${capsules.length}` : `${capsules.length} tarifas`}
                  </div>
                </article>
                <article className="plate">
                  <span className="kicker">Promedio</span>
                  <div className="figure">{clp(nightAvg)}</div>
                  <div className="sub">
                    {avgNoPolar != null && polarCapsules.length
                      ? `Sin la tarifa polar, ${clp(avgNoPolar)}.`
                      : 'Todas las tarifas entran en este promedio.'}
                  </div>
                </article>
                <article className="plate">
                  <span className="kicker">Techo de una noche</span>
                  <div className="figure">{clp(nightSum)}</div>
                  <div className="sub">
                    {fx ? `${usd(nightSum / fx)} ` : ''}
                    si las {capsules.length} venden esa noche.
                  </div>
                </article>
              </div>
              <div className="cols-2">
                <article className="slider-card">
                  <div className="slider-read">
                    <div>
                      <span className="sub">Escenario de ocupación</span>
                      <div>
                        <strong>{clp(monthCatalog)}</strong>
                      </div>
                    </div>
                    <span className="sub">{occupancy}% de las noches del mes</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={occupancy}
                    aria-label="Ocupación del mes"
                    onChange={(event) => setOccupancy(Number(event.target.value))}
                  />
                  <p className="sub">
                    {fx ? `${usd(monthCatalog / fx)} al dólar observado. ` : ''}
                    El mes completo del catálogo, al 100%, suma {clp(nightSum * 30)}.
                  </p>
                </article>
                <CapsuleDetail capsule={capsule} fx={fx} />
              </div>
              <div className="section">
                <div className="section-head">
                  <h2>Oferta por paisaje</h2>
                  <p>El paisaje es el primero que publica cada cápsula. Varias casas cruzan un segundo paisaje.</p>
                </div>
                <div className="bars">
                  {landStats.map((stat) => (
                    <button
                      key={stat.land}
                      className="land-row"
                      type="button"
                      aria-pressed={landFilter === stat.land}
                      onClick={() =>
                        setLandFilter((current) => (current === stat.land ? 'Todos' : stat.land))
                      }
                    >
                      <span className="bar-name">
                        {stat.land}
                        <em>{stat.median != null ? `mediana ${clp(stat.median)}` : 'sin cápsulas'}</em>
                      </span>
                      <span className="track">
                        <span
                          className="fill"
                          style={{
                            width: barWidth(stat.n, Math.max(...landStats.map((item) => item.n), 0)),
                            background: LAND_COLOR[stat.land] || '#a39c91',
                          }}
                        />
                      </span>
                      <span className="bar-val">
                        {stat.n} {stat.n === 1 ? 'cápsula' : 'cápsulas'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="section">
                <div className="section-head">
                  <h2>Tarifa de cada cápsula</h2>
                  <p>
                    {visibleCapsules.length}{' '}
                    {visibleCapsules.length === 1 ? 'cápsula en vista.' : 'cápsulas en vista.'}
                  </p>
                </div>
                <div className="tools">
                  {['Todos', ...lands].map((land) => (
                    <button
                      key={land}
                      className="chip"
                      type="button"
                      aria-pressed={landFilter === land}
                      onClick={() => setLandFilter(land)}
                    >
                      {land}
                    </button>
                  ))}
                </div>
                <div className="tools">
                  <button
                    className="chip"
                    type="button"
                    aria-pressed={hidePolar}
                    onClick={() => setHidePolar((value) => !value)}
                  >
                    Ocultar Antártica en la escala
                  </button>
                  <select
                    className="chip"
                    aria-label="Orden"
                    value={sortKey}
                    onChange={(event) => setSortKey(event.target.value as 'price' | 'name' | 'land')}
                  >
                    <option value="price">Precio</option>
                    <option value="name">Nombre</option>
                    <option value="land">Paisaje</option>
                  </select>
                </div>
                <div className="bars">
                  {visibleCapsules.map((item) => (
                    <button
                      key={item.name}
                      className="bar-row"
                      type="button"
                      aria-pressed={item.name === capsule?.name}
                      onClick={() => setCapsuleName(item.name)}
                    >
                      <span className="bar-name">
                        {item.name}
                        <em>
                          {item.place} · {item.land}
                        </em>
                      </span>
                      <span className="track">
                        <span
                          className="fill"
                          style={{
                            width: barWidth(item.price, capsuleMax),
                            background: LAND_COLOR[item.land] || '#a39c91',
                          }}
                        />
                      </span>
                      <span className="bar-val">{clp(item.price)}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="cols-3">
                <article className="op">
                  <span>Piso</span>
                  <b>{floor ? clp(floor.price) : '—'}</b>
                  <span>
                    {floor ? `${floor.name}, ${floor.place}. ${floor.land}.` : 'Sin tarifa en esta lectura.'}
                  </span>
                </article>
                <article className="op">
                  <span>Antártica</span>
                  <b>{polarCapsules.length ? pct(polarShare * 100, 100) : '—'}</b>
                  <span>
                    {polarCapsules.length
                      ? `${polarCapsules.map((item) => item.name).join(', ')}, ${clp(polarCapsules[0].price)}, es esa parte del techo de una noche.`
                      : 'Ninguna tarifa polar en esta lectura.'}
                  </span>
                </article>
                <article className="op">
                  <span>Parques</span>
                  <b>
                    {parkHomes.length} {parkHomes.length === 1 ? 'casa' : 'casas'}
                  </b>
                  <span>
                    {int(data.mapucoin.parks)} áreas protegidas en el mapa.
                    {parkHomes.length
                      ? ` ${parkHomes.map((item) => item.name).join(', ')} publica ese paisaje primero.`
                      : ' Ninguna cápsula publica ese paisaje primero.'}
                  </span>
                </article>
              </div>
            </>
          ) : (
            <p className="read">mapucoin.com/api/catalog no respondió. Esta pestaña espera la próxima lectura.</p>
          )}
        </section>

        <footer>
          <p>
            Fuentes de esta lectura: archivo local de{' '}
            <a href="https://salvazion.org/">salvazion.org</a>,{' '}
            <a href="https://kaenz.com/api/yachts">kaenz.com/api/yachts</a>,{' '}
            <a href="https://kaenz.com/api/marinas">kaenz.com/api/marinas</a>,{' '}
            <a href="https://mapucoin.com/api/catalog">mapucoin.com/api/catalog</a>,{' '}
            <a href="https://mapucoin.com/api/partners/approved">/api/partners/approved</a>, DexScreener y
            el dólar observado en mindicador.cl. Los escenarios de ocupación y de salidas describen el
            catálogo publicado. Las ventas están en Stripe.
          </p>
        </footer>
      </div>
    </div>
  );
}

function YachtDetail({ yacht }: { yacht: LiveYacht | null }) {
  if (!yacht) {
    return (
      <article className="detail">
        <p className="sub">Elige un yate.</p>
      </article>
    );
  }
  return (
    <article className="detail">
      <span className="kicker">{yacht.kind || 'Yate'}</span>
      <h3 style={{ fontFamily: 'var(--font-fraunces), Georgia, serif', fontSize: '1.8rem', marginTop: 6 }}>
        {yacht.name}
      </h3>
      <div className="figure">{usd(yacht.price)}</div>
      <p className="sub">
        {yacht.marina}
        {yacht.captain ? ` · capitán ${yacht.captain}` : ''}
      </p>
      <div className="meta">
        {yacht.ft ? <span className="pill">{yacht.ft} ft</span> : null}
        <span className="pill">{yacht.guests} huéspedes</span>
        <span className="pill">{yacht.hours} h mínimas</span>
        <span className="pill">{usd(yacht.price / yacht.hours)} / h</span>
        <span className="pill">{usd(yacht.price / yacht.guests)} / huésped</span>
      </div>
    </article>
  );
}

function CapsuleDetail({ capsule, fx }: { capsule: LiveCapsule | null; fx: number | null }) {
  if (!capsule) {
    return (
      <article className="detail">
        <p className="sub">Elige una cápsula.</p>
      </article>
    );
  }
  return (
    <article className="detail">
      <span className="kicker">{capsule.place}</span>
      <h3 style={{ fontFamily: 'var(--font-fraunces), Georgia, serif', fontSize: '1.8rem', marginTop: 6 }}>
        {capsule.name}
      </h3>
      <div className="figure">{clp(capsule.price)}</div>
      <p className="sub">
        {fx ? `${usd(capsule.price / fx)} al dólar observado · ` : ''}
        hasta {capsule.guests} viajeros
      </p>
      <div className="meta">
        {capsule.lands.map((land) => (
          <span className="pill" key={land}>
            {land}
          </span>
        ))}
      </div>
    </article>
  );
}
