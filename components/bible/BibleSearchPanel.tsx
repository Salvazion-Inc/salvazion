'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  searchVerses,
  concordance,
  formatRef,
  loadRecentSearches,
  pushRecentSearch,
  clearRecentSearches,
  SUGGESTED_SEARCHES,
  SUGGESTED_CONCORDANCE,
  type SearchHit,
  type ConcordanceEntry,
  type CorpusStatus,
  type TestamentFilter,
} from '@/lib/bible/search';
import { BibleLanguage } from '@/lib/bible/types';
import HighlightedText from './HighlightedText';

type Mode = 'search' | 'concordance';

interface Props {
  language: BibleLanguage;
  onOpenVerse: (bookId: string, chapter: number, verse?: number) => void;
}

export default function BibleSearchPanel({ language, onOpenVerse }: Props) {
  const [mode, setMode] = useState<Mode>('search');
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [testament, setTestament] = useState<TestamentFilter>('all');
  const [loading, setLoading] = useState(false);
  const [indexing, setIndexing] = useState<CorpusStatus | null>(null);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [entries, setEntries] = useState<ConcordanceEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const reqId = useRef(0);

  useEffect(() => {
    setRecent(loadRecentSearches());
  }, []);

  // Debounce query
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 320);
    return () => clearTimeout(t);
  }, [query]);

  const run = useCallback(async () => {
    const q = debounced;
    if (q.length < 2) {
      setHits([]);
      setEntries([]);
      setTotal(0);
      setLoading(false);
      setError(null);
      return;
    }

    const id = ++reqId.current;
    setLoading(true);
    setError(null);

    try {
      if (mode === 'search') {
        const res = await searchVerses(q, {
          language,
          testament,
          limit: 60,
          onProgress: (s) => {
            if (id === reqId.current) setIndexing(s);
          },
        });
        if (id !== reqId.current) return;
        setHits(res.hits);
        setEntries([]);
        setTotal(res.total);
        setIndexing(res.status);
        pushRecentSearch(q);
        setRecent(loadRecentSearches());
      } else {
        const res = await concordance(q, {
          language,
          testament,
          limit: 80,
          onProgress: (s) => {
            if (id === reqId.current) setIndexing(s);
          },
        });
        if (id !== reqId.current) return;
        setEntries(res.entries);
        setHits([]);
        setTotal(res.total);
        setIndexing(res.status);
        pushRecentSearch(q);
        setRecent(loadRecentSearches());
      }
    } catch (e) {
      if (id !== reqId.current) return;
      setError(e instanceof Error ? e.message : 'Error al buscar');
      setHits([]);
      setEntries([]);
      setTotal(0);
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [debounced, language, testament, mode]);

  useEffect(() => {
    run();
  }, [run]);

  // Reset results when language changes (corpus is per-lang)
  useEffect(() => {
    setHits([]);
    setEntries([]);
    setTotal(0);
    setIndexing(null);
  }, [language]);

  const placeholder =
    mode === 'search'
      ? language === 'en'
        ? 'Search words or refs (John 3:16)…'
        : 'Busca palabras o refs (Juan 3:16)…'
      : language === 'en'
        ? 'Concordance word…'
        : 'Palabra para concordancia…';

  const suggestions = mode === 'search' ? SUGGESTED_SEARCHES[language] : SUGGESTED_CONCORDANCE[language];
  const showEmpty = debounced.length < 2 && !loading;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Mode toggle */}
      <div className="flex p-1 rounded-2xl bg-[#0a0a0a] border border-[var(--border-soft)] mb-3">
        {(
          [
            { id: 'search' as Mode, label: language === 'en' ? 'Search' : 'Búsqueda', icon: '⌕' },
            {
              id: 'concordance' as Mode,
              label: language === 'en' ? 'Concordance' : 'Concordancia',
              icon: '☰',
            },
          ] as const
        ).map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              mode === m.id
                ? 'bg-[#7BC98A] text-[#040404] shadow-[0_0_20px_rgba(143, 217, 154,0.25)]'
                : 'text-[var(--sage)] hover:text-[#8FD99A]'
            }`}
          >
            <span className="mr-1 opacity-80">{m.icon}</span>
            {m.label}
          </button>
        ))}
      </div>

      {/* Search field */}
      <div className="relative mb-3">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8FD99A] text-lg pointer-events-none">
          ⌕
        </div>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="w-full bg-[#0a0a0a] border border-[var(--border-soft)] focus:border-[#8FD99A] rounded-2xl pl-10 pr-10 py-3.5 text-sm text-[#D8E1D9] placeholder:text-[var(--sage)]/35 outline-none transition-all focus:shadow-[0_0_0_3px_rgba(143, 217, 154,0.12)]"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full text-[var(--sage)] hover:text-[#8FD99A] hover:bg-[var(--surface-active)] text-sm"
            aria-label="Clear"
          >
            ×
          </button>
        )}
      </div>

      {/* Testament filters */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-0.5">
        {(
          [
            { id: 'all' as TestamentFilter, es: 'Toda la Biblia', en: 'Whole Bible' },
            { id: 'OT' as TestamentFilter, es: 'Antiguo', en: 'Old T.' },
            { id: 'NT' as TestamentFilter, es: 'Nuevo', en: 'New T.' },
          ] as const
        ).map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setTestament(f.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] border transition-all ${
              testament === f.id
                ? 'border-[#8FD99A] bg-[var(--surface-active)] text-[#8FD99A]'
                : 'border-[var(--border-soft)] text-[var(--sage)] hover:border-[var(--border-strong)]'
            }`}
          >
            {language === 'en' ? f.en : f.es}
          </button>
        ))}
      </div>

      {/* Indexing progress */}
      {indexing && !indexing.ready && (
        <div className="mb-4 glass rounded-xl px-4 py-3">
          <div className="flex justify-between text-[11px] text-[var(--sage)] mb-1.5">
            <span>{language === 'en' ? 'Indexing Bible…' : 'Indexando Biblia…'}</span>
            <span>
              {indexing.loadedBooks}/{indexing.totalBooks}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--surface-muted)] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#6B8F6E] to-[#8FD99A] transition-all duration-300"
              style={{
                width: `${Math.round((indexing.loadedBooks / indexing.totalBooks) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Results meta */}
      {debounced.length >= 2 && (
        <div className="flex items-center justify-between mb-3 text-[11px] text-[var(--sage)]/80">
          <span>
            {loading
              ? language === 'en'
                ? 'Searching…'
                : 'Buscando…'
              : total === 0
                ? language === 'en'
                  ? 'No results'
                  : 'Sin resultados'
                : language === 'en'
                  ? `${total} verse${total === 1 ? '' : 's'}${total > hits.length + entries.length ? ' (showing top)' : ''}`
                  : `${total} versículo${total === 1 ? '' : 's'}${total > hits.length + entries.length ? ' (mejores)' : ''}`}
          </span>
          {indexing?.ready && (
            <span className="text-[#8FD99A]/50">
              {indexing.verseCount.toLocaleString()} v
            </span>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 rounded-xl px-3 py-2 mb-3">{error}</p>
      )}

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto min-h-0 -mx-1 px-1 pb-4 space-y-2">
        {showEmpty && (
          <div className="space-y-5 pt-1">
            {recent.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[11px] uppercase tracking-wider text-[var(--sage)]/80">
                    {language === 'en' ? 'Recent' : 'Recientes'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      clearRecentSearches();
                      setRecent([]);
                    }}
                    className="text-[10px] text-[var(--sage)]/70 hover:text-[#8FD99A]"
                  >
                    {language === 'en' ? 'Clear' : 'Borrar'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recent.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setQuery(r)}
                      className="px-3 py-1.5 rounded-full border border-[var(--border-soft)] text-xs text-[#D8E1D9]/80 hover:border-[var(--border-strong)] hover:text-[#8FD99A] transition"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h3 className="text-[11px] uppercase tracking-wider text-[var(--sage)]/80 mb-2">
                {mode === 'search'
                  ? language === 'en'
                    ? 'Try searching'
                    : 'Prueba buscar'
                  : language === 'en'
                    ? 'Try a word'
                    : 'Prueba una palabra'}
              </h3>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setQuery(s)}
                    className="px-3.5 py-2 rounded-xl bg-[#7BC98A]/08 border border-[#8FD99A]/25 text-xs text-[#8FD99A] hover:bg-[var(--surface-active)] transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </section>

            <div className="glass rounded-2xl p-5 text-center">
              <div className="text-3xl mb-2 opacity-80">📖</div>
              <p className="text-sm text-[#D8E1D9]/85 font-medium mb-1">
                {mode === 'search'
                  ? language === 'en'
                    ? 'Search the whole Bible'
                    : 'Busca en toda la Biblia'
                  : language === 'en'
                    ? 'Word concordance'
                    : 'Concordancia de palabras'}
              </p>
              <p className="text-xs text-[var(--sage)]/80 leading-relaxed">
                {mode === 'search'
                  ? language === 'en'
                    ? 'Words, phrases in quotes, or references like John 3:16.'
                    : 'Palabras, frases entre comillas, o referencias como Juan 3:16.'
                  : language === 'en'
                    ? 'See every place a word appears, in canonical order.'
                    : 'Ve cada lugar donde aparece una palabra, en orden canónico.'}
              </p>
            </div>
          </div>
        )}

        {loading && debounced.length >= 2 && (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="glass rounded-2xl p-4 animate-pulse"
                style={{ opacity: 1 - i * 0.15 }}
              >
                <div className="h-3 w-24 bg-[#6B8F6E]/25 rounded mb-2" />
                <div className="h-3 w-full bg-[#6B8F6E]/15 rounded mb-1.5" />
                <div className="h-3 w-4/5 bg-[#6B8F6E]/10 rounded" />
              </div>
            ))}
          </div>
        )}

        {!loading && mode === 'search' &&
          hits.map((hit) => (
            <button
              key={`${hit.verse.bookId}-${hit.verse.chapter}-${hit.verse.verse}`}
              type="button"
              onClick={() =>
                onOpenVerse(hit.verse.bookId, hit.verse.chapter, hit.verse.verse)
              }
              className="w-full text-left glass rounded-2xl p-4 hover:border-[#8FD99A]/45 transition-all active:scale-[0.99] group"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-semibold text-[#8FD99A]">
                  {formatRef(hit.verse, language)}
                </span>
                <span className="text-[10px] text-[var(--sage)]/70 group-hover:text-[#8FD99A] transition">
                  {language === 'en' ? 'Open →' : 'Abrir →'}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-[#D8E1D9]/90">
                <HighlightedText text={hit.verse.text} ranges={hit.ranges} />
              </p>
            </button>
          ))}

        {!loading && mode === 'concordance' &&
          entries.map((entry) => (
            <button
              key={`${entry.verse.bookId}-${entry.verse.chapter}-${entry.verse.verse}`}
              type="button"
              onClick={() =>
                onOpenVerse(entry.verse.bookId, entry.verse.chapter, entry.verse.verse)
              }
              className="w-full text-left glass rounded-2xl p-4 hover:border-[#8FD99A]/45 transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--border-strong)] text-[#8FD99A] font-mono">
                  {formatRef(entry.verse, language)}
                </span>
                <span className="text-[10px] text-[var(--sage)]/70">
                  {entry.verse.testament === 'OT'
                    ? language === 'en'
                      ? 'OT'
                      : 'AT'
                    : language === 'en'
                      ? 'NT'
                      : 'NT'}
                </span>
              </div>
              <p
                className="text-sm leading-relaxed text-[#D8E1D9]/90"
                dir={language === 'original' && entry.verse.testament === 'OT' ? 'rtl' : 'ltr'}
              >
                <HighlightedText text={entry.snippet} ranges={entry.ranges} />
              </p>
            </button>
          ))}

        {!loading && debounced.length >= 2 && total === 0 && !error && (
          <div className="text-center py-12">
            <p className="text-sm text-[var(--sage)]/80 mb-3">
              {language === 'en' ? 'No verses matched.' : 'Ningún versículo coincide.'}
            </p>
            <p className="text-xs text-[var(--sage)]/35">
              {language === 'en'
                ? 'Try fewer words, a reference, or switch testament filter.'
                : 'Prueba menos palabras, una referencia, o cambia el filtro de testamento.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
