/**
 * Support Helpdesk Tickets Management Endpoint
 * Module: Support Helpdesk (src/app/api/support/tickets/route.ts)
 *
 * Implements full CRUD handling for academic and technical student support tickets.
 * Scopes tickets so learners view only their submitted requests while administrative staff
 * can prioritize, assign, and triage tickets across the entire academy.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession, isPlatformManager } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createNotification } from '@/lib/notifications';
import { z } from 'zod';

export const runtime = 'nodejs';

/**
 * Validation schema for ticket creation.
 */
const CreateTicketSchema = z.object({
  subject: z.string().trim().min(5, 'Subject must be at least 5 characters.').max(200),
  body: z.string().trim().min(10, 'Please describe your request in at least 10 characters.').max(5000),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
});

/**
 * GET: Retrieve support tickets (Learner sees self; Staff sees all or filtered).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    const isStaff = isPlatformManager(session.role) || session.role === 'ADMIN' || session.role === 'INSTRUCTOR';

    const tickets = await prisma.supportTicket.findMany({
      where: {
        ...(!isStaff ? { userId: session.userId } : {}),
        ...(status ? { status } : {}),
        ...(priority ? { priority } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
            ...(isStaff ? { email: true } : {}),
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true,
          },
        },
        _count: {
          select: { replies: true },
        },
      },
      orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
      take: 100,
    });

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error('[SupportTickets:GET] Error:', error);
    return NextResponse.json({ error: 'Failed to retrieve support tickets.' }, { status: 500 });
  }
}

/**
 * POST: Create a new helpdesk support ticket.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parseResult = CreateTicketSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { subject, body: ticketBody, priority } = parseResult.data;

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: session.userId,
        subject,
        body: ticketBody,
        priority,
        status: 'OPEN',
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    // Confirmation notification to the user
    createNotification({
      userId: session.userId,
      title: 'Support Ticket Received',
      body: `Your ticket "${subject}" (#${ticket.id.slice(-6)}) has been logged. An academic counselor will reply shortly.`,
      type: 'GENERAL',
      link: `/support?id=${ticket.id}`,
      metadata: { ticketId: ticket.id },
    }).catch(() => {
      // Non-blocking notification dispatch
    });

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    console.error('[SupportTickets:POST] Error:', error);
    return NextResponse.json({ error: 'Failed to create support ticket.' }, { status: 500 });
  }
}
