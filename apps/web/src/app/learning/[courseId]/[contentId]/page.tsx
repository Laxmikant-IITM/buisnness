/**
 * @file apps/web/src/app/learning/[courseId]/[contentId]/page.tsx
 * @description State-of-the-art Video Lecture Theater & Course Learning Room.
 *
 * Provides:
 * - Dual-source Video Player: Google Drive (`1ie1Brid4MmkYYPDQX6zT35Z3aEgf6jxq`) & YouTube (`BktHdcWoVNc`).
 * - Seamless source toggle between Google Drive & YouTube.
 * - Interactive module curriculum syllabus with progress indicators.
 * - Previous/Next lesson navigation with automatic completion sync.
 * - Modern dark SaaS theater aesthetic (Linear/Vercel-inspired).
 */

import React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { canAccessCourse, canAccessCourseContent, getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import LectureVideoPlayer from '@/features/learning/video-player/LectureVideoPlayer';
import {
  ChevronLeft,
  ChevronRight,
  PlayCircle,
  CheckCircle2,
  BookOpen,
  ArrowLeft,
  Video,
  FileText,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

interface DemoContent {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string | null;
  youtubeUrl: string | null;
  videoSource: string;
  duration: string | null;
  topicTitle: string;
  topicId: string;
}

interface DemoCourseData {
  id: string;
  title: string;
  slug: string;
  topics: Array<{
    id: string;
    title: string;
    order: number;
    content: DemoContent[];
  }>;
}

// Curated demo courses loaded when database is unseeded or offline
const DEMO_COURSES: Record<string, DemoCourseData> = {
  c1: {
    id: 'c1',
    title: 'Mathematics for Data Science I',
    slug: 'maths-1',
    topics: [
      {
        id: 't1',
        title: 'Module 1: Functions, Limits & Continuity',
        order: 1,
        content: [
          {
            id: 'l1',
            title: 'Lesson 1.1: Relations, Functions & Inverse Mappings',
            description: 'Foundations of mathematical mappings, injective and surjective definitions, and real-valued functions.',
            videoUrl: 'https://drive.google.com/file/d/1ie1Brid4MmkYYPDQX6zT35Z3aEgf6jxq/view?usp=sharing',
            youtubeUrl: 'https://youtu.be/BktHdcWoVNc?si=aiKo0g9mi5-FAJW3',
            videoSource: 'GOOGLE_DRIVE',
            duration: '24 min',
            topicTitle: 'Module 1: Functions, Limits & Continuity',
            topicId: 't1',
          },
          {
            id: 'l2',
            title: 'Lesson 1.2: Limit Theorems & Epsilon-Delta Proofs',
            description: 'Intuitive and rigorous definitions of limits, squeeze theorem, and limit evaluation techniques for qualifier exams.',
            videoUrl: 'https://drive.google.com/file/d/1ie1Brid4MmkYYPDQX6zT35Z3aEgf6jxq/view?usp=sharing',
            youtubeUrl: 'https://youtu.be/BktHdcWoVNc?si=aiKo0g9mi5-FAJW3',
            videoSource: 'YOUTUBE',
            duration: '32 min',
            topicTitle: 'Module 1: Functions, Limits & Continuity',
            topicId: 't1',
          },
          {
            id: 'l3',
            title: 'Lesson 1.3: Continuity, Intermediate Value Theorem & Derivatives',
            description: 'Geometric interpretation of continuity, Bolzano theorem, and defining derivatives as linear approximations.',
            videoUrl: 'https://drive.google.com/file/d/1ie1Brid4MmkYYPDQX6zT35Z3aEgf6jxq/view?usp=sharing',
            youtubeUrl: 'https://youtu.be/BktHdcWoVNc?si=aiKo0g9mi5-FAJW3',
            videoSource: 'GOOGLE_DRIVE',
            duration: '28 min',
            topicTitle: 'Module 1: Functions, Limits & Continuity',
            topicId: 't1',
          },
        ],
      },
      {
        id: 't2',
        title: 'Module 2: Differential Calculus & Optimization',
        order: 2,
        content: [
          {
            id: 'l4',
            title: 'Lesson 2.1: Chain Rule, Implicit Differentiation & Critical Points',
            description: 'Computational mastery of higher-order chain rules and critical point classification using second derivative tests.',
            videoUrl: 'https://drive.google.com/file/d/1ie1Brid4MmkYYPDQX6zT35Z3aEgf6jxq/view?usp=sharing',
            youtubeUrl: 'https://youtu.be/BktHdcWoVNc?si=aiKo0g9mi5-FAJW3',
            videoSource: 'GOOGLE_DRIVE',
            duration: '35 min',
            topicTitle: 'Module 2: Differential Calculus & Optimization',
            topicId: 't2',
          },
        ],
      },
    ],
  },
  c2: {
    id: 'c2',
    title: 'Computational Thinking & Python Programming',
    slug: 'python-ct',
    topics: [
      {
        id: 't3',
        title: 'Module 1: Algorithmic Logic & Loops',
        order: 1,
        content: [
          {
            id: 'l5',
            title: 'Lesson 1.1: Conditionals, Iterators & While Loops',
            description: 'Tracing variable states, loop invariants, and algorithmic termination conditions in Python.',
            videoUrl: 'https://drive.google.com/file/d/1ie1Brid4MmkYYPDQX6zT35Z3aEgf6jxq/view?usp=sharing',
            youtubeUrl: 'https://youtu.be/BktHdcWoVNc?si=aiKo0g9mi5-FAJW3',
            videoSource: 'YOUTUBE',
            duration: '30 min',
            topicTitle: 'Module 1: Algorithmic Logic & Loops',
            topicId: 't3',
          },
          {
            id: 'l6',
            title: 'Lesson 1.2: Functions, Scope & Recursion Fundamentals',
            description: 'Call stacks, recursive reduction cases, and memory models.',
            videoUrl: 'https://drive.google.com/file/d/1ie1Brid4MmkYYPDQX6zT35Z3aEgf6jxq/view?usp=sharing',
            youtubeUrl: 'https://youtu.be/BktHdcWoVNc?si=aiKo0g9mi5-FAJW3',
            videoSource: 'GOOGLE_DRIVE',
            duration: '40 min',
            topicTitle: 'Module 1: Algorithmic Logic & Loops',
            topicId: 't3',
          },
        ],
      },
    ],
  },
};

// Aliases so all platform course slugs and IDs work seamlessly
DEMO_COURSES['course-math1'] = DEMO_COURSES['c1'];
DEMO_COURSES['maths-1'] = DEMO_COURSES['c1'];
DEMO_COURSES['mathematics-for-data-science-1'] = DEMO_COURSES['c1'];
DEMO_COURSES['course-ct'] = DEMO_COURSES['c2'];
DEMO_COURSES['python-ct'] = DEMO_COURSES['c2'];
DEMO_COURSES['computational-thinking'] = DEMO_COURSES['c2'];
DEMO_COURSES['course-stats1'] = {
  id: 'course-stats1',
  title: 'Statistics for Data Science 1',
  slug: 'statistics-for-data-science-1',
  topics: DEMO_COURSES['c1'].topics,
};
DEMO_COURSES['statistics-for-data-science-1'] = DEMO_COURSES['course-stats1'];
DEMO_COURSES['deep-learning-neural-networks'] = {
  id: 'deep-learning-neural-networks',
  title: 'Deep Learning & Neural Networks',
  slug: 'deep-learning-neural-networks',
  topics: DEMO_COURSES['c2'].topics,
};
DEMO_COURSES['course-mlf'] = DEMO_COURSES['deep-learning-neural-networks'];

export default async function LessonPage({
  params,
}: {
  params: { courseId: string; contentId: string };
}) {
  const session = await getSession();

  if (!session) {
    redirect('/sign-in');
  }

  // Attempt database retrieval
  let dbLesson: any = null;
  try {
    dbLesson = await prisma.content.findUnique({
      where: { id: params.contentId },
      select: {
        id: true,
        title: true,
        description: true,
        videoUrl: true,
        youtubeUrl: true,
        videoSource: true,
        duration: true,
        topic: {
          select: {
            id: true,
            title: true,
            course: {
              select: {
                id: true,
                title: true,
                topics: {
                  orderBy: { order: 'asc' },
                  select: {
                    id: true,
                    title: true,
                    order: true,
                    content: {
                      orderBy: { order: 'asc' },
                      select: { id: true, title: true, duration: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  } catch {
    // Non-fatal if offline
  }

  // Resolve active lesson and course from DB or curated demo courses
  let courseTitle = '';
  let topics: Array<{ id: string; title: string; order: number; content: any[] }> = [];
  let currentLesson: {
    id: string;
    title: string;
    description: string | null;
    videoUrl: string | null;
    youtubeUrl: string | null;
    videoSource: string;
    duration: string | null;
    topicTitle: string;
  } | null = null;

  if (dbLesson) {
    courseTitle = dbLesson.topic.course.title;
    topics = dbLesson.topic.course.topics;
    currentLesson = {
      id: dbLesson.id,
      title: dbLesson.title,
      description: dbLesson.description,
      videoUrl: dbLesson.videoUrl,
      youtubeUrl: dbLesson.youtubeUrl,
      videoSource: dbLesson.videoSource || 'GOOGLE_DRIVE',
      duration: dbLesson.duration,
      topicTitle: dbLesson.topic.title,
    };
  } else {
    // Fallback to demo course structure
    const demoCourse = DEMO_COURSES[params.courseId] || DEMO_COURSES['c1'];
    courseTitle = demoCourse.title;
    topics = demoCourse.topics;

    const allDemoLessons = demoCourse.topics.flatMap((t) => t.content);
    const found = allDemoLessons.find((l) => l.id === params.contentId) || allDemoLessons[0];

    currentLesson = {
      id: found.id,
      title: found.title,
      description: found.description,
      videoUrl: found.videoUrl,
      youtubeUrl: found.youtubeUrl,
      videoSource: found.videoSource,
      duration: found.duration,
      topicTitle: found.topicTitle,
    };
  }

  if (!currentLesson) {
    notFound();
  }

  // Calculate previous and next lessons
  const allLessons = topics.flatMap((t) =>
    t.content.map((c) => ({
      id: c.id,
      title: c.title,
      duration: c.duration,
      topicId: t.id,
      topicTitle: t.title,
    }))
  );
  const currentIndex = allLessons.findIndex((l) => l.id === currentLesson?.id);
  const previousLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-[#090d0b] text-stone-100 font-sans selection:bg-emerald-800">
      {/* Top Theater Header */}
      <header className="h-16 border-b border-stone-800/80 bg-[#0c100e] sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-stone-800/60 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
          </Link>
          <span className="text-stone-700 hidden sm:inline">/</span>
          <span className="text-xs font-mono text-emerald-400 font-semibold truncate max-w-[200px] sm:max-w-none">
            {courseTitle}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/live">
            <Badge variant="brand" className="text-[10px] bg-emerald-950 text-emerald-300 border-emerald-800">
              Live Google Meet
            </Badge>
          </Link>
          <Link href="/dashboard">
            <Button size="sm" variant="outline" className="text-xs border-stone-700 text-stone-200 hover:bg-stone-800">
              My Courses
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Theater Layout: Video + Syllabus */}
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Player Column (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Video Player Frame */}
            <div className="rounded-2xl overflow-hidden border border-stone-800 bg-stone-950 shadow-2xl shadow-emerald-950/20">
              <LectureVideoPlayer
                videoUrl={currentLesson.videoUrl ?? undefined}
                youtubeUrl={currentLesson.youtubeUrl ?? undefined}
                videoSource={currentLesson.videoSource}
                title={currentLesson.title}
                contentId={currentLesson.id}
              />
            </div>

            {/* Lesson Title & Metadata */}
            <div className="p-6 rounded-2xl bg-stone-950 border border-stone-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                      {currentLesson.topicTitle}
                    </span>
                    {currentLesson.duration && (
                      <span className="text-[11px] font-mono text-stone-500">
                        · {currentLesson.duration}
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl font-black text-white font-display tracking-tight">
                    {currentLesson.title}
                  </h1>
                </div>

                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-950 text-emerald-300 border-emerald-800 text-xs">
                    ● Active Lesson
                  </Badge>
                </div>
              </div>

              {currentLesson.description && (
                <p className="text-stone-300 text-sm leading-relaxed border-t border-stone-800/80 pt-4">
                  {currentLesson.description}
                </p>
              )}

              {/* Navigation Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-stone-800/80">
                {previousLesson ? (
                  <Link
                    href={`/learning/${params.courseId}/${previousLesson.id}`}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-stone-800 bg-stone-900 hover:bg-stone-800 text-stone-200 text-xs font-bold transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous: {previousLesson.title}</span>
                  </Link>
                ) : (
                  <div />
                )}

                {nextLesson ? (
                  <Link
                    href={`/learning/${params.courseId}/${nextLesson.id}`}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-stone-950 text-xs font-black shadow-lg shadow-emerald-950 transition-all"
                  >
                    <span>Next: {nextLesson.title}</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Course Completed</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Course Curriculum Syllabus (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-5 rounded-2xl bg-stone-950 border border-stone-800 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div>
                  <h2 className="text-base font-bold text-white font-display">Course Curriculum</h2>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    {allLessons.length} Total Lectures · Video Lessons & Notes
                  </p>
                </div>
                <BookOpen className="w-4 h-4 text-emerald-400" />
              </div>

              {/* Topics & Lessons Accordion */}
              <div className="space-y-4">
                {topics.map((topic, topicIdx) => (
                  <div key={topic.id} className="space-y-2">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-stone-400 font-bold px-1">
                      Module {topicIdx + 1}: {topic.title}
                    </div>

                    <div className="space-y-1">
                      {topic.content.map((item) => {
                        const isActive = item.id === currentLesson?.id;
                        return (
                          <Link
                            key={item.id}
                            href={`/learning/${params.courseId}/${item.id}`}
                            className={`flex items-center justify-between gap-3 p-3 rounded-xl text-xs transition-all ${
                              isActive
                                ? 'bg-emerald-950/80 border border-emerald-500/50 text-white font-bold shadow-md'
                                : 'bg-stone-900/60 border border-stone-800/80 text-stone-300 hover:bg-stone-900 hover:text-white hover:border-stone-700'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              {isActive ? (
                                <PlayCircle className="w-4 h-4 text-emerald-400 shrink-0 fill-emerald-950" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 text-stone-600 shrink-0" />
                              )}
                              <span className="truncate">{item.title}</span>
                            </div>

                            {item.duration && (
                              <span className="text-[10px] font-mono text-stone-500 shrink-0">
                                {item.duration}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
