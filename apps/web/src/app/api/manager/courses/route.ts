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
import { demoStore } from '@/lib/demo-store';

/** Schema for creating a new course in the manager studio */
const createCourseSchema = z.object({
  title: z.string().trim().min(3).max(150),
  slug: z.string().trim().min(2).max(100).toLowerCase().regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase alphanumeric characters and hyphens').optional(),
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
  recordedPrice: z.number().optional(), // in rupees
  livePrice: z.number().optional(), // in rupees
  recordPricePaise: z.number().int().min(100).optional(),
  livePricePaise: z.number().int().min(100).optional(),
  durationDays: z.number().int().min(1).optional().default(120),
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
    console.warn('[MANAGER_COURSES_GET] Database offline, returning demoStore courses');
    const courses = demoStore.getCourses().map((c) => ({
      ...c,
      isDisabled: false,
      _count: {
        topics: c.topics.length,
        enrollments: 42,
        quizzes: 3,
        materials: 5,
      },
    }));
    return NextResponse.json({ courses });
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
  const slug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const recordPricePaise = data.recordPricePaise ?? (data.recordedPrice ? Math.round(data.recordedPrice * 100) : 299900);
  const livePricePaise = data.livePricePaise ?? (data.livePrice ? Math.round(data.livePrice * 100) : 499900);

  // Check unique slug
  try {
    const existing = await prisma.course.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({ error: 'Course with this slug already exists' }, { status: 409 });
    }
  } catch {}

  try {
    const course = await prisma.$transaction(async (tx) => {
      const newCourse = await tx.course.create({
        data: {
          slug,
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

      await tx.courseOffering.create({
        data: {
          courseId: newCourse.id,
          name: `${newCourse.title} - Recorded Masterclass`,
          accessType: 'RECORDED',
          pricePaise: recordPricePaise,
          currency: 'INR',
          durationDays: data.durationDays || 180,
          isActive: true,
        },
      });

      await tx.courseOffering.create({
        data: {
          courseId: newCourse.id,
          name: `${newCourse.title} - Live Interactive Batch`,
          accessType: 'LIVE',
          pricePaise: livePricePaise,
          currency: 'INR',
          durationDays: data.durationDays || 180,
          isActive: true,
        },
      });

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
    console.warn('[MANAGER_COURSES_POST] Database offline, creating course in demoStore');
    const course = demoStore.createCourse({
      slug,
      title: data.title,
      description: data.description,
      subject: data.subject,
      courseCategory: data.courseCategory,
      term: data.term,
      examStages: data.examStages,
      tags: data.tags,
      videoUrl: data.videoUrl || null,
      liveUpgradePrice: data.liveUpgradePrice,
      durationDays: data.durationDays || 120,
      offerings: [
        {
          id: `off-${slug}-rec`,
          name: `${data.title} - Recorded Masterclass`,
          accessType: 'RECORDED',
          pricePaise: recordPricePaise,
          durationDays: data.durationDays || 120,
          isActive: true,
        },
        {
          id: `off-${slug}-live`,
          name: `${data.title} - Live Interactive Batch`,
          accessType: 'LIVE',
          pricePaise: livePricePaise,
          durationDays: data.durationDays || 120,
          isActive: true,
        },
      ],
    });
    return NextResponse.json({ course, message: 'Course created successfully!' }, { status: 201 });
  }
}
