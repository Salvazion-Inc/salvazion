'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import BottomNav from '@/components/BottomNav';
import BibleSearchPanel from '@/components/bible/BibleSearchPanel';
import BookCover from '@/components/bible/BookCover';
import BookLibrary from '@/components/bible/BookLibrary';
import BookCarousel from '@/components/bible/BookCarousel';
import PrayerMotivesPanel from '@/components/salvation/PrayerMotivesPanel';
import {
  getBooks,
  getChapter,
  getAvailableChapters,
  markChapterRead,
  isChapterRead,
  getReadCount,
  getTotalChapters,
  getBook,
} from '@/lib/bible/engine';
import { BibleLanguage, BibleChapter } from '@/lib/bible/types';
import { logAction, getPointsForAction, computeScores } from '@/lib/scoring/engine';
import { loadProfile, calculateAge, getLifeStage } from '@/lib/store/profile';
import { useI18n } from '@/components/I18nProvider';
import PillarHubHeader from '@/components/hub/PillarHubHeader';

type MainTab = 'read' | 'explore' | 'prayer';
type ExploreMode = 'library' | 'search';
type BookAnimDir = 'left' | 'right' | 'fade';

export default function BiblePage() {
  const books = getBooks();
  const { t, lang: uiLang } = useI18n();
  const [mainTab, setMainTab] = useState<MainTab>('read');
  const [exploreMode, setExploreMode] = useState<ExploreMode>('library');
  const [language, setLanguage] = useState<BibleLanguage>('es');
  const [selectedBook, setSelectedBook] = useState('gen');
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [focusVerse, setFocusVerse] = useState<number | null>(null);
  const [chapter, setChapter] = useState<BibleChapter | null>(null);
  const [loadingChapter, setLoadingChapter] = useState(false);
  const [read, setRead] = useState(false);
  const [justLogged, setJustLogged] = useState(false);
  const [readCount, setReadCount] = useState(0);
  const [bookAnimDir, setBookAnimDir] = useState<BookAnimDir>('fade');
  const [bookAnimKey, setBookAnimKey] = useState(0);
  /** Repliega chrome superior para maximizar lectura */
  const [chromeCollapsed, setChromeCollapsed] = useState(false);
  const [salvationScore, setSalvationScore] = useState(0);
  const verseRefs = useRef<Map<number, HTMLParagraphElement>>(new Map());
  const prevBookIdxRef = useRef(0);

  const availableChapters = getAvailableChapters(selectedBook, language);
  const totalChapters = getTotalChapters();
  const selectedBookIdx = books.findIndex((b) => b.id === selectedBook);

  const selectBook = useCallback(
    (bookId: string, chapterNum?: number) => {
      const nextIdx = books.findIndex((b) => b.id === bookId);
      const prevIdx = prevBookIdxRef.current;
      if (nextIdx !== prevIdx && nextIdx >= 0) {
        setBookAnimDir(nextIdx > prevIdx ? 'right' : 'left');
        setBookAnimKey((k) => k + 1);
        prevBookIdxRef.current = nextIdx;
      } else if (nextIdx === prevIdx) {
        setBookAnimDir('fade');
      }

      setSelectedBook(bookId);
      if (typeof chapterNum === 'number') {
        setSelectedChapter(chapterNum);
      } else {
        const chs = getAvailableChapters(bookId, language);
        setSelectedChapter(chs[0] || 1);
      }
      setFocusVerse(null);
    },
    [books, language]
  );

  useEffect(() => {
    setSalvationScore(computeScores().salvation);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadingChapter(true);
    setChapter(null);

    (async () => {
      const ch = await getChapter(selectedBook, selectedChapter, language);
      if (!cancelled) {
        setChapter(ch);
        setRead(isChapterRead(selectedBook, selectedChapter));
        setJustLogged(false);
        setReadCount(getReadCount());
        setLoadingChapter(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedBook, selectedChapter, language]);

  // Scroll to focused verse from search/concordance
  useEffect(() => {
    if (focusVerse == null || loadingChapter || !chapter) return;
    const el = verseRefs.current.get(focusVerse);
    if (el) {
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      const t = setTimeout(() => setFocusVerse(null), 2800);
      return () => clearTimeout(t);
    }
  }, [focusVerse, loadingChapter, chapter]);

  const handleMarkRead = () => {
    if (read) return;
    markChapterRead(selectedBook, selectedChapter);
    logAction('bible_chapter');
    setRead(true);
    setJustLogged(true);
    setReadCount(getReadCount());
    setSalvationScore(computeScores().salvation);
  };

  const openVerse = useCallback(
    (bookId: string, chapterNum: number, verse?: number) => {
      selectBook(bookId, chapterNum);
      setFocusVerse(verse ?? null);
      setMainTab('read');
    },
    [selectBook]
  );

  const openBookFromLibrary = useCallback(
    (bookId: string) => {
      selectBook(bookId);
      setMainTab('read');
    },
    [selectBook]
  );

  const goPrev = () => {
    if (selectedChapter > 1) {
      setSelectedChapter(selectedChapter - 1);
      setFocusVerse(null);
      return;
    }
    const idx = books.findIndex((b) => b.id === selectedBook);
    if (idx > 0) {
      const prev = books[idx - 1];
      selectBook(prev.id, prev.chapters);
    }
  };

  const goNext = () => {
    const book = getBook(selectedBook);
    if (!book) return;
    if (selectedChapter < book.chapters) {
      setSelectedChapter(selectedChapter + 1);
      setFocusVerse(null);
      return;
    }
    const idx = books.findIndex((b) => b.id === selectedBook);
    if (idx < books.length - 1) {
      selectBook(books[idx + 1].id, 1);
    }
  };

  const heroAnimClass =
    bookAnimDir === 'right'
      ? 'bible-hero-enter-from-right'
      : bookAnimDir === 'left'
        ? 'bible-hero-enter-from-left'
        : 'bible-hero-enter-fade';

  const stage = (() => {
    const pr = loadProfile();
    return pr?.birthDate ? getLifeStage(calculateAge(pr.birthDate)) : 'adult';
  })();
  const pts = getPointsForAction('bible_chapter', stage);

  const bookMeta = getBook(selectedBook);
  const bookDisplayName = bookMeta
    ? uiLang === 'en'
      ? bookMeta.name
      : bookMeta.nameEs
    : selectedBook;

  return (
    <div className="min-h-screen bg-[#040404] text-[#D8E1D9] flex flex-col">
      {/* Header — Salvation pillar (replegable en modo lectura) */}
      <header className="page-header px-5 sticky top-0 z-40">
        {chromeCollapsed && mainTab === 'read' ? (
          <div className="pt-3 pb-2.5 flex items-center gap-2">
            <Link href="/hub/dashboard" className="back-btn shrink-0" aria-label={t('common.back')}>
              ←
            </Link>
            <button
              type="button"
              onClick={() => setChromeCollapsed(false)}
              className="flex-1 min-w-0 text-left rounded-xl border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-2 hover:border-[var(--border-strong)] transition"
            >
              <p className="text-[10px] uppercase tracking-wider text-[var(--accent)]">
                Salvazion Hub · {salvationScore}
              </p>
              <p className="text-sm font-semibold text-white truncate">
                {chapter?.book || bookDisplayName} {selectedChapter}
              </p>
            </button>
            <div className="flex gap-1 shrink-0">
              <button
                type="button"
                onClick={goPrev}
                className="w-9 h-9 rounded-xl border border-[var(--border-soft)] text-[var(--sage)]"
                aria-label={t('common.previous')}
              >
                ‹
              </button>
              <button
                type="button"
                onClick={goNext}
                className="w-9 h-9 rounded-xl border border-[var(--border-soft)] text-[var(--sage)]"
                aria-label={t('common.next')}
              >
                ›
              </button>
              <button
                type="button"
                onClick={() => setChromeCollapsed(false)}
                className="w-9 h-9 rounded-xl border border-[var(--border-strong)] text-[var(--accent)] text-sm"
                aria-label={t('bible.expandChrome')}
                title={t('bible.expandChrome')}
              >
                ▾
              </button>
            </div>
          </div>
        ) : (
          <PillarHubHeader
            as="div"
            pillar="salvation"
            score={salvationScore}
            subtitle={`${readCount} / ${totalChapters} ${t('bible.chapters')}`}
            className="!pt-3 !px-0 !pb-0 bg-transparent border-0 shadow-none"
            sticky={false}
            actions={
              <>
                {mainTab === 'read' && (
                  <button
                    type="button"
                    onClick={() => setChromeCollapsed(true)}
                    className="pill-soft text-[10px]"
                    title={t('bible.collapseChrome')}
                  >
                    {t('bible.collapseChrome')}
                  </button>
                )}
                <Link href="/hub/devotional" className="pill-soft pill-soft-active text-[10px]">
                  {t('nav.devotional')}
                </Link>
              </>
            }
          >
            {/* Main tabs: Read / Explore / Prayer */}
            <div className="segment-soft mb-3 mt-3">
              {(
                [
                  { id: 'read' as MainTab, key: 'bible.read' },
                  { id: 'explore' as MainTab, key: 'bible.explore' },
                  { id: 'prayer' as MainTab, key: 'bible.prayer' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  data-active={mainTab === tab.id}
                  onClick={() => {
                    setMainTab(tab.id);
                    if (tab.id !== 'read') setChromeCollapsed(false);
                  }}
                >
                  {t(tab.key)}
                </button>
              ))}
            </div>

            {/* Language — hide on pure prayer tab to free space */}
            {mainTab !== 'prayer' && (
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { id: 'es' as BibleLanguage, label: 'ES · Reina Valera' },
                    { id: 'en' as BibleLanguage, label: 'EN · King James' },
                    { id: 'original' as BibleLanguage, label: 'Original · Heb/Gr' },
                  ] as const
                ).map((lang) => (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => setLanguage(lang.id)}
                    className={`pill-soft ${language === lang.id ? 'pill-soft-active' : ''}`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}

            {/* Book carousel + chapter — only in read mode */}
            {mainTab === 'read' && (
              <div className="mt-3 -mx-5">
                <BookCarousel
                  books={books}
                  selectedBookId={selectedBook}
                  uiLang={uiLang === 'en' ? 'en' : 'es'}
                  onSelect={(id) => selectBook(id)}
                  size="md"
                />
                <div className="flex gap-2 mt-2.5 px-5">
                  <select
                    value={selectedBook}
                    onChange={(e) => selectBook(e.target.value)}
                    className="input-soft flex-1 py-2.5 text-sm"
                    aria-label={t('bible.library')}
                  >
                    <optgroup label={t('bible.ot')}>
                      {books
                        .filter((b) => b.testament === 'OT')
                        .map((b) => (
                          <option key={b.id} value={b.id}>
                            {uiLang === 'en' ? b.name : b.nameEs}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label={t('bible.nt')}>
                      {books
                        .filter((b) => b.testament === 'NT')
                        .map((b) => (
                          <option key={b.id} value={b.id}>
                            {uiLang === 'en' ? b.name : b.nameEs}
                          </option>
                        ))}
                    </optgroup>
                  </select>

                  <select
                    value={selectedChapter}
                    onChange={(e) => {
                      setSelectedChapter(Number(e.target.value));
                      setFocusVerse(null);
                    }}
                    className="input-soft w-24 py-2.5 text-sm"
                    aria-label={t('bible.ch')}
                  >
                    {availableChapters.map((c) => (
                      <option key={c} value={c}>
                        {t('bible.ch')} {c}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedBookIdx >= 0 && (
                  <p className="px-5 mt-1.5 text-[10px] text-[var(--sage)]/70 tabular-nums">
                    {selectedBookIdx + 1} / {books.length}
                  </p>
                )}
              </div>
            )}
          </PillarHubHeader>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 px-5 pt-3 pb-28 overflow-hidden flex flex-col min-h-0">
        {mainTab === 'prayer' ? (
          <PrayerMotivesPanel
            lang={uiLang === 'en' ? 'en' : 'es'}
            onPrayed={() => {
              logAction('pray_5min');
              setSalvationScore(computeScores().salvation);
            }}
          />
        ) : mainTab === 'explore' ? (
          <div className="flex-1 min-h-0 max-w-lg mx-auto w-full flex flex-col overflow-hidden">
            <div className="segment-soft mb-3 shrink-0">
              {(
                [
                  { id: 'library' as ExploreMode, key: 'bible.library' },
                  { id: 'search' as ExploreMode, key: 'bible.search' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  data-active={exploreMode === tab.id}
                  onClick={() => setExploreMode(tab.id)}
                >
                  {t(tab.key)}
                </button>
              ))}
            </div>
            {exploreMode === 'library' ? (
              <div className="flex-1 min-h-0 overflow-y-auto pb-2">
                <BookLibrary
                  books={books}
                  selectedBookId={selectedBook}
                  uiLang={uiLang === 'en' ? 'en' : 'es'}
                  otLabel={t('bible.ot')}
                  ntLabel={t('bible.nt')}
                  onSelect={openBookFromLibrary}
                />
              </div>
            ) : (
              <div className="flex-1 min-h-0 flex flex-col">
                <BibleSearchPanel language={language} onOpenVerse={openVerse} />
              </div>
            )}
          </div>
        ) : loadingChapter ? (
          <div className="flex flex-col items-center justify-center py-20 text-[var(--sage)]">
            <div className="w-8 h-8 border-2 border-[var(--border-strong)] border-t-[#8FD99A] rounded-full animate-spin mb-4" />
            <p className="text-sm">{t('bible.loadingChapter')}</p>
          </div>
        ) : chapter ? (
          <div
            key={`book-${selectedBook}-${bookAnimKey}`}
            className="max-w-lg mx-auto w-full overflow-y-auto flex-1 min-h-0 bible-content-enter"
          >
            {/* Hero cover — hide when chrome collapsed for immersion */}
            {!chromeCollapsed && bookMeta && (
              <div className={`mb-4 bible-hero-stage ${heroAnimClass}`}>
                <BookCover
                  bookId={selectedBook}
                  name={bookDisplayName}
                  testament={bookMeta.testament}
                  testamentLabel={
                    bookMeta.testament === 'OT' ? t('bible.ot') : t('bible.nt')
                  }
                  variant="hero"
                  priority
                />
              </div>
            )}

            {/* Chapter title + nav */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-start gap-2.5 min-w-0">
                {bookMeta && (
                  <span className={heroAnimClass}>
                    <BookCover
                      bookId={selectedBook}
                      name={bookDisplayName}
                      testament={bookMeta.testament}
                      variant="chip"
                      selected
                    />
                  </span>
                )}
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    {chapter.book} {chapter.chapter}
                  </h2>
                  <p className="text-xs text-[var(--sage)]/80 mt-0.5">{chapter.version}</p>
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                {!chromeCollapsed && (
                  <button
                    type="button"
                    onClick={() => setChromeCollapsed(true)}
                    className="w-9 h-9 rounded-xl border border-[var(--border-soft)] text-[var(--sage)] text-xs hover:border-[var(--border-strong)] hover:text-[#8FD99A] transition"
                    aria-label={t('bible.collapseChrome')}
                    title={t('bible.collapseChrome')}
                  >
                    ▴
                  </button>
                )}
                <button
                  type="button"
                  onClick={goPrev}
                  className="w-9 h-9 rounded-xl border border-[var(--border-soft)] text-[var(--sage)] hover:border-[var(--border-strong)] hover:text-[#8FD99A] transition"
                  aria-label="Previous"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="w-9 h-9 rounded-xl border border-[var(--border-soft)] text-[var(--sage)] hover:border-[var(--border-strong)] hover:text-[#8FD99A] transition"
                  aria-label="Next"
                >
                  ›
                </button>
              </div>
            </div>

            <div
              key={`verses-${selectedBook}-${selectedChapter}`}
              className="space-y-1 mb-8 bible-content-enter"
              dir={
                language === 'original' && getBook(selectedBook)?.testament === 'OT'
                  ? 'rtl'
                  : 'ltr'
              }
            >
              {chapter.verses.map((v) => {
                const focused = focusVerse === v.number;
                return (
                  <p
                    key={v.number}
                    id={`v-${v.number}`}
                    ref={(el) => {
                      if (el) verseRefs.current.set(v.number, el);
                      else verseRefs.current.delete(v.number);
                    }}
                    className={`leading-relaxed text-[#D8E1D9]/90 rounded-xl px-2.5 py-2 transition-all duration-500 ${
                      language === 'original' ? 'text-[1.05rem] font-serif' : 'text-[0.95rem]'
                    } ${
                      focused
                        ? 'bg-[#7BC98A]/12 ring-1 ring-[#8FD99A]/40 shadow-[0_0_24px_rgba(143, 217, 154,0.12)]'
                        : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <span className="text-[#8FD99A] text-[11px] font-semibold mx-1 font-sans align-super">
                      {v.number}
                    </span>
                    {v.text}
                  </p>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleMarkRead}
              disabled={read}
              className={read ? 'btn-secondary opacity-80' : 'btn-primary'}
            >
              {read
                ? justLogged
                  ? `✓ ${t('bible.chapterRead')} · +${pts} Salvation`
                  : `✓ ${t('bible.alreadyRead')}`
                : `${t('bible.markRead')} · +${pts} Salvation`}
            </button>

            <div className="flex gap-2 mt-3 mb-6">
              <button type="button" onClick={goPrev} className="btn-secondary flex-1 py-3 text-xs">
                ← {t('common.previous')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setExploreMode('library');
                  setMainTab('explore');
                }}
                className="btn-secondary flex-1 py-3 text-xs"
              >
                ⌕ {t('bible.library')}
              </button>
              <button type="button" onClick={goNext} className="btn-secondary flex-1 py-3 text-xs">
                {t('common.next')} →
              </button>
            </div>

            {language === 'original' && (
              <p className="text-[11px] text-[var(--sage)]/70 text-center leading-relaxed mb-4">
                {t('bible.originalNote')}
              </p>
            )}
            {language === 'es' && (
              <p className="text-[11px] text-[var(--sage)]/70 text-center leading-relaxed mb-4">
                {t('bible.rvNote')}
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-16 text-[var(--sage)]/70">
            <p>{t('bible.couldNotLoad')}</p>
          </div>
        )}
      </main>

      <BottomNav variant="default" />
    </div>
  );
}
