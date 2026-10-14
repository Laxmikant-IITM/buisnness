/**
 * @file apps/web/src/app/api/manager/courses/route.ts
 * @description Manager Course Management API: List and create courses.
 *
 * Security & Access Control:
 * - Restricted to Platform Managers (SUPER_MANAGER, MANAGER) and Course Admins (ADMIN).
 * - Enforces server-side validation and generates unique course slugs.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSession, isPlatformManager } from '@/lib/auth';

/** Schema for creating a new course in the manager studio */
const createCourseSchema = z.object({
  title: z.string().trim().min(3).max(150),
  slug: z.string().trim().min(3).max(100).toLowerCase().regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase alphanumeric characters and hyphens'),
  description: z.string().trim().max(5000).optional().default(''),
  subject: z.string().trim().min(2).max(100).optional().default('Computer Science'),
  academicTerm: z.string().trim().optional().default('Term 1'),
  term: z.string().trim().optional().default('Foundation'),
  courseCategory: z.enum(['QUALIFIER', 'LIVE', 'RECORDED']).default('RECORDED'),
  examStages: z.array(z.string()).default(['Quiz 1', 'Quiz 2', 'End Term']),
  tags: z.array(z.string()).default([]),
  videoUrl: z.string().url().optional().or(z.literal('')).nullable(),
  liveUpgradePrice: z.number().int().min(0).optional().default(199900), // paise
  demoPrice: z.number().int().min(0).optional().default(0),
  recordPricePaise: z.number().int().min(100).default(299900), // ₹2,999 default
  livePricePaise: z.number().int().min(100).default(499900), // ₹4,999 default
});

/**
 * GET /api/manager/courses
 * Returns all courses with topic counts, enrollment numbers, and offering prices.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isPlatformManager(session.role) && session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Manager access required' }, { status: 403 });
  }

  try {
    const courses = await prisma.course.findMany({
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        status: true,
        subject: true,
        academicTerm: true,
        term: true,
        courseCategory: true,
        examStages: true,
        videoUrl: true,
        liveUpgradePrice: true,
        demoPrice: true,
        tags: true,
        isDisabled: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            topics: true,
            enrollments: true,
            quizzes: true,
            materials: true,
          },
        },
        offerings: {
          select: {
            id: true,
            name: true,
            accessType: true,
            pricePaise: true,
            isActive: true,
          },
        },
      },
    });

    return NextResponse.json({ courses });
  } catch (error) {
    console.error('[MANAGER_COURSES_GET_ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}

/**
 * POST /api/manager/courses
 * Creates a new course along with default CourseOffering records for RECORDED and LIVE access.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isPlatformManager(session.role) && session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Manager access required' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createCourseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.issues }, { status: 400 });
  }

  const data = parsed.data;

  // Check unique slug
  const existing = await prisma.course.findUnique({
    where: { slug: data.slug },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json({ error: 'Course with this slug already exists' }, { status: 409 });
  }

  try {
    const course = await prisma.$transaction(async (tx) => {
      // 1. Create course
      const newCourse = await tx.course.create({
        data: {
          slug: data.slug,
          title: data.title,
          description: data.description,
          subject: data.subject,
          academicTerm: data.academicTerm,
          term: data.term,
          courseCategory: data.courseCategory,
          examStages: data.examStages,
          tags: data.tags,
          videoUrl: data.videoUrl || null,
          liveUpgradePrice: data.liveUpgradePrice,
          demoPrice: data.demoPrice,
          status: 'DRAFT',
          createdById: session.userId,
          isCommunityActive: true,
        },
      });

      // 2. Create default RECORDED offering
      await tx.courseOffering.create({
        data: {
          courseId: newCourse.id,
          name: `${newCourse.title} - Recorded Masterclass`,
          accessType: 'RECORDED',
          pricePaise: data.recordPricePaise,
          currency: 'INR',
          durationDays: 180,
          isActive: true,
        },
      });

      // 3. Create default LIVE offering
      await tx.courseOffering.create({
        data: {
          courseId: newCourse.id,
          name: `${newCourse.title} - Live Interactive Batch`,
          accessType: 'LIVE',
          pricePaise: data.livePricePaise,
          currency: 'INR',
          durationDays: 180,
          isActive: true,
        },
      });

      // 4. Create starter Topic module
      await tx.topic.create({
        data: {
          courseId: newCourse.id,
          title: 'Module 1: Foundations & Orientation',
          order: 1,
        },
      });

      return newCourse;
    });

    return NextResponse.json({ course, message: 'Course created successfully' }, { status: 201 });
  } catch (error) {
    console.error('[MANAGER_COURSES_POST_ERROR]', error);
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}
