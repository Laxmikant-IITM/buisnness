/**
 * @file apps/web/src/app/api/exam-platform/exams/[id]/join/route.ts
 * @description Candidate entry gate for proctored examination.
 *
 * Cheating Countermeasures & Security:
 * 1. Strictly enforces candidate whitelist enrollment from ProctoredExamEnrollment.
 * 2. Mandates explicit proctoring consent for webcam/telemetry monitoring.
 * 3. Strips answer keys and explanations from questions before sending to client.
 * 4. Initializes or resumes ProctoredExamSession with optimistic revision counter.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSession, isPlatformManager } from '@/lib/auth';

interface RouteContext {
  params: { id: string };
}

const joinExamSchema = z.object({
  consentMonitoring: z.literal(true),
});

export async function POST(req: Request, { params }: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const examId = params.id;
  const isManager = isPlatformManager(session.role);

  const body = await req.json().catch(() => ({}));
  const parsed = joinExamSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Proctoring consent required', details: parsed.error.issues },
      { status: 400 },
    );
  }

  // Fetch exam
  const exam = await prisma.proctoredExam.findUnique({
    where: { id: examId },
    select: {
      id: true,
      title: true,
      subject: true,
      instructions: true,
      durationMinutes: true,
      extensionMinutes: true,
      maxWarnings: true,
      scheduledAt: true,
      closesAt: true,
      status: true,
      questions: true,
      startedAt: true,
      pausedAt: true,
      pausedSeconds: true,
      endedAt: true,
    },
  });

  if (!exam) {
    return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
  }

  // Whitelist verification for non-managers
  if (!isManager) {
    const enrollment = await prisma.proctoredExamEnrollment.findFirst({
      where: {
        examId,
        OR: [
          { userId: session.userId },
          { email: session.email.toLowerCase() },
        ],
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Forbidden: You are not enrolled on the candidate roster for this exam.' },
        { status: 403 },
      );
    }

    // Link enrollment to candidate userId if not linked yet
    if (!enrollment.userId) {
      await prisma.proctoredExamEnrollment.update({
        where: { id: enrollment.id },
        data: { userId: session.userId },
      });
    }

    // Check if exam is within active window
    const now = new Date();
    if (exam.status === 'ARCHIVED' || exam.status === 'ENDED') {
      return NextResponse.json({ error: 'This exam has ended.' }, { status: 400 });
    }
    if (exam.closesAt && now > exam.closesAt) {
      return NextResponse.json({ error: 'Exam access window has closed.' }, { status: 400 });
    }
  }

  // Initialize or retrieve existing candidate session
  let examSession = await prisma.proctoredExamSession.findUnique({
    where: {
      examId_userId: {
        examId,
        userId: session.userId,
      },
    },
  });

  if (!examSession) {
    examSession = await prisma.proctoredExamSession.create({
      data: {
        examId,
        userId: session.userId,
        status: 'IN_EXAM',
        joinedAt: new Date(),
        revision: 0,
        answers: {},
      },
    });
  } else if (examSession.status === 'NOT_STARTED') {
    examSession = await prisma.proctoredExamSession.update({
      where: { id: examSession.id },
      data: {
        status: 'IN_EXAM',
        joinedAt: new Date(),
      },
    });
  }

  // Security: Cleanse answer keys from client question payload
  const rawQuestions = (exam.questions as Array<Record<string, unknown>>) || [];
  const sanitizedQuestions = rawQuestions.map((q) => {
    const rawChoices = (q.choices as Array<{ id: string; text: string; isCorrect?: boolean }>) || [];
    return {
      id: q.id,
      order: q.order,
      prompt: q.prompt,
      type: q.type,
      points: q.points,
      choices: rawChoices.map((c) => ({
        id: c.id,
        text: c.text,
      })),
      // Stripped for students: isCorrect, explanation, numericalAnswer, numericalTolerance
    };
  });

  return NextResponse.json({
    exam: {
      id: exam.id,
      title: exam.title,
      subject: exam.subject,
      instructions: exam.instructions,
      durationMinutes: exam.durationMinutes,
      extensionMinutes: exam.extensionMinutes,
      maxWarnings: exam.maxWarnings,
      scheduledAt: exam.scheduledAt,
      closesAt: exam.closesAt,
      status: exam.status,
      startedAt: exam.startedAt,
      questions: sanitizedQuestions,
    },
    session: {
      id: examSession.id,
      status: examSession.status,
      warnings: examSession.warnings,
      warningAllowance: examSession.warningAllowance,
      revision: examSession.revision,
      answers: examSession.answers || {},
      joinedAt: examSession.joinedAt,
      submittedAt: examSession.submittedAt,
    },
    serverTime: new Date().toISOString(),
  });
}
