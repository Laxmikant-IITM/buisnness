/**
 * Community Discussion Center Page
 * Module: Student Community (src/app/(student)/community/page.tsx)
 *
 * Primary social hub connecting learners, teaching assistants, and subject professors.
 * Allows switching between enrolled course communities, reviewing active broadcasts,
 * and communicating via real-time SSE chat channels.
 */

import React from 'react';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { CommunityChat } from '@/components/community/community-chat';
import { CommunityChannelLayout } from '@/components/community/community-channel-layout';
import { MessageSquare, Users, BookOpen } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface CommunityPageProps {
  searchParams: { courseId?: string };
}

export default async function CommunityPage({ searchParams }: CommunityPageProps) {
  const session = await getSession();
  if (!session) {
    redirect('/sign-in');
  }

  // Retrieve enrolled courses or assigned courses
  let courses: Array<{ id: string; title: string; slug: string; color: string | null; icon: string | null }> = [];

  try {
    if (session.role === 'SUPER_MANAGER' || session.role === 'MANAGER') {
      courses = await prisma.course.findMany({
        where: { isDisabled: false },
        select: { id: true, title: true, slug: true, color: true, icon: true },
        take: 20,
      });
    } else if (session.role === 'ADMIN' || session.role === 'INSTRUCTOR') {
      const staffCourses = await prisma.courseStaffAccess.findMany({
        where: { userId: session.userId },
        include: {
          course: { select: { id: true, title: true, slug: true, color: true, icon: true } },
        },
      });
      courses = staffCourses.map((s) => s.course);
    } else {
      const enrollments = await prisma.enrollment.findMany({
        where: {
          userId: session.userId,
          status: 'ACTIVE',
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        include: {
          course: { select: { id: true, title: true, slug: true, color: true, icon: true } },
        },
      });
      courses = enrollments.map((e) => e.course);
    }
  } catch {
    // Non-fatal if DB is unseeded or offline
  }

  // Fallback demo courses if unseeded or database offline
  if (courses.length === 0) {
    courses = [
      {
        id: 'c1',
        title: 'Mathematics for Data Science I',
        slug: 'maths-1',
        color: '#10b981',
        icon: 'book',
      },
      {
        id: 'c2',
        title: 'Computational Thinking & Python',
        slug: 'python-ct',
        color: '#3b82f6',
        icon: 'code',
      },
    ];
  }

  // Resolve active course
  const selectedCourseId = searchParams.courseId || courses[0]?.id;
  const activeCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  if (!activeCourse) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-stone-950 rounded-2xl border border-stone-800 text-center">
        <div className="w-14 h-14 rounded-2xl bg-stone-900 flex items-center justify-center text-stone-400 mb-4">
          <BookOpen className="w-7 h-7" />
        </div>
        <h2 className="text-base font-bold text-white font-display">No Active Course Communities</h2>
        <p className="text-xs text-stone-400 max-w-md mt-1 mb-5">
          You are not currently enrolled in any courses with an active community.
        </p>
        <Link
          href="/courses"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-stone-950 text-xs font-bold hover:bg-emerald-400 transition-colors"
        >
          Explore Courses
        </Link>
      </div>
    );
  }

  return (
    <CommunityChannelLayout
      courses={courses}
      activeCourse={activeCourse}
      currentUserId={session.userId}
      currentUserRole={session.role}
    />
  );
}
