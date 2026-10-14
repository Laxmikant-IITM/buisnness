/**
 * @file apps/web/src/app/api/exam-platform/exams/[id]/submit/route.ts
 * @description Final candidate exam submission and automated grading pipeline.
 *
 * Grading Algorithm & Security:
 * - Grades responses strictly against the immutable `exam.questions` frozen snapshot.
 * - Handles MULTIPLE_CHOICE_SINGLE, MULTIPLE_CHOICE_MULTI, TRUE_FALSE, and NUMERICAL (with tolerance).
 * - Computes total earned score, max points, percentage, and per-item breakdown.
 * - Enforces exam results privacy: detailed breakdown is only shown to the candidate if
 *   `exam.resultsPublished` is true; otherwise only submission confirmation is released.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

interface RouteContext {
  params: { id: string };
}

const submitSchema = z.object({
  finalAnswers: z.record(z.string(), z.unknown()).optional(),
});

interface QuestionSnapshot {
  id: string;
  order: number;
  prompt: string;
  type: 'MULTIPLE_CHOICE_SINGLE' | 'MULTIPLE_CHOICE_MULTI' | 'TRUE_FALSE' | 'NUMERICAL';
  points: number;
  choices?: Array<{ id: string; text: string; isCorrect: boolean }>;
  numericalAnswer?: number | null;
  numericalTolerance?: number | null;
}

export async function POST(req: Request, { params }: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const examId = params.id;
  const body = await req.json().catch(() => ({}));
  const parsed = submitSchema.safeParse(body);
  const finalAnswersInput = parsed.success ? parsed.data.finalAnswers : undefined;

  // Retrieve exam and candidate session
  const [exam, candidateSession] = await Promise.all([
    prisma.proctoredExam.findUnique({
      where: { id: examId },
      select: {
        id: true,
        status: true,
        resultsPublished: true,
        questions: true,
      },
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
    return NextResponse.json({ error: 'No active session found for this exam' }, { status: 404 });
  }

  // Idempotent: If already submitted, return recorded outcome
  if (candidateSession.status === 'SUBMITTED') {
    return NextResponse.json({
      success: true,
      alreadySubmitted: true,
      submittedAt: candidateSession.submittedAt,
      score: exam.resultsPublished ? candidateSession.score : null,
      totalMarks: exam.resultsPublished ? candidateSession.totalMarks : null,
      resultsPublished: exam.resultsPublished,
    });
  }

  const frozenQuestions = (exam.questions as unknown as QuestionSnapshot[]) || [];
  const candidateAnswers = (finalAnswersInput || candidateSession.answers || {}) as Record<string, unknown>;

  let totalEarnedScore = 0;
  let totalPossibleMarks = 0;
  const breakdown: Array<{
    questionId: string;
    order: number;
    pointsEarned: number;
    maxPoints: number;
    isCorrect: boolean;
  }> = [];

  for (const q of frozenQuestions) {
    const qPoints = q.points || 1;
    totalPossibleMarks += qPoints;

    const answer = candidateAnswers[q.id];
    let isCorrect = false;

    if (q.type === 'MULTIPLE_CHOICE_SINGLE' || q.type === 'TRUE_FALSE') {
      const correctChoice = q.choices?.find((c) => c.isCorrect);
      // Support string choice ID or single element array
      const selectedId = Array.isArray(answer) ? answer[0] : answer;
      if (correctChoice && selectedId === correctChoice.id) {
        isCorrect = true;
      }
    } else if (q.type === 'MULTIPLE_CHOICE_MULTI') {
      const selectedIds = Array.isArray(answer)
        ? (answer as string[])
        : typeof answer === 'string'
        ? [answer]
        : [];
      const correctIds = (q.choices || []).filter((c) => c.isCorrect).map((c) => c.id);

      // Candidate must select all correct choices and zero incorrect choices
      const selectedSet = new Set(selectedIds);
      const correctSet = new Set(correctIds);

      if (
        selectedSet.size === correctSet.size &&
        [...selectedSet].every((id) => correctSet.has(id))
      ) {
        isCorrect = true;
      }
    } else if (q.type === 'NUMERICAL') {
      const numAnswer = typeof answer === 'number' ? answer : parseFloat(String(answer));
      if (!isNaN(numAnswer) && q.numericalAnswer !== null && q.numericalAnswer !== undefined) {
        const tolerance = q.numericalTolerance ?? 0.001;
        if (Math.abs(numAnswer - q.numericalAnswer) <= tolerance) {
          isCorrect = true;
        }
      }
    }

    const pointsEarned = isCorrect ? qPoints : 0;
    totalEarnedScore += pointsEarned;

    breakdown.push({
      questionId: q.id,
      order: q.order,
      pointsEarned,
      maxPoints: qPoints,
      isCorrect,
    });
  }

  const submittedAt = new Date();

  // Commit graded submission and audit log atomically
  await prisma.$transaction(async (tx) => {
    await tx.proctoredExamSession.update({
      where: { id: candidateSession.id },
      data: {
        status: 'SUBMITTED',
        submittedAt,
        score: totalEarnedScore,
        totalMarks: totalPossibleMarks,
        scoreBreakdown: breakdown as any,
        answers: candidateAnswers as any,
      },
    });

    await tx.proctoredExamAuditLog.create({
      data: {
        examId,
        actorId: session.userId,
        event: 'CANDIDATE_SUBMITTED',
        details: {
          score: totalEarnedScore,
          totalMarks: totalPossibleMarks,
          answeredCount: Object.keys(candidateAnswers).length,
        },
      },
    });
  });

  return NextResponse.json({
    success: true,
    submittedAt: submittedAt.toISOString(),
    score: exam.resultsPublished ? totalEarnedScore : null,
    totalMarks: exam.resultsPublished ? totalPossibleMarks : null,
    scoreBreakdown: exam.resultsPublished ? breakdown : null,
    resultsPublished: exam.resultsPublished,
  });
}
