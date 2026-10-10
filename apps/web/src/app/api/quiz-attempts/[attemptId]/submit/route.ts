import { NextResponse } from 'next/server';
import { canAccessCourse, getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { submitAttemptSchema, type QuestionSnapshot } from '@/lib/quiz-contracts';
import { Prisma } from '@prisma/client';

/** Grade and close an attempt on the server; clients never submit scores. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'STUDENT') return NextResponse.json({ error: 'Only students can submit quiz attempts.' }, { status: 403 });
  const parsed = submitAttemptSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid answers', details: parsed.error.flatten() }, { status: 400 });
  const { attemptId } = await params;
  const attempt = await prisma.quizAttempt.findFirst({
    where: { id: attemptId, userId: session.userId },
    include: { quiz: { include: { items: { orderBy: { order: 'asc' } } } } },
  });
  if (!attempt) return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
  if (attempt.status !== 'IN_PROGRESS') return NextResponse.json({ error: 'Attempt is already closed.' }, { status: 409 });
  if (!(await canAccessCourse(session.userId, session.role, attempt.quiz.courseId))) {
    return NextResponse.json({ error: 'Published course enrollment required.' }, { status: 403 });
  }

  const submitted = parsed.data.answers;
  if (new Set(submitted.map((answer) => answer.quizItemId)).size !== submitted.length) {
    return NextResponse.json({ error: 'Each quiz item may be answered once.' }, { status: 400 });
  }
  const itemById = new Map(attempt.quiz.items.map((item) => [item.id, item]));
  const answers: Array<{
    quizItemId: string;
    selectedChoiceIds: string[];
    isCorrect: boolean;
    earnedPoints: number;
  }> = [];
  for (const answer of submitted) {
    const item = itemById.get(answer.quizItemId);
    const snapshot = item?.questionSnapshot as QuestionSnapshot | null;
    const singleSelect = snapshot?.type !== 'MULTIPLE_CHOICE_MULTI';
    if (!item || !snapshot || (singleSelect && answer.selectedChoiceIds.length > 1) ||
      new Set(answer.selectedChoiceIds).size !== answer.selectedChoiceIds.length) {
      return NextResponse.json({ error: 'An answer does not match this quiz.' }, { status: 400 });
    }
    const allowed = new Set(snapshot.choices.map((choice) => choice.id));
    if (answer.selectedChoiceIds.some((id) => !allowed.has(id))) {
      return NextResponse.json({ error: 'A selected choice does not belong to this question.' }, { status: 400 });
    }
    const correctIds = snapshot.choices.filter((choice) => choice.isCorrect).map((choice) => choice.id);
    const selected = [...answer.selectedChoiceIds].sort();
    const correct = selected.length === correctIds.length && selected.every((id, index) => id === [...correctIds].sort()[index]);
    answers.push({
      quizItemId: item.id,
      selectedChoiceIds: answer.selectedChoiceIds,
      isCorrect: correct,
      earnedPoints: correct ? item.points : 0,
    });
  }

  const submittedIds = new Set(submitted.map((answer) => answer.quizItemId));
  for (const item of attempt.quiz.items) {
    if (!submittedIds.has(item.id)) answers.push({ quizItemId: item.id, selectedChoiceIds: [], isCorrect: false, earnedPoints: 0 });
  }
  const earnedPoints = answers.reduce((sum, answer) => sum + answer.earnedPoints, 0);
  const possiblePoints = attempt.quiz.items.reduce((sum, item) => sum + item.points, 0);
  const percent = possiblePoints ? Math.round((earnedPoints / possiblePoints) * 100) : 0;
  const now = new Date();
  const deadline = attempt.quiz.timeLimitSeconds
    ? new Date(attempt.startedAt.getTime() + attempt.quiz.timeLimitSeconds * 1000)
    : null;
  if (deadline && now > deadline) {
    await prisma.quizAttempt.updateMany({
      where: { id: attemptId, userId: session.userId, status: 'IN_PROGRESS' },
      data: { status: 'EXPIRED', submittedAt: now },
    });
    return NextResponse.json({ error: 'Time limit has passed; this attempt is closed.' }, { status: 409 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Share the row lock with autosaves; only one operation can close or mutate this attempt at once.
      const locked = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT "id" FROM "QuizAttempt"
        WHERE "id" = ${attemptId} AND "userId" = ${session.userId} AND "status" = 'IN_PROGRESS'
        FOR UPDATE
      `);
      if (!locked.length) throw new Error('Attempt already closed.');
      const changed = await tx.quizAttempt.updateMany({
        where: { id: attemptId, userId: session.userId, status: 'IN_PROGRESS' },
        data: { status: 'SUBMITTED', submittedAt: now, earnedPoints, possiblePoints, percent },
      });
      if (changed.count !== 1) throw new Error('Attempt already closed.');
      await tx.quizAnswer.createMany({ data: answers.map((answer) => ({ attemptId, ...answer })) });
    }, { isolationLevel: 'Serializable' });
  } catch {
    return NextResponse.json({ error: 'Attempt has already been submitted.' }, { status: 409 });
  }

  return NextResponse.json({
    result: {
      status: 'SUBMITTED', earnedPoints, possiblePoints, percent,
      passed: attempt.quiz.passMarkPercent === null ? null : percent >= attempt.quiz.passMarkPercent,
      answers: answers.map((answer) => {
        const item = itemById.get(answer.quizItemId)!;
        const snapshot = item.questionSnapshot as QuestionSnapshot;
        return {
          quizItemId: answer.quizItemId,
          selectedChoiceIds: answer.selectedChoiceIds,
          isCorrect: answer.isCorrect,
          earnedPoints: answer.earnedPoints,
          correctChoiceIds: snapshot.choices.filter((choice) => choice.isCorrect).map((choice) => choice.id),
          explanation: snapshot.explanation,
        };
      }),
    },
  });
}
