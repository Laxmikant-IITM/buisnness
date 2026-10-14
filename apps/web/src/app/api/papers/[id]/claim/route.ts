/**
 * @file apps/web/src/app/api/papers/[id]/claim/route.ts
 * @description Free paper entitlement claim endpoint.
 *
 * Verifies that the requested practice paper or mock exam is marked free,
 * then grants an active QuizEntitlement to the authenticated student.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

interface RouteContext {
  params: { id: string };
}

export async function POST(req: Request, { params }: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Sign in required to claim paper' }, { status: 401 });
  }

  const quizId = params.id;

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: {
      id: true,
      title: true,
      pricePaise: true,
      accessDays: true,
      status: true,
      courseId: true,
    },
  });

  if (!quiz) {
    return NextResponse.json({ error: 'Paper not found' }, { status: 404 });
  }

  if (quiz.pricePaise && quiz.pricePaise > 0) {
    return NextResponse.json(
      { error: 'This paper requires purchase and cannot be claimed for free.' },
      { status: 400 },
    );
  }

  // Calculate access expiry if bounded
  let expiresAt: Date | null = null;
  if (quiz.accessDays && quiz.accessDays > 0) {
    expiresAt = new Date(Date.now() + quiz.accessDays * 24 * 60 * 60 * 1000);
  }

  // Upsert entitlement
  const entitlement = await prisma.quizEntitlement.upsert({
    where: {
      userId_quizId: {
        userId: session.userId,
        quizId: quiz.id,
      },
    },
    update: {
      expiresAt,
      source: 'FREE_CLAIM',
    },
    create: {
      userId: session.userId,
      quizId: quiz.id,
      source: 'FREE_CLAIM',
      expiresAt,
    },
  });

  return NextResponse.json({
    success: true,
    entitlementId: entitlement.id,
    courseId: quiz.courseId,
    quizId: quiz.id,
    message: `Successfully claimed "${quiz.title}". You now have full practice access.`,
  });
}
