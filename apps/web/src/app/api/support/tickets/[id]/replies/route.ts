/**
 * Support Ticket Replies & Conversation Thread Endpoint
 * Module: Support Helpdesk (src/app/api/support/tickets/[id]/replies/route.ts)
 *
 * Handles threaded conversational exchanges on support tickets.
 * Accommodates student inquiries, staff responses, internal moderation notes,
 * and automated ticket state transitions (e.g. reopen, resolve).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession, isPlatformManager } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createNotification } from '@/lib/notifications';
import { z } from 'zod';

export const runtime = 'nodejs';

const CreateReplySchema = z.object({
  body: z.string().trim().min(1, 'Reply message cannot be empty.').max(5000),
  isInternal: z.boolean().optional().default(false),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
});

/**
 * GET: Retrieve all replies for a specific ticket.
 * Learners see customer-facing replies; staff see internal notes as well.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    const ticketId = params.id;
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: { id: true, userId: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 });
    }

    const isStaff = isPlatformManager(session.role) || session.role === 'ADMIN' || session.role === 'INSTRUCTOR';
    const isOwner = ticket.userId === session.userId;

    if (!isOwner && !isStaff) {
      return NextResponse.json({ error: 'Forbidden: Access denied to this ticket.' }, { status: 403 });
    }

    const replies = await prisma.ticketReply.findMany({
      where: {
        ticketId,
        ...(!isStaff ? { isInternal: false } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ replies });
  } catch (error) {
    console.error('[TicketReplies:GET] Error:', error);
    return NextResponse.json({ error: 'Failed to retrieve ticket replies.' }, { status: 500 });
  }
}

/**
 * POST: Add a new threaded reply to the support ticket.
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

    const ticketId = params.id;
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 });
    }

    const isStaff = isPlatformManager(session.role) || session.role === 'ADMIN' || session.role === 'INSTRUCTOR';
    const isOwner = ticket.userId === session.userId;

    if (!isOwner && !isStaff) {
      return NextResponse.json({ error: 'Forbidden: Access denied to this ticket.' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const parseResult = CreateReplySchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { body: replyBody, isInternal, status } = parseResult.data;

    // Only staff can flag replies as internal notes
    const effectiveInternal = isStaff ? isInternal : false;

    // Create the reply record
    const reply = await prisma.ticketReply.create({
      data: {
        ticketId,
        userId: session.userId,
        body: replyBody,
        isInternal: effectiveInternal,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    // Determine target ticket status
    let updatedStatus = ticket.status;
    if (status && isStaff) {
      updatedStatus = status;
    } else if (isStaff && !effectiveInternal && ticket.status === 'OPEN') {
      updatedStatus = 'IN_PROGRESS';
    } else if (isOwner && (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED')) {
      // Re-open if student replies to a resolved ticket
      updatedStatus = 'IN_PROGRESS';
    }

    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: updatedStatus,
        updatedAt: new Date(),
        ...(isStaff && !ticket.assignedToId ? { assignedToId: session.userId } : {}),
      },
    });

    // Notify ticket owner if staff posted a visible reply
    if (isStaff && !effectiveInternal && ticket.userId !== session.userId) {
      createNotification({
        userId: ticket.userId,
        title: `Reply to Ticket: ${ticket.subject}`,
        body: replyBody.slice(0, 140),
        type: 'GENERAL',
        link: `/support?id=${ticket.id}`,
        metadata: { ticketId: ticket.id, replyId: reply.id },
      }).catch(() => {
        // Non-blocking notification dispatch
      });
    }

    return NextResponse.json({ reply, ticketStatus: updatedStatus }, { status: 201 });
  } catch (error) {
    console.error('[TicketReplies:POST] Error:', error);
    return NextResponse.json({ error: 'Failed to record ticket reply.' }, { status: 500 });
  }
}
