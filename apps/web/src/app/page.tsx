/**
 * @file apps/web/src/app/page.tsx
 * @description Redesigned editorial landing page for GenZ IITian / Northstar.
 *
 * Warm cream light-first palette (#FAFAF7), terracotta/coral accents (#E05A33),
 * refined typography (Manrope + DM Sans), card tilt & scroll animations, zero AI slop.
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
  Calculator,
  Code2,
  Users,
  Trophy,
  Star,
  Coins,
  BookOpen,
  Briefcase,
  Layers,
  GraduationCap,
} from 'lucide-react';

import { SiteNavbar } from '@/components/layout/site-navbar';
import {
  FadeUp,
  StaggerGrid,
  StaggerItem,
  CardTilt,
  CountUp,
  ParallaxSection,
  MorphBlob,
  HoverScale,
} from './landing-animations';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-[#FAFAF7] dark:bg-[#111110] text-[#1A1A19] dark:text-[#F5F3EF] font-sans selection:bg-[#FDF0EB] selection:text-[#E05A33] transition-colors">
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
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32">
        {/* Soft Organic Glow Blobs (Non-slop, subtle warmth) */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[620px] h-[340px] pointer-events-none">
          <MorphBlob className="w-full h-full opacity-15 dark:opacity-10" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Announcement Pill */}
          <div className="flex justify-center mb-8">
            <FadeUp>
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] text-xs text-[#1A1A19] dark:text-[#F5F3EF] shadow-xs">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E05A33] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E05A33]" />
                </span>
                <span className="font-semibold text-[#E05A33]">SUMMER 2026 COHORTS OPEN</span>
                <span className="text-[#8C8C87]">·</span>
                <span className="text-[#6B6B66] dark:text-[#B5B3AD]">10,000+ IITM Learners</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#E05A33] ml-0.5" />
              </div>
            </FadeUp>
          </div>

          {/* Hero Typography */}
          <div className="text-center max-w-4xl mx-auto space-y-6">
            <FadeUp delay={0.05}>
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#1A1A19] dark:text-[#F5F3EF] font-display leading-[1.08]">
                Master Your IIT Madras BS Degree.{' '}
                <span className="block mt-2 text-[#E05A33]">
                  Guaranteed S & A Grades.
                </span>
              </h1>
            </FadeUp>

            <FadeUp delay={0.1}>
              <p className="text-base sm:text-lg text-[#6B6B66] dark:text-[#B5B3AD] max-w-2xl mx-auto leading-relaxed">
                The high-performance academic companion built for IITM BS in Data Science & Electronic Systems.
                Anti-cheat proctored mocks, live problem jams with IIT alumni mentors, official IITM
                grade predictor, and sandboxed code execution.
              </p>
            </FadeUp>

            {/* Hero Action CTAs */}
            <FadeUp delay={0.15}>
              <div className="flex flex-wrap items-center justify-center gap-3.5 pt-4">
                <HoverScale>
                  <Link
                    href="#cohorts"
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#E05A33] hover:bg-[#C94A26] text-white font-bold text-sm shadow-md shadow-[#E05A33]/20 transition-all"
                  >
                    <span>Explore 2026 Cohorts</span>
                    <Sparkles className="w-4 h-4" />
                  </Link>
                </HoverScale>

                <HoverScale>
                  <Link
                    href="/tools"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] hover:border-[#E05A33]/50 text-[#1A1A19] dark:text-[#F5F3EF] font-bold text-sm shadow-xs transition-all"
                  >
                    <Calculator className="w-4 h-4 text-[#E05A33]" />
                    <span>IITM Grade Predictor</span>
                  </Link>
                </HoverScale>

                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 px-4 py-3.5 text-xs text-[#8C8C87] hover:text-[#E05A33] font-mono transition-colors"
                >
                  <span>Student Space →</span>
                </Link>
              </div>
            </FadeUp>
          </div>

          {/* Stats Counters Bar with Animated Counters */}
          <div className="mt-16 max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
            <CardTilt className="p-5 rounded-2xl bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] text-center shadow-xs">
              <div className="text-3xl sm:text-4xl font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] font-display">
                <CountUp target={10000} suffix="+" />
              </div>
              <div className="text-xs text-[#6B6B66] dark:text-[#B5B3AD] font-medium mt-1">Active IITM Learners</div>
              <div className="text-[11px] font-mono text-[#E05A33] mt-1 font-semibold">Foundation & Diploma</div>
            </CardTilt>

            <CardTilt className="p-5 rounded-2xl bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] text-center shadow-xs">
              <div className="text-3xl sm:text-4xl font-extrabold text-[#E05A33] font-display">
                99.4%
              </div>
              <div className="text-xs text-[#6B6B66] dark:text-[#B5B3AD] font-medium mt-1">Quiz & End-Term Clearance</div>
              <div className="text-[11px] font-mono text-[#8C8C87] mt-1">vs 61% National Avg</div>
            </CardTilt>

            <CardTilt className="p-5 rounded-2xl bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] text-center shadow-xs">
              <div className="text-3xl sm:text-4xl font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] font-display flex items-center justify-center gap-1">
                <span>4.9</span>
                <Star className="w-5 h-5 text-[#D4952B] fill-[#D4952B]" />
              </div>
              <div className="text-xs text-[#6B6B66] dark:text-[#B5B3AD] font-medium mt-1">Average Course Rating</div>
              <div className="text-[11px] font-mono text-[#8C8C87] mt-1">1,400+ Verified Reviews</div>
            </CardTilt>

            <CardTilt className="p-5 rounded-2xl bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] text-center shadow-xs">
              <div className="text-3xl sm:text-4xl font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] font-display">
                <CountUp target={150} suffix="+" />
              </div>
              <div className="text-xs text-[#6B6B66] dark:text-[#B5B3AD] font-medium mt-1">Proctored Mocks & Labs</div>
              <div className="text-[11px] font-mono text-[#E05A33] mt-1 font-semibold">Piston IDE Sandboxes</div>
            </CardTilt>
          </div>

          {/* Interactive Hero Product Showcase Window */}
          <FadeUp delay={0.2} className="mt-14 max-w-5xl mx-auto">
            <div className="rounded-2xl border border-[#E8E6E1] dark:border-[#2D2D2A] bg-white dark:bg-[#1C1C1A] shadow-lg overflow-hidden">
              {/* Window Chrome Header */}
              <div className="px-4 py-3 bg-[#F5F3EF] dark:bg-[#242422] border-b border-[#E8E6E1] dark:border-[#2D2D2A] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#E05A33]/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-[#D4952B]/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-[#2D7A4F]/80 inline-block" />
                  <span className="ml-2 text-xs font-mono text-[#8C8C87]">
                    iitm-academic-hub · student workspace v2.4
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-[#2D7A4F] animate-pulse" />
                  <span className="text-[#2D7A4F] font-bold">ACADEMIC HUB ACTIVE</span>
                </div>
              </div>

              {/* Inner Grid */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 bg-[#FAFAF7] dark:bg-[#181817]">
                {/* Telemetry Block 1 */}
                <div className="p-4 rounded-xl bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-[#8C8C87] font-semibold">Academic Library & PYQs</span>
                    <BookOpen className="w-4 h-4 text-[#E05A33]" />
                  </div>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between py-1 border-b border-[#E8E6E1] dark:border-[#2D2D2A]">
                      <span className="text-[#6B6B66] dark:text-[#B5B3AD]">Math 1 Formula Sheet:</span>
                      <span className="text-[#E05A33] font-bold">2.4 MB (PDF)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E8E6E1] dark:border-[#2D2D2A]">
                      <span className="text-[#6B6B66] dark:text-[#B5B3AD]">Past Term PYQs:</span>
                      <span className="text-[#E05A33] font-bold">Terms 1 - 4 Available</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-[#6B6B66] dark:text-[#B5B3AD]">Python Lab Solutions:</span>
                      <span className="text-[#1A1A19] dark:text-[#F5F3EF]">50 Problems Verified</span>
                    </div>
                  </div>
                </div>

                {/* Telemetry Block 2 */}
                <div className="p-4 rounded-xl bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-[#8C8C87] font-semibold">Target Grade Predictor</span>
                    <Calculator className="w-4 h-4 text-[#D4952B]" />
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-[#8C8C87] font-mono text-[11px]">
                      <span>Quiz 1: <strong className="text-[#1A1A19] dark:text-[#F5F3EF]">88/100</strong></span>
                      <span>Quiz 2: <strong className="text-[#1A1A19] dark:text-[#F5F3EF]">92/100</strong></span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#FDF0EB] dark:bg-[#3A150C]/60 border border-[#F5B8A3] dark:border-[#7D2F1A]">
                      <div className="text-[11px] font-mono text-[#A33C1F] dark:text-[#F5B8A3] font-semibold">Target to lock S Grade (10.0):</div>
                      <div className="text-xl font-extrabold text-[#E05A33] font-display mt-0.5">Score ≥ 46 / 100</div>
                      <div className="text-[10px] text-[#8C8C87]">in End-Term Sunday Exam</div>
                    </div>
                  </div>
                </div>

                {/* Telemetry Block 3 */}
                <div className="p-4 rounded-xl bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-[#8C8C87] font-semibold">Careers & Placements</span>
                    <Briefcase className="w-4 h-4 text-[#2D7A4F]" />
                  </div>
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="text-[#8C8C87] text-[11px]">
                      IITM Alumni Network Openings:
                    </div>
                    <div className="p-2 rounded bg-[#F5F3EF] dark:bg-[#242422] border border-[#E8E6E1] dark:border-[#2D2D2A] text-[11px] space-y-1">
                      <div className="text-[#E05A33] font-bold truncate">● IITM Incubator: ₹35k/mo</div>
                      <div className="text-[#2D7A4F] font-bold truncate">● ML Associate: ₹12-16 LPA</div>
                      <div className="text-[#8C8C87] text-[10px]">Foundation & Diploma Mapped</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Active Learners Ticker */}
              <div className="px-6 py-3 bg-[#F5F3EF] dark:bg-[#242422] border-t border-[#E8E6E1] dark:border-[#2D2D2A] flex flex-wrap items-center justify-between gap-3 text-xs text-[#6B6B66] dark:text-[#B5B3AD] font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#E05A33] animate-ping" />
                  <span>42 IITM learners currently solving Calculus Weekly Mock</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[#8C8C87]">Live Doubt Jam with TA Aryan:</span>
                  <span className="text-[#E05A33] font-semibold">Join Room (18m left)</span>
                </div>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* Featured Cohorts Showcase with Recorded vs Live Pricing */}
      <section id="cohorts" className="py-24 border-t border-[#E8E6E1] dark:border-[#2D2D2A] bg-white dark:bg-[#161615]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono uppercase tracking-wider text-[#E05A33] font-semibold">
                  CURATED COHORTS · TERM 1 & 2
                </span>
                <span className="text-[#B5B3AD]">/</span>
                <span className="text-xs font-mono uppercase tracking-wider text-[#8C8C87]">
                  Recorded vs Live Jams
                </span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] tracking-tight font-display">
                Choose Your Acceleration Path.
              </h2>
              <p className="text-[#6B6B66] dark:text-[#B5B3AD] text-sm sm:text-base mt-2 max-w-2xl">
                Master tough IITM curricula with high-yield study stacks. Pick self-paced recorded precision
                or live weekly interactive masterclasses with 1:1 TA mentorship.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FDF0EB] dark:bg-[#3A150C] border border-[#F5B8A3] dark:border-[#7D2F1A] text-[#E05A33] font-mono text-xs font-semibold">
                <Coins className="w-3.5 h-3.5 text-[#D4952B]" />
                <span>5% Cashback with Referral Code</span>
              </span>
            </div>
          </div>

          {/* 4 Featured Cohort Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Cohort 1: Mathematics 1 & 2 */}
            <CardTilt className="p-6 sm:p-8 rounded-2xl bg-[#FAFAF7] dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] hover:border-[#E05A33]/50 transition-all flex flex-col justify-between group shadow-xs">
              <div>
                <div className="flex items-center justify-between gap-4">
                  <span className="px-3 py-1 rounded-md bg-[#FDF0EB] dark:bg-[#3A150C] border border-[#F5B8A3] dark:border-[#7D2F1A] text-[#E05A33] text-xs font-mono font-bold">
                    FOUNDATION LEVEL · MA1001
                  </span>
                  <span className="text-xs font-mono text-[#8C8C87]">4.9 / 5.0 (420 Reviews)</span>
                </div>

                <h3 className="text-2xl font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] mt-4 font-display group-hover:text-[#E05A33] transition-colors">
                  Mathematics 1 & 2 (Calculus & Linear Algebra)
                </h3>
                <p className="text-sm text-[#6B6B66] dark:text-[#B5B3AD] mt-2 leading-relaxed">
                  Functions, Limits, Taylor Series, Partial Derivatives, Eigenvalues & Diagonalization
                  specifically adapted to the official IIT Madras BS grading rubrics.
                </p>

                {/* Specs Pill List */}
                <div className="grid grid-cols-2 gap-2 my-6 text-xs text-[#4A4A46] dark:text-[#B5B3AD] font-mono">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2D7A4F] shrink-0" />
                    <span>120+ Lecture Modules</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2D7A4F] shrink-0" />
                    <span>40 Proctored Mocks</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2D7A4F] shrink-0" />
                    <span>KaTeX Formula Sheets</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2D7A4F] shrink-0" />
                    <span>Weekly Graded Problem Sets</span>
                  </div>
                </div>

                {/* Recorded vs Live Pricing */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-5 border-t border-[#E8E6E1] dark:border-[#2D2D2A]">
                  <div className="p-4 rounded-xl bg-white dark:bg-[#242422] border border-[#E8E6E1] dark:border-[#2D2D2A] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase text-[#8C8C87] font-bold">Self-Paced</span>
                        <span className="text-[10px] font-mono text-[#B5B3AD]">Recorded</span>
                      </div>
                      <div className="mt-2">
                        <div className="text-2xl font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] font-display">₹2,499</div>
                        <div className="text-[11px] text-[#8C8C87]">One-time payment · 1 yr</div>
                      </div>
                      <ul className="mt-3 space-y-1 text-[11px] text-[#6B6B66] dark:text-[#B5B3AD] font-mono">
                        <li>• Full HD Video Library</li>
                        <li>• Auto-graded Quizzes</li>
                        <li>• LaTeX Downloadable Notes</li>
                      </ul>
                    </div>
                    <Link
                      href="/courses"
                      className="mt-4 w-full py-2.5 rounded-lg bg-[#F5F3EF] dark:bg-[#2D2D2A] hover:bg-[#EDEBE5] text-center text-xs font-bold text-[#1A1A19] dark:text-[#F5F3EF] transition-colors"
                    >
                      Get Recorded
                    </Link>
                  </div>

                  <div className="p-4 rounded-xl bg-[#FDF0EB] dark:bg-[#3A150C]/40 border border-[#F5B8A3] dark:border-[#7D2F1A] flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-0.5 rounded bg-[#E05A33] text-white font-black text-[9px] font-mono">
                        POPULAR
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase text-[#E05A33] font-bold">Live Masterclass</span>
                      </div>
                      <div className="mt-2">
                        <div className="text-2xl font-extrabold text-[#E05A33] font-display">₹4,999</div>
                        <div className="text-[11px] text-[#8C8C87]">Includes Recorded + Live</div>
                      </div>
                      <ul className="mt-3 space-y-1 text-[11px] text-[#4A4A46] dark:text-[#B5B3AD] font-mono">
                        <li className="text-[#E05A33] font-semibold">• 2x Weekly Meet Jams</li>
                        <li>• 1:1 TA Doubt Solving</li>
                        <li>• VIP Student Group</li>
                        <li>• Homework Feedback Desk</li>
                      </ul>
                    </div>
                    <Link
                      href="/courses"
                      className="mt-4 w-full py-2.5 rounded-lg bg-[#E05A33] hover:bg-[#C94A26] text-center text-xs font-extrabold text-white shadow-sm shadow-[#E05A33]/20 transition-all hover:scale-[1.02]"
                    >
                      Enroll Live Batch
                    </Link>
                  </div>
                </div>
              </div>
            </CardTilt>

            {/* Cohort 2: Statistics for Data Science 1 & 2 */}
            <CardTilt className="p-6 sm:p-8 rounded-2xl bg-[#FAFAF7] dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] hover:border-[#E05A33]/50 transition-all flex flex-col justify-between group shadow-xs">
              <div>
                <div className="flex items-center justify-between gap-4">
                  <span className="px-3 py-1 rounded-md bg-[#FDF0EB] dark:bg-[#3A150C] border border-[#F5B8A3] dark:border-[#7D2F1A] text-[#E05A33] text-xs font-mono font-bold">
                    FOUNDATION LEVEL · ST1002
                  </span>
                  <span className="text-xs font-mono text-[#8C8C87]">4.9 / 5.0 (380 Reviews)</span>
                </div>

                <h3 className="text-2xl font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] mt-4 font-display group-hover:text-[#E05A33] transition-colors">
                  Statistics for Data Science 1 & 2
                </h3>
                <p className="text-sm text-[#6B6B66] dark:text-[#B5B3AD] mt-2 leading-relaxed">
                  Discrete & Continuous Probability, Bayes Theorem, Hypothesis Testing, Scipy
                  distribution drills, and end-term mock problem simulations.
                </p>

                <div className="grid grid-cols-2 gap-2 my-6 text-xs text-[#4A4A46] dark:text-[#B5B3AD] font-mono">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2D7A4F] shrink-0" />
                    <span>95+ Video Lessons</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2D7A4F] shrink-0" />
                    <span>35 Anti-Cheat Mocks</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2D7A4F] shrink-0" />
                    <span>Python Scipy Notebooks</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2D7A4F] shrink-0" />
                    <span>Sunday Live Mock Drills</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-5 border-t border-[#E8E6E1] dark:border-[#2D2D2A]">
                  <div className="p-4 rounded-xl bg-white dark:bg-[#242422] border border-[#E8E6E1] dark:border-[#2D2D2A] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase text-[#8C8C87] font-bold">Self-Paced</span>
                        <span className="text-[10px] font-mono text-[#B5B3AD]">Recorded</span>
                      </div>
                      <div className="mt-2">
                        <div className="text-2xl font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] font-display">₹2,499</div>
                        <div className="text-[11px] text-[#8C8C87]">One-time payment · 1 yr</div>
                      </div>
                      <ul className="mt-3 space-y-1 text-[11px] text-[#6B6B66] dark:text-[#B5B3AD] font-mono">
                        <li>• Full Video Course</li>
                        <li>• Practice Question Bank</li>
                        <li>• Summary Formula Cheats</li>
                      </ul>
                    </div>
                    <Link
                      href="/courses"
                      className="mt-4 w-full py-2.5 rounded-lg bg-[#F5F3EF] dark:bg-[#2D2D2A] hover:bg-[#EDEBE5] text-center text-xs font-bold text-[#1A1A19] dark:text-[#F5F3EF] transition-colors"
                    >
                      Get Recorded
                    </Link>
                  </div>

                  <div className="p-4 rounded-xl bg-[#FDF0EB] dark:bg-[#3A150C]/40 border border-[#F5B8A3] dark:border-[#7D2F1A] flex flex-col justify-between relative overflow-hidden">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase text-[#E05A33] font-bold">Live Masterclass</span>
                        <span className="text-[10px] font-mono text-[#E05A33]">HIGH IMPACT</span>
                      </div>
                      <div className="mt-2">
                        <div className="text-2xl font-extrabold text-[#E05A33] font-display">₹4,999</div>
                        <div className="text-[11px] text-[#8C8C87]">Includes Recorded + Live</div>
                      </div>
                      <ul className="mt-3 space-y-1 text-[11px] text-[#4A4A46] dark:text-[#B5B3AD] font-mono">
                        <li className="text-[#E05A33] font-semibold">• Weekly Problem Sittings</li>
                        <li>• 1:1 TA Doubt Sessions</li>
                        <li>• Mock Exam Paper Reviews</li>
                        <li>• Student Study Room</li>
                      </ul>
                    </div>
                    <Link
                      href="/courses"
                      className="mt-4 w-full py-2.5 rounded-lg bg-[#E05A33] hover:bg-[#C94A26] text-center text-xs font-extrabold text-white shadow-sm shadow-[#E05A33]/20 transition-all hover:scale-[1.02]"
                    >
                      Enroll Live Batch
                    </Link>
                  </div>
                </div>
              </div>
            </CardTilt>

            {/* Cohort 3: Python & Data Structures with Piston */}
            <CardTilt className="p-6 sm:p-8 rounded-2xl bg-[#FAFAF7] dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] hover:border-[#E05A33]/50 transition-all flex flex-col justify-between group shadow-xs">
              <div>
                <div className="flex items-center justify-between gap-4">
                  <span className="px-3 py-1 rounded-md bg-[#FDF0EB] dark:bg-[#3A150C] border border-[#F5B8A3] dark:border-[#7D2F1A] text-[#E05A33] text-xs font-mono font-bold">
                    DIPLOMA LEVEL · CS2001
                  </span>
                  <span className="text-xs font-mono text-[#8C8C87]">5.0 / 5.0 (510 Reviews)</span>
                </div>

                <h3 className="text-2xl font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] mt-4 font-display group-hover:text-[#E05A33] transition-colors">
                  Python & Data Structures (DSA with Piston Sandbox)
                </h3>
                <p className="text-sm text-[#6B6B66] dark:text-[#B5B3AD] mt-2 leading-relaxed">
                  Recursion, Linked Lists, Trees, Graphs, Dynamic Programming, and Time Complexity.
                  Tested against 300+ hidden edge test cases in sandboxed code environments.
                </p>

                <div className="grid grid-cols-2 gap-2 my-6 text-xs text-[#4A4A46] dark:text-[#B5B3AD] font-mono">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2D7A4F] shrink-0" />
                    <span>300+ Problem Sets</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2D7A4F] shrink-0" />
                    <span>Real-time Piston Execution</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2D7A4F] shrink-0" />
                    <span>OPPE Exam Simulations</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2D7A4F] shrink-0" />
                    <span>Clean Code & Complexity Lab</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-5 border-t border-[#E8E6E1] dark:border-[#2D2D2A]">
                  <div className="p-4 rounded-xl bg-white dark:bg-[#242422] border border-[#E8E6E1] dark:border-[#2D2D2A] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase text-[#8C8C87] font-bold">Self-Paced</span>
                        <span className="text-[10px] font-mono text-[#B5B3AD]">Recorded</span>
                      </div>
                      <div className="mt-2">
                        <div className="text-2xl font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] font-display">₹2,999</div>
                        <div className="text-[11px] text-[#8C8C87]">One-time payment · 1 yr</div>
                      </div>
                      <ul className="mt-3 space-y-1 text-[11px] text-[#6B6B66] dark:text-[#B5B3AD] font-mono">
                        <li>• DSA Video Lectures</li>
                        <li>• Browser IDE Access</li>
                        <li>• Algorithmic Cheat Sheets</li>
                      </ul>
                    </div>
                    <Link
                      href="/courses"
                      className="mt-4 w-full py-2.5 rounded-lg bg-[#F5F3EF] dark:bg-[#2D2D2A] hover:bg-[#EDEBE5] text-center text-xs font-bold text-[#1A1A19] dark:text-[#F5F3EF] transition-colors"
                    >
                      Get Recorded
                    </Link>
                  </div>

                  <div className="p-4 rounded-xl bg-[#FDF0EB] dark:bg-[#3A150C]/40 border border-[#F5B8A3] dark:border-[#7D2F1A] flex flex-col justify-between relative overflow-hidden">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase text-[#E05A33] font-bold">Live Masterclass</span>
                        <span className="text-[10px] font-mono text-[#E05A33]">OPPE SPECIAL</span>
                      </div>
                      <div className="mt-2">
                        <div className="text-2xl font-extrabold text-[#E05A33] font-display">₹5,499</div>
                        <div className="text-[11px] text-[#8C8C87]">Includes Recorded + Live</div>
                      </div>
                      <ul className="mt-3 space-y-1 text-[11px] text-[#4A4A46] dark:text-[#B5B3AD] font-mono">
                        <li className="text-[#E05A33] font-semibold">• Live Coding Jams with IIT TAs</li>
                        <li>• 1:1 Code Reviews on GitHub</li>
                        <li>• OPPE Timed Mock Exams</li>
                        <li>• Direct Support Channel</li>
                      </ul>
                    </div>
                    <Link
                      href="/courses"
                      className="mt-4 w-full py-2.5 rounded-lg bg-[#E05A33] hover:bg-[#C94A26] text-center text-xs font-extrabold text-white shadow-sm shadow-[#E05A33]/20 transition-all hover:scale-[1.02]"
                    >
                      Enroll Live Batch
                    </Link>
                  </div>
                </div>
              </div>
            </CardTilt>

            {/* Cohort 4: Machine Learning Foundations & Practice */}
            <CardTilt className="p-6 sm:p-8 rounded-2xl bg-[#FAFAF7] dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] hover:border-[#E05A33]/50 transition-all flex flex-col justify-between group shadow-xs">
              <div>
                <div className="flex items-center justify-between gap-4">
                  <span className="px-3 py-1 rounded-md bg-[#FDF0EB] dark:bg-[#3A150C] border border-[#F5B8A3] dark:border-[#7D2F1A] text-[#E05A33] text-xs font-mono font-bold">
                    DIPLOMA LEVEL · ML2003
                  </span>
                  <span className="text-xs font-mono text-[#8C8C87]">4.9 / 5.0 (320 Reviews)</span>
                </div>

                <h3 className="text-2xl font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] mt-4 font-display group-hover:text-[#E05A33] transition-colors">
                  Machine Learning Foundations & Practice (MLP)
                </h3>
                <p className="text-sm text-[#6B6B66] dark:text-[#B5B3AD] mt-2 leading-relaxed">
                  Supervised Learning, Neural Networks, Decision Trees, Gradient Descent,
                  Scikit-Learn pipelines, and End-Term project implementation.
                </p>

                <div className="grid grid-cols-2 gap-2 my-6 text-xs text-[#4A4A46] dark:text-[#B5B3AD] font-mono">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2D7A4F] shrink-0" />
                    <span>8 Real-world Kaggle Projects</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2D7A4F] shrink-0" />
                    <span>30 Proctored Mock Quizzes</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2D7A4F] shrink-0" />
                    <span>Mathematics of Deep Learning</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2D7A4F] shrink-0" />
                    <span>End-Term Target Defense</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-5 border-t border-[#E8E6E1] dark:border-[#2D2D2A]">
                  <div className="p-4 rounded-xl bg-white dark:bg-[#242422] border border-[#E8E6E1] dark:border-[#2D2D2A] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase text-[#8C8C87] font-bold">Self-Paced</span>
                        <span className="text-[10px] font-mono text-[#B5B3AD]">Recorded</span>
                      </div>
                      <div className="mt-2">
                        <div className="text-2xl font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] font-display">₹3,499</div>
                        <div className="text-[11px] text-[#8C8C87]">One-time payment · 1 yr</div>
                      </div>
                      <ul className="mt-3 space-y-1 text-[11px] text-[#6B6B66] dark:text-[#B5B3AD] font-mono">
                        <li>• ML Practice Video Vault</li>
                        <li>• Math Derivations (LaTeX)</li>
                        <li>• Project Templates</li>
                      </ul>
                    </div>
                    <Link
                      href="/courses"
                      className="mt-4 w-full py-2.5 rounded-lg bg-[#F5F3EF] dark:bg-[#2D2D2A] hover:bg-[#EDEBE5] text-center text-xs font-bold text-[#1A1A19] dark:text-[#F5F3EF] transition-colors"
                    >
                      Get Recorded
                    </Link>
                  </div>

                  <div className="p-4 rounded-xl bg-[#FDF0EB] dark:bg-[#3A150C]/40 border border-[#F5B8A3] dark:border-[#7D2F1A] flex flex-col justify-between relative overflow-hidden">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase text-[#E05A33] font-bold">Live Masterclass</span>
                        <span className="text-[10px] font-mono text-[#E05A33]">PROJECT MENTOR</span>
                      </div>
                      <div className="mt-2">
                        <div className="text-2xl font-extrabold text-[#E05A33] font-display">₹6,499</div>
                        <div className="text-[11px] text-[#8C8C87]">Includes Recorded + Live</div>
                      </div>
                      <ul className="mt-3 space-y-1 text-[11px] text-[#4A4A46] dark:text-[#B5B3AD] font-mono">
                        <li className="text-[#E05A33] font-semibold">• 1:1 Project Review</li>
                        <li>• Live Model Architecture Sittings</li>
                        <li>• Weekly TA Office Hours</li>
                        <li>• Certificate of Excellence</li>
                      </ul>
                    </div>
                    <Link
                      href="/courses"
                      className="mt-4 w-full py-2.5 rounded-lg bg-[#E05A33] hover:bg-[#C94A26] text-center text-xs font-extrabold text-white shadow-sm shadow-[#E05A33]/20 transition-all hover:scale-[1.02]"
                    >
                      Enroll Live Batch
                    </Link>
                  </div>
                </div>
              </div>
            </CardTilt>
          </div>
        </div>
      </section>

      {/* Comparison Matrix: Northstar vs YouTube vs Traditional Coaching */}
      <section id="comparison" className="py-24 border-t border-[#E8E6E1] dark:border-[#2D2D2A] bg-[#FAFAF7] dark:bg-[#111110]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-mono uppercase tracking-wider text-[#E05A33] font-semibold">
              UNCOMPROMISING ACADEMIC RIGOR
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] tracking-tight font-display mt-2">
              Why Top Scorers Leave YouTube Behind.
            </h2>
            <p className="text-[#6B6B66] dark:text-[#B5B3AD] text-sm sm:text-base mt-2">
              Generic GATE videos and outdated playlists don't reflect the official IITM BS grading rubrics.
              See how our specialized system transforms your final term outcome.
            </p>
          </div>

          <FadeUp>
            <div className="rounded-2xl border border-[#E8E6E1] dark:border-[#2D2D2A] bg-white dark:bg-[#1C1C1A] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-[#E8E6E1] dark:border-[#2D2D2A] bg-[#F5F3EF] dark:bg-[#242422] font-mono text-xs uppercase">
                      <th className="py-4 px-6 text-[#6B6B66] dark:text-[#B5B3AD] font-bold">Academic Feature</th>
                      <th className="py-4 px-6 bg-[#FDF0EB] dark:bg-[#3A150C]/60 text-[#E05A33] font-bold border-x border-[#F5B8A3]/40 dark:border-[#7D2F1A]">
                        Northstar SaaS
                      </th>
                      <th className="py-4 px-6 text-[#8C8C87] font-semibold">YouTube Playlists</th>
                      <th className="py-4 px-6 text-[#8C8C87] font-semibold">Generic Coaching</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E6E1] dark:divide-[#2D2D2A] font-mono text-xs">
                    <tr className="hover:bg-[#FAFAF7] dark:hover:bg-[#242422]/50 transition-colors">
                      <td className="py-4 px-6 font-sans font-semibold text-[#1A1A19] dark:text-[#F5F3EF]">
                        IITM BS Syllabus & Formula Alignment
                      </td>
                      <td className="py-4 px-6 bg-[#FDF0EB]/40 dark:bg-[#3A150C]/30 text-[#E05A33] font-bold border-x border-[#F5B8A3]/30 dark:border-[#7D2F1A] flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#2D7A4F]" />
                        <span>100% Exact Alignment</span>
                      </td>
                      <td className="py-4 px-6 text-[#8C8C87] flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-[#C94B3E]" />
                        <span>Fragmented & Outdated</span>
                      </td>
                      <td className="py-4 px-6 text-[#8C8C87] flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-[#D4952B]" />
                        <span>Generic JEE/GATE syllabus</span>
                      </td>
                    </tr>

                    <tr className="hover:bg-[#FAFAF7] dark:hover:bg-[#242422]/50 transition-colors">
                      <td className="py-4 px-6 font-sans font-semibold text-[#1A1A19] dark:text-[#F5F3EF]">
                        Exam-Pattern Mock Simulations & PYQs
                      </td>
                      <td className="py-4 px-6 bg-[#FDF0EB]/40 dark:bg-[#3A150C]/30 text-[#E05A33] font-bold border-x border-[#F5B8A3]/30 dark:border-[#7D2F1A] flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#2D7A4F]" />
                        <span>Exact TCS iON Exam Pattern</span>
                      </td>
                      <td className="py-4 px-6 text-[#8C8C87] flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-[#C94B3E]" />
                        <span>Zero Mock Practice</span>
                      </td>
                      <td className="py-4 px-6 text-[#8C8C87] flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-[#C94B3E]" />
                        <span>Pen & Paper only</span>
                      </td>
                    </tr>

                    <tr className="hover:bg-[#FAFAF7] dark:hover:bg-[#242422]/50 transition-colors">
                      <td className="py-4 px-6 font-sans font-semibold text-[#1A1A19] dark:text-[#F5F3EF]">
                        Official Grading Simulator & Target Calc
                      </td>
                      <td className="py-4 px-6 bg-[#FDF0EB]/40 dark:bg-[#3A150C]/30 text-[#E05A33] font-bold border-x border-[#F5B8A3]/30 dark:border-[#7D2F1A] flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#2D7A4F]" />
                        <span>Reverse Sunday Target Engine</span>
                      </td>
                      <td className="py-4 px-6 text-[#8C8C87] flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-[#C94B3E]" />
                        <span>None (Manual guesswork)</span>
                      </td>
                      <td className="py-4 px-6 text-[#8C8C87] flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-[#C94B3E]" />
                        <span>No IITM formula simulator</span>
                      </td>
                    </tr>

                    <tr className="hover:bg-[#FAFAF7] dark:hover:bg-[#242422]/50 transition-colors">
                      <td className="py-4 px-6 font-sans font-semibold text-[#1A1A19] dark:text-[#F5F3EF]">
                        Integrated Piston Code Sandbox
                      </td>
                      <td className="py-4 px-6 bg-[#FDF0EB]/40 dark:bg-[#3A150C]/30 text-[#E05A33] font-bold border-x border-[#F5B8A3]/30 dark:border-[#7D2F1A] flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#2D7A4F]" />
                        <span>Python, Java, C++ in-browser</span>
                      </td>
                      <td className="py-4 px-6 text-[#8C8C87] flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-[#C94B3E]" />
                        <span>No code sandbox</span>
                      </td>
                      <td className="py-4 px-6 text-[#8C8C87] flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-[#D4952B]" />
                        <span>Local installation hassle</span>
                      </td>
                    </tr>

                    <tr className="hover:bg-[#FAFAF7] dark:hover:bg-[#242422]/50 transition-colors">
                      <td className="py-4 px-6 font-sans font-semibold text-[#1A1A19] dark:text-[#F5F3EF]">
                        1:1 Doubt Clearance & Live Jams
                      </td>
                      <td className="py-4 px-6 bg-[#FDF0EB]/40 dark:bg-[#3A150C]/30 text-[#E05A33] font-bold border-x border-[#F5B8A3]/30 dark:border-[#7D2F1A] flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#2D7A4F]" />
                        <span>&lt; 15 min TA turnaround</span>
                      </td>
                      <td className="py-4 px-6 text-[#8C8C87] flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-[#C94B3E]" />
                        <span>Ignored in comment sections</span>
                      </td>
                      <td className="py-4 px-6 text-[#8C8C87] flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-[#D4952B]" />
                        <span>Crowded 100+ student batches</span>
                      </td>
                    </tr>

                    <tr className="hover:bg-[#FAFAF7] dark:hover:bg-[#242422]/50 transition-colors">
                      <td className="py-4 px-6 font-sans font-semibold text-[#1A1A19] dark:text-[#F5F3EF]">
                        2-Sided 5% Referral Wallet Coins
                      </td>
                      <td className="py-4 px-6 bg-[#FDF0EB]/40 dark:bg-[#3A150C]/30 text-[#E05A33] font-bold border-x border-[#F5B8A3]/30 dark:border-[#7D2F1A] flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#2D7A4F]" />
                        <span>Earn & Spend Coins Instantly</span>
                      </td>
                      <td className="py-4 px-6 text-[#8C8C87] flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-[#C94B3E]" />
                        <span>None</span>
                      </td>
                      <td className="py-4 px-6 text-[#8C8C87] flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-[#C94B3E]" />
                        <span>None</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* IITM Academic Resources & Career Hub */}
      <section className="py-24 border-t border-[#E8E6E1] dark:border-[#2D2D2A] bg-white dark:bg-[#161615]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-mono uppercase tracking-wider text-[#E05A33] font-semibold">
              FREE ACADEMIC TOOLKIT
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] tracking-tight font-display mt-2">
              Academic Resources, Placement & Support Hub.
            </h2>
            <p className="text-[#6B6B66] dark:text-[#B5B3AD] text-sm sm:text-base mt-2">
              Everything you need for your IIT Madras BS journey: downloadable formula cheatsheets, exact score predictors, and level-mapped job placements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tool 1 */}
            <CardTilt className="p-6 rounded-2xl bg-[#FAFAF7] dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] hover:border-[#E05A33]/50 transition-all flex flex-col justify-between shadow-xs">
              <div>
                <div className="p-3 rounded-xl bg-[#FDF0EB] dark:bg-[#3A150C] border border-[#F5B8A3] dark:border-[#7D2F1A] text-[#E05A33] w-fit">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#1A1A19] dark:text-[#F5F3EF] mt-4 font-display">
                  Study Resources & Formula Sheets
                </h3>
                <p className="text-xs text-[#6B6B66] dark:text-[#B5B3AD] mt-2 leading-relaxed">
                  Download high-yield formula sheets, previous year solved question sets (PYQs), and algorithmic cheat sheets for all IITM BS courses.
                </p>
              </div>
              <div className="pt-6">
                <Link
                  href="/resources"
                  className="inline-flex items-center gap-1.5 text-xs text-[#E05A33] hover:text-[#C94A26] font-bold"
                >
                  <span>Browse Free Library</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </CardTilt>

            {/* Tool 2 */}
            <CardTilt className="p-6 rounded-2xl bg-[#FAFAF7] dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] hover:border-[#E05A33]/50 transition-all flex flex-col justify-between shadow-xs">
              <div>
                <div className="p-3 rounded-xl bg-[#FDF0EB] dark:bg-[#3A150C] border border-[#F5B8A3] dark:border-[#7D2F1A] text-[#E05A33] w-fit">
                  <Calculator className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#1A1A19] dark:text-[#F5F3EF] mt-4 font-display">
                  Reverse End-Term Predictor
                </h3>
                <p className="text-xs text-[#6B6B66] dark:text-[#B5B3AD] mt-2 leading-relaxed">
                  Input your weekly assignment average, Quiz 1, and Quiz 2 scores. Our algorithm computes the
                  exact marks you need in the End-Term exam on Sunday to secure an S, A, or B grade.
                </p>
              </div>
              <div className="pt-6">
                <Link
                  href="/tools"
                  className="inline-flex items-center gap-1.5 text-xs text-[#E05A33] hover:text-[#C94A26] font-bold"
                >
                  <span>Launch Predictor</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </CardTilt>

            {/* Tool 3 */}
            <CardTilt className="p-6 rounded-2xl bg-[#FAFAF7] dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] hover:border-[#E05A33]/50 transition-all flex flex-col justify-between shadow-xs">
              <div>
                <div className="p-3 rounded-xl bg-[#FDF0EB] dark:bg-[#3A150C] border border-[#F5B8A3] dark:border-[#7D2F1A] text-[#E05A33] w-fit">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#1A1A19] dark:text-[#F5F3EF] mt-4 font-display">
                  Careers & Internships
                </h3>
                <p className="text-xs text-[#6B6B66] dark:text-[#B5B3AD] mt-2 leading-relaxed">
                  Verified data science, machine learning, and software engineering opportunities from IITM Research Park incubators and alumni partner firms.
                </p>
              </div>
              <div className="pt-6">
                <Link
                  href="/careers"
                  className="inline-flex items-center gap-1.5 text-xs text-[#E05A33] hover:text-[#C94A26] font-bold"
                >
                  <span>Explore Openings</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </CardTilt>
          </div>
        </div>
      </section>

      {/* Verified Student Social Proof */}
      <section className="py-24 border-t border-[#E8E6E1] dark:border-[#2D2D2A] bg-[#FAFAF7] dark:bg-[#111110]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-mono uppercase tracking-wider text-[#E05A33] font-semibold">
              REAL RESULTS · REAL LEARNERS
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] tracking-tight font-display mt-2">
              From Average Grades to Dean's List.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CardTilt className="p-6 rounded-2xl bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] shadow-xs">
              <div className="flex items-center gap-1 text-[#D4952B] mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs text-[#4A4A46] dark:text-[#B5B3AD] leading-relaxed italic">
                "I was struggling with Math 2 and had almost failed Quiz 1. The reverse target calculator
                showed me I needed 58 in End-Term. After attending Aryan's live doubt jams, I scored 74 and
                secured an S grade!"
              </p>
              <div className="mt-4 pt-4 border-t border-[#E8E6E1] dark:border-[#2D2D2A] flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#1A1A19] dark:text-[#F5F3EF] text-xs">Rohit M.</div>
                  <div className="text-[11px] text-[#8C8C87] font-mono">IITM BS Foundation · CGPA 9.4</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#FDF0EB] dark:bg-[#3A150C] text-[#E05A33] text-[10px] font-mono font-bold">
                  VERIFIED
                </span>
              </div>
            </CardTilt>

            <CardTilt className="p-6 rounded-2xl bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] shadow-xs">
              <div className="flex items-center gap-1 text-[#D4952B] mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs text-[#4A4A46] dark:text-[#B5B3AD] leading-relaxed italic">
                "The proctored mock exams are identical to the actual Sunday test center format. The tab-blur
                telemetry made me take mocks seriously instead of casually checking answers. Jumped from 6.9 to
                8.8 CGPA!"
              </p>
              <div className="mt-4 pt-4 border-t border-[#E8E6E1] dark:border-[#2D2D2A] flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#1A1A19] dark:text-[#F5F3EF] text-xs">Ananya S.</div>
                  <div className="text-[11px] text-[#8C8C87] font-mono">Diploma in Data Science</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#FDF0EB] dark:bg-[#3A150C] text-[#E05A33] text-[10px] font-mono font-bold">
                  VERIFIED
                </span>
              </div>
            </CardTilt>

            <CardTilt className="p-6 rounded-2xl bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] shadow-xs">
              <div className="flex items-center gap-1 text-[#D4952B] mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs text-[#4A4A46] dark:text-[#B5B3AD] leading-relaxed italic">
                "The in-browser Python IDE with Piston hidden test cases saved me during OPPE preparation.
                I solved over 120 problem sets before the final exam and cleared with 98% accuracy."
              </p>
              <div className="mt-4 pt-4 border-t border-[#E8E6E1] dark:border-[#2D2D2A] flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#1A1A19] dark:text-[#F5F3EF] text-xs">Devansh K.</div>
                  <div className="text-[11px] text-[#8C8C87] font-mono">Diploma in Programming</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#FDF0EB] dark:bg-[#3A150C] text-[#E05A33] text-[10px] font-mono font-bold">
                  VERIFIED
                </span>
              </div>
            </CardTilt>
          </div>
        </div>
      </section>

      {/* Closing Call to Action Banner */}
      <section className="py-24 border-t border-[#E8E6E1] dark:border-[#2D2D2A] bg-gradient-to-b from-[#FAFAF7] to-[#F5F3EF] dark:from-[#111110] dark:to-[#161615] text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <FadeUp>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FDF0EB] dark:bg-[#3A150C] border border-[#F5B8A3] dark:border-[#7D2F1A] text-xs text-[#E05A33] font-mono font-semibold">
              <Trophy className="w-3.5 h-3.5" />
              <span>JOIN OVER 10,000 SUCCESSFUL IITM LEARNERS</span>
            </div>
          </FadeUp>

          <FadeUp delay={0.05}>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] tracking-tight font-display">
              Ready to secure an S Grade this term?
            </h2>
          </FadeUp>

          <FadeUp delay={0.1}>
            <p className="text-[#6B6B66] dark:text-[#B5B3AD] text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
              Enroll today in our featured cohorts or unlock the proctored mock testing suite. Your highest
              CGPA is just one term away.
            </p>
          </FadeUp>

          <FadeUp delay={0.15}>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <HoverScale>
                <Link
                  href="/courses"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#E05A33] hover:bg-[#C94A26] text-white font-extrabold text-sm shadow-md shadow-[#E05A33]/25 transition-all"
                >
                  <span>Browse All Cohorts</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </HoverScale>
              <HoverScale>
                <Link
                  href="/tools"
                  className="inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] hover:border-[#E05A33]/50 text-[#1A1A19] dark:text-[#F5F3EF] font-bold text-sm transition-all shadow-xs"
                >
                  <Calculator className="w-4 h-4 text-[#E05A33]" />
                  <span>Predict My Grade</span>
                </Link>
              </HoverScale>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* Modern SaaS Editorial Footer */}
      <footer className="border-t border-[#E8E6E1] dark:border-[#2D2D2A] bg-[#F5F3EF] dark:bg-[#161615] py-14 text-xs text-[#8C8C87]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#E05A33] flex items-center justify-center text-white font-black font-display text-sm">
                n
              </span>
              <span className="font-extrabold text-base tracking-tight text-[#1A1A19] dark:text-[#F5F3EF] font-display">
                northstar<span className="text-[#E05A33]">.</span>
              </span>
            </Link>
            <p className="text-[#6B6B66] dark:text-[#B5B3AD] text-xs leading-relaxed">
              Unified Academic Platform, Proctored Assessment Suite & Learning Intelligence for IIT Madras BS Degree.
            </p>
            <div className="font-mono text-[11px] text-[#8C8C87]">
              © 2026 Northstar Systems · All rights reserved.
            </div>
          </div>

          <div>
            <div className="font-mono text-xs uppercase text-[#1A1A19] dark:text-[#F5F3EF] font-bold mb-3">Academic Suite</div>
            <ul className="space-y-2 text-[#6B6B66] dark:text-[#B5B3AD]">
              <li><Link href="/courses" className="hover:text-[#E05A33] transition-colors">Courses & Batches</Link></li>
              <li><Link href="/resources" className="hover:text-[#E05A33] transition-colors">Resources & PYQs</Link></li>
              <li><Link href="/tools" className="hover:text-[#E05A33] transition-colors">IITM CGPA & Target Predictor</Link></li>
              <li><Link href="/careers" className="hover:text-[#E05A33] transition-colors">Careers & Jobs</Link></li>
            </ul>
          </div>

          <div>
            <div className="font-mono text-xs uppercase text-[#1A1A19] dark:text-[#F5F3EF] font-bold mb-3">Support & Community</div>
            <ul className="space-y-2 text-[#6B6B66] dark:text-[#B5B3AD]">
              <li><Link href="/support" className="hover:text-[#E05A33] transition-colors">24/7 Helpdesk & FAQ</Link></li>
              <li><Link href="/one-to-one" className="hover:text-[#E05A33] transition-colors">1:1 Mentorship</Link></li>
              <li><Link href="/live" className="hover:text-[#E05A33] transition-colors">Live Doubt Clinics</Link></li>
              <li><Link href="/refer" className="hover:text-[#E05A33] transition-colors">5% Referral Program</Link></li>
            </ul>
          </div>

          <div>
            <div className="font-mono text-xs uppercase text-[#1A1A19] dark:text-[#F5F3EF] font-bold mb-3">Portal & Workspace</div>
            <ul className="space-y-2 text-[#6B6B66] dark:text-[#B5B3AD]">
              <li><Link href="/dashboard" className="hover:text-[#E05A33] transition-colors">Student Dashboard</Link></li>
              <li><Link href="/verify" className="hover:text-[#E05A33] transition-colors">Verify Faculty Credentials</Link></li>
              <li><Link href="/manager" className="hover:text-[#E05A33] transition-colors">Staff Console</Link></li>
              <li><span className="text-[#2D7A4F] font-mono">● All Systems Operational</span></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
