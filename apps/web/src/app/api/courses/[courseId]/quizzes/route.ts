import { NextResponse } from 'next/server';
import { canAccessCourse, canManageCourse, getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { quizInputSchema } from '@/lib/quiz-contracts';

/** List published learner quizzes or the course's draft workspace for staff. */
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
  const staff = session.role !== 'STUDENT';
  const quizzes = await prisma.quiz.findMany({
    where: { courseId, ...(staff ? {} : { status: 'PUBLISHED' }) },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, title: true, description: true, status: true, timeLimitSeconds: true,
      maxAttempts: true, passMarkPercent: true, publishedAt: true, createdAt: true,
      _count: { select: { items: true } },
    },
  });
  return NextResponse.json({ quizzes });
}

/** Managers and assigned admins may create a quiz; instructors are read-only. */
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
  const parsed = quizInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid quiz', details: parsed.error.flatten() }, { status: 400 });
  const quiz = await prisma.quiz.create({
    data: { ...parsed.data, courseId, createdById: session.userId },
    select: { id: true, title: true, description: true, status: true, createdAt: true },
  });
  return NextResponse.json({ quiz }, { status: 201 });
}
