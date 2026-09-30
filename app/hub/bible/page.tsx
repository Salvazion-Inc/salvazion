'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import BibleSearchPanel from '@/components/bible/BibleSearchPanel';
import BookCover from '@/components/bible/BookCover';
import BookLibrary from '@/components/bible/BookLibrary';
import BookCarousel from '@/components/bible/BookCarousel';
import PrayerMotivesPanel from '@/components/salvation/PrayerMotivesPanel';
import SalvationTabs from '@/components/salvation/SalvationTabs';
import BrandLoader from '@/components/ui/BrandLoader';
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
import { BibleLanguage, BibleChapter, bookDisplayName } from '@/lib/bible/types';
import {
  logAction,
  getPointsForAction,
  computeScores,
  hasLoggedActionToday,
} from '@/lib/scoring/engine';
import { loadProfile, calculateAge, getLifeStage } from '@/lib/store/profile';
import { useI18n } from '@/components/I18nProvider';
import PillarHubHeader from '@/components/hub/PillarHubHeader';
import { useFlashToast } from '@/components/ui/FlashToast';

/** Salvation hub: Bible (read + explore) and Prayer. Devotional and Hymns are routes. */
type MainTab = 'bible' | 'prayer';
/** Tools inside Bible tab: chapter reader, book grid, search */
type BibleMode = 'read' | 'library' | 'search';
type BookAnimDir = 'left' | 'right' | 'fade';

