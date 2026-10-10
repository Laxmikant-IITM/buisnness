import { NextResponse } from 'next/server';
import { canManageCourse, getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

/** Freeze question wording and answer keys before exposing a quiz to learners. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ quizId: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { quizId } = await params;
  const current = await prisma.quiz.findUnique({ where: { id: quizId }, select: { id: true, courseId: true, status: true } });
  if (!current) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
  if (!(await canManageCourse(session.userId, session.role, current.courseId))) {
    return NextResponse.json({ error: 'Course management access denied' }, { status: 403 });
  }
  try {
    await prisma.$transaction(async (tx) => {
      // Item replacement takes the same lock. We read, snapshot, and publish while holding it.
      const locked = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT "id" FROM "Quiz"
        WHERE "id" = ${quizId} AND "status" = 'DRAFT'
        FOR UPDATE
      `);
      if (!locked.length) throw new PublishError('Quiz is no longer a draft.', 409);
      const quiz = await tx.quiz.findUnique({
        where: { id: quizId },
        include: { items: { include: { question: { include: { choices: { orderBy: { order: 'asc' } } } } } } },
      });
      if (!quiz || quiz.items.length === 0) throw new PublishError('Add at least one question before publishing.', 400);

      const snapshots: Array<{ id: string; questionSnapshot: Prisma.InputJsonValue }> = [];
      for (const item of quiz.items) {
        const question = item.question;
        if (!question || question.courseId !== quiz.courseId || question.status === 'ARCHIVED') {
          throw new PublishError('A quiz question is unavailable or outside this course.', 400);
        }
        const correctCount = question.choices.filter((choice) => choice.isCorrect).length;
        const validChoiceSet = question.type === 'MULTIPLE_CHOICE_MULTI'
          ? question.choices.length >= 2 && correctCount > 0 && correctCount < question.choices.length
          : question.choices.length >= 2 && correctCount === 1;
        if (!validChoiceSet || !['MULTIPLE_CHOICE_SINGLE', 'MULTIPLE_CHOICE_MULTI', 'TRUE_FALSE'].includes(question.type) ||
          (question.type === 'TRUE_FALSE' && question.choices.length !== 2)) {
          throw new PublishError(`Question ${question.id} has an unsupported type or invalid correct-choice configuration.`, 400);
        }
        snapshots.push({
          id: item.id,
          questionSnapshot: {
            type: question.type,
            prompt: question.prompt,
            explanation: question.explanation,
            choices: question.choices.map(({ id, text, isCorrect }) => ({ id, text, isCorrect })),
          },
        });
      }

      for (const snapshot of snapshots) {
        await tx.quizItem.update({ where: { id: snapshot.id }, data: { questionSnapshot: snapshot.questionSnapshot } });
      }
      await tx.quiz.update({ where: { id: quizId }, data: { status: 'PUBLISHED', publishedAt: new Date() } });
    }, { isolationLevel: 'Serializable' });
  } catch (error) {
    if (error instanceof PublishError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Quiz changed while publishing. Reload and retry.' }, { status: 409 });
  }
  return NextResponse.json({ success: true, status: 'PUBLISHED' });
}

class PublishError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}
