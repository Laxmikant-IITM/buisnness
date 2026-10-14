'use client';

/**
 * Interactive Student Academic Calendar Component
 * Module: Student Calendar & Schedules (src/app/(student)/calendar/page.tsx)
 *
 * Provides a unified monthly grid aggregating multiple academic timelines:
 * - Live lecture & webinar schedules (Google Meet/YouTube).
 * - Homework submission deadlines & cutoff timers.
 * - Proctored and mock exam schedules.
 * Supports month navigation, category filtering, and daily schedule inspection modals.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Video,
  FileCheck,
  GraduationCap,
  Clock,
  ExternalLink,
  X,
  Filter,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  timeStr: string;
  category: 'LIVE_CLASS' | 'HOMEWORK' | 'EXAM';
  courseName: string;
  link: string;
  details?: string | null;
}

const CATEGORY_STYLES = {
  LIVE_CLASS: {
    bg: 'bg-blue-50 text-blue-800 border-blue-200',
    dot: 'bg-blue-600',
    badge: 'Live Lecture',
    icon: Video,
  },
  HOMEWORK: {
    bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-600',
    badge: 'Assignment Due',
    icon: FileCheck,
  },
  EXAM: {
    bg: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-600',
    badge: 'Proctored Exam',
    icon: GraduationCap,
  },
};

/**
 * Student Interactive Monthly Academic Calendar.
 */
