/**
 * @file apps/web/src/app/manager/exams/page.tsx
 * @description Manager Proctored Exam Operations Center: Candidate roster, live anti-cheat telemetry,
 * real-time session lock/unlock actions, and formula-safe CSV export.
 */

"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Radio, Clock, Download } from 'lucide-react';

interface CandidateUser {
  id: string;
  name: string;
  email: string;
  securityNumber: string | null;
  avatar: string | null;
}

interface CandidateSession {
  id: string;
  examId: string;
  userId: string;
  status: string; // IN_PROGRESS, SUBMITTED, LOCKED_OUT, TIMED_OUT
  warnings: number;
  warningAllowance: number;
  totalScore: number | null;
  joinedAt: string;
  submittedAt: string | null;
  user: CandidateUser;
}

interface ExamSummary {
  id: string;
  title: string;
  subject: string;
  durationMinutes: number;
  extensionMinutes: number;
  maxWarnings: number;
  scheduledAt: string;
  closesAt: string | null;
  status: string;
  questionCount: number;
  _count: {
    enrollments: number;
    sessions: number;
  };
}

interface ExamDetail extends ExamSummary {
  sessions: CandidateSession[];
}

export default function ManagerExamsPage() {
  const [exams, setExams] = useState<ExamSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [selectedExam, setSelectedExam] = useState<ExamDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Create Exam Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [examTitle, setExamTitle] = useState('');
  const [examSubject, setExamSubject] = useState('Mathematics');
  const [examDuration, setExamDuration] = useState('60');
  const [examMaxWarnings, setExamMaxWarnings] = useState('3');
  const [examScheduledAt, setExamScheduledAt] = useState('');
  const [candidateEmails, setCandidateEmails] = useState('');

  // Announcement Modal
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);

  // Time Extension Modal
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extensionMinutes, setExtensionMinutes] = useState('15');
  const [extending, setExtending] = useState(false);

  async function fetchExams() {
    setLoading(true);
    try {
      const res = await fetch('/api/exam-platform/exams');
      if (!res.ok) throw new Error('Failed to load exams');
      const data = await res.json();
      setExams(data.exams || []);
      if (data.exams?.length > 0 && !selectedExamId) {
        setSelectedExamId(data.exams[0].id);
        fetchExamDetail(data.exams[0].id);
      }
    } catch (err: unknown) {
      setToastMessage({ type: 'error', text: err instanceof Error ? err.message : 'Error loading exams' });
    } finally {
      setLoading(false);
    }
  }

  async function fetchExamDetail(examId: string) {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/exam-platform/exams/${examId}`);
      if (!res.ok) throw new Error('Failed to load exam sessions');
      const data = await res.json();
      setSelectedExam(data.exam);
    } catch (err: unknown) {
      setToastMessage({ type: 'error', text: err instanceof Error ? err.message : 'Error loading exam roster' });
    } finally {
      setLoadingDetail(false);
    }
  }

  useEffect(() => {
    fetchExams();
  }, []);

  async function handleCandidateAction(
    userId: string,
    action: 'LOCK' | 'UNLOCK' | 'GRANT_WARNING_ALLOWANCE' | 'RESET_WARNINGS' | 'FORCE_SUBMIT',
    reason = 'Manager direct action'
  ) {
    if (!selectedExamId) return;
    try {
      const res = await fetch(`/api/exam-platform/exams/${selectedExamId}/sessions/${userId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');

      setToastMessage({ type: 'success', text: `Action ${action} executed successfully` });
      fetchExamDetail(selectedExamId);
    } catch (err: unknown) {
      setToastMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to execute moderation action' });
    }
  }

  async function handleCreateExam(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const emails = candidateEmails
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.includes('@'));

      const res = await fetch('/api/exam-platform/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: examTitle,
          subject: examSubject,
          durationMinutes: parseInt(examDuration, 10),
          maxWarnings: parseInt(examMaxWarnings, 10),
          scheduledAt: new Date(examScheduledAt || Date.now()).toISOString(),
          questions: [
            {
              prompt: 'Sample Question 1: What is the derivative of f(x) = x^2?',
              type: 'MULTIPLE_CHOICE_SINGLE',
              choices: [
                { text: '2x', isCorrect: true },
                { text: 'x', isCorrect: false },
                { text: 'x^2 / 2', isCorrect: false },
                { text: '2', isCorrect: false },
              ],
              points: 2,
            },
          ],
          enrolledEmails: emails,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create exam');

      setToastMessage({ type: 'success', text: 'Proctored exam created!' });
      setShowCreateModal(false);
      setExamTitle('');
      fetchExams();
    } catch (err: unknown) {
      setToastMessage({ type: 'error', text: err instanceof Error ? err.message : 'Error creating exam' });
    } finally {
      setCreating(false);
    }
  }

  async function handleBroadcast(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedExamId || !announcementText.trim()) return;
    setBroadcasting(true);
    try {
      const res = await fetch(`/api/exam-platform/exams/${selectedExamId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcement: announcementText.trim() }),
      });
      if (!res.ok) throw new Error('Broadcast failed');

      setToastMessage({ type: 'success', text: 'Announcement broadcasted to candidates' });
      setShowBroadcastModal(false);
      setAnnouncementText('');
    } catch (err: unknown) {
      setToastMessage({ type: 'error', text: err instanceof Error ? err.message : 'Broadcast error' });
    } finally {
      setBroadcasting(false);
    }
  }

  async function handleExtendExam(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedExamId) return;
    setExtending(true);
    try {
      const extra = parseInt(extensionMinutes, 10) || 15;
      const current = selectedExam?.extensionMinutes || 0;
      const res = await fetch(`/api/exam-platform/exams/${selectedExamId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extensionMinutes: current + extra }),
      });
      if (!res.ok) throw new Error('Failed to extend exam');

      setToastMessage({ type: 'success', text: `Added +${extra} minutes to room` });
      setShowExtendModal(false);
      fetchExamDetail(selectedExamId);
    } catch (err: unknown) {
      setToastMessage({ type: 'error', text: err instanceof Error ? err.message : 'Extension error' });
    } finally {
      setExtending(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 p-6 md:p-10 font-sans">
      {/* Top Header */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-stone-800 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/manager" className="text-emerald-400 hover:text-emerald-300 text-xs font-mono uppercase tracking-wider">
              ← Workspace Dashboard
            </Link>
            <span className="text-stone-600">/</span>
            <span className="text-stone-400 text-xs font-mono uppercase tracking-wider">Exam Ops</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            Exam Operations Center <Badge variant="brand">Live Telemetry</Badge>
          </h1>
          <p className="text-stone-400 text-sm mt-1">
            Real-time proctor monitoring, anti-cheat tab-blur telemetry, candidate room control, and formula-safe CSV reporting.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/manager/courses">
            <Button variant="outline" size="sm">Course Studio ↗</Button>
          </Link>
          <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
            + Create Exam
          </Button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Exams Selection */}
        <section className="lg:col-span-4 space-y-3">
          <h2 className="text-xs font-mono uppercase tracking-wider text-stone-400 mb-2">
            Active & Scheduled Exams
          </h2>

          {loading ? (
            <div className="py-12 text-center text-stone-500">Loading exams...</div>
          ) : exams.length === 0 ? (
            <Card className="p-6 text-center bg-stone-950 border-stone-800 text-stone-400">
              <p className="font-semibold text-white mb-1">No proctored exams</p>
              <p className="text-xs">Schedule an exam to start monitoring candidates.</p>
              <Button variant="primary" size="sm" className="mt-3" onClick={() => setShowCreateModal(true)}>
                + Create Exam
              </Button>
            </Card>
          ) : (
            exams.map((ex) => {
              const isSelected = selectedExamId === ex.id;
              return (
                <Card
                  key={ex.id}
                  onClick={() => {
                    setSelectedExamId(ex.id);
                    fetchExamDetail(ex.id);
                  }}
                  className={`p-4 bg-stone-950 border cursor-pointer transition-all hover:border-emerald-500/50 ${
                    isSelected ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-stone-800'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <Badge variant={ex.status === 'IN_PROGRESS' ? 'warning' : ex.status === 'PUBLISHED' ? 'success' : 'neutral'}>
                        {ex.status}
                      </Badge>
                      <h3 className="font-bold text-white text-sm mt-1">{ex.title}</h3>
                      <p className="text-xs text-stone-400">{ex.subject} · {ex.durationMinutes}m (+{ex.extensionMinutes}m)</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-stone-900 flex justify-between text-xs text-stone-400 font-mono">
                    <span>{ex._count.enrollments} Enrolled</span>
                    <span>{ex._count.sessions} Sessions</span>
                  </div>
                </Card>
              );
            })
          )}
        </section>

        {/* Right Column: Candidate Roster & Moderation */}
        <section className="lg:col-span-8 space-y-6">
          {selectedExam ? (
            <Card className="p-6 bg-stone-950 border-stone-800">
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-stone-800 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={selectedExam.status === 'IN_PROGRESS' ? 'warning' : 'success'}>
                      {selectedExam.status}
                    </Badge>
                    <span className="text-xs font-mono text-stone-400">Exam ID: {selectedExam.id}</span>
                  </div>
                  <h2 className="text-2xl font-black text-white">{selectedExam.title}</h2>
                  <p className="text-xs text-stone-400 mt-1">
                    Scheduled: {new Date(selectedExam.scheduledAt).toLocaleString('en-IN')} · Max Allowed Warnings: {selectedExam.maxWarnings}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowBroadcastModal(true)} className="flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5" />
                    <span>Broadcast</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowExtendModal(true)} className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>+Time</span>
                  </Button>
                  <a
                    href={`/api/exam-platform/exams/${selectedExam.id}/export`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs px-3 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV Export</span>
                  </a>
                </div>
              </div>

              {/* Candidates Table */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-white text-base">Candidate Roster & Telemetry</h3>
                  <button
                    onClick={() => fetchExamDetail(selectedExam.id)}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1"
                  >
                    ↻ Refresh
                  </button>
                </div>

                {loadingDetail ? (
                  <div className="py-12 text-center text-stone-500">Refreshing telemetry...</div>
                ) : !selectedExam.sessions || selectedExam.sessions.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-stone-800 rounded-lg text-stone-500">
                    No candidates have joined this exam room yet. When students enter with full-screen lockdown, telemetry updates live.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-900 text-stone-400 font-mono uppercase text-[11px] border-b border-stone-800">
                        <tr>
                          <th className="py-2.5 px-3">Candidate</th>
                          <th className="py-2.5 px-3">Security ID</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Infractions</th>
                          <th className="py-2.5 px-3">Score</th>
                          <th className="py-2.5 px-3 text-right">Moderation Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-800">
                        {selectedExam.sessions.map((sess) => {
                          const isLocked = sess.status === 'LOCKED_OUT';
                          const isSubmitted = sess.status === 'SUBMITTED';

                          return (
                            <tr key={sess.id} className="hover:bg-stone-900/50">
                              <td className="py-3 px-3">
                                <div className="font-semibold text-white">{sess.user?.name || 'Anonymous'}</div>
                                <div className="text-[11px] text-stone-500">{sess.user?.email}</div>
                              </td>
                              <td className="py-3 px-3 font-mono text-emerald-400">
                                {sess.user?.securityNumber || 'SEC-—'}
                              </td>
                              <td className="py-3 px-3">
                                <Badge variant={isLocked ? 'error' : isSubmitted ? 'success' : 'brand'}>
                                  {sess.status}
                                </Badge>
                              </td>
                              <td className="py-3 px-3">
                                <span className={`font-bold font-mono ${sess.warnings >= (sess.warningAllowance || 3) ? 'text-red-400' : 'text-stone-300'}`}>
                                  {sess.warnings} / {sess.warningAllowance || selectedExam.maxWarnings}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-mono font-bold text-white">
                                {sess.totalScore !== null ? `${sess.totalScore} pts` : '—'}
                              </td>
                              <td className="py-3 px-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {isLocked ? (
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      className="text-[11px] h-6 px-2 bg-emerald-600 hover:bg-emerald-500"
                                      onClick={() => handleCandidateAction(sess.userId, 'UNLOCK')}
                                    >
                                      Unlock
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-[11px] h-6 px-2 text-red-400 border-red-900/60 hover:bg-red-950/40"
                                      onClick={() => handleCandidateAction(sess.userId, 'LOCK')}
                                      disabled={isSubmitted}
                                    >
                                      Lock
                                    </Button>
                                  )}

                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-[11px] h-6 px-2 text-stone-300"
                                    onClick={() => handleCandidateAction(sess.userId, 'GRANT_WARNING_ALLOWANCE')}
                                    disabled={isSubmitted}
                                  >
                                    +1 Warn
                                  </Button>

                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-[11px] h-6 px-2 text-stone-400"
                                    onClick={() => handleCandidateAction(sess.userId, 'RESET_WARNINGS')}
                                    disabled={isSubmitted}
                                  >
                                    Reset
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <div className="py-20 text-center text-stone-500">
              Select an exam from the left to inspect candidate sessions and telemetry.
            </div>
          )}
        </section>
      </main>

      {/* Modal: Create Exam */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Schedule Proctored Exam"
      >
        <form onSubmit={handleCreateExam} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">Exam Title</label>
            <Input
              required
              placeholder="e.g. End Term Proctored Examination 2026"
              value={examTitle}
              onChange={(e) => setExamTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">Subject</label>
              <Input
                value={examSubject}
                onChange={(e) => setExamSubject(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">Duration (Minutes)</label>
              <Input
                type="number"
                value={examDuration}
                onChange={(e) => setExamDuration(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">Max Infraction Warnings</label>
              <Input
                type="number"
                value={examMaxWarnings}
                onChange={(e) => setExamMaxWarnings(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">Scheduled Start Date/Time</label>
              <Input
                type="datetime-local"
                value={examScheduledAt}
                onChange={(e) => setExamScheduledAt(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              Enrolled Candidate Whitelist (1 email per line)
            </label>
            <textarea
              className="w-full bg-stone-900 border border-stone-700 rounded-md p-2 text-xs text-stone-100 h-24 font-mono"
              placeholder="student1@example.com&#10;student2@example.com"
              value={candidateEmails}
              onChange={(e) => setCandidateEmails(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-stone-800">
            <Button variant="outline" type="button" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={creating}>
              {creating ? 'Scheduling...' : 'Schedule Exam'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Broadcast Announcement */}
      <Modal
        isOpen={showBroadcastModal}
        onClose={() => setShowBroadcastModal(false)}
        title="Broadcast Announcement to Candidates"
      >
        <form onSubmit={handleBroadcast} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              Message (appears immediately on candidates' exam room screens)
            </label>
            <textarea
              required
              rows={3}
              className="w-full bg-stone-900 border border-stone-700 rounded-md p-2 text-sm text-stone-100"
              placeholder="e.g. Attention candidates: Please note Question 4 typographical correction..."
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-stone-800">
            <Button variant="outline" type="button" onClick={() => setShowBroadcastModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={broadcasting}>
              {broadcasting ? 'Broadcasting...' : 'Broadcast Announcement'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Extend Exam Time */}
      <Modal
        isOpen={showExtendModal}
        onClose={() => setShowExtendModal(false)}
        title="Extend Room Duration"
      >
        <form onSubmit={handleExtendExam} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">Extra Minutes to Add</label>
            <Input
              type="number"
              value={extensionMinutes}
              onChange={(e) => setExtensionMinutes(e.target.value)}
            />
            <p className="text-[11px] text-stone-500 mt-1">
              All active candidate timers will synchronize and increase by this amount.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-stone-800">
            <Button variant="outline" type="button" onClick={() => setShowExtendModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={extending}>
              {extending ? 'Updating...' : 'Add Time'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Toast Feedback */}
      {toastMessage && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-xl text-sm ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950 border-emerald-800 text-emerald-200'
              : 'bg-red-950 border-red-800 text-red-200'
          }`}
        >
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-stone-400 hover:text-white text-xs ml-2 font-bold"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
