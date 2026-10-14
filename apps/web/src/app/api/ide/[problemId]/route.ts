/**
 * @file apps/web/src/app/api/ide/[problemId]/route.ts
 * @description Retrieves coding problem specification for candidate IDE environment.
 *
 * Security:
 * - Only reveals public sample test cases (isHidden = false).
 * - Hidden verification test suites remain server-side.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

interface RouteContext {
  params: { problemId: string };
}

export async function GET(req: Request, { params }: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { problemId } = params;

  const problem = await prisma.ideProblem.findUnique({
    where: { id: problemId },
    include: {
      testCases: {
        where: { isHidden: false },
        orderBy: { position: 'asc' },
        select: {
          id: true,
          input: true,
          expectedOutput: true,
          position: true,
        },
      },
      submissions: {
        where: { userId: session.userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          language: true,
          status: true,
          executionTimeMs: true,
          createdAt: true,
        },
      },
    },
  });

  if (!problem) {
    return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
  }

  return NextResponse.json({
    problem: {
      id: problem.id,
      title: problem.title,
      description: problem.description,
      constraints: problem.constraints,
      inputFormat: problem.inputFormat,
      outputFormat: problem.outputFormat,
      sampleInput: problem.sampleInput,
      sampleOutput: problem.sampleOutput,
      difficulty: problem.difficulty,
      weekNumber: problem.weekNumber,
      defaultLanguage: problem.language || 'python',
      timeLimitSeconds: problem.timeLimitSeconds,
      publicTestCases: problem.testCases,
      recentSubmissions: problem.submissions,
    },
  });
}
