/**
 * @file apps/web/src/app/api/manager/courses/[courseId]/topics/route.ts
 * @description Manager Topics API: Create and reorder modules within a course curriculum.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSession, canManageCourse } from '@/lib/auth';

interface RouteContext {
  params: { courseId: string };
}

const createTopicSchema = z.object({
  title: z.string().trim().min(2).max(150),
  order: z.number().int().min(0).optional(),
});

export async function POST(req: Request, { params }: RouteContext) {
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
  const parsed = createTopicSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.issues }, { status: 400 });
  }

  try {
    // Determine next order if not supplied
    let order = parsed.data.order;
    if (order === undefined) {
      const highest = await prisma.topic.findFirst({
        where: { courseId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      order = (highest?.order ?? 0) + 1;
    }

    const topic = await prisma.topic.create({
      data: {
        courseId,
        title: parsed.data.title,
        order,
      },
    });

    return NextResponse.json({ topic, message: 'Topic module added successfully' }, { status: 201 });
  } catch (error) {
    console.error('[MANAGER_TOPIC_CREATE_ERROR]', error);
    return NextResponse.json({ error: 'Failed to create topic' }, { status: 500 });
  }
}
