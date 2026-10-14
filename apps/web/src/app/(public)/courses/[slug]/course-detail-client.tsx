'use client';

/**
 * Course Detail Interactive Client Component
 * Module: Commercial Catalog (src/app/(public)/courses/[slug]/course-detail-client.tsx)
 *
 * Implements interactive syllabus accordions, tier selection, video preview toggling,
 * and a sticky mobile checkout bar.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  ChevronUp,
  PlayCircle,
  Clock,
  CheckCircle2,
  Video,
  Users,
  Award,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export interface DetailTopic {
  id: string;
  title: string;
  order: number;
  lessons: {
    id: string;
    title: string;
    duration: string | number | null;
    order: number;
    isDemo?: boolean;
  }[];
}

export interface DetailOffering {
  id: string;
  name: string;
  accessType: string;
  pricePaise: number;
  durationDays: number | null;
}

export interface CourseDetailProps {
  course: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    subject: string | null;
    teacherName: string | null;
    courseCategory: string | null;
    term: string | null;
    examStages: string[];
    videoUrl: string | null;
    tags: string[];
    liveUpgradePrice: number | null;
  };
  topics: DetailTopic[];
  offerings: DetailOffering[];
}

export default function CourseDetailClient({ course, topics, offerings }: CourseDetailProps) {
  // Accordion state: open topic IDs
  const [openTopicIds, setOpenTopicIds] = useState<string[]>(
    topics.length > 0 ? [topics[0].id] : [],
  );

  const toggleTopic = (id: string) => {
    setOpenTopicIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // Find lowest price offering for sticky purchase bar
  const defaultOffering = offerings[0] || null;
  const lowestPricePaise = defaultOffering ? defaultOffering.pricePaise : 199900;
  const lowestRupees = Math.floor(lowestPricePaise / 100);

  return (
    <div className="space-y-12 pb-24">
      {/* Hero & Video Preview Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Metadata & Pitch */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-200">
              {course.subject || 'IIT Madras BS'}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-100 text-neutral-700">
              {course.term || 'Foundation Level'}
            </span>
            {course.examStages.map((stage) => (
              <span
                key={stage}
                className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-200 text-neutral-800"
              >
                {stage}
              </span>
            ))}
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#202824] tracking-tight font-display leading-tight">
            {course.title}
          </h1>

          <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
            {course.description ||
              'A complete pedagogical masterclass built specifically to reverse-engineer top grading percentiles with structured lectures, quiz simulations, and live doubt resolution.'}
          </p>

          {course.teacherName && (
            <div className="flex items-center gap-3 pt-2">
              <div className="w-10 h-10 rounded-full bg-[#29493e] text-[#b8e06a] flex items-center justify-center font-bold text-sm">
                {course.teacherName.charAt(0)}
              </div>
              <div>
                <div className="text-xs text-neutral-500 font-medium">Course Instructor</div>
                <div className="text-sm font-bold text-neutral-900">{course.teacherName}</div>
              </div>
            </div>
          )}

          {/* Key Metric Highlights */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-neutral-200">
            <div className="p-3 bg-white rounded-lg border border-neutral-200">
              <div className="text-xs text-neutral-500">Modules</div>
              <div className="text-lg font-bold text-neutral-900 font-mono">
                {topics.length} Units
              </div>
            </div>
            <div className="p-3 bg-white rounded-lg border border-neutral-200">
              <div className="text-xs text-neutral-500">Total Lessons</div>
              <div className="text-lg font-bold text-neutral-900 font-mono">
                {topics.reduce((acc, t) => acc + t.lessons.length, 0)} Lectures
              </div>
            </div>
            <div className="p-3 bg-white rounded-lg border border-neutral-200">
              <div className="text-xs text-neutral-500">Format</div>
              <div className="text-lg font-bold text-emerald-800">
                {course.courseCategory === 'LIVE' ? 'Live + Recorded' : 'Recorded'}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Preview Player Card */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-[#dedfd7] overflow-hidden shadow-sm sticky top-24">
          <div className="aspect-video bg-neutral-900 relative flex items-center justify-center group cursor-pointer overflow-hidden">
            {course.videoUrl ? (
              <video
                src={course.videoUrl}
                controls
                className="w-full h-full object-cover"
                poster="/preview-poster.jpg"
              />
            ) : (
              <div className="text-center p-6 space-y-3">
                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white flex items-center justify-center mx-auto group-hover:scale-110 transition">
                  <PlayCircle className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="text-xs font-semibold text-white/90">
                  Watch Syllabus & Exam Overview Preview
                </div>
                <span className="inline-block text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Sample Concept Breakdown
                </span>
              </div>
            )}
          </div>

          <div className="p-5 space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-semibold text-neutral-500">Access from</span>
              <span className="text-2xl font-extrabold text-neutral-900 font-mono">
                ₹{lowestRupees.toLocaleString('en-IN')}
              </span>
            </div>

            {defaultOffering && (
              <Link
                href={`/checkout/${defaultOffering.id}`}
                className="w-full py-3 bg-[#29493e] hover:bg-[#1f382f] text-white font-bold rounded-lg text-sm flex items-center justify-center gap-2 transition shadow"
              >
                <span>Enroll in Batch</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}

            <div className="flex items-center justify-center gap-2 text-xs text-neutral-500 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Full Term Access · Razorpay Secure Checkout</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Tiers: Recorded vs Live vs Champion */}
      <section className="space-y-6">
        <div>
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
            Flexible Plans
          </span>
          <h2 className="text-2xl font-extrabold text-neutral-900 font-display">
            Select Your Preparation Batch
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Every plan includes complete assignment walkthroughs and mock quiz portals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Tier 1: Recorded Plan */}
          {(() => {
            const recordedOff =
              offerings.find((o) => o.accessType === 'RECORDED') || offerings[0];
            const price = recordedOff ? Math.floor(recordedOff.pricePaise / 100) : 1999;
            return (
              <div className="bg-white rounded-xl border border-neutral-200 p-6 flex flex-col justify-between hover:border-neutral-300 transition shadow-sm">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                      Standard
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 font-semibold">
                      Self-Paced
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 font-display">
                    Recorded Masterclass
                  </h3>
                  <div className="text-3xl font-extrabold text-neutral-900 font-mono">
                    ₹{price.toLocaleString('en-IN')}
                    <span className="text-xs text-neutral-500 font-normal"> / term</span>
                  </div>
                  <ul className="text-xs space-y-2.5 text-neutral-600 pt-2 border-t border-neutral-100">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                      <span>Full syllabus high-definition video lessons</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                      <span>Assignment problem-by-problem solutions</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                      <span>Downloadable formula sheets & revision notes</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                      <span>End Term mock test series access</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-6">
                  {recordedOff && (
                    <Link
                      href={`/checkout/${recordedOff.id}`}
                      className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold rounded-lg text-xs flex items-center justify-center transition"
                    >
                      Enroll in Recorded
                    </Link>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Tier 2: Live Interactive Batch (Recommended) */}
          {(() => {
            const liveOff =
              offerings.find((o) => o.accessType === 'LIVE') || offerings[1] || offerings[0];
            const price = liveOff ? Math.floor(liveOff.pricePaise / 100) : 3499;
            return (
              <div className="bg-white rounded-xl border-2 border-emerald-700 p-6 flex flex-col justify-between shadow-md relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-800 text-white text-[11px] font-bold tracking-wide uppercase shadow">
                  Most Popular
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                      Interactive Cohort
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold">
                      Live Doubts
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 font-display">
                    Live Problem-Solving Batch
                  </h3>
                  <div className="text-3xl font-extrabold text-emerald-950 font-mono">
                    ₹{price.toLocaleString('en-IN')}
                    <span className="text-xs text-neutral-500 font-normal"> / term</span>
                  </div>
                  <ul className="text-xs space-y-2.5 text-neutral-700 pt-2 border-t border-neutral-100">
                    <li className="flex items-center gap-2 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                      <span>Everything included in Recorded Masterclass</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                      <span>Weekly Live Interactive Zoom doubt sessions</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                      <span>Dedicated Discord / WhatsApp cohort discussion group</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                      <span>Direct mentor Q&A during Quiz 1 & Quiz 2 windows</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-6">
                  {liveOff && (
                    <Link
                      href={`/checkout/${liveOff.id}`}
                      className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-lg text-xs flex items-center justify-center transition shadow-sm"
                    >
                      Enroll in Live Batch
                    </Link>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Tier 3: Champion Plan (1:1 Mentorship) */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6 flex flex-col justify-between hover:border-neutral-300 transition shadow-sm">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
                  Elite Prep
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-900 font-semibold">
                  Personal Mentor
                </span>
              </div>
              <h3 className="text-xl font-bold text-neutral-900 font-display">
                Champion 1-on-1 Mentorship
              </h3>
              <div className="text-3xl font-extrabold text-neutral-900 font-mono">
                ₹5,999
                <span className="text-xs text-neutral-500 font-normal"> / term</span>
              </div>
              <ul className="text-xs space-y-2.5 text-neutral-600 pt-2 border-t border-neutral-100">
                <li className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-purple-700 flex-shrink-0" />
                  <span>Includes all Live Batch & Recorded access</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-700 flex-shrink-0" />
                  <span>3 private 1:1 tutoring sessions with top rankers</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-700 flex-shrink-0" />
                  <span>Individualized CGPA & Quiz target planning</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-700 flex-shrink-0" />
                  <span>Code review & assignments debugging support</span>
                </li>
              </ul>
            </div>

            <div className="pt-6">
              <Link
                href="/one-to-one"
                className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold rounded-lg text-xs flex items-center justify-center transition"
              >
                Book 1:1 Consultation
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Syllabus Accordion Section */}
      <section className="space-y-4">
        <div>
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
            Curriculum
          </span>
          <h2 className="text-2xl font-extrabold text-neutral-900 font-display">
            Course Syllabus Breakdown
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Structured week-by-week curriculum covering official IIT Madras learning objectives.
          </p>
        </div>

        {topics.length === 0 ? (
          <div className="p-6 bg-white rounded-xl border border-neutral-200 text-center text-xs text-neutral-500">
            Syllabus units are being finalized for this academic cycle.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-200 overflow-hidden shadow-sm">
            {topics.map((topic, index) => {
              const isOpen = openTopicIds.includes(topic.id);
              return (
                <div key={topic.id} className="transition">
                  <button
                    onClick={() => toggleTopic(topic.id)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-neutral-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-neutral-100 text-neutral-700 font-mono text-xs flex items-center justify-center font-bold">
                        {index + 1}
                      </span>
                      <span className="text-sm font-bold text-neutral-900 font-display">
                        {topic.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-xs text-neutral-500">
                        {topic.lessons.length} {topic.lessons.length === 1 ? 'lesson' : 'lessons'}
                      </span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-neutral-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-neutral-400" />
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-4 pt-1 space-y-2 bg-neutral-50/50">
                      {topic.lessons.length === 0 ? (
                        <p className="text-xs text-neutral-400 italic">No lectures attached.</p>
                      ) : (
                        topic.lessons.map((lesson, lIdx) => (
                          <div
                            key={lesson.id}
                            className="flex items-center justify-between py-2 px-3 rounded-md bg-white border border-neutral-200 text-xs text-neutral-700"
                          >
                            <div className="flex items-center gap-2">
                              <PlayCircle className="w-3.5 h-3.5 text-emerald-700" />
                              <span className="font-medium">
                                {lIdx + 1}. {lesson.title}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-neutral-500 font-mono text-[11px]">
                              {lesson.duration ? (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {typeof lesson.duration === 'number'
                                    ? `${Math.round(lesson.duration / 60)}m`
                                    : lesson.duration}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Sticky Bottom Bar for Purchase on Viewport */}
      {defaultOffering && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-neutral-300 py-3 px-4 shadow-lg z-20">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="truncate">
              <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide truncate">
                {course.title}
              </div>
              <div className="text-base font-extrabold text-neutral-900 font-mono">
                From ₹{lowestRupees.toLocaleString('en-IN')}{' '}
                <span className="text-xs font-normal text-neutral-500">/ term</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={`/checkout/${defaultOffering.id}`}
                className="inline-flex items-center gap-1 px-5 py-2.5 bg-[#29493e] hover:bg-[#1f382f] text-white text-xs font-bold rounded-lg transition shadow"
              >
                <span>Enroll Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
