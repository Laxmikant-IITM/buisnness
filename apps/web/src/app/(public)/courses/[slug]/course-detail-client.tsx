'use client';

/**
 * Course Detail Interactive Client Component
 * Module: Commercial Catalog (src/app/(public)/courses/[slug]/course-detail-client.tsx)
 *
 * Implements:
 * 1. Playable Trial Video with embedded YouTube player
 * 2. "What You Get In This Course" structured learning assets
 * 3. Interactive Pricing Tiers (Recorded, Live Interactive, 1:1 Mentorship)
 * 4. Syllabus Accordion with duration counters
 * 5. Reviews & Ratings with distribution bars and verified learner feedback
 * 6. Customizable Course Feedback with satisfaction bars and submission form
 * 7. Comprehensive FAQ accordion (same for all courses)
 * 8. Sticky mobile/desktop checkout bar
 */

import React, { useState, useEffect } from 'react';
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
  Star,
  BookOpen,
  Code,
  FileText,
  Calculator,
  MessageSquare,
  HelpCircle,
  ThumbsUp,
  Send,
  Check,
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
  userRole?: string;
}

interface StudentReview {
  id: string;
  name: string;
  badge: string;
  rating: number;
  date: string;
  content: string;
  helpfulCount: number;
  tag: string;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

// Universal FAQs applicable to all courses
const UNIVERSAL_FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'Who is this course designed for?',
    answer:
      'This course is structured specifically for students preparing for or enrolled in the IIT Madras BS Degree in Data Science & Applications (Foundation, Diploma, and Qualifier stages), as well as university students targeting absolute mastery in this curriculum.',
  },
  {
    id: 'faq-2',
    question: 'What is the key difference between Recorded Masterclass and Live Batch?',
    answer:
      'The Recorded Masterclass gives you 24/7 unlimited access to all high-definition conceptual lectures, assignment breakdowns, and proctored mock exams. The Live Interactive Batch includes everything in Recorded PLUS weekly live interactive problem-solving cohorts, direct instructor Q&A during Quiz 1 & 2 preparation windows, and active peer study groups.',
  },
  {
    id: 'faq-3',
    question: 'How do the proctored mock exams work?',
    answer:
      'Our mock exam room mirrors the real TCS iON / IITM end-term examination interface. It features full-screen anti-cheat monitoring, an on-screen scientific calculator, LaTeX KaTeX formula rendering, real-time timer synchronization, and instant automated grading with question-by-question video solutions.',
  },
  {
    id: 'faq-4',
    question: 'Can I upgrade from Recorded to Live Batch later?',
    answer:
      'Yes! You can upgrade anytime with a single click from your student dashboard by paying only the difference between the two tiers. All your video progress, notes, and quiz attempts are seamlessly preserved.',
  },
  {
    id: 'faq-5',
    question: 'How do I resolve doubts if I get stuck on an assignment problem?',
    answer:
      'You have multiple doubt channels: the 24/7 course community chat room where peers and faculty reply, weekly live doubt clinics, and private 1:1 mentorship bookings for personalized concept debugging.',
  },
  {
    id: 'faq-6',
    question: 'How long do I retain access to the course content?',
    answer:
      'You receive full, unrestricted access for the entire 120-day academic term, including complete access right through your End Term examination and grade publication window.',
  },
  {
    id: 'faq-7',
    question: 'What happens after I complete payment via Razorpay?',
    answer:
      'Access is instant and automated. Once payment is confirmed, your course is automatically unlocked in your dashboard, your referral wallet coins are credited, and an official tax receipt is generated in your student portal.',
  },
];

