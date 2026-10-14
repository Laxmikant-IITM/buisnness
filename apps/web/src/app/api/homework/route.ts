/**
 * Course Homework & Assignments Management Endpoint
 * Module: Homework & Grading Engine (src/app/api/homework/route.ts)
 *
 * Provides assignment discovery for learners with real-time submission tracking,
 * deadline countdown telemetry, and assignment creation capabilities for teaching staff.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession, canManageCourse, isPlatformManager, hasCourseStaffAccess } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createBatchNotifications } from '@/lib/notifications';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

export const runtime = 'nodejs';

/**
 * Validation schema for assignment creation by instructional staff.
 */
const CreateHomeworkSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required.'),
  title: z.string().trim().min(3, 'Title must be at least 3 characters.').max(250),
  description: z.string().trim().max(5000).optional().nullable(),
  fileUrls: z.array(z.string().url()).optional().default([]),
  dueAt: z.string().datetime({ message: 'Invalid due date format.' }).optional().nullable(),
  isOpen: z.boolean().default(true),
});

/**
 * GET: Retrieve homework assignments with student submission status and deadline timers.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const status = searchParams.get('status'); // 'pending', 'submitted', 'all'

    // Determine authorized course IDs
    let courseIds: string[] = [];

    if (isPlatformManager(session.role)) {
      if (courseId) courseIds = [courseId];
    } else if (session.role === 'ADMIN' || session.role === 'INSTRUCTOR') {
      const staffCourses = await prisma.courseStaffAccess.findMany({
        where: { userId: session.userId },
        select: { courseId: true },
      });
      const allowed = staffCourses.map((s) => s.courseId);
      if (courseId) {
        if (!allowed.includes(courseId)) {
          return NextResponse.json({ error: 'Forbidden: Unauthorized course access.' }, { status: 403 });
        }
        courseIds = [courseId];
      } else {
        courseIds = allowed;
      }
    } else {
      // Student: active enrollments
      const enrollments = await prisma.enrollment.findMany({
        where: {
          userId: session.userId,
          status: 'ACTIVE',
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        select: { courseId: true },
      });
      const enrolledIds = enrollments.map((e) => e.courseId);
      if (courseId) {
        if (!enrolledIds.includes(courseId)) {
          return NextResponse.json({ error: 'Forbidden: Course enrollment required.' }, { status: 403 });
        }
        courseIds = [courseId];
      } else {
        courseIds = enrolledIds;
      }
    }

    const homeworks = await prisma.homework.findMany({
      where: {
        ...(courseIds.length > 0 ? { courseId: { in: courseIds } } : {}),
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            color: true,
            icon: true,
          },
        },
        submissions: {
          where: { userId: session.userId },
          select: {
            id: true,
            fileUrls: true,
            note: true,
            score: true,
            feedback: true,
            submittedAt: true,
          },
        },
        _count: {
          select: { submissions: true },
        },
      },
      orderBy: { dueAt: 'asc' },
    });

    const now = new Date();

    const formatted = homeworks
      .map((hw) => {
        const submission = hw.submissions[0] || null;
        const isSubmitted = Boolean(submission);
        const isOverdue = Boolean(hw.dueAt && hw.dueAt < now && !isSubmitted);

        return {
          id: hw.id,
          courseId: hw.courseId,
          title: hw.title,
          description: hw.description,
          fileUrls: (hw.fileUrls as string[]) || [],
          dueAt: hw.dueAt,
          isOpen: hw.isOpen,
          createdAt: hw.createdAt,
          course: hw.course,
          submission,
          isSubmitted,
          isOverdue,
          submissionCount: hw._count.submissions,
        };
      })
      .filter((item) => {
        if (status === 'pending') return !item.isSubmitted && item.isOpen;
        if (status === 'submitted') return item.isSubmitted;
        return true;
      });

    return NextResponse.json({ homeworks: formatted });
  } catch (error) {
    console.error('[Homework:GET] Error:', error);
    return NextResponse.json({ error: 'Failed to retrieve homework assignments.' }, { status: 500 });
  }
}

/**
 * POST: Create a new homework assignment with due date (Staff/Manager only).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parseResult = CreateHomeworkSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { courseId, title, description, fileUrls, dueAt, isOpen } = parseResult.data;

    // Staff authorization
    const isStaff =
      isPlatformManager(session.role) ||
      (await canManageCourse(session.userId, session.role, courseId)) ||
      (await hasCourseStaffAccess(session.userId, courseId));

    if (!isStaff) {
      return NextResponse.json(
        { error: 'Forbidden: Only course instructional staff can create assignments.' },
        { status: 403 },
      );
    }

    const homework = await prisma.homework.create({
      data: {
        courseId,
        title,
        description: description ?? null,
        fileUrls: fileUrls as Prisma.InputJsonValue,
        dueAt: dueAt ? new Date(dueAt) : null,
        isOpen,
      },
      include: {
        course: {
          select: { id: true, title: true, slug: true },
        },
      },
    });

    // Notify enrolled learners
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId, status: 'ACTIVE' },
      select: { userId: true },
    });

    if (enrollments.length > 0) {
      const studentIds = enrollments.map((e) => e.userId);
      createBatchNotifications(studentIds, {
        title: `New Assignment: ${title}`,
        body: dueAt
          ? `Assignment due on ${new Date(dueAt).toLocaleDateString()}. Please review instructions.`
          : 'A new homework task has been assigned for your course.',
        type: 'COURSE',
        link: `/homework?id=${homework.id}`,
        metadata: { homeworkId: homework.id, courseId },
      }).catch(() => {
        // Non-blocking notification dispatch
      });
    }

    return NextResponse.json({ homework }, { status: 201 });
  } catch (error) {
    console.error('[Homework:POST] Error:', error);
    return NextResponse.json({ error: 'Failed to create homework assignment.' }, { status: 500 });
  }
}
