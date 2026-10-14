/**
 * Real-Time Community Chat Server-Sent Events (SSE) Stream Endpoint
 * Module: Real-time Communications Engine (src/app/api/community/[courseId]/stream/route.ts)
 *
 * Provides a low-latency, unidirectional SSE event stream for live course community channels.
 * Streams new messages, pin/unpin events, emoji reactions, message removals, and direct user alerts.
 * Strictly verifies student course enrollment or authorized staff assignments before opening streams.
 */

import { NextRequest } from 'next/server';
import { getSession, canAccessCourse } from '@/lib/auth';
import {
  sseBroadcaster,
  getCommunityChannel,
  getUserAlertChannel,
  formatSseChunk,
  formatSseHeartbeat,
  CommunityStreamEnvelope,
  UserAlertEvent,
} from '@/lib/sse';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Handles incoming SSE connections for a course community room.
 *
 * @param request - Next.js HTTP request object.
 * @param context - Route context containing params with courseId.
 * @returns Streaming HTTP Response adhering to the text/event-stream protocol.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } },
) {
  const session = await getSession();
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized: Authentication required.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { courseId } = params;
  if (!courseId) {
    return new Response(JSON.stringify({ error: 'Bad Request: Missing courseId parameter.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Strict course enrollment or staff access check
  const hasAccess = await canAccessCourse(session.userId, session.role, courseId);
  if (!hasAccess) {
    return new Response(
      JSON.stringify({
        error: 'Forbidden: You must be enrolled in this course or be assigned staff to view this chat stream.',
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  const communityChannel = getCommunityChannel(courseId);
  const userChannel = getUserAlertChannel(session.userId);

  // Set up ReadableStream
  let heartbeatInterval: NodeJS.Timeout | null = null;
  let isClosed = false;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const send = (raw: string) => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(raw));
        } catch {
          cleanup();
        }
      };

      // 1. Initial connection acknowledgement
      send(
        formatSseChunk('connected', {
          status: 'ok',
          courseId,
          userId: session.userId,
          connectedAt: new Date().toISOString(),
        }),
      );

      // 2. Listener for course community events
      const handleCommunityEvent = (envelope: CommunityStreamEnvelope) => {
        send(formatSseChunk(envelope.type, envelope.data));
      };

      // 3. Listener for private user alerts
      const handleUserAlert = (alert: UserAlertEvent) => {
        send(formatSseChunk('user:alert', alert));
      };

      sseBroadcaster.on(communityChannel, handleCommunityEvent);
      sseBroadcaster.on(userChannel, handleUserAlert);

      // 4. Heartbeat keep-alive every 15 seconds to prevent intermediate proxy timeouts
      heartbeatInterval = setInterval(() => {
        send(formatSseHeartbeat());
      }, 15000);

      // 5. Cleanup logic on disconnect
      const cleanup = () => {
        if (isClosed) return;
        isClosed = true;
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        sseBroadcaster.off(communityChannel, handleCommunityEvent);
        sseBroadcaster.off(userChannel, handleUserAlert);
        try {
          controller.close();
        } catch {
          // Stream might already be closed
        }
      };

      request.signal.addEventListener('abort', cleanup);
    },
    cancel() {
      isClosed = true;
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
