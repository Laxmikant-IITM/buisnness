/**
 * Student Activity Audit Trail API Route
 * Module: User Management & Auditing (apps/web/src/app/api/user/activity/route.ts)
 *
 * Provides a paginated history of security and learning activities for the authenticated student:
 * - Activity logs (course completions, profile updates, credential changes, badges, deletions).
 * - Recent login audit events (timestamps, authentication methods, user agents, IP addresses).
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getFullSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  category: z.enum(['all', 'activity', 'logins']).default('all'),
});

/**
 * Returns paginated student activity logs and login history.
 *
 * @param request - HTTP GET request with pagination query params.
 * @returns JSON response containing activities and pagination metadata.
 */
export async function GET(request: Request) {
  const session = await getFullSession();
  if (!session) {
    return NextResponse.json({ error: 'Sign in to access your activity history.' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const parsed = querySchema.safeParse({
      page: url.searchParams.get('page') ?? '1',
      limit: url.searchParams.get('limit') ?? '20',
      category: url.searchParams.get('category') ?? 'all',
    });

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid query parameters.' }, { status: 400 });
    }

    const { page, limit, category } = parsed.data;
    const skip = (page - 1) * limit;

    let activities: Array<{
      id: string;
      type: 'activity' | 'login';
      action: string;
      details: unknown;
      createdAt: Date;
    }> = [];

    let total = 0;

    if (category === 'logins') {
      const [loginCount, logins] = await Promise.all([
        prisma.loginLog.count({ where: { userId: session.id } }),
        prisma.loginLog.findMany({
          where: { userId: session.id },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
      ]);

      total = loginCount;
      activities = logins.map((log) => ({
        id: log.id,
        type: 'login',
        action: `Signed in via ${log.authMethod}`,
        details: {
          authMethod: log.authMethod,
          userAgent: log.userAgent,
          ipAddress: log.ipAddress,
        },
        createdAt: log.createdAt,
      }));
    } else if (category === 'activity') {
      const [activityCount, rawActivities] = await Promise.all([
        prisma.activityLog.count({ where: { userId: session.id } }),
        prisma.activityLog.findMany({
          where: { userId: session.id },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
      ]);

      total = activityCount;
      activities = rawActivities.map((act) => ({
        id: act.id,
        type: 'activity',
        action: act.action,
        details: act.details,
        createdAt: act.createdAt,
      }));
    } else {
      // Combined activities + logins
      const [activityList, loginList, activityCount, loginCount] = await Promise.all([
        prisma.activityLog.findMany({
          where: { userId: session.id },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip,
        }),
        prisma.loginLog.findMany({
          where: { userId: session.id },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip,
        }),
        prisma.activityLog.count({ where: { userId: session.id } }),
        prisma.loginLog.count({ where: { userId: session.id } }),
      ]);

      const merged = [
        ...activityList.map((a) => ({
          id: a.id,
          type: 'activity' as const,
          action: a.action,
          details: a.details,
          createdAt: a.createdAt,
        })),
        ...loginList.map((l) => ({
          id: l.id,
          type: 'login' as const,
          action: `Signed in via ${l.authMethod}`,
          details: {
            authMethod: l.authMethod,
            userAgent: l.userAgent,
            ipAddress: l.ipAddress,
          },
          createdAt: l.createdAt,
        })),
      ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      total = activityCount + loginCount;
      activities = merged.slice(0, limit);
    }

    return NextResponse.json({
      activities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + activities.length < total,
      },
    });
  } catch (error) {
    console.error('[UserActivity API] Error querying activity logs:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while fetching activity history.' },
      { status: 500 }
    );
  }
}
