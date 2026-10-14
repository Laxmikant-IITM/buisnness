/**
 * @file apps/web/src/app/api/exam-platform/exams/[id]/export/route.ts
 * @description Streamed CSV candidate score and infraction export for managers.
 *
 * Security & Formula Injection Defense:
 * - Defends against CSV / Spreadsheet Formula Injection (CWE-1236).
 * - Pre-pends a single quote `'` to any value that begins with dangerous execution
 *   characters: `=`, `+`, `-`, `@`, `\t`, `\r`.
 * - Correctly wraps values with commas, quotes, and newlines per RFC 4180.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession, isPlatformManager } from '@/lib/auth';

interface RouteContext {
  params: { id: string };
}

/**
 * Sanitizes a CSV field against formula injection and escapes RFC 4180 delimiters.
 *
 * @param value - Raw cell value
 * @returns Safe, escaped CSV field string
 */
function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  let str = String(value);

  // 1. Formula injection defense: If string starts with =, +, -, @, \t, or \r, neutralize it
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // 2. RFC 4180 escaping: If cell contains quotes, commas, or newlines, enclose in double quotes
  if (/[",\n\r]/.test(str)) {
    str = `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

export async function GET(req: Request, { params }: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isPlatformManager(session.role)) {
    return NextResponse.json({ error: 'Forbidden: Platform manager credentials required' }, { status: 403 });
  }

  const examId = params.id;

  const exam = await prisma.proctoredExam.findUnique({
    where: { id: examId },
    select: { id: true, title: true },
  });

  if (!exam) {
    return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
  }

  // Fetch all sessions with candidate user details
  const sessions = await prisma.proctoredExamSession.findMany({
    where: { examId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          securityNumber: true,
        },
      },
    },
    orderBy: [{ status: 'asc' }, { score: 'desc' }],
  });

  // Construct CSV header
  const headers = [
    'Candidate Name',
    'Email',
    'Security ID',
    'Session Status',
    'Score Earned',
    'Total Marks',
    'Percentage (%)',
    'Infraction Warnings',
    'Warning Allowance',
    'Joined At',
    'Submitted At',
  ];

  const rows: string[] = [headers.map(sanitizeCsvCell).join(',')];

  for (const s of sessions) {
    const percentage =
      s.score !== null && s.totalMarks && s.totalMarks > 0
        ? Math.round((s.score / s.totalMarks) * 100)
        : '';

    const row = [
      s.user.name,
      s.user.email,
      s.user.securityNumber || '',
      s.status,
      s.score !== null ? s.score : 'N/A',
      s.totalMarks !== null ? s.totalMarks : 'N/A',
      percentage,
      s.warnings,
      s.warningAllowance,
      s.joinedAt ? s.joinedAt.toISOString() : '',
      s.submittedAt ? s.submittedAt.toISOString() : '',
    ];

    rows.push(row.map(sanitizeCsvCell).join(','));
  }

  const csvContent = rows.join('\r\n');
  const safeFilename = `exam-${exam.id}-${exam.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}-results.csv`;

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${safeFilename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
