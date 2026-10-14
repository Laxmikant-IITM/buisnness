'use client';

/**
 * Student Homework & Assignment Submission Center
 * Module: Homework & Grading Engine (src/app/(student)/homework/page.tsx)
 *
 * Provides a comprehensive assignment tracker for enrolled courses:
 * - Pending assignments with dynamic deadline countdown timers.
 * - Multi-file submission modal supporting file artifact URLs and submission notes.
 * - Graded homework viewer with instructor feedback notes and score badges.
 * - Filter tabs: Pending, Submitted, and All Assignments.
 */

import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Upload,
  Plus,
  Trash2,
  ExternalLink,
  BookOpen,
  Award,
  X,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface HomeworkItem {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  fileUrls: string[];
  dueAt: string | null;
  isOpen: boolean;
  createdAt: string;
  course: {
    id: string;
    title: string;
    slug: string;
    color: string | null;
    icon: string | null;
  };
  submission: {
    id: string;
    fileUrls: string[];
    note: string | null;
    score: number | null;
    feedback: string | null;
    submittedAt: string;
  } | null;
  isSubmitted: boolean;
  isOverdue: boolean;
  submissionCount: number;
}

/**
 * Student Homework Center Page Component.
 */
export default function HomeworkPage() {
  const [homeworks, setHomeworks] = useState<HomeworkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pending' | 'submitted' | 'all'>('pending');

  // Submission Modal state
  const [activeSubmissionHw, setActiveSubmissionHw] = useState<HomeworkItem | null>(null);
  const [fileUrls, setFileUrls] = useState<string[]>(['']);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  /**
   * Fetches homework assignments and student submission states.
   */
  const fetchHomeworks = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/homework');
      if (res.ok) {
        const data = await res.json();
        setHomeworks(data.homeworks || []);
      }
    } catch (err) {
      console.error('[HomeworkPage] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeworks();
  }, []);

  /**
   * Formats deadline countdown relative to current time.
   */
  const formatCountdown = (dueAtStr: string | null) => {
    if (!dueAtStr) return 'No due date';
    const due = new Date(dueAtStr).getTime();
    const now = Date.now();
    const diff = due - now;

    if (diff <= 0) return 'Overdue';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `Due in ${days}d ${hours}h`;
    return `Due in ${hours}h`;
  };

  /**
   * Opens the submission dialog for a specific homework assignment.
   */
  const handleOpenSubmitModal = (hw: HomeworkItem) => {
    setActiveSubmissionHw(hw);
    setSubmitError(null);
    if (hw.submission && hw.submission.fileUrls.length > 0) {
      setFileUrls(hw.submission.fileUrls);
      setNote(hw.submission.note || '');
    } else {
      setFileUrls(['']);
      setNote('');
    }
  };

  /**
   * Adds another file URL field to multi-file submission form.
   */
  const handleAddFileUrl = () => {
    if (fileUrls.length < 5) {
      setFileUrls([...fileUrls, '']);
    }
  };

  /**
   * Removes a file URL field from the form.
   */
  const handleRemoveFileUrl = (index: number) => {
    setFileUrls(fileUrls.filter((_, i) => i !== index));
  };

  /**
   * Submits homework solution files to the API.
   */
  const handleSubmitHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubmissionHw) return;

    const validUrls = fileUrls.map((u) => u.trim()).filter((u) => u.length > 0);
    if (validUrls.length === 0) {
      setSubmitError('Please provide at least one valid submission file URL.');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);
      const res = await fetch(`/api/homework/${activeSubmissionHw.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrls: validUrls,
          note: note.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setSubmitError(errData.error || 'Failed to submit assignment.');
        return;
      }

      await fetchHomeworks();
      setActiveSubmissionHw(null);
    } catch {
      setSubmitError('Network failure while recording submission.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered assignments
  const filtered = homeworks.filter((hw) => {
    if (tab === 'pending') return !hw.isSubmitted && hw.isOpen;
    if (tab === 'submitted') return hw.isSubmitted;
    return true;
  });

  return (
    <div className="space-y-6 text-stone-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-stone-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800 mb-2 font-mono">
            <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Academic Assignments</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
            Homework Submission Center
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 mt-1 font-sans">
            Upload assignment artifacts, verify grading scores, and receive individualized mentor feedback.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 bg-stone-900/80 p-1 rounded-xl border border-stone-800">
          {(
            [
              { id: 'pending', label: 'Pending Due' },
              { id: 'submitted', label: 'Submitted & Graded' },
              { id: 'all', label: 'All Assignments' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                tab === t.id
                  ? 'bg-emerald-500 text-stone-950 font-bold shadow-xs'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Assignment List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 rounded-xl bg-stone-900/60 animate-pulse border border-stone-800" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-[#121714] rounded-2xl border border-stone-800 text-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-800 flex items-center justify-center text-emerald-400 mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-white">
            {tab === 'pending' ? 'All caught up!' : 'No assignments found'}
          </p>
          <p className="text-xs text-stone-400 mt-1 max-w-sm">
            {tab === 'pending'
              ? 'You have completed all pending homework assignments for enrolled courses.'
              : 'Assignments will appear here once scheduled by your instructors.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((hw) => {
            const hasSubmission = Boolean(hw.submission);
            const isGraded = hw.submission?.score !== null && hw.submission?.score !== undefined;

            return (
              <div
                key={hw.id}
                className="bg-[#121714] rounded-2xl border border-stone-800 p-5 shadow-xs hover:border-emerald-500/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-mono text-stone-400 uppercase tracking-wide">
                      {hw.course.title}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isGraded
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : hasSubmission
                          ? 'bg-blue-950 text-blue-300 border border-blue-800'
                          : hw.isOverdue
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {isGraded ? (
                        <>
                          <Award className="w-3 h-3 text-emerald-400" />
                          <span>Graded: {hw.submission?.score}/100</span>
                        </>
                      ) : hasSubmission ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-blue-400" />
                          <span>Submitted</span>
                        </>
                      ) : hw.isOverdue ? (
                        <>
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                          <span>Overdue</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>Pending</span>
                        </>
                      )}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-white font-display">
                    {hw.title}
                  </h3>

                  {hw.description && (
                    <p className="text-xs text-stone-300 line-clamp-2 font-sans max-w-2xl">
                      {hw.description}
                    </p>
                  )}

                  {/* Deadline & Attachments */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-stone-400 pt-1">
                    {hw.dueAt && (
                      <span className="flex items-center gap-1 font-mono text-stone-300 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        <span>{formatCountdown(hw.dueAt)}</span>
                        <span className="text-stone-400 font-normal">
                          ({new Date(hw.dueAt).toLocaleDateString()})
                        </span>
                      </span>
                    )}

                    {hw.fileUrls.length > 0 && (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <FileText className="w-3.5 h-3.5" />
                        <span>{hw.fileUrls.length} Instructions / Reference Files</span>
                      </span>
                    )}
                  </div>

                  {/* Instructor Feedback Box if graded */}
                  {hw.submission?.feedback && (
                    <div className="mt-3 p-3 bg-emerald-950/40 border border-emerald-800/80 rounded-xl text-xs text-emerald-200">
                      <span className="font-bold block mb-0.5 text-emerald-300">Mentor Evaluation:</span>
                      <p>{hw.submission.feedback}</p>
                    </div>
                  )}
                </div>

                {/* Submit Action */}
                <div className="flex flex-col sm:items-end justify-center shrink-0">
                  {hw.isOpen ? (
                    <Button
                      onClick={() => handleOpenSubmitModal(hw)}
                      className={`text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-transform ${
                        hasSubmission
                          ? 'bg-stone-800 hover:bg-stone-700 text-white border border-stone-700'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-stone-950'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{hasSubmission ? 'Update Submission' : 'Submit Homework'}</span>
                    </Button>
                  ) : (
                    <span className="text-xs text-stone-500 font-mono">Assignment Closed</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submission Modal */}
      {activeSubmissionHw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-[#0f1411] rounded-2xl p-6 shadow-2xl border border-stone-800 space-y-4 text-stone-100">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-stone-400">
                  {activeSubmissionHw.course.title}
                </span>
                <h3 className="font-extrabold text-base text-white font-display">
                  Submit: {activeSubmissionHw.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveSubmissionHw(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitError && (
              <div className="p-3 bg-rose-950/50 border border-rose-800 rounded-lg text-xs text-rose-300">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmitHomework} className="space-y-4">
              {/* File URLs */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-stone-300">
                    Solution Artifact URLs (Drive, GitHub, PDF)
                  </label>
                  {fileUrls.length < 5 && (
                    <button
                      type="button"
                      onClick={handleAddFileUrl}
                      className="text-xs text-emerald-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add File URL</span>
                    </button>
                  )}
                </div>

                {fileUrls.map((url, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="url"
                      value={url}
                      required
                      onChange={(e) => {
                        const updated = [...fileUrls];
                        updated[idx] = e.target.value;
                        setFileUrls(updated);
                      }}
                      placeholder="https://drive.google.com/... or https://github.com/..."
                      className="flex-1 bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    {fileUrls.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveFileUrl(idx)}
                        className="text-stone-400 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Note input */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300">
                  Submission Notes / Comments (Optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Notes for the grading mentor (e.g. edge case test results, execution instructions)..."
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-800">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setActiveSubmissionHw(null)}
                  className="text-xs border-stone-700 text-stone-300 hover:bg-stone-800 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-bold cursor-pointer"
                >
                  {submitting ? 'Recording Submission...' : 'Confirm Submission'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
