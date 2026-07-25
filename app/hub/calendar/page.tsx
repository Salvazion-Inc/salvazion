'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import BottomNav from '@/components/BottomNav';
import {
  todayStr,
  weekDates,
  getEventsForDate,
  ensureDayBasics,
  addEvent,
  toggleEventComplete,
  removeEvent,
  pillarColor,
  pillarLabel,
  CalendarEvent,
  CalendarPillar,
  getDisciplineTemplates
} from '@/lib/calendar/engine';
import { loadProfile } from '@/lib/store/profile';

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [week, setWeek] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPillar, setNewPillar] = useState<CalendarPillar>('salvation');
  const [newTime, setNewTime] = useState('08:00');
  const [name, setName] = useState('');

  const refresh = useCallback(() => {
    const dates = weekDates();
    setWeek(dates);
    // Asegura disciplina base del día seleccionado
    ensureDayBasics(selectedDate);
    setEvents(getEventsForDate(selectedDate));
  }, [selectedDate]);

  useEffect(() => {
    setMounted(true);
    const p = loadProfile();
    if (p?.name) setName(p.name);
    refresh();
  }, [refresh]);

  const handleToggle = (id: string) => {
    toggleEventComplete(id);
    setEvents(getEventsForDate(selectedDate));
  };

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    addEvent({
      title: newTitle.trim(),
      pillar: newPillar,
      type: 'custom',
      date: selectedDate,
      time: newTime,
      durationMin: 30,
      recurring: null
    });
    setNewTitle('');
    setShowAdd(false);
    setEvents(getEventsForDate(selectedDate));
  };

  const handleSeedTemplates = () => {
    const templates = getDisciplineTemplates();
    for (const t of templates) {
      addEvent({ ...t, date: selectedDate });
    }
    setEvents(getEventsForDate(selectedDate));
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#040404] flex items-center justify-center">
        <div className="text-[#8FD99A] animate-pulse">Cargando calendario...</div>
      </div>
    );
  }

  const completed = events.filter(e => e.completed).length;
  const total = events.length;
  const dayLabel = new Date(selectedDate + 'T12:00:00').toLocaleDateString('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'short'
  });

  return (
    <div className="min-h-screen bg-[#040404] text-[#D8E1D9] flex flex-col">
      <header className="px-5 pt-6 pb-3 border-b border-[var(--border-soft)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <Link href="/hub/dashboard" className="text-[var(--sage)] text-sm">←</Link>
            <div className="w-9 h-9 rounded-full border border-[var(--border-strong)] flex items-center justify-center lion-glow overflow-hidden bg-[#040404]">
              <Image src="/logo-icon.png" alt="Salvazion" width={36} height={36} className="object-cover" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#8FD99A]">Calendario</h1>
              <p className="text-[10px] text-[var(--sage)]/80">Disciplina · {name || 'Phalanx'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-white">{completed}/{total}</p>
            <p className="text-[10px] text-[var(--sage)]/80">cumplidos</p>
          </div>
        </div>

        {/* Week strip */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {week.map(d => {
            const dayNum = d.slice(8, 10);
            const isSelected = d === selectedDate;
            const isToday = d === todayStr();
            const dayEvents = getEventsForDate(d);
            const doneCount = dayEvents.filter(e => e.completed).length;
            return (
              <button
                key={d}
                onClick={() => setSelectedDate(d)}
                className={`flex-shrink-0 w-11 py-2 rounded-xl text-center border transition-all ${
                  isSelected
                    ? 'border-[#8FD99A] bg-[var(--surface-active)]'
                    : 'border-[var(--border-soft)]'
                }`}
              >
                <p className="text-[10px] text-[var(--sage)]/80">
                  {new Date(d + 'T12:00:00').toLocaleDateString('es', { weekday: 'narrow' })}
                </p>
                <p className={`text-sm font-semibold ${isToday ? 'text-[#8FD99A]' : 'text-white'}`}>
                  {dayNum}
                </p>
                {dayEvents.length > 0 && (
                  <p className="text-[9px] text-[var(--sage)]/70">{doneCount}/{dayEvents.length}</p>
                )}
              </button>
            );
          })}
        </div>
      </header>

      <main className="flex-1 px-5 pt-4 pb-32 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold capitalize text-white">{dayLabel}</h2>
          <div className="flex gap-2">
            <button
              onClick={handleSeedTemplates}
              className="text-[10px] px-2.5 py-1 rounded-lg border border-[var(--border-soft)] text-[var(--sage)]"
            >
              Plantillas
            </button>
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="text-[10px] px-2.5 py-1 rounded-lg bg-[var(--surface-active)] border border-[var(--border-strong)] text-[#8FD99A]"
            >
              + Evento
            </button>
          </div>
        </div>

        {/* León */}
        <div className="glass rounded-xl px-4 py-3 mb-4 flex items-start gap-2.5 border border-[var(--border-soft)]">
          <div className="w-8 h-8 rounded-full border border-[var(--border-strong)] flex items-center justify-center flex-shrink-0 lion-glow overflow-hidden bg-[#040404]">
            <Image src="/logo-icon.png" alt="León Verde" width={32} height={32} className="object-cover" />
          </div>
          <p className="text-xs text-[#D8E1D9]/80 leading-relaxed">
            {total === 0
              ? 'El León espera tu orden. Carga plantillas o añade la primera disciplina del día.'
              : completed === total
                ? 'Día cumplido. La constancia forja el carácter. Descansa en orden.'
                : `Llevas ${completed} de ${total}. La disciplina no negocia: termina lo que empezaste.`}
          </p>
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="glass rounded-2xl p-4 mb-4 border border-[var(--border-strong)] space-y-3">
            <input
              type="text"
              placeholder="Título de la disciplina"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="w-full bg-[#040404] border border-[var(--border-soft)] rounded-xl px-3 py-2.5 text-sm"
            />
            <div className="flex gap-2">
              <select
                value={newPillar}
                onChange={e => setNewPillar(e.target.value as CalendarPillar)}
                className="flex-1 bg-[#040404] border border-[var(--border-soft)] rounded-xl px-3 py-2.5 text-sm"
              >
                <option value="salvation">Salvation</option>
                <option value="health">Health</option>
                <option value="freedom">Freedom</option>
              </select>
              <input
                type="time"
                value={newTime}
                onChange={e => setNewTime(e.target.value)}
                className="w-28 bg-[#040404] border border-[var(--border-soft)] rounded-xl px-3 py-2.5 text-sm"
              />
            </div>
            <button
              onClick={handleAdd}
              className="btn-primary py-2.5 text-sm"
            >
              Guardar en el día
            </button>
          </div>
        )}

        {/* Events list */}
        <div className="space-y-2">
          {events.length === 0 && (
            <p className="text-center text-sm text-[var(--sage)]/70 py-10">
              Sin disciplinas este día.
            </p>
          )}
          {events.map(ev => (
            <div
              key={ev.id}
              className={`glass rounded-xl p-3.5 border flex items-start gap-3 transition-all ${
                ev.completed ? 'border-[var(--border-strong)] opacity-70' : 'border-[var(--border-soft)]'
              }`}
            >
              <button
                onClick={() => handleToggle(ev.id)}
                className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  ev.completed
                    ? 'border-[#8FD99A] bg-[#7BC98A] text-[#040404]'
                    : 'border-[var(--border-strong)]'
                }`}
              >
                {ev.completed && <span className="text-xs">✓</span>}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {ev.time && (
                    <span className="text-[11px] text-[var(--sage)]/80">{ev.time}</span>
                  )}
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded"
                    style={{ color: pillarColor(ev.pillar), border: `1px solid ${pillarColor(ev.pillar)}40` }}
                  >
                    {pillarLabel(ev.pillar)}
                  </span>
                </div>
                <p className={`text-sm font-medium ${ev.completed ? 'line-through text-[#D8E1D9]/50' : 'text-white'}`}>
                  {ev.title}
                </p>
                {ev.durationMin && (
                  <p className="text-[10px] text-[var(--sage)]/70">{ev.durationMin} min</p>
                )}
              </div>
              <button
                onClick={() => {
                  removeEvent(ev.id);
                  setEvents(getEventsForDate(selectedDate));
                }}
                className="text-[10px] text-[var(--sage)]/60 hover:text-red-400"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex gap-4 justify-center mt-8 text-[10px] text-[var(--sage)]/80">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#7BC98A]" /> Salvation
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#6B8F6E]" /> Health
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#B7F7AC]" /> Freedom
          </span>
        </div>
      </main>

      <BottomNav variant="extended" />
    </div>
  );
}
