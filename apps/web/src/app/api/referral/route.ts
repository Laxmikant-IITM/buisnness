/**
 * Student Referral Hub API
 * Module: Commercial Referrals (src/app/api/referral/route.ts)
 *
 * Returns the caller's unique referral code, shareable link, current wallet balance,
 * quarterly and lifetime referral stats, full referral transaction ledger, and milestone roadmap progress.
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  getOrCreateReferralCode,
  getUpdatedQuarterlyStats,
  DEFAULT_REFERRAL_MILESTONES,
} from '@/lib/referral';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'You must be signed in to view your referral hub.' },
        { status: 401 },
      );
    }

    // Fetch user details
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        walletBalance: true,
        lifetimeReferrals: true,
        quarterlyReferrals: true,
        quarterStartDate: true,
        referralCode: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User record not found.' }, { status: 404 });
    }

    // Ensure user has a unique 5-char referral code
    const referralCode = await getOrCreateReferralCode(user.id);

    // Check quarterly reset
    const quarterlyStats = getUpdatedQuarterlyStats({
      quarterlyReferrals: user.quarterlyReferrals,
      quarterStartDate: user.quarterStartDate,
    });

    if (quarterlyStats.isReset) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          quarterlyReferrals: 0,
          quarterStartDate: quarterlyStats.quarterStartDate,
        },
      });
      user.quarterlyReferrals = 0;
    }

    // Determine host for shareable link
    const host = request.headers.get('host') || 'localhost:3000';
    const proto = host.includes('localhost') ? 'http' : 'https';
    const shareableUrl = `${proto}://${host}/courses?ref=${referralCode}`;

    // Fetch milestone data
    let milestones = await prisma.referralMilestone.findMany({
      orderBy: { referralsRequired: 'asc' },
    });

    if (!milestones || milestones.length === 0) {
      milestones = DEFAULT_REFERRAL_MILESTONES.map((m) => ({
        ...m,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
    }

    const milestoneRoadmap = milestones.map((m) => ({
      referralsRequired: m.referralsRequired,
      bonusCoins: m.bonusCoins,
      description: m.description,
      isCompleted: user.lifetimeReferrals >= m.referralsRequired,
    }));

    const nextMilestone = milestoneRoadmap.find((m) => !m.isCompleted) || null;

    // Fetch referral transactions where this user is the referrer
    const transactions = await prisma.referralTransaction.findMany({
      where: { referrerEmail: user.email },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        buyerEmail: true,
        orderId: true,
        originalPrice: true,
        buyerDiscount: true,
        finalPrice: true,
        referrerReward: true,
        coinsUsed: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      referralCode,
      shareableUrl,
      walletBalanceCoins: user.walletBalance,
      walletBalanceRupees: Math.floor(user.walletBalance / 100),
      lifetimeReferrals: user.lifetimeReferrals,
      quarterlyReferrals: user.quarterlyReferrals,
      milestoneRoadmap,
      nextMilestone,
      history: transactions.map((t) => ({
        id: t.id,
        // Mask buyer email for privacy (e.g. s***@gmail.com)
        buyerMaskedEmail: t.buyerEmail.replace(/(?<=^.).+(?=@)/, '***'),
        orderAmountPaise: t.finalPrice,
        referrerRewardCoins: t.referrerReward,
        createdAt: t.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('[get-referral] Error fetching referral details:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to load referral data.' },
      { status: 500 },
    );
  }
}
