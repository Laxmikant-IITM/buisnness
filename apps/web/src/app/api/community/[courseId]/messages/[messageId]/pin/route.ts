/**
 * Pinned Community Message Moderation Endpoint
 * Module: Community Moderation (src/app/api/community/[courseId]/messages/[messageId]/pin/route.ts)
 *
 * Enables instructors, administrators, and platform managers to pin key course announcements
 * or unpin existing highlights in community discussion channels. Broadcasts real-time pin events.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession, canManageCourse, isPlatformManager, hasCourseStaffAccess } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { broadcastCommunityEvent, sanitizeCommunityMessage } from '@/lib/sse';
import { z } from 'zod';

export const runtime = 'nodejs';

const PinToggleSchema = z.object({
  isPinned: z.boolean().optional(),
});

/**
 * POST: Toggle or set the pinned status of a community message (Staff/Manager only).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string; messageId: string } },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    const { courseId, messageId } = params;

    // Staff permission check: managers, admins, or assigned instructors
    const isStaff =
      isPlatformManager(session.role) ||
      (await canManageCourse(session.userId, session.role, courseId)) ||
      (await hasCourseStaffAccess(session.userId, courseId));

    if (!isStaff) {
      return NextResponse.json(
        { error: 'Forbidden: Only authorized instructors and managers can pin messages.' },
        { status: 403 },
      );
    }

    // Check message existence
    const existing = await prisma.communityMessage.findUnique({
      where: { id: messageId },
      include: {
        user: { select: { id: true, name: true, avatar: true, role: true } },
      },
    });

    if (!existing || existing.courseId !== courseId || existing.isSystemDeleted) {
      return NextResponse.json({ error: 'Message not found in this course community.' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const parseResult = PinToggleSchema.safeParse(body);
    const targetPinnedState =
      parseResult.success && parseResult.data.isPinned !== undefined
        ? parseResult.data.isPinned
        : !existing.isPinned;

    const updated = await prisma.communityMessage.update({
      where: { id: messageId },
      data: { isPinned: targetPinnedState },
      include: {
        user: { select: { id: true, name: true, avatar: true, role: true } },
        replyTo: {
          select: {
            id: true,
            content: true,
            userId: true,
            user: { select: { id: true, name: true, avatar: true, role: true } },
          },
        },
      },
    });

    const sanitized = sanitizeCommunityMessage(updated);

    // Broadcast pin state change to all listeners
    broadcastCommunityEvent(courseId, 'pin', {
      action: targetPinnedState ? 'pin' : 'unpin',
      courseId,
      messageId: updated.id,
      isPinned: targetPinnedState,
      actorId: session.userId,
      message: sanitized,
    });

    return NextResponse.json({
      success: true,
      message: sanitized,
      isPinned: targetPinnedState,
    });
  } catch (error) {
    console.error('[CommunityMessagePin:POST] Error:', error);
    return NextResponse.json({ error: 'Internal server error while updating pin status.' }, { status: 500 });
  }
}
