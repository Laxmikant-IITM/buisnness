/**
 * @file apps/web/src/app/api/exam-platform/exams/[id]/state/route.ts
 * @description Synchronized room state and remaining time endpoint.
 *
 * Provides real-time synchronization of candidate timers, room pause states,
 * infraction warning levels, and proctor broadcast announcements.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

interface RouteContext {
  params: { id: string };
}

export async function GET(req: Request, { params }: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const examId = params.id;

  const [exam, candidateSession, recentMessages] = await Promise.all([
    prisma.proctoredExam.findUnique({
      where: { id: examId },
      select: {
        id: true,
        status: true,
        durationMinutes: true,
        extensionMinutes: true,
        maxWarnings: true,
        startedAt: true,
        pausedAt: true,
        pausedSeconds: true,
        closesAt: true,
        endedAt: true,
      },
    }),
    prisma.proctoredExamSession.findUnique({
      where: {
        examId_userId: {
          examId,
          userId: session.userId,
        },
      },
      select: {
        id: true,
        status: true,
        warnings: true,
        warningAllowance: true,
        revision: true,
        joinedAt: true,
        submittedAt: true,
      },
    }),
    prisma.proctoredExamMessage.findMany({
      where: { examId, isAnnouncement: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        text: true,
        createdAt: true,
      },
    }),
  ]);

  if (!exam) {
    return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
  }

  const now = new Date();
  const totalAllocatedSeconds = (exam.durationMinutes + exam.extensionMinutes) * 60;

  // Calculate candidate remaining time
  let remainingSeconds = totalAllocatedSeconds;
  let isTimerRunning = false;

  if (candidateSession && candidateSession.status === 'IN_EXAM' && candidateSession.joinedAt) {
    const elapsedSeconds = Math.max(
      0,
      Math.floor((now.getTime() - new Date(candidateSession.joinedAt).getTime()) / 1000) - (exam.pausedSeconds || 0),
    );
    remainingSeconds = Math.max(0, totalAllocatedSeconds - elapsedSeconds);
    isTimerRunning = exam.status === 'LIVE' || exam.status === 'PUBLISHED';
  } else if (candidateSession?.status === 'SUBMITTED') {
    remainingSeconds = 0;
    isTimerRunning = false;
  }

  // Cap remaining seconds if exam closesAt has passed
  if (exam.closesAt && now > exam.closesAt) {
    remainingSeconds = 0;
    isTimerRunning = false;
  }

  return NextResponse.json({
    examStatus: exam.status,
    remainingSeconds,
    isTimerRunning,
    isPaused: exam.status === 'PAUSED',
    session: candidateSession
      ? {
          status: candidateSession.status,
          warnings: candidateSession.warnings,
          warningAllowance: candidateSession.warningAllowance,
          maxWarnings: exam.maxWarnings + candidateSession.warningAllowance,
          revision: candidateSession.revision,
          isLocked: candidateSession.status === 'LOCKED',
          isSubmitted: candidateSession.status === 'SUBMITTED',
        }
      : null,
    announcements: recentMessages,
    serverTime: now.toISOString(),
  });
}
