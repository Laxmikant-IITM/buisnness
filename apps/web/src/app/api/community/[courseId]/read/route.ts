/**
 * Community Channel Read State Synchronization Endpoint
 * Module: Community Read Tracking (src/app/api/community/[courseId]/read/route.ts)
 *
 * Updates the user's last read timestamp for a course community channel.
 * Enables unread count indicators and badge clears when the learner opens the chat stream.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession, canAccessCourse } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const runtime = 'nodejs';

const UpdateReadStateSchema = z.object({
  lastReadAt: z.string().datetime().optional(),
});

/**
 * POST: Update the last read timestamp for the authenticated learner in this course.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string } },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    const { courseId } = params;
    const hasAccess = await canAccessCourse(session.userId, session.role, courseId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: Course access required.' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const parseResult = UpdateReadStateSchema.safeParse(body);
    const readTimestamp =
      parseResult.success && parseResult.data.lastReadAt
        ? new Date(parseResult.data.lastReadAt)
        : new Date();

    const readState = await prisma.communityReadState.upsert({
      where: { userId_courseId: { userId: session.userId, courseId } },
      create: {
        userId: session.userId,
        courseId,
        lastReadAt: readTimestamp,
      },
      update: {
        lastReadAt: readTimestamp,
      },
    });

    return NextResponse.json({
      success: true,
      lastReadAt: readState.lastReadAt,
    });
  } catch (error) {
    console.error('[CommunityRead:POST] Error:', error);
    return NextResponse.json({ error: 'Failed to update read timestamp.' }, { status: 500 });
  }
}
