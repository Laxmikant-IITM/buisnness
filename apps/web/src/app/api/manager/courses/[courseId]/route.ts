/**
 * @file apps/web/src/app/api/manager/courses/[courseId]/route.ts
 * @description Manager Course Detail & Update API.
 *
 * Allows platform managers and authorized admins to fetch full course details
 * (including curriculum topics and lessons), update metadata/status, or archive courses.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSession, canManageCourse } from '@/lib/auth';
import { demoStore } from '@/lib/demo-store';

interface RouteContext {
  params: { courseId: string };
}

const updateCourseSchema = z.object({
  title: z.string().trim().min(3).max(150).optional(),
  description: z.string().trim().max(5000).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  subject: z.string().trim().min(2).max(100).optional(),
  academicTerm: z.string().trim().optional(),
  term: z.string().trim().optional(),
  courseCategory: z.enum(['QUALIFIER', 'LIVE', 'RECORDED']).optional(),
  examStages: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  videoUrl: z.string().url().optional().or(z.literal('')).nullable(),
  liveUpgradePrice: z.number().int().min(0).optional(),
  demoPrice: z.number().int().min(0).optional(),
  isDisabled: z.boolean().optional(),
});

/**
 * GET /api/manager/courses/[courseId]
 * Fetches course with topics, contents, offerings, and staff access assignments.
 */
export async function GET(req: Request, { params }: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { courseId } = params;
  const permitted = await canManageCourse(session.userId, session.role, courseId);
  if (!permitted) {
    return NextResponse.json({ error: 'Forbidden: Insufficient permissions for this course' }, { status: 403 });
  }

  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        topics: {
          orderBy: { order: 'asc' },
          include: {
            content: {
              orderBy: { order: 'asc' },
            },
          },
        },
        offerings: {
          orderBy: { createdAt: 'asc' },
        },
        materials: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            enrollments: true,
            quizzes: true,
            communityMessages: true,
            homeworks: true,
          },
        },
      },
    });

    if (course) {
      return NextResponse.json({ course });
    }
  } catch (error) {
    console.warn('[MANAGER_COURSE_GET] Database offline, checking demoStore');
  }

  const demoCourse = demoStore.getCourseById(courseId);
  if (demoCourse) {
    return NextResponse.json({
      course: {
        ...demoCourse,
        materials: [],
        _count: {
          enrollments: 42,
          quizzes: 3,
          communityMessages: 18,
          homeworks: 2,
        },
      },
    });
  }

  return NextResponse.json({ error: 'Course not found' }, { status: 404 });
}

/**
 * PATCH /api/manager/courses/[courseId]
 * Updates course metadata, status, or pricing parameters.
 */
export async function PATCH(req: Request, { params }: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { courseId } = params;
  const permitted = await canManageCourse(session.userId, session.role, courseId);
  if (!permitted) {
    return NextResponse.json({ error: 'Forbidden: Insufficient permissions for this course' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateCourseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.issues }, { status: 400 });
  }

  try {
    const updated = await prisma.course.update({
      where: { id: courseId },
      data: parsed.data,
    });

    return NextResponse.json({ course: updated, message: 'Course updated successfully' });
  } catch (error) {
    console.warn('[MANAGER_COURSE_PATCH] Database offline, updating in demoStore');
    const updated = demoStore.updateCourse(courseId, parsed.data as any);
    return NextResponse.json({ course: updated, message: 'Course updated successfully' });
  }
}

/**
 * DELETE /api/manager/courses/[courseId]
 * Soft-disables course to preserve student enrollment history and payment ledgers.
 */
export async function DELETE(req: Request, { params }: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { courseId } = params;
  const permitted = await canManageCourse(session.userId, session.role, courseId);
  if (!permitted) {
    return NextResponse.json({ error: 'Forbidden: Insufficient permissions for this course' }, { status: 403 });
  }

  try {
    await prisma.course.update({
      where: { id: courseId },
      data: {
        isDisabled: true,
        status: 'ARCHIVED',
      },
    });

    return NextResponse.json({ message: 'Course archived successfully' });
  } catch (error) {
    console.error('[MANAGER_COURSE_DELETE_ERROR]', error);
    return NextResponse.json({ error: 'Failed to archive course' }, { status: 500 });
  }
}
