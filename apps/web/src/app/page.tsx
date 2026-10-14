/**
 * @file apps/web/src/app/page.tsx
 * @description High-Converting SaaS Landing Page for Northstar / Gen-Z IITian.
 *
 * Designed with modern SaaS ergonomics (Linear, Stripe, Vercel aesthetic):
 * - Hero section with live stats counters & interactive UI telemetry showcase
 * - Prominent Student Dashboard CTA for logged-in learners
 * - Featured IITM Cohort cards with Recorded vs Live Interactive pricing comparison
 * - Exhaustive comparison matrix: Northstar vs YouTube vs Traditional Coaching
 * - IITM Academic Grading Toolkit & Proctored Exam Suite showcase
 * - Verified Student Reviews & High-Converting Call to Action
 */

import React from 'react';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Play,
  Video,
  ShieldAlert,
  Calculator,
  Code2,
  Users,
  Trophy,
  GraduationCap,
  Star,
  ExternalLink,
  ChevronRight,
  Flame,
  Zap,
  BarChart3,
  FileCheck,
  Award,
  Coins,
} from 'lucide-react';

import { SiteNavbar } from '@/components/layout/site-navbar';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-[#090d0b] text-stone-100 font-sans selection:bg-emerald-800 selection:text-white">
      {/* Unified Site Navbar */}
      <SiteNavbar
        initialUser={
          session
            ? {
                id: session.userId,
                name: session.email.split('@')[0],
                email: session.email,
                role: session.role,
              }
            : null
        }
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        {/* Ambient Glow Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-emerald-600/15 via-teal-500/10 to-transparent blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[250px] bg-gradient-to-bl from-blue-600/10 via-cyan-500/10 to-transparent blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Announcement Banner */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-900/90 border border-emerald-500/30 text-xs text-stone-200 shadow-inner">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-semibold text-emerald-400">SUMMER 2026 COHORTS LIVE</span>
              <span className="text-stone-500">·</span>
              <span className="text-stone-300">10,000+ IITM Learners Enrolled</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400 ml-1" />
            </div>
          </div>

          {/* Hero Typography */}
          <div className="text-center max-w-4xl mx-auto space-y-6">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white font-display leading-[1.08]">
              Master Your IIT Madras BS Degree.{' '}
              <span className="block mt-2 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                Guaranteed S & A Grades.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-stone-300 max-w-2xl mx-auto leading-relaxed">
              The high-performance academic weapon built for IITM BS in Data Science & Electronic Systems.
              Anti-cheat proctored exam simulations, live problem jams with IIT alumni mentors, official IITM
              grade predictor, and sandboxed code execution.
            </p>

            {/* Hero Action CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
              <Link
                href="#cohorts"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-stone-950 font-extrabold text-sm shadow-xl shadow-emerald-500/25 transition-all hover:scale-105"
              >
                <span>Explore 2026 Cohorts</span>
                <Sparkles className="w-4 h-4" />
              </Link>
              <Link
                href="/tools"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-stone-900 border border-stone-700 hover:border-emerald-500/50 hover:bg-stone-850 text-white font-bold text-sm transition-all"
              >
                <Calculator className="w-4 h-4 text-emerald-400" />
                <span>IITM Grade Predictor</span>
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-3.5 text-xs text-stone-400 hover:text-emerald-400 font-mono transition-colors"
              >
                <span>Jump to Student Space →</span>
              </Link>
            </div>
          </div>

          {/* Stats Counters Bar */}
          <div className="mt-14 max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-stone-950/80 border border-stone-800 text-center">
              <div className="text-3xl sm:text-4xl font-black text-white font-display">10,000+</div>
              <div className="text-xs text-stone-400 font-medium mt-1">Active IITM Learners</div>
              <div className="text-[11px] font-mono text-emerald-400 mt-1">Foundation & Diploma</div>
            </div>
            <div className="p-4 sm:p-5 rounded-2xl bg-stone-950/80 border border-stone-800 text-center">
              <div className="text-3xl sm:text-4xl font-black text-emerald-400 font-display">99.4%</div>
              <div className="text-xs text-stone-400 font-medium mt-1">Quiz & End-Term Clearance</div>
              <div className="text-[11px] font-mono text-stone-500 mt-1">vs 61% National Avg</div>
            </div>
            <div className="p-4 sm:p-5 rounded-2xl bg-stone-950/80 border border-stone-800 text-center">
              <div className="text-3xl sm:text-4xl font-black text-white font-display flex items-center justify-center gap-1">
                <span>4.9</span>
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              </div>
              <div className="text-xs text-stone-400 font-medium mt-1">Average Course Rating</div>
              <div className="text-[11px] font-mono text-stone-500 mt-1">1,400+ Verified Reviews</div>
            </div>
            <div className="p-4 sm:p-5 rounded-2xl bg-stone-950/80 border border-stone-800 text-center">
              <div className="text-3xl sm:text-4xl font-black text-white font-display">150+</div>
              <div className="text-xs text-stone-400 font-medium mt-1">Proctored Mocks & Labs</div>
              <div className="text-[11px] font-mono text-emerald-400 mt-1">Piston IDE Sandboxes</div>
            </div>
          </div>

          {/* Interactive Hero Telemetry Product Showcase Window */}
          <div className="mt-12 max-w-5xl mx-auto rounded-2xl border border-stone-800 bg-stone-950 shadow-2xl overflow-hidden">
            {/* Window Chrome Header */}
            <div className="px-4 py-3 bg-stone-900/90 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                <span className="ml-2 text-xs font-mono text-stone-400">
                  northstar-proctor-telemetry · terminal v2.4
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 font-bold">PROCTOR SUITE ACTIVE</span>
              </div>
            </div>

            {/* Inner Live Telemetry Grid */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 bg-gradient-to-b from-stone-950 to-stone-900/70">
              {/* Telemetry Block 1: Real-time Proctoring Monitor */}
              <div className="p-4 rounded-xl bg-stone-900/80 border border-stone-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase text-stone-400">Anti-Cheat Telemetry</span>
                  <ShieldAlert className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-stone-800">
                    <span className="text-stone-400">Fullscreen Enforced:</span>
                    <span className="text-emerald-400 font-bold">LOCKED</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-stone-800">
                    <span className="text-stone-400">Tab Blur Violations:</span>
                    <span className="text-emerald-400 font-bold">0 / 3 (Normal)</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-stone-400">KaTeX Calculator:</span>
                    <span className="text-stone-200">Enabled (Scientific)</span>
                  </div>
                </div>
              </div>

              {/* Telemetry Block 2: IITM Reverse Target Predictor */}
              <div className="p-4 rounded-xl bg-stone-900/80 border border-stone-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase text-stone-400">IITM Formula Calc</span>
                  <Calculator className="w-4 h-4 text-teal-400" />
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-stone-400 font-mono text-[11px]">
                    <span>Quiz 1: <strong className="text-white">88/100</strong></span>
                    <span>Quiz 2: <strong className="text-white">92/100</strong></span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800/60">
                    <div className="text-[11px] font-mono text-emerald-300">Target to lock S Grade (10.0):</div>
                    <div className="text-xl font-black text-white font-display mt-0.5">Score ≥ 46 / 100</div>
                    <div className="text-[10px] text-stone-400">in End-Term Sunday Exam</div>
                  </div>
                </div>
              </div>

              {/* Telemetry Block 3: Sandboxed Piston Runner */}
              <div className="p-4 rounded-xl bg-stone-900/80 border border-stone-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase text-stone-400">Piston Code Sandbox</span>
                  <Code2 className="w-4 h-4 text-blue-400" />
                </div>
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="text-stone-400 text-[11px]">
                    $ python3 solution.py --run-tests
                  </div>
                  <div className="p-2 rounded bg-black/60 border border-stone-800 text-[11px] space-y-1">
                    <div className="text-emerald-400 font-bold">[PASS] Test Case 1: OK (12ms)</div>
                    <div className="text-emerald-400 font-bold">[PASS] Test Case 2: OK (18ms)</div>
                    <div className="text-emerald-400 font-bold">[PASS] Hidden Tests: 5/5 PASSED</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Active Learners Ticker */}
            <div className="px-6 py-3 bg-stone-900/40 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-400 font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>42 IITM learners currently solving Calculus Weekly Mock</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-stone-500">Live Doubt Jam with TA Aryan:</span>
                <span className="text-emerald-400 font-semibold">Join Meet (18m left)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Cohorts Showcase with Recorded vs Live Pricing */}
      <section id="cohorts" className="py-20 border-t border-stone-800/80 bg-[#070b09]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                  CURATED COHORTS · TERM 1 & 2
                </span>
                <span className="text-stone-600">/</span>
                <span className="text-xs font-mono uppercase tracking-wider text-stone-400">
                  Recorded vs Live Jams
                </span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-display">
                Choose Your Acceleration Path.
              </h2>
              <p className="text-stone-400 text-sm sm:text-base mt-2 max-w-2xl">
                Master tough IITM curricula with high-converting study stacks. Pick self-paced recorded precision
                or live weekly interactive masterclasses with 1:1 TA mentorship.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 font-mono text-xs font-semibold">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>5% Cashback with Referral Code</span>
              </span>
            </div>
          </div>

          {/* 4 Featured Cohort Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Cohort 1: Mathematics 1 & 2 */}
            <div className="p-6 sm:p-8 rounded-2xl bg-stone-950 border border-stone-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between gap-4">
                  <span className="px-3 py-1 rounded-md bg-emerald-950/70 border border-emerald-800/60 text-emerald-400 text-xs font-mono font-bold">
                    FOUNDATION LEVEL · MA1001
                  </span>
                  <span className="text-xs font-mono text-stone-400">4.9 / 5.0 (420 Reviews)</span>
                </div>

                <h3 className="text-2xl font-black text-white mt-4 font-display group-hover:text-emerald-400 transition-colors">
                  Mathematics 1 & 2 (Calculus & Linear Algebra)
                </h3>
                <p className="text-sm text-stone-400 mt-2 leading-relaxed">
                  Functions, Limits, Taylor Series, Partial Derivatives, Eigenvalues & Diagonalization
                  specifically adapted to the official IIT Madras BS grading rubrics.
                </p>

                {/* Specs Pill List */}
                <div className="grid grid-cols-2 gap-2 my-5 text-xs text-stone-300 font-mono">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>120+ Lecture Modules</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>40 Proctored Mocks</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>KaTeX Formula Sheets</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Weekly Graded Problem Sets</span>
                  </div>
                </div>

                {/* Recorded vs Live Pricing Comparison Container */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-stone-800/80">
                  {/* Recorded Plan */}
                  <div className="p-4 rounded-xl bg-stone-900/60 border border-stone-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase text-stone-400 font-bold">Self-Paced</span>
                        <span className="text-[10px] font-mono text-stone-500">Recorded</span>
                      </div>
                      <div className="mt-2">
                        <div className="text-2xl font-black text-white font-display">₹2,499</div>
                        <div className="text-[11px] text-stone-400">One-time payment · 1 yr</div>
                      </div>
                      <ul className="mt-3 space-y-1 text-[11px] text-stone-400 font-mono">
                        <li>• Full HD Video Library</li>
                        <li>• Auto-graded Quizzes</li>
                        <li>• LaTeX Downloadable Notes</li>
                      </ul>
                    </div>
                    <Link
                      href="/courses"
                      className="mt-4 w-full py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-center text-xs font-bold text-white transition-colors"
                    >
                      Get Recorded
                    </Link>
                  </div>

                  {/* Live Interactive Plan */}
                  <div className="p-4 rounded-xl bg-gradient-to-b from-emerald-950/40 to-stone-900/80 border border-emerald-500/40 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-2 right-2">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-stone-950 font-black text-[9px] font-mono">
                        MOST POPULAR
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase text-emerald-300 font-bold">Live Masterclass</span>
                      </div>
                      <div className="mt-2">
                        <div className="text-2xl font-black text-emerald-400 font-display">₹4,999</div>
                        <div className="text-[11px] text-stone-400">Includes Recorded + Live</div>
                      </div>
                      <ul className="mt-3 space-y-1 text-[11px] text-stone-300 font-mono">
                        <li className="text-emerald-300 font-semibold">• 2x Weekly Google Meet Jams</li>
                        <li>• 1:1 TA Doubt Solving</li>
                        <li>• VIP Student Telegram Group</li>
                        <li>• Homework Feedback Desk</li>
                      </ul>
                    </div>
                    <Link
                      href="/courses"
                      className="mt-4 w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-center text-xs font-extrabold text-stone-950 shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02]"
                    >
                      Enroll Live Batch
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Cohort 2: Statistics for Data Science 1 & 2 */}
            <div className="p-6 sm:p-8 rounded-2xl bg-stone-950 border border-stone-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between gap-4">
                  <span className="px-3 py-1 rounded-md bg-teal-950/70 border border-teal-800/60 text-teal-400 text-xs font-mono font-bold">
                    FOUNDATION LEVEL · ST1002
                  </span>
                  <span className="text-xs font-mono text-stone-400">4.9 / 5.0 (380 Reviews)</span>
                </div>

                <h3 className="text-2xl font-black text-white mt-4 font-display group-hover:text-emerald-400 transition-colors">
                  Statistics for Data Science 1 & 2
                </h3>
                <p className="text-sm text-stone-400 mt-2 leading-relaxed">
                  Discrete & Continuous Probability, Bayes Theorem, Hypothesis Testing, Scipy
                  distribution drills, and end-term mock problem simulations.
                </p>

                {/* Specs Pill List */}
                <div className="grid grid-cols-2 gap-2 my-5 text-xs text-stone-300 font-mono">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>95+ Video Lessons</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>35 Anti-Cheat Mocks</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Python Scipy Notebooks</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Sunday Live Mock Drills</span>
                  </div>
                </div>

                {/* Recorded vs Live Pricing Comparison Container */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-stone-800/80">
                  <div className="p-4 rounded-xl bg-stone-900/60 border border-stone-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase text-stone-400 font-bold">Self-Paced</span>
                        <span className="text-[10px] font-mono text-stone-500">Recorded</span>
                      </div>
                      <div className="mt-2">
                        <div className="text-2xl font-black text-white font-display">₹2,499</div>
                        <div className="text-[11px] text-stone-400">One-time payment · 1 yr</div>
                      </div>
                      <ul className="mt-3 space-y-1 text-[11px] text-stone-400 font-mono">
                        <li>• Full Video Course</li>
                        <li>• Practice Question Bank</li>
                        <li>• Summary Formula Cheats</li>
                      </ul>
                    </div>
                    <Link
                      href="/courses"
                      className="mt-4 w-full py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-center text-xs font-bold text-white transition-colors"
                    >
                      Get Recorded
                    </Link>
                  </div>

                  <div className="p-4 rounded-xl bg-gradient-to-b from-teal-950/40 to-stone-900/80 border border-teal-500/40 flex flex-col justify-between relative overflow-hidden">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase text-teal-300 font-bold">Live Masterclass</span>
                        <span className="text-[10px] font-mono text-teal-400">HIGH IMPACT</span>
                      </div>
                      <div className="mt-2">
                        <div className="text-2xl font-black text-teal-400 font-display">₹4,999</div>
                        <div className="text-[11px] text-stone-400">Includes Recorded + Live</div>
                      </div>
                      <ul className="mt-3 space-y-1 text-[11px] text-stone-300 font-mono">
                        <li className="text-teal-300 font-semibold">• Weekly Live Problem Sittings</li>
                        <li>• 1:1 TA Doubt Sessions</li>
                        <li>• Mock Exam Paper Reviews</li>
                        <li>• Discord & Telegram Study Room</li>
                      </ul>
                    </div>
                    <Link
                      href="/courses"
                      className="mt-4 w-full py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-center text-xs font-extrabold text-stone-950 shadow-md shadow-teal-500/20 transition-all hover:scale-[1.02]"
                    >
                      Enroll Live Batch
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Cohort 3: Python & Data Structures with Piston */}
            <div className="p-6 sm:p-8 rounded-2xl bg-stone-950 border border-stone-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between gap-4">
                  <span className="px-3 py-1 rounded-md bg-blue-950/70 border border-blue-800/60 text-blue-400 text-xs font-mono font-bold">
                    DIPLOMA LEVEL · CS2001
                  </span>
                  <span className="text-xs font-mono text-stone-400">5.0 / 5.0 (510 Reviews)</span>
                </div>

                <h3 className="text-2xl font-black text-white mt-4 font-display group-hover:text-emerald-400 transition-colors">
                  Python & Data Structures (DSA with Piston Sandbox)
                </h3>
                <p className="text-sm text-stone-400 mt-2 leading-relaxed">
                  Recursion, Linked Lists, Trees, Graphs, Dynamic Programming, and Time Complexity.
                  Tested against 300+ hidden edge test cases in sandboxed code environments.
                </p>

                <div className="grid grid-cols-2 gap-2 my-5 text-xs text-stone-300 font-mono">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>300+ LeetCode style problems</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Real-time Piston Execution</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>OPPE Exam Simulations</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Clean Code & Complexity Lab</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-stone-800/80">
                  <div className="p-4 rounded-xl bg-stone-900/60 border border-stone-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase text-stone-400 font-bold">Self-Paced</span>
                        <span className="text-[10px] font-mono text-stone-500">Recorded</span>
                      </div>
                      <div className="mt-2">
                        <div className="text-2xl font-black text-white font-display">₹2,999</div>
                        <div className="text-[11px] text-stone-400">One-time payment · 1 yr</div>
                      </div>
                      <ul className="mt-3 space-y-1 text-[11px] text-stone-400 font-mono">
                        <li>• DSA Video Lectures</li>
                        <li>• Browser IDE Access</li>
                        <li>• Algorithmic Cheat Sheets</li>
                      </ul>
                    </div>
                    <Link
                      href="/courses"
                      className="mt-4 w-full py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-center text-xs font-bold text-white transition-colors"
                    >
                      Get Recorded
                    </Link>
                  </div>

                  <div className="p-4 rounded-xl bg-gradient-to-b from-blue-950/40 to-stone-900/80 border border-blue-500/40 flex flex-col justify-between relative overflow-hidden">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase text-blue-300 font-bold">Live Masterclass</span>
                        <span className="text-[10px] font-mono text-blue-400">OPPE SPECIAL</span>
                      </div>
                      <div className="mt-2">
                        <div className="text-2xl font-black text-blue-400 font-display">₹5,499</div>
                        <div className="text-[11px] text-stone-400">Includes Recorded + Live</div>
                      </div>
                      <ul className="mt-3 space-y-1 text-[11px] text-stone-300 font-mono">
                        <li className="text-blue-300 font-semibold">• Live Coding Jams with FAANG TAs</li>
                        <li>• 1:1 Code Reviews on GitHub</li>
                        <li>• OPPE Timed Mock Exams</li>
                        <li>• Direct WhatsApp Support</li>
                      </ul>
                    </div>
                    <Link
                      href="/courses"
                      className="mt-4 w-full py-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-center text-xs font-extrabold text-stone-950 shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02]"
                    >
                      Enroll Live Batch
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Cohort 4: Machine Learning Foundations & Practice */}
            <div className="p-6 sm:p-8 rounded-2xl bg-stone-950 border border-stone-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between gap-4">
                  <span className="px-3 py-1 rounded-md bg-purple-950/70 border border-purple-800/60 text-purple-400 text-xs font-mono font-bold">
                    DIPLOMA LEVEL · ML2003
                  </span>
                  <span className="text-xs font-mono text-stone-400">4.9 / 5.0 (320 Reviews)</span>
                </div>

                <h3 className="text-2xl font-black text-white mt-4 font-display group-hover:text-emerald-400 transition-colors">
                  Machine Learning Foundations & Practice (MLP)
                </h3>
                <p className="text-sm text-stone-400 mt-2 leading-relaxed">
                  Supervised Learning, Neural Networks, Decision Trees, Gradient Descent,
                  Scikit-Learn pipelines, and End-Term project implementation.
                </p>

                <div className="grid grid-cols-2 gap-2 my-5 text-xs text-stone-300 font-mono">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>8 Real-world Kaggle Projects</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>30 Proctored Mock Quizzes</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Mathematics of Deep Learning</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>End-Term Target Defense</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-stone-800/80">
                  <div className="p-4 rounded-xl bg-stone-900/60 border border-stone-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase text-stone-400 font-bold">Self-Paced</span>
                        <span className="text-[10px] font-mono text-stone-500">Recorded</span>
                      </div>
                      <div className="mt-2">
                        <div className="text-2xl font-black text-white font-display">₹3,499</div>
                        <div className="text-[11px] text-stone-400">One-time payment · 1 yr</div>
                      </div>
                      <ul className="mt-3 space-y-1 text-[11px] text-stone-400 font-mono">
                        <li>• ML Practice Video Vault</li>
                        <li>• Math Derivations (LaTeX)</li>
                        <li>• Project Templates</li>
                      </ul>
                    </div>
                    <Link
                      href="/courses"
                      className="mt-4 w-full py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-center text-xs font-bold text-white transition-colors"
                    >
                      Get Recorded
                    </Link>
                  </div>

                  <div className="p-4 rounded-xl bg-gradient-to-b from-purple-950/40 to-stone-900/80 border border-purple-500/40 flex flex-col justify-between relative overflow-hidden">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase text-purple-300 font-bold">Live Masterclass</span>
                        <span className="text-[10px] font-mono text-purple-400">PROJECT MENTOR</span>
                      </div>
                      <div className="mt-2">
                        <div className="text-2xl font-black text-purple-400 font-display">₹6,499</div>
                        <div className="text-[11px] text-stone-400">Includes Recorded + Live</div>
                      </div>
                      <ul className="mt-3 space-y-1 text-[11px] text-stone-300 font-mono">
                        <li className="text-purple-300 font-semibold">• 1:1 Capstone Project Review</li>
                        <li>• Live Model Architecture Sittings</li>
                        <li>• Weekly TA Office Hours</li>
                        <li>• Certificate of Excellence</li>
                      </ul>
                    </div>
                    <Link
                      href="/courses"
                      className="mt-4 w-full py-2 rounded-lg bg-purple-500 hover:bg-purple-400 text-center text-xs font-extrabold text-stone-950 shadow-md shadow-purple-500/20 transition-all hover:scale-[1.02]"
                    >
                      Enroll Live Batch
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Matrix: Northstar vs YouTube vs Traditional Coaching */}
      <section id="comparison" className="py-20 border-t border-stone-800/80 bg-[#090d0b]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
              UNCOMPROMISING ACADEMIC RIGOR
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-display mt-2">
              Why Top Scorers Leave YouTube Behind.
            </h2>
            <p className="text-stone-400 text-sm sm:text-base mt-2">
              Generic GATE videos and outdated playlists don't reflect the official IITM BS grading rubrics.
              See how our specialized system transforms your final term outcome.
            </p>
          </div>

          <div className="rounded-2xl border border-stone-800 bg-stone-950 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-stone-800 bg-stone-900/80 font-mono text-xs uppercase">
                    <th className="py-4 px-6 text-stone-400 font-bold">Academic Feature</th>
                    <th className="py-4 px-6 bg-emerald-950/50 text-emerald-400 font-bold border-x border-emerald-800/40">
                      Northstar SaaS
                    </th>
                    <th className="py-4 px-6 text-stone-400 font-semibold">YouTube Playlists</th>
                    <th className="py-4 px-6 text-stone-400 font-semibold">Generic Coaching</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/70 font-mono text-xs">
                  <tr className="hover:bg-stone-900/30 transition-colors">
                    <td className="py-4 px-6 font-sans font-semibold text-white">
                      IITM BS Syllabus & Formula Alignment
                    </td>
                    <td className="py-4 px-6 bg-emerald-950/20 text-emerald-400 font-bold border-x border-emerald-800/20 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>100% Exact Alignment</span>
                    </td>
                    <td className="py-4 px-6 text-stone-400 flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-400" />
                      <span>Fragmented & Outdated</span>
                    </td>
                    <td className="py-4 px-6 text-stone-400 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                      <span>Generic JEE/GATE syllabus</span>
                    </td>
                  </tr>

                  <tr className="hover:bg-stone-900/30 transition-colors">
                    <td className="py-4 px-6 font-sans font-semibold text-white">
                      Anti-Cheat Proctored Mock Rooms
                    </td>
                    <td className="py-4 px-6 bg-emerald-950/20 text-emerald-400 font-bold border-x border-emerald-800/20 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Tab-Blur Telemetry & Lock</span>
                    </td>
                    <td className="py-4 px-6 text-stone-400 flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-400" />
                      <span>Zero Proctored Practice</span>
                    </td>
                    <td className="py-4 px-6 text-stone-400 flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-400" />
                      <span>Pen & Paper only</span>
                    </td>
                  </tr>

                  <tr className="hover:bg-stone-900/30 transition-colors">
                    <td className="py-4 px-6 font-sans font-semibold text-white">
                      Official Grading Simulator & Target Calc
                    </td>
                    <td className="py-4 px-6 bg-emerald-950/20 text-emerald-400 font-bold border-x border-emerald-800/20 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Reverse Sunday Target Engine</span>
                    </td>
                    <td className="py-4 px-6 text-stone-400 flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-400" />
                      <span>None (Manual guesswork)</span>
                    </td>
                    <td className="py-4 px-6 text-stone-400 flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-400" />
                      <span>No IITM formula simulator</span>
                    </td>
                  </tr>

                  <tr className="hover:bg-stone-900/30 transition-colors">
                    <td className="py-4 px-6 font-sans font-semibold text-white">
                      Integrated Piston Code Sandbox
                    </td>
                    <td className="py-4 px-6 bg-emerald-950/20 text-emerald-400 font-bold border-x border-emerald-800/20 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Python, Java, C++ in-browser</span>
                    </td>
                    <td className="py-4 px-6 text-stone-400 flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-400" />
                      <span>No code sandbox</span>
                    </td>
                    <td className="py-4 px-6 text-stone-400 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                      <span>Local installation hassle</span>
                    </td>
                  </tr>

                  <tr className="hover:bg-stone-900/30 transition-colors">
                    <td className="py-4 px-6 font-sans font-semibold text-white">
                      1:1 Doubt Clearance & Live Jams
                    </td>
                    <td className="py-4 px-6 bg-emerald-950/20 text-emerald-400 font-bold border-x border-emerald-800/20 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>&lt; 15 min TA turnaround</span>
                    </td>
                    <td className="py-4 px-6 text-stone-400 flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-400" />
                      <span>Ignored in comment sections</span>
                    </td>
                    <td className="py-4 px-6 text-stone-400 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                      <span>Crowded 100+ student batches</span>
                    </td>
                  </tr>

                  <tr className="hover:bg-stone-900/30 transition-colors">
                    <td className="py-4 px-6 font-sans font-semibold text-white">
                      2-Sided 5% Referral Wallet Coins
                    </td>
                    <td className="py-4 px-6 bg-emerald-950/20 text-emerald-400 font-bold border-x border-emerald-800/20 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Earn & Spend Coins Instantly</span>
                    </td>
                    <td className="py-4 px-6 text-stone-400 flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-400" />
                      <span>None</span>
                    </td>
                    <td className="py-4 px-6 text-stone-400 flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-400" />
                      <span>None</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* IITM Academic Grading Toolkit Showcase */}
      <section className="py-20 border-t border-stone-800/80 bg-[#070b09]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
              FREE ACADEMIC TOOLKIT
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-display mt-2">
              Official IITM Grading & Proctoring Suite.
            </h2>
            <p className="text-stone-400 text-sm sm:text-base mt-2">
              Say goodbye to stressful Sunday exam calculations. Access the full suite of specialized tools
              engineered exclusively for IIT Madras BS students.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tool 1 */}
            <div className="p-6 rounded-2xl bg-stone-950 border border-stone-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between">
              <div>
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 w-fit">
                  <Calculator className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mt-4 font-display">
                  Reverse End-Term Predictor
                </h3>
                <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                  Input your weekly assignment average, Quiz 1, and Quiz 2 scores. Our algorithm computes the
                  exact marks you need in the End-Term exam on Sunday to secure an S, A, or B grade.
                </p>
              </div>
              <div className="pt-6">
                <Link
                  href="/tools"
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-bold"
                >
                  <span>Launch Predictor</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Tool 2 */}
            <div className="p-6 rounded-2xl bg-stone-950 border border-stone-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between">
              <div>
                <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-800/60 text-amber-400 w-fit">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mt-4 font-display">
                  Proctored Exam Simulator
                </h3>
                <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                  Full-screen exam room simulation replicating the exact TCS iON / IITM exam center interface.
                  Equipped with tab-switch telemetry, scientific calculator, and KaTeX math formulas.
                </p>
              </div>
              <div className="pt-6">
                <Link
                  href="/exams"
                  className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-bold"
                >
                  <span>Open Mock Rooms</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Tool 3 */}
            <div className="p-6 rounded-2xl bg-stone-950 border border-stone-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between">
              <div>
                <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-800/60 text-blue-400 w-fit">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mt-4 font-display">
                  Staff Credential Verification
                </h3>
                <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                  Trust and transparency are paramount. Verify the credentials, IIT alumni certificates,
                  and course accreditations of any instructor or teaching assistant instantly.
                </p>
              </div>
              <div className="pt-6">
                <Link
                  href="/verify"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-bold"
                >
                  <span>Verify Instructor ID</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Verified Student Social Proof */}
      <section className="py-20 border-t border-stone-800/80 bg-[#090d0b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
              REAL RESULTS · REAL LEARNERS
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-display mt-2">
              From Average Grades to Dean's List.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-stone-950 border border-stone-800">
              <div className="flex items-center gap-1 text-amber-400 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs text-stone-300 leading-relaxed italic">
                "I was struggling with Math 2 and had almost failed Quiz 1. The reverse target calculator
                showed me I needed 58 in End-Term. After attending Aryan's live doubt jams, I scored 74 and
                secured an S grade!"
              </p>
              <div className="mt-4 pt-4 border-t border-stone-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-xs">Rohit M.</div>
                  <div className="text-[11px] text-stone-500 font-mono">IITM BS Foundation · CGPA 9.4</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-mono font-bold">
                  VERIFIED
                </span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-stone-950 border border-stone-800">
              <div className="flex items-center gap-1 text-amber-400 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs text-stone-300 leading-relaxed italic">
                "The proctored mock exams are identical to the actual Sunday test center format. The tab-blur
                telemetry made me take mocks seriously instead of casually checking answers. Jumped from 6.9 to
                8.8 CGPA!"
              </p>
              <div className="mt-4 pt-4 border-t border-stone-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-xs">Ananya S.</div>
                  <div className="text-[11px] text-stone-500 font-mono">Diploma in Data Science</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-mono font-bold">
                  VERIFIED
                </span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-stone-950 border border-stone-800">
              <div className="flex items-center gap-1 text-amber-400 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs text-stone-300 leading-relaxed italic">
                "The in-browser Python IDE with Piston hidden test cases saved me during OPPE preparation.
                I solved over 120 problem sets before the final exam and cleared with 98% accuracy."
              </p>
              <div className="mt-4 pt-4 border-t border-stone-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-xs">Devansh K.</div>
                  <div className="text-[11px] text-stone-500 font-mono">Diploma in Programming</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-mono font-bold">
                  VERIFIED
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Closing Call to Action Banner */}
      <section className="py-20 border-t border-stone-800/80 bg-gradient-to-b from-[#090d0b] to-[#040806] text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-800 text-xs text-emerald-400 font-mono font-semibold">
            <Trophy className="w-3.5 h-3.5" />
            <span>JOIN OVER 10,000 SUCCESSFUL IITM LEARNERS</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-display">
            Ready to secure an S Grade this term?
          </h2>

          <p className="text-stone-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Enroll today in our featured cohorts or unlock the proctored mock testing suite. Your highest
            CGPA is just one term away.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-stone-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition-all hover:scale-105"
            >
              <span>Browse All Cohorts</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-stone-900 border border-stone-700 hover:border-emerald-500/50 text-white font-bold text-sm transition-all"
            >
              <Calculator className="w-4 h-4 text-emerald-400" />
              <span>Predict My Grade</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Modern SaaS Footer */}
      <footer className="border-t border-stone-800 bg-[#060a08] py-12 text-xs text-stone-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-stone-950 font-black font-display text-sm">
                n
              </span>
              <span className="font-extrabold text-base tracking-tight text-white font-display">
                northstar<span className="text-emerald-400">.</span>
              </span>
            </Link>
            <p className="text-stone-400 text-xs leading-relaxed">
              Unified Academic SaaS, Proctored Assessment Suite & Learning Intelligence for IIT Madras BS Degree.
            </p>
            <div className="font-mono text-[11px] text-stone-500">
              © 2026 Northstar Systems · All rights reserved.
            </div>
          </div>

          <div>
            <div className="font-mono text-xs uppercase text-white font-bold mb-3">Academic Suite</div>
            <ul className="space-y-2 text-stone-400">
              <li><Link href="/courses" className="hover:text-emerald-400">Featured Cohorts</Link></li>
              <li><Link href="/tools" className="hover:text-emerald-400">IITM CGPA & Target Predictor</Link></li>
              <li><Link href="/exams" className="hover:text-emerald-400">Proctored Exam Rooms</Link></li>
              <li><Link href="/papers" className="hover:text-emerald-400">Practice Papers</Link></li>
            </ul>
          </div>

          <div>
            <div className="font-mono text-xs uppercase text-white font-bold mb-3">Interactive Learning</div>
            <ul className="space-y-2 text-stone-400">
              <li><Link href="/live" className="hover:text-emerald-400">Live Masterclasses</Link></li>
              <li><Link href="/one-to-one" className="hover:text-emerald-400">1:1 Mentorship</Link></li>
              <li><Link href="/ide/1" className="hover:text-emerald-400">Piston Coding Playground</Link></li>
              <li><Link href="/refer" className="hover:text-emerald-400">5% Referral Program</Link></li>
            </ul>
          </div>

          <div>
            <div className="font-mono text-xs uppercase text-white font-bold mb-3">Security & Trust</div>
            <ul className="space-y-2 text-stone-400">
              <li><Link href="/verify" className="hover:text-emerald-400">Verify Staff Credentials</Link></li>
              <li><Link href="/manager" className="hover:text-emerald-400">Manager Console</Link></li>
              <li><span className="text-emerald-400 font-mono">● All Systems Operational</span></li>
              <li><span className="text-stone-500 font-mono">Anti-Cheat Engine v2.4</span></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
