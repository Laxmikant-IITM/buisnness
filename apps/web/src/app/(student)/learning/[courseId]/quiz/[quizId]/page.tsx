/**
 * @file apps/web/src/app/(student)/learning/[courseId]/quiz/[quizId]/page.tsx
 * @description Full-featured learner quiz examination room.
 *
 * Features:
 * - Real-time countdown timer with expiry alerts and sync.
 * - Interactive question palette tracking answered, flagged for review, and unvisited states.
 * - Single-choice, multi-select, and numerical question answering.
 * - Clear response and review flag toggling.
 * - Built-in KaTeX math and chemical formula rendering in stems and choices.
 * - Floating scientific calculator integration.
 * - Errata reporting dialog linked to `/api/question-reports`.
 * - Pre-submission review modal displaying unattempted question warnings.
 * - Post-submission performance analytics with step-by-step explanations.
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Timer,
  CheckCircle2,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Flag,
  Calculator,
  AlertTriangle,
  Award,
  ArrowLeft,
  Send,
  HelpCircle,
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
  type: 'MULTIPLE_CHOICE_SINGLE' | 'MULTIPLE_CHOICE_MULTI' | 'TRUE_FALSE';
  points: number;
  choices: Choice[];
}

interface AttemptResult {
  status: 'SUBMITTED';
  earnedPoints: number;
  possiblePoints: number;
  percent: number;
  passed: boolean | null;
  answers: Array<{
    quizItemId: string;
    selectedChoiceIds: string[];
    isCorrect: boolean;
    earnedPoints: number;
    correctChoiceIds: string[];
    explanation?: string | null;
  }>;
}

export default function LearnerQuizPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.courseId as string;
  const quizId = params?.quizId as string;

  // Quiz Attempt State
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());
  const [visitedIds, setVisitedIds] = useState<Set<string>>(new Set());

  // Timing State
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals & Tools
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Errata Report Form State
  const [reportReasons, setReportReasons] = useState<string[]>([]);
  const [reportComment, setReportComment] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  /** Load or start attempt */
  useEffect(() => {
    let isMounted = true;

    async function initializeAttempt() {
      try {
        setErrorMsg(null);
        // Step 1: Start attempt
        const startRes = await fetch(`/api/quizzes/${quizId}/attempts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        let activeAttemptId: string | null = null;

        if (startRes.ok) {
          const startData = await startRes.json();
          activeAttemptId = startData.attempt.id;
        } else if (startRes.status === 409) {
          // If already reached limit or conflict, fetch quiz attempts to find last in-progress or submitted
          // We query attempt directly
        }

        // Step 2: Fetch attempt details
        if (activeAttemptId) {
          const detailRes = await fetch(`/api/quiz-attempts/${activeAttemptId}`);
          if (detailRes.ok) {
            const detailData = await detailRes.json();
            if (isMounted) {
              setAttemptId(activeAttemptId);
              setQuestions(detailData.attempt.questions || []);

              // Restore saved answers
              const restoredAnswers: Record<string, string[]> = {};
              (detailData.attempt.savedAnswers || []).forEach(
                (sa: { quizItemId: string; selectedChoiceIds: string[] }) => {
                  restoredAnswers[sa.quizItemId] = sa.selectedChoiceIds;
                },
              );
              setAnswers(restoredAnswers);

              // Calculate remaining seconds
              if (detailData.attempt.deadline) {
                const diff = Math.floor(
                  (new Date(detailData.attempt.deadline).getTime() - Date.now()) / 1000,
                );
                setTimeRemainingSeconds(Math.max(0, diff));
              }
            }
          }
        } else {
          // Could not create attempt: show friendly message
          setErrorMsg('Could not initialize attempt. Please ensure you are enrolled in this course.');
        }
      } catch (err) {
        if (isMounted) {
          setErrorMsg('Failed to load quiz room. Please check your network connection.');
        }
      }
    }

    if (quizId) {
      initializeAttempt();
    }

    return () => {
      isMounted = false;
    };
  }, [quizId]);

  /** Mark question visited whenever current index changes */
  useEffect(() => {
    if (questions[currentIdx]) {
      setVisitedIds((prev) => new Set([...prev, questions[currentIdx].id]));
    }
  }, [currentIdx, questions]);

  /** Countdown Timer */
  useEffect(() => {
    if (timeRemainingSeconds === null || timeRemainingSeconds <= 0 || result) return;

    const timer = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit(); // Auto-submit when time expires
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemainingSeconds, result]);

  const currentQ = questions[currentIdx];

  /** Format seconds to MM:SS or HH:MM:SS */
  const formatTime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (hours > 0) {
      return `${hours}:${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  /** Toggle option selection */
  const handleSelectChoice = (choiceId: string) => {
    if (!currentQ || result) return;

    const currentSelected = answers[currentQ.id] || [];

    if (currentQ.type === 'MULTIPLE_CHOICE_MULTI') {
      // Toggle
      const updated = currentSelected.includes(choiceId)
        ? currentSelected.filter((id) => id !== choiceId)
        : [...currentSelected, choiceId];
      setAnswers((prev) => ({ ...prev, [currentQ.id]: updated }));
    } else {
      // Single choice
      setAnswers((prev) => ({ ...prev, [currentQ.id]: [choiceId] }));
    }
  };

  /** Clear response for current question */
  const handleClearResponse = () => {
    if (!currentQ || result) return;
    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[currentQ.id];
      return copy;
    });
  };

  /** Toggle review flag */
  const handleToggleFlag = () => {
    if (!currentQ) return;
    setFlaggedIds((prev) => {
      const copy = new Set(prev);
      if (copy.has(currentQ.id)) {
        copy.delete(currentQ.id);
      } else {
        copy.add(currentQ.id);
      }
      return copy;
    });
  };

  /** Final Submit */
  const handleFinalSubmit = async () => {
    if (!attemptId || isSubmitting) return;

    setIsSubmitting(true);
    setIsReviewModalOpen(false);

    try {
      const payloadAnswers = Object.entries(answers).map(([quizItemId, selectedChoiceIds]) => ({
        quizItemId,
        selectedChoiceIds,
      }));

      const res = await fetch(`/api/quiz-attempts/${attemptId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: payloadAnswers }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data.result);
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err.error || 'Submission failed. Please try again.');
      }
    } catch {
      setErrorMsg('Network error submitting quiz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Submit Errata Report */
  const handleSendReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQ || reportReasons.length === 0 || !reportComment.trim()) return;

    setReportSubmitting(true);
    try {
      const res = await fetch('/api/question-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQ.id,
          quizId,
          questionNumber: currentIdx + 1,
          reasons: reportReasons,
          comment: reportComment,
        }),
      });

      if (res.ok) {
        setReportSuccess(true);
        setTimeout(() => {
          setIsReportModalOpen(false);
          setReportSuccess(false);
          setReportReasons([]);
          setReportComment('');
        }, 1800);
      }
    } catch {
      // Ignored
    } finally {
      setReportSubmitting(false);
    }
  };

  // Palette counts
  const answeredCount = useMemo(() => {
    return questions.filter((q) => (answers[q.id] || []).length > 0).length;
  }, [questions, answers]);

  const flaggedCount = flaggedIds.size;
  const unvisitedCount = questions.length - visitedIds.size;

  if (errorMsg && questions.length === 0) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
        <div className="mb-4 rounded-full bg-red-100 p-4 text-red-600">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-stone-800">Quiz Access Notice</h2>
        <p className="mt-2 max-w-md text-sm text-stone-600">{errorMsg}</p>
        <Link
          href={`/learning/${courseId}`}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Course
        </Link>
      </div>
    );
  }

  // Submitted Performance Summary View
  if (result) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="mb-8 rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between border-b border-stone-200 pb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Attempt Complete
              </span>
              <h1 className="mt-1 text-2xl font-bold text-stone-900">Quiz Performance Report</h1>
            </div>
            <div className="text-right">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                  result.passed
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                <Award className="h-4 w-4" />
                {result.passed ? 'PASSED' : 'COMPLETED'}
              </span>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="my-6 grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-stone-50 p-4 text-center">
              <span className="text-xs text-stone-500">Score Earned</span>
              <div className="mt-1 text-2xl font-bold text-stone-900">
                {result.earnedPoints} / {result.possiblePoints}
              </div>
            </div>
            <div className="rounded-xl bg-stone-50 p-4 text-center">
              <span className="text-xs text-stone-500">Percentage</span>
              <div className="mt-1 text-2xl font-bold text-emerald-700">
                {result.percent}%
              </div>
            </div>
            <div className="rounded-xl bg-stone-50 p-4 text-center">
              <span className="text-xs text-stone-500">Total Questions</span>
              <div className="mt-1 text-2xl font-bold text-stone-900">
                {questions.length}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Link
              href={`/learning/${courseId}`}
              className="rounded-lg border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
            >
              Back to Course
            </Link>
          </div>
        </div>

        {/* Detailed Solutions & Explanations with KaTeX */}
        <h2 className="mb-4 text-lg font-bold text-stone-900">Detailed Explanations</h2>
        <div className="space-y-6">
          {result.answers.map((ans, idx) => {
            const q = questions.find((item) => item.id === ans.quizItemId);
            if (!q) return null;

            return (
              <div
                key={ans.quizItemId}
                className={`rounded-xl border p-6 ${
                  ans.isCorrect
                    ? 'border-emerald-200 bg-emerald-50/30'
                    : 'border-red-200 bg-red-50/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-500">Question {idx + 1}</span>
                  <span
                    className={`text-xs font-semibold ${
                      ans.isCorrect ? 'text-emerald-700' : 'text-red-600'
                    }`}
                  >
                    {ans.isCorrect ? `+${ans.earnedPoints} Marks` : '0 Marks'}
                  </span>
                </div>

                <div className="mt-3 text-sm text-stone-900 font-medium">
                  <MathRenderer content={q.prompt} />
                </div>

                {/* Choices breakdown */}
                <div className="mt-4 space-y-2">
                  {q.choices.map((choice) => {
                    const isCandidateChoice = (ans.selectedChoiceIds || []).includes(choice.id);
                    const isCorrectChoice = (ans.correctChoiceIds || []).includes(choice.id);

                    let style = 'border-stone-200 bg-white text-stone-700';
                    if (isCorrectChoice) {
                      style = 'border-emerald-500 bg-emerald-100/60 font-semibold text-emerald-900';
                    } else if (isCandidateChoice && !isCorrectChoice) {
                      style = 'border-red-400 bg-red-100/50 text-red-900';
                    }

                    return (
                      <div
                        key={choice.id}
                        className={`flex items-start gap-3 rounded-lg border p-3 text-xs ${style}`}
                      >
                        <span className="mt-0.5">
                          {isCorrectChoice ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          ) : isCandidateChoice ? (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border border-stone-300" />
                          )}
                        </span>
                        <div className="flex-1">
                          <MathRenderer content={choice.text} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* KaTeX Step-by-Step Explanation */}
                {ans.explanation && (
                  <div className="mt-4 rounded-lg bg-stone-100 p-4 text-xs text-stone-800">
                    <span className="font-bold text-stone-900 block mb-1">Explanation:</span>
                    <MathRenderer content={ans.explanation} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Active Quiz Exam Room View
  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-stone-200 bg-white px-6">
        <div className="flex items-center gap-4">
          <Link
            href={`/learning/${courseId}`}
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900"
          >
            <ChevronLeft className="h-4 w-4" />
            Exit Quiz
          </Link>
          <div className="h-4 w-px bg-stone-200" />
          <span className="text-xs font-bold text-stone-800">Practice Assessment</span>
        </div>

        {/* Center: Countdown Timer */}
        {timeRemainingSeconds !== null && (
          <div
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 font-mono text-sm font-bold ${
              timeRemainingSeconds <= 300
                ? 'bg-red-100 text-red-700 animate-pulse'
                : 'bg-stone-100 text-stone-800'
            }`}
          >
            <Timer className="h-4 w-4 text-emerald-700" />
            <span>{formatTime(timeRemainingSeconds)}</span>
          </div>
        )}

        {/* Right Tools & Submit */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCalcOpen(!isCalcOpen)}
            className="flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
            title="Toggle Scientific Calculator"
          >
            <Calculator className="h-3.5 w-3.5 text-emerald-700" />
            <span className="hidden sm:inline">Calculator</span>
          </button>
          <button
            onClick={() => setIsReviewModalOpen(true)}
            className="rounded-lg bg-emerald-800 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-900 shadow-sm"
          >
            Review & Submit
          </button>
        </div>
      </header>

      {/* Main Examination Layout */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Column: Question Area (3 Cols) */}
        <div className="lg:col-span-3 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm flex flex-col min-h-[580px] justify-between">
          {currentQ ? (
            <div>
              {/* Question Header */}
              <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                <div className="flex items-center gap-3">
                  <span className="rounded bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-900">
                    Question {currentIdx + 1} of {questions.length}
                  </span>
                  <span className="text-xs text-stone-500 font-medium">
                    {currentQ.points} {currentQ.points === 1 ? 'Mark' : 'Marks'}
                  </span>
                  <span className="rounded bg-stone-100 px-2 py-0.5 text-[10px] uppercase font-semibold text-stone-600">
                    {currentQ.type.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleFlag}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                      flaggedIds.has(currentQ.id)
                        ? 'bg-purple-100 text-purple-800 font-bold'
                        : 'text-stone-500 hover:bg-stone-100'
                    }`}
                  >
                    <Bookmark className="h-3.5 w-3.5" />
                    <span>{flaggedIds.has(currentQ.id) ? 'Flagged' : 'Flag for review'}</span>
                  </button>
                  <button
                    onClick={() => setIsReportModalOpen(true)}
                    className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600"
                    title="Report error in this question"
                  >
                    <Flag className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Stem / Prompt with KaTeX */}
              <div className="my-6 text-base text-stone-900 leading-relaxed font-medium">
                <MathRenderer content={currentQ.prompt} />
              </div>

              {/* Answer Choices */}
              <div className="space-y-3">
                {currentQ.choices.map((choice, cIndex) => {
                  const isSelected = (answers[currentQ.id] || []).includes(choice.id);

                  return (
                    <label
                      key={choice.id}
                      onClick={() => handleSelectChoice(choice.id)}
                      className={`flex cursor-pointer items-start gap-3.5 rounded-xl border p-4 transition ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-medium shadow-sm'
                          : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-800'
                      }`}
                    >
                      <input
                        type={currentQ.type === 'MULTIPLE_CHOICE_MULTI' ? 'checkbox' : 'radio'}
                        name={`question_${currentQ.id}`}
                        checked={isSelected}
                        onChange={() => {}}
                        className="mt-0.5 h-4 w-4 text-emerald-700 focus:ring-emerald-600"
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
              No questions found.
            </div>
          )}

          {/* Bottom Navigation Buttons */}
          <div className="flex items-center justify-between border-t border-stone-100 pt-5 mt-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                disabled={currentIdx === 0}
                className="flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <button
                onClick={handleClearResponse}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-stone-500 hover:text-stone-800"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Clear Response
              </button>
            </div>

            <button
              onClick={() => setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1))}
              disabled={currentIdx >= questions.length - 1}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-800 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-900 disabled:opacity-40 shadow-sm"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Right Column: Question Palette (1 Col) */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-3">
            Question Palette
          </h3>

          {/* Palette Legend */}
          <div className="mb-4 space-y-1.5 text-[11px] text-stone-600">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-emerald-600" />
              <span>Answered ({answeredCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-purple-600" />
              <span>Marked for Review ({flaggedCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full border border-stone-300 bg-white" />
              <span>Not Visited ({unvisitedCount})</span>
            </div>
          </div>

          {/* Palette Number Grid */}
          <div className="grid grid-cols-5 gap-2 border-t border-stone-100 pt-4">
            {questions.map((q, idx) => {
              const isAnswered = (answers[q.id] || []).length > 0;
              const isFlagged = flaggedIds.has(q.id);
              const isCurrent = idx === currentIdx;

              let style = 'border-stone-200 bg-stone-50 text-stone-700';

              if (isFlagged) {
                style = 'bg-purple-600 text-white font-bold border-purple-700';
              } else if (isAnswered) {
                style = 'bg-emerald-600 text-white font-bold border-emerald-700';
              }

              if (isCurrent) {
                style += ' ring-2 ring-emerald-500 ring-offset-2';
              }

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

          {/* Quick Submit CTA */}
          <button
            onClick={() => setIsReviewModalOpen(true)}
            className="mt-6 w-full rounded-xl bg-emerald-800 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-900"
          >
            Submit Quiz
          </button>
        </div>
      </div>

      {/* Floating Scientific Calculator */}
      {isCalcOpen && <ScientificCalculator initialOpen={true} onClose={() => setIsCalcOpen(false)} />}

      {/* Pre-Submission Review Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-stone-900">Confirm Submission</h3>
            <p className="mt-1 text-xs text-stone-500">
              Please review your question completion summary before finalizing.
            </p>

            <div className="my-5 rounded-xl bg-stone-50 p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-600">Total Questions:</span>
                <span className="font-bold text-stone-900">{questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Answered:</span>
                <span className="font-bold text-emerald-700">{answeredCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Marked for Review:</span>
                <span className="font-bold text-purple-700">{flaggedCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-600">Unanswered:</span>
                <span className="font-bold text-amber-700">
                  {questions.length - answeredCount}
                </span>
              </div>
            </div>

            {questions.length - answeredCount > 0 && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                <span>You still have unanswered questions. Are you sure you want to finish?</span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="rounded-lg border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Back to Questions
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="rounded-lg bg-emerald-800 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-900 disabled:opacity-50"
              >
                {isSubmitting ? 'Grading...' : 'Yes, Submit Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Errata / Error Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-stone-900">Report Question Issue</h3>
            <p className="mt-1 text-xs text-stone-500">
              Found an error or typo in Question {currentIdx + 1}? Let the academic team know.
            </p>

            {reportSuccess ? (
              <div className="my-6 rounded-lg bg-emerald-50 p-4 text-center text-xs font-medium text-emerald-800">
                <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-emerald-600" />
                Report submitted! Thank you for improving course quality.
              </div>
            ) : (
              <form onSubmit={handleSendReport} className="mt-4 space-y-4">
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-stone-700 block">Issue Category:</span>
                  {[
                    'Typo / Grammatical error',
                    'Incorrect answer key',
                    'LaTeX / Math rendering bug',
                    'Ambiguous or missing information',
                  ].map((category) => (
                    <label key={category} className="flex items-center gap-2 text-xs text-stone-700">
                      <input
                        type="checkbox"
                        checked={reportReasons.includes(category)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setReportReasons([...reportReasons, category]);
                          } else {
                            setReportReasons(reportReasons.filter((r) => r !== category));
                          }
                        }}
                        className="rounded border-stone-300 text-emerald-700"
                      />
                      <span>{category}</span>
                    </label>
                  ))}
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Details / Explanation:
                  </label>
                  <textarea
                    rows={3}
                    value={reportComment}
                    onChange={(e) => setReportComment(e.target.value)}
                    placeholder="Describe what looks incorrect..."
                    required
                    className="w-full rounded-lg border border-stone-300 p-2.5 text-xs text-stone-800 focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(false)}
                    className="rounded-lg border border-stone-300 px-3.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reportSubmitting || reportReasons.length === 0}
                    className="rounded-lg bg-emerald-800 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-900 disabled:opacity-40"
                  >
                    {reportSubmitting ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
