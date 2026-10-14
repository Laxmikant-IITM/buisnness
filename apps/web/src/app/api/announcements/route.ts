/**
 * Live Announcements & Interactive Banner Engine Endpoint
 * Module: Broadcasts & Announcements (src/app/api/announcements/route.ts)
 *
 * Serves platform-wide and course-scoped active banner announcements to learners.
 * Delivers embedded interactive polls with real-time aggregate vote distribution
 * and tracking of whether the authenticated user has already submitted a response.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession, isPlatformManager, canManageCourse } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const runtime = 'nodejs';

/**
 * Zod validation schema for announcement creation by staff.
 */
const CreateAnnouncementSchema = z.object({
  title: z.string().trim().min(3).max(250),
  body: z.string().trim().min(5).max(5000),
  courseId: z.string().optional().nullable(),
  targetType: z.enum(['ALL', 'COURSE', 'ROLE', 'LEVEL']).default('ALL'),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional().nullable(),
  poll: z
    .object({
      question: z.string().trim().min(3).max(250),
      options: z.array(z.string().trim().min(1).max(150)).min(2).max(10),
    })
    .optional()
    .nullable(),
});

/**
 * GET: Retrieve active announcements with embedded interactive polls and user votes.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    const now = new Date();

    // Query active announcements valid right now
    const announcements = await prisma.announcement.findMany({
      where: {
        isActive: true,
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gte: now } }],
        ...(courseId ? { OR: [{ courseId }, { targetType: 'ALL' }] } : {}),
      },
      include: {
        course: { select: { id: true, title: true } },
        polls: {
          include: {
            options: {
              include: {
                _count: { select: { responses: true } },
              },
              orderBy: { order: 'asc' },
            },
            responses: {
              where: { userId: session.userId },
              select: { id: true, pollOptionId: true },
            },
          },
        },
      },
      orderBy: { startsAt: 'desc' },
      take: 20,
    });

    // Format announcements and compute poll vote statistics
    const formatted = announcements.map((ann) => {
      const polls = ann.polls.map((poll) => {
        const totalVotes = poll.options.reduce((sum, opt) => sum + opt._count.responses, 0);
        const userResponse = poll.responses[0] || null;

        return {
          id: poll.id,
          question: poll.question,
          totalVotes,
          userVotedOptionId: userResponse?.pollOptionId ?? null,
          options: poll.options.map((opt) => ({
            id: opt.id,
            text: opt.text,
            order: opt.order,
            voteCount: opt._count.responses,
            percentage: totalVotes > 0 ? Math.round((opt._count.responses / totalVotes) * 100) : 0,
          })),
        };
      });

      return {
        id: ann.id,
        title: ann.title,
        body: ann.body,
        courseId: ann.courseId,
        course: ann.course,
        targetType: ann.targetType,
        startsAt: ann.startsAt,
        endsAt: ann.endsAt,
        createdAt: ann.createdAt,
        polls,
      };
    });

    return NextResponse.json({ announcements: formatted });
  } catch (error) {
    console.error('[Announcements:GET] Error:', error);
    return NextResponse.json({ error: 'Failed to retrieve announcements.' }, { status: 500 });
  }
}

/**
 * POST: Publish a platform or course announcement with optional embedded poll (Staff only).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parseResult = CreateAnnouncementSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const data = parseResult.data;

    // Staff permission check
    const isStaff =
      isPlatformManager(session.role) ||
      (data.courseId && (await canManageCourse(session.userId, session.role, data.courseId)));

    if (!isStaff) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions to publish announcements.' },
        { status: 403 },
      );
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: data.title,
        body: data.body,
        courseId: data.courseId ?? null,
        targetType: data.targetType,
        startsAt: data.startsAt ? new Date(data.startsAt) : new Date(),
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
        createdById: session.userId,
        polls: data.poll
          ? {
              create: {
                question: data.poll.question,
                options: {
                  create: data.poll.options.map((optText, index) => ({
                    text: optText,
                    order: index,
                  })),
                },
              },
            }
          : undefined,
      },
      include: {
        polls: {
          include: {
            options: true,
          },
        },
      },
    });

    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error) {
    console.error('[Announcements:POST] Error:', error);
    return NextResponse.json({ error: 'Failed to create announcement.' }, { status: 500 });
  }
}