export default function BiblePage() {
  const books = getBooks();
  const { t, lang: uiLang } = useI18n();
  const { flash, toast: softToast } = useFlashToast(3200);
  const [mainTab, setMainTab] = useState<MainTab>('bible');
  const [bibleMode, setBibleMode] = useState<BibleMode>('read');
  const [language, setLanguage] = useState<BibleLanguage>(
    uiLang === 'en' || uiLang === 'pt' ? uiLang : 'es'
  );
  const [selectedBook, setSelectedBook] = useState('gen');
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [focusVerse, setFocusVerse] = useState<number | null>(null);
  const [chapter, setChapter] = useState<BibleChapter | null>(null);
  const [loadingChapter, setLoadingChapter] = useState(false);
  const [read, setRead] = useState(false);
  const [justLogged, setJustLogged] = useState(false);
  const [autoCompleted, setAutoCompleted] = useState(false);
  const [readCount, setReadCount] = useState(0);
  const [bookAnimDir, setBookAnimDir] = useState<BookAnimDir>('fade');
  const [bookAnimKey, setBookAnimKey] = useState(0);
  /** Compact reading chrome — expanded by default; user collapses manually */
  const [chromeCollapsed, setChromeCollapsed] = useState(false);
  const [salvationScore, setSalvationScore] = useState(0);
  const [autoStartPrayerSession, setAutoStartPrayerSession] = useState(false);
  const verseRefs = useRef<Map<number, HTMLParagraphElement>>(new Map());
  const prevBookIdxRef = useRef(0);

  const availableChapters = getAvailableChapters(selectedBook, language);
  const totalChapters = getTotalChapters();
  const selectedBookIdx = books.findIndex((b) => b.id === selectedBook);
  const isReading =
    mainTab === 'bible' && bibleMode === 'read' && !loadingChapter && !!chapter;

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
    if (uiLang === 'en' || uiLang === 'es' || uiLang === 'pt') {
      setLanguage(uiLang);
    }
  }, [uiLang]);

  // Deep-link from agenda: /hub/bible?tab=bible|prayer (devotional is its own route)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const sp = new URLSearchParams(window.location.search);
      const tab = sp.get('tab');
      if (tab === 'prayer') {
        setMainTab('prayer');
        setChromeCollapsed(false);
        if (sp.get('session') === '1') setAutoStartPrayerSession(true);
      } else if (tab === 'bible' || tab === 'read') {
        setMainTab('bible');
        setBibleMode('read');
      } else if (tab === 'devotional') {
        window.location.replace('/hub/devotional');
      } else if (tab === 'hymns') {
        window.location.replace('/hub/hymns');
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (bibleMode !== 'read') return;
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
  }, [selectedBook, selectedChapter, language, bibleMode]);

  // Expand chrome when leaving the reader (library / search / prayer)
  useEffect(() => {
    if (mainTab !== 'bible' || bibleMode !== 'read') {
      setChromeCollapsed(false);
    }
  }, [mainTab, bibleMode]);

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

  const handleMarkRead = useCallback(
    (opts?: { auto?: boolean }) => {
      if (read) return;
      const wasScoredToday = hasLoggedActionToday('bible_chapter');
      markChapterRead(selectedBook, selectedChapter);
      logAction('bible_chapter');
      setRead(true);
      setJustLogged(true);
      setAutoCompleted(!!opts?.auto);
      setReadCount(getReadCount());
      const scores = computeScores();
      setSalvationScore(scores.salvation);

      if (opts?.auto) {
        const pts = getPointsForAction('bible_chapter');
        flash(
          wasScoredToday
            ? t('bible.autoReadAlreadyScored')
            : t('bible.autoReadToast', { pts }),
          { tone: 'soft', durationMs: 3400 }
        );
      }
    },
    [read, selectedBook, selectedChapter, flash, t]
  );

  // Reset auto banner when chapter changes
  useEffect(() => {
    setAutoCompleted(false);
  }, [selectedBook, selectedChapter]);

  // Natural log: after ~40s on chapter + scroll near end, auto-mark read (1×/day via logAction)
  useEffect(() => {
    if (read || !chapter || mainTab !== 'bible' || bibleMode !== 'read') return;
    const openedAt = Date.now();
    let done = false;

    const tryAuto = () => {
      if (done || read) return;
      const elapsed = Date.now() - openedAt;
      if (elapsed < 40_000) return;
      const scrollEl =
        document.scrollingElement || document.documentElement;
      const nearBottom =
        scrollEl.scrollTop + window.innerHeight >=
        scrollEl.scrollHeight - 160;
      if (!nearBottom) return;
      done = true;
      handleMarkRead({ auto: true });
    };

    const onScroll = () => tryAuto();
    const id = window.setInterval(tryAuto, 8_000);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.clearInterval(id);
      window.removeEventListener('scroll', onScroll);
    };
  }, [read, chapter, mainTab, bibleMode, handleMarkRead]);

  const openVerse = useCallback(
    (bookId: string, chapterNum: number, verse?: number) => {
      selectBook(bookId, chapterNum);
      setFocusVerse(verse ?? null);
      setBibleMode('read');
      setMainTab('bible');
    },
    [selectBook]
  );

  const openBookFromLibrary = useCallback(
    (bookId: string) => {
      selectBook(bookId);
      setBibleMode('read');
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

  const expandChrome = () => {
    setChromeCollapsed(false);
  };

  const collapseChrome = () => {
    setChromeCollapsed(true);
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
  const currentBookName = bookMeta
    ? bookDisplayName(bookMeta, uiLang)
    : selectedBook;

  const mainTabs = (
    <SalvationTabs
      active={mainTab}
      onSelect={(tab) => {
        setMainTab(tab);
        if (tab !== 'bible') setChromeCollapsed(false);
      }}
    />
  );

  return (
    <div className="min-h-screen bg-[#040404] text-[#D8E1D9] flex flex-col">
      {softToast}
      {/* Header — same height chrome as Health/Freedom (title + score + main tabs) */}
      {chromeCollapsed && isReading ? (
        <header className="page-header px-5 sticky top-0 z-40">
          <div className="pt-3 pb-2.5 flex items-center gap-2">
            <Link href="/hub/dashboard" className="back-btn shrink-0" aria-label={t('common.back')}>
              ←
            </Link>
            <button
              type="button"
              onClick={expandChrome}
              className="flex-1 min-w-0 text-left rounded-xl border border-[var(--border-soft)] bg-[var(--surface-muted)] px-3 py-2 hover:border-[var(--border-strong)] transition"
            >
              <p className="text-[10px] uppercase tracking-wider text-[var(--accent)]">
                {t('bible.title')} · {salvationScore}
              </p>
              <p className="text-sm font-semibold text-white truncate">
                {chapter?.book || currentBookName} {selectedChapter}
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
                onClick={expandChrome}
                className="w-9 h-9 rounded-xl border border-[var(--border-strong)] text-[var(--accent)] text-sm"
                aria-label={t('bible.expandChrome')}
                title={t('bible.expandChrome')}
              >
                ▾
              </button>
            </div>
          </div>
        </header>
      ) : (
        <PillarHubHeader
          pillar="salvation"
          score={salvationScore}
          actions={
            isReading ? (
              <button
                type="button"
                onClick={collapseChrome}
                className="pill-soft text-[10px]"
                title={t('bible.collapseChrome')}
              >
                {t('bible.collapseChrome')}
              </button>
            ) : null
          }
        >
          {mainTabs}
        </PillarHubHeader>
      )}

      {/* Content — Bible tools live here so hub chrome matches Health/Freedom height */}
      <main className="flex-1 px-5 pt-3 pb-28 overflow-hidden flex flex-col min-h-0">
        {mainTab === 'bible' && !chromeCollapsed && (
          <div className="shrink-0 max-w-lg mx-auto w-full mb-3 space-y-3">
            {/* Bible sub-modes: Read + Explore tools (library / search) */}
            <div className="segment-soft">
              {(
                [
                  { id: 'read' as BibleMode, key: 'bible.readMode' },
                  { id: 'library' as BibleMode, key: 'bible.library' },
                  { id: 'search' as BibleMode, key: 'bible.search' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  data-active={bibleMode === tab.id}
                  onClick={() => {
                    setBibleMode(tab.id);
                    if (tab.id !== 'read') setChromeCollapsed(false);
                  }}
                >
                  {t(tab.key)}
                </button>
              ))}
            </div>

            {/* Language */}
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: 'es' as BibleLanguage, label: 'ES · Reina Valera 1909' },
                  { id: 'en' as BibleLanguage, label: 'EN · King James' },
                  { id: 'pt' as BibleLanguage, label: 'PT · Almeida ARC' },
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

            {/* Book carousel + chapter — only when reading */}
            {bibleMode === 'read' && (
              <div className="-mx-5">
                <div className="flex items-end justify-between gap-2 px-5 mb-2">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-[var(--sage)]/70">
                      {t('bible.library')}
                    </p>
                    <p className="text-xs text-[var(--off-white)]/90 truncate">
                      {currentBookName}
                      {selectedBookIdx >= 0 ? (
                        <span className="text-[var(--sage)]/70">
                          {' '}
                          · {selectedBookIdx + 1}/{books.length}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <p
                    className="text-[11px] font-semibold tabular-nums shrink-0 text-right"
                    style={{ color: 'var(--off-white)' }}
                    title={t('bible.chapters')}
                  >
                    <span className="text-[var(--accent)]">{readCount}</span>
                    <span className="text-[var(--sage)]/80">
                      {' '}
                      / {totalChapters} {t('bible.chapters')}
                    </span>
                  </p>
                </div>
                <BookCarousel
                  books={books}
                  selectedBookId={selectedBook}
                  uiLang={uiLang}
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
                            {bookDisplayName(b, uiLang)}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label={t('bible.nt')}>
                      {books
                        .filter((b) => b.testament === 'NT')
                        .map((b) => (
                          <option key={b.id} value={b.id}>
                            {bookDisplayName(b, uiLang)}
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
              </div>
            )}
          </div>
        )}

        {mainTab === 'prayer' ? (
          <PrayerMotivesPanel
            lang={uiLang}
            autoStartSession={autoStartPrayerSession}
            onPrayed={() => {
              logAction('pray_5min');
              setSalvationScore(computeScores().salvation);
            }}
          />
        ) : mainTab === 'bible' && bibleMode === 'library' ? (
          <div className="flex-1 min-h-0 max-w-lg mx-auto w-full overflow-y-auto pb-2">
            <BookLibrary
              books={books}
              selectedBookId={selectedBook}
              uiLang={uiLang}
              otLabel={t('bible.ot')}
              ntLabel={t('bible.nt')}
              onSelect={openBookFromLibrary}
            />
          </div>
        ) : mainTab === 'bible' && bibleMode === 'search' ? (
          <div className="flex-1 min-h-0 max-w-lg mx-auto w-full flex flex-col">
            <BibleSearchPanel language={language} onOpenVerse={openVerse} />
          </div>
        ) : loadingChapter ? (
          <div className="flex flex-col items-center justify-center py-20">
            <BrandLoader size={96} label={t('bible.loadingChapter')} />
          </div>
        ) : chapter ? (
          <div
            key={`book-${selectedBook}-${bookAnimKey}`}
            className="max-w-lg mx-auto w-full overflow-y-auto flex-1 min-h-0 bible-content-enter"
          >
            {/* Hero cover — only when chrome expanded */}
            {!chromeCollapsed && bookMeta && (
              <div className={`mb-4 bible-hero-stage ${heroAnimClass}`}>
                <BookCover
                  bookId={selectedBook}
                  name={currentBookName}
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
                      name={currentBookName}
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
                    onClick={collapseChrome}
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
                        ? 'bg-[#7BC98A]/12 ring-1 ring-[#8FD99A]/40 shadow-[0_0_24px_rgba(143,217,154,0.12)]'
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
              onClick={() => handleMarkRead()}
              disabled={read}
              className={read ? 'btn-secondary opacity-80' : 'btn-primary'}
            >
              {read
                ? justLogged
                  ? autoCompleted
                    ? `✓ ${t('bible.autoReadShort')}`
                    : `✓ ${t('bible.chapterRead')} · +${pts} Salvation`
                  : `✓ ${t('bible.alreadyRead')}`
                : `${t('bible.markRead')} · +${pts} Salvation`}
            </button>
            {autoCompleted && (
              <p
                className="text-[11px] text-[var(--sage)]/80 text-center mt-2 leading-relaxed"
                role="status"
              >
                {t('bible.autoReadHint')}
              </p>
            )}

            <div className="flex gap-2 mt-3 mb-6">
              <button type="button" onClick={goPrev} className="btn-secondary flex-1 py-3 text-xs">
                ← {t('common.previous')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setBibleMode('library');
                  setChromeCollapsed(false);
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
            {language === 'pt' && (
              <p className="text-[11px] text-[var(--sage)]/70 text-center leading-relaxed mb-4">
                {t('bible.arcNote')}
              </p>
            )}
            {language === 'en' && (
              <p className="text-[11px] text-[var(--sage)]/70 text-center leading-relaxed mb-4">
                {t('bible.kjvNote')}
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
