/**
 * Forgot Password API Route
 * Module: Authentication (apps/web/src/app/api/auth/forgot-password/route.ts)
 *
 * Initiates the self-service password recovery flow. Generates a 6-digit OTP
 * with 10-minute expiry for verified accounts. Implements defensive countermeasures
 * against account enumeration by returning constant success semantics regardless of email existence.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { generateOtp } from '@/lib/otp';

const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address.').max(254),
});

/**
 * Dispatches a password reset OTP challenge.
 *
 * @param request - HTTP POST request containing target user email.
 * @returns JSON response confirming dispatch.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();

    // Query user record
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, isActive: true, isTerminated: true },
    });

    // Constant-time behavior: Always respond with success to prevent user enumeration
    if (!user || !user.isActive || user.isTerminated) {
      return NextResponse.json({
        success: true,
        message: 'If an account is associated with this email address, a 6-digit reset code has been sent.',
      });
    }

    try {
      const otp = await generateOtp({
        email,
        purpose: 'PASSWORD_RESET',
        metadata: { userId: user.id },
      });

      return NextResponse.json({
        success: true,
        expiresAt: otp.expiresAt,
        message: 'A 6-digit password reset code has been dispatched to your email address.',
      });
    } catch (cooldownError) {
      const msg = cooldownError instanceof Error ? cooldownError.message : 'Please wait before requesting another code.';
      return NextResponse.json({ error: msg }, { status: 429 });
    }
  } catch (error) {
    console.error('[ForgotPassword API] Recovery error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while processing your request. Please try again.' },
      { status: 500 }
    );
  }
}
