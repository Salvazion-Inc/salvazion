'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import BottomNav from '@/components/BottomNav';
import BibleSearchPanel from '@/components/bible/BibleSearchPanel';
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
import { logAction, getPointsForAction } from '@/lib/scoring/engine';
import { loadProfile, calculateAge, getLifeStage } from '@/lib/store/profile';
import { useI18n } from '@/components/I18nProvider';

type MainTab = 'read' | 'explore';

export default function BiblePage() {
  const books = getBooks();
  const { t, lang: uiLang } = useI18n();
  const [mainTab, setMainTab] = useState<MainTab>('read');
  const [language, setLanguage] = useState<BibleLanguage>('es');
  const [selectedBook, setSelectedBook] = useState('gen');
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [focusVerse, setFocusVerse] = useState<number | null>(null);
  const [chapter, setChapter] = useState<BibleChapter | null>(null);
  const [loadingChapter, setLoadingChapter] = useState(false);
  const [read, setRead] = useState(false);
  const [justLogged, setJustLogged] = useState(false);
  const [readCount, setReadCount] = useState(0);
  const verseRefs = useRef<Map<number, HTMLParagraphElement>>(new Map());

  const availableChapters = getAvailableChapters(selectedBook, language);
  const totalChapters = getTotalChapters();

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
  };

  const openVerse = useCallback((bookId: string, chapterNum: number, verse?: number) => {
    setSelectedBook(bookId);
    setSelectedChapter(chapterNum);
    setFocusVerse(verse ?? null);
    setMainTab('read');
  }, []);

  const goPrev = () => {
    if (selectedChapter > 1) {
      setSelectedChapter(selectedChapter - 1);
      setFocusVerse(null);
      return;
    }
    const idx = books.findIndex((b) => b.id === selectedBook);
    if (idx > 0) {
      const prev = books[idx - 1];
      setSelectedBook(prev.id);
      setSelectedChapter(prev.chapters);
      setFocusVerse(null);
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
      setSelectedBook(books[idx + 1].id);
      setSelectedChapter(1);
      setFocusVerse(null);
    }
  };

  const stage = (() => {
    const pr = loadProfile();
    return pr?.birthDate ? getLifeStage(calculateAge(pr.birthDate)) : 'adult';
  })();
  const pts = getPointsForAction('bible_chapter', stage);

  return (
    <div className="min-h-screen bg-[#040404] text-[#D8E1D9] flex flex-col">
      {/* Header */}
      <header className="px-5 pt-6 pb-3 border-b border-[#6B8F6E]/20 sticky top-0 z-40 bg-[#040404]/95 backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <Link href="/hub/dashboard" className="text-[#B7F7AC]/60 text-sm w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#7BC98A]/10">
              ←
            </Link>
            <div className="w-9 h-9 rounded-full border border-[#8FD99A]/50 flex items-center justify-center lion-glow overflow-hidden bg-[#040404]">
              <Image src="/logo-icon.png" alt="Salvazion" width={36} height={36} className="object-cover" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#8FD99A] leading-tight">{t('bible.title')}</h1>
              <p className="text-[10px] text-[#B7F7AC]/50">
                {readCount} / {totalChapters} {t('bible.chapters')}
              </p>
            </div>
          </div>
        </div>

        {/* Main tabs: Read / Explore */}
        <div className="flex p-1 rounded-2xl bg-[#0a0a0a] border border-[#6B8F6E]/25 mb-3">
          {(
            [
              { id: 'read' as MainTab, key: 'bible.read' },
              { id: 'explore' as MainTab, key: 'bible.explore' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMainTab(tab.id)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                mainTab === tab.id
                  ? 'bg-[#7BC98A] text-[#040404] shadow-[0_0_18px_rgba(143, 217, 154,0.22)]'
                  : 'text-[#B7F7AC]/70 hover:text-[#8FD99A]'
              }`}
            >
              {t(tab.key)}
            </button>
          ))}
        </div>

        {/* Language */}
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
              className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                language === lang.id
                  ? 'bg-[#7BC98A]/20 border-[#8FD99A] text-[#8FD99A]'
                  : 'border-[#6B8F6E]/40 text-[#D8E1D9]/60'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>

        {/* Book + chapter — only in read mode */}
        {mainTab === 'read' && (
          <div className="flex gap-2 mt-3">
            <select
              value={selectedBook}
              onChange={(e) => {
                setSelectedBook(e.target.value);
                const chs = getAvailableChapters(e.target.value, language);
                setSelectedChapter(chs[0] || 1);
                setFocusVerse(null);
              }}
              className="flex-1 bg-[#0a0a0a] border border-[#6B8F6E]/40 rounded-xl px-3 py-2.5 text-sm"
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
              className="w-24 bg-[#0a0a0a] border border-[#6B8F6E]/40 rounded-xl px-3 py-2.5 text-sm"
            >
              {availableChapters.map((c) => (
                <option key={c} value={c}>
                  {t('bible.ch')} {c}
                </option>
              ))}
            </select>
          </div>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 px-5 pt-4 pb-28 overflow-hidden flex flex-col min-h-0">
        {mainTab === 'explore' ? (
          <div className="flex-1 min-h-0 max-w-lg mx-auto w-full flex flex-col">
            <BibleSearchPanel language={language} onOpenVerse={openVerse} />
          </div>
        ) : loadingChapter ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#B7F7AC]/60">
            <div className="w-8 h-8 border-2 border-[#8FD99A]/40 border-t-[#8FD99A] rounded-full animate-spin mb-4" />
            <p className="text-sm">{t('bible.loadingChapter')}</p>
          </div>
        ) : chapter ? (
          <div className="max-w-lg mx-auto w-full overflow-y-auto flex-1 min-h-0">
            {/* Chapter title + nav */}
            <div className="flex items-start justify-between gap-3 mb-5">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {chapter.book} {chapter.chapter}
                </h2>
                <p className="text-xs text-[#B7F7AC]/50 mt-0.5">{chapter.version}</p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={goPrev}
                  className="w-9 h-9 rounded-xl border border-[#6B8F6E]/35 text-[#B7F7AC] hover:border-[#8FD99A]/50 hover:text-[#8FD99A] transition"
                  aria-label="Previous"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="w-9 h-9 rounded-xl border border-[#6B8F6E]/35 text-[#B7F7AC] hover:border-[#8FD99A]/50 hover:text-[#8FD99A] transition"
                  aria-label="Next"
                >
                  ›
                </button>
              </div>
            </div>

            <div
              className="space-y-1 mb-8"
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
              className={`w-full py-4 rounded-2xl font-semibold transition-all ${
                read
                  ? 'bg-[#6B8F6E]/20 text-[#B7F7AC] border border-[#6B8F6E]/40'
                  : 'bg-[#7BC98A] text-[#040404] hover:bg-[#B7F7AC] shadow-[0_0_24px_rgba(143, 217, 154,0.2)]'
              }`}
            >
              {read
                ? justLogged
                  ? `✓ ${t('bible.chapterRead')} · +${pts} Salvation`
                  : `✓ ${t('bible.alreadyRead')}`
                : `${t('bible.markRead')} · +${pts} Salvation`}
            </button>

            <div className="flex gap-2 mt-3 mb-6">
              <button
                type="button"
                onClick={goPrev}
                className="flex-1 py-3 rounded-xl border border-[#6B8F6E]/30 text-xs text-[#B7F7AC] hover:border-[#8FD99A]/40"
              >
                ← {t('common.previous')}
              </button>
              <button
                type="button"
                onClick={() => setMainTab('explore')}
                className="flex-1 py-3 rounded-xl border border-[#8FD99A]/40 text-xs text-[#8FD99A] hover:bg-[#7BC98A]/10"
              >
                ⌕ {t('common.search')}
              </button>
              <button
                type="button"
                onClick={goNext}
                className="flex-1 py-3 rounded-xl border border-[#6B8F6E]/30 text-xs text-[#B7F7AC] hover:border-[#8FD99A]/40"
              >
                {t('common.next')} →
              </button>
            </div>

            {language === 'original' && (
              <p className="text-[11px] text-[#B7F7AC]/40 text-center leading-relaxed mb-4">
                {t('bible.originalNote')}
              </p>
            )}
            {language === 'es' && (
              <p className="text-[11px] text-[#B7F7AC]/40 text-center leading-relaxed mb-4">
                {t('bible.rvNote')}
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-16 text-[#B7F7AC]/40">
            <p>{t('bible.couldNotLoad')}</p>
          </div>
        )}
      </main>

      <BottomNav variant="default" />
    </div>
  );
}
