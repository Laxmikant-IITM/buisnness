/**
 * Live Class Calendar Events API Endpoint
 * Module: Live Classes & Calendar (src/app/api/events/route.ts)
 *
 * Handles querying and scheduling of interactive live lectures, webinars, and mentorship sessions.
 * Supports multiple delivery modalities: Google Meet, YouTube Live, and Drive recordings.
 * Enforces course enrollment filters for learners and management role checks for session scheduling.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession, canManageCourse, isPlatformManager, hasCourseStaffAccess } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createBatchNotifications } from '@/lib/notifications';
import { z } from 'zod';

export const runtime = 'nodejs';

/**
 * Zod validation schema for scheduling a live class or webinar event.
 */
const CreateEventSchema = z
  .object({
    courseId: z.string().min(1, 'Course ID is required.'),
    title: z.string().trim().min(3, 'Title must be at least 3 characters.').max(200),
    description: z.string().trim().max(2000).optional().nullable(),
    startTime: z.string().datetime({ message: 'Invalid start time ISO date.' }),
    endTime: z.string().datetime({ message: 'Invalid end time ISO date.' }),
    meetLink: z.string().url('Invalid meeting link URL.').optional().nullable(),
    type: z.enum(['LIVE_CLASS', 'WEBINAR', 'MENTORSHIP']).default('LIVE_CLASS'),
    recurrence: z.enum(['NONE', 'DAILY', 'WEEKLY']).optional().nullable(),
    streamProvider: z.enum(['MEET', 'YOUTUBE', 'DRIVE']).default('MEET'),
  })
  .refine((data) => new Date(data.endTime) > new Date(data.startTime), {
    message: 'End time must be chronologically after start time.',
    path: ['endTime'],
  });

/**
 * GET: Retrieve live class calendar events filtered by enrollments and date range.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const streamStatus = searchParams.get('streamStatus');
    const type = searchParams.get('type');

    // Build course scoping
    let courseIdsToQuery: string[] = [];

    if (isPlatformManager(session.role)) {
      if (courseId) {
        courseIdsToQuery = [courseId];
      }
      // If manager and no courseId, query all
    } else if (session.role === 'ADMIN' || session.role === 'INSTRUCTOR') {
      const assigned = await prisma.courseStaffAccess.findMany({
        where: { userId: session.userId },
        select: { courseId: true },
      });
      const assignedIds = assigned.map((a) => a.courseId);
      if (courseId) {
        if (!assignedIds.includes(courseId)) {
          return NextResponse.json({ error: 'Forbidden: Access denied to this course.' }, { status: 403 });
        }
        courseIdsToQuery = [courseId];
      } else {
        courseIdsToQuery = assignedIds;
      }
    } else {
      // Student: active enrollments
      const enrollments = await prisma.enrollment.findMany({
        where: {
          userId: session.userId,
          status: 'ACTIVE',
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        select: { courseId: true },
      });
      const enrolledIds = enrollments.map((e) => e.courseId);

      if (courseId) {
        if (!enrolledIds.includes(courseId)) {
          return NextResponse.json(
            { error: 'Forbidden: You are not enrolled in this course.' },
            { status: 403 },
          );
        }
        courseIdsToQuery = [courseId];
      } else {
        courseIdsToQuery = enrolledIds;
      }
    }

    // Date filters
    const startDateFilter: { gte?: Date; lte?: Date } = {};
    if (from) startDateFilter.gte = new Date(from);
    if (to) startDateFilter.lte = new Date(to);

    const events = await prisma.courseEvent.findMany({
      where: {
        ...(courseIdsToQuery.length > 0 ? { courseId: { in: courseIdsToQuery } } : {}),
        ...(Object.keys(startDateFilter).length > 0 ? { startTime: startDateFilter } : {}),
        ...(streamStatus ? { streamStatus } : {}),
        ...(type ? { type } : {}),
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            color: true,
            icon: true,
            teacherName: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
      take: 100,
    });

    const now = new Date();

    // Map events and dynamically infer live status if within time window
    const transformedEvents = events.map((event) => {
      let computedStatus = event.streamStatus;
      if (computedStatus === 'SCHEDULED' && event.startTime <= now && event.endTime >= now) {
        computedStatus = 'LIVE';
      } else if (computedStatus === 'SCHEDULED' && event.endTime < now) {
        computedStatus = 'ENDED';
      }

      return {
        ...event,
        streamStatus: computedStatus,
        isLiveNow: computedStatus === 'LIVE',
      };
    });

    return NextResponse.json({ events: transformedEvents });
  } catch (error) {
    console.error('[Events:GET] Error:', error);
    return NextResponse.json({ error: 'Failed to retrieve calendar events.' }, { status: 500 });
  }
}

/**
 * POST: Schedule a new live lecture or webinar event (Staff/Manager only).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parseResult = CreateEventSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const data = parseResult.data;

    // Staff access verification
    const isStaff =
      isPlatformManager(session.role) ||
      (await canManageCourse(session.userId, session.role, data.courseId)) ||
      (await hasCourseStaffAccess(session.userId, data.courseId));

    if (!isStaff) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to schedule events for this course.' },
        { status: 403 },
      );
    }

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: data.courseId },
      select: { id: true, title: true },
    });
    if (!course) {
      return NextResponse.json({ error: 'Course not found.' }, { status: 404 });
    }

    const newEvent = await prisma.courseEvent.create({
      data: {
        courseId: data.courseId,
        title: data.title,
        description: data.description ?? null,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        meetLink: data.meetLink ?? null,
        type: data.type,
        recurrence: data.recurrence ?? null,
        streamProvider: data.streamProvider,
        streamStatus: 'SCHEDULED',
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            color: true,
            icon: true,
            teacherName: true,
          },
        },
      },
    });

    // Notify enrolled students about newly scheduled live session
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId: data.courseId, status: 'ACTIVE' },
      select: { userId: true },
    });

    if (enrollments.length > 0) {
      const studentIds = enrollments.map((e) => e.userId);
      createBatchNotifications(studentIds, {
        title: `Live Session Scheduled: ${data.title}`,
        body: `A live class has been scheduled for ${new Date(data.startTime).toLocaleString()}.`,
        type: 'COURSE',
        link: `/live?eventId=${newEvent.id}`,
        metadata: { eventId: newEvent.id, courseId: data.courseId },
      }).catch(() => {
        // Non-blocking notification dispatch
      });
    }

    return NextResponse.json({ event: newEvent }, { status: 201 });
  } catch (error) {
    console.error('[Events:POST] Error:', error);
    return NextResponse.json({ error: 'Failed to schedule calendar event.' }, { status: 500 });
  }
}
