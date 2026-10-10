import { NextResponse } from 'next/server';
import { canAccessCourse, getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { learnerQuestion, type QuestionSnapshot } from '@/lib/quiz-contracts';
import { submitAttemptSchema } from '@/lib/quiz-contracts';
import { Prisma } from '@prisma/client';

/** Return only the caller's attempt and never include hidden answer keys. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ attemptId: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { attemptId } = await params;
  const attempt = await prisma.quizAttempt.findFirst({
    where: { id: attemptId, userId: session.userId },
    include: { quiz: { include: { items: { orderBy: { order: 'asc' } } } }, answers: true },
  });
  if (!attempt) return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
  if (attempt.status === 'IN_PROGRESS') {
    if (!(await canAccessCourse(session.userId, session.role, attempt.quiz.courseId))) {
      return NextResponse.json({ error: 'Published course enrollment required.' }, { status: 403 });
    }
  }
  const order = attempt.presentationOrder as Array<{ itemId: string; choiceIds: string[] }> | null;
  const presentation = order ?? attempt.quiz.items.map((item) => ({ itemId: item.id, choiceIds: [] }));
  const position = new Map(presentation.map((entry, index) => [entry.itemId, index]));
  const itemById = new Map(attempt.quiz.items.map((item) => [item.id, item]));
  const questions = presentation.flatMap((entry) => {
    const item = itemById.get(entry.itemId);
    const snapshot = item?.questionSnapshot as QuestionSnapshot | null;
    if (!item || !snapshot) return [];
    const byId = new Map(snapshot.choices.map((choice) => [choice.id, choice]));
    const orderedSnapshot = {
      ...snapshot,
      choices: (entry.choiceIds.length ? entry.choiceIds : snapshot.choices.map((choice) => choice.id))
        .flatMap((id) => byId.has(id) ? [byId.get(id)!] : []),
    };
    return [{ id: item.id, ...learnerQuestion(orderedSnapshot, position.get(item.id) ?? 0, item.points) }];
  });
  const deadline = attempt.quiz.timeLimitSeconds
    ? new Date(attempt.startedAt.getTime() + attempt.quiz.timeLimitSeconds * 1000)
    : null;
  const expired = attempt.status === 'IN_PROGRESS' && Boolean(deadline && deadline <= new Date());
  return NextResponse.json({
    attempt: {
      id: attempt.id, status: attempt.status, attemptNumber: attempt.attemptNumber,
      startedAt: attempt.startedAt, deadline, expired,
      earnedPoints: attempt.status === 'SUBMITTED' ? attempt.earnedPoints : undefined,
      possiblePoints: attempt.possiblePoints,
      percent: attempt.status === 'SUBMITTED' ? attempt.percent : undefined,
      questions,
      savedAnswers: attempt.status === 'IN_PROGRESS'
        ? attempt.answers.map(({ quizItemId, selectedChoiceIds }) => ({ quizItemId, selectedChoiceIds }))
        : undefined,
    },
  });
}

/** Autosave an answer set; correctness and score are always calculated at submit time. */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'STUDENT') return NextResponse.json({ error: 'Only students can save quiz answers.' }, { status: 403 });
  const parsed = submitAttemptSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid answers', details: parsed.error.flatten() }, { status: 400 });
  const { attemptId } = await params;
  const attempt = await prisma.quizAttempt.findFirst({
    where: { id: attemptId, userId: session.userId, status: 'IN_PROGRESS' },
    include: { quiz: { include: { items: true } } },
  });
  if (!attempt) return NextResponse.json({ error: 'In-progress attempt not found' }, { status: 404 });
  const deadline = attempt.quiz.timeLimitSeconds
    ? new Date(attempt.startedAt.getTime() + attempt.quiz.timeLimitSeconds * 1000)
    : null;
  if (deadline && deadline <= new Date()) return NextResponse.json({ error: 'Time limit has passed.' }, { status: 409 });
  if (!(await canAccessCourse(session.userId, session.role, attempt.quiz.courseId))) {
    return NextResponse.json({ error: 'Published course enrollment required.' }, { status: 403 });
  }
  const itemById = new Map(attempt.quiz.items.map((item) => [item.id, item]));
  if (new Set(parsed.data.answers.map((answer) => answer.quizItemId)).size !== parsed.data.answers.length) {
    return NextResponse.json({ error: 'Each quiz item may be answered once.' }, { status: 400 });
  }
  for (const answer of parsed.data.answers) {
    const item = itemById.get(answer.quizItemId);
    const snapshot = item?.questionSnapshot as QuestionSnapshot | null;
    const singleSelect = snapshot?.type !== 'MULTIPLE_CHOICE_MULTI';
    if (!item || !snapshot || (singleSelect && answer.selectedChoiceIds.length > 1) ||
      new Set(answer.selectedChoiceIds).size !== answer.selectedChoiceIds.length ||
      answer.selectedChoiceIds.some((id) => !snapshot.choices.some((choice) => choice.id === id))) {
      return NextResponse.json({ error: 'An answer does not match this quiz.' }, { status: 400 });
    }
  }
  try {
    await prisma.$transaction(async (tx) => {
      // Serialize answer saves against submission so a delayed save cannot erase graded state.
      const locked = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT "id" FROM "QuizAttempt"
        WHERE "id" = ${attemptId} AND "userId" = ${session.userId} AND "status" = 'IN_PROGRESS'
        FOR UPDATE
      `);
      if (!locked.length) throw new Error('Attempt already closed.');
      for (const answer of parsed.data.answers) {
        await tx.quizAnswer.upsert({
          where: { attemptId_quizItemId: { attemptId, quizItemId: answer.quizItemId } },
          update: { selectedChoiceIds: answer.selectedChoiceIds, isCorrect: null, earnedPoints: 0 },
          create: { attemptId, quizItemId: answer.quizItemId, selectedChoiceIds: answer.selectedChoiceIds },
        });
      }
    }, { isolationLevel: 'Serializable' });
  } catch {
    return NextResponse.json({ error: 'Attempt closed or answer save conflicted. Reload before retrying.' }, { status: 409 });
  }
  return NextResponse.json({ success: true, savedCount: parsed.data.answers.length });
}
