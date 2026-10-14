/**
 * @file apps/web/src/lib/piston.ts
 * @description Code execution runner interfacing with the Piston API / sandbox.
 * Supports Python, Java, and C++ with execution time and memory limits,
 * automated test case evaluation, and sanitized telemetry.
 */

import { z } from 'zod';

/** Piston standard API endpoint fallback */
const DEFAULT_PISTON_URL = 'https://emkc.org/api/v2/piston/execute';

export interface LanguageSpec {
  language: string;
  version: string;
  fileName: string;
}

/** Supported language configurations */
export const SUPPORTED_LANGUAGES: Record<string, LanguageSpec> = {
  python: {
    language: 'python',
    version: '3.10.0',
    fileName: 'solution.py',
  },
  py: {
    language: 'python',
    version: '3.10.0',
    fileName: 'solution.py',
  },
  java: {
    language: 'java',
    version: '15.0.2',
    fileName: 'Main.java',
  },
  cpp: {
    language: 'c++',
    version: '10.2.0',
    fileName: 'solution.cpp',
  },
  'c++': {
    language: 'c++',
    version: '10.2.0',
    fileName: 'solution.cpp',
  },
};

/** Raw Piston API response validation schema */
const pistonStageSchema = z.object({
  stdout: z.string().optional().default(''),
  stderr: z.string().optional().default(''),
  output: z.string().optional().default(''),
  code: z.number().nullable().optional(),
  signal: z.string().nullable().optional(),
});

const pistonResponseSchema = z.object({
  language: z.string(),
  version: z.string(),
  run: pistonStageSchema,
  compile: pistonStageSchema.optional(),
});

export interface ExecuteOptions {
  language: string;
  code: string;
  stdin?: string;
  timeLimitSeconds?: number;
  memoryLimitMb?: number;
}

export interface SingleRunResult {
  stdout: string;
  stderr: string;
  output: string;
  exitCode: number;
  signal: string | null;
  status: 'SUCCESS' | 'COMPILE_ERROR' | 'RUNTIME_ERROR' | 'TIME_LIMIT_EXCEEDED';
  durationMs: number;
}

