/**
 * Referral & Student Loyalty Coin Management Engine
 * Module: Commercial Referrals (src/lib/referral.ts)
 *
 * Implements the 2-sided student referral program:
 * 1. Referee (Buyer) Benefit: 5% immediate order discount.
 * 2. Referrer Benefit: 5% coin reward credited upon successful payment capture (1 coin = 1 paise equivalent).
 * 3. Coin Redemption: Redeem wallet coins at checkout (max 50 coins / ₹50.00 equivalent per order).
 * 4. Transaction Floor: Strict ₹1.00 (100 paise) floor for all commercial payment gateway orders.
 * 5. Quarterly Referral Tracking: Reset windowing every quarter (90 days).
 * 6. Milestone Bonuses: Tiered coin payouts awarded at volume milestones:
 *    - 5 referrals  -> 50 coins
 *    - 10 referrals -> 110 coins
 *    - 20 referrals -> 250 coins
 */

import { prisma } from '@/lib/db';
import crypto from 'crypto';

/** 5% discount percentage applied to referee purchases. */
export const REFEREE_DISCOUNT_PERCENT = 5;

/** 5% reward percentage awarded to referrer upon payment capture. */
export const REFERRER_REWARD_PERCENT = 5;

/**
 * 1 Coin = 1 Paise equivalent in the database walletBalance.
 * (100 coins = 100 paise = ₹1.00 INR).
 */
export const COIN_VALUE_PAISE = 1;

/** Maximum coin redemption allowed per individual order: ₹50.00 (5,000 paise). */
export const MAX_COIN_REDEMPTION_PAISE = 5000;

/** Absolute minimum transaction floor for any Razorpay charge: ₹1.00 (100 paise). */
export const MINIMUM_TRANSACTION_FLOOR_PAISE = 100;

/** Default referral milestones if none exist in the database table. */
export const DEFAULT_REFERRAL_MILESTONES = [
  { referralsRequired: 5, bonusCoins: 50, description: 'Starter Advocate: 5 Friends Referred' },
  { referralsRequired: 10, bonusCoins: 110, description: 'Campus Ambassador: 10 Friends Referred' },
  { referralsRequired: 20, bonusCoins: 250, description: 'Legendary Mentor: 20 Friends Referred' },
];

/**
 * Generates an uppercase 5-character alphanumeric referral code (e.g. 'XK92R').
 *
 * @returns 5-character string.
 */
export function generateRandomReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing 0/O, 1/I
  let code = '';
  const randomBytes = crypto.randomBytes(5);
  for (let i = 0; i < 5; i++) {
    code += chars[randomBytes[i] % chars.length];
  }
  return code;
}

/**
 * Ensures the given user has a unique 5-character referral code assigned.
 *
 * @param userId - ID of user.
 * @returns The user's active referral code.
 */
export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  });

  if (user?.referralCode) {
    return user.referralCode;
  }

  // Generate unique code with retry collision handling
  let newCode = '';
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 10) {
    attempts++;
    newCode = generateRandomReferralCode();
    const existing = await prisma.user.findUnique({
      where: { referralCode: newCode },
      select: { id: true },
    });
    if (!existing) {
      isUnique = true;
    }
  }

  if (!isUnique) {
    throw new Error('Failed to generate a unique referral code. Please retry.');
  }

  await prisma.user.update({
    where: { id: userId },
    data: { referralCode: newCode },
  });

  return newCode;
}

/**
 * Calculates the referee (buyer) 5% discount amount in integer paise.
 *
 * @param subtotalPaise - Base amount subject to referral discount.
 * @returns 5% discount in integer paise.
 */
export function calculateRefereeDiscount(subtotalPaise: number): number {
  if (subtotalPaise <= 0) return 0;
  return Math.round((subtotalPaise * REFEREE_DISCOUNT_PERCENT) / 100);
}

/**
 * Calculates the referrer 5% coin reward based on the net payment amount.
 * 1 coin = 1 paise, so the coin count equals the reward paise.
 *
 * @param finalPaidPaise - Net amount paid by the buyer in paise.
 * @returns Referrer reward in integer paise / coins.
 */
export function calculateReferrerReward(finalPaidPaise: number): number {
  if (finalPaidPaise <= 0) return 0;
  return Math.round((finalPaidPaise * REFERRER_REWARD_PERCENT) / 100);
}

/**
 * Validates a referral code against self-referral and user existence rules.
 *
 * @param code - 5-character referral code entered at checkout.
 * @param buyerUserId - ID of the purchasing student.
 * @param buyerEmail - Email of the purchasing student.
 */
export async function validateReferralCode(
  code: string,
  buyerUserId?: string,
  buyerEmail?: string,
): Promise<{
  isValid: boolean;
  error?: string;
  referrerUser?: {
    id: string;
    name: string;
    email: string;
    referralCode: string | null;
  };
}> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    return { isValid: false, error: 'Referral code cannot be empty.' };
  }

  const referrer = await prisma.user.findUnique({
    where: { referralCode: normalized },
    select: { id: true, name: true, email: true, referralCode: true, isActive: true },
  });

  if (!referrer || !referrer.isActive) {
    return { isValid: false, error: `Referral code "${normalized}" is not valid.` };
  }

  // Prevent self-referral
  if (buyerUserId && referrer.id === buyerUserId) {
    return { isValid: false, error: 'You cannot use your own referral code.' };
  }

  if (buyerEmail && referrer.email.toLowerCase() === buyerEmail.toLowerCase()) {
    return { isValid: false, error: 'You cannot use your own referral code.' };
  }

  return { isValid: true, referrerUser: referrer };
}

