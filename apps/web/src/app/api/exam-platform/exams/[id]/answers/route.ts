/**
 * @file apps/web/src/app/api/exam-platform/exams/[id]/answers/route.ts
 * @description Autosave answer responses with optimistic concurrency revision locking.
 *
 * Cheating & Data Integrity Defense:
 * - Prevents multiple browser tabs or flaky network re-transmissions from clobbering
 *   candidate answers using monotonic revision versioning.
 * - Rejects saves immediately if the candidate session has been LOCKED or SUBMITTED.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

interface RouteContext {
  params: { id: string };
}

const autosaveAnswersSchema = z.object({
  revision: z.number().int().min(0),
  answers: z.record(z.string(), z.unknown()),
});

export async function PATCH(req: Request, { params }: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const examId = params.id;
  const body = await req.json().catch(() => null);
  const parsed = autosaveAnswersSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid answer payload', details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { revision, answers } = parsed.data;

  // Retrieve current candidate session
  const candidateSession = await prisma.proctoredExamSession.findUnique({
    where: {
      examId_userId: {
        examId,
        userId: session.userId,
      },
    },
    select: {
      id: true,
      status: true,
      revision: true,
      answers: true,
    },
  });

  if (!candidateSession) {
    return NextResponse.json({ error: 'Exam session not found' }, { status: 404 });
  }

  // Ensure candidate has not been locked out by proctor telemetry
  if (candidateSession.status === 'LOCKED') {
    return NextResponse.json(
      { error: 'Session is locked due to security infractions. Contact exam manager.' },
      { status: 423 }, // Locked
    );
  }

  if (candidateSession.status === 'SUBMITTED') {
    return NextResponse.json({ error: 'Exam has already been submitted.' }, { status: 400 });
  }

  // Optimistic concurrency check:
  // If the incoming client revision does not match the server revision, reject with 409 Conflict.
  if (candidateSession.revision !== revision) {
    return NextResponse.json(
      {
        error: 'Concurrency conflict: answers have been modified by another browser tab or session.',
        currentRevision: candidateSession.revision,
        currentAnswers: candidateSession.answers,
      },
      { status: 409 },
    );
  }

  // Save new answers and increment revision monotonically
  const updated = await prisma.proctoredExamSession.update({
    where: { id: candidateSession.id },
    data: {
      answers: answers as any,
      revision: { increment: 1 },
    },
    select: {
      revision: true,
    },
  });

  return NextResponse.json({
    success: true,
    revision: updated.revision,
    savedAt: new Date().toISOString(),
  });
}
