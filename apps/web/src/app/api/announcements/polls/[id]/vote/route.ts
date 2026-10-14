/**
 * Embedded Poll Voting Endpoint
 * Module: Broadcasts & Announcements (src/app/api/announcements/polls/[id]/vote/route.ts)
 *
 * Records a student vote for a specific poll option within an announcement.
 * Enforces single-vote invariant per student per poll using database unique constraints.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const runtime = 'nodejs';

const VoteInputSchema = z.object({
  pollOptionId: z.string().min(1, 'pollOptionId is required.'),
});

/**
 * POST: Cast or update a vote on an announcement poll.
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

    const pollId = params.id;
    const body = await request.json().catch(() => null);
    const parseResult = VoteInputSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid vote payload.' }, { status: 400 });
    }

    const { pollOptionId } = parseResult.data;

    // Verify option belongs to the targeted poll
    const option = await prisma.pollOption.findFirst({
      where: { id: pollOptionId, pollId },
    });

    if (!option) {
      return NextResponse.json({ error: 'Selected poll option does not exist for this poll.' }, { status: 404 });
    }

    // Upsert vote
    const response = await prisma.pollResponse.upsert({
      where: {
        pollId_userId: {
          pollId,
          userId: session.userId,
        },
      },
      create: {
        pollId,
        pollOptionId,
        userId: session.userId,
      },
      update: {
        pollOptionId,
      },
    });

    // Compute updated counts for return
    const updatedOptions = await prisma.pollOption.findMany({
      where: { pollId },
      include: {
        _count: { select: { responses: true } },
      },
      orderBy: { order: 'asc' },
    });

    const totalVotes = updatedOptions.reduce((sum, opt) => sum + opt._count.responses, 0);

    return NextResponse.json({
      success: true,
      userVotedOptionId: response.pollOptionId,
      totalVotes,
      options: updatedOptions.map((opt) => ({
        id: opt.id,
        text: opt.text,
        order: opt.order,
        voteCount: opt._count.responses,
        percentage: totalVotes > 0 ? Math.round((opt._count.responses / totalVotes) * 100) : 0,
      })),
    });
  } catch (error) {
    console.error('[PollVote:POST] Error:', error);
    return NextResponse.json({ error: 'Failed to record poll vote.' }, { status: 500 });
  }
}