export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterLive, setFilterLive] = useState(true);
  const [filterHomework, setFilterHomework] = useState(true);
  const [filterExam, setFilterExam] = useState(true);

  // Selected Day Modal
  const [selectedDayEvents, setSelectedDayEvents] = useState<{ day: Date; events: CalendarEvent[] } | null>(null);

  /**
   * Fetches and aggregates events from live classes and homework APIs.
   */
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [eventsRes, hwRes] = await Promise.all([
          fetch('/api/events'),
          fetch('/api/homework'),
        ]);

        const aggregated: CalendarEvent[] = [];

        if (eventsRes.ok) {
          const eventsData = await eventsRes.json();
          (eventsData.events || []).forEach((ev: any) => {
            const start = new Date(ev.startTime);
            aggregated.push({
              id: `live-${ev.id}`,
              title: ev.title,
              date: start,
              timeStr: start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              category: 'LIVE_CLASS',
              courseName: ev.course.title,
              link: '/live',
              details: ev.description,
            });
          });
        }

        if (hwRes.ok) {
          const hwData = await hwRes.json();
          (hwData.homeworks || []).forEach((hw: any) => {
            if (hw.dueAt) {
              const due = new Date(hw.dueAt);
              aggregated.push({
                id: `hw-${hw.id}`,
                title: hw.title,
                date: due,
                timeStr: due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                category: 'HOMEWORK',
                courseName: hw.course.title,
                link: '/homework',
                details: hw.description,
              });
            }
          });
        }

        setEvents(aggregated);
      } catch (err) {
        console.error('[CalendarPage] Failed to fetch events:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Compute calendar grid for the current month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
  const daysInMonth = lastDayOfMonth.getDate();

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Filtered event list
  const activeEvents = useMemo(() => {
    return events.filter((ev) => {
      if (ev.category === 'LIVE_CLASS' && !filterLive) return false;
      if (ev.category === 'HOMEWORK' && !filterHomework) return false;
      if (ev.category === 'EXAM' && !filterExam) return false;
      return true;
    });
  }, [events, filterLive, filterHomework, filterExam]);

  /**
   * Returns events occurring on a specific day of the current month.
   */
  const getEventsForDay = (day: number) => {
    return activeEvents.filter((ev) => {
      return (
        ev.date.getFullYear() === year &&
        ev.date.getMonth() === month &&
        ev.date.getDate() === day
      );
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    );
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 text-stone-100">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-stone-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800 mb-2 font-mono">
            <CalendarIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>Academic Schedule</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
            Interactive Calendar
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 mt-1 font-sans">
            Consolidated timeline for live classroom sessions, assignment submission deadlines, and exams.
          </p>
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterLive(!filterLive)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
              filterLive
                ? 'bg-blue-950 text-blue-300 border-blue-800'
                : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5 text-blue-400" />
            <span>Live Classes</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterHomework(!filterHomework)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
              filterHomework
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-white'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Homework Due</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterExam(!filterExam)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
              filterExam
                ? 'bg-amber-950 text-amber-300 border-amber-800'
                : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-white'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
            <span>Exams</span>
          </button>
        </div>
      </div>

      {/* Calendar Controls & Month Header */}
      <div className="flex items-center justify-between bg-[#121714] p-4 rounded-2xl border border-stone-800 shadow-xs">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="text-xs font-bold border-stone-700 text-stone-300 hover:bg-stone-800 hover:text-white"
          >
            Today
          </Button>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white"
              aria-label="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <span className="font-extrabold text-base text-white font-display ml-1">
            {monthName}
          </span>
        </div>

        <div className="text-xs text-stone-400 font-mono">
          {activeEvents.length} events scheduled
        </div>
      </div>

      {/* Calendar Month Grid */}
      <div className="bg-[#121714] rounded-2xl border border-stone-800 shadow-xs overflow-hidden">
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-stone-800 bg-stone-900/60 text-center py-2.5 text-xs font-semibold text-stone-300 font-display">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Days cells */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-stone-800/60 min-h-[500px]">
          {/* Empty prefix padding cells */}
          {Array.from({ length: startDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-stone-950/40 p-2 min-h-[90px]" />
          ))}

          {/* Days in Month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dayEvents = getEventsForDay(dayNum);
            const today = isToday(dayNum);

            return (
              <div
                key={dayNum}
                onClick={() => {
                  if (dayEvents.length > 0) {
                    setSelectedDayEvents({
                      day: new Date(year, month, dayNum),
                      events: dayEvents,
                    });
                  }
                }}
                className={`p-2 min-h-[90px] flex flex-col justify-between transition-colors cursor-pointer hover:bg-stone-900/50 ${
                  today ? 'bg-emerald-950/20' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${
                      today
                        ? 'bg-emerald-500 text-stone-950 font-bold'
                        : 'text-stone-300'
                    }`}
                  >
                    {dayNum}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="text-[10px] text-stone-400 font-mono">
                      {dayEvents.length}
                    </span>
                  )}
                </div>

                {/* Event Pills */}
                <div className="mt-1 space-y-1 overflow-hidden">
                  {dayEvents.slice(0, 2).map((ev) => {
                    const style = CATEGORY_STYLES[ev.category];
                    return (
                      <div
                        key={ev.id}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium border truncate ${style.bg}`}
                        title={`${ev.timeStr} - ${ev.title} (${ev.courseName})`}
                      >
                        <span className="font-bold mr-1">{ev.timeStr}</span>
                        <span>{ev.title}</span>
                      </div>
                    );
                  })}
                  {dayEvents.length > 2 && (
                    <div className="text-[10px] text-stone-400 font-semibold pl-1 font-mono">
                      +{dayEvents.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Inspector Modal */}
      {selectedDayEvents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-[#0f1411] rounded-2xl p-6 shadow-2xl border border-stone-800 space-y-4 text-stone-100">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-white font-display">
                  Events on{' '}
                  {selectedDayEvents.day.toLocaleDateString([], {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                  })}
                </h3>
                <span className="text-xs text-stone-400 font-sans">
                  {selectedDayEvents.events.length} schedule items
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayEvents(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto">
              {selectedDayEvents.events.map((ev) => (
                <div
                  key={ev.id}
                  className="p-3 rounded-xl bg-stone-900/60 border border-stone-800 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{ev.title}</span>
                    <span className="text-[10px] font-mono text-emerald-400">{ev.timeStr}</span>
                  </div>
                  <div className="text-xs text-stone-400">{ev.courseName}</div>
                  {ev.details && <p className="text-xs text-stone-300 mt-1">{ev.details}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
