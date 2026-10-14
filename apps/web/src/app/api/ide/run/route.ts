/**
 * @file apps/web/src/app/api/ide/run/route.ts
 * @description Playground code execution endpoint for user test inputs.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { executeCode } from '@/lib/piston';
import { getSession } from '@/lib/auth';

const runCodeSchema = z.object({
  language: z.string().trim().min(1),
  code: z.string().min(1, 'Code cannot be empty').max(100_000),
  stdin: z.string().max(50_000).optional().default(''),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = runCodeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid execution parameters', details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { language, code, stdin } = parsed.data;

  try {
    const result = await executeCode({
      language,
      code,
      stdin,
      timeLimitSeconds: 10,
    });

    return NextResponse.json({ success: true, result });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Execution failed' },
      { status: 500 },
    );
  }
}
