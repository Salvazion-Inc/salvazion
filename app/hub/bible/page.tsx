'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import BottomNav from '@/components/BottomNav';
import {
  getBooks,
  getChapter,
  getAvailableChapters,
  markChapterRead,
  isChapterRead,
  getReadCount,
  getTotalChapters,
} from '@/lib/bible/engine';
import { BibleLanguage, BibleChapter } from '@/lib/bible/types';
import { logAction, getPointsForAction } from '@/lib/scoring/engine';
import { loadProfile, calculateAge, getLifeStage } from '@/lib/store/profile';
import { getLionShortNudge } from '@/lib/coach/engine';

export default function BiblePage() {
  const books = getBooks();
  const [language, setLanguage] = useState<BibleLanguage>('es');
  const [selectedBook, setSelectedBook] = useState('gen');
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [chapter, setChapter] = useState<BibleChapter | null>(null);
  const [loadingChapter, setLoadingChapter] = useState(false);
  const [read, setRead] = useState(false);
  const [justLogged, setJustLogged] = useState(false);
  const [readCount, setReadCount] = useState(0);

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

  const handleMarkRead = () => {
    if (read) return;
    markChapterRead(selectedBook, selectedChapter);
    logAction('bible_chapter');
    setRead(true);
    setJustLogged(true);
    setReadCount(getReadCount());
  };

  const bookMeta = books.find(b => b.id === selectedBook);

  return (
    <div className="min-h-screen bg-[#040404] text-[#D8E1D9] flex flex-col">
      {/* Header */}
      <header className="px-5 pt-6 pb-3 border-b border-[#00B10C]/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <Link href="/hub/dashboard" className="text-[#B7F7AC]/60 text-sm">←</Link>
            <div className="w-9 h-9 rounded-full border border-[#00F511]/50 flex items-center justify-center lion-glow overflow-hidden bg-[#040404]">
              <Image src="/logo-icon.png" alt="Salvazion" width={36} height={36} className="object-cover" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#00F511] leading-tight">Biblia</h1>
              <p className="text-[10px] text-[#B7F7AC]/50">
                {readCount} / {totalChapters} capítulos · 66 libros
              </p>
            </div>
          </div>
        </div>

        {/* Language tabs */}
        <div className="flex gap-2 mb-3">
          {([
            { id: 'es' as BibleLanguage, label: 'ES · Reina Valera 1960' },
            { id: 'en' as BibleLanguage, label: 'EN · King James' },
            { id: 'original' as BibleLanguage, label: 'Original' }
          ]).map(lang => (
            <button
              key={lang.id}
              onClick={() => setLanguage(lang.id)}
              className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                language === lang.id
                  ? 'bg-[#00F511]/20 border-[#00F511] text-[#00F511]'
                  : 'border-[#00B10C]/40 text-[#D8E1D9]/60'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>

        {/* Book + Chapter selectors */}
        <div className="flex gap-2">
          <select
            value={selectedBook}
            onChange={e => {
              setSelectedBook(e.target.value);
              const chs = getAvailableChapters(e.target.value, language);
              setSelectedChapter(chs[0] || 1);
            }}
            className="flex-1 bg-[#040404] border border-[#00B10C]/40 rounded-xl px-3 py-2.5 text-sm"
          >
            <optgroup label={language === 'en' ? 'Old Testament' : 'Antiguo Testamento'}>
              {books
                .filter(b => b.testament === 'OT')
                .map(b => (
                  <option key={b.id} value={b.id}>
                    {language === 'en' ? b.name : b.nameEs}
                  </option>
                ))}
            </optgroup>
            <optgroup label={language === 'en' ? 'New Testament' : 'Nuevo Testamento'}>
              {books
                .filter(b => b.testament === 'NT')
                .map(b => (
                  <option key={b.id} value={b.id}>
                    {language === 'en' ? b.name : b.nameEs}
                  </option>
                ))}
            </optgroup>
          </select>

          <select
            value={selectedChapter}
            onChange={e => setSelectedChapter(Number(e.target.value))}
            className="w-24 bg-[#040404] border border-[#00B10C]/40 rounded-xl px-3 py-2.5 text-sm"
          >
            {availableChapters.length > 0 ? (
              availableChapters.map(c => (
                <option key={c} value={c}>Cap. {c}</option>
              ))
            ) : (
              <option value={1}>Cap. 1</option>
            )}
          </select>
        </div>
      </header>

      {/* Lion nudge */}
      <div className="px-5 py-3">
        <div className="glass rounded-xl px-4 py-2.5 flex items-start gap-2.5 border border-[#00F511]/15">
          <div className="w-8 h-8 rounded-full border border-[#00F511]/40 flex items-center justify-center flex-shrink-0 lion-glow overflow-hidden bg-[#040404]">
            <Image src="/logo-icon.png" alt="León Verde" width={32} height={32} className="object-cover" />
          </div>
          <p className="text-xs text-[#D8E1D9]/75 leading-relaxed">
            {getLionShortNudge('salvation')}
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 px-5 pb-32 overflow-y-auto">
        {loadingChapter ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#B7F7AC]/60">
            <div className="w-8 h-8 border-2 border-[#00F511]/40 border-t-[#00F511] rounded-full animate-spin mb-4" />
            <p className="text-sm">Cargando capítulo…</p>
          </div>
        ) : chapter ? (
          <div className="max-w-lg mx-auto">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-white">
                {chapter.book} {chapter.chapter}
              </h2>
              <p className="text-xs text-[#B7F7AC]/50">{chapter.version}</p>
            </div>

            <div className="space-y-4 mb-8">
              {chapter.verses.map(v => (
                <p key={v.number} className="leading-relaxed text-[#D8E1D9]/90">
                  <span className="text-[#00F511] text-xs font-medium mr-2">{v.number}</span>
                  {v.text}
                </p>
              ))}
            </div>

            {/* Mark as read */}
            <button
              onClick={handleMarkRead}
              disabled={read}
              className={`w-full py-4 rounded-xl font-semibold transition-all ${
                read
                  ? 'bg-[#00B10C]/20 text-[#B7F7AC] border border-[#00B10C]/40'
                  : 'bg-[#00F511] text-[#040404] hover:bg-[#B7F7AC]'
              }`}
            >
              {(() => {
                const stage = (() => {
                  const pr = loadProfile();
                  return pr?.birthDate ? getLifeStage(calculateAge(pr.birthDate)) : 'adult';
                })();
                const pts = getPointsForAction('bible_chapter', stage);
                return read
                  ? justLogged
                    ? `✓ Capítulo leído · +${pts} Salvation`
                    : '✓ Ya leído'
                  : `Marcar como leído · +${pts} Salvation`;
              })()}
            </button>

            {language === 'original' && (
              <p className="text-xs text-[#B7F7AC]/40 mt-4 text-center">
                Vista original en desarrollo. Se mostrará texto hebreo/griego completo + transliteración en la versión final.
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-16 text-[#B7F7AC]/40">
            <p>No se pudo cargar el capítulo.</p>
          </div>
        )}
      </main>

      <BottomNav variant="default" />
    </div>
  );
}
