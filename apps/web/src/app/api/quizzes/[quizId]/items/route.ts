import { NextResponse } from 'next/server';
import { canManageCourse, getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { quizItemInputSchema } from '@/lib/quiz-contracts';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const itemsSchema = z.array(quizItemInputSchema).min(1).max(500)
  .refine((items) => new Set(items.map((item) => item.order)).size === items.length, 'Item orders must be unique.');

/** Replace a draft quiz's ordered question list after validating course scope. */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ quizId: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { quizId } = await params;
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, select: { id: true, courseId: true, status: true } });
  if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
  if (!(await canManageCourse(session.userId, session.role, quiz.courseId))) {
    return NextResponse.json({ error: 'Course management access denied' }, { status: 403 });
  }
  if (quiz.status !== 'DRAFT') return NextResponse.json({ error: 'Published quizzes are immutable.' }, { status: 409 });
  const parsed = itemsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid quiz items', details: parsed.error.flatten() }, { status: 400 });
  const input = parsed.data;
  const questions = await prisma.question.findMany({
    where: { id: { in: input.map((item) => item.questionId) }, courseId: quiz.courseId, status: { not: 'ARCHIVED' } },
    select: { id: true },
  });
  if (questions.length !== input.length || new Set(input.map((item) => item.questionId)).size !== input.length) {
    return NextResponse.json({ error: 'Each question must be unique and belong to this course.' }, { status: 400 });
  }
  try {
    await prisma.$transaction(async (tx) => {
      // Publish uses the same quiz-row lock, making draft replacement and snapshotting mutually exclusive.
      const locked = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT "id" FROM "Quiz"
        WHERE "id" = ${quizId} AND "status" = 'DRAFT'
        FOR UPDATE
      `);
      if (!locked.length) throw new Error('Quiz is no longer a draft.');
      await tx.quizItem.deleteMany({ where: { quizId } });
      await tx.quizItem.createMany({ data: input.map((item) => ({ quizId, ...item })) });
    }, { isolationLevel: 'Serializable' });
  } catch {
    return NextResponse.json({ error: 'Quiz was published or changed while saving items. Reload and retry.' }, { status: 409 });
  }
  return NextResponse.json({ success: true, itemCount: input.length });
}
