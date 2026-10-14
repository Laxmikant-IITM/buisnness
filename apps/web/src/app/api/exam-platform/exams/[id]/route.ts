/**
 * @file apps/web/src/app/api/exam-platform/exams/[id]/route.ts
 * @description Proctored Exam Management API: Retrieve exam with candidate roster and update settings.
 *
 * Capabilities:
 * - GET: If manager, returns exam configuration, question count, and active candidate sessions
 *   with live infraction count, warning allowance, submission status, and score.
 * - PATCH: Updates exam status (e.g. PUBLISHED, PAUSED, ENDED), adds extensionMinutes, or maxWarnings.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSession, isPlatformManager } from '@/lib/auth';

interface RouteContext {
  params: { id: string };
}

const updateExamSchema = z.object({
  title: z.string().trim().min(3).max(200).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'IN_PROGRESS', 'PAUSED', 'ENDED']).optional(),
  extensionMinutes: z.number().int().min(0).max(180).optional(),
  maxWarnings: z.number().int().min(1).max(20).optional(),
  closesAt: z.string().datetime().optional().nullable(),
  announcement: z.string().trim().min(1).max(1000).optional(),
});

/**
 * GET /api/exam-platform/exams/[id]
 * Retrieves exam details and (for managers) the complete candidate session roster with telemetry.
 */
export async function GET(req: Request, { params }: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const examId = params.id;
  const manager = isPlatformManager(session.role);

  try {
    const exam = await prisma.proctoredExam.findUnique({
      where: { id: examId },
      include: {
        _count: {
          select: {
            enrollments: true,
            sessions: true,
            messages: true,
            events: true,
          },
        },
        sessions: manager
          ? {
              orderBy: { joinedAt: 'desc' },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    securityNumber: true,
                    avatar: true,
                  },
                },
              },
            }
          : false,
      },
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Non-managers should not receive candidate rosters
    if (!manager) {
      return NextResponse.json({
        exam: {
          id: exam.id,
          title: exam.title,
          subject: exam.subject,
          instructions: exam.instructions,
          durationMinutes: exam.durationMinutes,
          scheduledAt: exam.scheduledAt,
          closesAt: exam.closesAt,
          status: exam.status,
          questionCount: exam.questionCount,
        },
      });
    }

    return NextResponse.json({ exam });
  } catch (error) {
    console.error('[EXAM_GET_ID_ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch exam details' }, { status: 500 });
  }
}

/**
 * PATCH /api/exam-platform/exams/[id]
 * Updates exam status, time extensions, or broadcasts an announcement to all candidates.
 */
export async function PATCH(req: Request, { params }: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isPlatformManager(session.role)) {
    return NextResponse.json({ error: 'Forbidden: Platform manager credentials required' }, { status: 403 });
  }

  const examId = params.id;
  const body = await req.json().catch(() => null);
  const parsed = updateExamSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.issues }, { status: 400 });
  }

  const { announcement, ...updateData } = parsed.data;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const exam = await tx.proctoredExam.update({
        where: { id: examId },
        data: updateData,
      });

      // If an announcement was included, write to ProctoredExamMessage
      if (announcement) {
        await tx.proctoredExamMessage.create({
          data: {
            examId,
            senderId: session.userId,
            text: announcement,
            isAnnouncement: true,
          },
        });
      }

      return exam;
    });

    return NextResponse.json({ exam: updated, message: 'Exam updated successfully' });
  } catch (error) {
    console.error('[EXAM_PATCH_ID_ERROR]', error);
    return NextResponse.json({ error: 'Failed to update exam' }, { status: 500 });
  }
}
