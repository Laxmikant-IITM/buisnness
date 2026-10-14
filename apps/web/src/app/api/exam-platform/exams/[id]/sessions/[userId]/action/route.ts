/**
 * @file apps/web/src/app/api/exam-platform/exams/[id]/sessions/[userId]/action/route.ts
 * @description Manager moderation controls for individual candidate exam sessions.
 *
 * Supported Actions:
 * - `UNLOCK`: Re-activates a locked candidate session after review.
 * - `LOCK`: Manually locks a suspicious candidate session.
 * - `GRANT_WARNING_ALLOWANCE`: Extends warning budget (e.g. for false positives/flaky setups) and unlocks.
 * - `RESET_WARNINGS`: Clears accrued warnings to zero.
 * - `FORCE_SUBMIT`: Concludes the candidate's exam immediately with current answers.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSession, isPlatformManager } from '@/lib/auth';

interface RouteContext {
  params: {
    id: string;
    userId: string;
  };
}

const managerActionSchema = z.object({
  action: z.enum(['LOCK', 'UNLOCK', 'GRANT_WARNING_ALLOWANCE', 'RESET_WARNINGS', 'FORCE_SUBMIT']),
  allowanceIncrement: z.number().int().min(1).max(10).optional().default(1),
  reason: z.string().trim().min(2).max(500),
});

export async function POST(req: Request, { params }: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isPlatformManager(session.role)) {
    return NextResponse.json({ error: 'Forbidden: Platform manager credentials required' }, { status: 403 });
  }

  const { id: examId, userId: candidateUserId } = params;
  const body = await req.json().catch(() => null);
  const parsed = managerActionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid moderation action', details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { action, allowanceIncrement, reason } = parsed.data;

  // Retrieve candidate session
  const candidateSession = await prisma.proctoredExamSession.findUnique({
    where: {
      examId_userId: {
        examId,
        userId: candidateUserId,
      },
    },
  });

  if (!candidateSession) {
    return NextResponse.json({ error: 'Candidate session not found' }, { status: 404 });
  }

  const updatedSession = await prisma.$transaction(async (tx) => {
    let updateData: Record<string, unknown> = {};

    switch (action) {
      case 'UNLOCK':
        updateData = { status: 'IN_EXAM' };
        break;

      case 'LOCK':
        updateData = { status: 'LOCKED' };
        break;

      case 'GRANT_WARNING_ALLOWANCE':
        updateData = {
          warningAllowance: candidateSession.warningAllowance + allowanceIncrement,
          // If candidate was locked, automatically restore access
          status: candidateSession.status === 'LOCKED' ? 'IN_EXAM' : candidateSession.status,
        };
        break;

      case 'RESET_WARNINGS':
        updateData = {
          warnings: 0,
          status: candidateSession.status === 'LOCKED' ? 'IN_EXAM' : candidateSession.status,
        };
        break;

      case 'FORCE_SUBMIT':
        updateData = {
          status: 'SUBMITTED',
          submittedAt: new Date(),
        };
        break;
    }

    const updated = await tx.proctoredExamSession.update({
      where: { id: candidateSession.id },
      data: updateData,
      select: {
        id: true,
        userId: true,
        status: true,
        warnings: true,
        warningAllowance: true,
        submittedAt: true,
      },
    });

    // Record manager action in audit log
    await tx.proctoredExamAuditLog.create({
      data: {
        examId,
        actorId: session.userId,
        event: `MANAGER_${action}`,
        details: {
          candidateUserId,
          reason,
          allowanceIncrement: action === 'GRANT_WARNING_ALLOWANCE' ? allowanceIncrement : undefined,
          previousStatus: candidateSession.status,
          newStatus: updated.status,
        },
      },
    });

    return updated;
  });

  return NextResponse.json({
    success: true,
    action,
    session: updatedSession,
  });
}
