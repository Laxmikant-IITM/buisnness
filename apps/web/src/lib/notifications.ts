/**
 * In-App Notification Engine & Real-Time Alert Dispatcher
 * Module: Notifications System (src/lib/notifications.ts)
 *
 * Provides typed persistence and live broadcast helpers for student and staff notifications.
 * Automatically pushes alerts across active SSE connections to deliver real-time badges,
 * message toasts, and calendar deadline reminders without page refreshes.
 */

import { prisma } from '@/lib/db';
import { broadcastUserAlert } from '@/lib/sse';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

export const NotificationTypeEnum = z.enum(['GENERAL', 'COURSE', 'EXAM', 'COMMUNITY']);
export type NotificationType = z.infer<typeof NotificationTypeEnum>;

/**
 * Validation schema for creating a single notification.
 */
export const CreateNotificationSchema = z.object({
  userId: z.string().min(1, 'Target userId is required.'),
  title: z.string().min(1, 'Notification title is required.').max(150),
  body: z.string().min(1, 'Notification body is required.').max(1000),
  type: NotificationTypeEnum.default('GENERAL'),
  link: z.string().url().or(z.string().startsWith('/')).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

export type CreateNotificationInput = z.infer<typeof CreateNotificationSchema>;

/**
 * Creates an in-app notification in the database and immediately broadcasts it
 * over the user's active SSE stream if connected.
 *
 * @param input - Validated notification creation parameters.
 * @returns The created Notification database record.
 */
export async function createNotification(input: CreateNotificationInput) {
  const validated = CreateNotificationSchema.parse(input);

  const notification = await prisma.notification.create({
    data: {
      userId: validated.userId,
      title: validated.title,
      body: validated.body,
      type: validated.type,
      link: validated.link ?? null,
      metadata: validated.metadata ? (validated.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
    },
  });

  // Dispatch real-time alert through SSE
  try {
    broadcastUserAlert(validated.userId, {
      userId: validated.userId,
      type: validated.type,
      title: validated.title,
      body: validated.body,
      link: validated.link ?? null,
      metadata: (validated.metadata as Record<string, unknown>) ?? undefined,
      createdAt: notification.createdAt.toISOString(),
    });
  } catch (err) {
    // Non-blocking: SSE failures must not disrupt primary database transactions
    console.error(`[Notifications] Broadcast error for user ${validated.userId}:`, err);
  }

  return notification;
}

/**
 * Creates notifications in bulk for a cohort of users (e.g. course-wide announcements).
 *
 * @param userIds - Array of recipient user identifiers.
 * @param details - Shared notification details (title, body, type, link, metadata).
 * @returns Object with count of notifications created.
 */
export async function createBatchNotifications(
  userIds: string[],
  details: Omit<CreateNotificationInput, 'userId'>,
) {
  if (userIds.length === 0) return { count: 0 };

  const parsedDetails = CreateNotificationSchema.omit({ userId: true }).parse(details);

  const records = userIds.map((userId) => ({
    userId,
    title: parsedDetails.title,
    body: parsedDetails.body,
    type: parsedDetails.type,
    link: parsedDetails.link ?? null,
    metadata: parsedDetails.metadata ? (parsedDetails.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
  }));

  const result = await prisma.notification.createMany({
    data: records,
    skipDuplicates: true,
  });

  // Fire asynchronous alerts for all targets
  const timestamp = new Date().toISOString();
  for (const userId of userIds) {
    try {
      broadcastUserAlert(userId, {
        userId,
        type: parsedDetails.type,
        title: parsedDetails.title,
        body: parsedDetails.body,
        link: parsedDetails.link ?? null,
        metadata: (parsedDetails.metadata as Record<string, unknown>) ?? undefined,
        createdAt: timestamp,
      });
    } catch {
      // Continue broadcasting to remaining users
    }
  }

  return result;
}

/**
 * Marks a specific notification as read by the recipient.
 *
 * @param notificationId - Unique notification ID.
 * @param userId - Requesting user ID for ownership verification.
 */
export async function markNotificationAsRead(notificationId: string, userId: string) {
  return prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId,
    },
    data: {
      isRead: true,
    },
  });
}

/**
 * Marks all unread notifications as read for a given user.
 *
 * @param userId - Target user ID.
 */
export async function markAllNotificationsAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });
}

/**
 * Retrieves unread notification count for a user to display badge indicators.
 *
 * @param userId - User ID to query.
 * @returns Number of unread notifications.
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
}

/**
 * Fetches recent notifications for the authenticated user.
 *
 * @param userId - User ID to query.
 * @param options - Pagination and filter options.
 */
export async function getUserNotifications(
  userId: string,
  options: { limit?: number; unreadOnly?: boolean } = {},
) {
  const limit = Math.min(options.limit ?? 20, 50);

  return prisma.notification.findMany({
    where: {
      userId,
      ...(options.unreadOnly ? { isRead: false } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
