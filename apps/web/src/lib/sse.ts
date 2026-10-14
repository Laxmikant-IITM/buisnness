/**
 * Server-Sent Events (SSE) Broadcaster & Real-time Stream Utilities
 * Module: Real-time Communications Engine (src/lib/sse.ts)
 *
 * Provides a resilient Node.js EventEmitter singleton across Next.js server instances
 * and worker runtimes. Coordinates real-time course community messages, reaction updates,
 * message pins, delete tombstones, and direct user alerts with sanitized, course-scoped payloads.
 */

import { EventEmitter } from 'node:events';

/**
 * Publicly sanitized learner/instructor identity safe for live stream broadcasting.
 * Guaranteed to omit sensitive identifiers (emails, phone numbers, security tokens).
 */
export interface SafeStreamUser {
  id: string;
  name: string;
  avatar: string | null;
  role: string;
}

/**
 * Pinned message broadcast payload structure.
 */
export interface CommunityPinEvent {
  action: 'pin' | 'unpin';
  courseId: string;
  messageId: string;
  isPinned: boolean;
  actorId: string;
}

/**
 * Reaction update broadcast payload.
 */
export interface CommunityReactionEvent {
  courseId: string;
  messageId: string;
  userId: string;
  emoji: string;
  reactions: Record<string, string[]>;
}

/**
 * Message deletion tombstone payload.
 */
export interface CommunityDeleteEvent {
  courseId: string;
  messageId: string;
  courseIdScope: string;
}

/**
 * Unified community payload type.
 */
export interface CommunityStreamEnvelope {
  type: 'message' | 'pin' | 'reaction' | 'delete' | 'ping';
  courseId: string;
  data: unknown;
  timestamp: string;
}

/**
 * User-specific alert payload.
 */
export interface UserAlertEvent {
  userId: string;
  type: string;
  title: string;
  body: string;
  link?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

/**
 * Dedicated event emitter for SSE message broadcasting with extended listener capacity.
 */
class SSEBroadcaster extends EventEmitter {
  constructor() {
    super();
    // Accommodate high concurrent connection volumes per course community
    this.setMaxListeners(5000);
  }
}

/**
 * Global singleton pattern ensuring consistent broadcaster instance across
 * Next.js hot-reloading development lifecycles.
 */
const globalForSSE = globalThis as unknown as { sseBroadcaster?: SSEBroadcaster };

export const sseBroadcaster = globalForSSE.sseBroadcaster ?? new SSEBroadcaster();

if (process.env.NODE_ENV !== 'production') {
  globalForSSE.sseBroadcaster = sseBroadcaster;
}

/**
 * Derives the unique event channel name for a course community room.
 *
 * @param courseId - Unique course identifier.
 * @returns Event channel identifier string.
 */
export function getCommunityChannel(courseId: string): string {
  return `community:${courseId}`;
}

/**
 * Derives the unique event channel name for private user alerts and direct messages.
 *
 * @param userId - Unique user identifier.
 * @returns Event channel identifier string.
 */
export function getUserAlertChannel(userId: string): string {
  return `user:${userId}`;
}

/**
 * Strips confidential information (passwords, emails, phone numbers, tokens)
 * from user objects before passing data into public or group SSE streams.
 *
 * @param user - Raw user record from database or session.
 * @returns Sanitized public stream user object.
 */
export function sanitizeUserForStream(user: {
  id: string;
  name?: string | null;
  avatar?: string | null;
  role?: string | null;
}): SafeStreamUser {
  return {
    id: user.id,
    name: user.name || 'Anonymous Learner',
    avatar: user.avatar || null,
    role: user.role || 'STUDENT',
  };
}

/**
 * Sanitizes a CommunityMessage record, scrubbing any nested sensitive author details.
 *
 * @param msg - CommunityMessage with relations from Prisma.
 * @returns Safe sanitized message object.
 */
export function sanitizeCommunityMessage(msg: {
  id: string;
  courseId: string;
  userId: string;
  content: string;
  imageUrl?: string | null;
  isPinned: boolean;
  isEdited: boolean;
  likes: number;
  reactions?: unknown;
  replyToId?: string | null;
  isSystemDeleted: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  user: {
    id: string;
    name?: string | null;
    avatar?: string | null;
    role?: string | null;
  };
  replyTo?: {
    id: string;
    content: string;
    userId: string;
    user?: {
      id: string;
      name?: string | null;
      avatar?: string | null;
      role?: string | null;
    } | null;
  } | null;
}) {
  return {
    id: msg.id,
    courseId: msg.courseId,
    userId: msg.userId,
    content: msg.isSystemDeleted ? '[This message has been removed by moderation]' : msg.content,
    imageUrl: msg.isSystemDeleted ? null : msg.imageUrl,
    isPinned: msg.isPinned,
    isEdited: msg.isEdited,
    likes: msg.likes,
    reactions: (msg.reactions as Record<string, string[]>) || {},
    replyToId: msg.replyToId,
    isSystemDeleted: msg.isSystemDeleted,
    createdAt: typeof msg.createdAt === 'string' ? msg.createdAt : msg.createdAt.toISOString(),
    updatedAt: typeof msg.updatedAt === 'string' ? msg.updatedAt : msg.updatedAt.toISOString(),
    user: sanitizeUserForStream(msg.user),
    replyTo: msg.replyTo
      ? {
          id: msg.replyTo.id,
          content: msg.replyTo.content,
          userId: msg.replyTo.userId,
          user: msg.replyTo.user ? sanitizeUserForStream(msg.replyTo.user) : null,
        }
      : null,
  };
}

/**
 * Formats a raw object into a valid Server-Sent Events text protocol chunk.
 *
 * @param eventName - SSE event type name.
 * @param data - Arbitrary serializable object payload.
 * @returns Formatted SSE data string ending with double newline.
 */
export function formatSseChunk(eventName: string, data: unknown): string {
  const jsonPayload = JSON.stringify(data);
  return `event: ${eventName}\ndata: ${jsonPayload}\n\n`;
}

/**
 * Creates an SSE keep-alive heartbeat chunk to maintain persistent HTTP connections.
 *
 * @returns SSE comment chunk.
 */
export function formatSseHeartbeat(): string {
  return `: ping ${Date.now()}\n\n`;
}

/**
 * Broadcasts an event to all connected listeners within a specific course community.
 *
 * @param courseId - Target course identifier.
 * @param eventType - Event category (message, pin, reaction, delete).
 * @param payload - Structured event data.
 */
export function broadcastCommunityEvent(
  courseId: string,
  eventType: 'message' | 'pin' | 'reaction' | 'delete',
  payload: unknown,
): void {
  const channel = getCommunityChannel(courseId);
  const envelope: CommunityStreamEnvelope = {
    type: eventType,
    courseId,
    data: payload,
    timestamp: new Date().toISOString(),
  };
  sseBroadcaster.emit(channel, envelope);
}

/**
 * Broadcasts a private real-time alert or notification to a specific user.
 *
 * @param userId - Target user identifier.
 * @param alert - Alert payload.
 */
export function broadcastUserAlert(userId: string, alert: UserAlertEvent): void {
  const channel = getUserAlertChannel(userId);
  sseBroadcaster.emit(channel, alert);
}
