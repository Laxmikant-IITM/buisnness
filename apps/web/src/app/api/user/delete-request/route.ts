/**
 * Account Deletion Request API Route
 * Module: User Management & Privacy (apps/web/src/app/api/user/delete-request/route.ts)
 *
 * Implements self-service account deletion with a mandatory 24-hour grace period:
 * - POST: Queues a new deletion request in AccountDeletionRequest with status PENDING.
 * - DELETE: Allows the authenticated user to cancel an active pending deletion request during the grace period.
 * - Enforces audit logging and creates alert notifications for compliance.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getFullSession, verifyPassword } from '@/lib/auth';
import { prisma } from '@/lib/db';

const deleteRequestSchema = z.object({
  reason: z.string().trim().min(5, 'Please provide a reason of at least 5 characters.').max(200),
  details: z.string().trim().max(1000).optional(),
  password: z.string().optional(),
});

/**
 * Submits a new self-service account deletion request with a 24-hour grace period.
 *
 * @param request - HTTP POST request with reason and optional details.
 * @returns JSON response with deletion schedule metadata.
 */
export async function POST(request: Request) {
  const session = await getFullSession();
  if (!session) {
    return NextResponse.json({ error: 'Sign in to manage your account.' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const parsed = deleteRequestSchema.safeParse(body);

    if (!parsed.success) {
      const issue = parsed.error.issues[0]?.message ?? 'Invalid request parameters.';
      return NextResponse.json({ error: issue }, { status: 400 });
    }

    const { reason, details, password } = parsed.data;

    // Check if user has an existing active pending request
    const existingActive = await prisma.accountDeletionRequest.findFirst({
      where: {
        userId: session.id,
        status: 'PENDING',
        gracePeriodEndsAt: { gt: new Date() },
      },
    });

    if (existingActive) {
      return NextResponse.json(
        {
          error: 'An account deletion request is already pending.',
          gracePeriodEndsAt: existingActive.gracePeriodEndsAt,
        },
        { status: 409 }
      );
    }

    // If account has password, verify it if supplied
    const fullUser = await prisma.user.findUnique({
      where: { id: session.id },
      select: { passwordHash: true },
    });

    if (fullUser?.passwordHash && password) {
      const valid = await verifyPassword(password, fullUser.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: 'Incorrect password provided.' }, { status: 400 });
      }
    }

    // 24-hour grace period
    const gracePeriodEndsAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const deletionRequest = await prisma.$transaction(async (tx) => {
      const req = await tx.accountDeletionRequest.create({
        data: {
          userId: session.id,
          reason,
          details: details || null,
          status: 'PENDING',
          gracePeriodEndsAt,
        },
      });

      // Issue notification to student
      await tx.notification.create({
        data: {
          userId: session.id,
          title: 'Account Deletion Requested',
          body: `Your account deletion request is queued with a 24-hour grace period ending on ${gracePeriodEndsAt.toUTCString()}. You may cancel it anytime from your profile before then.`,
          type: 'GENERAL',
          link: '/profile',
        },
      });

      // Audit log
      await tx.activityLog.create({
        data: {
          userId: session.id,
          action: 'ACCOUNT_DELETION_REQUESTED',
          entity: 'AccountDeletionRequest',
          entityId: req.id,
          details: { reason, gracePeriodEndsAt: gracePeriodEndsAt.toISOString() },
        },
      });

      return req;
    });

    return NextResponse.json({
      success: true,
      requestId: deletionRequest.id,
      gracePeriodEndsAt: deletionRequest.gracePeriodEndsAt,
      message: 'Account deletion request received. You have 24 hours to cancel this request before processing begins.',
    });
  } catch (error) {
    console.error('[DeleteRequest API] Error processing deletion request:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while scheduling account deletion.' },
      { status: 500 }
    );
  }
}

/**
 * Cancels a pending account deletion request within the 24-hour grace period.
 *
 * @returns JSON response confirming cancellation.
 */
export async function DELETE() {
  const session = await getFullSession();
  if (!session) {
    return NextResponse.json({ error: 'Sign in to manage your account.' }, { status: 401 });
  }

  try {
    const pendingRequest = await prisma.accountDeletionRequest.findFirst({
      where: {
        userId: session.id,
        status: 'PENDING',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!pendingRequest) {
      return NextResponse.json({ error: 'No pending deletion request found to cancel.' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.accountDeletionRequest.update({
        where: { id: pendingRequest.id },
        data: { status: 'CANCELLED' },
      });

      await tx.notification.create({
        data: {
          userId: session.id,
          title: 'Account Deletion Cancelled',
          body: 'Your account deletion request has been cancelled. Your profile, courses, and data remain safe.',
          type: 'GENERAL',
          link: '/profile',
        },
      });

      await tx.activityLog.create({
        data: {
          userId: session.id,
          action: 'ACCOUNT_DELETION_CANCELLED',
          entity: 'AccountDeletionRequest',
          entityId: pendingRequest.id,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Your account deletion request has been successfully cancelled.',
    });
  } catch (error) {
    console.error('[DeleteRequest API] Error cancelling request:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while cancelling your deletion request.' },
      { status: 500 }
    );
  }
}
