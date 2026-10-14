'use client';

/**
 * Student Helpdesk & Support Services Portal
 * Module: Support Helpdesk (src/app/(student)/support/page.tsx)
 *
 * Dedicated support and ticketing interface for learners.
 * Features:
 * - Threaded ticket inspector modal with live conversational replies.
 * - Ticket creation modal with priority selection (Low, Normal, High, Urgent).
 * - Categorized FAQ accordion resolving frequent questions on grading, live classrooms, exams, and homework.
 * - Real-time ticket resolution status indicators.
 */

import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Plus,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  X,
  Send,
  User as UserIcon,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface TicketItem {
  id: string;
  userId: string;
  subject: string;
  body: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
  };
  assignedTo: {
    id: string;
    name: string;
    avatar: string | null;
  } | null;
  _count: {
    replies: number;
  };
}

export interface TicketReplyItem {
  id: string;
  ticketId: string;
  userId: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
    role: string;
  };
}

const FAQ_ITEMS = [
  {
    question: 'How do IITM BS degree absolute grade cutoffs work?',
    answer:
      'Grades are assigned based on strict absolute cutoffs: S Grade (≥ 90), A Grade (≥ 80), B Grade (≥ 70), C Grade (≥ 60), D Grade (≥ 50), and E Grade (≥ 40). If your score falls below 40, an U (Unsatisfactory) grade is awarded. You can use our Academic Tools Predictor to compute exact End-Term targets.',
  },
  {
    question: 'How do I join live lectures and webinars?',
    answer:
      'Navigate to the Live Classes tab. When a class is scheduled or LIVE, click "Join Live Classroom" or "Open Google Meet" to access the live stream with your enrolled faculty.',
  },
  {
    question: 'Can I submit homework assignments after the deadline passes?',
    answer:
      'Deadlines are enforced automatically. If an assignment is marked as closed, further submissions cannot be submitted without an authorized extension. Please raise an urgent support ticket before the cutoff if you encounter extenuating circumstances.',
  },
  {
    question: 'What happens if my proctored exam stream disconnects?',
    answer:
      'Your exam timer and answers are saved continuously to cloud storage. In case of unexpected network interruption, refresh the browser session immediately. If the issue persists, our technical team monitors live session snapshots to assist you.',
  },
  {
    question: 'How do I mute noisy course community channels?',
    answer:
      'Inside any course community chat room, click the volume icon in the top header. You can mute notifications for 1 hour, 8 hours, 24 hours, or indefinitely while still having access to read and post messages.',
  },
];

/**
 * Support Helpdesk Page Component.
 */
