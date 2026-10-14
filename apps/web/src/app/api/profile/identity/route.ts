/**
 * IITM Academic Curriculum Identity API Route
 * Module: Profile & Academic Identity (apps/web/src/app/api/profile/identity/route.ts)
 *
 * Captures and enforces student academic curriculum metadata:
 * - iitmLevel (Qualifier, Foundation, Diploma, Degree)
 * - iitmUserType (STUDENT, ALUMNI, PROSPECTIVE)
 * - iitmJoinYear (e.g. 2024)
 * - iitmJoinMonth (1, 5, 9 representing IITM tri-annual admission terms)
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getFullSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

const identitySchema = z.object({
  iitmLevel: z.enum(['Qualifier', 'Foundation', 'Diploma', 'Degree']),
  iitmUserType: z.enum(['STUDENT', 'ALUMNI', 'PROSPECTIVE']),
  iitmJoinYear: z.coerce
    .number()
    .int()
    .min(2020, 'Join year must be 2020 or later.')
    .max(new Date().getFullYear() + 2, 'Join year is too far in future.'),
  iitmJoinMonth: z.coerce.number().int().min(1).max(12),
});

/**
 * Updates IITM academic identity metadata for the user.
 *
 * @param request - HTTP POST request with IITM academic details.
 * @returns JSON response with updated user record.
 */
export async function POST(request: Request) {
  const session = await getFullSession();
  if (!session) {
    return NextResponse.json({ error: 'Sign in to update your academic credentials.' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const parsed = identitySchema.safeParse(body);

    if (!parsed.success) {
      const issue = parsed.error.issues[0]?.message ?? 'Invalid academic credentials input.';
      return NextResponse.json({ error: issue }, { status: 400 });
    }

    const { iitmLevel, iitmUserType, iitmJoinYear, iitmJoinMonth } = parsed.data;

    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: session.id },
        data: {
          iitmLevel,
          iitmUserType,
          iitmJoinYear,
          iitmJoinMonth,
        },
        select: {
          id: true,
          email: true,
          name: true,
          iitmLevel: true,
          iitmUserType: true,
          iitmJoinYear: true,
          iitmJoinMonth: true,
        },
      });

      await tx.activityLog.create({
        data: {
          userId: session.id,
          action: 'IITM_IDENTITY_UPDATED',
          entity: 'User',
          entityId: session.id,
          details: { iitmLevel, iitmUserType, iitmJoinYear, iitmJoinMonth },
        },
      });

      return user;
    });

    return NextResponse.json({
      success: true,
      message: 'IITM academic credentials updated successfully.',
      user: updatedUser,
    });
  } catch (error) {
    console.error('[Identity API] Error updating academic credentials:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while updating academic identity.' },
      { status: 500 }
    );
  }
}
