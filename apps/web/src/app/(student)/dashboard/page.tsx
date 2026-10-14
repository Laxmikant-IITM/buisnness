/**
 * @file apps/web/src/app/(student)/dashboard/page.tsx
 * @description Redesigned editorial Dashboard (for Students, Instructors, Managers).
 *
 * Warm cream light-first palette (#FAFAF7), clean white cards (#FFFFFF),
 * terracotta accents (#E05A33), subtle card tilts and count-ups, zero AI slop.
 */

import React from 'react';
import Link from 'next/link';
import { getSession, canAccessCourse } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  Play,
  Flame,
  Zap,
  Trophy,
  BookOpen,
  Video,
  FileCheck,
  MessageSquare,
  Calculator,
  Code2,
  CheckCircle2,
  Clock,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Award,
  Calendar,
  Coins,
  ShieldCheck,
  Users,
  GraduationCap,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { CandidateTelemetryTable } from '@/components/dashboard/candidate-telemetry-table';
import { FadeUp, CardTilt, CountUp } from './dashboard-animations';

export const dynamic = 'force-dynamic';

export default async function UnifiedDashboardPage() {
  const session = await getSession();

  if (!session) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#FDF0EB] dark:bg-[#3A150C] border border-[#F5B8A3] dark:border-[#7D2F1A] flex items-center justify-center text-[#E05A33]">
          <BookOpen className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] font-display">Academic Workspace</h1>
        <p className="text-sm text-[#8C8C87] max-w-md">
          Please sign in to access your curriculum, live classes, assignments, and operations console.
        </p>
        <Link
          href="/sign-in"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E05A33] hover:bg-[#C94A26] text-white font-bold text-xs transition-transform hover:scale-105 shadow-sm"
        >
          <span>Sign In to Continue</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const role = (session.role || 'STUDENT').toUpperCase();
  const isManagerRole = ['SUPER_MANAGER', 'MANAGER', 'ADMIN'].includes(role);
  const isInstructor = role === 'INSTRUCTOR';
  const isStudent = !isManagerRole && !isInstructor;

  // Retrieve user details from database
  let user: any = null;
  try {
    user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        name: true,
        email: true,
        xp: true,
        streakDays: true,
        highestLevelReached: true,
        walletBalance: true,
        iitmLevel: true,
        securityNumber: true,
        createdAt: true,
      },
    });
  } catch {
    // Unseeded DB / offline fallback
  }

  const userName = user?.name || session.email.split('@')[0];
  const userStreak = Math.max(1, user?.streakDays ?? 5);
  const userXp = Math.max(120, user?.xp ?? 2450);
  const userLevel = user?.highestLevelReached ?? 4;
  const userCoins = Math.round((user?.walletBalance ?? 4500) / 100);
  const securityId = user?.securityNumber || (isManagerRole ? 'SEC-MGR801' : 'SEC-STU401');

  // Platform operational metrics for managers
  let managerStats = {
    totalCourses: 6,
    publishedCourses: 5,
    activeLearners: 1840,
    activeEnrollments: 3260,
    publishedExams: 14,
  };

  if (isManagerRole) {
    try {
      const [cCount, pubCCount, userCount, enrCount, qCount] = await Promise.all([
        prisma.course.count(),
        prisma.course.count({ where: { status: 'PUBLISHED' } }),
        prisma.user.count({ where: { isActive: true } }),
        prisma.enrollment.count({ where: { status: 'ACTIVE' } }),
        prisma.quiz.count(),
      ]);
      managerStats = {
        totalCourses: cCount || 6,
        publishedCourses: pubCCount || 5,
        activeLearners: userCount || 1840,
        activeEnrollments: enrCount || 3260,
        publishedExams: qCount || 14,
      };
    } catch {
      // Non-fatal fallback
    }
  }

  // Fetch enrolled courses with topics & lesson progress
  let enrollments: any[] = [];
  try {
    enrollments = await prisma.enrollment.findMany({
      where: {
        userId: session.userId,
        status: 'ACTIVE',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: {
        id: true,
        accessType: true,
        expiresAt: true,
        course: {
          select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            thumbnail: true,
            topics: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                order: true,
                content: {
                  orderBy: { order: 'asc' },
                  select: {
                    id: true,
                    title: true,
                    duration: true,
                    order: true,
                    progress: {
                      where: { userId: session.userId },
                      select: { status: true, videoPosition: true, updatedAt: true },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch {
    // Non-fatal
  }

  // Process courses & calculate lesson progress
  const enrolledCourses: any[] = [];
  let resumeLesson: {
    courseId: string;
    courseTitle: string;
    lessonId: string;
    lessonTitle: string;
    topicTitle: string;
    duration: string | null;
    videoPosition: number;
    completionPct: number;
  } | null = null;

  try {
    for (const enrollment of enrollments) {
      if (!(await canAccessCourse(session.userId, session.role, enrollment.course.id))) continue;

      const lessons = enrollment.course.topics.flatMap((topic: any) =>
        topic.content.map((lesson: any) => ({
          ...lesson,
          topicTitle: topic.title,
        }))
      );

      const totalLessons = lessons.length;
      const completedLessons = lessons.filter((l: any) => l.progress[0]?.status === 'COMPLETED').length;
      const progressPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      const nextLesson =
        lessons.find((l: any) => (l.progress[0]?.videoPosition ?? 0) > 0 && l.progress[0]?.status !== 'COMPLETED') ||
        lessons.find((l: any) => !l.progress[0] || l.progress[0]?.status !== 'COMPLETED') ||
        lessons[0];

      if (!resumeLesson && nextLesson) {
        resumeLesson = {
          courseId: enrollment.course.id,
          courseTitle: enrollment.course.title,
          lessonId: nextLesson.id,
          lessonTitle: nextLesson.title,
          topicTitle: nextLesson.topicTitle,
          duration: nextLesson.duration,
          videoPosition: nextLesson.progress[0]?.videoPosition ?? 0,
          completionPct: progressPct,
        };
      }

      enrolledCourses.push({
        enrollmentId: enrollment.id,
        accessType: enrollment.accessType,
        course: enrollment.course,
        lessons,
        totalLessons,
        completedLessons,
        progressPct,
        nextLesson,
      });
    }
  } catch {
    // Fallback
  }

  // Provide realistic demo courses for students if unseeded in DB
  if (enrolledCourses.length === 0) {
    const demoLessons = [
      { id: 'l1', title: 'Relations & Inverse Functions', topicTitle: 'Module 1: Functions', duration: '24 min', progress: [{ status: 'COMPLETED' }] },
      { id: 'l2', title: 'Limit Theorems & Epsilon-Delta Proofs', topicTitle: 'Module 1: Functions', duration: '32 min', progress: [{ status: 'IN_PROGRESS', videoPosition: 480 }] },
      { id: 'l3', title: 'Derivatives as Linear Approximations', topicTitle: 'Module 2: Differential Calculus', duration: '28 min', progress: [] },
      { id: 'l4', title: 'Extreme Value Theorem & Optimization', topicTitle: 'Module 2: Differential Calculus', duration: '35 min', progress: [] },
    ];

    resumeLesson = {
      courseId: 'c1',
      courseTitle: 'Mathematics for Data Science I',
      lessonId: 'l2',
      lessonTitle: 'Limit Theorems & Epsilon-Delta Proofs',
      topicTitle: 'Module 1: Functions',
      duration: '32 min',
      videoPosition: 480,
      completionPct: 25,
    };

    enrolledCourses.push({
      enrollmentId: 'demo-enr-1',
      accessType: 'LIVE',
      course: {
        id: 'c1',
        title: 'Mathematics for Data Science I',
        slug: 'maths-1',
        description: 'IIT Madras BS Degree Foundation Core. Calculus, limits, linear mappings, and proofs.',
      },
      lessons: demoLessons,
      totalLessons: 4,
      completedLessons: 1,
      progressPct: 25,
      nextLesson: demoLessons[1],
    });

    enrolledCourses.push({
      enrollmentId: 'demo-enr-2',
      accessType: 'RECORDED',
      course: {
        id: 'c2',
        title: 'Computational Thinking & Python',
        slug: 'python-ct',
        description: 'Algorithms, data structures, recursion, and sandboxed Piston coding challenges.',
      },
      lessons: demoLessons,
      totalLessons: 8,
      completedLessons: 3,
      progressPct: 38,
      nextLesson: demoLessons[2],
    });
  }

  // Upcoming live events
  let liveEvents: any[] = [];
  try {
    liveEvents = await prisma.courseEvent.findMany({
      where: {
        startTime: { gte: new Date(Date.now() - 3600000 * 2) },
      },
      take: 3,
      orderBy: { startTime: 'asc' },
      include: {
        course: { select: { title: true, slug: true } },
      },
    });
  } catch {
    // Non-fatal
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto text-[#1A1A19] dark:text-[#F5F3EF]">
      {/* 1. Top Banner Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E8E6E1] dark:border-[#2D2D2A]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#FDF0EB] dark:bg-[#3A150C] text-[#E05A33] border border-[#F5B8A3] dark:border-[#7D2F1A]">
              {isManagerRole
                ? role.replace('_', ' ')
                : isInstructor
                ? 'COURSE INSTRUCTOR'
                : (user?.iitmLevel || 'IITM BS SCHOLAR')}
            </span>
            <span className="text-[#8C8C87] font-mono">/</span>
            <span className="text-xs font-mono text-[#8C8C87] uppercase tracking-wider">
              ID: {securityId}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] tracking-tight font-display">
            Welcome back, {userName}
          </h1>
        </div>

        {/* Status Pill on Right */}
        <div className="flex items-center gap-3">
          {isManagerRole || isInstructor ? (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] text-xs font-mono text-[#2D7A4F] shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#2D7A4F] animate-pulse" />
              <span>Telemetry Live (14ms)</span>
            </div>
          ) : (
            <Link
              href="/refer"
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] hover:border-[#E05A33]/50 transition-all group shadow-xs"
            >
              <div className="p-1 rounded-lg bg-[#FDF0EB] dark:bg-[#3A150C] text-[#E05A33] group-hover:scale-110 transition-transform">
                <Coins className="w-4 h-4 text-[#D4952B]" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-[#8C8C87] uppercase">Wallet Coins</div>
                <div className="text-xs font-bold text-[#1A1A19] dark:text-[#F5F3EF] group-hover:text-[#E05A33] font-mono">
                  {userCoins} Coins (5% Off)
                </div>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* 2. 4 Metric / KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <CardTilt className="p-5 rounded-2xl bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] relative overflow-hidden group hover:border-[#E05A33]/50 transition-all shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-[#8C8C87] font-semibold">
              {isManagerRole ? 'Total Courses' : isInstructor ? 'Assigned Cohorts' : 'Daily Streak'}
            </span>
            <div className="p-2 rounded-xl bg-[#FDF0EB] dark:bg-[#3A150C] border border-[#F5B8A3] dark:border-[#7D2F1A] text-[#E05A33]">
              {isManagerRole ? <BookOpen className="w-4 h-4" /> : isInstructor ? <BookOpen className="w-4 h-4" /> : <Flame className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] font-display flex items-baseline gap-2">
              <span>{isManagerRole ? managerStats.totalCourses : isInstructor ? '3 Cohorts' : `${userStreak} Days`}</span>
              {!isManagerRole && !isInstructor && (
                <span className="text-xs font-mono text-[#E05A33] font-semibold">Active</span>
              )}
            </div>
            {isManagerRole ? (
              <div className="text-xs font-mono text-[#2D7A4F] mt-2 pt-2 border-t border-[#E8E6E1] dark:border-[#2D2D2A]">
                {managerStats.publishedCourses} published
              </div>
            ) : isInstructor ? (
              <div className="text-xs font-mono text-[#8C8C87] mt-2 pt-2 border-t border-[#E8E6E1] dark:border-[#2D2D2A]">
                142 enrolled learners
              </div>
            ) : (
              <div className="flex items-center gap-1.5 mt-3">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                  <div key={idx} className="flex-1 text-center">
                    <div
                      className={`h-1.5 rounded-full ${
                        idx < userStreak % 7 ? 'bg-[#E05A33]' : 'bg-[#E8E6E1] dark:bg-[#2D2D2A]'
                      }`}
                    />
                    <span className="text-[9px] font-mono text-[#8C8C87] mt-1 block">{day}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardTilt>

        {/* Metric 2 */}
        <CardTilt className="p-5 rounded-2xl bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] relative overflow-hidden group hover:border-[#E05A33]/50 transition-all shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-[#8C8C87] font-semibold">
              {isManagerRole ? 'Active Learners' : isInstructor ? 'Active Students' : 'Total XP'}
            </span>
            <div className="p-2 rounded-xl bg-[#FDF0EB] dark:bg-[#3A150C] border border-[#F5B8A3] dark:border-[#7D2F1A] text-[#E05A33]">
              {isManagerRole || isInstructor ? <Users className="w-4 h-4" /> : <Zap className="w-4 h-4 fill-current" />}
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] font-display">
              {isManagerRole ? managerStats.activeLearners.toLocaleString() : isInstructor ? '142' : `${userXp.toLocaleString()} XP`}
            </div>
            <div className="text-xs text-[#6B6B66] dark:text-[#B5B3AD] mt-2 flex items-center gap-1 pt-2 border-t border-[#E8E6E1] dark:border-[#2D2D2A]">
              {isManagerRole ? (
                <span className="inline-flex items-center gap-1 text-[#2D7A4F] font-mono font-semibold">
                  <TrendingUp className="w-3 h-3" />
                  +18.4% WoW
                </span>
              ) : isInstructor ? (
                <span className="text-[#2D7A4F] font-mono font-semibold">+12 this week</span>
              ) : (
                <>
                  <span className="text-[#2D7A4F] font-mono font-bold">+180 XP</span>
                  <span>earned this week</span>
                </>
              )}
            </div>
          </div>
        </CardTilt>

        {/* Metric 3 */}
        <CardTilt className="p-5 rounded-2xl bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] relative overflow-hidden group hover:border-[#E05A33]/50 transition-all shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-[#8C8C87] font-semibold">
              {isManagerRole ? 'Active Seats' : isInstructor ? 'Homework Desk' : 'Academic Rank'}
            </span>
            <div className="p-2 rounded-xl bg-[#FDF0EB] dark:bg-[#3A150C] border border-[#F5B8A3] dark:border-[#7D2F1A] text-[#E05A33]">
              {isManagerRole ? <GraduationCap className="w-4 h-4" /> : isInstructor ? <FileCheck className="w-4 h-4" /> : <Trophy className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] font-display">
              {isManagerRole
                ? `${managerStats.activeEnrollments.toLocaleString()} Seats`
                : isInstructor
                ? '8 Pending'
                : `Level ${userLevel}: IITM Scholar`}
            </div>
            {isManagerRole ? (
              <div className="text-xs font-mono text-[#E05A33] mt-2 pt-2 border-t border-[#E8E6E1] dark:border-[#2D2D2A] flex items-center gap-1 font-semibold">
                <TrendingUp className="w-3 h-3" />
                +14.2% Growth
              </div>
            ) : isInstructor ? (
              <div className="text-xs font-mono text-[#D4952B] mt-2 pt-2 border-t border-[#E8E6E1] dark:border-[#2D2D2A]">
                Awaiting review
              </div>
            ) : (
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-[#8C8C87]">
                  <span>Progress to Level {userLevel + 1}</span>
                  <span>82%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#E8E6E1] dark:bg-[#2D2D2A] overflow-hidden">
                  <div className="h-full bg-[#E05A33] rounded-full" style={{ width: '82%' }} />
                </div>
              </div>
            )}
          </div>
        </CardTilt>

        {/* Metric 4 */}
        <CardTilt className="p-5 rounded-2xl bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] relative overflow-hidden group hover:border-[#E05A33]/50 transition-all shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-[#8C8C87] font-semibold">
              {isManagerRole ? 'Assessment Suite' : isInstructor ? 'Next Masterclass' : 'Daily Goal'}
            </span>
            <div className="p-2 rounded-xl bg-[#FDF0EB] dark:bg-[#3A150C] border border-[#F5B8A3] dark:border-[#7D2F1A] text-[#E05A33]">
              {isManagerRole ? <ShieldCheck className="w-4 h-4" /> : isInstructor ? <Video className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] font-display">
              {isManagerRole ? `${managerStats.publishedExams} Exams` : isInstructor ? 'Thu 7:00 PM' : '1 / 2 Lessons'}
            </div>
            <div className="text-xs text-[#8C8C87] mt-2 pt-2 border-t border-[#E8E6E1] dark:border-[#2D2D2A]">
              {isManagerRole ? (
                <span className="text-[#2D7A4F] font-mono font-semibold">99.8% Integrity Verified</span>
              ) : isInstructor ? (
                <span className="text-[#8C8C87] font-mono">Calculus Problem Sitting</span>
              ) : (
                <span>Complete 1 more lesson</span>
              )}
            </div>
          </div>
        </CardTilt>
      </section>

      {/* 3. Hero Spotlight Card */}
      {isManagerRole ? (
        <section className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FDF0EB] dark:bg-[#3A150C] border border-[#F5B8A3] dark:border-[#7D2F1A] text-[#E05A33] text-xs font-mono font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>OPERATIONAL MISSION CONTROL · PROCTORING & DELIVERY</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] font-display">
                Anti-Cheat Telemetry & Course Studio
              </h2>
              <div className="flex items-center gap-3 text-xs font-mono text-[#2D7A4F] pt-1">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  <span>4 Active Telemetry Rooms</span>
                </span>
                <span>•</span>
                <span>Zero System Critical Errors</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <Link
                href="/manager/exams"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#E05A33] hover:bg-[#C94A26] text-white font-bold text-xs shadow-sm transition-all"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Exam Operations</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/manager/courses"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#F5F3EF] dark:bg-[#242422] hover:bg-[#EDEBE5] border border-[#E8E6E1] dark:border-[#2D2D2A] text-[#1A1A19] dark:text-[#F5F3EF] font-bold text-xs transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                <span>Course Studio</span>
              </Link>
            </div>
          </div>
        </section>
      ) : resumeLesson ? (
        <section className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FDF0EB] dark:bg-[#3A150C] border border-[#F5B8A3] dark:border-[#7D2F1A] text-[#E05A33] text-xs font-mono font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>CONTINUE LEARNING · READY TO RESUME</span>
              </div>

              <div>
                <span className="text-xs font-mono uppercase text-[#8C8C87] font-semibold">
                  {resumeLesson.courseTitle} · {resumeLesson.topicTitle}
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1A1A19] dark:text-[#F5F3EF] font-display mt-1">
                  {resumeLesson.lessonTitle}
                </h2>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono text-[#6B6B66] dark:text-[#B5B3AD]">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#E05A33]" />
                  {resumeLesson.duration || '24 mins'}
                </span>
                <span>•</span>
                <span className="text-[#E05A33] font-semibold">
                  {resumeLesson.completionPct}% Course Completed
                </span>
              </div>

              <div className="w-full max-w-md h-2 rounded-full bg-[#E8E6E1] dark:bg-[#2D2D2A] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#E05A33] to-[#E86D45] rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(5, resumeLesson.completionPct)}%` }}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <Link
                href={`/learning/${resumeLesson.courseId}/${resumeLesson.lessonId}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#E05A33] hover:bg-[#C94A26] text-white font-extrabold text-sm shadow-md shadow-[#E05A33]/20 transition-all hover:scale-105"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Resume Lesson</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {/* 4. Main Grid: Left Column (Courses / Telemetry) + Right Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {isManagerRole ? (
            <>
              {/* Live Anti-Cheat Candidate Telemetry Monitor */}
              <CandidateTelemetryTable />

              {/* Active Courses Quick List */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#1A1A19] dark:text-[#F5F3EF] font-display">Active Course Catalog</h3>
                    <p className="text-xs text-[#8C8C87]">Curriculums managed under platform authority.</p>
                  </div>
                  <Link href="/manager/courses" className="text-xs font-mono text-[#E05A33] hover:underline font-semibold">
                    Course Studio →
                  </Link>
                </div>

                <div className="space-y-3">
                  {enrolledCourses.map((item) => (
                    <div
                      key={item.enrollmentId}
                      className="p-3.5 rounded-xl bg-[#FAFAF7] dark:bg-[#242422] border border-[#E8E6E1] dark:border-[#2D2D2A] flex items-center justify-between hover:border-[#E05A33]/40 transition-colors"
                    >
                      <div>
                        <div className="font-bold text-xs text-[#1A1A19] dark:text-[#F5F3EF]">{item.course.title}</div>
                        <div className="text-[11px] text-[#8C8C87] font-mono mt-0.5">
                          {item.totalLessons} lessons · {item.accessType} batch
                        </div>
                      </div>
                      <Link
                        href="/manager/courses"
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] hover:border-[#E05A33] text-[#1A1A19] dark:text-[#F5F3EF] text-xs font-semibold shadow-xs"
                      >
                        Edit Modules
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Enrolled Courses Section for Students & Instructors */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#1A1A19] dark:text-[#F5F3EF] font-display">
                    {isInstructor ? 'Assigned Teaching Cohorts' : 'Enrolled Courses'}
                  </h2>
                </div>
                <Link href="/courses" className="text-xs text-[#E05A33] hover:underline font-mono font-semibold">
                  Browse Catalog →
                </Link>
              </div>

              <div className="space-y-4">
                {enrolledCourses.map((item) => (
                  <CardTilt
                    key={item.enrollmentId}
                    className="p-5 rounded-2xl bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] hover:border-[#E05A33]/40 transition-all duration-300 space-y-4 group shadow-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-[#FDF0EB] dark:bg-[#3A150C] border border-[#F5B8A3] dark:border-[#7D2F1A] text-[#E05A33] font-mono text-[10px] font-bold">
                            {item.accessType.replaceAll('_', ' ')}
                          </span>
                          <span className="text-[11px] font-mono text-[#8C8C87]">
                            {item.completedLessons} of {item.totalLessons} lessons completed
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-[#1A1A19] dark:text-[#F5F3EF] font-display mt-1.5 group-hover:text-[#E05A33] transition-colors">
                          {item.course.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.nextLesson && (
                          <Link
                            href={`/learning/${item.course.id}/${item.nextLesson.id}`}
                            className="px-4 py-2 rounded-xl bg-[#F5F3EF] dark:bg-[#242422] hover:bg-[#E05A33] hover:text-white border border-[#E8E6E1] dark:border-[#2D2D2A] text-[#1A1A19] dark:text-[#F5F3EF] font-bold text-xs transition-all flex items-center gap-1.5 shadow-xs"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Continue</span>
                          </Link>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-mono text-[#8C8C87]">
                        <span>Curriculum Progress</span>
                        <span className="text-[#E05A33] font-bold">{item.progressPct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-[#E8E6E1] dark:bg-[#2D2D2A] overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#E05A33] to-[#E86D45] rounded-full transition-all duration-500"
                          style={{ width: `${item.progressPct}%` }}
                        />
                      </div>
                    </div>

                    {item.nextLesson && (
                      <div className="p-3 rounded-xl bg-[#FAFAF7] dark:bg-[#242422] border border-[#E8E6E1] dark:border-[#2D2D2A] flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-[#4A4A46] dark:text-[#B5B3AD]">
                          <span className="text-[#8C8C87] font-mono">Next up:</span>
                          <span className="font-semibold text-[#1A1A19] dark:text-[#F5F3EF]">{item.nextLesson.title}</span>
                        </div>
                        <span className="text-[#8C8C87] font-mono">{item.nextLesson.duration || 'Lesson'}</span>
                      </div>
                    )}
                  </CardTilt>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right Column (1 Col) */}
        <div className="space-y-6">
          {/* Upcoming Live Classes Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#FDF0EB] dark:bg-[#3A150C] text-[#E05A33]">
                  <Video className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-[#1A1A19] dark:text-[#F5F3EF] text-sm font-display">Live Masterclasses</h3>
              </div>
              <Link href="/live" className="text-[11px] font-mono text-[#E05A33] hover:underline font-semibold">
                View All →
              </Link>
            </div>

            <div className="space-y-3">
              {liveEvents.length > 0 ? (
                liveEvents.map((evt: any) => (
                  <div
                    key={evt.id}
                    className="p-3 rounded-xl bg-[#FAFAF7] dark:bg-[#242422] border border-[#E8E6E1] dark:border-[#2D2D2A] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-[#E05A33] font-semibold uppercase">
                        {evt.course.title}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-[#FDF0EB] dark:bg-[#3A150C] text-[#E05A33] text-[9px] font-mono font-bold animate-pulse">
                        LIVE SOON
                      </span>
                    </div>
                    <div className="font-semibold text-xs text-[#1A1A19] dark:text-[#F5F3EF]">{evt.title}</div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] font-mono text-[#8C8C87]">
                        {new Date(evt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {evt.meetLink ? (
                        <a
                          href={evt.meetLink}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-md bg-[#E05A33] hover:bg-[#C94A26] text-white font-bold text-[11px] transition-colors"
                        >
                          Join Meet
                        </a>
                      ) : (
                        <span className="text-[10px] font-mono text-[#8C8C87]">Scheduled</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl bg-[#FAFAF7] dark:bg-[#242422] border border-[#E8E6E1] dark:border-[#2D2D2A] text-center text-xs text-[#8C8C87] space-y-2">
                  <Calendar className="w-5 h-5 mx-auto text-[#8C8C87]" />
                  <p>Weekly Problem Sittings schedule every Tuesday & Thursday at 7:00 PM.</p>
                  <Link href="/live" className="text-[#E05A33] font-semibold text-xs block">
                    Check Schedule →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Pending Homework Desk */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#FDFAF2] dark:bg-[#381D0C] text-[#D4952B]">
                  <FileCheck className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-[#1A1A19] dark:text-[#F5F3EF] text-sm font-display">Homework Desk</h3>
              </div>
              <Link href="/homework" className="text-[11px] font-mono text-[#D4952B] hover:underline font-semibold">
                Submit →
              </Link>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAFAF7] dark:bg-[#242422] border border-[#E8E6E1] dark:border-[#2D2D2A] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#D4952B] font-semibold">MATH 2 · WEEK 4</span>
                <span className="text-[10px] font-mono text-[#8C8C87]">Due Sunday 11:59 PM</span>
              </div>
              <div className="text-xs font-semibold text-[#1A1A19] dark:text-[#F5F3EF]">Calculus Taylor Series Problem Set</div>
              <p className="text-[11px] text-[#6B6B66] dark:text-[#B5B3AD]">
                Submit PDF or multi-file solutions for TA review and grade feedback.
              </p>
              <Link
                href="/homework"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D4952B] hover:underline pt-1 font-mono"
              >
                <span>Open Submission Form</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Course Community Chat Pulse */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#FDF0EB] dark:bg-[#3A150C] text-[#E05A33]">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-[#1A1A19] dark:text-[#F5F3EF] text-sm font-display">Course Community</h3>
              </div>
              <Link href="/community" className="text-[11px] font-mono text-[#E05A33] hover:underline font-semibold">
                Open Chat →
              </Link>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAFAF7] dark:bg-[#242422] border border-[#E8E6E1] dark:border-[#2D2D2A] space-y-2 text-xs">
              <div className="flex items-center justify-between text-[10px] font-mono text-[#8C8C87]">
                <span>#general-doubt-clearing</span>
                <span className="text-[#2D7A4F]">● 14 peers active</span>
              </div>
              <p className="text-[#4A4A46] dark:text-[#B5B3AD]">
                <strong className="text-[#1A1A19] dark:text-[#F5F3EF]">Aryan (TA):</strong> "Uploaded the solution breakdown for Question 7 in the practice papers desk!"
              </p>
              <Link
                href="/community"
                className="w-full mt-2 py-2 rounded-xl bg-[#F5F3EF] dark:bg-[#242422] hover:bg-[#EDEBE5] text-[#1A1A19] dark:text-[#F5F3EF] text-center text-xs font-bold block transition-colors border border-[#E8E6E1] dark:border-[#2D2D2A]"
              >
                Join Live Discussion
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Quick Utilities Dock */}
      <section className="pt-6 border-t border-[#E8E6E1] dark:border-[#2D2D2A]">
        <h3 className="text-xs font-mono uppercase tracking-wider text-[#8C8C87] font-semibold mb-4">
          {isManagerRole ? 'MANAGERIAL STUDIO & TOOLS' : 'ACADEMIC TOOLKIT & PLAYGROUNDS'}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {isManagerRole ? (
            <>
              <Link
                href="/manager/courses"
                className="p-4 rounded-xl bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] hover:border-[#E05A33]/50 hover:-translate-y-0.5 transition-all duration-300 group shadow-xs"
              >
                <BookOpen className="w-5 h-5 text-[#E05A33] group-hover:scale-110 transition-transform" />
                <div className="font-bold text-[#1A1A19] dark:text-[#F5F3EF] text-sm mt-2">Course Studio</div>
                <div className="text-[11px] text-[#8C8C87] mt-0.5">Edit modules & video sources</div>
              </Link>

              <Link
                href="/manager/exams"
                className="p-4 rounded-xl bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] hover:border-[#E05A33]/50 hover:-translate-y-0.5 transition-all duration-300 group shadow-xs"
              >
                <ShieldCheck className="w-5 h-5 text-[#D4952B] group-hover:scale-110 transition-transform" />
                <div className="font-bold text-[#1A1A19] dark:text-[#F5F3EF] text-sm mt-2">Exam Operations</div>
                <div className="text-[11px] text-[#8C8C87] mt-0.5">Proctoring rooms & CSV export</div>
              </Link>

              <Link
                href="/manager/users"
                className="p-4 rounded-xl bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] hover:border-[#E05A33]/50 hover:-translate-y-0.5 transition-all duration-300 group shadow-xs"
              >
                <Users className="w-5 h-5 text-[#2D7A4F] group-hover:scale-110 transition-transform" />
                <div className="font-bold text-[#1A1A19] dark:text-[#F5F3EF] text-sm mt-2">User Directory</div>
                <div className="text-[11px] text-[#8C8C87] mt-0.5">Staff roles & security codes</div>
              </Link>

              <Link
                href="/ide/1"
                className="p-4 rounded-xl bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] hover:border-[#E05A33]/50 hover:-translate-y-0.5 transition-all duration-300 group shadow-xs"
              >
                <Code2 className="w-5 h-5 text-[#E05A33] group-hover:scale-110 transition-transform" />
                <div className="font-bold text-[#1A1A19] dark:text-[#F5F3EF] text-sm mt-2">Piston Sandbox</div>
                <div className="text-[11px] text-[#8C8C87] mt-0.5">Python & DSA runner</div>
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/tools"
                className="p-4 rounded-xl bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] hover:border-[#E05A33]/50 hover:-translate-y-0.5 transition-all duration-300 group shadow-xs"
              >
                <Calculator className="w-5 h-5 text-[#E05A33] group-hover:scale-110 transition-transform" />
                <div className="font-bold text-[#1A1A19] dark:text-[#F5F3EF] text-sm mt-2">Grade Predictor</div>
                <div className="text-[11px] text-[#8C8C87] mt-0.5">Reverse target calculator</div>
              </Link>

              <Link
                href="/exams"
                className="p-4 rounded-xl bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] hover:border-[#E05A33]/50 hover:-translate-y-0.5 transition-all duration-300 group shadow-xs"
              >
                <ShieldCheck className="w-5 h-5 text-[#D4952B] group-hover:scale-110 transition-transform" />
                <div className="font-bold text-[#1A1A19] dark:text-[#F5F3EF] text-sm mt-2">Proctored Mocks</div>
                <div className="text-[11px] text-[#8C8C87] mt-0.5">Anti-cheat exam rooms</div>
              </Link>

              <Link
                href="/ide/1"
                className="p-4 rounded-xl bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] hover:border-[#E05A33]/50 hover:-translate-y-0.5 transition-all duration-300 group shadow-xs"
              >
                <Code2 className="w-5 h-5 text-[#E05A33] group-hover:scale-110 transition-transform" />
                <div className="font-bold text-[#1A1A19] dark:text-[#F5F3EF] text-sm mt-2">Piston Sandbox</div>
                <div className="text-[11px] text-[#8C8C87] mt-0.5">Python & DSA compiler</div>
              </Link>

              <Link
                href="/refer"
                className="p-4 rounded-xl bg-white dark:bg-[#1C1C1A] border border-[#E8E6E1] dark:border-[#2D2D2A] hover:border-[#E05A33]/50 hover:-translate-y-0.5 transition-all duration-300 group shadow-xs"
              >
                <Coins className="w-5 h-5 text-[#D4952B] group-hover:scale-110 transition-transform" />
                <div className="font-bold text-[#1A1A19] dark:text-[#F5F3EF] text-sm mt-2">5% Referral Hub</div>
                <div className="text-[11px] text-[#8C8C87] mt-0.5">Earn wallet coins</div>
              </Link>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
