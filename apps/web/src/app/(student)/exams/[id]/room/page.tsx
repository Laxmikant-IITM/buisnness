/**
 * @file apps/web/src/app/(student)/exams/[id]/room/page.tsx
 * @description Proctored examination candidate room with live security supervision.
 *
 * Cheating Countermeasures & Telemetry:
 * - Fullscreen lockdown: Mandates browser fullscreen; logs telemetry when exited.
 * - Tab blur & visibility telemetry: Intercepts blur and tab-switching, reporting immediately.
 * - Auto-lockout state: Locks candidate screen when warning threshold is breached.
 * - Optimistic revision autosaving: Saves responses with monotonic revision checks.
 * - Live room state synchronization: Syncs timer, pauses, and proctor broadcast popups.
 * - On-screen scientific calculator integration.
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ShieldAlert,
  Lock,
  Maximize2,
  Timer,
  AlertTriangle,
  Megaphone,
  CheckCircle2,
  Calculator,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Shield,
  Eye,
  Camera,
  X,
} from 'lucide-react';
import { MathRenderer } from '@/components/quiz/math-renderer';
import { ScientificCalculator } from '@/components/quiz/scientific-calculator';

interface Choice {
  id: string;
  text: string;
}

interface Question {
  id: string;
  order: number;
  prompt: string;
  type: 'MULTIPLE_CHOICE_SINGLE' | 'MULTIPLE_CHOICE_MULTI' | 'TRUE_FALSE' | 'NUMERICAL';
  points: number;
  choices: Choice[];
}

interface ExamData {
  id: string;
  title: string;
  subject: string;
  instructions?: string | null;
  durationMinutes: number;
  extensionMinutes: number;
  maxWarnings: number;
  questions: Question[];
}

interface SessionData {
  id: string;
  status: string;
  warnings: number;
  warningAllowance: number;
  revision: number;
  answers: Record<string, unknown>;
}

export default function ProctoredExamRoomPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params?.id as string;

  // Proctoring Entry Gate
  const [hasConsented, setHasConsented] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Exam and Session Data
  const [exam, setExam] = useState<ExamData | null>(null);
  const [session, setSession] = useState<SessionData | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const revisionRef = useRef(0);

  // Live Telemetry & Timing State
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [isExamPaused, setIsExamPaused] = useState(false);
  const [warningCount, setWarningCount] = useState(0);
  const [maxWarnings, setMaxWarnings] = useState(3);
  const [isLocked, setIsLocked] = useState(false);
  const [latestWarningMessage, setLatestWarningMessage] = useState<string | null>(null);

  // Proctor Broadcast Announcements
  const [announcements, setAnnouncements] = useState<Array<{ id: string; text: string }>>([]);
  const [activePopupAnnouncement, setActivePopupAnnouncement] = useState<string | null>(null);
  const seenAnnouncementIds = useRef<Set<string>>(new Set());

  // Tools & Modals
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  /** Join exam session */
  const handleJoinExam = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      // Attempt to enter fullscreen
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen().catch(() => {});
        setIsFullscreen(true);
      }

      const res = await fetch(`/api/exam-platform/exams/${examId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consentMonitoring: true }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to enter examination room.');
        setLoading(false);
        return;
      }

      setExam(data.exam);
      setSession(data.session);
      setAnswers(data.session.answers || {});
      revisionRef.current = data.session.revision || 0;
      setWarningCount(data.session.warnings || 0);
      setMaxWarnings((data.exam.maxWarnings || 3) + (data.session.warningAllowance || 0));
      setIsLocked(data.session.status === 'LOCKED');
      setIsSubmitted(data.session.status === 'SUBMITTED');
      setHasConsented(true);
      setLoading(false);
    } catch {
      setErrorMsg('Could not establish connection to the exam proctor server.');
      setLoading(false);
    }
  };

  /** Dispatch cheating telemetry */
  const sendTelemetryEvent = useCallback(
    async (type: 'blur' | 'fullscreen_exit' | 'visibility_hidden') => {
      if (!hasConsented || isSubmitted || isLocked) return;

      const clientEventId = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

      try {
        const res = await fetch(`/api/exam-platform/exams/${examId}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientEventId,
            type,
            occurredAt: new Date().toISOString(),
          }),
        });

        if (res.ok) {
          const telemetryData = await res.json();
          setWarningCount(telemetryData.warnings);
          setMaxWarnings(telemetryData.maxWarnings);
          if (telemetryData.isLocked) {
            setIsLocked(true);
          }

          let msg = 'Tab blur or window switch detected!';
          if (type === 'fullscreen_exit') msg = 'Full-screen mode was exited!';
          if (type === 'visibility_hidden') msg = 'Exam tab was minimized or placed in background!';

          setLatestWarningMessage(
            `${msg} Warning ${telemetryData.warnings} of ${telemetryData.maxWarnings}.`,
          );
        }
      } catch {
        // Telemetry drop handled on next state sync
      }
    },
    [examId, hasConsented, isSubmitted, isLocked],
  );

  /** Event Listeners for Tab Blur, Fullscreen Exit, Visibility Change */
  useEffect(() => {
    if (!hasConsented || isSubmitted) return;

    const handleBlur = () => {
      sendTelemetryEvent('blur');
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sendTelemetryEvent('visibility_hidden');
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
        sendTelemetryEvent('fullscreen_exit');
      } else {
        setIsFullscreen(true);
      }
    };

    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [hasConsented, isSubmitted, sendTelemetryEvent]);

  /** Periodic State Synchronization (Timer, Pause state, Broadcasts) */
  useEffect(() => {
    if (!hasConsented || isSubmitted) return;

    const syncState = async () => {
      try {
        const res = await fetch(`/api/exam-platform/exams/${examId}/state`);
        if (res.ok) {
          const stateData = await res.json();
          setRemainingSeconds(stateData.remainingSeconds);
          setIsExamPaused(stateData.isPaused);

          if (stateData.session) {
            setWarningCount(stateData.session.warnings);
            setMaxWarnings(stateData.session.maxWarnings);
            setIsLocked(stateData.session.isLocked);
            if (stateData.session.isSubmitted) {
              setIsSubmitted(true);
            }
          }

          // Check for new broadcast announcement
          if (stateData.announcements && stateData.announcements.length > 0) {
            const latest = stateData.announcements[0];
            if (!seenAnnouncementIds.current.has(latest.id)) {
              seenAnnouncementIds.current.add(latest.id);
              setActivePopupAnnouncement(latest.text);
            }
            setAnnouncements(stateData.announcements);
          }
        }
      } catch {
        // Sync retry on next cycle
      }
    };

    syncState();
    const interval = setInterval(syncState, 15000);
    return () => clearInterval(interval);
  }, [examId, hasConsented, isSubmitted]);

  /** Local Countdown Timer Tick */
  useEffect(() => {
    if (remainingSeconds === null || remainingSeconds <= 0 || isExamPaused || isSubmitted) return;

    const tick = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(tick);
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(tick);
  }, [remainingSeconds, isExamPaused, isSubmitted]);

  /** Autosave answers with optimistic concurrency revision locking */
  const autosave = useCallback(
    async (newAnswers: Record<string, unknown>) => {
      if (isLocked || isSubmitted) return;

      try {
        const res = await fetch(`/api/exam-platform/exams/${examId}/answers`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            revision: revisionRef.current,
            answers: newAnswers,
          }),
        });

        if (res.ok) {
          const resData = await res.json();
          revisionRef.current = resData.revision;
        } else if (res.status === 409) {
          // Concurrency conflict: fetch latest server state
          const conflictData = await res.json();
          revisionRef.current = conflictData.currentRevision;
          setAnswers(conflictData.currentAnswers || {});
        }
      } catch {
        // Flaky network: retry on next answer mutation
      }
    },
    [examId, isLocked, isSubmitted],
  );

  /** Select answer option */
  const handleSelectChoice = (questionId: string, choiceId: string, type: string) => {
    if (isLocked || isSubmitted) return;

    const currentSelected = (answers[questionId] as string[]) || [];
    let updated: unknown;

    if (type === 'MULTIPLE_CHOICE_MULTI') {
      updated = currentSelected.includes(choiceId)
        ? currentSelected.filter((id) => id !== choiceId)
        : [...currentSelected, choiceId];
    } else {
      updated = choiceId;
    }

    const nextAnswers = { ...answers, [questionId]: updated };
    setAnswers(nextAnswers);
    autosave(nextAnswers);
  };

  /** Final Submit */
  const handleFinalSubmit = async () => {
    if (isSubmitting || isSubmitted) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/exam-platform/exams/${examId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ finalAnswers: answers }),
      });

      if (res.ok) {
        setIsSubmitted(true);
        setIsSubmitModalOpen(false);
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err.error || 'Submission failed. Please alert invigilator.');
      }
    } catch {
      setErrorMsg('Network error finalizing exam submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Format seconds */
  const formatTime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (hours > 0) {
      return `${hours}:${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Re-enter Fullscreen Helper
  const requestFullscreenLock = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    }
  };

  // 1. Consent Gate View
  if (!hasConsented) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-900 p-6">
        <div className="w-full max-w-xl rounded-2xl border border-stone-800 bg-stone-950 p-8 text-stone-200 shadow-2xl">
          <div className="flex items-center gap-3 border-b border-stone-800 pb-5">
            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-400">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Secure Assessment Gateway
              </span>
              <h1 className="text-xl font-bold text-white">Automated Proctoring Check-in</h1>
            </div>
          </div>

          <div className="my-6 space-y-4 text-xs leading-relaxed text-stone-400">
            <p>
              You are about to enter a supervised formal examination. This session requires your
              explicit authorization for the following automated security controls:
            </p>
            <div className="space-y-2.5 rounded-xl border border-stone-800 bg-stone-900/60 p-4">
              <div className="flex items-center gap-3 text-stone-300">
                <Maximize2 className="h-4 w-4 text-emerald-400" />
                <span>Mandatory full-screen window lockdown.</span>
              </div>
              <div className="flex items-center gap-3 text-stone-300">
                <Eye className="h-4 w-4 text-emerald-400" />
                <span>Continuous browser tab focus & visibility telemetry tracking.</span>
              </div>
              <div className="flex items-center gap-3 text-stone-300">
                <ShieldAlert className="h-4 w-4 text-amber-400" />
                <span>
                  Automated candidate lockout upon exceeding warning threshold ({maxWarnings} warnings).
                </span>
              </div>
            </div>

            {errorMsg && (
              <div className="rounded-lg bg-red-900/30 border border-red-800 p-3 text-xs text-red-300">
                {errorMsg}
              </div>
            )}
          </div>

          <button
            onClick={handleJoinExam}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-lg transition hover:bg-emerald-500"
          >
            <Lock className="h-4 w-4" />
            <span>I Agree & Enter Proctored Exam</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. Exam Submitted Confirmation View
  if (isSubmitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100 p-6">
        <div className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-stone-900">Exam Successfully Submitted</h2>
          <p className="mt-2 text-xs text-stone-600">
            Your responses and proctoring logs have been sealed and safely stored.
          </p>
          <div className="mt-6 rounded-xl bg-stone-50 p-4 text-xs text-stone-500">
            Official marks and performance analytics will be released once results are published by
            the exam administrator.
          </div>
          <button
            onClick={() => router.push('/papers')}
            className="mt-6 rounded-lg bg-emerald-800 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-900"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQ = exam?.questions[currentIdx];
  const questionsList = exam?.questions || [];

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col select-none">
      {/* 1. Infraction Warning Banner */}
      {latestWarningMessage && !isLocked && (
        <div className="bg-amber-600 px-4 py-2 text-center text-xs font-bold text-white flex items-center justify-center gap-2 shadow-sm animate-pulse">
          <AlertTriangle className="h-4 w-4" />
          <span>{latestWarningMessage}</span>
          <button
            onClick={() => setLatestWarningMessage(null)}
            className="ml-4 rounded bg-amber-700 px-2 py-0.5 text-[10px] uppercase hover:bg-amber-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Fullscreen Lost Banner */}
      {!isFullscreen && (
        <div className="bg-red-600 px-4 py-2 text-center text-xs font-bold text-white flex items-center justify-center gap-3">
          <ShieldAlert className="h-4 w-4" />
          <span>Full-screen mode lost! Re-enter fullscreen immediately to avoid infraction penalties.</span>
          <button
            onClick={requestFullscreenLock}
            className="rounded bg-white px-2.5 py-1 text-xs font-bold text-red-700 shadow hover:bg-stone-100"
          >
            Re-enter Fullscreen
          </button>
        </div>
      )}

      {/* 3. Top Exam Room Navigation */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-stone-200 bg-white px-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-900">
            <Shield className="h-3.5 w-3.5 text-emerald-700" />
            <span>Proctor Live</span>
          </div>
          <span className="font-bold text-stone-900 text-sm">{exam?.title}</span>
        </div>

        {/* Center: Realtime Synchronized Timer */}
        <div className="flex items-center gap-2">
          {remainingSeconds !== null && (
            <div
              className={`flex items-center gap-2 rounded-full px-4 py-1.5 font-mono text-sm font-bold shadow-sm ${
                remainingSeconds <= 300
                  ? 'bg-red-100 text-red-700 animate-bounce'
                  : 'bg-stone-900 text-white'
              }`}
            >
              <Timer className="h-4 w-4 text-emerald-400" />
              <span>{formatTime(remainingSeconds)}</span>
            </div>
          )}
          {isExamPaused && (
            <span className="rounded bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">
              EXAM PAUSED BY INVIGILATOR
            </span>
          )}
        </div>

        {/* Right Tools & Warning Badge */}
        <div className="flex items-center gap-3">
          {/* Infraction Warning Meter */}
          <div
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${
              warningCount > 0 ? 'bg-amber-100 text-amber-900' : 'bg-stone-100 text-stone-700'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            <span>
              Warnings: {warningCount}/{maxWarnings}
            </span>
          </div>

          <button
            onClick={() => setIsCalcOpen(!isCalcOpen)}
            className="flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
          >
            <Calculator className="h-3.5 w-3.5 text-emerald-700" />
            <span className="hidden sm:inline">Calculator</span>
          </button>

          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="rounded-lg bg-emerald-800 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-900 shadow-sm"
          >
            Finalize Exam
          </button>
        </div>
      </header>

      {/* Main Examination Workspace */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Column: Question Area */}
        <div className="lg:col-span-3 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm flex flex-col min-h-[580px] justify-between">
          {currentQ ? (
            <div>
              <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                <div className="flex items-center gap-3">
                  <span className="rounded bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-900">
                    Question {currentIdx + 1} of {questionsList.length}
                  </span>
                  <span className="text-xs text-stone-500 font-medium">
                    {currentQ.points} {currentQ.points === 1 ? 'Mark' : 'Marks'}
                  </span>
                </div>
                <span className="text-[10px] uppercase font-semibold text-stone-500 tracking-wider">
                  {currentQ.type.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Stem with KaTeX */}
              <div className="my-6 text-base text-stone-900 leading-relaxed font-medium">
                <MathRenderer content={currentQ.prompt} />
              </div>

              {/* Choices */}
              <div className="space-y-3">
                {currentQ.choices.map((choice) => {
                  const currentAnswer = answers[currentQ.id];
                  const isSelected =
                    currentQ.type === 'MULTIPLE_CHOICE_MULTI'
                      ? Array.isArray(currentAnswer) && currentAnswer.includes(choice.id)
                      : currentAnswer === choice.id;

                  return (
                    <label
                      key={choice.id}
                      onClick={() => handleSelectChoice(currentQ.id, choice.id, currentQ.type)}
                      className={`flex cursor-pointer items-start gap-3.5 rounded-xl border p-4 transition ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-medium shadow-sm'
                          : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-800'
                      }`}
                    >
                      <input
                        type={currentQ.type === 'MULTIPLE_CHOICE_MULTI' ? 'checkbox' : 'radio'}
                        name={`q_${currentQ.id}`}
                        checked={isSelected}
                        onChange={() => {}}
                        className="mt-0.5 h-4 w-4 text-emerald-700"
                      />
                      <div className="flex-1 text-sm">
                        <MathRenderer content={choice.text} />
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-stone-400 text-sm">
              Loading questions...
            </div>
          )}

          {/* Stepper Buttons */}
          <div className="flex items-center justify-between border-t border-stone-100 pt-5 mt-6">
            <button
              onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
              disabled={currentIdx === 0}
              className="flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <button
              onClick={() => setCurrentIdx((prev) => Math.min(questionsList.length - 1, prev + 1))}
              disabled={currentIdx >= questionsList.length - 1}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-800 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-900 disabled:opacity-40 shadow-sm"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Right Column: Palette & Announcements */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-3">
              Question Navigator
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {questionsList.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined && answers[q.id] !== null;
                const isCurrent = idx === currentIdx;

                let style = 'border-stone-200 bg-stone-50 text-stone-700';
                if (isAnswered) style = 'bg-emerald-700 text-white font-bold border-emerald-800';
                if (isCurrent) style += ' ring-2 ring-emerald-500 ring-offset-2';

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-9 rounded-lg border text-xs font-semibold transition ${style}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Broadcast Announcements Stream */}
          {announcements.length > 0 && (
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-xs font-bold text-stone-800">
                <Megaphone className="h-4 w-4 text-emerald-700" />
                <span>Invigilator Announcements</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {announcements.map((a) => (
                  <div key={a.id} className="rounded-lg bg-stone-50 p-2.5 text-xs text-stone-700 border border-stone-200">
                    {a.text}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Scientific Calculator */}
      {isCalcOpen && <ScientificCalculator initialOpen={true} onClose={() => setIsCalcOpen(false)} />}

      {/* Broadcast Announcement Modal Popup */}
      {activePopupAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-2">
              <Megaphone className="h-5 w-5" />
              <span>Broadcast Announcement</span>
            </div>
            <p className="my-3 text-sm text-stone-800 leading-relaxed bg-stone-50 p-3 rounded-lg border border-stone-200">
              {activePopupAnnouncement}
            </p>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActivePopupAnnouncement(null)}
                className="rounded-lg bg-emerald-800 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-900"
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Lockout Screen */}
      {isLocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/90 p-6 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-red-900 bg-stone-900 p-8 text-center text-white shadow-2xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-900/30 text-red-500">
              <Lock className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-red-400">Exam Session Locked</h2>
            <p className="mt-2 text-xs text-stone-400">
              You have exceeded the maximum allowed security infraction limit ({maxWarnings} warnings).
              Input has been locked to preserve exam integrity.
            </p>
            <div className="mt-6 rounded-lg bg-stone-800/80 p-3 text-xs text-stone-300">
              Please contact the proctor or platform manager to review your session log and unlock
              your attempt.
            </div>
          </div>
        </div>
      )}

      {/* Final Submit Confirmation Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-stone-900">Finalize & Submit Exam</h3>
            <p className="mt-1 text-xs text-stone-500">
              Once submitted, you will not be able to change any answers.
            </p>
            <div className="my-4 rounded-xl bg-stone-50 p-4 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-stone-600">Total Questions:</span>
                <span className="font-bold text-stone-900">{questionsList.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Answered Questions:</span>
                <span className="font-bold text-emerald-700">{Object.keys(answers).length}</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="rounded-lg border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Back to Exam
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="rounded-lg bg-emerald-800 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-900 disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Confirm Final Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
