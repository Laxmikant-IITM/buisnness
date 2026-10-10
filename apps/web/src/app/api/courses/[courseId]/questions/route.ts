import { NextResponse } from 'next/server';
import { canAccessCourse, canManageCourse, getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { questionInputSchema } from '@/lib/quiz-contracts';

/** Course question bank. Correct answers are visible only to assigned staff. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { courseId } = await params;
  if (!(await canAccessCourse(session.userId, session.role, courseId))) {
    return NextResponse.json({ error: 'Course access denied' }, { status: 403 });
  }
  const questions = await prisma.question.findMany({
    where: { courseId, status: { not: 'ARCHIVED' } },
    orderBy: { updatedAt: 'desc' },
    include: { choices: { orderBy: { order: 'asc' } } },
  });
  const staffCanSeeKeys = session.role !== 'STUDENT';
  return NextResponse.json({ questions: questions.map((question) => ({
    ...question,
    choices: question.choices.map(({ isCorrect, ...choice }) => ({
      ...choice,
      ...(staffCanSeeKeys ? { isCorrect } : {}),
    })),
  })) });
}

/** Create questions only inside courses the caller manages. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { courseId } = await params;
  if (!(await canManageCourse(session.userId, session.role, courseId))) {
    return NextResponse.json({ error: 'Course management access denied' }, { status: 403 });
  }
  const parsed = questionInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid question', details: parsed.error.flatten() }, { status: 400 });
  const input = parsed.data;
  const question = await prisma.question.create({
    data: {
      courseId,
      createdById: session.userId,
      type: input.type,
      prompt: input.prompt,
      explanation: input.explanation ?? null,
      difficulty: input.difficulty ?? null,
      tags: input.tags,
      choices: { create: input.choices.map((choice, order) => ({ ...choice, order })) },
    },
    include: { choices: { orderBy: { order: 'asc' } } },
  });
  return NextResponse.json({ question }, { status: 201 });
}
