/**
 * Student Homework Multi-File Submission Endpoint
 * Module: Homework & Grading Engine (src/app/api/homework/[id]/submit/route.ts)
 *
 * Handles student submission uploads including multiple file URLs and optional submission notes.
 * Enforces course enrollment and assignment deadline/open policies.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession, canAccessCourse } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

export const runtime = 'nodejs';

const SubmissionSchema = z.object({
  fileUrls: z
    .array(z.string().url('Each attachment must be a valid file URL.'))
    .min(1, 'Please provide at least one attachment URL.')
    .max(10, 'Cannot exceed 10 file attachments per submission.'),
  note: z.string().trim().max(2000, 'Submission note cannot exceed 2000 characters.').optional().nullable(),
});

/**
 * POST: Submit or update a student's homework assignment submission.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    const homeworkId = params.id;

    // Fetch homework details
    const homework = await prisma.homework.findUnique({
      where: { id: homeworkId },
      include: {
        course: { select: { id: true, title: true } },
      },
    });

    if (!homework) {
      return NextResponse.json({ error: 'Homework assignment not found.' }, { status: 404 });
    }

    if (!homework.isOpen) {
      return NextResponse.json(
        { error: 'This assignment is closed and no longer accepts submissions.' },
        { status: 400 },
      );
    }

    // Verify course enrollment
    const hasAccess = await canAccessCourse(session.userId, session.role, homework.courseId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden: You must be enrolled in the course to submit homework.' },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => null);
    const parseResult = SubmissionSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { fileUrls, note } = parseResult.data;

    const submission = await prisma.homeworkSubmission.upsert({
      where: {
        homeworkId_userId: {
          homeworkId,
          userId: session.userId,
        },
      },
      create: {
        homeworkId,
        userId: session.userId,
        fileUrls: fileUrls as Prisma.InputJsonValue,
        note: note ?? null,
        submittedAt: new Date(),
      },
      update: {
        fileUrls: fileUrls as Prisma.InputJsonValue,
        note: note ?? null,
        submittedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      submission,
      message: 'Homework submitted successfully.',
    });
  } catch (error) {
    console.error('[HomeworkSubmit:POST] Error:', error);
    return NextResponse.json({ error: 'Failed to record homework submission.' }, { status: 500 });
  }
}
