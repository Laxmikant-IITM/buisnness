/**
 * OTP Verification and Passwordless Login Route
 * Module: Authentication (apps/web/src/app/api/auth/verify-otp/route.ts)
 *
 * Verifies 6-digit OTP codes for passwordless login or registration confirmation.
 * Enforces attempt quotas, creates session cookies, writes to LoginLog, and
 * auto-provisions student accounts for first-time OTP verifications.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import {
  createSessionToken,
  generateReferralCode,
  generateSecurityNumber,
  roleForVerifiedGoogleEmail,
  SESSION_COOKIE,
} from '@/lib/auth';
import { verifyOtp, type OtpPurpose } from '@/lib/otp';
import { processNewStudentOnboarding } from '@/lib/onboarding';

const verifyOtpSchema = z.object({
  email: z.string().trim().email('Invalid email address format.').max(254),
  code: z.string().trim().length(6, 'Verification code must be exactly 6 digits.'),
  purpose: z.enum(['LOGIN', 'REGISTRATION', 'EMAIL_VERIFICATION']).default('LOGIN'),
});

/**
 * Validates the one-time code and issues a secure session token.
 *
 * @param request - HTTP POST request containing email, code, and purpose.
 * @returns JSON response with session cookie on success.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = verifyOtpSchema.safeParse(body);

    if (!parsed.success) {
      const issue = parsed.error.issues[0]?.message ?? 'Invalid code submission.';
      return NextResponse.json({ error: issue }, { status: 400 });
    }

    const { email: rawEmail, code, purpose } = parsed.data;
    const email = rawEmail.toLowerCase();

    // Verify OTP against hashed store
    const result = await verifyOtp({
      email,
      code,
      purpose: purpose as OtpPurpose,
      consume: true,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error ?? 'Invalid verification code.' }, { status: 400 });
    }

    // Find or provision user
    let user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        isTerminated: true,
        tokenVersion: true,
        isProfileComplete: true,
        securityNumber: true,
        referralCode: true,
      },
    });

    let isNewUser = false;

    if (!user) {
      // First-time OTP user: provision new STUDENT account
      isNewUser = true;
      const initialRole = roleForVerifiedGoogleEmail(email);
      const securityNumber = generateSecurityNumber();
      const referralCode = generateReferralCode();
      const defaultName = (result.metadata?.name as string) || email.split('@')[0];

      user = await prisma.user.create({
        data: {
          email,
          name: defaultName,
          role: initialRole,
          isActive: true,
          securityNumber,
          referralCode,
          walletBalance: 0,
          xp: 100,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          isTerminated: true,
          tokenVersion: true,
          isProfileComplete: true,
          securityNumber: true,
          referralCode: true,
        },
      });

      // Run onboarding sequence for new learner
      await processNewStudentOnboarding(user.id);
    } else {
      if (!user.isActive || user.isTerminated) {
        return NextResponse.json({ error: 'This account has been deactivated or terminated.' }, { status: 403 });
      }
    }

    // Log to LoginLog
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

    await prisma.loginLog.create({
      data: {
        userId: user.id,
        authMethod: 'otp',
        userAgent: userAgent.slice(0, 500),
        ipAddress: ipAddress.slice(0, 45),
      },
    }).catch((e) => console.warn('[VerifyOtp] LoginLog write failed:', e));

    // Sign session token
    const token = await createSessionToken(
      { userId: user.id, email: user.email, role: user.role },
      user.tokenVersion
    );

    const response = NextResponse.json({
      success: true,
      isNewUser,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        securityNumber: user.securityNumber,
        referralCode: user.referralCode,
        isProfileComplete: user.isProfileComplete,
      },
    });

    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error('[VerifyOtp API] Verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed due to an unexpected error. Please try again.' },
      { status: 500 }
    );
  }
}
