/**
 * Community Channel Mute Preferences Endpoint
 * Module: Community Notifications (src/app/api/community/[courseId]/mute/route.ts)
 *
 * Allows students and instructors to mute noisy community chat channels either indefinitely
 * or for a designated duration (e.g. 1 hour, 8 hours, 24 hours) to eliminate notification fatigue.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession, canAccessCourse } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const runtime = 'nodejs';

const MutePreferenceSchema = z.object({
  isMuted: z.boolean(),
  durationMinutes: z.number().int().positive().optional().nullable(),
});

/**
 * POST: Set or toggle community mute preferences for the authenticated user.
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

    const body = await request.json().catch(() => null);
    const parseResult = MutePreferenceSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid mute payload', details: parseResult.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { isMuted, durationMinutes } = parseResult.data;

    let mutedUntil: Date | null = null;
    if (isMuted && durationMinutes) {
      mutedUntil = new Date(Date.now() + durationMinutes * 60 * 1000);
    }

    const preference = await prisma.communityMutePreference.upsert({
      where: { userId_courseId: { userId: session.userId, courseId } },
      create: {
        userId: session.userId,
        courseId,
        isMuted,
        mutedUntil,
      },
      update: {
        isMuted,
        mutedUntil,
      },
    });

    return NextResponse.json({
      success: true,
      preference: {
        isMuted: preference.isMuted,
        mutedUntil: preference.mutedUntil,
      },
    });
  } catch (error) {
    console.error('[CommunityMute:POST] Error:', error);
    return NextResponse.json({ error: 'Failed to update community mute preferences.' }, { status: 500 });
  }
}
