/**
 * Payment Verification & Fulfillment API
 * Module: Commercial Payments (src/app/api/store/verify-payment/route.ts)
 *
 * Implements cryptographic verification of Razorpay payment signatures (HMAC-SHA256)
 * followed by atomic database settlement in a single Prisma transaction:
 * 1. Verifies HMAC-SHA256(orderId + "|" + paymentId, secret) in constant time.
 * 2. Idempotently marks Order status as PAID.
 * 3. Grants or extends active course enrollments (RECORDED or LIVE).
 * 4. Records CouponUsage and increments coupon usage counters.
 * 5. Logs ReferralTransaction, credits referrer wallet balance, updates quarterly referral stats,
 *    and awards milestone bonus coins.
 * 6. Deducts redeemed loyalty coins from the buyer's wallet balance.
 * 7. Records PaymentEvent for complete audit trail.
 * 8. Logs settlement to ActivityLog.
 * 9. Enqueues OutboxEvent for reliable asynchronous delivery of email receipts.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { verifyPaymentSignature } from '@/lib/razorpay';
import {
  calculateReferrerReward,
  checkMilestoneBonus,
  getUpdatedQuarterlyStats,
} from '@/lib/referral';

const VerifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1, 'razorpayOrderId is required'),
  razorpayPaymentId: z.string().min(1, 'razorpayPaymentId is required'),
  razorpaySignature: z.string().min(1, 'razorpaySignature is required'),
  orderId: z.string().optional(),
  referralCode: z.string().optional(),
  coinsRedeemed: z.number().int().min(0).optional(),
});

export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'You must be signed in to verify payment.' },
        { status: 401 },
      );
    }

    // 2. Parse and validate payload
    const body = await request.json().catch(() => ({}));
    const parseResult = VerifyPaymentSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid payment verification payload.', details: parseResult.error.format() },
        { status: 400 },
      );
    }

    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      orderId,
      referralCode,
      coinsRedeemed,
    } = parseResult.data;

    // 3. Cryptographically verify signature
    const isValidSignature = verifyPaymentSignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    // In local development or testing without live Razorpay keys, allow mock signatures
    const isMockBypass =
      process.env.NODE_ENV !== 'production' &&
      (!process.env.RAZORPAY_KEY_SECRET || razorpayOrderId.startsWith('mock_'));

    if (!isValidSignature && !isMockBypass) {
      console.error('[verify-payment] Invalid cryptographic signature for order:', razorpayOrderId);
      return NextResponse.json(
        { error: 'Payment signature verification failed. Untrusted request.' },
        { status: 400 },
      );
    }

    // 4. Find the matching Order in DB
    const existingOrder = await prisma.order.findFirst({
      where: {
        OR: [
          { razorpayOrderId },
          ...(orderId ? [{ id: orderId }] : []),
        ],
      },
      include: {
        items: {
          include: {
            offering: true,
          },
        },
        user: true,
        coupon: true,
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found in LMS records.' },
        { status: 404 },
      );
    }

    // 5. Verify order ownership
    if (existingOrder.userId !== session.userId) {
      return NextResponse.json(
        { error: 'You are not authorized to verify this order.' },
        { status: 403 },
      );
    }

    // 6. Idempotency Check: If already PAID, return success immediately
    if (existingOrder.status === 'PAID') {
      return NextResponse.json({
        success: true,
        message: 'Order has already been verified and fulfilled.',
        orderId: existingOrder.id,
        status: 'PAID',
      });
    }

    // 7. Atomic Prisma Transaction Execution
    const settlementResult = await prisma.$transaction(async (tx) => {
      const now = new Date();

      // Step A: Mark Order as PAID
      const updatedOrder = await tx.order.update({
        where: { id: existingOrder.id },
        data: {
          status: 'PAID',
          razorpayPaymentId,
          razorpayOrderId,
        },
      });

      // Step B: Automatically Grant or Update Course Enrollments
      for (const item of existingOrder.items) {
        const durationDays = item.offering?.durationDays;
        const expiresAt = durationDays
          ? new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000)
          : null;

        await tx.enrollment.upsert({
          where: {
            userId_courseId_accessType: {
              userId: existingOrder.userId,
              courseId: item.courseId,
              accessType: item.accessType,
            },
          },
          create: {
            userId: existingOrder.userId,
            courseId: item.courseId,
            offeringId: item.offeringId,
            accessType: item.accessType,
            status: 'ACTIVE',
            startsAt: now,
            expiresAt,
          },
          update: {
            status: 'ACTIVE',
            offeringId: item.offeringId,
            expiresAt,
          },
        });
      }

      // Step C: Log CouponUsage and increment coupon counter if applicable
      if (existingOrder.couponId) {
        const existingUsage = await tx.couponUsage.findUnique({
          where: { orderId: existingOrder.id },
        });

        if (!existingUsage) {
          await tx.couponUsage.create({
            data: {
              couponId: existingOrder.couponId,
              userId: existingOrder.userId,
              orderId: existingOrder.id,
              usedAt: now,
            },
          });

          await tx.coupon.update({
            where: { id: existingOrder.couponId },
            data: {
              currentUses: { increment: 1 },
            },
          });
        }
      }

      // Step D: Process Referral & Referrer Coins
      const effectiveRefCode = referralCode?.trim().toUpperCase();
      if (effectiveRefCode) {
        const referrer = await tx.user.findUnique({
          where: { referralCode: effectiveRefCode },
        });

        if (referrer && referrer.id !== existingOrder.userId) {
          // Calculate 5% coin reward
          const referrerRewardCoins = calculateReferrerReward(existingOrder.totalPaise);

          // Check quarterly reset
          const quarterlyStats = getUpdatedQuarterlyStats({
            quarterlyReferrals: referrer.quarterlyReferrals,
            quarterStartDate: referrer.quarterStartDate,
          });

          const newLifetime = referrer.lifetimeReferrals + 1;
          const newQuarterly = quarterlyStats.quarterlyReferrals + 1;

          // Check milestone bonus
          const milestoneCheck = await checkMilestoneBonus(
            referrer.lifetimeReferrals,
            newLifetime,
          );

          const totalCoinsToCredit = referrerRewardCoins + milestoneCheck.bonusCoins;

          // Log ReferralTransaction
          await tx.referralTransaction.create({
            data: {
              referrerEmail: referrer.email,
              buyerEmail: existingOrder.user.email,
              referralCode: effectiveRefCode,
              orderId: existingOrder.id,
              originalPrice: existingOrder.subtotalPaise,
              buyerDiscount: existingOrder.discountPaise,
              finalPrice: existingOrder.totalPaise,
              referrerReward: referrerRewardCoins,
              coinsUsed: coinsRedeemed || 0,
              createdAt: now,
            },
          });

          // Update referrer wallet and referral counters
          await tx.user.update({
            where: { id: referrer.id },
            data: {
              walletBalance: { increment: totalCoinsToCredit },
              lifetimeReferrals: newLifetime,
              quarterlyReferrals: newQuarterly,
              quarterStartDate: quarterlyStats.quarterStartDate,
            },
          });
        }
      }

      // Step E: Deduct redeemed coins from buyer wallet
      if (coinsRedeemed && coinsRedeemed > 0) {
        await tx.user.update({
          where: { id: existingOrder.userId },
          data: {
            walletBalance: { decrement: coinsRedeemed },
          },
        });
      }

      // Step F: Record PaymentEvent for idempotency and provider log
      await tx.paymentEvent.upsert({
        where: { providerEventId: razorpayPaymentId },
        create: {
          providerEventId: razorpayPaymentId,
          eventType: 'payment.captured',
          orderId: existingOrder.id,
          receivedAt: now,
          processedAt: now,
        },
        update: {
          processedAt: now,
          orderId: existingOrder.id,
        },
      });

      // Step G: Log ActivityLog entry
      await tx.activityLog.create({
        data: {
          userId: existingOrder.userId,
          action: 'ORDER_PAID',
          entity: 'Order',
          entityId: existingOrder.id,
          details: {
            razorpayOrderId,
            razorpayPaymentId,
            totalPaise: existingOrder.totalPaise,
            itemCount: existingOrder.items.length,
          },
          createdAt: now,
        },
      });

      // Step H: Enqueue OutboxEvent for transactional email receipt
      await tx.outboxEvent.create({
        data: {
          eventType: 'PAYMENT_RECEIPT_EMAIL',
          payload: {
            orderId: existingOrder.id,
            userId: existingOrder.userId,
            email: existingOrder.user.email,
            amountPaise: existingOrder.totalPaise,
            currency: existingOrder.currency,
            items: existingOrder.items.map((i) => ({
              courseTitle: i.courseTitleSnapshot,
              offeringTitle: i.offeringTitleSnapshot,
              accessType: i.accessType,
              unitPricePaise: i.unitPricePaise,
            })),
          },
          status: 'PENDING',
          availableAt: now,
        },
      });

      return updatedOrder;
    });

    return NextResponse.json({
      success: true,
      orderId: settlementResult.id,
      status: 'PAID',
      message: 'Payment verified and enrollments granted successfully.',
    });
  } catch (error: any) {
    console.error('[verify-payment] Error during payment settlement:', error);
    return NextResponse.json(
      { error: error?.message || 'Payment settlement failed. Please contact support.' },
      { status: 500 },
    );
  }
}
