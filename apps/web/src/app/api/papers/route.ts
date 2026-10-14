/**
 * @file apps/web/src/app/api/papers/route.ts
 * @description Practice papers catalog API.
 * Returns past year papers, term exams, and mock tests across courses.
 *
 * Scopes:
 * - Sections: 'quiz1', 'quiz2', 'endterm', 'mock_test', 'practice'
 * - Checks user entitlement state for free claims or commercial purchases.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
  const session = await getSession();
  const { searchParams } = new URL(req.url);

  const sectionFilter = searchParams.get('section');
  const courseIdFilter = searchParams.get('courseId');
  const searchQuery = searchParams.get('q');

  // Build where filter
  const whereClause: Record<string, unknown> = {
    status: 'PUBLISHED',
    approvalStatus: 'approved',
  };

  if (sectionFilter && sectionFilter !== 'all') {
    whereClause.section = sectionFilter;
  }

  if (courseIdFilter) {
    whereClause.courseId = courseIdFilter;
  }

  if (searchQuery) {
    whereClause.OR = [
      { title: { contains: searchQuery, mode: 'insensitive' } },
      { description: { contains: searchQuery, mode: 'insensitive' } },
      { course: { title: { contains: searchQuery, mode: 'insensitive' } } },
    ];
  }

  const papers = await prisma.quiz.findMany({
    where: whereClause,
    include: {
      course: {
        select: {
          id: true,
          title: true,
          subject: true,
          term: true,
        },
      },
      _count: {
        select: {
          items: true,
          attempts: true,
        },
      },
    },
    orderBy: [
      { year: 'desc' },
      { createdAt: 'desc' },
    ],
    take: 100,
  });

  // Check entitlements for logged-in user
  let userEntitlementsMap = new Map<string, { id: string; expiresAt: Date | null }>();

  if (session) {
    const entitlements = await prisma.quizEntitlement.findMany({
      where: {
        userId: session.userId,
        quizId: { in: papers.map((p) => p.id) },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      select: {
        id: true,
        quizId: true,
        expiresAt: true,
      },
    });

    userEntitlementsMap = new Map(entitlements.map((e) => [e.quizId, e]));
  }

  const responsePapers = papers.map((paper) => {
    const userEntitlement = userEntitlementsMap.get(paper.id);
    const isFree = !paper.pricePaise || paper.pricePaise === 0;

    return {
      id: paper.id,
      title: paper.title,
      description: paper.description,
      courseId: paper.courseId,
      courseTitle: paper.course.title,
      subject: paper.course.subject,
      term: paper.course.term,
      section: paper.section || 'practice',
      year: paper.year || new Date().getFullYear(),
      pricePaise: paper.pricePaise || 0,
      isFree,
      timeLimitMinutes: paper.timeLimitSeconds ? Math.floor(paper.timeLimitSeconds / 60) : null,
      passMarkPercent: paper.passMarkPercent || 50,
      questionCount: paper._count.items,
      totalAttemptsCount: paper._count.attempts,
      isEntitled: Boolean(userEntitlement) || isFree,
      entitlementExpiresAt: userEntitlement?.expiresAt || null,
    };
  });

  return NextResponse.json({ papers: responsePapers });
}
