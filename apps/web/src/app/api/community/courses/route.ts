/**
 * Learner Community Courses Directory Endpoint
 * Module: Community Chat System (src/app/api/community/courses/route.ts)
 *
 * Returns list of courses accessible to the authenticated learner or instructor
 * with unread message counters, latest activity timestamps, and active channel metadata.
 */

import { NextResponse } from 'next/server';
import { getSession, isPlatformManager } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

/**
 * GET: Retrieve list of accessible courses for the community channel selector.
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    let courseIds: string[] = [];

    if (isPlatformManager(session.role)) {
      const allCourses = await prisma.course.findMany({
        where: { isDisabled: false },
        select: { id: true },
        take: 50,
      });
      courseIds = allCourses.map((c) => c.id);
    } else if (session.role === 'ADMIN' || session.role === 'INSTRUCTOR') {
      const staffAssignments = await prisma.courseStaffAccess.findMany({
        where: { userId: session.userId },
        select: { courseId: true },
      });
      courseIds = staffAssignments.map((s) => s.courseId);
    } else {
      const enrollments = await prisma.enrollment.findMany({
        where: {
          userId: session.userId,
          status: 'ACTIVE',
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        select: { courseId: true },
      });
      courseIds = enrollments.map((e) => e.courseId);
    }

    if (courseIds.length === 0) {
      return NextResponse.json({ courses: [] });
    }

    const courses = await prisma.course.findMany({
      where: { id: { in: courseIds } },
      select: {
        id: true,
        title: true,
        slug: true,
        color: true,
        icon: true,
        teacherName: true,
        subject: true,
      },
    });

    // Compute unread counts for each course for current user
    const coursesWithUnread = await Promise.all(
      courses.map(async (course) => {
        const readState = await prisma.communityReadState.findUnique({
          where: { userId_courseId: { userId: session.userId, courseId: course.id } },
        });

        const unreadCount = await prisma.communityMessage.count({
          where: {
            courseId: course.id,
            isSystemDeleted: false,
            createdAt: { gt: readState?.lastReadAt ?? new Date(0) },
          },
        });

        return {
          ...course,
          unreadCount,
          lastReadAt: readState?.lastReadAt ?? null,
        };
      }),
    );

    return NextResponse.json({ courses: coursesWithUnread });
  } catch (error) {
    console.error('[CommunityCourses:GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch enrolled community courses.' }, { status: 500 });
  }
}
