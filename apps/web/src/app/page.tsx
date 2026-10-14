/**
 * @file apps/web/src/app/page.tsx
 * @description Clean, minimal editorial landing page for GenZ IITian.
 *
 * Stripped of all wordy filler subheadings and generic AI marketing copy.
 * Crisp, punchy typography, warm palette with terracotta accents, and subtle animations.
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
  Calculator,
  Star,
  Coins,
  BookOpen,
  Briefcase,
  Trophy,
} from 'lucide-react';

import { SiteNavbar } from '@/components/layout/site-navbar';
import {
  FadeUp,
  CardTilt,
  CountUp,
  MorphBlob,
  HoverScale,
} from './landing-animations';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-[#FAFAF7] dark:bg-[#111110] text-[#1A1A19] dark:text-[#F5F3EF] font-sans selection:bg-[#FDF0EB] selection:text-[#E05A33] transition-colors">
      {/* Site Navbar */}
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
      <section className="relative overflow-hidden pt-14 pb-16 lg:pt-20 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Announcement Pill */}
          <div className="flex justify-center mb-6">
            <FadeUp>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] text-xs text-[#1A1A19] dark:text-[#F5F3EF] shadow-xs">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E05A33] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E05A33]" />
                </span>
                <span className="font-semibold text-[#E05A33]">SUMMER 2026</span>
                <span className="text-[#8C8C87]">·</span>
                <span className="text-[#6B6B66] dark:text-[#B5B3AD]">10,000+ IITM Learners</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#E05A33]" />
              </div>
            </FadeUp>
          </div>

          {/* Hero Typography */}
          <div className="text-center max-w-4xl mx-auto space-y-5">
            <FadeUp delay={0.05}>
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#1A1A19] dark:text-[#F5F3EF] font-display leading-[1.08]">
                Master Your IIT Madras BS Degree.{' '}
                <span className="block mt-1 text-[#E05A33]">
                  Guaranteed S & A Grades.
                </span>
              </h1>
            </FadeUp>

            <FadeUp delay={0.1}>
              <p className="text-base sm:text-lg text-[#6B6B66] dark:text-[#B5B3AD] max-w-xl mx-auto">
                Proctored mock exams, live doubt jams with IIT alumni, and official grade predictor.
              </p>
            </FadeUp>

            {/* Hero Action CTAs */}
            <FadeUp delay={0.15}>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                <HoverScale>
                  <Link
                    href="#cohorts"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#E05A33] hover:bg-[#C94A26] text-white font-bold text-sm shadow-sm transition-all"
                  >
                    <span>Explore Cohorts</span>
                    <Sparkles className="w-4 h-4" />
                  </Link>
                </HoverScale>

                <HoverScale>
                  <Link
                    href="/tools"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] hover:border-[#E05A33]/50 text-[#1A1A19] dark:text-[#F5F3EF] font-bold text-sm shadow-xs transition-all"
                  >
                    <Calculator className="w-4 h-4 text-[#E05A33]" />
                    <span>Grade Predictor</span>
                  </Link>
                </HoverScale>

                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 px-3 py-3 text-xs text-[#8C8C87] hover:text-[#E05A33] font-mono transition-colors"
                >
                  <span>Student Space →</span>
                </Link>
              </div>
            </FadeUp>
          </div>

          {/* Stats Bar */}
          <div className="mt-14 max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <CardTilt className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] text-center shadow-xs">
              <div className="text-3xl sm:text-4xl font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] font-display">
                <CountUp target={10000} suffix="+" />
              </div>
              <div className="text-xs text-[#8C8C87] font-medium mt-1">Active IITM Learners</div>
            </CardTilt>

            <CardTilt className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] text-center shadow-xs">
              <div className="text-3xl sm:text-4xl font-extrabold text-[#E05A33] font-display">
                99.4%
              </div>
              <div className="text-xs text-[#8C8C87] font-medium mt-1">Exam Clearance Rate</div>
            </CardTilt>

            <CardTilt className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] text-center shadow-xs">
              <div className="text-3xl sm:text-4xl font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] font-display flex items-center justify-center gap-1">
                <span>4.9</span>
                <Star className="w-5 h-5 text-[#D4952B] fill-[#D4952B]" />
              </div>
              <div className="text-xs text-[#8C8C87] font-medium mt-1">Course Rating</div>
            </CardTilt>

            <CardTilt className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] text-center shadow-xs">
              <div className="text-3xl sm:text-4xl font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] font-display">
                <CountUp target={150} suffix="+" />
              </div>
              <div className="text-xs text-[#8C8C87] font-medium mt-1">Proctored Mocks & Labs</div>
            </CardTilt>
          </div>

          {/* Minimal Product Telemetry Window */}
          <FadeUp delay={0.2} className="mt-12 max-w-5xl mx-auto">
            <div className="rounded-2xl border border-[#E8E6E1] dark:border-[#2D2D2A] bg-white dark:bg-[#1C1C1A] shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 bg-[#F5F3EF] dark:bg-[#242422] border-b border-[#E8E6E1] dark:border-[#2D2D2A] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E05A33]/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D4952B]/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2D7A4F]/80 inline-block" />
                  <span className="ml-2 text-xs font-mono text-[#8C8C87]">
                    iitm-workspace v2.4
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-[#2D7A4F] animate-pulse" />
                  <span className="text-[#2D7A4F] font-bold">ONLINE</span>
                </div>
              </div>

              <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#FAFAF7] dark:bg-[#181817]">
                <div className="p-4 rounded-xl bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-[#8C8C87] font-semibold">Study Library</span>
                    <BookOpen className="w-4 h-4 text-[#E05A33]" />
                  </div>
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between py-1 border-b border-[#E8E6E1] dark:border-[#2D2D2A]">
                      <span className="text-[#6B6B66] dark:text-[#B5B3AD]">Math 1 Formula Sheet:</span>
                      <span className="text-[#E05A33] font-bold">PDF</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#E8E6E1] dark:border-[#2D2D2A]">
                      <span className="text-[#6B6B66] dark:text-[#B5B3AD]">Solved PYQs:</span>
                      <span className="text-[#E05A33] font-bold">Terms 1 - 4</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-[#6B6B66] dark:text-[#B5B3AD]">Python Solutions:</span>
                      <span className="text-[#1A1A19] dark:text-[#F5F3EF]">50 Verified</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-[#8C8C87] font-semibold">Target Predictor</span>
                    <Calculator className="w-4 h-4 text-[#D4952B]" />
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-[#8C8C87] font-mono text-[11px]">
                      <span>Quiz 1: <strong className="text-[#1A1A19] dark:text-[#F5F3EF]">88/100</strong></span>
                      <span>Quiz 2: <strong className="text-[#1A1A19] dark:text-[#F5F3EF]">92/100</strong></span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#FDF0EB] dark:bg-[#3A150C]/60 border border-[#F5B8A3] dark:border-[#7D2F1A]">
                      <div className="text-[11px] font-mono text-[#A33C1F] dark:text-[#F5B8A3]">Target for S Grade:</div>
                      <div className="text-lg font-extrabold text-[#E05A33] font-display">Score ≥ 46 / 100 in End-Term</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase text-[#8C8C87] font-semibold">Openings</span>
                    <Briefcase className="w-4 h-4 text-[#2D7A4F]" />
                  </div>
                  <div className="p-2 rounded bg-[#F5F3EF] dark:bg-[#242422] border border-[#E8E6E1] dark:border-[#2D2D2A] text-[11px] space-y-1 font-mono">
                    <div className="text-[#E05A33] font-bold truncate">● IITM Incubator: ₹35k/mo</div>
                    <div className="text-[#2D7A4F] font-bold truncate">● ML Associate: ₹12-16 LPA</div>
                  </div>
                </div>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* Featured Cohorts Showcase */}
      <section id="cohorts" className="py-20 border-t border-[#E8E6E1] dark:border-[#2D2D2A] bg-white dark:bg-[#161615]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-mono uppercase tracking-wider text-[#E05A33] font-semibold">
                  TERM 1 & 2
                </span>
                <span className="text-[#B5B3AD]">/</span>
                <span className="text-xs font-mono uppercase tracking-wider text-[#8C8C87]">
                  Self-Paced vs Live
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] tracking-tight font-display">
                Curated Cohorts
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDF0EB] dark:bg-[#3A150C] border border-[#F5B8A3] dark:border-[#7D2F1A] text-[#E05A33] font-mono text-xs font-semibold">
                <Coins className="w-3.5 h-3.5 text-[#D4952B]" />
                <span>5% Cashback with Referral Code</span>
              </span>
            </div>
          </div>

          {/* 4 Featured Cohort Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cohort 1: Mathematics 1 & 2 */}
            <CardTilt className="p-6 sm:p-7 rounded-2xl bg-[#FAFAF7] dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] hover:border-[#E05A33]/50 transition-all flex flex-col justify-between group shadow-xs">
              <div>
                <div className="flex items-center justify-between gap-4">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#FDF0EB] dark:bg-[#3A150C] border border-[#F5B8A3] dark:border-[#7D2F1A] text-[#E05A33] text-xs font-mono font-bold">
                    FOUNDATION · MA1001
                  </span>
                  <span className="text-xs font-mono text-[#8C8C87]">4.9 / 5.0 (420 Reviews)</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] mt-3 font-display group-hover:text-[#E05A33] transition-colors">
                  Mathematics 1 & 2 (Calculus & Linear Algebra)
                </h3>

                {/* Specs */}
                <div className="grid grid-cols-2 gap-2 my-5 text-xs text-[#4A4A46] dark:text-[#B5B3AD] font-mono">
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
                    <span>Weekly Problem Sets</span>
                  </div>
                </div>

                {/* Plans */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-[#E8E6E1] dark:border-[#2D2D2A]">
                  <div className="p-3.5 rounded-xl bg-white dark:bg-[#242422] border border-[#E8E6E1] dark:border-[#2D2D2A] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase text-[#8C8C87] font-bold">Self-Paced</span>
                        <span className="text-[10px] font-mono text-[#B5B3AD]">Recorded</span>
                      </div>
                      <div className="mt-2">
                        <div className="text-2xl font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] font-display">₹2,499</div>
                        <div className="text-[11px] text-[#8C8C87]">1-year access</div>
                      </div>
                      <ul className="mt-2.5 space-y-1 text-[11px] text-[#6B6B66] dark:text-[#B5B3AD] font-mono">
                        <li>• Full HD Video Library</li>
                        <li>• Auto-graded Quizzes</li>
                        <li>• Downloadable Notes</li>
                      </ul>
                    </div>
                    <Link
                      href="/courses"
                      className="mt-3.5 w-full py-2 rounded-lg bg-[#F5F3EF] dark:bg-[#2D2D2A] hover:bg-[#EDEBE5] text-center text-xs font-bold text-[#1A1A19] dark:text-[#F5F3EF] transition-colors"
                    >
                      Get Recorded
                    </Link>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FDF0EB] dark:bg-[#3A150C]/40 border border-[#F5B8A3] dark:border-[#7D2F1A] flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-2 right-2">
                      <span className="px-1.5 py-0.5 rounded bg-[#E05A33] text-white font-black text-[9px] font-mono">
                        POPULAR
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase text-[#E05A33] font-bold">Live Masterclass</span>
                      </div>
                      <div className="mt-2">
                        <div className="text-2xl font-extrabold text-[#E05A33] font-display">₹4,999</div>
                        <div className="text-[11px] text-[#8C8C87]">Recorded + Live</div>
                      </div>
                      <ul className="mt-2.5 space-y-1 text-[11px] text-[#4A4A46] dark:text-[#B5B3AD] font-mono">
                        <li className="text-[#E05A33] font-semibold">• 2x Weekly Meet Jams</li>
                        <li>• 1:1 TA Doubt Sessions</li>
                        <li>• VIP Student Group</li>
                        <li>• Homework Feedback</li>
                      </ul>
                    </div>
                    <Link
                      href="/courses"
                      className="mt-3.5 w-full py-2 rounded-lg bg-[#E05A33] hover:bg-[#C94A26] text-center text-xs font-extrabold text-white shadow-xs transition-all"
                    >
                      Enroll Live Batch
                    </Link>
                  </div>
                </div>
              </div>
            </CardTilt>

            {/* Cohort 2: Statistics for Data Science 1 & 2 */}
            <CardTilt className="p-6 sm:p-7 rounded-2xl bg-[#FAFAF7] dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] hover:border-[#E05A33]/50 transition-all flex flex-col justify-between group shadow-xs">
              <div>
                <div className="flex items-center justify-between gap-4">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#FDF0EB] dark:bg-[#3A150C] border border-[#F5B8A3] dark:border-[#7D2F1A] text-[#E05A33] text-xs font-mono font-bold">
                    FOUNDATION · ST1002
                  </span>
                  <span className="text-xs font-mono text-[#8C8C87]">4.9 / 5.0 (380 Reviews)</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] mt-3 font-display group-hover:text-[#E05A33] transition-colors">
                  Statistics for Data Science 1 & 2
                </h3>

                <div className="grid grid-cols-2 gap-2 my-5 text-xs text-[#4A4A46] dark:text-[#B5B3AD] font-mono">
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
                    <span>Python Notebooks</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2D7A4F] shrink-0" />
                    <span>Live Mock Drills</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-[#E8E6E1] dark:border-[#2D2D2A]">
                  <div className="p-3.5 rounded-xl bg-white dark:bg-[#242422] border border-[#E8E6E1] dark:border-[#2D2D2A] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase text-[#8C8C87] font-bold">Self-Paced</span>
                        <span className="text-[10px] font-mono text-[#B5B3AD]">Recorded</span>
                      </div>
                      <div className="mt-2">
                        <div className="text-2xl font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] font-display">₹2,499</div>
                        <div className="text-[11px] text-[#8C8C87]">1-year access</div>
                      </div>
                      <ul className="mt-2.5 space-y-1 text-[11px] text-[#6B6B66] dark:text-[#B5B3AD] font-mono">
                        <li>• Full Video Course</li>
                        <li>• Practice Question Bank</li>
                        <li>• Formula Cheats</li>
                      </ul>
                    </div>
                    <Link
                      href="/courses"
                      className="mt-3.5 w-full py-2 rounded-lg bg-[#F5F3EF] dark:bg-[#2D2D2A] hover:bg-[#EDEBE5] text-center text-xs font-bold text-[#1A1A19] dark:text-[#F5F3EF] transition-colors"
                    >
                      Get Recorded
                    </Link>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FDF0EB] dark:bg-[#3A150C]/40 border border-[#F5B8A3] dark:border-[#7D2F1A] flex flex-col justify-between relative overflow-hidden">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase text-[#E05A33] font-bold">Live Masterclass</span>
                        <span className="text-[10px] font-mono text-[#E05A33]">HIGH IMPACT</span>
                      </div>
                      <div className="mt-2">
                        <div className="text-2xl font-extrabold text-[#E05A33] font-display">₹4,999</div>
                        <div className="text-[11px] text-[#8C8C87]">Recorded + Live</div>
                      </div>
                      <ul className="mt-2.5 space-y-1 text-[11px] text-[#4A4A46] dark:text-[#B5B3AD] font-mono">
                        <li className="text-[#E05A33] font-semibold">• Weekly Problem Sittings</li>
                        <li>• 1:1 TA Doubt Sessions</li>
                        <li>• Mock Exam Paper Reviews</li>
                        <li>• Student Study Room</li>
                      </ul>
                    </div>
                    <Link
                      href="/courses"
                      className="mt-3.5 w-full py-2 rounded-lg bg-[#E05A33] hover:bg-[#C94A26] text-center text-xs font-extrabold text-white shadow-xs transition-all"
                    >
                      Enroll Live Batch
                    </Link>
                  </div>
                </div>
              </div>
            </CardTilt>

            {/* Cohort 3: Python & Data Structures with Piston */}
            <CardTilt className="p-6 sm:p-7 rounded-2xl bg-[#FAFAF7] dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] hover:border-[#E05A33]/50 transition-all flex flex-col justify-between group shadow-xs">
              <div>
                <div className="flex items-center justify-between gap-4">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#FDF0EB] dark:bg-[#3A150C] border border-[#F5B8A3] dark:border-[#7D2F1A] text-[#E05A33] text-xs font-mono font-bold">
                    DIPLOMA · CS2001
                  </span>
                  <span className="text-xs font-mono text-[#8C8C87]">5.0 / 5.0 (510 Reviews)</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] mt-3 font-display group-hover:text-[#E05A33] transition-colors">
                  Python & Data Structures (DSA with Piston Sandbox)
                </h3>

                <div className="grid grid-cols-2 gap-2 my-5 text-xs text-[#4A4A46] dark:text-[#B5B3AD] font-mono">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2D7A4F] shrink-0" />
                    <span>300+ Problem Sets</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2D7A4F] shrink-0" />
                    <span>Piston Sandbox Execution</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2D7A4F] shrink-0" />
                    <span>OPPE Exam Simulations</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2D7A4F] shrink-0" />
                    <span>Clean Code Drills</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-[#E8E6E1] dark:border-[#2D2D2A]">
                  <div className="p-3.5 rounded-xl bg-white dark:bg-[#242422] border border-[#E8E6E1] dark:border-[#2D2D2A] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase text-[#8C8C87] font-bold">Self-Paced</span>
                        <span className="text-[10px] font-mono text-[#B5B3AD]">Recorded</span>
                      </div>
                      <div className="mt-2">
                        <div className="text-2xl font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] font-display">₹2,999</div>
                        <div className="text-[11px] text-[#8C8C87]">1-year access</div>
                      </div>
                      <ul className="mt-2.5 space-y-1 text-[11px] text-[#6B6B66] dark:text-[#B5B3AD] font-mono">
                        <li>• DSA Video Lectures</li>
                        <li>• Browser IDE Access</li>
                        <li>• Algorithmic Cheats</li>
                      </ul>
                    </div>
                    <Link
                      href="/courses"
                      className="mt-3.5 w-full py-2 rounded-lg bg-[#F5F3EF] dark:bg-[#2D2D2A] hover:bg-[#EDEBE5] text-center text-xs font-bold text-[#1A1A19] dark:text-[#F5F3EF] transition-colors"
                    >
                      Get Recorded
                    </Link>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FDF0EB] dark:bg-[#3A150C]/40 border border-[#F5B8A3] dark:border-[#7D2F1A] flex flex-col justify-between relative overflow-hidden">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase text-[#E05A33] font-bold">Live Masterclass</span>
                        <span className="text-[10px] font-mono text-[#E05A33]">OPPE SPECIAL</span>
                      </div>
                      <div className="mt-2">
                        <div className="text-2xl font-extrabold text-[#E05A33] font-display">₹5,499</div>
                        <div className="text-[11px] text-[#8C8C87]">Recorded + Live</div>
                      </div>
                      <ul className="mt-2.5 space-y-1 text-[11px] text-[#4A4A46] dark:text-[#B5B3AD] font-mono">
                        <li className="text-[#E05A33] font-semibold">• Live Coding Jams</li>
                        <li>• 1:1 Code Reviews</li>
                        <li>• OPPE Timed Mocks</li>
                        <li>• Direct Support</li>
                      </ul>
                    </div>
                    <Link
                      href="/courses"
                      className="mt-3.5 w-full py-2 rounded-lg bg-[#E05A33] hover:bg-[#C94A26] text-center text-xs font-extrabold text-white shadow-xs transition-all"
                    >
                      Enroll Live Batch
                    </Link>
                  </div>
                </div>
              </div>
            </CardTilt>

            {/* Cohort 4: Machine Learning Foundations */}
            <CardTilt className="p-6 sm:p-7 rounded-2xl bg-[#FAFAF7] dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] hover:border-[#E05A33]/50 transition-all flex flex-col justify-between group shadow-xs">
              <div>
                <div className="flex items-center justify-between gap-4">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#FDF0EB] dark:bg-[#3A150C] border border-[#F5B8A3] dark:border-[#7D2F1A] text-[#E05A33] text-xs font-mono font-bold">
                    DIPLOMA · ML2003
                  </span>
                  <span className="text-xs font-mono text-[#8C8C87]">4.9 / 5.0 (320 Reviews)</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] mt-3 font-display group-hover:text-[#E05A33] transition-colors">
                  Machine Learning Foundations & Practice (MLP)
                </h3>

                <div className="grid grid-cols-2 gap-2 my-5 text-xs text-[#4A4A46] dark:text-[#B5B3AD] font-mono">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2D7A4F] shrink-0" />
                    <span>8 Real-world Projects</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2D7A4F] shrink-0" />
                    <span>30 Proctored Quizzes</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2D7A4F] shrink-0" />
                    <span>Deep Learning Math</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2D7A4F] shrink-0" />
                    <span>End-Term Target Defense</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-[#E8E6E1] dark:border-[#2D2D2A]">
                  <div className="p-3.5 rounded-xl bg-white dark:bg-[#242422] border border-[#E8E6E1] dark:border-[#2D2D2A] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase text-[#8C8C87] font-bold">Self-Paced</span>
                        <span className="text-[10px] font-mono text-[#B5B3AD]">Recorded</span>
                      </div>
                      <div className="mt-2">
                        <div className="text-2xl font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] font-display">₹3,499</div>
                        <div className="text-[11px] text-[#8C8C87]">1-year access</div>
                      </div>
                      <ul className="mt-2.5 space-y-1 text-[11px] text-[#6B6B66] dark:text-[#B5B3AD] font-mono">
                        <li>• ML Practice Videos</li>
                        <li>• LaTeX Derivations</li>
                        <li>• Project Templates</li>
                      </ul>
                    </div>
                    <Link
                      href="/courses"
                      className="mt-3.5 w-full py-2 rounded-lg bg-[#F5F3EF] dark:bg-[#2D2D2A] hover:bg-[#EDEBE5] text-center text-xs font-bold text-[#1A1A19] dark:text-[#F5F3EF] transition-colors"
                    >
                      Get Recorded
                    </Link>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FDF0EB] dark:bg-[#3A150C]/40 border border-[#F5B8A3] dark:border-[#7D2F1A] flex flex-col justify-between relative overflow-hidden">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase text-[#E05A33] font-bold">Live Masterclass</span>
                        <span className="text-[10px] font-mono text-[#E05A33]">PROJECT MENTOR</span>
                      </div>
                      <div className="mt-2">
                        <div className="text-2xl font-extrabold text-[#E05A33] font-display">₹6,499</div>
                        <div className="text-[11px] text-[#8C8C87]">Recorded + Live</div>
                      </div>
                      <ul className="mt-2.5 space-y-1 text-[11px] text-[#4A4A46] dark:text-[#B5B3AD] font-mono">
                        <li className="text-[#E05A33] font-semibold">• 1:1 Project Review</li>
                        <li>• Architecture Sittings</li>
                        <li>• Weekly Office Hours</li>
                        <li>• Certificate</li>
                      </ul>
                    </div>
                    <Link
                      href="/courses"
                      className="mt-3.5 w-full py-2 rounded-lg bg-[#E05A33] hover:bg-[#C94A26] text-center text-xs font-extrabold text-white shadow-xs transition-all"
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

      {/* Comparison Matrix */}
      <section id="comparison" className="py-20 border-t border-[#E8E6E1] dark:border-[#2D2D2A] bg-[#FAFAF7] dark:bg-[#111110]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-mono uppercase tracking-wider text-[#E05A33] font-semibold">
              ACADEMIC RIGOR
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] tracking-tight font-display mt-1">
              Why Top Scorers Choose Northstar
            </h2>
          </div>

          <FadeUp>
            <div className="rounded-2xl border border-[#E8E6E1] dark:border-[#2D2D2A] bg-white dark:bg-[#1C1C1A] overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-[#E8E6E1] dark:border-[#2D2D2A] bg-[#F5F3EF] dark:bg-[#242422] font-mono text-xs uppercase">
                      <th className="py-3.5 px-6 text-[#6B6B66] dark:text-[#B5B3AD] font-bold">Feature</th>
                      <th className="py-3.5 px-6 bg-[#FDF0EB] dark:bg-[#3A150C]/60 text-[#E05A33] font-bold border-x border-[#F5B8A3]/40 dark:border-[#7D2F1A]">
                        Northstar
                      </th>
                      <th className="py-3.5 px-6 text-[#8C8C87] font-semibold">YouTube Playlists</th>
                      <th className="py-3.5 px-6 text-[#8C8C87] font-semibold">Generic Coaching</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E6E1] dark:divide-[#2D2D2A] font-mono text-xs">
                    <tr className="hover:bg-[#FAFAF7] dark:hover:bg-[#242422]/50 transition-colors">
                      <td className="py-3.5 px-6 font-sans font-semibold text-[#1A1A19] dark:text-[#F5F3EF]">
                        IITM BS Syllabus & Formula Alignment
                      </td>
                      <td className="py-3.5 px-6 bg-[#FDF0EB]/40 dark:bg-[#3A150C]/30 text-[#E05A33] font-bold border-x border-[#F5B8A3]/30 dark:border-[#7D2F1A] flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#2D7A4F]" />
                        <span>Exact Alignment</span>
                      </td>
                      <td className="py-3.5 px-6 text-[#8C8C87] flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-[#C94B3E]" />
                        <span>Fragmented</span>
                      </td>
                      <td className="py-3.5 px-6 text-[#8C8C87] flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-[#D4952B]" />
                        <span>Generic JEE/GATE</span>
                      </td>
                    </tr>

                    <tr className="hover:bg-[#FAFAF7] dark:hover:bg-[#242422]/50 transition-colors">
                      <td className="py-3.5 px-6 font-sans font-semibold text-[#1A1A19] dark:text-[#F5F3EF]">
                        Exam-Pattern Mock Simulations
                      </td>
                      <td className="py-3.5 px-6 bg-[#FDF0EB]/40 dark:bg-[#3A150C]/30 text-[#E05A33] font-bold border-x border-[#F5B8A3]/30 dark:border-[#7D2F1A] flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#2D7A4F]" />
                        <span>TCS iON Pattern</span>
                      </td>
                      <td className="py-3.5 px-6 text-[#8C8C87] flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-[#C94B3E]" />
                        <span>None</span>
                      </td>
                      <td className="py-3.5 px-6 text-[#8C8C87] flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-[#C94B3E]" />
                        <span>Pen & Paper only</span>
                      </td>
                    </tr>

                    <tr className="hover:bg-[#FAFAF7] dark:hover:bg-[#242422]/50 transition-colors">
                      <td className="py-3.5 px-6 font-sans font-semibold text-[#1A1A19] dark:text-[#F5F3EF]">
                        Target Grade Predictor
                      </td>
                      <td className="py-3.5 px-6 bg-[#FDF0EB]/40 dark:bg-[#3A150C]/30 text-[#E05A33] font-bold border-x border-[#F5B8A3]/30 dark:border-[#7D2F1A] flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#2D7A4F]" />
                        <span>Official Formula Engine</span>
                      </td>
                      <td className="py-3.5 px-6 text-[#8C8C87] flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-[#C94B3E]" />
                        <span>None</span>
                      </td>
                      <td className="py-3.5 px-6 text-[#8C8C87] flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-[#C94B3E]" />
                        <span>None</span>
                      </td>
                    </tr>

                    <tr className="hover:bg-[#FAFAF7] dark:hover:bg-[#242422]/50 transition-colors">
                      <td className="py-3.5 px-6 font-sans font-semibold text-[#1A1A19] dark:text-[#F5F3EF]">
                        In-Browser Code Sandbox
                      </td>
                      <td className="py-3.5 px-6 bg-[#FDF0EB]/40 dark:bg-[#3A150C]/30 text-[#E05A33] font-bold border-x border-[#F5B8A3]/30 dark:border-[#7D2F1A] flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#2D7A4F]" />
                        <span>Python, Java, C++</span>
                      </td>
                      <td className="py-3.5 px-6 text-[#8C8C87] flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-[#C94B3E]" />
                        <span>None</span>
                      </td>
                      <td className="py-3.5 px-6 text-[#8C8C87] flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-[#D4952B]" />
                        <span>Local Setup</span>
                      </td>
                    </tr>

                    <tr className="hover:bg-[#FAFAF7] dark:hover:bg-[#242422]/50 transition-colors">
                      <td className="py-3.5 px-6 font-sans font-semibold text-[#1A1A19] dark:text-[#F5F3EF]">
                        1:1 TA Doubt Solving
                      </td>
                      <td className="py-3.5 px-6 bg-[#FDF0EB]/40 dark:bg-[#3A150C]/30 text-[#E05A33] font-bold border-x border-[#F5B8A3]/30 dark:border-[#7D2F1A] flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#2D7A4F]" />
                        <span>&lt; 15 min Turnaround</span>
                      </td>
                      <td className="py-3.5 px-6 text-[#8C8C87] flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-[#C94B3E]" />
                        <span>None</span>
                      </td>
                      <td className="py-3.5 px-6 text-[#8C8C87] flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-[#D4952B]" />
                        <span>Crowded batches</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* Toolkit Hub */}
      <section className="py-20 border-t border-[#E8E6E1] dark:border-[#2D2D2A] bg-white dark:bg-[#161615]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-mono uppercase tracking-wider text-[#E05A33] font-semibold">
              FREE TOOLKIT
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] tracking-tight font-display mt-1">
              Resources & Placement
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CardTilt className="p-6 rounded-2xl bg-[#FAFAF7] dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] hover:border-[#E05A33]/50 transition-all flex flex-col justify-between shadow-xs">
              <div>
                <div className="p-2.5 rounded-xl bg-[#FDF0EB] dark:bg-[#3A150C] border border-[#F5B8A3] dark:border-[#7D2F1A] text-[#E05A33] w-fit">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-[#1A1A19] dark:text-[#F5F3EF] mt-3 font-display">
                  Formula Sheets & PYQs
                </h3>
                <p className="text-xs text-[#8C8C87] mt-1.5">
                  High-yield formulas and past term solved papers.
                </p>
              </div>
              <div className="pt-5">
                <Link
                  href="/resources"
                  className="inline-flex items-center gap-1.5 text-xs text-[#E05A33] hover:text-[#C94A26] font-bold"
                >
                  <span>Browse Library</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </CardTilt>

            <CardTilt className="p-6 rounded-2xl bg-[#FAFAF7] dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] hover:border-[#E05A33]/50 transition-all flex flex-col justify-between shadow-xs">
              <div>
                <div className="p-2.5 rounded-xl bg-[#FDF0EB] dark:bg-[#3A150C] border border-[#F5B8A3] dark:border-[#7D2F1A] text-[#E05A33] w-fit">
                  <Calculator className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-[#1A1A19] dark:text-[#F5F3EF] mt-3 font-display">
                  Grade Predictor
                </h3>
                <p className="text-xs text-[#8C8C87] mt-1.5">
                  Calculate target marks needed in End-Term for S/A grade.
                </p>
              </div>
              <div className="pt-5">
                <Link
                  href="/tools"
                  className="inline-flex items-center gap-1.5 text-xs text-[#E05A33] hover:text-[#C94A26] font-bold"
                >
                  <span>Launch Tool</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </CardTilt>

            <CardTilt className="p-6 rounded-2xl bg-[#FAFAF7] dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] hover:border-[#E05A33]/50 transition-all flex flex-col justify-between shadow-xs">
              <div>
                <div className="p-2.5 rounded-xl bg-[#FDF0EB] dark:bg-[#3A150C] border border-[#F5B8A3] dark:border-[#7D2F1A] text-[#E05A33] w-fit">
                  <Briefcase className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-[#1A1A19] dark:text-[#F5F3EF] mt-3 font-display">
                  Careers & Internships
                </h3>
                <p className="text-xs text-[#8C8C87] mt-1.5">
                  Verified roles from IITM Research Park & alumni networks.
                </p>
              </div>
              <div className="pt-5">
                <Link
                  href="/careers"
                  className="inline-flex items-center gap-1.5 text-xs text-[#E05A33] hover:text-[#C94A26] font-bold"
                >
                  <span>View Openings</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </CardTilt>
          </div>
        </div>
      </section>

      {/* Verified Reviews */}
      <section className="py-20 border-t border-[#E8E6E1] dark:border-[#2D2D2A] bg-[#FAFAF7] dark:bg-[#111110]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-mono uppercase tracking-wider text-[#E05A33] font-semibold">
              REVIEWS
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] tracking-tight font-display mt-1">
              Student Results
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CardTilt className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] shadow-xs">
              <div className="flex items-center gap-1 text-[#D4952B] mb-2.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
              <p className="text-xs text-[#4A4A46] dark:text-[#B5B3AD] leading-relaxed italic">
                "The target calculator showed me I needed 58 in End-Term. After Aryan's live doubt jams, I scored 74 and secured an S grade!"
              </p>
              <div className="mt-4 pt-3.5 border-t border-[#E8E6E1] dark:border-[#2D2D2A] flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#1A1A19] dark:text-[#F5F3EF] text-xs">Rohit M.</div>
                  <div className="text-[10px] text-[#8C8C87] font-mono">IITM BS · CGPA 9.4</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#FDF0EB] dark:bg-[#3A150C] text-[#E05A33] text-[9px] font-mono font-bold">
                  VERIFIED
                </span>
              </div>
            </CardTilt>

            <CardTilt className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] shadow-xs">
              <div className="flex items-center gap-1 text-[#D4952B] mb-2.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
              <p className="text-xs text-[#4A4A46] dark:text-[#B5B3AD] leading-relaxed italic">
                "The proctored mock exams are identical to the actual Sunday test center format. Jumped from 6.9 to 8.8 CGPA!"
              </p>
              <div className="mt-4 pt-3.5 border-t border-[#E8E6E1] dark:border-[#2D2D2A] flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#1A1A19] dark:text-[#F5F3EF] text-xs">Ananya S.</div>
                  <div className="text-[10px] text-[#8C8C87] font-mono">Diploma in DS</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#FDF0EB] dark:bg-[#3A150C] text-[#E05A33] text-[9px] font-mono font-bold">
                  VERIFIED
                </span>
              </div>
            </CardTilt>

            <CardTilt className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] shadow-xs">
              <div className="flex items-center gap-1 text-[#D4952B] mb-2.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
              <p className="text-xs text-[#4A4A46] dark:text-[#B5B3AD] leading-relaxed italic">
                "The in-browser Python IDE with hidden test cases saved me during OPPE preparation. Solved 120 problem sets and cleared easily."
              </p>
              <div className="mt-4 pt-3.5 border-t border-[#E8E6E1] dark:border-[#2D2D2A] flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#1A1A19] dark:text-[#F5F3EF] text-xs">Devansh K.</div>
                  <div className="text-[10px] text-[#8C8C87] font-mono">Diploma in Programming</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#FDF0EB] dark:bg-[#3A150C] text-[#E05A33] text-[9px] font-mono font-bold">
                  VERIFIED
                </span>
              </div>
            </CardTilt>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="py-20 border-t border-[#E8E6E1] dark:border-[#2D2D2A] bg-gradient-to-b from-[#FAFAF7] to-[#F5F3EF] dark:from-[#111110] dark:to-[#161615] text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          <FadeUp>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FDF0EB] dark:bg-[#3A150C] border border-[#F5B8A3] dark:border-[#7D2F1A] text-xs text-[#E05A33] font-mono font-semibold">
              <Trophy className="w-3.5 h-3.5" />
              <span>10,000+ IITM LEARNERS</span>
            </div>
          </FadeUp>

          <FadeUp delay={0.05}>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] tracking-tight font-display">
              Ready to secure an S Grade this term?
            </h2>
          </FadeUp>

          <FadeUp delay={0.1}>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <HoverScale>
                <Link
                  href="/courses"
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-[#E05A33] hover:bg-[#C94A26] text-white font-bold text-sm shadow-sm transition-all"
                >
                  <span>Browse Cohorts</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </HoverScale>
              <HoverScale>
                <Link
                  href="/tools"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] hover:border-[#E05A33]/50 text-[#1A1A19] dark:text-[#F5F3EF] font-bold text-sm transition-all shadow-xs"
                >
                  <Calculator className="w-4 h-4 text-[#E05A33]" />
                  <span>Predict My Grade</span>
                </Link>
              </HoverScale>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* Modern Editorial Footer */}
      <footer className="border-t border-[#E8E6E1] dark:border-[#2D2D2A] bg-[#F5F3EF] dark:bg-[#161615] py-12 text-xs text-[#8C8C87]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-2">
            <Link href="/" className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#E05A33] flex items-center justify-center text-white font-black font-display text-sm">
                n
              </span>
              <span className="font-extrabold text-base tracking-tight text-[#1A1A19] dark:text-[#F5F3EF] font-display">
                northstar<span className="text-[#E05A33]">.</span>
              </span>
            </Link>
            <p className="text-[#8C8C87] text-xs">
              Academic Platform for IIT Madras BS Degree.
            </p>
            <div className="font-mono text-[11px] text-[#8C8C87]">
              © 2026 Northstar Systems.
            </div>
          </div>

          <div>
            <div className="font-mono text-xs uppercase text-[#1A1A19] dark:text-[#F5F3EF] font-bold mb-2.5">Academic Suite</div>
            <ul className="space-y-1.5 text-[#6B6B66] dark:text-[#B5B3AD]">
              <li><Link href="/courses" className="hover:text-[#E05A33] transition-colors">Courses & Batches</Link></li>
              <li><Link href="/resources" className="hover:text-[#E05A33] transition-colors">Resources & PYQs</Link></li>
              <li><Link href="/tools" className="hover:text-[#E05A33] transition-colors">Grade Predictor</Link></li>
              <li><Link href="/careers" className="hover:text-[#E05A33] transition-colors">Careers & Jobs</Link></li>
            </ul>
          </div>

          <div>
            <div className="font-mono text-xs uppercase text-[#1A1A19] dark:text-[#F5F3EF] font-bold mb-2.5">Support</div>
            <ul className="space-y-1.5 text-[#6B6B66] dark:text-[#B5B3AD]">
              <li><Link href="/support" className="hover:text-[#E05A33] transition-colors">Helpdesk & FAQ</Link></li>
              <li><Link href="/one-to-one" className="hover:text-[#E05A33] transition-colors">1:1 Mentorship</Link></li>
              <li><Link href="/live" className="hover:text-[#E05A33] transition-colors">Live Doubt Clinics</Link></li>
              <li><Link href="/refer" className="hover:text-[#E05A33] transition-colors">5% Referral Program</Link></li>
            </ul>
          </div>

          <div>
            <div className="font-mono text-xs uppercase text-[#1A1A19] dark:text-[#F5F3EF] font-bold mb-2.5">Portal</div>
            <ul className="space-y-1.5 text-[#6B6B66] dark:text-[#B5B3AD]">
              <li><Link href="/dashboard" className="hover:text-[#E05A33] transition-colors">Student Dashboard</Link></li>
              <li><Link href="/verify" className="hover:text-[#E05A33] transition-colors">Faculty Credentials</Link></li>
              <li><Link href="/manager" className="hover:text-[#E05A33] transition-colors">Staff Console</Link></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
