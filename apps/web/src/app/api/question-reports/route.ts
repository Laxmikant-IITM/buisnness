/**
 * @file apps/web/src/app/api/question-reports/route.ts
 * @description Candidate question errata and issue reporting API.
 *
 * Enables students to report typos, incorrect answer keys, unclear prompts,
 * or LaTeX rendering errors during practice or formal assessments.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSession, isPlatformManager } from '@/lib/auth';

const createReportSchema = z.object({
  questionId: z.string().trim().min(1),
  quizId: z.string().trim().optional().nullable(),
  questionNumber: z.number().int().min(1).optional().nullable(),
  reasons: z.array(z.string().trim().min(1)).min(1, 'Select at least one reason for the report'),
  comment: z.string().trim().min(5).max(3000),
});

/**
 * POST /api/question-reports
 * Creates a student errata report for a question.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createReportSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid report data', details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { questionId, quizId, questionNumber, reasons, comment } = parsed.data;

  // Verify that the question exists (or is captured in question bank)
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: { id: true },
  });

  if (!question) {
    // If it's a transient exam snapshot question, we check if quiz exists or record with questionId
    const fallbackQuiz = quizId
      ? await prisma.quiz.findUnique({ where: { id: quizId }, select: { id: true } })
      : null;

    if (!fallbackQuiz) {
      return NextResponse.json({ error: 'Referenced question not found in database' }, { status: 404 });
    }
  }

  const report = await prisma.questionReport.create({
    data: {
      questionId: question ? question.id : questionId,
      quizId: quizId || null,
      userId: session.userId,
      questionNumber: questionNumber ?? null,
      reasons,
      comment,
      status: 'OPEN',
    },
  });

  return NextResponse.json({
    success: true,
    reportId: report.id,
    message: 'Thank you! Your feedback has been queued for review by the academic team.',
  });
}

/**
 * GET /api/question-reports
 * Retrieves errata reports:
 * - Managers view all reports.
 * - Students view reports they personally submitted.
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isManager = isPlatformManager(session.role);

  const reports = await prisma.questionReport.findMany({
    where: isManager ? {} : { userId: session.userId },
    include: {
      question: {
        select: {
          prompt: true,
          type: true,
        },
      },
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json({ reports });
}
