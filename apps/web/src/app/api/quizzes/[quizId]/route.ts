import { NextResponse } from 'next/server';
import { canAccessCourse, canManageCourse, getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { learnerQuestion, quizInputSchema, type QuestionSnapshot } from '@/lib/quiz-contracts';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ quizId: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { quizId } = await params;
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { items: { orderBy: { order: 'asc' }, include: { question: { include: { choices: { orderBy: { order: 'asc' } } } } } } },
  });
  if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
  if (!(await canAccessCourse(session.userId, session.role, quiz.courseId))) {
    return NextResponse.json({ error: 'Course access denied' }, { status: 403 });
  }
  const staff = session.role !== 'STUDENT';
  if (!staff && quiz.status !== 'PUBLISHED') return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
  const items = quiz.items.map((item) => {
    const source = item.questionSnapshot as QuestionSnapshot | null;
    const snapshot: QuestionSnapshot | null = source ?? (item.question ? {
      type: questionType(item.question.type),
      prompt: item.question.prompt,
      explanation: item.question.explanation,
      choices: item.question.choices.map(({ id, text, isCorrect }) => ({ id, text, isCorrect })),
    } : null);
    return {
      id: item.id,
      order: item.order,
      points: item.points,
      question: snapshot && (staff
        ? snapshot
        : learnerQuestion(snapshot, item.order, item.points)),
    };
  });
  return NextResponse.json({
    quiz: {
      id: quiz.id, courseId: quiz.courseId, title: quiz.title, description: quiz.description,
      status: quiz.status, timeLimitSeconds: quiz.timeLimitSeconds, maxAttempts: quiz.maxAttempts,
      passMarkPercent: quiz.passMarkPercent, shuffleQuestions: quiz.shuffleQuestions,
      shuffleChoices: quiz.shuffleChoices, publishedAt: quiz.publishedAt, items,
    },
  });
}

function questionType(type: string): QuestionSnapshot['type'] {
  if (type === 'MULTIPLE_CHOICE_MULTI' || type === 'TRUE_FALSE') return type;
  return 'MULTIPLE_CHOICE_SINGLE';
}

export async function PATCH(
  request: Request,
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
  if (current.status !== 'DRAFT') return NextResponse.json({ error: 'Published quizzes are immutable; create a new draft revision.' }, { status: 409 });
  const parsed = quizInputSchema.partial().safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid quiz', details: parsed.error.flatten() }, { status: 400 });
  const quiz = await prisma.quiz.update({ where: { id: quizId }, data: parsed.data });
  return NextResponse.json({ quiz });
}
