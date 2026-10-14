/**
 * @file apps/web/src/app/api/manager/courses/[courseId]/topics/[topicId]/content/route.ts
 * @description Manager Topic Content API: Add lesson contents (Drive video, YouTube, slides) to topics.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSession, canManageCourse } from '@/lib/auth';

interface RouteContext {
  params: {
    courseId: string;
    topicId: string;
  };
}

const createContentSchema = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(5000).optional().default(''),
  videoSource: z.enum(['GOOGLE_DRIVE', 'YOUTUBE', 'DIRECT', 'NONE']).default('GOOGLE_DRIVE'),
  videoUrl: z.string().trim().optional().or(z.literal('')).nullable(),
  youtubeUrl: z.string().trim().optional().or(z.literal('')).nullable(),
  duration: z.string().trim().optional().default('15 min'),
  isDemo: z.boolean().default(false),
  order: z.number().int().min(0).optional(),
});

export async function POST(req: Request, { params }: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { courseId, topicId } = params;
  const permitted = await canManageCourse(session.userId, session.role, courseId);
  if (!permitted) {
    return NextResponse.json({ error: 'Forbidden: Insufficient permissions for this course' }, { status: 403 });
  }

  // Verify topic belongs to course
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    select: { id: true, courseId: true },
  });

  if (!topic || topic.courseId !== courseId) {
    return NextResponse.json({ error: 'Topic not found in this course' }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createContentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.issues }, { status: 400 });
  }

  const data = parsed.data;

  try {
    let order = data.order;
    if (order === undefined) {
      const highest = await prisma.content.findFirst({
        where: { topicId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      order = (highest?.order ?? 0) + 1;
    }

    const content = await prisma.content.create({
      data: {
        topicId,
        title: data.title,
        description: data.description,
        videoSource: data.videoSource,
        videoUrl: data.videoUrl || null,
        youtubeUrl: data.youtubeUrl || null,
        duration: data.duration,
        isDemo: data.isDemo,
        order,
      },
    });

    return NextResponse.json({ content, message: 'Lesson added successfully' }, { status: 201 });
  } catch (error) {
    console.warn('[MANAGER_CONTENT_CREATE] Database offline, adding lesson to demoStore');
    const { demoStore } = await import('@/lib/demo-store');
    const content = demoStore.addLesson(courseId, topicId, {
      title: data.title,
      videoSource: data.videoSource as any,
      videoUrl: data.videoUrl || data.youtubeUrl || '',
      duration: data.duration,
      isDemo: data.isDemo,
    });
    return NextResponse.json({ content, message: 'Lesson added successfully' }, { status: 201 });
  }
}
