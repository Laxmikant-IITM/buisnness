/**
 * Password Reset Execution API Route
 * Module: Authentication (apps/web/src/app/api/auth/reset-password/route.ts)
 *
 * Verifies a 6-digit recovery OTP, updates the user's password hash, and
 * critically increments tokenVersion by 1 to instantaneously invalidate all
 * prior active sessions across all devices.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { createSessionToken, hashPassword, SESSION_COOKIE } from '@/lib/auth';
import { verifyOtp } from '@/lib/otp';

const resetPasswordSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address.').max(254),
  code: z.string().trim().length(6, 'Verification code must be 6 digits.'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters.').max(128),
});

/**
 * Validates OTP and updates user password with session invalidation.
 *
 * @param request - HTTP POST request containing email, OTP code, and new password.
 * @returns JSON response with fresh session cookie on success.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      const issue = parsed.error.issues[0]?.message ?? 'Invalid input data.';
      return NextResponse.json({ error: issue }, { status: 400 });
    }

    const { email: rawEmail, code, newPassword } = parsed.data;
    const email = rawEmail.toLowerCase();

    // 1. Verify OTP code
    const verification = await verifyOtp({
      email,
      code,
      purpose: 'PASSWORD_RESET',
      consume: true,
    });

    if (!verification.success) {
      return NextResponse.json(
        { error: verification.error ?? 'Invalid or expired reset code.' },
        { status: 400 }
      );
    }

    // 2. Fetch user
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, role: true, isActive: true, isTerminated: true, tokenVersion: true },
    });

    if (!user || !user.isActive || user.isTerminated) {
      return NextResponse.json(
        { error: 'Account not found or inactive. Please contact support.' },
        { status: 400 }
      );
    }

    // 3. Hash new password
    const passwordHash = await hashPassword(newPassword);

    // 4. Update user password and increment tokenVersion to revoke old sessions
    const updatedUser = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          tokenVersion: { increment: 1 },
        },
        select: { id: true, email: true, role: true, tokenVersion: true },
      });

      await tx.activityLog.create({
        data: {
          userId: user.id,
          action: 'PASSWORD_RESET_COMPLETED',
          entity: 'User',
          entityId: user.id,
          details: { method: 'otp_recovery' },
        },
      });

      return updated;
    });

    // 5. Issue fresh session token with incremented tokenVersion
    const newToken = await createSessionToken(
      { userId: updatedUser.id, email: updatedUser.email, role: updatedUser.role },
      updatedUser.tokenVersion
    );

    const response = NextResponse.json({
      success: true,
      message: 'Password reset successfully. All previous active sessions have been invalidated.',
    });

    response.cookies.set(SESSION_COOKIE, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error('[ResetPassword API] Execution error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while resetting your password. Please try again.' },
      { status: 500 }
    );
  }
}
