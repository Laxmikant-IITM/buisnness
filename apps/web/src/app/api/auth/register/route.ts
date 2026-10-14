/**
 * User Registration API Route
 * Module: Authentication (apps/web/src/app/api/auth/register/route.ts)
 *
 * Handles account creation supporting both email + password and OTP-based verification.
 * Automatically assigns default STUDENT role, generates unique securityNumber and
 * referralCode, initiates onboarding sequence, records audit trails, and returns
 * an authenticated session.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import {
  createSessionToken,
  generateReferralCode,
  generateSecurityNumber,
  hashPassword,
  roleForVerifiedGoogleEmail,
  SESSION_COOKIE,
} from '@/lib/auth';
import { verifyOtp, generateOtp } from '@/lib/otp';
import { processNewStudentOnboarding } from '@/lib/onboarding';

const registerSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address.').max(254),
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(100).optional(),
  password: z.string().min(8, 'Password must be at least 8 characters.').max(128).optional(),
  authType: z.enum(['password', 'otp']).default('password'),
  otpCode: z.string().trim().length(6, 'Verification code must be 6 digits.').optional(),
  referralCode: z.string().trim().max(10).optional(),
});

/**
 * Handles student registration.
 *
 * @param request - HTTP POST request with user registration payload.
 * @returns JSON response containing session status or OTP challenge.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message ?? 'Invalid registration details.';
      return NextResponse.json({ error: firstIssue }, { status: 400 });
    }

    const { email: rawEmail, name: rawName, password, authType, otpCode, referralCode: inputRefCode } = parsed.data;
    const email = rawEmail.toLowerCase();
    const defaultName = rawName || email.split('@')[0];

    // Check if account already exists
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true, isActive: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email address already exists. Please sign in instead.' },
        { status: 409 }
      );
    }

    // Handle OTP registration branch
    if (authType === 'otp') {
      if (!otpCode) {
        // Step 1: User requested OTP for registration
        try {
          const otpResult = await generateOtp({
            email,
            purpose: 'REGISTRATION',
            metadata: { name: defaultName, referralCode: inputRefCode },
          });

          return NextResponse.json({
            success: true,
            otpSent: true,
            expiresAt: otpResult.expiresAt,
            message: 'A 6-digit verification code has been dispatched to your email address.',
          });
        } catch (otpErr) {
          const message = otpErr instanceof Error ? otpErr.message : 'Unable to generate verification code.';
          return NextResponse.json({ error: message }, { status: 429 });
        }
      } else {
        // Step 2: User supplied OTP for registration
        const verification = await verifyOtp({
          email,
          code: otpCode,
          purpose: 'REGISTRATION',
          consume: true,
        });

        if (!verification.success) {
          return NextResponse.json({ error: verification.error ?? 'Invalid verification code.' }, { status: 400 });
        }
      }
    } else {
      // Password branch: ensure password is provided
      if (!password) {
        return NextResponse.json({ error: 'A secure password of at least 8 characters is required.' }, { status: 400 });
      }
    }

    // Validate referrer if referral code provided
    let referrerId: string | null = null;
    if (inputRefCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: inputRefCode.trim().toUpperCase() },
        select: { id: true },
      });
      if (referrer) {
        referrerId = referrer.id;
      }
    }

    // Generate guaranteed unique security tracking ID and 5-char referral code
    let securityNumber = generateSecurityNumber();
    let referralCode = generateReferralCode();

    // Check for collisions defensively
    for (let i = 0; i < 3; i++) {
      const [secExists, refExists] = await Promise.all([
        prisma.user.findUnique({ where: { securityNumber }, select: { id: true } }),
        prisma.user.findUnique({ where: { referralCode }, select: { id: true } }),
      ]);
      if (!secExists && !refExists) break;
      if (secExists) securityNumber = generateSecurityNumber();
      if (refExists) referralCode = generateReferralCode();
    }

    const passwordHash = password ? await hashPassword(password) : null;
    const initialRole = roleForVerifiedGoogleEmail(email);

    // Create the User in database
    const user = await prisma.user.create({
      data: {
        email,
        name: defaultName,
        passwordHash,
        role: initialRole,
        isActive: true,
        isProfileComplete: false,
        hasSeenWelcome: false,
        securityNumber,
        referralCode,
        walletBalance: referrerId ? 2500 : 0, // 2500 coins bonus if referred
        xp: 100, // 100 registration XP
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tokenVersion: true,
        securityNumber: true,
        referralCode: true,
        isProfileComplete: true,
      },
    });

    // Credit referrer with referral count increment and coins if applicable
    if (referrerId) {
      await prisma.user.update({
        where: { id: referrerId },
        data: {
          lifetimeReferrals: { increment: 1 },
          quarterlyReferrals: { increment: 1 },
          walletBalance: { increment: 5000 }, // 5000 coins for referrer
        },
      }).catch((e) => console.warn('[Register] Referrer reward update failed:', e));
    }

    // Auto-enroll into starter course and send welcome notification
    await processNewStudentOnboarding(user.id);

    // Log the registration event into LoginLog
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

    await prisma.loginLog.create({
      data: {
        userId: user.id,
        authMethod: authType === 'otp' ? 'otp' : 'email',
        userAgent: userAgent.slice(0, 500),
        ipAddress: ipAddress.slice(0, 45),
      },
    }).catch((e) => console.warn('[Register] LoginLog write failed:', e));

    // Sign session token and set HttpOnly cookie
    const token = await createSessionToken(
      { userId: user.id, email: user.email, role: user.role },
      user.tokenVersion
    );

    const response = NextResponse.json({
      success: true,
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
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('[Register API] Registration failure:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during registration. Please try again.' },
      { status: 500 }
    );
  }
}
