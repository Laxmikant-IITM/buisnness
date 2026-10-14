/**
 * @file apps/web/src/app/api/ide/submit/route.ts
 * @description Challenge submission API evaluating code against hidden & public test suites.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { evaluateSubmission } from '@/lib/piston';
import { getSession } from '@/lib/auth';

const submitProblemSchema = z.object({
  problemId: z.string().trim().min(1),
  language: z.string().trim().min(1),
  code: z.string().min(1, 'Code cannot be empty').max(100_000),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = submitProblemSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid submission data', details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { problemId, language, code } = parsed.data;

  // Retrieve problem and all test cases
  const problem = await prisma.ideProblem.findUnique({
    where: { id: problemId },
    include: {
      testCases: {
        orderBy: { position: 'asc' },
      },
    },
  });

  if (!problem) {
    return NextResponse.json({ error: 'Coding problem not found' }, { status: 404 });
  }

  if (problem.testCases.length === 0) {
    return NextResponse.json(
      { error: 'This problem currently has no test cases configured.' },
      { status: 400 },
    );
  }

  const evaluation = await evaluateSubmission(
    code,
    language,
    problem.testCases.map((tc) => ({
      id: tc.id,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      isHidden: tc.isHidden,
    })),
    problem.timeLimitSeconds,
  );

  // Persist submission record
  const submission = await prisma.ideSubmission.create({
    data: {
      problemId: problem.id,
      userId: session.userId,
      language,
      code,
      status: evaluation.overallStatus,
      testResults: evaluation.results as any,
      executionTimeMs: evaluation.executionTimeMs,
      memoryUsedKb: evaluation.memoryUsedKb,
    },
    select: {
      id: true,
      status: true,
      executionTimeMs: true,
      memoryUsedKb: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    success: true,
    submissionId: submission.id,
    overallStatus: evaluation.overallStatus,
    totalCases: evaluation.totalCases,
    passedCases: evaluation.passedCases,
    executionTimeMs: evaluation.executionTimeMs,
    memoryUsedKb: evaluation.memoryUsedKb,
    results: evaluation.results,
  });
}
