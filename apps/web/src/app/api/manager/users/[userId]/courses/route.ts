/**
 * @file apps/web/src/app/api/manager/users/[userId]/courses/route.ts
 * @description Manager Course Assignment & Wallet Coins API.
 *
 * Allows managers and super managers to:
 * - Instantly assign (enroll) a user into any course without payment
 * - Revoke / remove course access
 * - Grant wallet bonus coins to users/staff
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession, isPlatformManager } from '@/lib/auth';
import { demoStore } from '@/lib/demo-store';

const assignSchema = z.object({
  action: z.enum(['ASSIGN', 'REVOKE', 'ADD_COINS']),
  courseId: z.string().optional(),
  coins: z.number().int().optional(),
});

export async function POST(
  req: Request,
  context: { params: { userId: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isPlatformManager(session.role) && session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Manager access required' }, { status: 403 });
  }

  const { userId } = context.params;
  const body = await req.json().catch(() => null);
  const parsed = assignSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const { action, courseId, coins } = parsed.data;

  if (action === 'ASSIGN') {
    if (!courseId) return NextResponse.json({ error: 'courseId required' }, { status: 400 });
    demoStore.assignCourseToUser(userId, courseId);
    return NextResponse.json({ success: true, message: 'Course assigned successfully' });
  }

  if (action === 'REVOKE') {
    if (!courseId) return NextResponse.json({ error: 'courseId required' }, { status: 400 });
    demoStore.revokeCourseFromUser(userId, courseId);
    return NextResponse.json({ success: true, message: 'Course revoked successfully' });
  }

  if (action === 'ADD_COINS') {
    if (!coins || coins <= 0) return NextResponse.json({ error: 'Positive coins amount required' }, { status: 400 });
    const newBal = demoStore.addWalletBonus(userId, coins);
    return NextResponse.json({ success: true, walletBalance: newBal, message: `Added ${coins} coins` });
  }

  return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
}
