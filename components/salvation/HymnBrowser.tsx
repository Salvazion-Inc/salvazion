'use client';

import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/components/I18nProvider';
import {
  HYMNS,
  HYMNAL_ACQUIRE_URL,
  HYMNAL_NAME,
  filterHymns,
  hymnThemes,
  hymnTitle,
  type HymnRecord,
} from '@/lib/salvation/hymns';

type Panel = 'lyrics' | 'sheet' | 'audio';

function pad(n: number) {
  return String(n).padStart(3, '0');
}

export default function HymnBrowser() {
  const { t, lang } = useI18n();
  const themes = useMemo(() => hymnThemes(), []);
  const [query, setQuery] = useState('');
  const [theme, setTheme] = useState('all');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [panel, setPanel] = useState<Panel>('lyrics');

  useEffect(() => {
    const n = Number(new URLSearchParams(window.location.search).get('n'));
    if (Number.isInteger(n) && HYMNS.some((hymn) => hymn.n === n)) {
      setSelectedId(n);
    }
  }, []);

  const selected = HYMNS.find((hymn) => hymn.n === selectedId) ?? null;
  const visible = useMemo(() => filterHymns(HYMNS, query, theme), [query, theme]);

  function openHymn(hymn: HymnRecord) {
    setSelectedId(hymn.n);
    setPanel('lyrics');
    const url = new URL(window.location.href);
    url.searchParams.set('n', String(hymn.n));
    window.history.replaceState(null, '', url.pathname + url.search);
  }

  function closeHymn() {
    setSelectedId(null);
    window.history.replaceState(null, '', '/hub/hymns');
  }

  if (selected) {
    return (
      <HymnDetail
        hymn={selected}
        panel={panel}
        onPanel={setPanel}
        onBack={closeHymn}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight text-[var(--accent)]">
          {t('hymns.title')}
        </h2>
        <p className="text-sm text-[var(--sage)] mt-1">{t('hymns.subtitle')}</p>
      </div>

      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t('hymns.search')}
        aria-label={t('hymns.search')}
        className="input-soft w-full text-sm py-3"
        inputMode="search"
      />

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        <ThemeChip
          active={theme === 'all'}
          label={t('hymns.allThemes')}
          onClick={() => setTheme('all')}
        />
        {themes.map((item) => (
          <ThemeChip
            key={item}
            active={theme === item}
            label={item}
            onClick={() => setTheme(item)}
          />
        ))}
      </div>

      <p className="text-[11px] uppercase tracking-wider text-[var(--sage)]">
        {t('hymns.shown', { n: visible.length })}
      </p>

      {visible.length === 0 ? (
        <p className="text-sm text-[var(--sage)] glass rounded-2xl p-5">{t('hymns.empty')}</p>
      ) : (
        <ul className="glass rounded-2xl divide-y divide-[var(--border-soft)] overflow-hidden">
          {visible.map((hymn) => {
            const title = hymnTitle(hymn, lang);
            const secondary =
              lang === 'es'
                ? hymn.en
                : lang === 'en'
                  ? hymn.es
                  : hymn.es;
            return (
              <li key={hymn.n}>
                <button
                  type="button"
                  onClick={() => openHymn(hymn)}
                  className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-white/[0.03] active:bg-white/[0.05]"
                >
                  <span className="tabular-nums text-xs font-semibold text-[var(--accent)] pt-0.5 w-8 shrink-0">
                    {pad(hymn.n)}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-white leading-snug">
                      {title}
                    </span>
                    {secondary && secondary !== title ? (
                      <span className="block text-xs text-[var(--sage)] mt-0.5 leading-snug">
                        {secondary}
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ThemeChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-active={active ? 'true' : 'false'}
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold border ${
        active
          ? 'border-[var(--pillar-salvation)] text-white bg-[color-mix(in_srgb,var(--pillar-salvation)_22%,transparent)]'
          : 'border-[var(--border-soft)] text-[var(--sage)]'
      }`}
    >
      {label}
    </button>
  );
}

function HymnDetail({
  hymn,
  panel,
  onPanel,
  onBack,
}: {
  hymn: HymnRecord;
  panel: Panel;
  onPanel: (panel: Panel) => void;
  onBack: () => void;
}) {
  const { t, lang } = useI18n();
  const title = hymnTitle(hymn, lang);
  const facts = [
    [t('hymns.author'), hymn.author],
    [t('hymns.composer'), hymn.music],
    [t('hymns.translator'), hymn.translator],
    [t('hymns.tune'), hymn.tune],
    [t('hymns.meter'), hymn.meter],
    [t('hymns.key'), hymn.key],
    [t('hymns.tempo'), hymn.tempo],
    [t('hymns.theme'), [hymn.theme, hymn.subtheme].filter(Boolean).join(' · ')],
  ].filter((row): row is [string, string] => Boolean(row[1]));

  const panels: { id: Panel; label: string }[] = [
    { id: 'lyrics', label: t('hymns.lyrics') },
    { id: 'sheet', label: t('hymns.sheet') },
    { id: 'audio', label: t('hymns.audio') },
  ];

  return (
    <article className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="text-sm font-semibold text-[var(--accent)]"
      >
        ← {t('hymns.backToList')}
      </button>

      <header>
        <p className="text-[11px] uppercase tracking-wider text-[var(--accent)]">
          {pad(hymn.n)} · {HYMNAL_NAME}
        </p>
        <h2 className="font-display text-2xl font-bold tracking-tight text-white mt-1 text-balance">
          {title}
        </h2>
      </header>

      <dl className="glass rounded-2xl p-4 space-y-2 text-sm">
        <TitleRow label={t('hymns.spanish')} value={hymn.es} />
        {hymn.en ? <TitleRow label={t('hymns.english')} value={hymn.en} /> : null}
        {hymn.pt ? <TitleRow label={t('hymns.portuguese')} value={hymn.pt} /> : null}
      </dl>

      {facts.length > 0 ? (
        <dl className="grid grid-cols-2 gap-x-3 gap-y-3">
          {facts.map(([label, value]) => (
            <div key={label} className="min-w-0">
              <dt className="text-[10px] uppercase tracking-wider text-[var(--sage)]">{label}</dt>
              <dd className="text-sm text-white leading-snug mt-0.5">{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {hymn.verses && hymn.verses.length > 0 ? (
        <p className="text-xs text-[var(--sage)]">
          <span className="uppercase tracking-wider">{t('hymns.verses')}</span>
          {' · '}
          {hymn.verses.join(' · ')}
        </p>
      ) : null}

      <div
        className="tabs-x"
        role="tablist"
        aria-label={title}
        style={{ ['--tab-accent' as string]: 'var(--pillar-salvation)' }}
      >
        {panels.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            data-active={panel === item.id}
            aria-selected={panel === item.id}
            onClick={() => onPanel(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {panel === 'lyrics' ? (
        <PanelCard
          note={t('hymns.lyricsNote')}
          href={hymn.url}
          cta={t('hymns.openLyrics')}
        />
      ) : null}

      {panel === 'sheet' ? (
        <PanelCard
          note={t('hymns.sheetNote')}
          href={hymn.scorePage || HYMNAL_ACQUIRE_URL}
          cta={hymn.scorePage ? t('hymns.openSheet') : t('hymns.buy')}
          secondaryHref={hymn.scorePage ? HYMNAL_ACQUIRE_URL : undefined}
          secondaryLabel={hymn.scorePage ? t('hymns.buy') : undefined}
        />
      ) : null}

      {panel === 'audio' ? (
        <PanelCard
          note={t('hymns.audioNote')}
          href={hymn.url}
          cta={t('hymns.openAudio')}
        />
      ) : null}
    </article>
  );
}

function TitleRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <dt className="w-20 shrink-0 text-[10px] uppercase tracking-wider text-[var(--sage)] pt-0.5">
        {label}
      </dt>
      <dd className="text-white leading-snug">{value}</dd>
    </div>
  );
}

function PanelCard({
  note,
  href,
  cta,
  secondaryHref,
  secondaryLabel,
}: {
  note: string;
  href: string;
  cta: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <div className="glass rounded-2xl p-4 space-y-3">
      <p className="text-sm text-[#D8E1D9]/85 leading-relaxed">{note}</p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary w-full min-h-[3rem] inline-flex items-center justify-center text-center"
      >
        {cta}
      </a>
      {secondaryHref && secondaryLabel ? (
        <a
          href={secondaryHref}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary w-full min-h-[2.75rem] inline-flex items-center justify-center text-center"
        >
          {secondaryLabel}
        </a>
      ) : null}
    </div>
  );
}
