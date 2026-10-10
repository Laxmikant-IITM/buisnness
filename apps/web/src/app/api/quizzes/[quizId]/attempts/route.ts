import { NextResponse } from 'next/server';
import { canAccessCourse, getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

/** Start an attempt only for an enrolled learner and a published quiz. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ quizId: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'STUDENT') return NextResponse.json({ error: 'Only students can start quiz attempts.' }, { status: 403 });
  const { quizId } = await params;
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { items: { select: { id: true, points: true, questionSnapshot: true }, orderBy: { order: 'asc' } } },
  });
  if (!quiz || quiz.status !== 'PUBLISHED') return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
  if (!(await canAccessCourse(session.userId, session.role, quiz.courseId))) {
    return NextResponse.json({ error: 'Published course enrollment required.' }, { status: 403 });
  }

  try {
    const attempt = await prisma.$transaction(async (tx) => {
      const count = await tx.quizAttempt.count({ where: { quizId, userId: session.userId } });
      if (quiz.maxAttempts !== null && count >= quiz.maxAttempts) return null;
      return tx.quizAttempt.create({
        data: {
          quizId,
          userId: session.userId,
          attemptNumber: count + 1,
          possiblePoints: quiz.items.reduce((sum, item) => sum + item.points, 0),
          presentationOrder: createPresentationOrder(quiz.items, quiz.shuffleQuestions, quiz.shuffleChoices),
        },
        select: { id: true, attemptNumber: true, status: true, startedAt: true, possiblePoints: true },
      });
    }, { isolationLevel: 'Serializable' });
    if (!attempt) return NextResponse.json({ error: 'Maximum attempts reached.' }, { status: 409 });
    return NextResponse.json({ attempt }, { status: 201 });
  } catch {
    // Concurrent starts can race the attempt-number unique key; clients can safely retry.
    return NextResponse.json({ error: 'Could not start attempt. Please retry.' }, { status: 409 });
  }
}

function createPresentationOrder(
  items: Array<{ id: string; questionSnapshot: unknown; points: number }>,
  shuffleQuestions: boolean,
  shuffleChoices: boolean,
) {
  const entries = items.map((item) => {
    const snapshot = item.questionSnapshot as { choices?: Array<{ id: string }> } | null;
    const choiceIds = (snapshot?.choices ?? []).map((choice) => choice.id);
    return { itemId: item.id, choiceIds: shuffleChoices ? shuffle(choiceIds) : choiceIds };
  });
  return shuffleQuestions ? shuffle(entries) : entries;
}

function shuffle<T>(values: T[]): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}