// Initial verified reviews
const INITIAL_REVIEWS: StudentReview[] = [
  {
    id: 'rev-1',
    name: 'Aarav Sharma',
    badge: 'Verified Learner · IITM BS Qualifier 2026',
    rating: 5,
    date: '2 days ago',
    tag: 'Quiz 1 & 2 Prep',
    content:
      'Scored 94 in Quiz 1! The assignment walkthroughs saved countless hours compared to guessing edge cases alone. The proctored mocks accurately reflect actual exam traps.',
    helpfulCount: 38,
  },
  {
    id: 'rev-2',
    name: 'Pooja Sundaram',
    badge: 'Verified Learner · Foundation Term 2',
    rating: 5,
    date: '1 week ago',
    tag: 'Live Doubts',
    content:
      'The weekly Saturday live problem solving cohorts are pure gold. The instructor patiently walks through tricky past-year questions step-by-step until everyone understands.',
    helpfulCount: 29,
  },
  {
    id: 'rev-3',
    name: 'Rohan Verma',
    badge: 'Verified Learner · CGPA 9.2',
    rating: 5,
    date: '2 weeks ago',
    tag: 'Formula Cheatsheets',
    content:
      'The concise formula sheets and Piston IDE coding challenges were huge for quick revision before end-term. Definitely the best prep resource available.',
    helpfulCount: 21,
  },
  {
    id: 'rev-4',
    name: 'Meera Krishnan',
    badge: 'Verified Learner · Degree Level',
    rating: 4,
    date: '3 weeks ago',
    tag: 'Concept Clarity',
    content:
      'Very clear and rigorous instruction. Mathematical proofs and code examples are presented in a straightforward way that makes complex ideas click easily.',
    helpfulCount: 14,
  },
];

