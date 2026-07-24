'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
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
        <div className="text-[#00F511] animate-pulse">Cargando calendario...</div>
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
      <header className="px-5 pt-6 pb-3 border-b border-[#00B10C]/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Link href="/hub/dashboard" className="text-[#B7F7AC]/60 text-sm">←</Link>
            <div className="w-8 h-8 rounded-full border border-[#00F511]/40 flex items-center justify-center lion-glow">
              <span className="text-sm">🦁</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#00F511]">Calendario</h1>
              <p className="text-[10px] text-[#B7F7AC]/50">Disciplina · {name || 'Phalanx'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-white">{completed}/{total}</p>
            <p className="text-[10px] text-[#B7F7AC]/50">cumplidos</p>
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
                    ? 'border-[#00F511] bg-[#00F511]/15'
                    : 'border-[#00B10C]/25'
                }`}
              >
                <p className="text-[10px] text-[#B7F7AC]/50">
                  {new Date(d + 'T12:00:00').toLocaleDateString('es', { weekday: 'narrow' })}
                </p>
                <p className={`text-sm font-semibold ${isToday ? 'text-[#00F511]' : 'text-white'}`}>
                  {dayNum}
                </p>
                {dayEvents.length > 0 && (
                  <p className="text-[9px] text-[#B7F7AC]/40">{doneCount}/{dayEvents.length}</p>
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
              className="text-[10px] px-2.5 py-1 rounded-lg border border-[#00B10C]/40 text-[#B7F7AC]/70"
            >
              Plantillas
            </button>
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="text-[10px] px-2.5 py-1 rounded-lg bg-[#00F511]/15 border border-[#00F511]/40 text-[#00F511]"
            >
              + Evento
            </button>
          </div>
        </div>

        {/* León */}
        <div className="glass rounded-xl px-4 py-3 mb-4 flex items-start gap-2 border border-[#00F511]/15">
          <span className="text-sm">🦁</span>
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
          <div className="glass rounded-2xl p-4 mb-4 border border-[#00F511]/30 space-y-3">
            <input
              type="text"
              placeholder="Título de la disciplina"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="w-full bg-[#040404] border border-[#00B10C]/40 rounded-xl px-3 py-2.5 text-sm"
            />
            <div className="flex gap-2">
              <select
                value={newPillar}
                onChange={e => setNewPillar(e.target.value as CalendarPillar)}
                className="flex-1 bg-[#040404] border border-[#00B10C]/40 rounded-xl px-3 py-2.5 text-sm"
              >
                <option value="salvation">Salvation</option>
                <option value="health">Health</option>
                <option value="freedom">Freedom</option>
              </select>
              <input
                type="time"
                value={newTime}
                onChange={e => setNewTime(e.target.value)}
                className="w-28 bg-[#040404] border border-[#00B10C]/40 rounded-xl px-3 py-2.5 text-sm"
              />
            </div>
            <button
              onClick={handleAdd}
              className="w-full py-2.5 rounded-xl bg-[#00F511] text-[#040404] text-sm font-semibold"
            >
              Guardar en el día
            </button>
          </div>
        )}

        {/* Events list */}
        <div className="space-y-2">
          {events.length === 0 && (
            <p className="text-center text-sm text-[#B7F7AC]/40 py-10">
              Sin disciplinas este día.
            </p>
          )}
          {events.map(ev => (
            <div
              key={ev.id}
              className={`glass rounded-xl p-3.5 border flex items-start gap-3 transition-all ${
                ev.completed ? 'border-[#00F511]/30 opacity-70' : 'border-[#00B10C]/25'
              }`}
            >
              <button
                onClick={() => handleToggle(ev.id)}
                className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  ev.completed
                    ? 'border-[#00F511] bg-[#00F511] text-[#040404]'
                    : 'border-[#00B10C]/50'
                }`}
              >
                {ev.completed && <span className="text-xs">✓</span>}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {ev.time && (
                    <span className="text-[11px] text-[#B7F7AC]/50">{ev.time}</span>
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
                  <p className="text-[10px] text-[#B7F7AC]/40">{ev.durationMin} min</p>
                )}
              </div>
              <button
                onClick={() => {
                  removeEvent(ev.id);
                  setEvents(getEventsForDate(selectedDate));
                }}
                className="text-[10px] text-[#B7F7AC]/30 hover:text-red-400"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex gap-4 justify-center mt-8 text-[10px] text-[#B7F7AC]/50">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#00F511]" /> Salvation
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#00B10C]" /> Health
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#B7F7AC]" /> Freedom
          </span>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-[#040404]/95 border-t border-[#00B10C]/25 backdrop-blur-md px-4 py-3">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <NavItem href="/hub/dashboard" label="Home" icon="🏠" />
          <NavItem href="/hub/bible" label="Bible" icon="📖" />
          <NavItem href="/hub/health" label="Health" icon="⚡" />
          <NavItem href="/hub/calendar" label="Agenda" icon="📅" active />
          <NavItem href="/hub/devotional" label="Devocional" icon="✝️" />
        </div>
      </nav>
    </div>
  );
}

function NavItem({ href, label, icon, active }: { href: string; label: string; icon: string; active?: boolean }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-0.5">
      <span className={`text-xl ${active ? 'opacity-100' : 'opacity-50'}`}>{icon}</span>
      <span className={`text-[10px] ${active ? 'text-[#00F511]' : 'text-[#B7F7AC]/50'}`}>{label}</span>
    </Link>
  );
}
