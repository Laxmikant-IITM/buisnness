/**
 * @file apps/web/src/app/api/exam-platform/exams/[id]/events/route.ts
 * @description Telemetry receiver for client proctoring events.
 *
 * Telemetry Tracked:
 * - `blur`: Candidate switched window or browser tab.
 * - `fullscreen_exit`: Candidate cancelled mandatory full-screen lockdown.
 * - `visibility_hidden`: Browser tab was minimized or placed in background.
 *
 * Infraction State Machine:
 * - Idempotently logs unique client event IDs.
 * - Increments session warnings counter.
 * - If warnings reach (exam.maxWarnings + session.warningAllowance), the session is
 *   automatically transition to 'LOCKED', disabling further answer entry.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

interface RouteContext {
  params: { id: string };
}

const clientEventSchema = z.object({
  clientEventId: z.string().trim().min(5).max(100),
  type: z.enum(['blur', 'fullscreen_exit', 'visibility_hidden', 'devtools_opened', 'window_resize']),
  occurredAt: z.string().datetime().optional(),
});

export async function POST(req: Request, { params }: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const examId = params.id;
  const body = await req.json().catch(() => null);
  const parsed = clientEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid telemetry payload', details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { clientEventId, type, occurredAt } = parsed.data;

  // Verify exam and candidate session
  const [exam, candidateSession] = await Promise.all([
    prisma.proctoredExam.findUnique({
      where: { id: examId },
      select: { id: true, maxWarnings: true, status: true },
    }),
    prisma.proctoredExamSession.findUnique({
      where: {
        examId_userId: {
          examId,
          userId: session.userId,
        },
      },
    }),
  ]);

  if (!exam) {
    return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
  }

  if (!candidateSession) {
    return NextResponse.json({ error: 'Candidate session not found' }, { status: 404 });
  }

  // If already submitted, no telemetry required
  if (candidateSession.status === 'SUBMITTED') {
    return NextResponse.json({
      success: true,
      warnings: candidateSession.warnings,
      isLocked: false,
      isSubmitted: true,
    });
  }

  // Idempotency check: Ignore duplicate event reports
  const existingEvent = await prisma.proctoredExamEvent.findUnique({
    where: { clientEventId },
  });

  if (existingEvent) {
    const totalAllowed = exam.maxWarnings + candidateSession.warningAllowance;
    return NextResponse.json({
      success: true,
      warnings: candidateSession.warnings,
      maxWarnings: totalAllowed,
      isLocked: candidateSession.status === 'LOCKED',
    });
  }

  // Record event and update session infraction counter atomically
  const result = await prisma.$transaction(async (tx) => {
    await tx.proctoredExamEvent.create({
      data: {
        examId,
        userId: session.userId,
        clientEventId,
        type,
        occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
      },
    });

    const newWarnings = candidateSession.warnings + 1;
    const totalAllowed = exam.maxWarnings + candidateSession.warningAllowance;
    const shouldLock = newWarnings >= totalAllowed;

    const updatedSession = await tx.proctoredExamSession.update({
      where: { id: candidateSession.id },
      data: {
        warnings: newWarnings,
        ...(shouldLock && candidateSession.status !== 'LOCKED' ? { status: 'LOCKED' } : {}),
      },
      select: {
        warnings: true,
        warningAllowance: true,
        status: true,
      },
    });

    if (shouldLock && candidateSession.status !== 'LOCKED') {
      await tx.proctoredExamAuditLog.create({
        data: {
          examId,
          actorId: session.userId,
          event: 'CANDIDATE_AUTO_LOCKED',
          details: {
            reason: `Infraction warning threshold (${totalAllowed}) reached by event: ${type}`,
            totalWarnings: newWarnings,
          },
        },
      });
    }

    return {
      warnings: updatedSession.warnings,
      totalAllowed,
      isLocked: updatedSession.status === 'LOCKED',
    };
  });

  return NextResponse.json({
    success: true,
    warnings: result.warnings,
    maxWarnings: result.totalAllowed,
    isLocked: result.isLocked,
  });
}