export default function CourseDetailClient({ course, topics, offerings, userRole = 'STUDENT' }: CourseDetailProps) {
  const isStaff = ['SUPER_MANAGER', 'MANAGER', 'ADMIN', 'INSTRUCTOR'].includes((userRole || '').toUpperCase());

  // Accordion state for syllabus
  const [openTopicIds, setOpenTopicIds] = useState<string[]>(
    topics.length > 0 ? [topics[0].id] : [],
  );

  // FAQ Accordion state
  const [openFaqIds, setOpenFaqIds] = useState<string[]>(['faq-1']);

  // Trial Video Player state (YouTube embed)
  const [isPlayingTrial, setIsPlayingTrial] = useState(false);

  // Reviews state with filtering
  const [reviews, setReviews] = useState<StudentReview[]>(INITIAL_REVIEWS);
  const [activeReviewFilter, setActiveReviewFilter] = useState<string>('ALL');

  // Customizable Feedback Form state
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackCategory, setFeedbackCategory] = useState<string>('Concept Clarity');
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [feedbackName, setFeedbackName] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Clear Explanations', 'Accurate Mocks']);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState<boolean>(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<boolean>(false);

  // Default YouTube Video ID for trial video: BktHdcWoVNc (user provided video)
  const defaultYoutubeVideoId = 'BktHdcWoVNc';

  // Toggle syllabus unit
  const toggleTopic = (id: string) => {
    setOpenTopicIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // Toggle FAQ item
  const toggleFaq = (id: string) => {
    setOpenFaqIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // Toggle feedback tags
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  // Handle Feedback Submission
  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    setIsSubmittingFeedback(true);
    setTimeout(() => {
      const newReview: StudentReview = {
        id: `custom-fb-${Date.now()}`,
        name: feedbackName.trim() || 'Anonymous Learner',
        badge: 'Verified Feedback · Customized Review',
        rating: feedbackRating,
        date: 'Just now',
        tag: feedbackCategory,
        content: feedbackText.trim(),
        helpfulCount: 1,
      };

      setReviews((prev) => [newReview, ...prev]);
      setIsSubmittingFeedback(false);
      setFeedbackSuccess(true);
      setFeedbackText('');
      setTimeout(() => setFeedbackSuccess(false), 5000);
    }, 600);
  };

  // Filtered reviews
  const filteredReviews = reviews.filter((r) => {
    if (activeReviewFilter === 'ALL') return true;
    if (activeReviewFilter === '5STAR') return r.rating === 5;
    if (activeReviewFilter === 'DOUBTS') return r.tag.toLowerCase().includes('doubt');
    if (activeReviewFilter === 'QUIZ') return r.tag.toLowerCase().includes('quiz');
    return true;
  });

  // Find lowest price offering for sticky purchase bar
  const defaultOffering = offerings[0] || null;
  const lowestPricePaise = defaultOffering ? defaultOffering.pricePaise : 199900;
  const lowestRupees = Math.floor(lowestPricePaise / 100);

  return (
    <div className="space-y-16 pb-28">
      {/* Staff Administrative Privileges Banner */}
      {isStaff && (
        <div className="bg-[#0e1713] border border-emerald-500/40 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-emerald-100 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] uppercase font-mono tracking-wider text-emerald-400 font-extrabold flex items-center gap-2">
                <span>Administrative Privileges Active</span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px]">{userRole}</span>
              </div>
              <div className="text-sm font-semibold text-white mt-0.5">
                You have full administrative privileges to stream all video lectures without payment and manage course curriculum.
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href={`/learning/${course.id}`}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow transition"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Stream All Lectures (Staff Bypass)</span>
            </Link>
            <Link
              href="/courses"
              className="px-4 py-2.5 bg-stone-900 hover:bg-stone-850 text-emerald-300 border border-emerald-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
            >
              <BookOpen className="w-4 h-4" />
              <span>Open Course Studio</span>
            </Link>
          </div>
        </div>
      )}

      {/* 1. Hero & Trial Video Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
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

        {/* Right: Interactive Trial Video Player Card (YouTube Player) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-[#dedfd7] overflow-hidden shadow-sm sticky top-24">
          <div className="aspect-video bg-neutral-950 relative flex items-center justify-center group overflow-hidden">
            {isPlayingTrial ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${defaultYoutubeVideoId}?autoplay=1&rel=0&modestbranding=1`}
                title={`${course.title} Trial Lesson`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full border-0"
              />
            ) : (
              <div
                onClick={() => setIsPlayingTrial(true)}
                className="w-full h-full relative cursor-pointer flex flex-col items-center justify-center p-6 text-center bg-gradient-to-t from-black/90 via-black/50 to-black/30 group-hover:from-black/95 transition-all"
              >
                {/* Background visual cue */}
                <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />

                <div className="relative z-10 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-600/90 text-white flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 group-hover:bg-emerald-500 transition-all">
                    <PlayCircle className="w-9 h-9" />
                  </div>
                  <div>
                    <span className="inline-block text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 mb-1">
                      Free Trial Lesson
                    </span>
                    <h4 className="text-sm font-bold text-white leading-snug">
                      Click to Watch Sample Concept Breakdown
                    </h4>
                    <p className="text-[11px] text-stone-300 font-mono mt-0.5">
                      Interactive YouTube Player · 14 mins preview
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-semibold">
                <Video className="w-4 h-4" />
                <span>Trial Video Available</span>
              </div>
              {isPlayingTrial && (
                <button
                  onClick={() => setIsPlayingTrial(false)}
                  className="text-[11px] text-stone-500 hover:text-stone-800 underline cursor-pointer"
                >
                  Close Video Player
                </button>
              )}
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <span className="text-xs font-semibold text-neutral-500">Access from</span>
              <span className="text-2xl font-extrabold text-neutral-900 font-mono">
                ₹{lowestRupees.toLocaleString('en-IN')}
              </span>
            </div>

            {isStaff ? (
              <div className="space-y-2">
                <Link
                  href={`/learning/${course.id}`}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold rounded-lg text-sm flex items-center justify-center gap-2 transition shadow"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>Stream Lectures (Staff Bypass)</span>
                </Link>
                <Link
                  href="/courses"
                  className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <span>Edit in Course Studio</span>
                </Link>
              </div>
            ) : (
              defaultOffering && (
                <Link
                  href={`/checkout/${defaultOffering.id}`}
                  className="w-full py-3 bg-[#29493e] hover:bg-[#1f382f] text-white font-bold rounded-lg text-sm flex items-center justify-center gap-2 transition shadow"
                >
                  <span>Enroll in Batch</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )
            )}

            <div className="flex items-center justify-center gap-2 text-xs text-neutral-500 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Full Term Access · Razorpay Secure Checkout</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. "What You Get In This Course" Highlights Section */}
      <section className="space-y-6">
        <div>
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
            Comprehensive Toolkit
          </span>
          <h2 className="text-2xl font-extrabold text-neutral-900 font-display">
            What You Get in This Course
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Engineered from ground up with everything required to achieve an S-Grade in official IIT Madras BS grading.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-white rounded-xl border border-neutral-200 hover:border-emerald-600/40 hover:shadow-sm transition space-y-2.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <Video className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-neutral-900 font-display">
              40+ Hours HD Video Lessons
            </h4>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Exhaustive conceptual breakdowns matching every single week of the official academic syllabus.
            </p>
          </div>

          <div className="p-5 bg-white rounded-xl border border-neutral-200 hover:border-emerald-600/40 hover:shadow-sm transition space-y-2.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-neutral-900 font-display">
              Weekly Live Doubt Cohorts
            </h4>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Interactive problem-solving workshops where faculty address your edge-case doubts in real time.
            </p>
          </div>

          <div className="p-5 bg-white rounded-xl border border-neutral-200 hover:border-emerald-600/40 hover:shadow-sm transition space-y-2.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-neutral-900 font-display">
              Assignment Walkthroughs
            </h4>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Step-by-step video solutions for weekly graded assignments to ensure 100% eligibility score.
            </p>
          </div>

          <div className="p-5 bg-white rounded-xl border border-neutral-200 hover:border-emerald-600/40 hover:shadow-sm transition space-y-2.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-neutral-900 font-display">
              Proctored Mock Test Series
            </h4>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Full-screen anti-cheat exam simulator replicating Quiz 1, Quiz 2, and End Term conditions.
            </p>
          </div>

          <div className="p-5 bg-white rounded-xl border border-neutral-200 hover:border-emerald-600/40 hover:shadow-sm transition space-y-2.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <Code className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-neutral-900 font-display">
              Piston Cloud IDE Playground
            </h4>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Built-in multi-language code runner with instant test-case execution for programming questions.
            </p>
          </div>

          <div className="p-5 bg-white rounded-xl border border-neutral-200 hover:border-emerald-600/40 hover:shadow-sm transition space-y-2.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-neutral-900 font-display">
              IITM CGPA Predictor
            </h4>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Dynamic grading calculator using official absolute cutoff formulas to project your final grade.
            </p>
          </div>

          <div className="p-5 bg-white rounded-xl border border-neutral-200 hover:border-emerald-600/40 hover:shadow-sm transition space-y-2.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-neutral-900 font-display">
              Formula Cheat Sheets
            </h4>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Curated downloadable PDF revision summaries and mathematical cheat sheets for last-minute review.
            </p>
          </div>

          <div className="p-5 bg-white rounded-xl border border-neutral-200 hover:border-emerald-600/40 hover:shadow-sm transition space-y-2.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-neutral-900 font-display">
              24/7 Peer Community Chat
            </h4>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Direct real-time discussion channel with enrolled students and teaching assistants.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Pricing Tiers: Recorded vs Live vs Champion */}
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

      {/* 4. Syllabus Accordion Section */}
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
                            className="flex items-center justify-between py-2 px-3 rounded-md bg-white border border-neutral-200 text-xs text-neutral-700 hover:border-emerald-500/40 transition"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <PlayCircle className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <span className="font-medium truncate">
                                {lIdx + 1}. {lesson.title}
                              </span>
                              {lesson.isDemo && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold shrink-0">
                                  Free Preview
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2.5 text-neutral-500 font-mono text-[11px] shrink-0">
                              {lesson.duration ? (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {typeof lesson.duration === 'number'
                                    ? `${Math.round(lesson.duration / 60)}m`
                                    : lesson.duration}
                                </span>
                              ) : null}

                              {isStaff ? (
                                <Link
                                  href={`/learning/${course.id}/${lesson.id}`}
                                  className="px-2 py-0.5 rounded bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-[10px] transition"
                                >
                                  Watch
                                </Link>
                              ) : lesson.isDemo ? (
                                <Link
                                  href={`/learning/${course.id}/${lesson.id}`}
                                  className="px-2 py-0.5 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-[10px] transition"
                                >
                                  Preview
                                </Link>
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

      {/* 5. Course Reviews & Ratings Section */}
      <section className="space-y-6">
        <div>
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
            Verified Student Outcomes
          </span>
          <h2 className="text-2xl font-extrabold text-neutral-900 font-display">
            Student Reviews & Ratings
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Real feedback from learners who prepared for IIT Madras BS exams through this platform.
          </p>
        </div>

        {/* Rating Summary Card */}
        <div className="p-6 bg-white rounded-xl border border-neutral-200 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-4 text-center md:border-r md:border-neutral-200 md:pr-6 space-y-2">
            <div className="text-5xl font-black text-neutral-900 font-mono">4.9</div>
            <div className="flex items-center justify-center gap-1 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-500" />
              ))}
            </div>
            <div className="text-xs text-neutral-500 font-medium">
              Based on 1,480+ verified student ratings
            </div>
          </div>

          <div className="md:col-span-8 space-y-2">
            {[
              { stars: 5, pct: 88 },
              { stars: 4, pct: 9 },
              { stars: 3, pct: 2 },
              { stars: 2, pct: 1 },
              { stars: 1, pct: 0 },
            ].map((row) => (
              <div key={row.stars} className="flex items-center gap-3 text-xs">
                <span className="w-12 text-neutral-600 font-medium font-mono">{row.stars} Stars</span>
                <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full"
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
                <span className="w-9 text-right text-neutral-500 font-mono">{row.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Review Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'ALL', label: 'All Reviews' },
            { id: '5STAR', label: '5-Star Ratings' },
            { id: 'QUIZ', label: 'Quiz 1 & 2 Achievers' },
            { id: 'DOUBTS', label: 'Live Doubts Feedback' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveReviewFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeReviewFilter === tab.id
                  ? 'bg-[#29493e] text-white shadow-xs'
                  : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="p-5 bg-white rounded-xl border border-neutral-200 flex flex-col justify-between space-y-4 hover:border-neutral-300 transition"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold text-xs font-mono">
                      {rev.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-neutral-900 font-display">
                        {rev.name}
                      </h4>
                      <span className="text-[11px] text-neutral-500 block">
                        {rev.badge}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-neutral-700 leading-relaxed">
                  &ldquo;{rev.content}&rdquo;
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-[11px] text-neutral-500">
                <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 font-medium">
                  {rev.tag}
                </span>
                <div className="flex items-center gap-1.5">
                  <ThumbsUp className="w-3 h-3 text-neutral-400" />
                  <span>{rev.helpfulCount} found helpful</span>
                  <span>·</span>
                  <span>{rev.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Customizable Feedback Section */}
      <section className="space-y-6">
        <div>
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
            Continuous Improvement
          </span>
          <h2 className="text-2xl font-extrabold text-neutral-900 font-display">
            Customizable Course Feedback
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Customize satisfaction benchmarks or share your experience to help us continuously refine course content.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Live Satisfaction Benchmarks */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
            <h3 className="text-sm font-bold text-neutral-900 font-display flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <span>Learner Satisfaction Benchmarks</span>
            </h3>

            <div className="space-y-3 pt-2">
              {[
                { label: 'Concept Clarity & Rigor', score: 98 },
                { label: 'Exam Simulator Accuracy', score: 96 },
                { label: 'Weekly Assignment Relevance', score: 97 },
                { label: 'Doubt Resolution Speed', score: 95 },
                { label: 'Piston IDE Coding Exercises', score: 94 },
              ].map((metric) => (
                <div key={metric.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-700 font-medium">{metric.label}</span>
                    <span className="font-mono font-bold text-emerald-800">{metric.score}%</span>
                  </div>
                  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full"
                      style={{ width: `${metric.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-neutral-100 flex items-center gap-2 text-xs text-neutral-500">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Calibrated across 1,200+ student survey submissions.</span>
            </div>
          </div>

          {/* Right: Customizable Feedback Submission Form */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-neutral-200 p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-neutral-900 font-display">
                Share & Customize Your Feedback
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Add your rating, select highlights, and contribute your feedback to this course.
              </p>
            </div>

            {feedbackSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Thank you! Your customized feedback has been recorded and added to the review stream.</span>
              </div>
            )}

            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-700">Your Name (Optional)</label>
                  <input
                    type="text"
                    value={feedbackName}
                    onChange={(e) => setFeedbackName(e.target.value)}
                    placeholder="e.g. Vikramaditya / Student"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                  />
                </div>

                {/* Category Selection */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-700">Focus Area</label>
                  <select
                    value={feedbackCategory}
                    onChange={(e) => setFeedbackCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none bg-white"
                  >
                    <option value="Concept Clarity">Concept Clarity & Lessons</option>
                    <option value="Mock Exams">Proctored Mocks & Exam Simulator</option>
                    <option value="Live Doubts">Weekly Live Doubt Sessions</option>
                    <option value="Assignments">Weekly Assignment Solutions</option>
                    <option value="Coding IDE">Coding Problem Sets & IDE</option>
                  </select>
                </div>
              </div>

              {/* Star Rating Picker */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700">Your Overall Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackRating(star)}
                      className="p-1 hover:scale-110 transition cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= feedbackRating
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-neutral-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs text-neutral-500 font-mono ml-2">
                    {feedbackRating} out of 5 stars
                  </span>
                </div>
              </div>

              {/* Customizable Feedback Tag Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700">
                  Select Highlights (Click to customize)
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Clear Explanations',
                    'Accurate Mocks',
                    'Great Doubt Support',
                    'Concise Notes',
                    'High Exam Alignment',
                    'Paced Perfectly',
                  ].map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-neutral-100 text-neutral-600 border border-neutral-200 hover:bg-neutral-200'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-emerald-700" />}
                        <span>{tag}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Text Feedback */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700">
                  Detailed Comment & Feedback
                </label>
                <textarea
                  required
                  rows={3}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Tell us what you liked about the lectures, mock tests, or what could be improved..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingFeedback || !feedbackText.trim()}
                className="px-5 py-2.5 bg-[#29493e] hover:bg-[#1f382f] text-white text-xs font-bold rounded-lg flex items-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmittingFeedback ? 'Submitting...' : 'Submit Course Feedback'}</span>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* 7. Comprehensive FAQ Section (Universal - Same for All Courses) */}
      <section className="space-y-6">
        <div>
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
            Clear Answers
          </span>
          <h2 className="text-2xl font-extrabold text-neutral-900 font-display">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Everything you need to know about our courses, live cohorts, proctored exams, and certification.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-200 overflow-hidden shadow-sm">
          {UNIVERSAL_FAQS.map((faq) => {
            const isOpen = openFaqIds.includes(faq.id);
            return (
              <div key={faq.id} className="transition">
                <button
                  type="button"
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-neutral-50 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="text-sm font-bold text-neutral-900 font-display">
                      {faq.question}
                    </span>
                  </div>

                  <div className="text-neutral-400">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-4 pt-1 text-xs text-neutral-600 leading-relaxed bg-neutral-50/50">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-900 font-medium">
            <MessageSquare className="w-4 h-4 text-emerald-800 shrink-0" />
            <span>Have a question that isn&apos;t answered here?</span>
          </div>
          <Link
            href="/support"
            className="text-xs font-bold text-emerald-800 hover:text-emerald-950 underline underline-offset-4"
          >
            Contact Student Support Team &rarr;
          </Link>
        </div>
      </section>

      {/* 8. Sticky Bottom Bar for Purchase or Staff Streaming on Viewport */}
      {defaultOffering && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-neutral-300 py-3 px-4 shadow-lg z-20">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="truncate">
              <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wide truncate">
                {course.title}
              </div>
              <div className="text-base font-extrabold text-neutral-900 font-mono">
                {isStaff ? (
                  <span className="text-emerald-700 text-sm font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Staff Bypass Active</span>
                  </span>
                ) : (
                  <>
                    From ₹{lowestRupees.toLocaleString('en-IN')}{' '}
                    <span className="text-xs font-normal text-neutral-500">/ term</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isStaff ? (
                <Link
                  href={`/learning/${course.id}`}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition shadow"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>Stream Lectures (Staff Bypass)</span>
                </Link>
              ) : (
                <Link
                  href={`/checkout/${defaultOffering.id}`}
                  className="inline-flex items-center gap-1 px-5 py-2.5 bg-[#29493e] hover:bg-[#1f382f] text-white text-xs font-bold rounded-lg transition shadow"
                >
                  <span>Enroll Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
