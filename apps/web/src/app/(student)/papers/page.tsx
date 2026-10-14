/**
 * @file apps/web/src/app/(student)/papers/page.tsx
 * @description Practice paper storefront and mock test catalog.
 *
 * Features:
 * - Filter papers by examination cycle (Quiz 1, Quiz 2, End Term, Mock Tests).
 * - Instant claim flow for free papers via `/api/papers/[id]/claim`.
 * - Razorpay order creation and payment flow for premium papers.
 * - Direct launcher into learner practice assessment rooms.
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Search,
  CheckCircle,
  Clock,
  HelpCircle,
  Award,
  Sparkles,
  Lock,
  ArrowRight,
  Filter,
} from 'lucide-react';

interface Paper {
  id: string;
  title: string;
  description: string | null;
  courseId: string;
  courseTitle: string;
  subject: string | null;
  term: string | null;
  section: string;
  year: number;
  pricePaise: number;
  isFree: boolean;
  timeLimitMinutes: number | null;
  passMarkPercent: number;
  questionCount: number;
  totalAttemptsCount: number;
  isEntitled: boolean;
  entitlementExpiresAt: string | null;
}

export default function PapersCatalogPage() {
  const router = useRouter();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('all');
  const [claimingPaperId, setClaimingPaperId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  /** Load practice papers */
  const fetchPapers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/papers');
      if (res.ok) {
        const data = await res.json();
        setPapers(data.papers || []);
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPapers();
  }, []);

  /** Claim free paper entitlement */
  const handleClaimFree = async (paper: Paper) => {
    setClaimingPaperId(paper.id);
    setActionError(null);

    try {
      const res = await fetch(`/api/papers/${paper.id}/claim`, {
        method: 'POST',
      });

      if (res.ok) {
        // Redirect directly into the quiz examination room
        router.push(`/learning/${paper.courseId}/quiz/${paper.id}`);
      } else {
        const err = await res.json().catch(() => ({}));
        setActionError(err.error || 'Failed to claim paper.');
      }
    } catch {
      setActionError('Network error claiming paper.');
    } finally {
      setClaimingPaperId(null);
    }
  };

  /** Purchase paid paper */
  const handleBuyPaper = async (paper: Paper) => {
    setClaimingPaperId(paper.id);
    setActionError(null);

    try {
      const res = await fetch(`/api/papers/${paper.id}/order`, {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || 'Could not initiate purchase order.');
        setClaimingPaperId(null);
        return;
      }

      // Check if Razorpay SDK script is loaded
      if (typeof window !== 'undefined' && (window as any).Razorpay) {
        const rzp = new (window as any).Razorpay({
          key: data.keyId,
          amount: data.amountPaise,
          currency: data.currency,
          name: 'Genziitian Assessment Lab',
          description: paper.title,
          order_id: data.razorpayOrderId,
          handler: async function () {
            // Once paid, reload entitlements
            await fetchPapers();
            router.push(`/learning/${paper.courseId}/quiz/${paper.id}`);
          },
        });
        rzp.open();
      } else {
        // Sandbox simulator fallback
        alert(`Sandbox Checkout: Order created for ₹${data.amountPaise / 100}. Simulating instant activation...`);
        // Grant entitlement via claim fallback for development/demo
        await fetch(`/api/papers/${paper.id}/claim`, { method: 'POST' });
        router.push(`/learning/${paper.courseId}/quiz/${paper.id}`);
      }
    } catch {
      setActionError('Error connecting to payment provider.');
    } finally {
      setClaimingPaperId(null);
    }
  };

  // Filtered papers
  const filteredPapers = useMemo(() => {
    return papers.filter((p) => {
      const matchesSection =
        activeSection === 'all'
          ? true
          : activeSection === 'free'
          ? p.isFree
          : p.section.toLowerCase() === activeSection.toLowerCase();

      const matchesSearch =
        !searchQuery ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.courseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.subject && p.subject.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesSection && matchesSearch;
    });
  }, [papers, activeSection, searchQuery]);

  return (
    <div className="min-h-screen bg-stone-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-stone-200 pb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
              <Sparkles className="h-4 w-4" />
              <span>Assessment & PYQ Catalog</span>
            </div>
            <h1 className="mt-2 text-3xl font-extrabold text-stone-900 tracking-tight">
              Exam Papers & Mock Tests
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-stone-600">
              Master your coursework with timed past year examination papers, graded quizzes, and
              comprehensive mock assessments with step-by-step mathematical solutions.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search paper or course..."
              className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-10 pr-4 text-xs text-stone-800 placeholder-stone-400 focus:border-emerald-600 focus:outline-none shadow-sm"
            />
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="mt-6 flex flex-wrap gap-2 border-b border-stone-200 pb-4">
          {[
            { id: 'all', label: 'All Papers' },
            { id: 'quiz1', label: 'Quiz 1' },
            { id: 'quiz2', label: 'Quiz 2' },
            { id: 'endterm', label: 'End Term' },
            { id: 'mock_test', label: 'Mock Tests' },
            { id: 'free', label: 'Free Papers' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                activeSection === tab.id
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {actionError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {actionError}
          </div>
        )}

        {/* Papers Grid */}
        {loading ? (
          <div className="py-20 text-center text-xs text-stone-400">Loading catalog...</div>
        ) : filteredPapers.length === 0 ? (
          <div className="py-20 text-center">
            <FileText className="mx-auto h-10 w-10 text-stone-300" />
            <h3 className="mt-3 text-sm font-bold text-stone-700">No practice papers found</h3>
            <p className="mt-1 text-xs text-stone-500">Try adjusting your search or category filter.</p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPapers.map((paper) => {
              const priceDisplay = paper.isFree ? 'Free' : `₹${paper.pricePaise / 100}`;

              return (
                <div
                  key={paper.id}
                  className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition hover:shadow-md"
                >
                  <div>
                    {/* Top badging */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-stone-700">
                        {paper.section.replace(/_/g, ' ')} • {paper.year}
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          paper.isFree
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-stone-900 text-white'
                        }`}
                      >
                        {priceDisplay}
                      </span>
                    </div>

                    <h3 className="mt-3 text-base font-bold text-stone-900 leading-snug">
                      {paper.title}
                    </h3>
                    <p className="mt-1 text-xs font-medium text-emerald-800">{paper.courseTitle}</p>

                    {paper.description && (
                      <p className="mt-2 text-xs text-stone-500 line-clamp-2 leading-relaxed">
                        {paper.description}
                      </p>
                    )}

                    {/* Metadata specs */}
                    <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-stone-100 pt-3 text-[11px] text-stone-600">
                      <div className="flex items-center gap-1">
                        <HelpCircle className="h-3.5 w-3.5 text-stone-400" />
                        <span>{paper.questionCount} Questions</span>
                      </div>
                      {paper.timeLimitMinutes && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-stone-400" />
                          <span>{paper.timeLimitMinutes} Mins</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Award className="h-3.5 w-3.5 text-stone-400" />
                        <span>Pass: {paper.passMarkPercent}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 border-t border-stone-100 pt-4">
                    {paper.isEntitled ? (
                      <Link
                        href={`/learning/${paper.courseId}/quiz/${paper.id}`}
                        className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-800 py-2.5 text-xs font-bold text-white hover:bg-emerald-900 shadow-sm"
                      >
                        <span>Start Practice Test</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    ) : paper.isFree ? (
                      <button
                        onClick={() => handleClaimFree(paper)}
                        disabled={claimingPaperId === paper.id}
                        className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-700 py-2.5 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50 shadow-sm"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>
                          {claimingPaperId === paper.id ? 'Claiming...' : 'Claim & Start Free'}
                        </span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBuyPaper(paper)}
                        disabled={claimingPaperId === paper.id}
                        className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-stone-900 py-2.5 text-xs font-bold text-white hover:bg-stone-800 disabled:opacity-50 shadow-sm"
                      >
                        <Lock className="h-3.5 w-3.5" />
                        <span>
                          {claimingPaperId === paper.id ? 'Processing...' : `Buy Paper (${priceDisplay})`}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
