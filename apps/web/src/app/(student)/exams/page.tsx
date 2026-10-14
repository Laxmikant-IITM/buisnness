/**
 * @file apps/web/src/app/(student)/exams/page.tsx
 * @description Proctored Examination Center & Anti-Cheat Testing Portal.
 *
 * Provides:
 * - List of active, scheduled, and completed proctored exams.
 * - Direct entrance into `/exams/[id]/room` with anti-cheat lockdown checks.
 * - Hardware and environment readiness checklist (camera, mic, fullscreen, tab blur monitoring).
 * - Direct link to practice papers and in-browser scientific calculator trial.
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Clock,
  AlertTriangle,
  PlayCircle,
  FileCheck2,
  Calendar,
  Lock,
  ExternalLink,
  ChevronRight,
  Maximize2,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ExamItem {
  id: string;
  title: string;
  subject: string;
  instructions: string | null;
  durationMinutes: number;
  extensionMinutes: number;
  maxWarnings: number;
  scheduledAt: string;
  closesAt: string | null;
  status: 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'CONCLUDED' | 'ARCHIVED';
  resultsPublished: boolean;
  questionCount: number;
  session?: {
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'LOCKED' | 'SUBMITTED';
    warnings: number;
    score?: number | null;
  };
  _count?: {
    enrollments: number;
    sessions: number;
  };
}

export default function ExamsPortalPage() {
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadExams() {
      try {
        setLoading(true);
        const res = await fetch('/api/exam-platform/exams');
        if (!res.ok) {
          throw new Error('Failed to load examination schedule.');
        }
        const data = await res.json();
        setExams(data.exams || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load exams.');
      } finally {
        setLoading(false);
      }
    }
    loadExams();
  }, []);

  return (
    <div className="min-h-screen bg-[#090d0b] text-stone-100 p-6 md:p-10 font-sans selection:bg-emerald-800">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-800 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-mono tracking-widest text-emerald-400 uppercase">
                Proctored Examination Suite · Exam GenZ Core
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight font-display">
              Examination & Assessment Center
            </h1>
            <p className="text-stone-400 text-sm mt-1 max-w-2xl">
              Strictly proctored academic assessments with automated anti-cheat telemetry, fullscreen lockdown, tab tracking, and timed answer snapshots.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/papers">
              <Button variant="outline" className="border-stone-700 hover:bg-stone-900 text-stone-200 text-xs">
                Practice Papers Store
              </Button>
            </Link>
            <Link href="/learning">
              <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs">
                Back to Learning
              </Button>
            </Link>
          </div>
        </div>

        {/* Anti-Cheat Rules Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-stone-800 bg-stone-950/60 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800">
              <Maximize2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-white">Mandatory Fullscreen</h4>
              <p className="text-[11px] text-stone-400 mt-0.5 leading-relaxed">
                Exiting fullscreen triggers an immediate strike event sent to the manager telemetry stream.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-stone-800 bg-stone-950/60 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-950/80 text-amber-400 border border-amber-800">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-white">Tab & Focus Tracking</h4>
              <p className="text-[11px] text-stone-400 mt-0.5 leading-relaxed">
                Switching browser tabs or unfocusing the window logs a blur violation event. 3 strikes lock session.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-stone-800 bg-stone-950/60 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-teal-950/80 text-teal-400 border border-teal-800">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-white">Continuous Autosave</h4>
              <p className="text-[11px] text-stone-400 mt-0.5 leading-relaxed">
                Every selected option and numerical input is cryptographically rev-synced every 15 seconds.
              </p>
            </div>
          </div>
        </div>

        {/* Exams List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Assigned Proctored Exams</span>
            </h2>
            <span className="text-xs text-stone-400">
              {exams.length} assessment{exams.length === 1 ? '' : 's'} available
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-stone-400 border border-stone-800 rounded-xl bg-stone-950">
              Loading proctored examination rooms...
            </div>
          ) : error ? (
            <div className="p-6 text-center text-rose-400 border border-rose-900/50 rounded-xl bg-rose-950/20">
              {error}
            </div>
          ) : exams.length === 0 ? (
            <div className="p-12 text-center text-stone-400 border border-stone-800 rounded-xl bg-stone-950">
              No exams scheduled for your enrolled courses right now.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {exams.map((exam) => {
                const isSubmitted = exam.session?.status === 'SUBMITTED';
                const isLocked = exam.session?.status === 'LOCKED';
                const isInProgress = exam.session?.status === 'IN_PROGRESS';

                return (
                  <Card
                    key={exam.id}
                    className="p-6 bg-stone-950/90 border border-stone-800 hover:border-stone-700 transition-all rounded-2xl"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="neutral" className="border-stone-700 text-stone-300 text-[10px]">
                            {exam.subject}
                          </Badge>
                          {exam.status === 'ACTIVE' && (
                            <Badge className="bg-emerald-950 text-emerald-300 border-emerald-800 text-[10px]">
                              ● LIVE NOW
                            </Badge>
                          )}
                          {exam.status === 'SCHEDULED' && (
                            <Badge className="bg-blue-950 text-blue-300 border-blue-800 text-[10px]">
                              SCHEDULED
                            </Badge>
                          )}
                          {isSubmitted && (
                            <Badge className="bg-stone-900 text-stone-300 border-stone-700 text-[10px]">
                              SUBMITTED
                            </Badge>
                          )}
                          {isLocked && (
                            <Badge className="bg-rose-950 text-rose-300 border-rose-800 text-[10px]">
                              LOCKED (STRIKE LIMIT)
                            </Badge>
                          )}
                        </div>

                        <h3 className="text-lg font-bold text-white hover:text-emerald-400 transition-colors">
                          {exam.title}
                        </h3>

                        {exam.instructions && (
                          <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">
                            {exam.instructions}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-xs text-stone-400 pt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-stone-500" />
                            {exam.durationMinutes} Minutes
                          </span>
                          <span className="flex items-center gap-1">
                            <FileCheck2 className="w-3.5 h-3.5 text-stone-500" />
                            {exam.questionCount} Questions
                          </span>
                          <span className="flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                            Max Warnings: {exam.maxWarnings}
                          </span>
                        </div>
                      </div>

                      <div className="flex md:flex-col items-center md:items-end justify-between gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-stone-800">
                        {isSubmitted ? (
                          <div className="text-right">
                            <span className="text-xs text-emerald-400 font-bold block">
                              Exam Submitted
                            </span>
                            <span className="text-[11px] text-stone-400">
                              Awaiting final marks release
                            </span>
                          </div>
                        ) : isLocked ? (
                          <div className="text-right">
                            <span className="text-xs text-rose-400 font-bold block">
                              Session Locked
                            </span>
                            <span className="text-[11px] text-stone-400">
                              Contact proctor supervisor
                            </span>
                          </div>
                        ) : (
                          <Link href={`/exams/${exam.id}/room`} className="w-full sm:w-auto">
                            <Button className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-stone-950 font-bold text-xs shadow-lg shadow-emerald-950 flex items-center gap-2">
                              <span>{isInProgress ? 'Resume Assessment' : 'Enter Exam Room'}</span>
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
