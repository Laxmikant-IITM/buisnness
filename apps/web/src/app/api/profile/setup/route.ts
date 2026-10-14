/**
 * Initial Profile Onboarding Blocker Setup Route
 * Module: Profile & Learner Onboarding (apps/web/src/app/api/profile/setup/route.ts)
 *
 * Collects mandatory student demographic and contact information:
 * (name, mobileNumber, gender, age, state, aboutMe).
 * Transitions isProfileComplete to true, removing the onboarding blocker,
 * awards onboarding XP, and updates the user record.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getFullSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

const profileSetupSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(100),
  mobileNumber: z
    .string()
    .trim()
    .regex(/^[0-9+ -]{10,15}$/, 'Please enter a valid 10-digit mobile number.'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']),
  age: z.coerce.number().int().min(10, 'Age must be at least 10.').max(100, 'Please enter a valid age.'),
  state: z.string().trim().min(2, 'Please select your state or province.').max(100),
  aboutMe: z.string().trim().max(500, 'Bio cannot exceed 500 characters.').optional(),
});

/**
 * Handles initial profile setup form submission.
 *
 * @param request - HTTP POST request with profile setup data.
 * @returns JSON response with updated user record.
 */
export async function POST(request: Request) {
  const session = await getFullSession();
  if (!session) {
    return NextResponse.json({ error: 'Sign in to complete your profile setup.' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const parsed = profileSetupSchema.safeParse(body);

    if (!parsed.success) {
      const issue = parsed.error.issues[0]?.message ?? 'Invalid profile input.';
      return NextResponse.json({ error: issue }, { status: 400 });
    }

    const { name, mobileNumber, gender, age, state, aboutMe } = parsed.data;

    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: session.id },
        data: {
          name,
          mobileNumber,
          gender,
          age,
          state,
          aboutMe: aboutMe || null,
          isProfileComplete: true,
          // Award 100 XP bonus for completing onboarding profile if not already done
          ...(session.isProfileComplete ? {} : { xp: { increment: 100 } }),
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isProfileComplete: true,
          mobileNumber: true,
          gender: true,
          age: true,
          state: true,
          aboutMe: true,
          xp: true,
        },
      });

      await tx.activityLog.create({
        data: {
          userId: session.id,
          action: 'PROFILE_SETUP_COMPLETED',
          entity: 'User',
          entityId: session.id,
          details: { state, age, gender },
        },
      });

      return user;
    });

    return NextResponse.json({
      success: true,
      message: 'Profile completed successfully! Welcome to your learning space.',
      user: updatedUser,
    });
  } catch (error) {
    console.error('[ProfileSetup API] Error updating profile:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while saving your profile.' },
      { status: 500 }
    );
  }
}