export default function SupportPage() {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);

  // FAQ Accordion State
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  // New Ticket Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Active Ticket Viewer State
  const [activeTicket, setActiveTicket] = useState<TicketItem | null>(null);
  const [replies, setReplies] = useState<TicketReplyItem[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  /**
   * Fetches user's support tickets.
   */
  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/support/tickets');
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch (err) {
      console.error('[SupportPage] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  /**
   * Opens ticket conversation viewer and fetches replies.
   */
  const handleOpenTicket = async (ticket: TicketItem) => {
    setActiveTicket(ticket);
    try {
      setLoadingReplies(true);
      const res = await fetch(`/api/support/tickets/${ticket.id}/replies`);
      if (res.ok) {
        const data = await res.json();
        setReplies(data.replies || []);
      }
    } catch (err) {
      console.error('[TicketReplies] Fetch error:', err);
    } finally {
      setLoadingReplies(false);
    }
  };

  /**
   * Submits a new support ticket.
   */
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;

    try {
      setSubmitting(true);
      setCreateError(null);
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          body: body.trim(),
          priority,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setCreateError(data.error || 'Failed to submit support ticket.');
        return;
      }

      setSubject('');
      setBody('');
      setPriority('NORMAL');
      setIsCreateOpen(false);
      await fetchTickets();
    } catch {
      setCreateError('Network failure creating ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Posts a reply to the open ticket thread.
   */
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyBody.trim()) return;

    try {
      setSendingReply(true);
      const res = await fetch(`/api/support/tickets/${activeTicket.id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: replyBody.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setReplies((prev) => [...prev, data.reply]);
        setReplyBody('');
        fetchTickets();
      }
    } catch {
      alert('Failed to send reply.');
    } finally {
      setSendingReply(false);
    }
  };

  const getStatusBadge = (status: TicketItem['status']) => {
    switch (status) {
      case 'OPEN':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">OPEN</span>;
      case 'IN_PROGRESS':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">IN PROGRESS</span>;
      case 'RESOLVED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">RESOLVED</span>;
      case 'CLOSED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-600">CLOSED</span>;
    }
  };

  const getPriorityBadge = (priority: TicketItem['priority']) => {
    switch (priority) {
      case 'URGENT':
        return <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wide">URGENT</span>;
      case 'HIGH':
        return <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wide">HIGH</span>;
      default:
        return <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wide">{priority}</span>;
    }
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-neutral-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 mb-2 font-mono">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Learner Assistance</span>
          </div>
          <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight font-display">
            Support Helpdesk & FAQ
          </h1>
          <p className="text-xs text-neutral-600 mt-1 font-body">
            Get help with academic schedules, course materials, exam proctoring, or technical connectivity.
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Support Ticket</span>
        </Button>
      </div>

      {/* Grid: Tickets List & FAQ Accordion */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Tickets */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base text-neutral-900 font-display">
              Your Support Inquiries
            </h2>
            <span className="text-xs text-neutral-500 font-mono">
              {tickets.length} {tickets.length === 1 ? 'ticket' : 'tickets'}
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-24 rounded-xl bg-neutral-100 animate-pulse border border-neutral-200" />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-8 bg-white rounded-xl border border-neutral-200 text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-neutral-800">No open tickets</p>
              <p className="text-xs text-neutral-500 mt-0.5">
                Have questions or encounter issues? Click &quot;New Support Ticket&quot; to contact counselors.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleOpenTicket(t)}
                  className="bg-white rounded-xl border border-neutral-200 p-4 shadow-xs hover:border-neutral-300 transition-all cursor-pointer flex items-start justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(t.status)}
                      {getPriorityBadge(t.priority)}
                      <span className="text-[10px] text-neutral-400 font-mono">
                        #{t.id.slice(-6)}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-neutral-900 font-display truncate">
                      {t.subject}
                    </h3>
                    <p className="text-xs text-neutral-600 line-clamp-2 font-body">
                      {t.body}
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-neutral-400 font-mono pt-1">
                      <span>Created {new Date(t.createdAt).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-neutral-400" />
                        {t._count.replies} replies
                      </span>
                      {t.assignedTo && (
                        <span className="text-emerald-800">Assigned: {t.assignedTo.name}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: FAQ Accordion */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-700" />
            <h2 className="font-bold text-base text-neutral-900 font-display">
              Frequently Answered Questions
            </h2>
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-100 overflow-hidden shadow-xs">
            {FAQ_ITEMS.map((faq, index) => {
              const isOpen = expandedFaq === index;
              return (
                <div key={index} className="transition-colors">
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(isOpen ? null : index)}
                    className="w-full p-4 text-left flex items-center justify-between gap-3 text-xs font-semibold text-neutral-800 hover:text-emerald-900"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`w-4 h-4 shrink-0 text-neutral-400 transition-transform ${
                        isOpen ? 'rotate-180 text-emerald-700' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs text-neutral-600 leading-relaxed font-body bg-neutral-50/50">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Ticket Conversation Viewer Modal */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-neutral-200 flex flex-col max-h-[85vh] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {getStatusBadge(activeTicket.status)}
                  {getPriorityBadge(activeTicket.priority)}
                  <span className="text-[10px] font-mono text-neutral-400">
                    Ticket #{activeTicket.id.slice(-6)}
                  </span>
                </div>
                <h3 className="font-bold text-base text-neutral-900 font-display">
                  {activeTicket.subject}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTicket(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conversation Stream */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Original Ticket Description */}
              <div className="p-4 rounded-xl bg-neutral-100/70 border border-neutral-200 text-xs text-neutral-800 space-y-1">
                <div className="flex items-center justify-between font-semibold text-emerald-950">
                  <span>{activeTicket.user.name} (Ticket Creator)</span>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {new Date(activeTicket.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="whitespace-pre-wrap">{activeTicket.body}</p>
              </div>

              {/* Threaded Replies */}
              {loadingReplies ? (
                <div className="text-center py-6 text-xs text-neutral-400">Loading discussion thread...</div>
              ) : replies.length === 0 ? (
                <div className="text-center py-6 text-xs text-neutral-400 italic">
                  No replies yet. Our support counselors are reviewing your request.
                </div>
              ) : (
                replies.map((reply) => {
                  const isStaff = reply.user.role !== 'STUDENT';
                  return (
                    <div
                      key={reply.id}
                      className={`p-3.5 rounded-xl border text-xs leading-relaxed space-y-1 ${
                        isStaff
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950 ml-4'
                          : 'bg-white border-neutral-200 text-neutral-800 mr-4'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span className="flex items-center gap-1.5">
                          <span>{reply.user.name}</span>
                          {isStaff && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-200 text-emerald-800 font-mono">
                              Staff Support
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap">{reply.body}</p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Reply Composer */}
            <form onSubmit={handleSendReply} className="p-4 bg-white border-t border-neutral-200 flex items-center gap-2">
              <input
                type="text"
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder="Type a reply to this support ticket..."
                className="flex-1 bg-neutral-50 border border-neutral-300 rounded-lg px-4 py-2.5 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
              <Button
                type="submit"
                disabled={sendingReply || !replyBody.trim()}
                className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Reply</span>
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="font-extrabold text-base text-neutral-900 font-display">
                Create Support Helpdesk Ticket
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-800">Ticket Subject</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Question regarding Week 3 programming assignment cutoff"
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-800">Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white"
                >
                  <option value="LOW">Low - General Inquiry</option>
                  <option value="NORMAL">Normal - Coursework / Clarification</option>
                  <option value="HIGH">High - Grade Discrepancy / Submission Issue</option>
                  <option value="URGENT">Urgent - Exam Disconnection / Critical Blocker</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-800">Description of Issue</label>
                <textarea
                  required
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Provide complete details including course name, week number, error messages, or screenshots links..."
                  className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold cursor-pointer"
                >
                  {submitting ? 'Submitting Ticket...' : 'Submit Support Ticket'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
