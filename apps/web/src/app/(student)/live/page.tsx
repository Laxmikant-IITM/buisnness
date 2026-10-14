/**
 * @file apps/web/src/app/(student)/live/page.tsx
 * @description Student Live Classes & Schedule Portal.
 *
 * Provides:
 * - Upcoming and live class schedule with synchronized countdowns.
 * - Multi-provider direct join: Google Meet, YouTube Live, and Drive recordings.
 * - Filter tabs for live now, scheduled, and past recordings.
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Video,
  Calendar as CalendarIcon,
  Clock,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface LiveEventItem {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  meetLink: string | null;
  type: string;
  streamProvider: 'MEET' | 'YOUTUBE' | 'DRIVE';
  streamStatus: 'SCHEDULED' | 'LIVE' | 'ENDED';
  isLiveNow: boolean;
  course: {
    id: string;
    title: string;
    slug: string;
    color: string | null;
    icon: string | null;
    teacherName: string | null;
  };
}

/**
 * Live Classes Dashboard Page Component.
 */
export default function LiveClassesPage() {
  const [events, setEvents] = useState<LiveEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'all' | 'live' | 'upcoming' | 'past'>('all');

  /**
   * Fetches scheduled live lectures and webinars from API.
   */
  const fetchLiveEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveEvents();
  }, []);

  /**
   * Filtered lists according to stream status.
   */
  const filteredEvents = useMemo(() => {
    const now = new Date();
    return events.filter((ev) => {
      const start = new Date(ev.startTime);
      const end = new Date(ev.endTime);

      if (filterTab === 'live') {
        return ev.isLiveNow || (now >= start && now <= end);
      }
      if (filterTab === 'upcoming') {
        return start > now;
      }
      if (filterTab === 'past') {
        return end < now;
      }
      return true;
    });
  }, [events, filterTab]);

  /**
   * Finds next upcoming session for hero spotlight.
   */
  const nextSession = useMemo(() => {
    const now = new Date();
    return events
      .filter((ev) => new Date(ev.endTime) > now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];
  }, [events]);

  /**
   * Dynamic countdown timer calculation for spotlight hero.
   */
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (!nextSession) {
      setTimeRemaining('');
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const target = new Date(nextSession.startTime).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeRemaining('LIVE NOW');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(
        `${hours > 0 ? `${hours}h ` : ''}${mins}m ${secs < 10 ? '0' : ''}${secs}s`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [nextSession]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 py-6 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 font-display tracking-tight flex items-center gap-2.5">
            <Video className="w-7 h-7 text-emerald-700" />
            <span>Live Interactive Classes</span>
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            Join real-time video lectures, ask questions with faculty, and participate in scheduled doubt clinics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLiveEvents}
            className="text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Refresh Schedule</span>
          </Button>
        </div>
      </div>

      {/* Spotlight Next Class Hero */}
      {nextSession && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900 to-stone-900 text-white p-6 sm:p-8 shadow-xl border border-emerald-800/40">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono tracking-wide uppercase bg-emerald-400 text-emerald-950 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-950 animate-ping" />
                  Next Up
                </span>
                <span className="text-emerald-200 text-xs font-medium">
                  {nextSession.course.title}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-white">
                {nextSession.title}
              </h2>

              <p className="text-sm text-emerald-100/80 line-clamp-2">
                {nextSession.description || 'Live instructor lecture and problem-solving session.'}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-emerald-200/90 pt-1">
                <div className="flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4 text-emerald-300" />
                  <span>
                    {new Date(nextSession.startTime).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-300" />
                  <span>
                    {new Date(nextSession.startTime).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    -{' '}
                    {new Date(nextSession.endTime).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* CTA Join Actions */}
            <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-center gap-4 shrink-0">
              <div className="text-left sm:text-right">
                <span className="text-[11px] uppercase tracking-wider text-emerald-300 font-mono block">
                  Starts In
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-white">
                  {timeRemaining || 'Loading...'}
                </div>
              </div>

              {nextSession.meetLink ? (
                <a
                  href={nextSession.meetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs shadow-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Join Live Classroom</span>
                </a>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Tabs Filter */}
      <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
        <div className="flex items-center gap-2">
          {(['all', 'live', 'upcoming', 'past'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilterTab(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                filterTab === tab
                  ? 'bg-emerald-800 text-white'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              {tab === 'all' ? 'All Sessions' : tab === 'live' ? 'Live Now' : tab}
            </button>
          ))}
        </div>

        <span className="text-xs text-neutral-500 font-mono">
          Showing {filteredEvents.length} session{filteredEvents.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-56 rounded-xl border border-neutral-200 bg-neutral-50 animate-pulse"
            />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white border border-dashed border-neutral-200 rounded-xl space-y-3">
          <BookOpen className="w-10 h-10 mx-auto text-neutral-400" />
          <h3 className="text-base font-bold text-neutral-800 font-display">
            No sessions match this filter
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Check back later for newly scheduled live masterclasses, webinars, and faculty problem-solving sessions.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => {
            const isLive = event.isLiveNow;

            return (
              <div
                key={event.id}
                className={`relative flex flex-col justify-between rounded-xl border bg-white p-5 transition-shadow hover:shadow-md ${
                  isLive ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-neutral-200'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Tags */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-emerald-800 truncate max-w-[180px]">
                      {event.course.title}
                    </span>
                    <Badge variant={isLive ? 'success' : 'neutral'}>
                      {isLive ? 'LIVE NOW' : event.streamStatus}
                    </Badge>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-bold text-base text-neutral-900 font-display line-clamp-2">
                      {event.title}
                    </h3>
                    {event.description && (
                      <p className="text-xs text-neutral-500 line-clamp-2 mt-1">
                        {event.description}
                      </p>
                    )}
                  </div>

                  {/* Date & Time Details */}
                  <div className="space-y-1.5 pt-2 text-xs text-neutral-600 font-mono">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span>
                        {new Date(event.startTime).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span>
                        {new Date(event.startTime).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        -{' '}
                        {new Date(event.endTime).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {event.course.teacherName && (
                      <div className="text-[11px] text-neutral-500 pt-1">
                        Instructor: <span className="font-sans font-semibold text-neutral-700">{event.course.teacherName}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Join Actions */}
                <div className="pt-4 mt-4 border-t border-neutral-100 flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-neutral-400">
                    Provider: {event.streamProvider}
                  </span>

                  {event.meetLink ? (
                    <a
                      href={event.meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Join Class</span>
                    </a>
                  ) : (
                    <span className="text-xs text-neutral-400 italic">No link provided</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