/**
 * Calculates coin redemption deduction for an order.
 * Enforces:
 * 1. User wallet balance limit.
 * 2. Maximum ₹50.00 (5,000 paise / 50 coins) per order.
 * 3. Minimum transaction floor of 100 paise (₹1.00).
 *
 * @param walletBalance - Current user wallet balance in coins (1 coin = 1 paise).
 * @param requestedCoins - Number of coins requested to redeem, or boolean true for maximum eligible.
 * @param currentNetPaise - Current price after prior discounts before coins are applied.
 * @returns Object with coinsRedeemed and coinDiscountPaise.
 */
export function calculateCoinRedemption(
  walletBalance: number,
  requestedCoins: number | boolean | undefined,
  currentNetPaise: number,
): {
  coinsRedeemed: number;
  coinDiscountPaise: number;
  effectiveTotalPaise: number;
} {
  if (!requestedCoins || walletBalance <= 0 || currentNetPaise <= MINIMUM_TRANSACTION_FLOOR_PAISE) {
    return {
      coinsRedeemed: 0,
      coinDiscountPaise: 0,
      effectiveTotalPaise: Math.max(MINIMUM_TRANSACTION_FLOOR_PAISE, currentNetPaise),
    };
  }

  // Maximum discount allowed to leave at least ₹1.00 (100 paise) floor
  const maxAllowedByFloor = Math.max(0, currentNetPaise - MINIMUM_TRANSACTION_FLOOR_PAISE);

  let targetPaiseToDeduct = 0;

  if (typeof requestedCoins === 'boolean' && requestedCoins === true) {
    // Redeem maximum possible: up to ₹50 (5,000 paise)
    targetPaiseToDeduct = Math.min(walletBalance, MAX_COIN_REDEMPTION_PAISE, maxAllowedByFloor);
  } else if (typeof requestedCoins === 'number' && requestedCoins > 0) {
    // User requested specific coin amount.
    // If user passed <= 50, they may mean 50 INR coins (50 * 100 paise) or 50 paise.
    // If wallet has sufficient balance and requestedCoins <= 50, interpret as rupee-level coins up to ₹50.
    let coinPaiseEquivalent = requestedCoins;
    if (requestedCoins <= 50 && walletBalance >= requestedCoins * 100) {
      coinPaiseEquivalent = requestedCoins * 100;
    }

    targetPaiseToDeduct = Math.min(
      walletBalance,
      coinPaiseEquivalent,
      MAX_COIN_REDEMPTION_PAISE,
      maxAllowedByFloor,
    );
  }

  const coinDiscountPaise = Math.max(0, targetPaiseToDeduct);
  // Since 1 coin = 1 paise, coinsRedeemed equals coinDiscountPaise
  const coinsRedeemed = coinDiscountPaise;
  const effectiveTotalPaise = Math.max(
    MINIMUM_TRANSACTION_FLOOR_PAISE,
    currentNetPaise - coinDiscountPaise,
  );

  return {
    coinsRedeemed,
    coinDiscountPaise,
    effectiveTotalPaise,
  };
}

/**
 * Checks if a user has crossed a milestone threshold upon adding a new referral,
 * and returns the bonus coins awarded.
 *
 * @param previousReferralsCount - User's referral count before this transaction.
 * @param newReferralsCount - User's updated referral count after this transaction.
 * @returns Total bonus coins to award for this specific transition.
 */
export async function checkMilestoneBonus(
  previousReferralsCount: number,
  newReferralsCount: number,
): Promise<{ bonusCoins: number; unlockedMilestone?: { referralsRequired: number; bonusCoins: number } }> {
  // Query DB milestones or fallback
  let milestones = await prisma.referralMilestone.findMany({
    orderBy: { referralsRequired: 'asc' },
  });

  if (!milestones || milestones.length === 0) {
    milestones = DEFAULT_REFERRAL_MILESTONES.map((m) => ({
      ...m,
      description: m.description,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }

  let totalBonus = 0;
  let highestUnlocked: { referralsRequired: number; bonusCoins: number } | undefined;

  for (const milestone of milestones) {
    if (
      previousReferralsCount < milestone.referralsRequired &&
      newReferralsCount >= milestone.referralsRequired
    ) {
      totalBonus += milestone.bonusCoins;
      highestUnlocked = {
        referralsRequired: milestone.referralsRequired,
        bonusCoins: milestone.bonusCoins,
      };
    }
  }

  return { bonusCoins: totalBonus, unlockedMilestone: highestUnlocked };
}

/**
 * Helper to inspect and reset quarterly referrals if 90 days have elapsed.
 *
 * @param user - User record with quarterlyReferrals and quarterStartDate.
 * @returns New quarterly count and quarter start date.
 */
export function getUpdatedQuarterlyStats(user: {
  quarterlyReferrals: number;
  quarterStartDate: Date | null;
}): { quarterlyReferrals: number; quarterStartDate: Date; isReset: boolean } {
  const now = new Date();
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;

  if (!user.quarterStartDate || now.getTime() - user.quarterStartDate.getTime() > ninetyDaysMs) {
    return {
      quarterlyReferrals: 0,
      quarterStartDate: now,
      isReset: true,
    };
  }

  return {
    quarterlyReferrals: user.quarterlyReferrals,
    quarterStartDate: user.quarterStartDate,
    isReset: false,
  };
}
