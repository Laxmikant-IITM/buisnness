/**
 * Community Message Emoji Reactions Endpoint
 * Module: Community Chat System (src/app/api/community/[courseId]/messages/[messageId]/reactions/route.ts)
 *
 * Allows enrolled students and instructors to toggle emoji reactions on messages.
 * Atomically updates reaction counters and broadcasts live reaction diffs over SSE.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession, canAccessCourse } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { broadcastCommunityEvent } from '@/lib/sse';
import { z } from 'zod';

export const runtime = 'nodejs';

const ReactionInputSchema = z.object({
  emoji: z.string().trim().min(1).max(8, 'Invalid emoji representation.'),
});

/**
 * POST: Toggle an emoji reaction for the authenticated user on a message.
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
    const hasAccess = await canAccessCourse(session.userId, session.role, courseId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden: Course access required.' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const parseResult = ReactionInputSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid emoji format.' }, { status: 400 });
    }

    const { emoji } = parseResult.data;

    const message = await prisma.communityMessage.findUnique({
      where: { id: messageId },
      select: { id: true, courseId: true, reactions: true, isSystemDeleted: true },
    });

    if (!message || message.courseId !== courseId || message.isSystemDeleted) {
      return NextResponse.json({ error: 'Message not found.' }, { status: 404 });
    }

    // Process reaction map: Record<emoji, userId[]>
    const currentReactions: Record<string, string[]> =
      typeof message.reactions === 'object' && message.reactions !== null
        ? { ...(message.reactions as Record<string, string[]>) }
        : {};

    const userList = Array.isArray(currentReactions[emoji]) ? [...currentReactions[emoji]] : [];
    const existingIndex = userList.indexOf(session.userId);

    if (existingIndex >= 0) {
      // Remove reaction if already added (toggle off)
      userList.splice(existingIndex, 1);
    } else {
      // Add reaction
      userList.push(session.userId);
    }

    if (userList.length > 0) {
      currentReactions[emoji] = userList;
    } else {
      delete currentReactions[emoji];
    }

    const updated = await prisma.communityMessage.update({
      where: { id: messageId },
      data: { reactions: currentReactions },
      select: { id: true, reactions: true },
    });

    // Broadcast reaction update
    broadcastCommunityEvent(courseId, 'reaction', {
      courseId,
      messageId,
      userId: session.userId,
      emoji,
      reactions: updated.reactions,
    });

    return NextResponse.json({
      success: true,
      reactions: updated.reactions,
    });
  } catch (error) {
    console.error('[MessageReaction:POST] Error:', error);
    return NextResponse.json({ error: 'Failed to update reaction.' }, { status: 500 });
  }
}