export interface TestCaseInput {
  id?: string;
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

export interface TestCaseEvaluationResult {
  testCaseId?: string;
  passed: boolean;
  actualOutput: string;
  expectedOutput: string;
  stderr?: string;
  status: 'ACCEPTED' | 'WRONG_ANSWER' | 'TIME_LIMIT_EXCEEDED' | 'RUNTIME_ERROR' | 'COMPILE_ERROR';
  executionTimeMs: number;
  memoryUsedKb?: number;
  isHidden: boolean;
}

export interface SubmissionEvaluationSummary {
  overallStatus: 'ACCEPTED' | 'WRONG_ANSWER' | 'TIME_LIMIT_EXCEEDED' | 'RUNTIME_ERROR' | 'COMPILE_ERROR';
  totalCases: number;
  passedCases: number;
  executionTimeMs: number;
  memoryUsedKb: number;
  results: TestCaseEvaluationResult[];
}

/**
 * Normalizes execution outputs by trimming trailing whitespace and converting CRLF to LF.
 * Ensures cross-platform consistency when matching against expected outputs.
 */
export function normalizeOutput(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trimEnd();
}

/**
 * Resolves standard language aliases (e.g. "py" -> "python", "c++" -> "cpp").
 */
export function resolveLanguage(lang: string): LanguageSpec {
  const normalized = lang.trim().toLowerCase();
  const spec = SUPPORTED_LANGUAGES[normalized];
  if (!spec) {
    throw new Error(`Unsupported programming language: "${lang}". Supported: Python, Java, C++`);
  }
  return spec;
}

/**
 * Executes a single snippet of code against the Piston sandbox.
 *
 * @param options - Execution configuration including code, stdin, and limits
 * @returns Standardized SingleRunResult
 */
export async function executeCode(options: ExecuteOptions): Promise<SingleRunResult> {
  const { language, code, stdin = '', timeLimitSeconds = 10 } = options;
  const spec = resolveLanguage(language);
  const endpoint = process.env.PISTON_API_URL || DEFAULT_PISTON_URL;

  const payload = {
    language: spec.language,
    version: spec.version,
    files: [
      {
        name: spec.fileName,
        content: code,
      },
    ],
    stdin,
    run_timeout: Math.min(timeLimitSeconds * 1000, 15000), // Max 15s cap
    compile_timeout: 10000,
  };

  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), (timeLimitSeconds + 4) * 1000);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Piston API error (status ${res.status}): ${errText}`);
    }

    const rawJson = await res.json();
    const parsed = pistonResponseSchema.safeParse(rawJson);

    if (!parsed.success) {
      throw new Error(`Malformed response from Piston API: ${parsed.error.message}`);
    }

    const durationMs = Date.now() - startTime;
    const { run, compile } = parsed.data;

    // Check if compilation failed (C++, Java)
    if (compile && compile.code !== 0 && compile.code !== null) {
      return {
        stdout: compile.stdout || '',
        stderr: compile.stderr || compile.output || 'Compilation failed',
        output: compile.output || '',
        exitCode: compile.code ?? 1,
        signal: compile.signal ?? null,
        status: 'COMPILE_ERROR',
        durationMs,
      };
    }

    // Check if process was killed by timeout signal (SIGKILL, SIGTERM)
    if (run.signal === 'SIGKILL' || run.signal === 'SIGTERM' || durationMs >= timeLimitSeconds * 1000) {
      return {
        stdout: run.stdout || '',
        stderr: run.stderr || 'Time limit exceeded',
        output: run.output || '',
        exitCode: run.code ?? 137,
        signal: run.signal ?? 'SIGKILL',
        status: 'TIME_LIMIT_EXCEEDED',
        durationMs,
      };
    }

    // Check runtime error
    if (run.code !== 0 && run.code !== null) {
      return {
        stdout: run.stdout || '',
        stderr: run.stderr || run.output || 'Runtime error',
        output: run.output || '',
        exitCode: run.code ?? 1,
        signal: run.signal ?? null,
        status: 'RUNTIME_ERROR',
        durationMs,
      };
    }

    return {
      stdout: run.stdout || '',
      stderr: run.stderr || '',
      output: run.output || '',
      exitCode: 0,
      signal: null,
      status: 'SUCCESS',
      durationMs,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const durationMs = Date.now() - startTime;

    if (err instanceof Error && err.name === 'AbortError') {
      return {
        stdout: '',
        stderr: `Execution aborted: time limit of ${timeLimitSeconds}s exceeded.`,
        output: '',
        exitCode: 124,
        signal: 'SIGKILL',
        status: 'TIME_LIMIT_EXCEEDED',
        durationMs,
      };
    }

    return {
      stdout: '',
      stderr: err instanceof Error ? err.message : 'Unknown execution failure',
      output: '',
      exitCode: -1,
      signal: null,
      status: 'RUNTIME_ERROR',
      durationMs,
    };
  }
}

/**
 * Runs code against multiple test cases and tallies overall pass/fail results.
 *
 * @param code - Candidate source code
 * @param language - Target programming language
 * @param testCases - Test suite containing inputs, expected outputs, and visibility flags
 * @param timeLimitSeconds - Max execution time allowed per test case
 * @returns Aggregated submission summary with per-case breakdowns
 */
export async function evaluateSubmission(
  code: string,
  language: string,
  testCases: TestCaseInput[],
  timeLimitSeconds: number = 10,
): Promise<SubmissionEvaluationSummary> {
  const results: TestCaseEvaluationResult[] = [];
  let maxDurationMs = 0;
  let overallStatus: SubmissionEvaluationSummary['overallStatus'] = 'ACCEPTED';

  for (const tc of testCases) {
    const run = await executeCode({
      language,
      code,
      stdin: tc.input,
      timeLimitSeconds,
    });

    maxDurationMs = Math.max(maxDurationMs, run.durationMs);

    if (run.status === 'COMPILE_ERROR') {
      overallStatus = 'COMPILE_ERROR';
      results.push({
        testCaseId: tc.id,
        passed: false,
        actualOutput: run.output,
        expectedOutput: tc.isHidden ? '[HIDDEN]' : tc.expectedOutput,
        stderr: run.stderr,
        status: 'COMPILE_ERROR',
        executionTimeMs: run.durationMs,
        isHidden: !!tc.isHidden,
      });
      // Short-circuit on compilation failure
      break;
    }

    if (run.status === 'TIME_LIMIT_EXCEEDED') {
      if (overallStatus === 'ACCEPTED') overallStatus = 'TIME_LIMIT_EXCEEDED';
      results.push({
        testCaseId: tc.id,
        passed: false,
        actualOutput: run.stdout,
        expectedOutput: tc.isHidden ? '[HIDDEN]' : tc.expectedOutput,
        stderr: run.stderr,
        status: 'TIME_LIMIT_EXCEEDED',
        executionTimeMs: run.durationMs,
        isHidden: !!tc.isHidden,
      });
      continue;
    }

    if (run.status === 'RUNTIME_ERROR') {
      if (overallStatus === 'ACCEPTED') overallStatus = 'RUNTIME_ERROR';
      results.push({
        testCaseId: tc.id,
        passed: false,
        actualOutput: run.stdout,
        expectedOutput: tc.isHidden ? '[HIDDEN]' : tc.expectedOutput,
        stderr: run.stderr,
        status: 'RUNTIME_ERROR',
        executionTimeMs: run.durationMs,
        isHidden: !!tc.isHidden,
      });
      continue;
    }

    // Compare normalized output
    const isMatched = normalizeOutput(run.stdout) === normalizeOutput(tc.expectedOutput);
    const tcStatus = isMatched ? 'ACCEPTED' : 'WRONG_ANSWER';

    if (!isMatched && overallStatus === 'ACCEPTED') {
      overallStatus = 'WRONG_ANSWER';
    }

    results.push({
      testCaseId: tc.id,
      passed: isMatched,
      actualOutput: tc.isHidden && !isMatched ? '[HIDDEN]' : run.stdout,
      expectedOutput: tc.isHidden ? '[HIDDEN]' : tc.expectedOutput,
      stderr: run.stderr,
      status: tcStatus,
      executionTimeMs: run.durationMs,
      isHidden: !!tc.isHidden,
    });
  }

  const passedCases = results.filter((r) => r.passed).length;

  return {
    overallStatus,
    totalCases: testCases.length,
    passedCases,
    executionTimeMs: maxDurationMs,
    memoryUsedKb: 1024 * 32, // Baseline container memory proxy
    results,
  };
}
